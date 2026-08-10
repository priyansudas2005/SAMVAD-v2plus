// Self-contained unit test suite for frontend API client helper methods
import { api } from './api';

export function testApiClientSuite(): boolean {
  // Test 1: API method definitions
  if (typeof api.getMeetings !== 'function') throw new Error('getMeetings missing');
  if (typeof api.getMeeting !== 'function') throw new Error('getMeeting missing');
  if (typeof api.deleteMeeting !== 'function') throw new Error('deleteMeeting missing');
  if (typeof api.uploadAudio !== 'function') throw new Error('uploadAudio missing');
  if (typeof api.processMeeting !== 'function') throw new Error('processMeeting missing');
  if (typeof api.askQuestion !== 'function') throw new Error('askQuestion missing');
  if (typeof api.getSettings !== 'function') throw new Error('getSettings missing');
  if (typeof api.getAnalytics !== 'function') throw new Error('getAnalytics missing');
  if (typeof api.updateMeetingTitle !== 'function') throw new Error('updateMeetingTitle missing');

  // Test 2: Export URL generation
  const meetingId = 'MEET_12345';
  if (api.getExportUrl(meetingId, 'pdf') !== '/api/v1/meetings/MEET_12345/export/pdf') {
    throw new Error('PDF export URL mismatch');
  }
  if (api.getExportUrl(meetingId, 'docx') !== '/api/v1/meetings/MEET_12345/export/docx') {
    throw new Error('DOCX export URL mismatch');
  }
  if (api.getStatsExportUrl(meetingId, 'csv') !== '/api/v1/meetings/MEET_12345/stats/export/csv') {
    throw new Error('CSV stats export URL mismatch');
  }

  return true;
}
