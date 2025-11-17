/**
 * Tipos para modelos de deteccion
 */

export type DetectionModelType = 'face-api' | 'mediapipe';

export type ProcessingLocation = 'client' | 'server';

export interface DetectionModel {
  id: number;
  model_name: DetectionModelType;
  is_enabled: boolean;
  display_name: string;
  description: string;
  processing_location: ProcessingLocation;
  landmarks_count: number;
  avg_latency_ms: number;
  requires_gpu: boolean;
  max_concurrent_users: number | null;
  cost_per_hour: number;
  created_at: string;
  updated_at: string;
}

export interface DetectionSession {
  id: number;
  driver_id: number;
  vehicle_id: number | null;
  user_id: number;
  detection_model: DetectionModelType;
  started_at: string;
  ended_at: string | null;
  total_frames_processed: number;
  total_events: number;
  avg_confidence: number | null;
  avg_latency_ms: number | null;
  session_notes: string | null;
}

export interface ModelStatistics {
  detection_model: DetectionModelType;
  total_sessions: number;
  total_frames: number;
  total_events: number;
  avg_confidence: number;
  avg_latency: number;
  avg_duration_minutes: number;
}

export interface DetectionPreference {
  preferred_model: DetectionModelType;
}

export interface CreateSessionRequest {
  driver_id: number;
  vehicle_id?: number | null;
  detection_model: DetectionModelType;
}

export interface EndSessionRequest {
  total_frames?: number;
  total_events?: number;
  avg_confidence?: number;
  avg_latency?: number;
  notes?: string;
}

export interface DetectionResult {
  success: boolean;
  event_type: string;
  severity: string;
  confidence: number;
  ear: number;
  mar: number;
  head_angle: number;
  timestamp: string;
}

