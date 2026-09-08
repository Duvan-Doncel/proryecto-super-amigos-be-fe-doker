/**
 * Archivo: middlewares/validate.middleware.ts
 * Descripción: Middleware genérico de validación de input con zod.
 * ¿Para qué? Centralizar la validación de req.body en un middleware reutilizable,
 *   evitando duplicar lógica de validación en cada controller.
 * ¿Impacto? Sin validación, datos malformados o peligrosos llegan al service layer.
 */

import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { ValidationError } from './error.middleware.js';

// ¿Qué? Factory que retorna un middleware de validación para un schema zod dado.
// ¿Para qué? Usar en rutas: router.post('/register', validate(registerSchema), controller)
// ¿Impacto? Si el body no cumple el schema, retorna 400 antes de llegar al controller.
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const details = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      next(new ValidationError(JSON.stringify(details)));
      return;
    }

    // Reemplazar req.body con los datos validados y transformados por zod
    req.body = result.data;
    next();
  };
}

// ¿Qué? Igual que `validate`, pero sobre req.query — para endpoints de listado con
//   paginación/filtros (ej. GET /products?page=2&category=juguetes).
// ¿Para qué? Sin esto, page/limit llegarían como string sin validar (o directamente
//   ausentes) y cada controller tendría que parsearlos y ponerles límites a mano.
export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const details = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      next(new ValidationError(JSON.stringify(details)));
      return;
    }

    req.validatedQuery = result.data;
    next();
  };
}
