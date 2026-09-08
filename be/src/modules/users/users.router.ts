/**
 * Archivo: modules/users/users.router.ts
 * Descripción: Router de Express para el perfil de usuario (RF-007).
 * ¿Para qué? Exponer GET /me protegido con autenticación JWT.
 * ¿Impacto? Sin el middleware authenticate cualquiera podría acceder a perfiles.
 */

import { Router, type IRouter } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { updateProfileSchema } from './users.schema.js';
import * as usersController from './users.controller.js';

const router: IRouter = Router();

// GET /api/v1/users/me — Obtener perfil del usuario autenticado
// authenticate es obligatorio aquí — userId viene del token
router.get('/me', authenticate, usersController.getMe);

// PUT /api/v1/users/me — Editar el propio perfil (nombre, apellido, teléfono) (RF-007)
router.put('/me', authenticate, validate(updateProfileSchema), usersController.updateMe);

export default router;
