
import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Venta, Asesor, Role, SaleStage, SaleStatus } from '../../types';
import { CONFIG, ALL_SALE_STAGES } from '../../constants';
import { formatCurrencyMXN, calculateDaysDifference, getMontoAsignado, calculateMonthlyAverage } from '../../lib/utils';
import SalesForm from './SalesForm';
import { PlusIcon, PencilIcon } from '../common/Icons';
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
                    const closeDate = v.fechaCierre ? new Date(v.fechaCierre) : new Date(v.fechaInicioProceso);
                    return v.etapaProceso === SaleStage.Contratado &&
                           (v.asesorPrincipalId === asesor.id || v.asesorSecundarioId === asesor.id) &&
                           closeDate.getMonth() === month &&
                           closeDate.getFullYear() === year;
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
            {/* Chart */}
            <div className="bg-white p-4 rounded-lg shadow-inner">
                 <h3 className="font-bold text-lg text-maderas-blue mb-4">Ventas Mensuales por Asesor</h3>
                 <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} margin={{ top: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => `$${Number(value) / 1000}k`} />
                        <Tooltip formatter={(value: number) => formatCurrencyMXN(value)} />
                        <Bar dataKey="monto" fill="#60a5fa">
                           <LabelList dataKey="monto" position="top" formatter={(value: number) => formatCurrencyMXN(value)} fontSize={12} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            {/* Table */}
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
                            <tr key={data.asesor.id} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-2 font-bold">{index + 1}</td>
                                <td className="px-4 py-2">{data.asesor.nombreCompleto}</td>
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
    const { ventas, currentUser, role } = useAppContext();
    const [month, setMonth] = useState(new Date().getMonth());
    const [year, setYear] = useState(new Date().getFullYear());

    const advisorSales = useMemo(() => {
        // PERMISSION RULE: Advisors can only view sales data they created.
        const salesForUser = (role === Role.Asesor && currentUser)
            ? ventas.filter(v => v.createdByEmail === currentUser.email)
            : ventas;

         return salesForUser.filter(v => {
            const saleDate = new Date(v.fechaInicioProceso);
            return (v.asesorPrincipalId === asesor.id || v.asesorSecundarioId === asesor.id) &&
                   saleDate.getMonth() === month &&
                   saleDate.getFullYear() === year;
        });
    }, [ventas, asesor, month, year, currentUser, role]);

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
                <div className={`p-4 rounded-lg text-white ${totalMonthAmount < CONFIG.limiteMensualMinimo ? 'bg-rose-500' : 'bg-emerald-500'}`}>
                    <div className="text-sm">Ventas Contratadas (Mes)</div>
                    <div className="text-2xl font-bold">{formatCurrencyMXN(totalMonthAmount)}</div>
                </div>
                <div className={`p-4 rounded-lg text-white ${monthlyAverage < CONFIG.limiteMensualMinimo ? 'bg-rose-500' : 'bg-maderas-blue'}`}>
                    <div className="text-sm">Promedio Mensual Histórico</div>
                    <div className="text-2xl font-bold">{formatCurrencyMXN(monthlyAverage)}</div>
                </div>
            </div>

            <div className="overflow-x-auto bg-white p-4 rounded-lg shadow-inner">
                 <h3 className="font-bold text-lg text-maderas-blue mb-4">Mis Ventas del Mes</h3>
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
                            <tr key={venta.id} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-2 font-medium">{venta.nombreLote}</td>
                                <td className="px-4 py-2">{venta.nombreCliente}</td>
                                <td className="px-4 py-2">{formatCurrencyMXN(venta.monto)}</td>
                                <td className="px-4 py-2 font-semibold">{formatCurrencyMXN(getMontoAsignado(venta, asesor.id))}</td>
                                <td className="px-4 py-2">{venta.etapaProceso}</td>
                            </tr>
                        ))}
                         {advisorSales.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center py-4 text-gray-500">No hay ventas registradas para este mes.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ProcessDashboard: React.FC<{ onEdit: (venta: Venta) => void }> = ({ onEdit }) => {
    const { ventas, asesores, currentUser, role } = useAppContext();
    const [filters, setFilters] = useState({ etapa: '', asesorId: '' });

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilters(prev => ({...prev, [e.target.name]: e.target.value }));
    };

    const filteredSales = useMemo(() => {
        let salesInProgress = ventas.filter(v => v.estatusProceso === SaleStatus.InProgress);

        // PERMISSION RULE: Leaders see all sales, Advisors only see sales they created.
        if (role === Role.Asesor && currentUser) {
            salesInProgress = salesInProgress.filter(v => v.createdByEmail === currentUser.email);
        } else if (role === Role.Lider) {
            if (filters.asesorId) {
                salesInProgress = salesInProgress.filter(v => v.asesorPrincipalId === filters.asesorId || v.asesorSecundarioId === filters.asesorId);
            }
        } else {
            return []; // Should not happen for logged in users
        }
        
        // Further filter by stage
        return salesInProgress.filter(v => (filters.etapa ? v.etapaProceso === filters.etapa : true));
    }, [ventas, filters, currentUser, role]);

    return (
        <div className="space-y-6">
             <h2 className="text-xl font-bold text-gray-800">Ventas en Proceso</h2>
             <div className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
                <select name="etapa" onChange={handleFilterChange} className="p-2 border rounded-md bg-white w-full">
                    <option value="">Todas las Etapas</option>
                    {ALL_SALE_STAGES.filter(s => s !== SaleStage.Contratado && s !== SaleStage.Cancelado).map(stage => <option key={stage} value={stage}>{stage}</option>)}
                </select>
                {role === Role.Lider && (
                     <select name="asesorId" onChange={handleFilterChange} className="p-2 border rounded-md bg-white w-full">
                        <option value="">Todos los Asesores</option>
                        {asesores.filter(a => a.estatus === 'Activo').map(a => <option key={a.id} value={a.id}>{a.nombreCompleto}</option>)}
                    </select>
                )}
             </div>
             <div className="overflow-x-auto bg-white">
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
                                <tr key={venta.id} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-2">
                                        <div className="font-medium">{venta.nombreLote}</div>
                                        <div className="text-xs text-gray-500">{venta.nombreCliente}</div>
                                    </td>
                                    <td className="px-4 py-2 text-xs">{asesoresNombres || 'N/A'}</td>
                                    <td className="px-4 py-2"><span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">{venta.etapaProceso}</span></td>
                                    <td className={`px-4 py-2 font-semibold ${days > CONFIG.tiempoMaximoProceso ? 'text-rose-500' : ''}`}>
                                        {days} / {CONFIG.tiempoMaximoProceso} días
                                        {days > CONFIG.tiempoMaximoProceso && <div className="text-xs font-normal text-rose-600">¡Tiempo excedido!</div>}
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <button onClick={() => onEdit(venta)} className="text-blue-600 hover:text-blue-800"><PencilIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            )
                        })}
                         {filteredSales.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center py-4 text-gray-500">No hay ventas en proceso que coincidan con los filtros.</td>
                            </tr>
                        )}
                    </tbody>
                 </table>
             </div>
        </div>
    );
};

