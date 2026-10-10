/**
 * Archivo: middlewares/upload.middleware.ts
 * Descripción: Middleware multer para subir la foto de una mascota a disco local.
 * ¿Para qué? No hay infraestructura de almacenamiento en la nube en este proyecto — las
 *   fotos se guardan en `be/uploads/pets/` y se sirven como estáticos desde `app.ts`
 *   (`/uploads/...`). El nombre de archivo nunca usa el original del cliente, evitando
 *   path traversal o colisiones.
 * ¿Impacto? El volumen `./be/uploads:/app/uploads` en docker-compose.yml hace que las
 *   fotos sobrevivan a un rebuild del contenedor.
 */

import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import type { RequestHandler } from 'express';
import { ValidationError } from './error.middleware.js';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'pets');

// ¿Qué? multer no crea el directorio destino por sí solo — falla al primer archivo si no existe.
mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = ALLOWED_MIME_TYPES[file.mimetype] ?? path.extname(file.originalname);
    cb(null, `${randomUUID()}${ext}`);
  },
});

export const uploadPetPhoto: RequestHandler = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES[file.mimetype]) {
      cb(new ValidationError('La foto debe ser JPG, PNG o WEBP.'));
      return;
    }
    cb(null, true);
  },
}).single('photo');
