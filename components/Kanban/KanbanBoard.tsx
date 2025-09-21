
import React, { useState, useMemo, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { KANBAN_STAGES, STAGE_COLORS } from '../../constants';
import { StatusProspecto, Lead, Role } from '../../types';

const KanbanCard: React.FC<{ lead: Lead; asesorName: string }> = ({ lead, asesorName }) => (
    <div 
      draggable="true"
      onDragStart={(e) => e.dataTransfer.setData('leadId', lead.id)}
      className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing"
    >
      <p className="font-bold text-sm text-gray-800">{lead.nombreCompleto}</p>
      <p className="text-xs text-gray-500">{asesorName}</p>
      <p className="text-xs text-gray-500 mt-1">{lead.interes}</p>
    </div>
);

const DescarteModal: React.FC<{ lead: Lead; onClose: () => void; onConfirm: (motivo: string) => void }> = ({ lead, onClose, onConfirm }) => {
    const [motivo, setMotivo] = useState('');
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-4 border-b">
                    <h3 className="text-lg font-bold">Descartar Prospecto: {lead.nombreCompleto}</h3>
                </div>
                <div className="p-4">
                    <label className="block text-sm font-medium text-gray-700">Motivo de descarte</label>
                    <textarea value={motivo} onChange={e => setMotivo(e.target.value)} required rows={3} className="w-full mt-1 p-2 border border-gray-300 rounded-md"></textarea>
                </div>
                <div className="flex justify-end p-4 bg-gray-50 rounded-b-lg space-x-2">
                    <button onClick={onClose} className="bg-gray-200 px-4 py-2 rounded-md">Cancelar</button>
                    <button onClick={() => onConfirm(motivo)} disabled={!motivo} className="bg-red-600 text-white px-4 py-2 rounded-md disabled:bg-red-300">Confirmar Descarte</button>
                </div>
            </div>
        </div>
    );
};

const KanbanColumn: React.FC<{ status: StatusProspecto; leads: Lead[]; asesoresMap: Map<string, string> }> = ({ status, leads, asesoresMap }) => {
    const stageColor = STAGE_COLORS[status];

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    return (
        <div 
            onDragOver={handleDragOver}
            data-status={status}
            className={`${stageColor.bg} rounded-lg w-72 flex-shrink-0 shadow-md`}
        >
            <h3 className={`font-bold ${stageColor.text} ${stageColor.headerBg} p-3 text-center rounded-t-lg`}>{status} ({leads.length})</h3>
            <div className="p-3 space-y-3 min-h-[100px]">
                {leads.map(lead => (
                    <KanbanCard key={lead.id} lead={lead} asesorName={asesoresMap.get(lead.asesorId) || 'N/A'}/>
                ))}
            </div>
        </div>
    );
};


const KanbanBoard = () => {
    const { leads, asesores, updateLeadStatus, currentUser, role } = useAppContext();
    const [selectedAsesor, setSelectedAsesor] = useState<string>('');
    const [leadToDiscard, setLeadToDiscard] = useState<Lead | null>(null);

    const activeAsesores = useMemo(() => asesores.filter(a => a.estatus === 'Activo'), [asesores]);
    const asesoresMap = useMemo(() => new Map(asesores.map(a => [a.id, a.nombreCompleto])), [asesores]);

    const filteredLeads = useMemo(() => {
        // PERMISSION RULE: Leaders see all leads, while Advisors can only see records they created.
        const leadsForUser = (role === Role.Lider || !currentUser)
            ? leads
            : leads.filter(lead => lead.createdByEmail === currentUser.email);

        // Further filter by selected advisor (only for leaders)
        if (role === Role.Lider && selectedAsesor) {
            return leadsForUser.filter(lead => lead.asesorId === selectedAsesor);
        }

        return leadsForUser;
    }, [leads, selectedAsesor, currentUser, role]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const target = e.target as HTMLElement;
        const columnElement = target.closest<HTMLElement>('[data-status]');
        
        if (!columnElement) return;

        const newStatus = columnElement.dataset.status as StatusProspecto;
        const leadId = e.dataTransfer.getData('leadId');
        const lead = leads.find(l => l.id === leadId);

        if (lead && newStatus && lead.estatus !== newStatus) {
            if (newStatus === StatusProspecto.Descartado) {
                setLeadToDiscard(lead);
            } else {
                updateLeadStatus(leadId, newStatus);
            }
        }
    }, [leads, updateLeadStatus]);

    const handleConfirmDescarte = (motivo: string) => {
        if (leadToDiscard && motivo) {
            updateLeadStatus(leadToDiscard.id, StatusProspecto.Descartado, motivo);
        }
        setLeadToDiscard(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    return (
        <div className="p-4 md:p-6 lg:p-8">
            {leadToDiscard && <DescarteModal lead={leadToDiscard} onClose={() => setLeadToDiscard(null)} onConfirm={handleConfirmDescarte} />}
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <h1 className="text-2xl font-bold text-maderas-blue">Proceso de Venta</h1>
                {role === Role.Lider && (
                    <div>
                        <select
                            value={selectedAsesor}
                            onChange={(e) => setSelectedAsesor(e.target.value)}
                            className="p-2 border rounded-md bg-white shadow-sm"
                        >
                            <option value="">Todos los Asesores</option>
                            {activeAsesores.map(asesor => (
                                <option key={asesor.id} value={asesor.id}>{asesor.nombreCompleto}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
            <div className="flex gap-4 overflow-x-auto p-4" onDrop={handleDrop} onDragOver={handleDragOver}>
                {KANBAN_STAGES.map(status => (
                    <KanbanColumn 
                        key={status}
                        status={status} 
                        leads={filteredLeads.filter(lead => lead.estatus === status)}
                        asesoresMap={asesoresMap}
                    />
                ))}
            </div>
        </div>
    );
};

export default KanbanBoard;
