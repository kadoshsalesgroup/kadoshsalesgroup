
import React, { useState, useEffect } from 'react';
import { Lot, LotStatus } from '../../types';
import { useAppContext } from '../../context/AppContext';
import Modal from '../common/Modal';

interface LotFormProps {
  isOpen: boolean;
  onClose: () => void;
  lotToEdit?: Lot | null;
}

const LotForm: React.FC<LotFormProps> = ({ isOpen, onClose, lotToEdit }) => {
  const { addLot, updateLot } = useAppContext();
  const [formData, setFormData] = useState({
    nombreLote: '',
    precio: 0,
    estatus: LotStatus.Disponible
  });

  useEffect(() => {
    if (lotToEdit) {
      setFormData(lotToEdit);
    } else {
      setFormData({
        nombreLote: '',
        precio: 0,
        estatus: LotStatus.Disponible
      });
    }
  }, [lotToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
        ...prev, 
        [name]: name === 'precio' ? parseFloat(value) || 0 : value 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lotToEdit) {
      updateLot({ ...lotToEdit, ...formData });
    } else {
      addLot(formData);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={lotToEdit ? 'Editar Lote' : 'Agregar Lote'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre del Lote</label>
          <input type="text" name="nombreLote" value={formData.nombreLote} onChange={handleChange} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Precio (MXN)</label>
          <input type="number" name="precio" value={formData.precio} onChange={handleChange} required min="0" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Estatus</label>
          <select name="estatus" value={formData.estatus} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-white">
            <option value={LotStatus.Disponible}>Disponible</option>
            <option value={LotStatus.Apartado}>Apartado</option>
            <option value={LotStatus.Vendido}>Vendido</option>
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} className="bg-gray-200 px-4 py-2 rounded-md">Cancelar</button>
          <button type="submit" className="bg-maderas-blue text-white px-4 py-2 rounded-md">{lotToEdit ? 'Guardar Cambios' : 'Crear Lote'}</button>
        </div>
      </form>
    </Modal>
  );
};

export default LotForm;
