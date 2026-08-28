/**
 * Archivo: modules/symptom-reports/symptom-reports.controller.ts
 * Descripción: Handlers HTTP para los reportes de síntomas leves (RF-010, RF-018).
 */

import type { Request, Response, NextFunction } from 'express';
import * as reportsService from './symptom-reports.service.js';
import type { CreateSymptomReportInput, ReviewSymptomReportInput } from './symptom-reports.schema.js';

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const report = await reportsService.createSymptomReport(
      req.user!.id,
      req.body as CreateSymptomReportInput,
    );
    res.status(201).json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
}

export async function listMine(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const reports = await reportsService.listMyReports(req.user!.id);
    res.status(200).json({ success: true, data: reports });
  } catch (err) {
    next(err);
  }
}

// ¿Qué? Bandeja de reportes pendientes para el staff (RF-018).
export async function listPending(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const reports = await reportsService.listPendingReports();
    res.status(200).json({ success: true, data: reports });
  } catch (err) {
    next(err);
  }
}

export async function review(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const report = await reportsService.reviewReport(
      req.params.id as string,
      req.body as ReviewSymptomReportInput,
    );
    res.status(200).json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
}
