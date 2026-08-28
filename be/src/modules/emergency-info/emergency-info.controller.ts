/**
 * Archivo: modules/emergency-info/emergency-info.controller.ts
 * Descripción: Handlers HTTP para la información de emergencia (RF-011).
 */

import type { Request, Response, NextFunction } from 'express';
import * as emergencyInfoService from './emergency-info.service.js';
import type { UpdateEmergencyInfoInput } from './emergency-info.schema.js';

export async function get(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const info = await emergencyInfoService.getEmergencyInfo();
    res.status(200).json({ success: true, data: info });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const info = await emergencyInfoService.updateEmergencyInfo(req.body as UpdateEmergencyInfoInput);
    res.status(200).json({ success: true, data: info });
  } catch (err) {
    next(err);
  }
}
