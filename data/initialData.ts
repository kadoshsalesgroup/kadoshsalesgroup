
import { Asesor, Lead, Venta, MonthlyGoal, AsesorStatus } from '../types';

export const initialAsesores: Asesor[] = [
  {
    id: '1',
    nombreCompleto: 'MAYRA GABRIELA ALONSO GRANIEL',
    email: 'mayra.alonso@ciudadmaderas.com',
    fechaIngreso: '2024-01-01',
    estatus: AsesorStatus.Activo,
  },
  {
    id: '2',
    nombreCompleto: 'ARGELIA OLIVERA LOPEZ',
    email: 'aolivera.ciudadmaderas@gmail.com',
    fechaIngreso: '2024-01-01',
    estatus: AsesorStatus.Activo,
  },
  {
    id: '3',
    nombreCompleto: 'JOSE ISIDRO AMBROSIO MENA',
    email: 'j.ambrosio.cmaderasp@gmail.com',
    fechaIngreso: '2024-01-01',
    estatus: AsesorStatus.Activo,
  },
  {
    id: '4',
    nombreCompleto: 'ITZI ROBLEDO MARTINEZ DEL CERRO',
    email: 'itzi.robledo.ciudadmaderas@gmail.com',
    fechaIngreso: '2024-01-01',
    estatus: AsesorStatus.Activo,
  },
  {
    id: '5',
    nombreCompleto: 'DANIELA BERENICE CAMPA HERNANDEZ',
    email: 'dbcampa.ciudadmaderas@gmail.com',
    fechaIngreso: '2024-01-01',
    estatus: AsesorStatus.Activo,
  },
  {
    id: '6',
    nombreCompleto: 'FRANCISCO SAMUEL MERCADO SANDOVAL',
    email: 'samuelmercado.ciudadmaderas@gmail.com',
    fechaIngreso: '2024-01-01',
    estatus: AsesorStatus.Activo,
  },
  {
    id: '7',
    nombreCompleto: 'SANDRA CKRISTELL RODRIGUEZ MENDEZ',
    email: 'sandra11.ciudadmaderas@gmail.com',
    fechaIngreso: '2024-01-01',
    estatus: AsesorStatus.Activo,
  },
  {
    id: '8',
    nombreCompleto: 'MARIA ISABEL JUAREZ ZORRILLA',
    email: 'marisaj.ciudadmaderas@gmail.com',
    fechaIngreso: '2024-01-01',
    estatus: AsesorStatus.Activo,
  },
  {
    id: '9',
    nombreCompleto: 'JOSE GONZALO PERAZA VILLARROEL',
    email: 'jperaza13.ciudadmaderas@gmail.com',
    fechaIngreso: '2024-01-01',
    estatus: AsesorStatus.Activo,
  },
  {
    id: '10',
    nombreCompleto: 'DANIELA RICCO QUIROGA',
    email: 'daniriccociudadmaderas@gmail.com',
    fechaIngreso: '2024-01-01',
    estatus: AsesorStatus.Activo,
  },
  {
    id: '11',
    nombreCompleto: 'MARIA MERCEDES AMBROSIO MENA',
    email: 'mercedes50ciudadmaderas@gmail.com',
    fechaIngreso: '2024-01-01',
    estatus: AsesorStatus.Activo,
  },
];

export const initialLeads: Lead[] = [];

export const initialVentas: Venta[] = [];

export const initialMonthlyGoals: MonthlyGoal[] = [];