
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import LeadForm from './LeadForm';
import { PencilIcon, TrashIcon, PlusIcon, ArrowUpTrayIcon, ArrowDownTrayIcon } from '../common/Icons';
import { Lead, StatusProspecto, Role } from '../../types';
import { KANBAN_STAGES } from '../../constants';

// Declare XLSX and saveAs as global variables provided by the script tags in index.html
declare var XLSX: any;
declare var saveAs: any;

const DescarteModal: React.FC<{ lead: Lead; onClose: () => void; onConfirm: (motivo: string) => void }> = ({ lead, onClose, onConfirm }) => {
    const [motivo, setMotivo] = useState('');
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-4 border-b">
                    <h3 className="text-lg font-bold text-gray-800">Descartar Prospecto: {lead.nombreCompleto}</h3>
                </div>
                <div className="p-4">
                    <label className="block text-sm font-medium text-gray-700">Motivo de descarte</label>
                    <textarea value={motivo} onChange={e => setMotivo(e.target.value)} required rows={3} className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-maderas-blue"></textarea>
                </div>
                <div className="flex justify-end p-4 bg-gray-50 rounded-b-lg space-x-2">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button onClick={() => onConfirm(motivo)} disabled={!motivo} className="bg-red-600 text-white px-4 py-2 rounded-md disabled:bg-red-300 hover:bg-red-700">Confirmar Descarte</button>
                </div>
            </div>
        </div>
    );
};


