import { Meeting, SystemSettings, AnalyticsSummary, QAEntry, MeetingStats } from '../types';

const API_BASE = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, options);
  if (!res.ok) {
    throw new Error(`API Request failed for ${endpoint}: ${res.statusText}`);
  }
  return res.json();
}

async function downloadBlob(url: string, defaultFilename: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed for ${url}`);
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  const disposition = res.headers.get('content-disposition');
  const serverFilename = disposition?.match(/filename=["']?([^"'\n]+)["']?/)?.[1];
  a.download = serverFilename || defaultFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}

export const api = {
  // Meetings API
  getMeetings(): Promise<Meeting[]> {
    return request<Meeting[]>('/meetings');
  },

  getMeeting(id: string): Promise<Meeting> {
    return request<Meeting>(`/meetings/${id}`);
  },

  async deleteMeeting(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/meetings/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete meeting');
  },

  updateMeetingTitle(id: string, title: string): Promise<Meeting> {
    return request<Meeting>(`/meetings/${id}/title`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
  },

  uploadAudio(file: File, title?: string): Promise<Meeting> {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);

    return request<Meeting>('/meetings/upload', {
      method: 'POST',
      body: formData,
    });
  },

  uploadRecording(audioBlob: Blob, title?: string): Promise<Meeting> {
    const file = new File([audioBlob], `recording_${Date.now()}.wav`, { type: 'audio/wav' });
    return this.uploadAudio(file, title);
  },

  processMeeting(id: string, options?: { modelSize?: string; language?: string; vadEnabled?: boolean }): Promise<Meeting> {
    return request<Meeting>(`/meetings/${id}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options || {}),
    });
  },

  // Q&A API
  askQuestion(id: string, question: string): Promise<QAEntry> {
    return request<QAEntry>(`/meetings/${id}/qa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
  },

  submitQAFeedback(meetingId: string, qaId: number, wasHelpful: boolean | null): Promise<QAEntry> {
    return request<QAEntry>(`/meetings/${meetingId}/qa/${qaId}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ was_helpful: wasHelpful }),
    });
  },

  // Settings API
  getSettings(): Promise<SystemSettings> {
    return request<SystemSettings>('/settings');
  },

  updateSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    return request<SystemSettings>('/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
  },

  // Analytics API
  getAnalytics(): Promise<AnalyticsSummary> {
    return request<AnalyticsSummary>('/analytics');
  },

  // Export URIs & Downloads
  getExportUrl(id: string, format: string): string {
    return `${API_BASE}/meetings/${id}/export/${format}`;
  },

  downloadExport(id: string, format: string, filename?: string): Promise<void> {
    return downloadBlob(this.getExportUrl(id, format), filename || `${id}.${format}`);
  },

  updateTranscriptSegment(meetingId: string, segmentId: number, payload: { text: string; speaker_label?: string }): Promise<Meeting> {
    return request<Meeting>(`/meetings/${meetingId}/transcript/${segmentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  regenerateIntelligence(meetingId: string): Promise<Meeting> {
    return request<Meeting>(`/meetings/${meetingId}/regenerate`, {
      method: 'POST',
    });
  },

  getSpeakerAnalytics(meetingId: string): Promise<any> {
    return request<any>(`/meetings/${meetingId}/analytics/speakers`);
  },

  getMeetingStats(id: string): Promise<MeetingStats> {
    return request<MeetingStats>(`/meetings/${id}/stats`);
  },

  getStatsExportUrl(id: string, format: string): string {
    return `${API_BASE}/meetings/${id}/stats/export/${format}`;
  },

  downloadStatsExport(meetingId: string, format: string): Promise<void> {
    return downloadBlob(`${API_BASE}/meetings/${meetingId}/export/stats/${format}`, `statistics_${meetingId}.${format}`);
  }
};
