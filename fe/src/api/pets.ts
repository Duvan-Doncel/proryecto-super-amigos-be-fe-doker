/**
 * Archivo: api/pets.ts
 * Descripción: Llamadas HTTP para mascotas (RF-012, RF-013).
 */

import { apiClient } from './axios';
import type { ApiResponse } from '@/types/auth';
import type { CreateMyPetRequest, CreatePetRequest, Pet, UpdatePetRequest } from '@/types/pets';

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

// ¿Qué? El cliente registra su PROPIA mascota — el dueño sale del token (RF-012).
export async function createMyPet(data: CreateMyPetRequest): Promise<Pet> {
  const res = await apiClient.post<ApiResponse<Pet>>('/pets/me', data);
  return res.data.data;
}

// ¿Qué? El cliente edita una mascota PROPIA.
export async function updateMyPet(id: string, data: UpdatePetRequest): Promise<Pet> {
  const res = await apiClient.put<ApiResponse<Pet>>(`/pets/me/${id}`, data);
  return res.data.data;
}

// ¿Qué? El cliente elimina una mascota PROPIA.
export async function deleteMyPet(id: string): Promise<void> {
  await apiClient.delete(`/pets/me/${id}`);
}

// ¿Qué? Sube o reemplaza la foto de una mascota (staff: cualquiera; cliente: solo la suya).
// ¿Para qué? `apiClient` fija 'Content-Type: application/json' por defecto en la instancia —
//   hay que quitarlo explícitamente en ESTA petición para que el navegador ponga el suyo
//   propio (multipart/form-data con el boundary), o el backend nunca recibe el archivo.
export async function uploadPetPhoto(id: string, file: File): Promise<Pet> {
  const formData = new FormData();
  formData.append('photo', file);
  const res = await apiClient.post<ApiResponse<Pet>>(`/pets/${id}/photo`, formData, {
    headers: { 'Content-Type': undefined },
  });
  return res.data.data;
}
