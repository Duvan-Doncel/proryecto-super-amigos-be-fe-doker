/**
 * Archivo: modules/products/products.controller.ts
 * Descripción: Handlers HTTP para el catálogo de productos (RF-015).
 */

import type { Request, Response, NextFunction } from 'express';
import * as productsService from './products.service.js';
import type { CreateProductInput, UpdateProductInput, ListProductsQuery } from './products.schema.js';

// ¿Qué? Catálogo público — siempre solo productos activos, paginado y filtrable por
//   categoría/búsqueda (RN-154). La tienda del cliente usa esta misma ruta.
export async function listPublic(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.validatedQuery as ListProductsQuery;
    const { data, ...meta } = await productsService.listProducts(true, query);
    res.status(200).json({ success: true, data, meta });
  } catch (err) {
    next(err);
  }
}

// ¿Qué? Catálogo completo para el staff — incluye inactivos si se pide `?active=false`.
export async function listForStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const activeOnly = req.query.active !== 'false';
    const query = req.validatedQuery as ListProductsQuery;
    const { data, ...meta } = await productsService.listProducts(activeOnly, query);
    res.status(200).json({ success: true, data, meta });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await productsService.createProduct(req.user!.id, req.body as CreateProductInput);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await productsService.updateProduct(
      req.user!.id,
      req.params.id as string,
      req.body as UpdateProductInput,
    );
    res.status(200).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await productsService.deleteProduct(req.params.id as string);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
