import api from '@/lib/api';
import { Note } from '@/types/note';

export const notesService = {
  getNotes: async (subject?: string, topic?: string): Promise<Note[]> => {
    const params = new URLSearchParams();
    // Sanitize: only add if it's an actual string!
    if (subject && typeof subject === 'string') params.set('subject', subject);
    if (topic && typeof topic === 'string') params.set('topic', topic);
    const qs = params.toString();
    const response = await api.get<Note[]>(`/notes${qs ? `?${qs}` : ''}`);
    return response.data;
  },

  getSubjects: async (): Promise<string[]> => {
    const response = await api.get<string[]>('/notes/subjects');
    return response.data;
  },

  getNote: async (id: number): Promise<Note> => {
    const response = await api.get<Note>(`/notes/${id}`);
    return response.data;
  },

  uploadFile: async (
    file: File,
    subject?: string,
    topic?: string,
  ): Promise<{ id: number; title: string; message: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    if (subject) formData.append('subject', subject);
    if (topic) formData.append('topic', topic);
    const response = await api.post('/upload/file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  uploadUrl: async (
    url: string,
    subject?: string,
    topic?: string,
    title?: string,
  ): Promise<{ id: number; title: string; message: string }> => {
    const response = await api.post('/upload/url', { url, subject, topic, title });
    return response.data;
  },

  uploadText: async (
    title: string,
    content: string,
    subject?: string,
    topic?: string,
  ): Promise<{ id: number; title: string; message: string }> => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    if (subject) formData.append('subject', subject);
    if (topic) formData.append('topic', topic);
    const response = await api.post('/upload/text', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteNote: async (id: number): Promise<void> => {
    await api.delete(`/notes/${id}`);
  },

  updateNote: async (
    id: number,
    payload: { title?: string; subject?: string; topic?: string; content?: string },
  ) => {
    const response = await api.patch(`/notes/${id}`, payload);
    return response.data;
  },

  retryNoteSummary: async (id: number): Promise<void> => {
    await api.post(`/summarize/${id}/retry`);
  },
};
