
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Role } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const KPIsDashboard = () => {
    const { leads, asesores, appointments, currentUser, role } = useAppContext();
    const [selectedAsesor, setSelectedAsesor] = useState<string>('');

    const activeAsesores = useMemo(() => asesores.filter(a => a.estatus === 'Activo'), [asesores]);
    
    // Apply permission rules to Leads
    const filteredLeads = useMemo(() => {
        const leadsForUser = (role === Role.Lider || !currentUser)
            ? leads
            : leads.filter(lead => lead.createdByEmail === currentUser.email);
        
        if (role === Role.Lider && selectedAsesor) {
            return leadsForUser.filter(lead => lead.asesorId === selectedAsesor);
        }
        return leadsForUser;
    }, [leads, selectedAsesor, currentUser, role]);

    // NEW: Apply permission rules to Appointments (Calendar)
    const filteredAppointments = useMemo(() => {
        const appsForUser = (role === Role.Lider || !currentUser)
            ? appointments
            : appointments.filter(app => app.createdByEmail === currentUser.email || app.asesorId === currentUser.id);

        if (role === Role.Lider && selectedAsesor) {
            return appsForUser.filter(app => app.asesorId === selectedAsesor);
        }
        return appsForUser;
    }, [appointments, selectedAsesor, currentUser, role]);

    const prospectosPorMes = useMemo(() => {
        const data: { [key: string]: number } = {};
        filteredLeads.forEach(lead => {
            const month = new Date(lead.fechaProspeccion).toLocaleString('es-MX', { month: 'short', year: 'numeric' });
            if (!data[month]) data[month] = 0;
            data[month]++;
        });
        return Object.entries(data).map(([name, value]) => ({ name, prospectos: value })).reverse();
    }, [filteredLeads]);
    
    const lugarDeProspeccion = useMemo(() => {
        const data: { [key: string]: number } = {};
        filteredLeads.forEach(lead => {
            const key = lead.lugarProspeccion.trim() || "N/A";
            if (data[key]) {
                data[key]++;
            } else {
                data[key] = 1;
            }
        });
        return Object.entries(data).map(([name, value]) => ({ name, value }));
    }, [filteredLeads]);
    
    // UPDATED: Now counting from the appointments collection (Calendar)
    const numeroDeCitas = useMemo(() => {
        return filteredAppointments.length;
    }, [filteredAppointments]);

    const porcentajeConversion = useMemo(() => {
        const totalLeads = filteredLeads.length;
        if (totalLeads === 0) return 0;
        const apartados = filteredLeads.filter(lead => lead.estatus === 'Apartado').length;
        return ((apartados / totalLeads) * 100).toFixed(2);
    }, [filteredLeads]);
    
    const totalInteracciones = useMemo(() => {
        return filteredLeads.reduce((acc, lead) => acc + lead.interacciones, 0);
    }, [filteredLeads]);

    const COLORS = ['#60a5fa', '#2dd4bf', '#facc15', '#fb7185'];

    const KPICard: React.FC<{ title: string; value: string | number; description: string }> = ({ title, value, description }) => (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
            <p className="text-3xl font-bold text-maderas-blue mt-2">{value}</p>
            <p className="text-gray-400 text-xs mt-1">{description}</p>
        </div>
    );

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-maderas-blue">Dashboard de KPIs</h1>
                {role === Role.Lider && (
                    <select
                        value={selectedAsesor}
                        onChange={(e) => setSelectedAsesor(e.target.value)}
                        className="p-2 border rounded-md bg-white shadow-sm"
                    >
                        <option value="">Equipo Completo</option>
                        {activeAsesores.map(asesor => (
                            <option key={asesor.id} value={asesor.id}>{asesor.nombreCompleto}</option>
                        ))}
                    </select>
                )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <KPICard title="Total de Prospectos" value={filteredLeads.length} description="Prospectos activos en el embudo" />
                <KPICard title="Número de Citas" value={numeroDeCitas} description="Citas agendadas en el calendario" />
                <KPICard title="Tasa de Conversión" value={`${porcentajeConversion}%`} description="De prospecto a apartado" />
                <KPICard title="Total de Interacciones" value={totalInteracciones} description="Seguimientos realizados" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="font-bold text-lg text-maderas-blue mb-4">Prospectos Captados por Mes</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={prospectosPorMes}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="prospectos" fill="#60a5fa" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="font-bold text-lg text-maderas-blue mb-4">Lugar de Prospección</h3>
                    <ResponsiveContainer width="100%" height={300}>
                         <PieChart>
                            <Pie data={lugarDeProspeccion} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }: { name?: string, percent?: number }) => `${name} ${(percent! * 100).toFixed(0)}%`}>
                                {lugarDeProspeccion.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default KPIsDashboard;
