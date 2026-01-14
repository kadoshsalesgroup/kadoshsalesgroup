import React, { useState, useEffect, useMemo } from 'react';
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

  // FIX: Made status check case-insensitive to prevent issues with data from the database (e.g., 'activo' vs 'Activo').
  // This ensures the advisor list populates correctly even with minor data inconsistencies.
  const selectableAsesores = useMemo(() => {
    const active = asesores.filter(a => a.estatus?.toLowerCase() === 'activo');
    if (leadToEdit?.asesorId) {
      const assignedAsesor = asesores.find(a => a.id === leadToEdit.asesorId);
      if (assignedAsesor && !active.some(a => a.id === assignedAsesor.id)) {
        return [...active, assignedAsesor].sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto));
      }
    }
    return active.sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto));
  }, [asesores, leadToEdit]);

  const [formData, setFormData] = useState({
    nombreCompletoProspecto: '',
    telefono: '',
    correo: '',
    fechaProspeccion: new Date().toISOString().split('T')[0],
    lugarProspeccion: '',
    interes: '',
    observaciones: '',
    estatus: StatusProspecto.NoContactado,
    ciudadOrigen: '',
    asesorId: '',
  });

  // FIX: Refactored state management to prevent bugs.
  // This effect now ONLY resets the form when the modal is opened, preventing accidental data loss if the user
  // starts typing before the advisor list has finished loading in the background.
  useEffect(() => {
    if (isOpen) {
      if (leadToEdit) {
        setFormData({
          ...leadToEdit,
          fechaProspeccion: leadToEdit.fechaProspeccion.split('T')[0],
        });
      } else {
        setFormData({
          nombreCompletoProspecto: '',
          telefono: '',
          correo: '',
          fechaProspeccion: new Date().toISOString().split('T')[0],
          lugarProspeccion: '',
          interes: '',
          observaciones: '',
          estatus: StatusProspecto.NoContactado,
          ciudadOrigen: '',
          asesorId: '', // Start with no advisor selected; the next effect will set it.
        });
      }
    }
  }, [leadToEdit, isOpen]);

  // This separate effect handles setting the default advisor for NEW leads once the list is available.
  // It runs without resetting the other form fields.
  useEffect(() => {
    if (isOpen && !leadToEdit && !formData.asesorId && selectableAsesores.length > 0) {
      let defaultAsesorId = '';
      if (role === Role.Asesor && currentUser) {
        defaultAsesorId = currentUser.id;
      } else if (selectableAsesores.length > 0) {
        // The list from useMemo is already sorted.
        defaultAsesorId = selectableAsesores[0].id;
      }

      if (defaultAsesorId) {
        setFormData(prev => ({ ...prev, asesorId: defaultAsesorId }));
      }
    }
  }, [isOpen, leadToEdit, selectableAsesores, currentUser, role, formData.asesorId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.asesorId) {
      alert("Por favor, seleccione un asesor.");
      return;
    }
    if (leadToEdit) {
      await updateLead({ ...leadToEdit, ...formData });
    } else {
      await addLead(formData);
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
            <label className="block text-sm font-medium text-gray-700">Nombre Completo Prospecto</label>
            <input type="text" name="nombreCompletoProspecto" value={formData.nombreCompletoProspecto} onChange={handleChange} required className={formInputClass} placeholder="Nombre del prospecto" />
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
            <select name="asesorId" value={formData.asesorId} onChange={handleChange} required className={formSelectClass} disabled={selectableAsesores.length === 0}>
              <option value="">{asesores.length === 0 ? 'Cargando asesores...' : 'Seleccione un asesor'}</option>
              {selectableAsesores.map(asesor => (
                <option key={asesor.id} value={asesor.id}>
                  {asesor.nombreCompleto} {asesor.estatus?.toLowerCase() !== 'activo' ? '(Inactivo)' : ''}
                </option>
              ))}
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