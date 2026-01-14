
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { AppointmentType, Appointment } from '../../types';
import AppointmentForm from './AppointmentForm';
import { PlusIcon } from '../common/Icons';

const TYPE_COLORS: Record<AppointmentType, string> = {
    [AppointmentType.VisitaDesarrollo]: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    [AppointmentType.Zoom]: 'bg-blue-100 text-blue-800 border-blue-200',
    [AppointmentType.Videollamada]: 'bg-purple-100 text-purple-800 border-purple-200',
    [AppointmentType.VisitaOficina]: 'bg-amber-100 text-amber-800 border-amber-200',
};

const CalendarView = () => {
    const { appointments, asesores } = useAppContext();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedDateForForm, setSelectedDateForForm] = useState<Date | null>(null);

    // Calendar Navigation Logic
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday

    const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const handleToday = () => setCurrentDate(new Date());

    const handleDayClick = (day: number) => {
        const date = new Date(year, month, day, 10, 0); // Default to 10:00 AM
        setSelectedDateForForm(date);
        setIsFormOpen(true);
    };

    const handleAddClick = () => {
        setSelectedDateForForm(new Date());
        setIsFormOpen(true);
    };

    // Data Filtering
    const monthlyAppointments = useMemo(() => {
        return appointments.filter(app => {
            const appDate = new Date(app.date);
            return appDate.getMonth() === month && appDate.getFullYear() === year;
        });
    }, [appointments, month, year]);

    // Grid Generation
    const renderCalendarGrid = () => {
        const days = [];
        // Empty slots for days before the 1st
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="h-28 md:h-36 bg-gray-50 border border-gray-100"></div>);
        }

        // Day slots
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
            
            const dayAppointments = monthlyAppointments
                .filter(app => new Date(app.date).getDate() === day)
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            days.push(
                <div 
                    key={day} 
                    className={`h-28 md:h-36 border border-gray-200 p-1 md:p-2 overflow-y-auto cursor-pointer hover:bg-gray-50 transition-colors ${isToday ? 'bg-blue-50/50' : 'bg-white'}`}
                    onClick={() => handleDayClick(day)}
                >
                    <div className="flex justify-between items-start mb-1">
                        <span className={`text-sm font-semibold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-maderas-blue text-white' : 'text-gray-700'}`}>
                            {day}
                        </span>
                        {dayAppointments.length > 0 && <span className="text-xs text-gray-400 hidden md:inline">{dayAppointments.length} citas</span>}
                    </div>
                    
                    <div className="space-y-1">
                        {dayAppointments.map(app => {
                            const asesor = asesores.find(a => a.id === app.asesorId);
                            const time = new Date(app.date).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
                            return (
                                <div key={app.id} className={`text-[10px] md:text-xs p-1 rounded border truncate ${TYPE_COLORS[app.type] || 'bg-gray-100'}`} title={`${time} - ${asesor?.nombreCompleto || 'Desconocido'} - ${app.notes || ''}`}>
                                    <span className="font-bold mr-1">{time}</span>
                                    <span className="opacity-90">{asesor?.nombreCompleto.split(' ')[0]}</span>
                                    <span className="hidden md:inline"> - {app.type}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }
        return days;
    };

    const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    return (
        <div className="p-4 md:p-6 lg:p-8 h-screen flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-maderas-blue">Calendario de Actividades</h1>
                    <div className="flex bg-white rounded-md shadow-sm border border-gray-300">
                        <button onClick={handlePrevMonth} className="px-3 py-1 hover:bg-gray-100 text-gray-600 border-r border-gray-300">
                            &lt;
                        </button>
                        <button onClick={handleToday} className="px-3 py-1 hover:bg-gray-100 text-sm font-medium text-gray-700 border-r border-gray-300">
                            Hoy
                        </button>
                        <button onClick={handleNextMonth} className="px-3 py-1 hover:bg-gray-100 text-gray-600">
                            &gt;
                        </button>
                    </div>
                    <h2 className="text-xl font-semibold capitalize text-gray-700 w-40 text-center">
                        {currentDate.toLocaleString('es-MX', { month: 'long', year: 'numeric' })}
                    </h2>
                </div>
                
                <button onClick={handleAddClick} className="flex items-center gap-2 bg-maderas-blue text-white px-4 py-2 rounded-md hover:bg-opacity-90 shadow-sm">
                    <PlusIcon className="w-5 h-5" /> Nueva Cita
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-200 flex-grow flex flex-col overflow-hidden">
                {/* Header Row */}
                <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 text-center">
                    {daysOfWeek.map(d => (
                        <div key={d} className="py-2 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                            {d}
                        </div>
                    ))}
                </div>
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 flex-grow auto-rows-fr overflow-y-auto">
                    {renderCalendarGrid()}
                </div>
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 text-xs shrink-0">
                {Object.entries(TYPE_COLORS).map(([type, colorClass]) => (
                    <div key={type} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full border ${colorClass.split(' ')[0]} ${colorClass.split(' ').find(c => c.startsWith('border'))}`}></div>
                        <span className="text-gray-600">{type}</span>
                    </div>
                ))}
            </div>

            <AppointmentForm 
                isOpen={isFormOpen} 
                onClose={() => setIsFormOpen(false)} 
                preSelectedDate={selectedDateForForm}
            />
        </div>
    );
};

export default CalendarView;
