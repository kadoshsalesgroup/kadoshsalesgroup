
import React, { useState, useEffect } from 'react';
import { Venta, SaleStage, SaleStatus } from '../../types';
import { useAppContext } from '../../context/AppContext';
import Modal from '../common/Modal';
import { ALL_SALE_STAGES } from '../../constants';

interface SalesFormProps {
  isOpen: boolean;
  onClose: () => void;
  ventaToEdit?: Venta | null;
}

const SalesForm: React.FC<SalesFormProps> = ({ isOpen, onClose, ventaToEdit }) => {
  const { addVenta, updateVenta, asesores } = useAppContext();
  const activeAsesores = asesores.filter(a => a.estatus === 'Activo');

  const initialFormData = {
    nombreLote: '',
    nombreCliente: '',
    monto: 0,
    fechaInicioProceso: new Date().toISOString().split('T')[0],
    etapaProceso: SaleStage.Apartado,
    asesorPrincipalId: activeAsesores.length > 0 ? activeAsesores[0].id : '',
    asesorSecundarioId: '',
    estatusProceso: SaleStatus.InProgress,
    fechaCierre: '',
    observaciones: '',
  };
  
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (ventaToEdit) {
      setFormData({
        nombreLote: ventaToEdit.nombreLote,
        nombreCliente: ventaToEdit.nombreCliente,
        monto: ventaToEdit.monto,
        fechaInicioProceso: ventaToEdit.fechaInicioProceso.split('T')[0],
        etapaProceso: ventaToEdit.etapaProceso,
        asesorPrincipalId: ventaToEdit.asesorPrincipalId,
        asesorSecundarioId: ventaToEdit.asesorSecundarioId || '',
        estatusProceso: ventaToEdit.estatusProceso,
        fechaCierre: ventaToEdit.fechaCierre ? ventaToEdit.fechaCierre.split('T')[0] : '',
        observaciones: ventaToEdit.observaciones || ''
      });
    } else {
      setFormData(initialFormData);
    }
  }, [ventaToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
        ...prev, 
        [name]: name === 'monto' ? parseFloat(value) || 0 : value 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.asesorPrincipalId) {
      alert("Por favor, seleccione un asesor principal.");
      return;
    }
     if (!formData.nombreLote.trim()) {
      alert("Por favor, ingrese un nombre de lote.");
      return;
    }
    const dataToSave = {
        ...formData,
        asesorSecundarioId: formData.asesorSecundarioId || undefined,
        fechaCierre: formData.fechaCierre || undefined,
        estatusProceso: (formData.etapaProceso === SaleStage.Contratado || formData.etapaProceso === SaleStage.Cancelado) ? SaleStatus.Closed : SaleStatus.InProgress
    };
    if (ventaToEdit) {
      updateVenta({ ...ventaToEdit, ...dataToSave });
    } else {
      addVenta(dataToSave);
    }
    onClose();
  };
  
  const formInputClass = "w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-maderas-blue focus:border-transparent";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={ventaToEdit ? 'Editar Venta' : 'Registrar Venta'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
            <label className="block text-sm font-medium text-gray-700">Nombre del lote</label>
            <input type="text" name="nombreLote" value={formData.nombreLote} onChange={handleChange} required className={formInputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre del cliente</label>
            <input type="text" name="nombreCliente" value={formData.nombreCliente} onChange={handleChange} required className={formInputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Monto (MXN)</label>
            <input type="number" name="monto" value={formData.monto} onChange={handleChange} required min="0" className={formInputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha de inicio del proceso</label>
            <input type="date" name="fechaInicioProceso" value={formData.fechaInicioProceso} onChange={handleChange} required className={formInputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Etapa del proceso</label>
            <select name="etapaProceso" value={formData.etapaProceso} onChange={handleChange} className={`${formInputClass} bg-white`}>
              {ALL_SALE_STAGES.map(stage => <option key={stage} value={stage}>{stage}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha de cierre (opcional)</label>
            <input type="date" name="fechaCierre" value={formData.fechaCierre} onChange={handleChange} className={formInputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Asesor principal</label>
            <select name="asesorPrincipalId" value={formData.asesorPrincipalId} onChange={handleChange} required className={`${formInputClass} bg-white`}>
              <option value="">Seleccione...</option>
              {activeAsesores.map(a => <option key={a.id} value={a.id}>{a.nombreCompleto}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Asesor secundario (opcional)</label>
            <select name="asesorSecundarioId" value={formData.asesorSecundarioId} onChange={handleChange} className={`${formInputClass} bg-white`}>
              <option value="">Ninguno</option>
              {activeAsesores.filter(a => a.id !== formData.asesorPrincipalId).map(a => <option key={a.id} value={a.id}>{a.nombreCompleto}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Observaciones (max 50 caracteres)</label>
          <textarea name="observaciones" value={formData.observaciones} onChange={handleChange} rows={2} maxLength={50} className={formInputClass}></textarea>
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Cancelar</button>
          <button type="submit" className="bg-maderas-blue text-white px-4 py-2 rounded-md hover:bg-opacity-90">{ventaToEdit ? 'Guardar Cambios' : 'Registrar Venta'}</button>
        </div>
      </form>
    </Modal>
  );
};

export default SalesForm;
