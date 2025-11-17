const path = require('path');
const canvas = require('canvas');
const { Canvas, Image, ImageData, createCanvas, loadImage } = canvas;
const faceapi = require('@vladmandic/face-api');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');

faceapi.env.monkeyPatch({ Canvas, Image, ImageData });
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

class VideoAnalysisService {
  constructor() {
    this.modelsLoaded = false;
    this.modelPath = path.join(__dirname, '../../public/models');
  }

  async loadModels() {
    if (this.modelsLoaded) return;

    try {
      await faceapi.nets.tinyFaceDetector.loadFromDisk(this.modelPath);
      await faceapi.nets.faceLandmark68Net.loadFromDisk(this.modelPath);
      this.modelsLoaded = true;
      console.log('✅ Modelos de Face-API cargados correctamente');
    } catch (error) {
      console.error('❌ Error cargando modelos:', error);
      throw new Error('No se pudieron cargar los modelos de IA');
    }
  }

  calculateEAR(eye) {
    const A = this.euclideanDistance(eye[1], eye[5]);
    const B = this.euclideanDistance(eye[2], eye[4]);
    const C = this.euclideanDistance(eye[0], eye[3]);
    return (A + B) / (2.0 * C);
  }

  calculateMAR(mouth) {
    const A = this.euclideanDistance(mouth[2], mouth[10]);
    const B = this.euclideanDistance(mouth[4], mouth[8]);
    const C = this.euclideanDistance(mouth[0], mouth[6]);
    return (A + B) / (2.0 * C);
  }

