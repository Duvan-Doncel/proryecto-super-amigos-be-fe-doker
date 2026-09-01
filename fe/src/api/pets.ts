/**
 * Archivo: api/pets.ts
 * Descripción: Llamadas HTTP para mascotas (RF-012, RF-013).
 */

import { apiClient } from './axios';
import type { ApiResponse } from '@/types/auth';
import type { CreatePetRequest, Pet, UpdatePetRequest } from '@/types/pets';

// ¿Qué? Mascotas del cliente autenticado — alimenta el selector del semáforo.
export async function listMyPets(): Promise<Pet[]> {
  const res = await apiClient.get<ApiResponse<Pet[]>>('/pets/me');
  return res.data.data;
}

// ¿Qué? Mascotas de un cliente específico — solo staff (RF-013).
export async function listPetsByClient(clientId: string): Promise<Pet[]> {
  const res = await apiClient.get<ApiResponse<Pet[]>>('/pets', { params: { clientId } });
  return res.data.data;
}

// ¿Qué? Registra una mascota a nombre de un cliente — solo staff (RF-012).
export async function createPet(data: CreatePetRequest): Promise<Pet> {
  const res = await apiClient.post<ApiResponse<Pet>>('/pets', data);
  return res.data.data;
}

// ¿Qué? Edita una mascota — solo staff (RF-012). Talla, pelo y condiciones de piel.
export async function updatePet(id: string, data: UpdatePetRequest): Promise<Pet> {
  const res = await apiClient.put<ApiResponse<Pet>>(`/pets/${id}`, data);
  return res.data.data;
}
