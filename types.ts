
export enum AsesorStatus {
  Activo = 'Activo',
  Inactivo = 'Inactivo',
}

export enum Role {
  Lider = 'Líder',
  Asesor = 'Asesor',
}

export interface Asesor {
  id: string;
  nombreCompleto: string;
  email: string;
  fechaIngreso: string; // YYYY-MM-DD
  fechaNacimiento?: string; // YYYY-MM-DD
  estatus: AsesorStatus;
}

export enum StatusProspecto {
  NoContactado = 'No Contactado',
  Contactado = 'Contactado',
  Perfilado = 'Perfilado',
  Interesado = 'Interesado',
  Cita = 'Cita',
  RevisandoPropuesta = 'Revisando Propuesta',
  Objeciones = 'Objeciones',
  Cierre = 'Cierre',
  Apartado = 'Apartado',
  Descartado = 'Descartado',
}

export type LugarProspeccion = string;
export type Interes = string;

export interface Lead {
  id: string;
  nombreCompletoProspecto: string;
  telefono: string;
  correo: string;
  fechaProspeccion: string; // YYYY-MM-DD
  lugarProspeccion: LugarProspeccion;
  interes: Interes;
  observaciones: string;
  estatus: StatusProspecto;
  ciudadOrigen: string;
  asesorId: string;
  motivoDescarte?: string;
  interacciones: number;
  createdByEmail: string;
}

export enum SaleStage {
    Apartado = 'Apartado',
    DS = 'DS',
    Enganche = 'Enganche',
    Contratado = 'Contratado',
    Cancelado = 'Cancelado',
}

export enum SaleStatus {
    InProgress = 'En Progreso',
    Closed = 'Cerrado',
}

export interface Venta {
    id: string;
    nombreLote: string;
    nombreCliente: string;
    monto: number;
    fechaInicioProceso: string; // YYYY-MM-DD
    etapaProceso: SaleStage;
    fechaCierre?: string; // YYYY-MM-DD
    asesorPrincipalId: string;
    asesorSecundarioId?: string;
    estatusProceso: SaleStatus;
    observaciones?: string;
    createdByEmail: string;
}

export interface Configuracion {
    limiteMensualMinimo: number;
    tiempoMaximoProceso: number; // in days
}

export interface MonthlyGoal {
  id: string;
  asesorId: string;
  year: number;
  month: number; // 1-12
  goalAmount: number;
}

// --- CALENDAR TYPES ---

export enum AppointmentType {
  VisitaDesarrollo = 'Visita a Desarrollo',
  Zoom = 'Reunión Zoom',
  Videollamada = 'Videollamada',
  VisitaOficina = 'Visita a Oficina',
}

export interface Appointment {
  id: string;
  type: AppointmentType;
  date: string; // ISO String with time
  asesorId: string;
  notes?: string;
  createdByEmail: string;
}
