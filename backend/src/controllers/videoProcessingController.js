const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const crypto = require('crypto');
const videoAnalysisService = require('../services/videoAnalysisService');

const UPLOADS_DIR = path.join(__dirname, '../../uploads/videos');
const ANALYSIS_RESULTS_DIR = path.join(__dirname, '../../uploads/analysis');

const analyses = new Map();

async function ensureUploadsDir() {
  await fsp.mkdir(UPLOADS_DIR, { recursive: true });
}

async function ensureAnalysisDir() {
  await fsp.mkdir(ANALYSIS_RESULTS_DIR, { recursive: true });
}

async function ensureDirectories() {
  await Promise.all([ensureUploadsDir(), ensureAnalysisDir()]);
}

function serializeJob(job) {
  if (!job) return null;

  return {
    videoId: job.videoId,
    fileName: job.fileName,
    storedFileName: job.storedFileName,
    videoPath: job.videoPath,
    size: job.size,
    status: job.status,
    progress: job.progress ?? 0,
    analysisLevel: job.analysisLevel ?? null,
    uploadedBy: job.uploadedBy ?? null,
    createdAt: job.createdAt,
    startedAt: job.startedAt ?? null,
    completedAt: job.completedAt ?? null,
    error: job.error ?? null,
    result: job.result ?? null,
  };
}

async function persistJob(job) {
  if (!job?.videoId) return;

  await ensureAnalysisDir();
  const filePath = path.join(ANALYSIS_RESULTS_DIR, `${job.videoId}.json`);
  const serialized = {
    ...serializeJob(job),
    updatedAt: new Date().toISOString(),
  };

  await fsp.writeFile(filePath, JSON.stringify(serialized, null, 2), 'utf8');
}

async function loadPersistedAnalyses() {
  try {
    await ensureAnalysisDir();
    const files = await fsp.readdir(ANALYSIS_RESULTS_DIR);

    await Promise.all(
      files
        .filter((file) => file.endsWith('.json'))
        .map(async (file) => {
          try {
            const filePath = path.join(ANALYSIS_RESULTS_DIR, file);
            const raw = await fsp.readFile(filePath, 'utf8');
            const parsed = JSON.parse(raw);
            if (parsed?.videoId) {
              analyses.set(parsed.videoId, {
                ...parsed,
                progress: parsed.progress ?? (parsed.status === 'completed' ? 100 : 0),
              });
            }
          } catch (error) {
            console.error(`Error al cargar análisis persistido (${file}):`, error);
          }
        })
    );
  } catch (error) {
    console.error('No se pudieron cargar los análisis persistidos:', error);
  }
}

async function getPersistedJob(videoId) {
  try {
    await ensureAnalysisDir();
    const filePath = path.join(ANALYSIS_RESULTS_DIR, `${videoId}.json`);
    const raw = await fsp.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed?.videoId) {
      analyses.set(parsed.videoId, parsed);
      return parsed;
    }
  } catch (error) {
    return null;
  }
  return null;
}

loadPersistedAnalyses();

async function uploadVideo(req, res) {
  try {
    await ensureDirectories();

    if (!req.file) {
      return res.status(400).json({ message: 'No se recibió ningún archivo de video' });
    }

    const tempPath = req.file.path;
    const videoId = crypto.randomUUID();
    const originalExtension = path.extname(req.file.originalname) || '.mp4';
    const storedFileName = `${videoId}${originalExtension.toLowerCase()}`;
    const finalPath = path.join(UPLOADS_DIR, storedFileName);

    await fsp.rename(tempPath, finalPath);

    const job = {
      videoId,
      fileName: req.file.originalname,
      storedFileName,
      videoPath: finalPath,
      size: req.file.size,
      status: 'uploaded',
      progress: 0,
      uploadedBy: req.user?.userId || null,
      createdAt: new Date().toISOString(),
    };

    analyses.set(videoId, job);
    await persistJob(job);

    return res.status(201).json({
      videoId,
      fileName: job.fileName,
      size: job.size,
      status: job.status,
    });
  } catch (error) {
    console.error('Error subiendo video:', error);
    if (req.file?.path) {
      try {
        await fsp.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error eliminando archivo temporal:', unlinkError);
      }
    }
    return res.status(500).json({ message: 'No se pudo guardar el video para análisis' });
  }
}

