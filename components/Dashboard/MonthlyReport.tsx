
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Lead, Role } from '../../types';

interface DailyActivity {
  newProspects: number;
  followUps: number;
}

const MonthlyReport = () => {
    const { leads, asesores, currentUser, role } = useAppContext();
    const [selectedAsesor, setSelectedAsesor] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState<string>(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);

    const activeAsesores = useMemo(() => asesores.filter(a => a.estatus === 'Activo'), [asesores]);
    
    // Apply permission rules to the source data
    const leadsForUser = useMemo(() => {
        if (role === Role.Lider || !currentUser) return leads;
        return leads.filter(lead => lead.createdByEmail === currentUser.email);
    }, [leads, currentUser, role]);

    const displayAsesores = useMemo(() => {
        // PERMISSION RULE: Leaders see all advisors (and can filter), Advisors only see themselves.
        if (role === Role.Lider) {
            return selectedAsesor ? activeAsesores.filter(a => a.id === selectedAsesor) : activeAsesores;
        }
        return currentUser ? activeAsesores.filter(a => a.id === currentUser.id) : [];
    }, [activeAsesores, selectedAsesor, currentUser, role]);

    const dailyActivityData = useMemo(() => {
        const data: Record<string, Record<string, DailyActivity>> = {}; // { 'YYYY-MM-DD': { 'asesorId': { ... } } }
        const [year, month] = selectedMonth.split('-').map(Number);
        const daysInMonth = new Date(year, month, 0).getDate();

        // Initialize data for all days of the month and all active advisors
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            data[dateStr] = {};
            activeAsesores.forEach(asesor => {
                data[dateStr][asesor.id] = { newProspects: 0, followUps: 0 };
            });
        }
        
        // Use the permission-filtered list of leads
        leadsForUser.forEach(lead => {
            const leadDate = new Date(lead.fechaProspeccion);
            if (leadDate.getFullYear() === year && leadDate.getMonth() + 1 === month) {
                 const dateStr = lead.fechaProspeccion.split('T')[0];
                 if (data[dateStr] && data[dateStr][lead.asesorId]) {
                    data[dateStr][lead.asesorId].newProspects++;
                    data[dateStr][lead.asesorId].followUps += lead.interacciones > 0 ? lead.interacciones : 1;
                 }
            }
        });
        
        return data;
    }, [leadsForUser, selectedMonth, activeAsesores]);

    // NEW: Calculate Monthly Totals for each advisor
    const monthlyTotals = useMemo(() => {
        const totals: Record<string, DailyActivity> = {};
        displayAsesores.forEach(asesor => {
            totals[asesor.id] = { newProspects: 0, followUps: 0 };
        });

        Object.values(dailyActivityData).forEach(dayData => {
            displayAsesores.forEach(asesor => {
                if (dayData[asesor.id]) {
                    totals[asesor.id].newProspects += dayData[asesor.id].newProspects;
                    totals[asesor.id].followUps += dayData[asesor.id].followUps;
                }
            });
        });

        return totals;
    }, [dailyActivityData, displayAsesores]);

    const getMonthYearOptions = () => {
        const options = [];
        const today = new Date();
        for (let i = 0; i < 12; i++) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const label = date.toLocaleString('es-MX', { month: 'long', year: 'numeric' });
            options.push({ value, label });
        }
        return options;
    };

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h1 className="text-2xl font-bold text-maderas-blue">Reporte de Actividad Mensual</h1>
                    <div className="flex gap-4">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="p-2 border rounded-md bg-white shadow-sm"
                        >
                            {getMonthYearOptions().map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                       {role === Role.Lider && (
                           <select
                               value={selectedAsesor}
                               onChange={(e) => setSelectedAsesor(e.target.value)}
                               className="p-2 border rounded-md bg-white shadow-sm"
                           >
                               <option value="">Todos los Asesores</option>
                               {activeAsesores.map(asesor => (
                                   <option key={asesor.id} value={asesor.id}>{asesor.nombreCompleto}</option>
                               ))}
                           </select>
                       )}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-center text-gray-600">
                        <thead className="text-xs text-gray-700 uppercase bg-sky-100 sticky top-0 z-10">
                            <tr>
                                <th rowSpan={2} className="px-4 py-3 border border-sky-200">Día</th>
                                {displayAsesores.map(asesor => (
                                    <th key={asesor.id} colSpan={2} className="px-4 py-3 border border-sky-200">{asesor.nombreCompleto}</th>
                                ))}
                            </tr>
                            <tr>
                                {displayAsesores.map(asesor => (
                                    <React.Fragment key={`${asesor.id}-sub`}>
                                        <th className="px-2 py-2 border border-sky-200 font-normal">Prospectos</th>
                                        <th className="px-2 py-2 border border-sky-200 font-normal">Seguimientos</th>
                                    </React.Fragment>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {Object.entries(dailyActivityData).map(([date, advisorData]) => (
                                <tr key={date} className="border-b border-sky-200 hover:bg-sky-50 transition-colors">
                                    <td className="px-4 py-2 font-medium border-x border-sky-200">{new Date(date).toLocaleDateString('es-MX', { day: '2-digit' })}</td>
                                    {displayAsesores.map(asesor => (
                                        <React.Fragment key={`${date}-${asesor.id}`}>
                                            <td className="px-2 py-2 border-x border-sky-200">{advisorData[asesor.id]?.newProspects || 0}</td>
                                            <td className="px-2 py-2 border-x border-sky-200">{advisorData[asesor.id]?.followUps || 0}</td>
                                        </React.Fragment>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                        {/* FOOTER: Monthly Totals Row */}
                        <tfoot className="bg-sky-100 font-bold text-maderas-blue border-t-2 border-sky-300">
                            <tr>
                                <td className="px-4 py-3 border border-sky-200">TOTAL MES</td>
                                {displayAsesores.map(asesor => (
                                    <React.Fragment key={`${asesor.id}-total`}>
                                        <td className="px-2 py-3 border border-sky-200 text-lg">
                                            {monthlyTotals[asesor.id]?.newProspects || 0}
                                        </td>
                                        <td className="px-2 py-3 border border-sky-200 text-lg">
                                            {monthlyTotals[asesor.id]?.followUps || 0}
                                        </td>
                                    </React.Fragment>
                                ))}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MonthlyReport;
