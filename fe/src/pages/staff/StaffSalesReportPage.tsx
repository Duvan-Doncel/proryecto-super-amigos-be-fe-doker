/**
 * Archivo: pages/staff/StaffSalesReportPage.tsx
 * Descripción: Reporte de ventas por rango de fechas (RF-022, HU-022).
 * ¿Para qué? Combina pedidos completados de la app (RF-016) y ventas de mostrador (RF-023)
 *   en un solo total, con el detalle por producto y un gráfico de los que más venden.
 */

import { useState } from 'react';
import { Wallet, Receipt } from 'lucide-react';
import * as salesApi from '@/api/sales';
import type { SalesReport } from '@/types/sales';
import { formatCOP } from '@/types/pricing';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { BarChart } from '@/components/charts/BarChart';
import { useToast } from '@/hooks/useToast';

const todayIso = () => new Date().toISOString().slice(0, 10);
const firstOfMonthIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

export function StaffSalesReportPage() {
  const { showToast } = useToast();
  const [from, setFrom] = useState(firstOfMonthIso());
  const [to, setTo] = useState(todayIso());
  const [report, setReport] = useState<SalesReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadReport = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsLoading(true);
    try {
      setReport(await salesApi.getSalesReport(from, to));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo cargar el reporte.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const byProduct = (report?.byProduct ?? []).slice().sort((a, b) => b.revenue - a.revenue);
  const { pageItems, page, setPage, pageSize, setPageSize, pageCount, total } = usePagination(byProduct, 10);
  const top5 = byProduct.slice(0, 5).map((p) => ({ label: p.name, value: p.revenue }));

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Reporte de ventas"
        description="Ingresos de la app y de mostrador en el rango de fechas que elijas."
      />

      <Card className="mb-6">
        <form onSubmit={loadReport} className="flex flex-wrap items-end gap-3">
          <div className="w-40">
            <InputField id="from" name="from" label="Desde" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="w-40">
            <InputField id="to" name="to" label="Hasta" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button type="submit" isLoading={isLoading}>Consultar</Button>
        </form>
      </Card>

      {report && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Total vendido" value={formatCOP(report.totalRevenue)} icon={<Wallet className="h-4 w-4" />} accent="success" />
            <StatCard label="Transacciones" value={report.totalOrders} icon={<Receipt className="h-4 w-4" />} accent="brand" />
          </div>

          {top5.length > 0 && (
            <Card>
              <CardHeader title="Productos que más venden" description="Por ingresos en el rango consultado." />
              <BarChart title="Productos que más venden" data={top5} formatValue={formatCOP} />
            </Card>
          )}

          <div>
            <h2 className="mb-3 font-display text-lg font-bold text-text">Detalle por producto</h2>
            <DataTable
              head={
                <>
                  <th>Producto</th>
                  <th>Unidades</th>
                  <th className="text-right">Ingresos</th>
                </>
              }
              isEmpty={byProduct.length === 0}
              emptyTitle="No hay ventas en este rango de fechas"
            >
              {pageItems.map((p) => (
                <tr key={p.productId}>
                  <td className="text-text">{p.name}</td>
                  <td className="text-text-muted">{p.unitsSold}</td>
                  <td className="text-right tabular-nums text-text">{formatCOP(p.revenue)}</td>
                </tr>
              ))}
            </DataTable>
            {byProduct.length > 0 && (
              <Pagination
                page={page}
                pageCount={pageCount}
                total={total}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                itemNoun="productos"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
