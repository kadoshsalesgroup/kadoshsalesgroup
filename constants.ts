
import { StatusProspecto, SaleStage } from './types';

export const KANBAN_STAGES: StatusProspecto[] = [
  StatusProspecto.NoContactado,
  StatusProspecto.Contactado,
  StatusProspecto.Perfilado,
  StatusProspecto.Interesado,
  StatusProspecto.Cita,
  StatusProspecto.RevisandoPropuesta,
  StatusProspecto.Objeciones,
  StatusProspecto.Apartado,
  StatusProspecto.Descartado,
];

export const STAGE_COLORS: Record<StatusProspecto, { bg: string; text: string; headerBg: string }> = {
    [StatusProspecto.NoContactado]:       { bg: 'bg-gray-50',    text: 'text-gray-800',    headerBg: 'bg-gray-200' },
    [StatusProspecto.Contactado]:         { bg: 'bg-sky-50',     text: 'text-sky-800',     headerBg: 'bg-sky-200' },
    [StatusProspecto.Perfilado]:          { bg: 'bg-indigo-50',  text: 'text-indigo-800',  headerBg: 'bg-indigo-200' },
    [StatusProspecto.Interesado]:         { bg: 'bg-purple-50',  text: 'text-purple-800',  headerBg: 'bg-purple-200' },
    [StatusProspecto.Cita]:               { bg: 'bg-amber-50',   text: 'text-amber-800',   headerBg: 'bg-amber-200' },
    [StatusProspecto.RevisandoPropuesta]: { bg: 'bg-orange-50',  text: 'text-orange-800',  headerBg: 'bg-orange-200' },
    [StatusProspecto.Objeciones]:         { bg: 'bg-yellow-50',  text: 'text-yellow-800',  headerBg: 'bg-yellow-200' },
    [StatusProspecto.Apartado]:           { bg: 'bg-emerald-50', text: 'text-emerald-800', headerBg: 'bg-emerald-200' },
    [StatusProspecto.Descartado]:         { bg: 'bg-rose-50',    text: 'text-rose-800',    headerBg: 'bg-rose-200' },
};

export const SALE_STAGES_FLOW: SaleStage[] = [
    SaleStage.Apartado,
    SaleStage.DS,
    SaleStage.Enganche,
    SaleStage.Contratado,
];

export const ALL_SALE_STAGES: SaleStage[] = [...SALE_STAGES_FLOW, SaleStage.Cancelado];

export const CONFIG: { limiteMensualMinimo: number; tiempoMaximoProceso: number } = {
    limiteMensualMinimo: 500000,
    tiempoMaximoProceso: 45,
};