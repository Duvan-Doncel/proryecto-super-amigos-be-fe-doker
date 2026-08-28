/**
 * Archivo: pages/staff/StaffSalesReportPage.tsx
 * Descripción: Reporte de ventas por rango de fechas (RF-022, HU-022).
 * ¿Para qué? Combina pedidos completados de la app (RF-016) y ventas de mostrador
 *   (RF-023) en un solo total, sin que el staff tenga que sumarlos aparte.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as salesApi from '@/api/sales';
import type { SalesReport } from '@/types/sales';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { Alert } from '@/components/ui/Alert';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function firstOfMonthIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export function StaffSalesReportPage() {
  const [from, setFrom] = useState(firstOfMonthIso());
  const [to, setTo] = useState(todayIso());
  const [report, setReport] = useState<SalesReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadReport = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      setReport(await salesApi.getSalesReport(from, to));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el reporte.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link to="/staff" className="text-sm text-gray-500 dark:text-slate-400 hover:underline">
        ← Volver
      </Link>

      <h1 className="text-2xl font-comic tracking-wide text-gray-900 dark:text-slate-100 mt-4 mb-6">
        📊 Reporte de Ventas
      </h1>

      <form onSubmit={loadReport} className="flex flex-wrap gap-3 items-end mb-6">
        <InputField id="from" name="from" label="Desde" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <InputField id="to" name="to" label="Hasta" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <Button type="submit" isLoading={isLoading}>Consultar</Button>
      </form>

      {error && (
        <div className="mb-4">
          <Alert type="error" message={error} />
        </div>
      )}

      {report && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="rounded-lg border border-gray-200 dark:border-slate-700 px-4 py-3">
              <p className="text-xs text-gray-500 dark:text-slate-400">Total vendido</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-slate-100">
                ${report.totalRevenue.toLocaleString('es-CO')}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-slate-700 px-4 py-3">
              <p className="text-xs text-gray-500 dark:text-slate-400">Transacciones</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-slate-100">{report.totalOrders}</p>
            </div>
          </div>

          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-3">Por producto</h2>
          {report.byProduct.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-slate-400">No hay ventas en este rango de fechas.</p>
          ) : (
            <ul className="space-y-2">
              {report.byProduct.map((p) => (
                <li
                  key={p.productId}
                  className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-slate-700 px-4 py-3 text-sm"
                >
                  <span className="text-gray-900 dark:text-slate-100">{p.name} — {p.unitsSold} unidad(es)</span>
                  <span className="font-medium text-gray-900 dark:text-slate-100">${p.revenue.toLocaleString('es-CO')}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