const SalesHistoryDashboard: React.FC<{ onEdit: (venta: Venta) => void }> = ({ onEdit }) => {
    const { ventas, asesores, currentUser, role } = useAppContext();
    const [filters, setFilters] = useState({ asesorId: '' });

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilters(prev => ({...prev, [e.target.name]: e.target.value }));
    };

    const filteredSales = useMemo(() => {
        let salesToShow = ventas.filter(v => v.estatusProceso === SaleStatus.Closed);
        
        // PERMISSION RULE: Leaders see all sales, Advisors only see sales they created.
        if (role === Role.Asesor && currentUser) {
            salesToShow = salesToShow.filter(v => v.createdByEmail === currentUser.email);
        } else if (role === Role.Lider) {
            if (filters.asesorId) {
                salesToShow = salesToShow.filter(v => v.asesorPrincipalId === filters.asesorId || v.asesorSecundarioId === filters.asesorId);
            }
        } else {
             return []; // Should not happen for logged in users
        }

        return salesToShow.sort((a, b) => new Date(b.fechaCierre || b.fechaInicioProceso).getTime() - new Date(a.fechaCierre || a.fechaInicioProceso).getTime());
    }, [ventas, filters, currentUser, role]);

    return (
        <div className="space-y-6">
             <h2 className="text-xl font-bold text-gray-800">Historial de Ventas (Cerradas/Canceladas)</h2>
             <div className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
                {role === Role.Lider && (
                    <select name="asesorId" onChange={handleFilterChange} className="p-2 border rounded-md bg-white w-full">
                        <option value="">Todos los Asesores</option>
                        {asesores.filter(a => a.estatus === 'Activo').map(a => <option key={a.id} value={a.id}>{a.nombreCompleto}</option>)}
                    </select>
                )}
            </div>
             <div className="overflow-x-auto bg-white">
                 <table className="w-full text-sm text-left text-gray-600">
                     <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-4 py-3">Lote / Cliente</th>
                            <th className="px-4 py-3">Asesor(es)</th>
                            <th className="px-4 py-3">Etapa Final</th>
                            <th className="px-4 py-3">Fecha Cierre</th>
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
                                <tr key={venta.id} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-2">
                                        <div className="font-medium">{venta.nombreLote}</div>
                                        <div className="text-xs text-gray-500">{venta.nombreCliente}</div>
                                    </td>
                                    <td className="px-4 py-2 text-xs">{asesoresNombres || 'N/A'}</td>
                                    <td className="px-4 py-2">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${venta.etapaProceso === SaleStage.Cancelado ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                            {venta.etapaProceso}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2">{venta.fechaCierre ? new Date(venta.fechaCierre).toLocaleDateString() : 'N/A'}</td>
                                    <td className="px-4 py-2 font-semibold">{formatCurrencyMXN(venta.monto)}</td>
                                    <td className="px-4 py-2 text-center">
                                        <button onClick={() => onEdit(venta)} className="text-blue-600 hover:text-blue-800"><PencilIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            );
                        })}
                         {filteredSales.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center py-4 text-gray-500">No hay ventas cerradas o canceladas que coincidan con los filtros.</td>
                            </tr>
                        )}
                    </tbody>
                 </table>
             </div>
        </div>
    );
};


