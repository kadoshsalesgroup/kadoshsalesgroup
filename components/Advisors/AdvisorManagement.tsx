
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Asesor, AsesorStatus } from '../../types';
import Modal from '../common/Modal';
import { PlusIcon, PencilIcon } from '../common/Icons';

const AdvisorForm: React.FC<{ isOpen: boolean; onClose: () => void; advisorToEdit?: Asesor | null; }> = ({ isOpen, onClose, advisorToEdit }) => {
    const { addAsesor, updateAsesor } = useAppContext();
    const [formData, setFormData] = useState({
        nombreCompleto: '',
        email: '',
        fechaIngreso: new Date().toISOString().split('T')[0],
        fechaNacimiento: '',
        estatus: AsesorStatus.Activo
    });

    useEffect(() => {
        if (advisorToEdit) {
            setFormData({
                nombreCompleto: advisorToEdit.nombreCompleto,
                email: advisorToEdit.email,
                fechaIngreso: advisorToEdit.fechaIngreso.split('T')[0],
                fechaNacimiento: advisorToEdit.fechaNacimiento ? advisorToEdit.fechaNacimiento.split('T')[0] : '',
                estatus: advisorToEdit.estatus
            });
        } else {
            setFormData({
                nombreCompleto: '',
                email: '',
                fechaIngreso: new Date().toISOString().split('T')[0],
                fechaNacimiento: '',
                estatus: AsesorStatus.Activo
            });
        }
    }, [advisorToEdit, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let success = false;
        if (advisorToEdit) {
            success = await updateAsesor({ ...advisorToEdit, ...formData });
        } else {
            success = await addAsesor(formData);
        }
        if (success) {
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={advisorToEdit ? 'Editar Asesor' : 'Agregar Asesor'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre completo</label>
                    <input type="text" name="nombreCompleto" value={formData.nombreCompleto} onChange={handleChange} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Fecha de nacimiento</label>
                        <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Fecha de ingreso</label>
                        <input type="date" name="fechaIngreso" value={formData.fechaIngreso} onChange={handleChange} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Estatus</label>
                    <select name="estatus" value={formData.estatus} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-white">
                        <option value={AsesorStatus.Activo}>Activo</option>
                        <option value={AsesorStatus.Inactivo}>Inactivo</option>
                    </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="bg-gray-200 px-4 py-2 rounded-md">Cancelar</button>
                    <button type="submit" className="bg-maderas-blue text-white px-4 py-2 rounded-md">{advisorToEdit ? 'Guardar Cambios' : 'Crear Asesor'}</button>
                </div>
            </form>
        </Modal>
    );
};

const AdvisorManagement = () => {
    const { asesores } = useAppContext();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [advisorToEdit, setAdvisorToEdit] = useState<Asesor | null>(null);

    const handleEdit = (asesor: Asesor) => {
        setAdvisorToEdit(asesor);
        setIsFormOpen(true);
    };

    const handleAdd = () => {
        setAdvisorToEdit(null);
        setIsFormOpen(true);
    };

    const formatBirthday = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });
    };

    const isTodayBirthday = (dateStr?: string) => {
        if (!dateStr) return false;
        const today = new Date();
        const birthday = new Date(dateStr);
        return today.getDate() === birthday.getDate() && today.getMonth() === birthday.getMonth();
    };

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-maderas-blue">Gestión de Asesores</h1>
                    <button onClick={handleAdd} className="flex items-center gap-2 bg-maderas-blue text-white px-4 py-2 rounded-md hover:bg-opacity-90">
                        <PlusIcon className="w-5 h-5" /> Agregar Asesor
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-4 py-3">Nombre completo</th>
                                <th className="px-4 py-3">Cumpleaños</th>
                                <th className="px-4 py-3">Correo Electrónico</th>
                                <th className="px-4 py-3">Fecha de ingreso</th>
                                <th className="px-4 py-3">Estatus</th>
                                <th className="px-4 py-3 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {asesores.map(asesor => (
                                <tr key={asesor.id} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-2 font-medium text-gray-900">
                                        {asesor.nombreCompleto}
                                        {isTodayBirthday(asesor.fechaNacimiento) && <span className="ml-2" title="¡Hoy es su cumpleaños!">🎂</span>}
                                    </td>
                                    <td className={`px-4 py-2 ${isTodayBirthday(asesor.fechaNacimiento) ? 'font-bold text-maderas-gold' : ''}`}>
                                        {formatBirthday(asesor.fechaNacimiento)}
                                    </td>
                                    <td className="px-4 py-2">{asesor.email}</td>
                                    <td className="px-4 py-2">{new Date(asesor.fechaIngreso).toLocaleDateString()}</td>
                                    <td className="px-4 py-2">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${asesor.estatus === AsesorStatus.Activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {asesor.estatus}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <button onClick={() => handleEdit(asesor)} className="text-blue-600 hover:text-blue-800 p-1">
                                            <PencilIcon className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <AdvisorForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} advisorToEdit={advisorToEdit} />
        </div>
    );
};

export default AdvisorManagement;
