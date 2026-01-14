
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { KANBAN_STAGES, STAGE_COLORS } from '../../constants';
import { StatusProspecto, Lead, Role } from '../../types';
import {
    XMarkIcon,
    UserCircleIcon,
    PhoneIcon,
    EnvelopeIcon,
    TagIcon,
    CalendarDaysIcon,
    MapPinIcon,
    ClipboardDocumentIcon,
    CheckCircleIcon
} from '../common/Icons';

const getIndicator = (lead: Lead): '🔔' | '✅' | '' => {
    const obs = lead.observaciones?.toLowerCase() || '';
    const requestedHelp = obs.includes("llamada de calidad") || obs.includes("solicita apoyo");
    const isResolved = obs.includes("atendido") || obs.includes("resuelto");

    if (requestedHelp && !isResolved) {
        return "🔔";
    }
    if (isResolved) {
        return "✅";
    }
    return "";
};

const KanbanCard: React.FC<{ lead: Lead; asesorName: string; onClick: () => void }> = ({ lead, asesorName, onClick }) => {
    const indicator = getIndicator(lead);
    const cardClass = indicator === '🔔' ? 'bg-yellow-100' : 'bg-white';

    return (
        <div 
          onClick={onClick}
          draggable="true"
          onDragStart={(e) => e.dataTransfer.setData('leadId', lead.id)}
          className={`${cardClass} p-3 rounded-lg shadow-sm border border-gray-200 cursor-pointer active:cursor-grabbing hover:shadow-md transition-shadow`}
        >
            <p className="font-bold text-sm text-gray-800">
                {indicator && <span className="mr-2">{indicator}</span>}
                {lead.nombreCompletoProspecto}
            </p>
            <p className="text-xs text-gray-500">{asesorName}</p>
            <p className="text-xs text-gray-500 mt-1 truncate" title={lead.interes}>{lead.interes}</p>
        </div>
    );
};

const DescarteModal: React.FC<{ lead: Lead; onClose: () => void; onConfirm: (motivo: string) => void }> = ({ lead, onClose, onConfirm }) => {
    const [motivo, setMotivo] = useState('');
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-4 border-b">
                    <h3 className="text-lg font-bold">Descartar Prospecto: {lead.nombreCompletoProspecto}</h3>
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

const KanbanColumn: React.FC<{
    status: StatusProspecto;
    leads: Lead[];
    asesoresMap: Map<string, string>;
    onDrop: (status: StatusProspecto, e: React.DragEvent<HTMLDivElement>) => void;
    onCardClick: (lead: Lead) => void;
}> = ({ status, leads, asesoresMap, onDrop, onCardClick }) => {
    const [isDraggedOver, setIsDraggedOver] = useState(false);
    const stageColor = STAGE_COLORS[status];

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDraggedOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        setIsDraggedOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation(); 
        setIsDraggedOver(false);
        onDrop(status, e);
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            data-status={status}
            className={`${stageColor.bg} rounded-lg w-72 flex-shrink-0 shadow-md transition-all duration-200 ${isDraggedOver ? 'ring-2 ring-maderas-blue' : ''}`}
        >
            <h3 className={`font-bold ${stageColor.text} ${stageColor.headerBg} p-3 text-center rounded-t-lg sticky top-0`}>{status} ({leads.length})</h3>
            <div className="p-3 space-y-3 min-h-[100px]">
                {leads.map(lead => (
                    <KanbanCard key={lead.id} lead={lead} asesorName={asesoresMap.get(lead.asesorId) || 'N/A'} onClick={() => onCardClick(lead)} />
                ))}
            </div>
        </div>
    );
};