const LeadsList = () => {
  const { leads, asesores, deleteLead, addMultipleLeads, updateLeadStatus, currentUser, role } = useAppContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);
  const [leadToDiscard, setLeadToDiscard] = useState<Lead | null>(null);
  const [filters, setFilters] = useState({
    estatus: '',
    asesorId: '',
    searchTerm: ''
  });

  const handleEdit = (lead: Lead) => {
    setLeadToEdit(lead);
    setIsFormOpen(true);
  };
  
  const handleAdd = () => {
    setLeadToEdit(null);
    setIsFormOpen(true);
  };

  const handleDelete = (leadId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este prospecto?')) {
      deleteLead(leadId);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters(prev => ({...prev, [e.target.name]: e.target.value}));
  }

  const handleStatusChange = (lead: Lead, newStatus: StatusProspecto) => {
    if (lead.estatus === newStatus) return;

    if (newStatus === StatusProspecto.Descartado) {
        setLeadToDiscard(lead);
    } else {
        updateLeadStatus(lead.id, newStatus);
    }
  };

  const handleConfirmDescarte = (motivo: string) => {
    if (leadToDiscard && motivo) {
        updateLeadStatus(leadToDiscard.id, StatusProspecto.Descartado, motivo);
    }
    setLeadToDiscard(null);
  };

  const filteredLeads = useMemo(() => {
    // PERMISSION RULE: Leaders can see all leads, while Advisors can only see records they created.
    const leadsForUser = (role === Role.Lider || !currentUser)
      ? leads
      : leads.filter(lead => lead.createdByEmail === currentUser.email);

    return leadsForUser.filter(lead => {
        const asesor = asesores.find(a => a.id === lead.asesorId);
        const searchTermLower = filters.searchTerm.toLowerCase();
        const searchMatch = 
            lead.nombreCompleto.toLowerCase().includes(searchTermLower) ||
            lead.correo.toLowerCase().includes(searchTermLower) ||
            lead.lugarProspeccion.toLowerCase().includes(searchTermLower) ||
            lead.interes.toLowerCase().includes(searchTermLower) ||
            lead.ciudadOrigen.toLowerCase().includes(searchTermLower) ||
            (asesor && asesor.nombreCompleto.toLowerCase().includes(searchTermLower));
        
        // Advisor filter is only available to Leaders.
        const asesorFilterMatch = role === Role.Lider ? (filters.asesorId ? lead.asesorId === filters.asesorId : true) : true;

        return (
            (filters.estatus ? lead.estatus === filters.estatus : true) &&
            asesorFilterMatch &&
            searchMatch
        );
    });
  }, [leads, asesores, filters, currentUser, role]);
  
  const handleExport = () => {
    const dataToExport = filteredLeads.map(lead => ({
        'Nombre completo': lead.nombreCompleto,
        'Teléfono': lead.telefono,
        'Correo': lead.correo,
        'Fecha de prospección': lead.fechaProspeccion,
        'Lugar de prospección': lead.lugarProspeccion,
        'Interés': lead.interes,
        'Observaciones': lead.observaciones,
        'Estatus': lead.estatus,
        'Ciudad de Origen': lead.ciudadOrigen,
        'Asesor': asesores.find(a => a.id === lead.asesorId)?.nombreCompleto || 'N/A'
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Prospectos");
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], {type: "application/octet-stream"});
    saveAs(data, 'prospectos_kadosh.xlsx');
  };

  const handleImport = () => {
     const input = document.createElement('input');
     input.type = 'file';
     input.accept = ".xlsx, .xls";
     input.onchange = (e) => {
         const file = (e.target as HTMLInputElement).files?.[0];
         if (!file) return;

         const reader = new FileReader();
         reader.onload = (event) => {
             try {
                 const data = new Uint8Array(event.target?.result as ArrayBuffer);
                 const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                 const sheetName = workbook.SheetNames[0];
                 const worksheet = workbook.Sheets[sheetName];
                 const json = XLSX.utils.sheet_to_json(worksheet);

                 if (json.length === 0) {
                     alert('El archivo Excel está vacío o no tiene el formato correcto.');
                     return;
                 }

                 let importedCount = 0;
                 let skippedCount = 0;
                 const leadsToImport: Omit<Lead, 'id' | 'interacciones' | 'createdByEmail'>[] = [];

                 json.forEach((row: any) => {
                     const advisorName = row['Asesor']?.trim();
                     const asesor = asesores.find(a => a.nombreCompleto.toLowerCase() === advisorName?.toLowerCase());
                     
                     if (!row['Nombre completo'] || !row['Teléfono'] || !asesor) {
                         console.warn(`Faltan datos (Nombre/Teléfono/Asesor válido) en la fila. Saltando:`, row);
                         skippedCount++;
                         return;
                     }
                     
                     const fechaProspeccionRaw = row['Fecha de prospección'];
                     let fechaProspeccion: string;

                     if (fechaProspeccionRaw instanceof Date) {
                         fechaProspeccion = fechaProspeccionRaw.toISOString().split('T')[0];
                     } else {
                         // Fallback for string dates if cellDates didn't work as expected
                         fechaProspeccion = new Date().toISOString().split('T')[0];
                     }

                     const newLeadData = {
                         nombreCompleto: row['Nombre completo'],
                         telefono: String(row['Teléfono']),
                         correo: row['Correo'] || '',
                         fechaProspeccion: fechaProspeccion,
                         lugarProspeccion: row['Lugar de prospección'] || '',
                         interes: row['Interés'] || '',
                         observaciones: row['Observaciones'] || '',
                         estatus: Object.values(StatusProspecto).includes(row['Estatus']) ? row['Estatus'] : StatusProspecto.NoContactado,
                         ciudadOrigen: row['Ciudad de Origen'] || '',
                         asesorId: asesor.id,
                     };
                     leadsToImport.push(newLeadData);
                     importedCount++;
                 });
                 
                 if (leadsToImport.length > 0) {
                    addMultipleLeads(leadsToImport);
                 }

                 alert(`Importación completada. ${importedCount} prospectos agregados, ${skippedCount} omitidos.`);

             } catch (error) {
                 console.error("Error al importar el archivo:", error);
                 alert("Ocurrió un error al importar el archivo. Verifique el formato y vuelva a intentarlo.");
             }
         };
         reader.readAsArrayBuffer(file);
     };
     input.click();
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {leadToDiscard && <DescarteModal lead={leadToDiscard} onClose={() => setLeadToDiscard(null)} onConfirm={handleConfirmDescarte} />}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
          <h1 className="text-2xl font-bold text-maderas-blue">Lista de Prospectos ({filteredLeads.length})</h1>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <button onClick={handleImport} className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-2 rounded-md hover:bg-green-200 text-sm">
                <ArrowUpTrayIcon className="w-4 h-4" /> Importar
            </button>
            <button onClick={handleExport} className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-200 text-sm">
                <ArrowDownTrayIcon className="w-4 h-4" /> Exportar
            </button>
            <button onClick={handleAdd} className="flex items-center gap-2 bg-maderas-blue text-white px-4 py-2 rounded-md hover:bg-opacity-90">
              <PlusIcon className="w-5 h-5" /> Agregar Prospecto
            </button>
          </div>
        </div>
        
        {/* Filters */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${role === Role.Lider ? 'lg:grid-cols-3' : ''} gap-3 mb-4 p-4 bg-gray-50 rounded-lg`}>
            <input type="text" name="searchTerm" placeholder="Buscar por nombre, ciudad, interés..." onChange={handleFilterChange} className="p-2 border rounded-md text-sm col-span-full lg:col-span-1"/>
            <select name="estatus" onChange={handleFilterChange} className="p-2 border rounded-md text-sm bg-white"><option value="">Estatus</option>{KANBAN_STAGES.map(s => <option key={s} value={s}>{s}</option>)}</select>
            {role === Role.Lider && (
                <select name="asesorId" onChange={handleFilterChange} className="p-2 border rounded-md text-sm bg-white"><option value="">Asesor</option>{asesores.map(a => <option key={a.id} value={a.id}>{a.nombreCompleto}</option>)}</select>
            )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-4 py-3">Nombre completo</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Fecha de prospección</th>
                <th className="px-4 py-3">Lugar de prospección</th>
                <th className="px-4 py-3">Interés</th>
                <th className="px-4 py-3">Observaciones</th>
                <th className="px-4 py-3">Estatus</th>
                <th className="px-4 py-3">Asesor</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map(lead => {
                  const asesor = asesores.find(a => a.id === lead.asesorId);
                  return (
                    <tr key={lead.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-900">{lead.nombreCompleto}</td>
                      <td className="px-4 py-2">{lead.telefono}</td>
                      <td className="px-4 py-2">{lead.correo}</td>
                      <td className="px-4 py-2">{new Date(lead.fechaProspeccion).toLocaleDateString()}</td>
                      <td className="px-4 py-2">{lead.lugarProspeccion}</td>
                      <td className="px-4 py-2">{lead.interes}</td>
                      <td className="px-4 py-2 text-gray-500 text-xs max-w-[200px] truncate" title={lead.observaciones}>{lead.observaciones}</td>
                      <td className="px-4 py-2">
                        <select
                          value={lead.estatus}
                          onChange={(e) => handleStatusChange(lead, e.target.value as StatusProspecto)}
                          className="w-full p-1.5 border border-gray-200 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-maderas-blue hover:border-gray-400"
                          aria-label={`Estatus de ${lead.nombreCompleto}`}
                        >
                          {KANBAN_STAGES.map(stage => (
                            <option key={stage} value={stage}>{stage}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">{asesor?.nombreCompleto || 'N/A'}</td>
                      <td className="px-4 py-2">
                        <div className="flex justify-center items-center gap-3">
                          <button onClick={() => handleEdit(lead)} className="text-blue-600 hover:text-blue-800"><PencilIcon /></button>
                          <button onClick={() => handleDelete(lead.id)} className="text-red-600 hover:text-red-800"><TrashIcon /></button>
                        </div>
                      </td>
                    </tr>
                  )
              })}
            </tbody>
          </table>
        </div>
      </div>
      <LeadForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} leadToEdit={leadToEdit} />
    </div>
  );
};

export default LeadsList;
