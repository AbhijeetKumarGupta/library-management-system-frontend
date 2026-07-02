import { apiRequest } from './client'
import type { Card, CardRequestDto } from '../types'

export const cardsApi = {
    getAll: () => apiRequest<Card[]>('/card'),
    getUnused: () => apiRequest<Card[]>('/card/unused'),
  getById: (id: number) => apiRequest<Card>(`/card/${id}`),
  create: (data: CardRequestDto) =>
    apiRequest<string>('/card/save', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: CardRequestDto) =>
    apiRequest<string>(`/card/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  remove: (id: number) =>
    apiRequest<string>(`/card/delete/${id}`, { method: 'DELETE' }),
}