const LeadDetailPanel: React.FC<{ lead: Lead | null; onClose: () => void; }> = ({ lead, onClose }) => {
    const { updateLead, updateLeadStatus, asesores } = useAppContext();
    const [observaciones, setObservaciones] = useState('');
    const [status, setStatus] = useState<StatusProspecto>(StatusProspecto.NoContactado);
    const [copySuccess, setCopySuccess] = useState('');

    useEffect(() => {
        if (lead) {
            setObservaciones(lead.observaciones || '');
            setStatus(lead.estatus);
        }
    }, [lead]);

    const handleSaveObservations = useCallback(async (newObservations: string) => {
        if (lead) {
            await updateLead({ ...lead, observaciones: newObservations });
        }
    }, [lead, updateLead]);
    
    const handleObservationsBlur = () => {
        if(lead && observaciones !== (lead.observaciones || '')) {
            handleSaveObservations(observaciones);
        }
    }

    const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (lead) {
            const newStatus = e.target.value as StatusProspecto;
            setStatus(newStatus);
            await updateLeadStatus(lead.id, newStatus);
        }
    };

    const handleMarkAsAttended = async () => {
        if (lead) {
            const timestamp = new Date().toLocaleString('es-MX');
            const newObservations = `${observaciones}\n- Llamada de calidad ATENDIDA (${timestamp}).`;
            setObservaciones(newObservations);
            await updateLead({ ...lead, observaciones: newObservations });
        }
    };

    const handleCopyPhone = () => {
        if (lead) {
            navigator.clipboard.writeText(lead.telefono).then(() => {
                setCopySuccess('¡Copiado!');
                setTimeout(() => setCopySuccess(''), 2000);
            }, () => {
                setCopySuccess('Error');
            });
        }
    };
    
    const panelClasses = lead 
        ? "translate-x-0" 
        : "translate-x-full";

    const asesor = lead ? asesores.find(a => a.id === lead.asesorId) : null;

    const DetailItem: React.FC<{icon: React.ReactNode, label: string, value?: string, children?: React.ReactNode}> = ({ icon, label, value, children }) => (
      <div>
        <label className="text-xs font-semibold text-gray-500">{label}</label>
        <div className="flex items-center mt-1 text-sm text-gray-800">
          <span className="text-gray-400 mr-3">{icon}</span>
          <div className="flex-1 min-w-0">
             {value && <p className="truncate" title={value}>{value}</p>}
             {children}
          </div>
        </div>
      </div>
    );
    
    return (
        <>
            {lead && <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={onClose} aria-hidden="true"></div>}
            <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-lg z-50 transform transition-transform ease-in-out duration-300 flex flex-col ${panelClasses}`}
                 role="dialog" aria-modal="true" aria-labelledby="lead-details-heading">
                
                {lead && (
                    <>
                        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                            <h2 id="lead-details-heading" className="text-lg font-bold text-maderas-blue truncate pr-2">{lead.nombreCompletoProspecto}</h2>
                            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-200">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-grow overflow-y-auto p-5 space-y-5">
                            <DetailItem icon={<UserCircleIcon />} label="Asesor" value={asesor?.nombreCompleto || 'N/A'} />
                            <DetailItem icon={<PhoneIcon />} label="Teléfono">
                                <div className="flex items-center justify-between">
                                    <a href={`tel:${lead.telefono}`} className="text-blue-600 hover:underline">{lead.telefono}</a>
                                    <button onClick={handleCopyPhone} className="flex items-center text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-md ml-2">
                                        <ClipboardDocumentIcon className="w-4 h-4 mr-1" /> {copySuccess || 'Copiar'}
                                    </button>
                                </div>
                            </DetailItem>
                            <DetailItem icon={<EnvelopeIcon />} label="Correo" value={lead.correo || 'No proporcionado'} />
                            <DetailItem icon={<TagIcon />} label="Interés" value={lead.interes || 'No especificado'} />
                            <DetailItem icon={<CalendarDaysIcon />} label="Fecha de Prospección" value={new Date(lead.fechaProspeccion).toLocaleDateString('es-MX')} />
                            <DetailItem icon={<MapPinIcon />} label="Lugar de Prospección" value={lead.lugarProspeccion || 'No especificado'} />
                            
                            <div>
                                <label className="text-xs font-semibold text-gray-500">Estatus</label>
                                <select value={status} onChange={handleStatusChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-maderas-blue focus:border-transparent">
                                    {KANBAN_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500">Observaciones</label>
                                <textarea 
                                    value={observaciones} 
                                    onChange={(e) => setObservaciones(e.target.value)} 
                                    onBlur={handleObservationsBlur}
                                    rows={4}
                                    className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-maderas-blue focus:border-transparent"
                                    placeholder="Añadir notas..."
                                ></textarea>
                            </div>
                        </div>
                        
                        <div className="p-4 border-t bg-gray-50">
                            <button onClick={handleMarkAsAttended} className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-md hover:bg-emerald-600 disabled:bg-emerald-300">
                                <CheckCircleIcon className="w-5 h-5" /> Marcar como Atendido
                            </button>
                        </div>
                    </>
                )}
            </div>
        </>
    );
};


const KanbanBoard = () => {
    const { leads, asesores, updateLeadStatus, currentUser, role } = useAppContext();
    const [selectedAsesor, setSelectedAsesor] = useState<string>('');
    const [leadToDiscard, setLeadToDiscard] = useState<Lead | null>(null);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

    const activeAsesores = useMemo(() => asesores.filter(a => a.estatus === 'Activo'), [asesores]);
    const asesoresMap = useMemo(() => new Map(asesores.map(a => [a.id, a.nombreCompleto])), [asesores]);

    const handleCardClick = useCallback((lead: Lead) => {
        setSelectedLead(lead);
    }, []);

    const filteredLeads = useMemo(() => {
        const leadsForUser = (role === Role.Lider || !currentUser)
            ? leads
            : leads.filter(lead => lead.asesorId === currentUser.id);

        if (role === Role.Lider && selectedAsesor) {
            return leadsForUser.filter(lead => lead.asesorId === selectedAsesor);
        }

        return leadsForUser;
    }, [leads, selectedAsesor, currentUser, role]);

    const handleLeadDrop = useCallback(async (newStatus: StatusProspecto, e: React.DragEvent<HTMLDivElement>) => {
        const leadId = e.dataTransfer.getData('leadId');
        const lead = leads.find(l => l.id === leadId);

        if (lead && newStatus && lead.estatus !== newStatus) {
            if (newStatus === StatusProspecto.Descartado) {
                setLeadToDiscard(lead);
            } else {
                await updateLeadStatus(leadId, newStatus);
            }
        }
    }, [leads, updateLeadStatus]);

    const handleConfirmDescarte = async (motivo: string) => {
        if (leadToDiscard && motivo) {
            await updateLeadStatus(leadToDiscard.id, StatusProspecto.Descartado, motivo);
        }
        setLeadToDiscard(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 h-[calc(100vh-150px)] flex flex-col">
            {leadToDiscard && <DescarteModal lead={leadToDiscard} onClose={() => setLeadToDiscard(null)} onConfirm={handleConfirmDescarte} />}
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4 flex-shrink-0">
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
            <div className="flex-grow flex gap-4 overflow-x-auto p-4" onDragOver={handleDragOver}>
                {KANBAN_STAGES.map(status => (
                    <KanbanColumn
                        key={status}
                        status={status}
                        leads={filteredLeads.filter(lead => lead.estatus === status)}
                        asesoresMap={asesoresMap}
                        onDrop={handleLeadDrop}
                        onCardClick={handleCardClick}
                    />
                ))}
            </div>
             <LeadDetailPanel lead={selectedLead} onClose={() => setSelectedLead(null)} />
        </div>
    );
};

export default KanbanBoard;
