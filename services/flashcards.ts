import api from '@/lib/api';
import { Flashcard } from '@/types/note';

export interface FlashcardCreate {
  note_id: number;
  front: string;
  back: string;
}

export interface FlashcardUpdate {
  front?: string;
  back?: string;
}

export interface ReviewResponse {
  message: string;
  flashcard: Flashcard;
  next_review_date: string;
}

export const flashcardsService = {
  createFlashcard: async (data: FlashcardCreate): Promise<Flashcard> => {
    const response = await api.post<Flashcard>('/flashcards/', data);
    return response.data;
  },

  getFlashcards: async (noteId?: number, dueOnly: boolean = false): Promise<Flashcard[]> => {
    const params: any = {};
    if (noteId) params.note_id = noteId;
    if (dueOnly) params.due_only = true;
    const response = await api.get<Flashcard[]>('/flashcards/', { params });
    return response.data;
  },

  getDueFlashcards: async (limit: number = 20): Promise<Flashcard[]> => {
    const response = await api.get<Flashcard[]>('/flashcards/due', { params: { limit } });
    return response.data;
  },

  getFlashcard: async (id: number): Promise<Flashcard> => {
    const response = await api.get<Flashcard>(`/flashcards/${id}`);
    return response.data;
  },

  updateFlashcard: async (id: number, data: FlashcardUpdate): Promise<Flashcard> => {
    const response = await api.put<Flashcard>(`/flashcards/${id}`, data);
    return response.data;
  },

  deleteFlashcard: async (id: number): Promise<void> => {
    await api.delete(`/flashcards/${id}`);
  },

  reviewFlashcard: async (id: number, quality: number): Promise<ReviewResponse> => {
    const response = await api.post<ReviewResponse>(`/flashcards/${id}/review`, null, {
      params: { quality }
    });
    return response.data;
  },

  generateFlashcards: async (noteId: number, count: number = 5): Promise<{ message: string; flashcards: Flashcard[] }> => {
    const response = await api.post(`/flashcards/generate/${noteId}`, null, {
      params: { count }
    });
    return response.data;
  },
};
