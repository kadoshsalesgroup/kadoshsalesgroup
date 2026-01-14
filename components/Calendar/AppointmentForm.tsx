
import React, { useState, useEffect } from 'react';
import { AppointmentType, Role } from '../../types';
import { useAppContext } from '../../context/AppContext';
import Modal from '../common/Modal';

interface AppointmentFormProps {
    isOpen: boolean;
    onClose: () => void;
    preSelectedDate?: Date | null;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({ isOpen, onClose, preSelectedDate }) => {
    const { addAppointment, asesores, currentUser, role } = useAppContext();
    const activeAsesores = asesores.filter(a => a.estatus === 'Activo');

    // Helper to format Date to input datetime-local string (YYYY-MM-DDTHH:MM)
    const toLocalISOString = (date: Date) => {
        const offset = date.getTimezoneOffset() * 60000; // offset in milliseconds
        const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
        return localISOTime;
    };

    const initialDate = preSelectedDate ? toLocalISOString(preSelectedDate) : toLocalISOString(new Date());

    const [formData, setFormData] = useState({
        type: AppointmentType.VisitaDesarrollo,
        date: initialDate,
        asesorId: (role === Role.Asesor && currentUser) ? currentUser.id : '',
        notes: ''
    });

    useEffect(() => {
        if (isOpen) {
             setFormData(prev => ({
                ...prev,
                date: preSelectedDate ? toLocalISOString(preSelectedDate) : toLocalISOString(new Date()),
                asesorId: (role === Role.Asesor && currentUser) ? currentUser.id : prev.asesorId
             }));
        }
    }, [isOpen, preSelectedDate, role, currentUser]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.asesorId) {
            alert('Por favor seleccione un asesor.');
            return;
        }

        // The date string from input type="datetime-local" is YYYY-MM-DDTHH:MM
        // We ensure it is stored as a full ISO string.
        const dateObj = new Date(formData.date);
        
        await addAppointment({
            type: formData.type as AppointmentType,
            date: dateObj.toISOString(),
            asesorId: formData.asesorId,
            notes: formData.notes
        });
        
        onClose();
    };
    
    const formInputClass = "w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-maderas-blue focus:border-transparent bg-white";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Agendar Cita">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de Cita</label>
                    <select name="type" value={formData.type} onChange={handleChange} className={formInputClass}>
                        {Object.values(AppointmentType).map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha y Hora</label>
                    <input 
                        type="datetime-local" 
                        name="date" 
                        value={formData.date} 
                        onChange={handleChange} 
                        required 
                        className={formInputClass} 
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Asesor Asignado</label>
                    <select 
                        name="asesorId" 
                        value={formData.asesorId} 
                        onChange={handleChange} 
                        required 
                        disabled={role === Role.Asesor} // Advisors can only assign to themselves
                        className={`${formInputClass} disabled:bg-gray-100 disabled:text-gray-500`}
                    >
                        <option value="">Seleccione un asesor</option>
                        {activeAsesores.map(a => (
                            <option key={a.id} value={a.id}>{a.nombreCompleto}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Notas / Descripción (Opcional)</label>
                    <textarea 
                        name="notes" 
                        value={formData.notes} 
                        onChange={handleChange} 
                        rows={3} 
                        className={formInputClass} 
                        placeholder="Detalles adicionales..."
                    />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button type="submit" className="bg-maderas-blue text-white px-4 py-2 rounded-md hover:bg-opacity-90">Agendar</button>
                </div>
            </form>
        </Modal>
    );
};

export default AppointmentForm;
