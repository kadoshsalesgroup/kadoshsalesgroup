import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Venta, SaleStage, Role } from '../../types';
import { formatCurrencyMXN } from '../../lib/utils';

// Define pending stages for easier reference
const PENDING_STAGES = [SaleStage.Apartado, SaleStage.DS, SaleStage.Enganche];

interface SummaryData {
    period: string;
    totalAmount: number; // Contracted amount
    pendingAmount: number; // New: Pending amount
    dealCount: number;
}

const SalesSummaryDashboard = () => {
    const { ventas, asesores, role, currentUser } = useAppContext();

    // State for filters
    const [periodType, setPeriodType] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
    const [selectedAsesor, setSelectedAsesor] = useState('');
    const [dateRange, setDateRange] = useState({
        start: `${new Date().getFullYear()}-01-01`,
        end: `${new Date().getFullYear()}-12-31`,
    });

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDateRange(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    // 1. Filter sales based on UI controls, using fechaInicioProceso for the date range
    const salesInPeriod = useMemo(() => {
        const startDate = dateRange.start ? new Date(dateRange.start + 'T00:00:00') : null;
        const endDate = dateRange.end ? new Date(dateRange.end + 'T23:59:59') : null;

        return ventas.filter(venta => {
            const saleDate = new Date(venta.fechaInicioProceso + 'T00:00:00');

            if (startDate && saleDate < startDate) return false;
            if (endDate && saleDate > endDate) return false;
            
            if (role === Role.Lider) {
                if (selectedAsesor && !(venta.asesorPrincipalId === selectedAsesor || venta.asesorSecundarioId === selectedAsesor)) {
                    return false;
                }
            } else if (currentUser) {
                 if (venta.asesorPrincipalId !== currentUser.id && venta.asesorSecundarioId !== currentUser.id) {
                    return false;
                }
            }

            return true;
        });
    }, [ventas, dateRange, selectedAsesor, role, currentUser]);

    // 2. Aggregate filtered data into periods, calculating both contracted and pending amounts
    const summaryData = useMemo<SummaryData[]>(() => {
        const aggregation: { [key: string]: { totalAmount: number; pendingAmount: number; dealCount: number } } = {};

        salesInPeriod.forEach(venta => {
            const saleDate = new Date(venta.fechaInicioProceso + 'T00:00:00');
            const year = saleDate.getFullYear();
            const month = saleDate.getMonth(); // 0-11
            
            let key = '';

            switch (periodType) {
                case 'quarterly':
                    const quarter = Math.floor(month / 3) + 1;
                    key = `${year}-Q${quarter}`;
                    break;
                case 'yearly':
                    key = `${year}`;
                    break;
                case 'monthly':
                default:
                    key = `${year}-${String(month + 1).padStart(2, '0')}`;
                    break;
            }

            if (!aggregation[key]) {
                aggregation[key] = { totalAmount: 0, pendingAmount: 0, dealCount: 0 };
            }

            if (venta.etapaProceso === SaleStage.Contratado) {
                aggregation[key].totalAmount += venta.monto;
                aggregation[key].dealCount += 1;
            } else if (PENDING_STAGES.includes(venta.etapaProceso)) {
                aggregation[key].pendingAmount += venta.monto;
            }
        });

        return Object.entries(aggregation)
            .map(([key, data]) => ({
                period: key,
                totalAmount: data.totalAmount,
                pendingAmount: data.pendingAmount,
                dealCount: data.dealCount,
            }))
            .sort((a, b) => a.period.localeCompare(b.period));
    }, [salesInPeriod, periodType]);
    
    const getPeriodLabel = (periodKey: string): string => {
        if (periodType === 'yearly') return periodKey;
        if (periodType === 'quarterly') return periodKey.replace('-', ' ');
        
        const [year, month] = periodKey.split('-');
        const date = new Date(Number(year), Number(month) - 1, 1);
        return date.toLocaleString('es-MX', { month: 'long', year: 'numeric' });
    };

    // 3. Calculate footer totals from the aggregated data
    const footerTotals = useMemo(() => {
        const totalAmount = summaryData.reduce((sum, row) => sum + row.totalAmount, 0);
        const totalPending = summaryData.reduce((sum, row) => sum + row.pendingAmount, 0);

        const uniqueAdvisors = new Set<string>();
        salesInPeriod.forEach(v => {
            uniqueAdvisors.add(v.asesorPrincipalId);
            if (v.asesorSecundarioId) {
                uniqueAdvisors.add(v.asesorSecundarioId);
            }
        });
        
        const advisorCount = uniqueAdvisors.size > 0 ? uniqueAdvisors.size : 1;
        const averagePerAdvisor = totalAmount / advisorCount;

        return { totalAmount, totalPending, averagePerAdvisor };
    }, [summaryData, salesInPeriod]);

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-maderas-blue mb-4">Resumen de Ventas</h1>
                
                {/* Filters Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Periodo</label>
                        <select value={periodType} onChange={e => setPeriodType(e.target.value as any)} className="w-full p-2 border rounded-md bg-white">
                            <option value="monthly">Mensual</option>
                            <option value="quarterly">Trimestral</option>
                            <option value="yearly">Anual</option>
                        </select>
                    </div>
                    
                    {role === Role.Lider && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Asesor</label>
                            <select value={selectedAsesor} onChange={e => setSelectedAsesor(e.target.value)} className="w-full p-2 border rounded-md bg-white">
                                <option value="">Todos los Asesores</option>
                                {asesores.filter(a => a.estatus === 'Activo').map(asesor => (
                                    <option key={asesor.id} value={asesor.id}>{asesor.nombreCompleto}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                        <input type="date" name="start" value={dateRange.start} onChange={handleDateChange} className="w-full p-2 border rounded-md" />
                    </div>

                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                        <input type="date" name="end" value={dateRange.end} onChange={handleDateChange} className="w-full p-2 border rounded-md" />
                    </div>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-4 py-3">Periodo</th>
                                <th className="px-4 py-3">Monto Contratado</th>
                                <th className="px-4 py-3">Pendiente a Contratar</th>
                                <th className="px-4 py-3">Ventas Cerradas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {summaryData.map(row => (
                                <tr key={row.period} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-2 font-medium capitalize">{getPeriodLabel(row.period)}</td>
                                    <td className="px-4 py-2 text-emerald-600 font-semibold">{formatCurrencyMXN(row.totalAmount)}</td>
                                    <td className="px-4 py-2 text-amber-600">{formatCurrencyMXN(row.pendingAmount)}</td>
                                    <td className="px-4 py-2 text-center">{row.dealCount}</td>
                                </tr>
                            ))}
                            {summaryData.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center py-4 text-gray-500">No hay datos para mostrar con los filtros seleccionados.</td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot className="bg-gray-100 font-bold text-gray-800">
                            <tr>
                                <td className="px-4 py-3 text-right">Total General</td>
                                <td className="px-4 py-3 text-emerald-700">{formatCurrencyMXN(footerTotals.totalAmount)}</td>
                                <td className="px-4 py-3 text-amber-700">{formatCurrencyMXN(footerTotals.totalPending)}</td>
                                <td className="px-4 py-3">
                                    <div className="flex justify-between">
                                        <span>Promedio por Asesor:</span>
                                        <span>{formatCurrencyMXN(footerTotals.averagePerAdvisor)}</span>
                                    </div>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SalesSummaryDashboard;
