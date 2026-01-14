
import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { SaleStage, Role } from '../../types';
import { formatCurrencyMXN, getMontoAsignado } from '../../lib/utils';

// Sub-component for goal input, to manage its own state
const GoalInput: React.FC<{ asesorId: string; year: number; month: number; currentGoalAmount: number }> = ({ asesorId, year, month, currentGoalAmount }) => {
    const { addOrUpdateMonthlyGoal } = useAppContext();
    const [goal, setGoal] = useState(currentGoalAmount);

    useEffect(() => {
        setGoal(currentGoalAmount);
    }, [currentGoalAmount]);

    const handleBlur = async () => {
        if (goal !== currentGoalAmount) {
            await addOrUpdateMonthlyGoal({ asesorId, year, month, goalAmount: goal });
        }
    };
    
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
        }
    };

    return (
        <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <input
                type="number"
                value={goal}
                onChange={(e) => setGoal(Number(e.target.value) || 0)}
                onBlur={handleBlur}
                onKeyPress={handleKeyPress}
                className="w-full pl-6 pr-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-maderas-blue focus:border-transparent"
                aria-label="Meta mensual"
            />
        </div>
    );
};


const GoalsDashboard = () => {
    const { asesores, ventas, monthlyGoals, role, currentUser } = useAppContext();
    const [currentDate, setCurrentDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // 1-12

    const visibleAsesores = useMemo(() => {
        const activeAsesores = asesores.filter(a => a.estatus === 'Activo');
        if (role === Role.Asesor && currentUser) {
            return activeAsesores.filter(a => a.id === currentUser.id);
        }
        return activeAsesores;
    }, [asesores, role, currentUser]);


    const advisorGoalData = useMemo(() => {
        return visibleAsesores.map(asesor => {
            // Filter sales that started in this month
            const advisorVentasThisMonth = ventas.filter(v => {
                const saleDate = new Date(v.fechaInicioProceso);
                return (v.asesorPrincipalId === asesor.id || v.asesorSecundarioId === asesor.id) &&
                       saleDate.getFullYear() === year &&
                       saleDate.getMonth() + 1 === month;
            });

            // "Apartados" are sales in early stages (not yet contracted)
            const amountPending = advisorVentasThisMonth
                .filter(v => [SaleStage.Apartado, SaleStage.DS, SaleStage.Enganche].includes(v.etapaProceso))
                .reduce((sum, v) => sum + getMontoAsignado(v, asesor.id), 0);
            
            // "Contratado" are sales that have reached completion
            const amountAchieved = advisorVentasThisMonth
                .filter(v => v.etapaProceso === SaleStage.Contratado)
                .reduce((sum, v) => sum + getMontoAsignado(v, asesor.id), 0);
            
            const goal = monthlyGoals.find(g => g.asesorId === asesor.id && g.year === year && g.month === month);
            const goalAmount = goal?.goalAmount || 0;
            
            const progress = goalAmount > 0 ? (amountAchieved / goalAmount) * 100 : 0;

            return {
                asesorId: asesor.id,
                nombreCompleto: asesor.nombreCompleto,
                goalAmount,
                amountPending,
                amountAchieved,
                progress: Math.min(progress, 100) // Cap progress at 100%
            };
        });
    }, [visibleAsesores, ventas, monthlyGoals, year, month]);

    // Calculate Team Totals
    const teamTotals = useMemo(() => {
        const totalGoal = advisorGoalData.reduce((sum, d) => sum + d.goalAmount, 0);
        const totalAchieved = advisorGoalData.reduce((sum, d) => sum + d.amountAchieved, 0);
        const totalPending = advisorGoalData.reduce((sum, d) => sum + d.amountPending, 0);
        const totalProgress = totalGoal > 0 ? (totalAchieved / totalGoal) * 100 : 0;

        return {
            totalGoal,
            totalAchieved,
            totalPending,
            totalProgress: Math.min(totalProgress, 100)
        };
    }, [advisorGoalData]);

    const changeMonth = (offset: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + offset);
            return newDate;
        });
    };
    
    return (
        <div className="p-4 md:p-6 lg:p-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h1 className="text-2xl font-bold text-maderas-blue">Metas Mensuales</h1>
                    <div className="flex items-center gap-2">
                        <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-100" aria-label="Mes anterior">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                        </button>
                        <span className="font-semibold text-lg w-48 text-center capitalize">
                            {currentDate.toLocaleString('es-MX', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-100" aria-label="Siguiente mes">
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-4 py-3">Asesor</th>
                                <th className="px-4 py-3 w-48">Meta Mensual</th>
                                <th className="px-4 py-3">Monto Apartado</th>
                                <th className="px-4 py-3">Monto Contratado</th>
                                <th className="px-4 py-3 min-w-[200px]">Progreso</th>
                            </tr>
                        </thead>
                        <tbody>
                            {advisorGoalData.map(data => (
                                <tr key={data.asesorId} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-2 font-medium text-gray-900">{data.nombreCompleto}</td>
                                    <td className="px-4 py-2">
                                        <GoalInput asesorId={data.asesorId} year={year} month={month} currentGoalAmount={data.goalAmount} />
                                    </td>
                                    <td className="px-4 py-2 font-medium text-amber-600">{formatCurrencyMXN(data.amountPending)}</td>
                                    <td className="px-4 py-2 font-semibold text-emerald-600">{formatCurrencyMXN(data.amountAchieved)}</td>
                                    <td className="px-4 py-2">
                                        <div className="w-full bg-gray-200 rounded-full h-5 relative">
                                            <div 
                                                className="bg-emerald-500 h-5 rounded-full transition-all duration-500"
                                                style={{ width: `${data.progress}%` }}
                                            >
                                            </div>
                                             <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-800">
                                                {data.progress.toFixed(0)}%
                                             </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                             {advisorGoalData.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-4 text-gray-500">
                                        {role === Role.Asesor ? 'No hay datos de metas para mostrar.' : 'No hay asesores activos para mostrar.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {advisorGoalData.length > 0 && (
                            <tfoot className="bg-maderas-blue/5 font-bold">
                                <tr>
                                    <td className="px-4 py-4 text-maderas-blue">TOTAL EQUIPO</td>
                                    <td className="px-4 py-4 text-maderas-blue">{formatCurrencyMXN(teamTotals.totalGoal)}</td>
                                    <td className="px-4 py-4 text-amber-700">{formatCurrencyMXN(teamTotals.totalPending)}</td>
                                    <td className="px-4 py-4 text-emerald-700">{formatCurrencyMXN(teamTotals.totalAchieved)}</td>
                                    <td className="px-4 py-4">
                                        <div className="w-full bg-gray-300 rounded-full h-6 relative shadow-inner">
                                            <div 
                                                className="bg-maderas-blue h-6 rounded-full transition-all duration-700"
                                                style={{ width: `${teamTotals.totalProgress}%` }}
                                            >
                                            </div>
                                             <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-maderas-blue drop-shadow-sm">
                                                TOTAL: {teamTotals.totalProgress.toFixed(1)}%
                                             </span>
                                        </div>
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
};

export default GoalsDashboard;