async function startAnalysis(req, res) {
  try {
    const { videoId, analysisLevel = 2 } = req.body;

    if (!videoId) {
      return res.status(400).json({ message: 'Debe proporcionar el videoId a analizar' });
    }

    if (![1, 2, 3].includes(Number(analysisLevel))) {
      return res.status(400).json({ message: 'Nivel de análisis no soportado' });
    }

    await ensureDirectories();

    let job = analyses.get(videoId);

    if (!job) {
      job = await getPersistedJob(videoId);
    }

    if (!job) {
      return res.status(404).json({ message: 'Video no encontrado. Primero debe subirlo.' });
    }

    try {
      await fsp.access(job.videoPath);
    } catch (fsError) {
      return res.status(410).json({
        message: 'El archivo de video ya no está disponible. Vuelva a subirlo para iniciar un nuevo análisis.',
      });
    }

    if (job.status === 'processing') {
      return res.status(409).json({ message: 'El análisis ya está en progreso para este video' });
    }

    const updatedJob = {
      ...job,
      status: 'processing',
      progress: 0,
      analysisLevel: Number(analysisLevel),
      startedAt: new Date().toISOString(),
      startedBy: req.user?.userId || job.startedBy || null,
      error: null,
    };

    analyses.set(videoId, updatedJob);
    await persistJob(updatedJob);

    setImmediate(() => {
      videoAnalysisService
        .processVideoAnalysis(job.videoPath, videoId, (progress) => {
          const current = analyses.get(videoId);
          if (!current || current.status !== 'processing') {
            return;
          }

          const normalizedProgress = Math.max(0, Math.min(100, Math.round(progress)));
          if (normalizedProgress === current.progress) {
            return;
          }

          analyses.set(videoId, {
            ...current,
            progress: normalizedProgress,
          });
        })
        .then((result) => {
          const current = analyses.get(videoId) || updatedJob;
          const completedJob = {
            ...current,
            status: 'completed',
            progress: 100,
            result,
            completedAt: new Date().toISOString(),
          };

          analyses.set(videoId, completedJob);
          persistJob(completedJob).catch((error) => {
            console.error('Error al persistir análisis completado:', error);
          });
        })
        .catch((error) => {
          console.error('Error durante el análisis de video:', error);
          const current = analyses.get(videoId) || updatedJob;
          const failedJob = {
            ...current,
            status: 'failed',
            error: error.message || 'Error desconocido durante el análisis',
            completedAt: new Date().toISOString(),
          };

          analyses.set(videoId, failedJob);
          persistJob(failedJob).catch((persistError) => {
            console.error('Error al persistir análisis fallido:', persistError);
          });
        });
    });

    return res.status(202).json({
      videoId,
      status: 'processing',
      message: 'Análisis iniciado correctamente',
    });
  } catch (error) {
    console.error('Error iniciando análisis:', error);
    return res.status(500).json({ message: 'No se pudo iniciar el análisis del video' });
  }
}

async function getAnalysis(req, res) {
  const { videoId } = req.params;

  if (!videoId) {
    return res.status(400).json({ message: 'Debe proporcionar un videoId' });
  }

  let job = analyses.get(videoId);

  if (!job) {
    job = await getPersistedJob(videoId);
  }

  if (!job) {
    return res.status(404).json({ message: 'No existe un análisis para este video' });
  }

  return res.json({
    videoId,
    status: job.status,
    progress: job.progress ?? 0,
    fileName: job.fileName,
    analysisLevel: job.analysisLevel || null,
    createdAt: job.createdAt,
    startedAt: job.startedAt || null,
    completedAt: job.completedAt || null,
    result: job.result || null,
    error: job.error || null,
  });
}

async function listAnalyses(req, res) {
  try {
    await loadPersistedAnalyses();

    const items = Array.from(analyses.values()).map((job) => ({
      videoId: job.videoId,
      fileName: job.fileName,
      status: job.status,
      progress: job.progress ?? 0,
      analysisLevel: job.analysisLevel || null,
      createdAt: job.createdAt,
      startedAt: job.startedAt || null,
      completedAt: job.completedAt || null,
      error: job.error || null,
    }));

    items.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return res.json(items);
  } catch (error) {
    console.error('Error listando análisis de video:', error);
    return res.status(500).json({ message: 'No se pudieron obtener los análisis de video' });
  }
}

module.exports = {
  uploadVideo,
  startAnalysis,
  getAnalysis,
  listAnalyses,
};
