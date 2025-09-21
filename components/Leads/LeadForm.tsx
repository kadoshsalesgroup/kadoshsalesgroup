import React, { useState, useEffect } from 'react';
import { Lead, StatusProspecto, Role } from '../../types';
import { useAppContext } from '../../context/AppContext';
import Modal from '../common/Modal';
import { KANBAN_STAGES } from '../../constants';

interface LeadFormProps {
  isOpen: boolean;
  onClose: () => void;
  leadToEdit?: Lead | null;
}

const LeadForm: React.FC<LeadFormProps> = ({ isOpen, onClose, leadToEdit }) => {
  const { addLead, updateLead, asesores, currentUser, role } = useAppContext();
  
  const getDefaultAsesorId = () => {
    if (role === Role.Asesor && currentUser) {
      return currentUser.id;
    }
    // For Lider role, or as a fallback, default to the first active advisor
    const firstActive = asesores.find(a => a.estatus === 'Activo');
    return firstActive ? firstActive.id : '';
  };

  const initialFormState = {
    nombreCompleto: '',
    telefono: '',
    correo: '',
    fechaProspeccion: new Date().toISOString().split('T')[0],
    lugarProspeccion: '',
    interes: '',
    observaciones: '',
    estatus: StatusProspecto.NoContactado,
    ciudadOrigen: '',
    asesorId: getDefaultAsesorId(),
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (leadToEdit) {
      setFormData({
        ...leadToEdit,
        fechaProspeccion: leadToEdit.fechaProspeccion.split('T')[0]
      });
    } else {
      resetForm();
    }
  }, [leadToEdit, isOpen, currentUser, role]);

  const resetForm = () => {
    setFormData({
      ...initialFormState,
      asesorId: getDefaultAsesorId(),
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.asesorId) {
      alert("Por favor, seleccione un asesor.");
      return;
    }
    if (leadToEdit) {
      updateLead({ ...leadToEdit, ...formData });
    } else {
      addLead(formData);
    }
    onClose();
  };
  
  const formInputClass = "w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-maderas-blue focus:border-transparent bg-white text-black placeholder-gray-500";
  const formSelectClass = "w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-maderas-blue focus:border-transparent bg-white text-black";


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={leadToEdit ? 'Editar Prospecto' : 'Agregar Prospecto'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre completo</label>
            <input type="text" name="nombreCompleto" value={formData.nombreCompleto} onChange={handleChange} required className={formInputClass} placeholder="Nombre del prospecto" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Teléfono</label>
            <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} required className={formInputClass} placeholder="5512345678" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Correo</label>
            <input type="email" name="correo" value={formData.correo} onChange={handleChange} className={formInputClass} placeholder="prospecto@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha de prospección</label>
            <input type="date" name="fechaProspeccion" value={formData.fechaProspeccion} onChange={handleChange} required className={formInputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Lugar de prospección</label>
            <input type="text" name="lugarProspeccion" value={formData.lugarProspeccion} onChange={handleChange} className={formInputClass} placeholder="Ej: Oficina, Digital" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Interés</label>
            <input type="text" name="interes" value={formData.interes} onChange={handleChange} className={formInputClass} placeholder="Ej: Inversión, Vivir" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Estatus</label>
            <select name="estatus" value={formData.estatus} onChange={handleChange} className={formSelectClass}>
              {KANBAN_STAGES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Ciudad de Origen</label>
            <input type="text" name="ciudadOrigen" value={formData.ciudadOrigen} onChange={handleChange} className={formInputClass} placeholder="Ej: Querétaro, CDMX" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Asesor</label>
            <select name="asesorId" value={formData.asesorId} onChange={handleChange} required className={formSelectClass}>
              <option value="">Seleccione un asesor</option>
              {asesores.filter(a => a.estatus === 'Activo').map(asesor => <option key={asesor.id} value={asesor.id}>{asesor.nombreCompleto}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Observaciones</label>
          <textarea name="observaciones" value={formData.observaciones} onChange={handleChange} rows={3} className={formInputClass} placeholder="Añadir notas sobre el prospecto..."></textarea>
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Cancelar</button>
          <button type="submit" className="bg-maderas-blue text-white px-4 py-2 rounded-md hover:bg-opacity-90">{leadToEdit ? 'Guardar Cambios' : 'Crear Prospecto'}</button>
        </div>
      </form>
    </Modal>
  );
};

export default LeadForm;