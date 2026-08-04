import api from '@/lib/api';
import { SearchResult } from '@/types/note';

export const searchService = {
  semanticSearch: async (query: string, topK: number = 5): Promise<SearchResult[]> => {
    const response = await api.get<SearchResult[]>('/search/semantic', {
      params: { q: query, top_k: topK }
    });
    return response.data;
  },

  hybridSearch: async (query: string, topK: number = 5): Promise<SearchResult[]> => {
    const response = await api.get<SearchResult[]>('/search/hybrid', {
      params: { q: query, top_k: topK }
    });
    return response.data;
  },
};
