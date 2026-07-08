import { Meeting, SystemSettings, AnalyticsSummary, QAEntry, MeetingStats } from '../types';

const API_BASE = '/api';

export const api = {
  // Meetings API
  async getMeetings(): Promise<Meeting[]> {
    const res = await fetch(`${API_BASE}/meetings`);
    if (!res.ok) throw new Error('Failed to fetch meetings list');
    return res.json();
  },

  async getMeeting(id: string): Promise<Meeting> {
    const res = await fetch(`${API_BASE}/meetings/${id}`);
    if (!res.ok) throw new Error('Failed to fetch meeting details');
    return res.json();
  },

  async deleteMeeting(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/meetings/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete meeting');
  },

  async uploadAudio(file: File, title?: string): Promise<Meeting> {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);

    const res = await fetch(`${API_BASE}/meetings/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload audio file');
    return res.json();
  },

  async uploadRecording(audioBlob: Blob, title?: string): Promise<Meeting> {
    const formData = new FormData();
    // Convert blob to file
    const file = new File([audioBlob], `recording_${Date.now()}.wav`, { type: 'audio/wav' });
    formData.append('file', file);
    if (title) formData.append('title', title);

    const res = await fetch(`${API_BASE}/meetings/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload audio recording');
    return res.json();
  },

  async processMeeting(id: string, options?: { modelSize?: string; language?: string; vadEnabled?: boolean }): Promise<Meeting> {
    const res = await fetch(`${API_BASE}/meetings/${id}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options || {}),
    });
    if (!res.ok) throw new Error('Failed to process meeting');
    return res.json();
  },

  // Q&A API
  async askQuestion(id: string, question: string): Promise<QAEntry> {
    const res = await fetch(`${API_BASE}/meetings/${id}/qa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    if (!res.ok) throw new Error('Failed to get answer');
    return res.json();
  },

  async submitQAFeedback(meetingId: string, qaId: number, wasHelpful: boolean | null): Promise<QAEntry> {
    const res = await fetch(`${API_BASE}/meetings/${meetingId}/qa/${qaId}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ was_helpful: wasHelpful }),
    });
    if (!res.ok) throw new Error('Failed to submit Q&A feedback');
    return res.json();
  },

  // Settings API
  async getSettings(): Promise<SystemSettings> {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async updateSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to save settings');
    return res.json();
  },

  // Analytics API
  async getAnalytics(): Promise<AnalyticsSummary> {
    const res = await fetch(`${API_BASE}/analytics`);
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },

  // Export URIs
  getExportUrl(id: string, format: string): string {
    return `${API_BASE}/meetings/${id}/export/${format}`;
  },

  async downloadExport(id: string, format: string, filename?: string): Promise<void> {
    const res = await fetch(this.getExportUrl(id, format));
    if (!res.ok) throw new Error(`Failed to export ${format}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Use server-provided filename from Content-Disposition when available
    const disposition = res.headers.get('content-disposition');
    const serverFilename = disposition?.match(/filename=["']?([^"'\n]+)["']?/)?.[1];
    a.download = serverFilename || filename || `${id}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  async updateTranscriptSegment(meetingId: string, segmentId: number, payload: { text: string; speaker_label?: string }): Promise<Meeting> {
    const res = await fetch(`${API_BASE}/meetings/${meetingId}/transcript/${segmentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update segment');
    return res.json();
  },

  async regenerateIntelligence(meetingId: string): Promise<Meeting> {
    const res = await fetch(`${API_BASE}/meetings/${meetingId}/regenerate`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to regenerate intelligence');
    return res.json();
  },

  async getSpeakerAnalytics(meetingId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/meetings/${meetingId}/analytics/speakers`);
    if (!res.ok) throw new Error('Failed to fetch speaker analytics');
    return res.json();
  },

  async getMeetingStats(id: string): Promise<MeetingStats> {
    const res = await fetch(`${API_BASE}/meetings/${id}/stats`);
    if (!res.ok) throw new Error('Failed to fetch meeting stats');
    return res.json();
  },

  getStatsExportUrl(id: string, format: string): string {
    return `${API_BASE}/meetings/${id}/stats/export/${format}`;
  },

  async downloadStatsExport(meetingId: string, format: string): Promise<void> {
    const res = await fetch(`${API_BASE}/meetings/${meetingId}/export/stats/${format}`);
    if (!res.ok) throw new Error(`Failed to export statistics as ${format}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const disposition = res.headers.get('content-disposition');
    const serverFilename = disposition?.match(/filename=["']?([^"'\n]+)["']?/)?.[1];
    a.download = serverFilename || `statistics_${meetingId}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};