const SalesDashboard = () => {
    const { role, currentUser, asesores } = useAppContext();
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
        // Ensure advisor always sees their own dashboard, even after re-login
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
                if (!advisorToView) return <p>No hay un asesor seleccionado o el asesor no está activo.</p>;
                return <AdvisorDashboard asesor={advisorToView} />;
            case 'process':
                return <ProcessDashboard onEdit={handleEdit} />;
            case 'history':
                return <SalesHistoryDashboard onEdit={handleEdit} />;
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
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors duration-200 ease-in-out focus:outline-none ${activeTab === id ? 'bg-white text-maderas-blue border-t border-l border-r border-gray-200' : 'bg-transparent text-gray-500 hover:text-maderas-blue'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <h1 className="text-2xl font-bold text-maderas-blue">Gestión de Ventas</h1>
                 <button onClick={handleAdd} className="flex items-center gap-2 bg-maderas-blue text-white px-4 py-2 rounded-md hover:bg-opacity-90 shadow-sm">
                    <PlusIcon className="w-5 h-5" /> Registrar Venta
                </button>
            </div>
            
            <div className="flex border-b border-gray-200 -mb-px">
                {/* Fix: Use spread operator to pass props to TabButton, resolving a TypeScript error related to the 'key' prop. */}
                {availableTabs.map(tab => <TabButton key={tab.id} {...tab} />)}
            </div>

            <div className="bg-white p-6 rounded-b-lg rounded-r-lg shadow-md border border-gray-200 border-t-0">
                {activeTab === 'advisor' && (
                    <div className="mb-6 pb-4 border-b">
                        <label className="mr-2 font-medium text-gray-700">Ver tablero de:</label>
                        {role === Role.Lider ? (
                             <select
                                value={selectedAdvisorForView}
                                onChange={(e) => setSelectedAdvisorForView(e.target.value)}
                                className="p-2 border rounded-md bg-white shadow-sm"
                            >
                                {asesores.filter(a => a.estatus === 'Activo').map(a => <option key={a.id} value={a.id}>{a.nombreCompleto}</option>)}
                            </select>
                        ) : (
                           <span className="font-semibold text-gray-800">{currentUser?.nombreCompleto}</span>
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