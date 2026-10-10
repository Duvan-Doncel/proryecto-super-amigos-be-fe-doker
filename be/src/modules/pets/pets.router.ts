/**
 * Archivo: modules/pets/pets.router.ts
 * Descripción: Router de Express para el registro y consulta de mascotas (RF-012, RF-013).
 * ¿Para qué? POST /api/v1/pets (solo staff), GET /api/v1/pets/me (solo cliente) y
 *   GET /api/v1/pets (solo staff, con ?clientId=).
 */

import { Router, type IRouter } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { uploadPetPhoto } from '../../middlewares/upload.middleware.js';
import { createMyPetSchema, createPetSchema, updatePetSchema } from './pets.schema.js';
import * as petsController from './pets.controller.js';

const router: IRouter = Router();

// GET /api/v1/pets/me — Mascotas del cliente autenticado (RF-013)
router.get('/me', authenticate, requireRole('client'), petsController.listMyPets);

// GET /api/v1/pets?clientId=... — Mascotas de un cliente específico (RF-013, solo staff)
router.get('/', authenticate, requireRole('staff'), petsController.listPetsForClient);

// POST /api/v1/pets — Registra una mascota a nombre de un cliente (RF-012, solo staff)
router.post('/', authenticate, requireRole('staff'), validate(createPetSchema), petsController.createPet);

// POST /api/v1/pets/me — El cliente registra su PROPIA mascota
router.post('/me', authenticate, requireRole('client'), validate(createMyPetSchema), petsController.createMyPet);

// PUT /api/v1/pets/:id — Edita una mascota: talla, pelo, condiciones de piel (RF-012, solo staff)
router.put('/:id', authenticate, requireRole('staff'), validate(updatePetSchema), petsController.updatePet);

// PUT /api/v1/pets/me/:id — El cliente edita una mascota PROPIA
router.put('/me/:id', authenticate, requireRole('client'), validate(updatePetSchema), petsController.updateMyPet);

// DELETE /api/v1/pets/me/:id — El cliente elimina una mascota PROPIA
router.delete('/me/:id', authenticate, requireRole('client'), petsController.deleteMyPet);

// POST /api/v1/pets/:id/photo — Sube/reemplaza la foto (staff: cualquiera; cliente: solo la suya)
router.post('/:id/photo', authenticate, uploadPetPhoto, petsController.uploadPhoto);

export default router;
