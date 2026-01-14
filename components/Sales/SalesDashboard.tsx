
import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Venta, Asesor, Role, SaleStage, SaleStatus } from '../../types';
import { CONFIG, ALL_SALE_STAGES } from '../../constants';
import { formatCurrencyMXN, calculateDaysDifference, getMontoAsignado, calculateMonthlyAverage } from '../../lib/utils';
import SalesForm from './SalesForm';
import { PlusIcon, PencilIcon, TrashIcon } from '../common/Icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';


const LeaderDashboard: React.FC = () => {
    const { asesores, ventas } = useAppContext();
    const [month, setMonth] = useState(new Date().getMonth());
    const [year, setYear] = useState(new Date().getFullYear());

    const monthlySalesData = useMemo(() => {
        return asesores
            .filter(a => a.estatus === 'Activo')
            .map(asesor => {
                const contractedSales = ventas.filter(v => {
                    const startDate = new Date(v.fechaInicioProceso);
                    return v.etapaProceso === SaleStage.Contratado &&
                           (v.asesorPrincipalId === asesor.id || v.asesorSecundarioId === asesor.id) &&
                           startDate.getMonth() === month &&
                           startDate.getFullYear() === year;
                });
                
                const totalMonthAmount = contractedSales.reduce((sum, v) => sum + getMontoAsignado(v, asesor.id), 0);
                const monthlyAverage = calculateMonthlyAverage(asesor, ventas);

                return {
                    asesor,
                    totalMonthAmount,
                    monthlyAverage
                };
            })
            .sort((a, b) => b.totalMonthAmount - a.totalMonthAmount);
    }, [asesores, ventas, month, year]);

    const chartData = monthlySalesData.map(data => ({
        name: data.asesor.nombreCompleto.split(' ')[0],
        monto: data.totalMonthAmount,
    }));

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800">Tablero del Líder - {new Date(year, month).toLocaleString('es-MX', { month: 'long', year: 'numeric' })}</h2>
            <div className="bg-white p-4 rounded-lg shadow-inner">
                 <h3 className="font-bold text-lg text-maderas-blue mb-4">Ventas Mensuales por Asesor</h3>
                 <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 30, right: 10, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" fontSize={12} />
                            <YAxis tickFormatter={(value) => `$${Number(value) / 1000}k`} fontSize={10} />
                            <Tooltip formatter={(value: number) => formatCurrencyMXN(value)} />
                            <Bar dataKey="monto" fill="#60a5fa" radius={[4, 4, 0, 0]}>
                               <LabelList dataKey="monto" position="top" formatter={(value: number) => formatCurrencyMXN(value)} fontSize={10} fill="#374151" />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                 </div>
            </div>
            <div className="overflow-x-auto bg-white p-4 rounded-lg shadow-inner">
                <table className="w-full text-sm text-left text-gray-600">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-4 py-3">Ranking</th>
                            <th className="px-4 py-3">Asesor</th>
                            <th className="px-4 py-3">Ventas Contratadas (Mes)</th>
                            <th className="px-4 py-3">Promedio Mensual Histórico</th>
                        </tr>
                    </thead>
                    <tbody>
                        {monthlySalesData.map((data, index) => (
                            <tr key={data.asesor.id} className="border-b hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-2 font-bold text-maderas-blue">{index + 1}</td>
                                <td className="px-4 py-2 font-medium">{data.asesor.nombreCompleto}</td>
                                <td className={`px-4 py-2 font-semibold ${data.totalMonthAmount < CONFIG.limiteMensualMinimo ? 'text-rose-500' : 'text-emerald-500'}`}>
                                    {formatCurrencyMXN(data.totalMonthAmount)}
                                </td>
                                <td className={`px-4 py-2 ${data.monthlyAverage < CONFIG.limiteMensualMinimo ? 'text-rose-500' : ''}`}>
                                  {formatCurrencyMXN(data.monthlyAverage)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const AdvisorDashboard: React.FC<{asesor: Asesor}> = ({ asesor }) => {
    const { ventas } = useAppContext();
    const [month, setMonth] = useState(new Date().getMonth());
    const [year, setYear] = useState(new Date().getFullYear());

    const advisorSales = useMemo(() => {
         return ventas.filter(v => {
            const saleDate = new Date(v.fechaInicioProceso);
            return (v.asesorPrincipalId === asesor.id || v.asesorSecundarioId === asesor.id) &&
                   saleDate.getMonth() === month &&
                   saleDate.getFullYear() === year;
        });
    }, [ventas, asesor, month, year]);

    const totalMonthAmount = useMemo(() => {
        return advisorSales
            .filter(v => v.etapaProceso === SaleStage.Contratado)
            .reduce((sum, v) => sum + getMontoAsignado(v, asesor.id), 0);
    }, [advisorSales, asesor.id]);

    const monthlyAverage = calculateMonthlyAverage(asesor, ventas);

    return (
        <div className="space-y-6">
             <h2 className="text-xl font-bold text-gray-800">Tablero Individual - {new Date(year, month).toLocaleString('es-MX', { month: 'long', year: 'numeric' })}</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-6 rounded-lg text-white shadow-md ${totalMonthAmount < CONFIG.limiteMensualMinimo ? 'bg-rose-500' : 'bg-emerald-500'}`}>
                    <div className="text-sm opacity-80 uppercase font-bold tracking-wider">Ventas Contratadas (Mes)</div>
                    <div className="text-3xl font-bold mt-1">{formatCurrencyMXN(totalMonthAmount)}</div>
                </div>
                <div className={`p-6 rounded-lg text-white shadow-md ${monthlyAverage < CONFIG.limiteMensualMinimo ? 'bg-rose-500' : 'bg-maderas-blue'}`}>
                    <div className="text-sm opacity-80 uppercase font-bold tracking-wider">Promedio Mensual Histórico</div>
                    <div className="text-3xl font-bold mt-1">{formatCurrencyMXN(monthlyAverage)}</div>
                </div>
            </div>

            <div className="overflow-x-auto bg-white p-4 rounded-lg shadow-inner">
                 <h3 className="font-bold text-lg text-maderas-blue mb-4">Mis Ventas Iniciadas en el Mes</h3>
                <table className="w-full text-sm text-left text-gray-600">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-4 py-3">Lote</th>
                            <th className="px-4 py-3">Cliente</th>
                            <th className="px-4 py-3">Monto Total</th>
                            <th className="px-4 py-3">Monto Asignado</th>
                            <th className="px-4 py-3">Etapa</th>
                        </tr>
                    </thead>
                    <tbody>
                        {advisorSales.map(venta => (
                            <tr key={venta.id} className="border-b hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-2 font-medium">{venta.nombreLote}</td>
                                <td className="px-4 py-2">{venta.nombreCliente}</td>
                                <td className="px-4 py-2">{formatCurrencyMXN(venta.monto)}</td>
                                <td className="px-4 py-2 font-semibold text-maderas-blue">{formatCurrencyMXN(getMontoAsignado(venta, asesor.id))}</td>
                                <td className="px-4 py-2">
                                    <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full ${
                                        venta.etapaProceso === SaleStage.Contratado ? 'bg-emerald-100 text-emerald-800' : 
                                        venta.etapaProceso === SaleStage.Cancelado ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                                    }`}>
                                        {venta.etapaProceso}
                                    </span>
                                </td>
                            </tr>
                        ))}
                         {advisorSales.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-gray-400 italic">No hay ventas iniciadas en este mes.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ProcessDashboard: React.FC<{ onEdit: (venta: Venta) => void; onDelete: (ventaId: string) => void; role: Role }> = ({ onEdit, onDelete, role }) => {
    const { ventas, asesores, currentUser } = useAppContext();
    const [filters, setFilters] = useState({ etapa: '', asesorId: '' });

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilters(prev => ({...prev, [e.target.name]: e.target.value }));
    };

    const filteredSales = useMemo(() => {
        let salesInProgress = ventas.filter(v => v.estatusProceso === SaleStatus.InProgress);

        if (role === Role.Asesor && currentUser) {
            salesInProgress = salesInProgress.filter(v => v.asesorPrincipalId === currentUser.id || v.asesorSecundarioId === currentUser.id);
        } else if (role === Role.Lider) {
            if (filters.asesorId) {
                salesInProgress = salesInProgress.filter(v => v.asesorPrincipalId === filters.asesorId || v.asesorSecundarioId === filters.asesorId);
            }
        } else {
            return [];
        }
        
        return salesInProgress.filter(v => (filters.etapa ? v.etapaProceso === filters.etapa : true));
    }, [ventas, filters, currentUser, role]);

    return (
        <div className="space-y-6">
             <h2 className="text-xl font-bold text-gray-800">Ventas en Proceso</h2>
             <div className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 rounded-lg shadow-sm">
                <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Filtrar por Etapa</label>
                    <select name="etapa" onChange={handleFilterChange} className="p-2 border rounded-md bg-white w-full text-sm">
                        <option value="">Todas las Etapas</option>
                        {ALL_SALE_STAGES.filter(s => s !== SaleStage.Contratado && s !== SaleStage.Cancelado).map(stage => <option key={stage} value={stage}>{stage}</option>)}
                    </select>
                </div>
                {role === Role.Lider && (
                     <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Filtrar por Asesor</label>
                        <select name="asesorId" onChange={handleFilterChange} className="p-2 border rounded-md bg-white w-full text-sm">
                            <option value="">Todos los Asesores</option>
                            {asesores.filter(a => a.estatus === 'Activo').map(a => <option key={a.id} value={a.id}>{a.nombreCompleto}</option>)}
                        </select>
                     </div>
                )}
             </div>
             <div className="overflow-x-auto bg-white rounded-lg shadow-sm border">
                 <table className="w-full text-sm text-left text-gray-600">
                     <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-4 py-3">Lote / Cliente</th>
                            <th className="px-4 py-3">Asesor(es)</th>
                            <th className="px-4 py-3">Etapa</th>
                            <th className="px-4 py-3">Días en Proceso</th>
                            <th className="px-4 py-3 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSales.map(venta => {
                            const days = calculateDaysDifference(venta.fechaInicioProceso);
                            const asesoresNombres = [
                                asesores.find(a => a.id === venta.asesorPrincipalId)?.nombreCompleto,
                                asesores.find(a => a.id === venta.asesorSecundarioId)?.nombreCompleto
                            ].filter(Boolean).join(' / ');

                            return (
                                <tr key={venta.id} className="border-b hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-2">
                                        <div className="font-bold text-maderas-blue">{venta.nombreLote}</div>
                                        <div className="text-xs text-gray-500">{venta.nombreCliente}</div>
                                    </td>
                                    <td className="px-4 py-2 text-xs">{asesoresNombres || 'N/A'}</td>
                                    <td className="px-4 py-2"><span className="px-2 py-1 text-[10px] font-bold uppercase rounded-full bg-amber-100 text-amber-800 border border-amber-200">{venta.etapaProceso}</span></td>
                                    <td className={`px-4 py-2 font-semibold ${days > CONFIG.tiempoMaximoProceso ? 'text-rose-500' : 'text-emerald-600'}`}>
                                        <div className="flex items-center gap-1">
                                            <span>{days}</span>
                                            <span className="text-gray-400 font-normal">/ {CONFIG.tiempoMaximoProceso} días</span>
                                        </div>
                                        {days > CONFIG.tiempoMaximoProceso && <div className="text-[10px] font-bold text-rose-600 uppercase">¡Alerta de tiempo!</div>}
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <div className="flex justify-center items-center gap-3">
                                            <button onClick={() => onEdit(venta)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"><PencilIcon className="w-4 h-4"/></button>
                                            {role === Role.Lider && (
                                                <button 
                                                    onClick={() => {
                                                        if (window.confirm('¿Está seguro de que desea eliminar este registro de venta? Esta acción no se puede deshacer.')) {
                                                            onDelete(venta.id);
                                                        }
                                                    }} 
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-full transition-colors">
                                                    <TrashIcon className="w-4 h-4"/>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                 </table>
             </div>
        </div>
    );
};

const SalesHistoryDashboard: React.FC<{ onEdit: (venta: Venta) => void; onDelete: (ventaId: string) => void; role: Role }> = ({ onEdit, onDelete, role }) => {
    const { ventas, asesores, currentUser } = useAppContext();
    const [filters, setFilters] = useState({ asesorId: '', year: new Date().getFullYear().toString() });

    const availableYears = useMemo(() => {
        const years = new Set<string>();
        years.add(new Date().getFullYear().toString());
        ventas.forEach(v => {
            const date = new Date(v.fechaInicioProceso);
            years.add(date.getFullYear().toString());
        });
        return Array.from(years).sort((a, b) => b.localeCompare(a));
    }, [ventas]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilters(prev => ({...prev, [e.target.name]: e.target.value }));
    };

    const filteredSales = useMemo(() => {
        let salesToShow = ventas.filter(v => v.estatusProceso === SaleStatus.Closed);
        
        if (role === Role.Asesor && currentUser) {
            salesToShow = salesToShow.filter(v => v.asesorPrincipalId === currentUser.id || v.asesorSecundarioId === currentUser.id);
        } else if (role === Role.Lider) {
            if (filters.asesorId) {
                salesToShow = salesToShow.filter(v => v.asesorPrincipalId === filters.asesorId || v.asesorSecundarioId === filters.asesorId);
            }
        } else {
             return [];
        }

        // CRITERIO: Filtrar historial estrictamente por año de apartado (inicio proceso)
        if (filters.year) {
            salesToShow = salesToShow.filter(v => {
                const date = new Date(v.fechaInicioProceso);
                return date.getFullYear().toString() === filters.year;
            });
        }

        return salesToShow.sort((a, b) => new Date(b.fechaInicioProceso).getTime() - new Date(a.fechaInicioProceso).getTime());
    }, [ventas, filters, currentUser, role]);

    const summaryTotals = useMemo(() => {
        const totalContratado = filteredSales
            .filter(v => v.etapaProceso === SaleStage.Contratado)
            .reduce((sum, v) => sum + v.monto, 0);
        
        const totalCancelado = filteredSales
            .filter(v => v.etapaProceso === SaleStage.Cancelado)
            .reduce((sum, v) => sum + v.monto, 0);

        return { totalContratado, totalCancelado, count: filteredSales.length };
    }, [filteredSales]);

    return (
        <div className="space-y-6">
             <h2 className="text-xl font-bold text-gray-800">Historial de Ventas (Cerradas/Canceladas)</h2>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg shadow-sm">
                    <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">Monto Total Contratado</div>
                    <div className="text-2xl font-black text-emerald-600">{formatCurrencyMXN(summaryTotals.totalContratado)}</div>
                </div>
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-lg shadow-sm">
                    <div className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-1">Monto Total Cancelado</div>
                    <div className="text-2xl font-black text-rose-600">{formatCurrencyMXN(summaryTotals.totalCancelado)}</div>
                </div>
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg shadow-sm">
                    <div className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Total de Registros</div>
                    <div className="text-2xl font-black text-blue-600">{summaryTotals.count} <span className="text-sm font-normal text-blue-400">ventas</span></div>
                </div>
             </div>

             <div className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-100">
                <div className="flex-1">
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Año de Apartado</label>
                    <select name="year" value={filters.year} onChange={handleFilterChange} className="p-2 border rounded-md bg-white w-full text-sm font-bold text-maderas-blue">
                        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                {role === Role.Lider && (
                    <div className="flex-1">
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Filtrar por Asesor</label>
                        <select name="asesorId" onChange={handleFilterChange} className="p-2 border rounded-md bg-white w-full text-sm font-bold text-maderas-blue">
                            <option value="">Todos los Asesores</option>
                            {asesores.filter(a => a.estatus === 'Activo').map(a => <option key={a.id} value={a.id}>{a.nombreCompleto}</option>)}
                        </select>
                    </div>
                )}
            </div>

             <div className="overflow-x-auto bg-white rounded-lg shadow-sm border">
                 <table className="w-full text-sm text-left text-gray-600">
                     <thead className="text-xs text-gray-700 uppercase bg-gray-100/50">
                        <tr>
                            <th className="px-4 py-3">Lote / Cliente</th>
                            <th className="px-4 py-3">Asesor(es)</th>
                            <th className="px-4 py-3">Etapa Final</th>
                            <th className="px-4 py-3">Fecha Inicio (Apartado)</th>
                            <th className="px-4 py-3">Monto</th>
                            <th className="px-4 py-3 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSales.map(venta => {
                            const asesoresNombres = [
                                asesores.find(a => a.id === venta.asesorPrincipalId)?.nombreCompleto,
                                asesores.find(a => a.id === venta.asesorSecundarioId)?.nombreCompleto
                            ].filter(Boolean).join(' / ');

                            return (
                                <tr key={venta.id} className="border-b hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-2">
                                        <div className="font-bold text-maderas-blue">{venta.nombreLote}</div>
                                        <div className="text-xs text-gray-500">{venta.nombreCliente}</div>
                                    </td>
                                    <td className="px-4 py-2 text-xs">{asesoresNombres || 'N/A'}</td>
                                    <td className="px-4 py-2">
                                        <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full border ${
                                            venta.etapaProceso === SaleStage.Cancelado ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                        }`}>
                                            {venta.etapaProceso}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-xs font-medium text-gray-500">{new Date(venta.fechaInicioProceso).toLocaleDateString()}</td>
                                    <td className="px-4 py-2 font-bold text-maderas-blue">{formatCurrencyMXN(venta.monto)}</td>
                                    <td className="px-4 py-2 text-center">
                                        <div className="flex justify-center items-center gap-3">
                                            <button onClick={() => onEdit(venta)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"><PencilIcon className="w-4 h-4"/></button>
                                            {role === Role.Lider && (
                                                <button 
                                                    onClick={() => {
                                                        if (window.confirm('¿Está seguro de que desea eliminar este registro de venta?')) {
                                                            onDelete(venta.id);
                                                        }
                                                    }} 
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-full transition-colors">
                                                    <TrashIcon className="w-4 h-4"/>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                         {filteredSales.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center py-8 text-gray-400 italic">No hay ventas registradas en este año con los filtros seleccionados.</td>
                            </tr>
                        )}
                    </tbody>
                    {filteredSales.length > 0 && (
                        <tfoot className="bg-gray-50 font-black">
                            <tr>
                                <td colSpan={4} className="px-4 py-3 text-right text-maderas-blue uppercase tracking-tight">Total Selección:</td>
                                <td className="px-4 py-3 text-maderas-blue">{formatCurrencyMXN(summaryTotals.totalContratado + summaryTotals.totalCancelado)}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    )}
                 </table>
             </div>
        </div>
    );
};


const SalesDashboard = () => {
    const { role, currentUser, asesores, deleteVenta } = useAppContext();
    const [activeTab, setActiveTab] = useState(role === Role.Lider ? 'leader' : 'advisor');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [ventaToEdit, setVentaToEdit] = useState<Venta | null>(null);
    const [selectedAdvisorForView, setSelectedAdvisorForView] = useState<string>(
        (currentUser && role === Role.Asesor) ? currentUser.id : (asesores.find(a => a.estatus === 'Activo')?.id || '')
    );

    const handleEdit = (venta: Venta) => {
        setVentaToEdit(venta);
        setIsFormOpen(true);
    };

    const handleAdd = () => {
        setVentaToEdit(null);
        setIsFormOpen(true);
    };

    useEffect(() => {
        if (role === Role.Asesor && currentUser) {
            setSelectedAdvisorForView(currentUser.id);
        }
    }, [currentUser, role]);

    const renderDashboard = () => {
        const advisorIdToView = selectedAdvisorForView;
        const advisorToView = asesores.find(a => a.id === advisorIdToView);

        switch (activeTab) {
            case 'leader':
                return role === Role.Lider ? <LeaderDashboard /> : <p>Acceso no autorizado.</p>;
            case 'advisor':
                if (!advisorToView) return <p className="p-8 text-center text-gray-500 italic">No hay un asesor seleccionado o el asesor no está activo.</p>;
                return <AdvisorDashboard asesor={advisorToView} />;
            case 'process':
                return <ProcessDashboard onEdit={handleEdit} onDelete={deleteVenta} role={role} />;
            case 'history':
                return <SalesHistoryDashboard onEdit={handleEdit} onDelete={deleteVenta} role={role} />;
            default:
                return role === Role.Lider ? <LeaderDashboard /> : <p>Seleccione una vista.</p>;
        }
    };
    
    const availableTabs = useMemo(() => (role === Role.Lider ? [
        { id: 'leader', label: 'Tablero del Líder' },
        { id: 'advisor', label: 'Tablero Individual' },
        { id: 'process', label: 'Ventas en Proceso' },
        { id: 'history', label: 'Historial de Ventas' },
    ] : [
        { id: 'advisor', label: 'Mi Tablero' },
        { id: 'process', label: 'Ventas en Proceso' },
        { id: 'history', label: 'Mi Historial' },
    ]), [role]);
    
    useEffect(() => {
        setActiveTab(role === Role.Lider ? 'leader' : 'advisor');
    }, [role]);

    const TabButton = ({ id, label }: { id: string; label: string }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 rounded-t-lg text-sm font-bold uppercase tracking-tight transition-all duration-200 ease-in-out focus:outline-none ${activeTab === id ? 'bg-white text-maderas-blue border-t border-l border-r border-gray-200 shadow-sm' : 'bg-transparent text-gray-400 hover:text-maderas-blue'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-maderas-blue">Gestión de Ventas</h1>
                 <button onClick={handleAdd} className="flex items-center gap-2 bg-maderas-blue text-white px-5 py-2.5 rounded-md hover:bg-opacity-90 shadow-md transition-all active:scale-95">
                    <PlusIcon className="w-5 h-5" /> Registrar Venta
                </button>
            </div>
            
            <div className="flex border-b border-gray-200 -mb-px overflow-x-auto">
                {availableTabs.map(tab => <TabButton key={tab.id} {...tab} />)}
            </div>

            <div className="bg-white p-6 rounded-b-lg rounded-r-lg shadow-xl border border-gray-200 border-t-0">
                {activeTab === 'advisor' && (
                    <div className="mb-6 pb-6 border-b flex items-center gap-3">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Vista de Asesor:</label>
                        {role === Role.Lider ? (
                             <select
                                value={selectedAdvisorForView}
                                onChange={(e) => setSelectedAdvisorForView(e.target.value)}
                                className="p-2 border rounded-md bg-white shadow-sm text-sm font-medium focus:ring-2 focus:ring-maderas-blue focus:outline-none"
                            >
                                {asesores.filter(a => a.estatus === 'Activo').map(a => <option key={a.id} value={a.id}>{a.nombreCompleto}</option>)}
                            </select>
                        ) : (
                           <span className="font-bold text-maderas-blue bg-blue-50 px-3 py-1 rounded-md border border-blue-100">{currentUser?.nombreCompleto}</span>
                        )}
                    </div>
                )}
                {renderDashboard()}
            </div>

            <SalesForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} ventaToEdit={ventaToEdit} />
        </div>
    );
};

export default SalesDashboard;
