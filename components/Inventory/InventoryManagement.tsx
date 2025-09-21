
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Lot, LotStatus } from '../../types';
import { PlusIcon, PencilIcon, TrashIcon } from '../common/Icons';
import { formatCurrencyMXN } from '../../lib/utils';
import LotForm from './LotForm';

const InventoryManagement: React.FC = () => {
    const { inventory, deleteLot, ventas } = useAppContext();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [lotToEdit, setLotToEdit] = useState<Lot | null>(null);
    const [filter, setFilter] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');

    const handleEdit = (lot: Lot) => {
        setLotToEdit(lot);
        setIsFormOpen(true);
    };

    const handleAdd = () => {
        setLotToEdit(null);
        setIsFormOpen(true);
    };

    const handleDelete = (lotId: string, lotName: string) => {
        const isLotInSale = ventas.some(v => v.nombreLote === lotName && v.estatusProceso === 'En Progreso');
        if (isLotInSale) {
            alert('No se puede eliminar un lote que está asociado a una venta en progreso.');
            return;
        }
        if (window.confirm('¿Está seguro de que desea eliminar este lote? Esta acción no se puede deshacer.')) {
            deleteLot(lotId);
        }
    };

    const getStatusChip = (status: LotStatus) => {
        const styles: Record<LotStatus, string> = {
            [LotStatus.Disponible]: 'bg-emerald-100 text-emerald-800',
            [LotStatus.Apartado]: 'bg-amber-100 text-amber-800',
            [LotStatus.Vendido]: 'bg-rose-100 text-rose-800',
        };
        return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>{status}</span>;
    };
    
    const filteredInventory = useMemo(() => {
        return inventory
            .filter(lot => (filter ? lot.estatus === filter : true))
            .filter(lot => lot.nombreLote.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [inventory, filter, searchTerm]);

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <h1 className="text-2xl font-bold text-maderas-blue">Gestión de Inventario ({filteredInventory.length})</h1>
                    <button onClick={handleAdd} className="flex items-center gap-2 bg-maderas-blue text-white px-4 py-2 rounded-md hover:bg-opacity-90">
                        <PlusIcon className="w-5 h-5" /> Agregar Lote
                    </button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 p-4 bg-gray-50 rounded-lg">
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre de lote..." 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="p-2 border rounded-md text-sm col-span-full sm:col-span-1"
                    />
                    <select 
                        onChange={(e) => setFilter(e.target.value)} 
                        className="p-2 border rounded-md text-sm bg-white"
                    >
                        <option value="">Todos los Estatus</option>
                        {Object.values(LotStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-4 py-3">Nombre del Lote</th>
                                <th className="px-4 py-3">Precio</th>
                                <th className="px-4 py-3">Estatus</th>
                                <th className="px-4 py-3 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInventory.map(lot => (
                                <tr key={lot.id} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-2 font-medium text-gray-900">{lot.nombreLote}</td>
                                    <td className="px-4 py-2">{formatCurrencyMXN(lot.precio)}</td>
                                    <td className="px-4 py-2">{getStatusChip(lot.estatus)}</td>
                                    <td className="px-4 py-2">
                                        <div className="flex justify-center items-center gap-3">
                                            <button onClick={() => handleEdit(lot)} className="text-blue-600 hover:text-blue-800"><PencilIcon /></button>
                                            <button onClick={() => handleDelete(lot.id, lot.nombreLote)} className="text-red-600 hover:text-red-800"><TrashIcon /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                             {filteredInventory.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center py-4 text-gray-500">
                                       No se encontraron lotes con los filtros actuales.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <LotForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} lotToEdit={lotToEdit} />
        </div>
    );
};

export default InventoryManagement;