  euclideanDistance(point1, point2) {
    return Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
    );
  }

  parseFrameRate(frameRate) {
    if (!frameRate) {
      return null;
    }

    if (typeof frameRate === 'number') {
      return Number.isFinite(frameRate) && frameRate > 0 ? frameRate : null;
    }

    const stringValue = String(frameRate);

    if (stringValue.includes('/')) {
      const parts = stringValue.split('/');
      const numerator = Number(parts[0]);
      const denominator = Number(parts[1]);

      if (denominator !== 0 && Number.isFinite(numerator) && Number.isFinite(denominator)) {
        const value = numerator / denominator;
        return value > 0 ? value : null;
      }
    }

    const numericValue = Number(stringValue);
    return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : null;
  }

  resolveFrameRate(stream) {
    if (!stream) {
      return 25;
    }

    const candidates = [stream.avg_frame_rate, stream.r_frame_rate, stream.frame_rate];

    for (const candidate of candidates) {
      const parsed = this.parseFrameRate(candidate);
      if (parsed) {
        return parsed;
      }
    }

    if (stream.time_base) {
      const parsedTimeBase = this.parseFrameRate(stream.time_base);
      if (parsedTimeBase) {
        const value = 1 / parsedTimeBase;
        if (Number.isFinite(value) && value > 0) {
          return value;
        }
      }
    }

    return 25;
  }

  getDrowsinessLevel(ear, mar, eyesClosed, yawning) {
    if (eyesClosed && yawning) return 4; // Critical
    if (eyesClosed || ear < 0.20) return 3; // High
    if (yawning || mar > 0.6) return 2; // Medium
    if (ear < 0.25 || mar > 0.5) return 1; // Low
    return 0; // None
  }

  async analyzeFrame(frameBuffer, frameNumber, timestamp) {
    try {
      const img = await loadImage(frameBuffer);
      const canvas = createCanvas(img.width, img.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const detections = await faceapi
        .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      if (!detections) {
        return null;
      }

      const landmarks = detections.landmarks;
      
      // Calcular EAR (Eye Aspect Ratio)
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      const leftEAR = this.calculateEAR(leftEye);
      const rightEAR = this.calculateEAR(rightEye);
      const avgEAR = (leftEAR + rightEAR) / 2.0;

      // Calcular MAR (Mouth Aspect Ratio)
      const mouth = landmarks.getMouth();
      const mar = this.calculateMAR(mouth);

      // Detectar estados
      const EYE_AR_THRESH = 0.30;
      const MOUTH_AR_THRESH = 0.6;
      const eyesClosed = avgEAR < EYE_AR_THRESH;
      const yawning = mar > MOUTH_AR_THRESH;

      // Calcular nivel de somnolencia
      const drowsinessLevel = this.getDrowsinessLevel(avgEAR, mar, eyesClosed, yawning);

      return {
        frameNumber,
        timestamp,
        ear: {
          left: leftEAR,
          right: rightEAR,
          average: avgEAR,
        },
        mar: {
          ratio: mar,
        },
        eyesClosed,
        yawning,
        drowsinessLevel,
        confidence: detections.detection.score,
      };
    } catch (error) {
      console.error(`Error analizando frame ${frameNumber}:`, error);
      return null;
    }
  }

  async processVideoAnalysis(videoPath, videoId, progressCallback) {
    await this.loadModels();

    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (probeError, metadata) => {
        if (probeError) {
          console.error('Error leyendo metadata de video:', probeError);
          return reject(probeError);
        }

        try {
          const videoStream = metadata.streams?.find((stream) => stream.codec_type === 'video') || metadata.streams?.[0];
          const duration = Number(metadata.format?.duration) || 0;
          const fps = this.resolveFrameRate(videoStream);
          const frameStep = Math.max(1, Math.round(fps / 5)); // ~5 fps para análisis detallado
          const samplingFps = fps / frameStep;
          const totalFrames = Math.max(1, Math.floor(duration * fps));
          const expectedSamples = Math.max(1, Math.ceil(totalFrames / frameStep));
          const sampleDuration = samplingFps > 0 ? 1 / samplingFps : 0;

          const events = [];
          const timeline = [];
          let processedSamples = 0;
          let validSamples = 0;
          let totalEAR = 0;
          let totalMAR = 0;
          let totalEyesClosedDuration = 0;
          let yawningEventsCount = 0;
          let currentEvent = null;

          const finalizeCurrentEvent = () => {
            if (!currentEvent) {
              return;
            }
            const finalizedEvent = {
              ...currentEvent,
              duration: Number(currentEvent.duration.toFixed(2)),
            };
            events.push(finalizedEvent);
            currentEvent = null;
          };

          ffmpeg(videoPath)
            .outputOptions([
              "-vf",
              `select='not(mod(n\\,${frameStep}))'`,
              '-vsync',
              'vfr',
            ])
            .format('image2pipe')
            .on('error', (error) => {
              console.error('Error en ffmpeg:', error);
              reject(error);
            })
            .on('end', () => {
              finalizeCurrentEvent();

              const averageEAR = validSamples > 0 ? totalEAR / validSamples : 0;
              const averageMAR = validSamples > 0 ? totalMAR / validSamples : 0;
              const eyesClosedDuration = Number(totalEyesClosedDuration.toFixed(2));
              const yawningFrequency = duration > 0
                ? Number(((yawningEventsCount / duration) * 3600).toFixed(2))
                : 0;

              const eyeScore = Math.min(1, Math.max(0, (0.3 - averageEAR) / 0.3));
              const mouthScore = Math.min(1, Math.max(0, averageMAR / 0.8));
              const closureScore = duration > 0 ? Math.min(1, totalEyesClosedDuration / duration) : 0;

              const rawScore = (eyeScore * 0.4 + mouthScore * 0.2 + closureScore * 0.4) * 100;
              const drowsinessScore = Math.min(100, Math.round(rawScore));

              let riskLevel = 'low';
              if (drowsinessScore >= 75) riskLevel = 'critical';
              else if (drowsinessScore >= 50) riskLevel = 'high';
              else if (drowsinessScore >= 25) riskLevel = 'medium';

              const result = {
                id: videoId,
                duration,
                totalFrames,
                processedFrames: validSamples,
                events,
                timeline,
                metrics: {
                  averageEAR,
                  averageMAR,
                  totalEyesClosedEvents: events.filter((event) => event.type === 'eyes_closed').length,
                  totalYawningEvents: events.filter((event) => event.type === 'yawning').length,
                  criticalMoments: events.filter((event) => event.severity === 'critical').length,
                  drowsinessScore,
                  riskLevel,
                  eyesClosedDuration,
                  yawningFrequency,
                },
                status: 'completed',
                completedAt: new Date().toISOString(),
              };

              if (progressCallback) {
                progressCallback(100);
              }

              resolve(result);
            })
            .pipe()
            .on('data', async (chunk) => {
              try {
                const timestamp = samplingFps > 0 ? processedSamples / samplingFps : 0;
                const frameNumber = Math.min(totalFrames, Math.round(processedSamples * frameStep));

                const analysis = await this.analyzeFrame(chunk, frameNumber, timestamp);

                if (analysis) {
                  validSamples += 1;
                  totalEAR += analysis.ear.average;
                  totalMAR += analysis.mar.ratio;

                  timeline.push({
                    time: Number(timestamp.toFixed(2)),
                    ear: Number(analysis.ear.average.toFixed(4)),
                    mar: Number(analysis.mar.ratio.toFixed(4)),
                    drowsinessLevel: analysis.drowsinessLevel,
                  });

                  if (analysis.eyesClosed) {
                    totalEyesClosedDuration += sampleDuration;
                    if (!currentEvent || currentEvent.type !== 'eyes_closed') {
                      finalizeCurrentEvent();
                      currentEvent = {
                        timestamp: Number(timestamp.toFixed(2)),
                        type: 'eyes_closed',
                        duration: sampleDuration,
                        severity: analysis.drowsinessLevel >= 3 ? 'critical' : analysis.drowsinessLevel >= 2 ? 'high' : 'medium',
                        ear: Number(analysis.ear.average.toFixed(4)),
                        frameNumber,
                      };
                    } else {
                      currentEvent.duration += sampleDuration;
                    }
                  } else if (analysis.yawning) {
                    if (!currentEvent || currentEvent.type !== 'yawning') {
                      finalizeCurrentEvent();
                      yawningEventsCount += 1;
                      currentEvent = {
                        timestamp: Number(timestamp.toFixed(2)),
                        type: 'yawning',
                        duration: sampleDuration,
                        severity: analysis.drowsinessLevel >= 3 ? 'high' : analysis.drowsinessLevel >= 2 ? 'medium' : 'low',
                        mar: Number(analysis.mar.ratio.toFixed(4)),
                        frameNumber,
                      };
                    } else {
                      currentEvent.duration += sampleDuration;
                    }
                  } else {
                    finalizeCurrentEvent();
                  }
                }

                processedSamples += 1;
                const progress = Math.round((processedSamples / expectedSamples) * 100);
                if (progressCallback) {
                  progressCallback(Math.min(progress, 99));
                }
              } catch (error) {
                console.error('Error procesando frame:', error);
              }
            });
        } catch (processingError) {
          console.error('Error preparando análisis de video:', processingError);
          reject(processingError);
        }
      });
    });
  }
}

module.exports = new VideoAnalysisService();

