/**
 * Archivo: modules/pricing/pricing.controller.ts
 * Descripción: Handlers HTTP del tarifario del grooming (RF-014).
 * ¿Para qué? Capa delgada entre el router y pricing.service.
 */

import type { Request, Response, NextFunction } from 'express';
import * as pricingService from './pricing.service.js';
import type {
  UpdateBehaviorRulesInput,
  UpdateServiceModifiersInput,
  UpdateSizeTiersInput,
  UpdateSkinRulesInput,
} from './pricing.schema.js';

// ¿Qué? Configuración completa del tarifario — para la pantalla de admin.
export async function getConfig(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json({ success: true, data: await pricingService.getPricingConfig() });
  } catch (err) {
    next(err);
  }
}

// ¿Qué? Tarifario público de solo lectura — para "Cómo calculamos el precio". Sin auth.
export async function getPublic(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json({ success: true, data: await pricingService.getPublicPricing() });
  } catch (err) {
    next(err);
  }
}

export async function putSizeTiers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await pricingService.updateSizeTiers(req.body as UpdateSizeTiersInput);
    res.status(200).json({ success: true, data: await pricingService.getPricingConfig() });
  } catch (err) {
    next(err);
  }
}

export async function putSkinRules(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await pricingService.updateSkinRules(req.body as UpdateSkinRulesInput);
    res.status(200).json({ success: true, data: await pricingService.getPricingConfig() });
  } catch (err) {
    next(err);
  }
}

export async function putBehaviorRules(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await pricingService.updateBehaviorRules(req.body as UpdateBehaviorRulesInput);
    res.status(200).json({ success: true, data: await pricingService.getPricingConfig() });
  } catch (err) {
    next(err);
  }
}

export async function putServiceModifiers(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await pricingService.updateServiceModifiers(
      req.params.id as string,
      req.body as UpdateServiceModifiersInput,
    );
    res.status(200).json({ success: true, data: await pricingService.getPricingConfig() });
  } catch (err) {
    next(err);
  }
}
