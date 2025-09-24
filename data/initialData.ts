
import { Asesor, Lead, Venta, MonthlyGoal, AsesorStatus } from '../types';

export const initialAsesores: Asesor[] = [
  {
    id: '1',
    nombreCompleto: 'JOSE ISIDRO AMBROSIO MENA',
    email: 'j.ambrosio.cmaderasp@gmail.com',
    fechaIngreso: '2023-01-01',
    estatus: AsesorStatus.Activo,
  },
  {
    id: '2',
    nombreCompleto: 'SANDRA CKRISTELL RODRIGUEZ MENDEZ',
    email: 'sandra11.ciudadmaderas@gmail.com',
    fechaIngreso: '2023-01-01',
    estatus: AsesorStatus.Activo,
  },
  {
    id: '3',
    nombreCompleto: 'MARISA JUAREZ ZORRILLA',
    email: 'marisaj.ciudadmaderas@gmail.com',
    fechaIngreso: '2023-01-01',
    estatus: AsesorStatus.Activo,
  },
  {
    id: '4',
    nombreCompleto: 'JOSE GONZALO PERAZA VILLARROEL',
    email: 'jperaza13.ciudadmaderas@gmail.com',
    fechaIngreso: '2023-01-01',
    estatus: AsesorStatus.Activo,
  },
  {
    id: '6',
    nombreCompleto: 'ALEJANDRO DÍAZ GORMAZ',
    email: 'alediazciudadmaderas@gmail.com',
    fechaIngreso: '2023-01-01',
    estatus: AsesorStatus.Activo,
  },
  {
    id: '7',
    nombreCompleto: 'MARÍA MERCEDES AMBROSIO MENA',
    email: 'mercedes50ciudadmaderas@gmail.com',
    fechaIngreso: '2023-01-01',
    estatus: AsesorStatus.Activo,
  },
  {
    id: '8',
    nombreCompleto: 'DANIELA RICCIO',
    email: 'daniriccociudadmaderas@gmail.com',
    fechaIngreso: '2024-01-01',
    estatus: AsesorStatus.Activo,
  },
];

export const initialLeads: Lead[] = [];

export const initialVentas: Venta[] = [];

export const initialMonthlyGoals: MonthlyGoal[] = [];
