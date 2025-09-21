
import { Venta, Asesor } from '../types';

export const formatCurrencyMXN = (amount: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
};

export const calculateDaysDifference = (dateString: string): number => {
    const startDate = new Date(dateString);
    const today = new Date();
    // Set hours to 0 to compare dates only
    startDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const differenceInTime = today.getTime() - startDate.getTime();
    return Math.floor(differenceInTime / (1000 * 3600 * 24));
};

export const getMontoAsignado = (venta: Venta, asesorId: string): number => {
    if (venta.asesorSecundarioId) {
        if (venta.asesorPrincipalId === asesorId || venta.asesorSecundarioId === asesorId) {
            return venta.monto / 2;
        }
    } else if (venta.asesorPrincipalId === asesorId) {
        return venta.monto;
    }
    return 0;
};

export const calculateMonthlyAverage = (asesor: Asesor, ventas: Venta[]): number => {
    const advisorSales = ventas.filter(v => 
        (v.asesorPrincipalId === asesor.id || v.asesorSecundarioId === asesor.id) && v.etapaProceso === 'Contratado'
    );
    
    if (advisorSales.length === 0) return 0;
    
    const now = new Date();
    const joinDate = new Date(asesor.fechaIngreso);
    let monthsOfWork = (now.getFullYear() - joinDate.getFullYear()) * 12;
    monthsOfWork -= joinDate.getMonth();
    monthsOfWork += now.getMonth() + 1;
    
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    
    let salesToAverage: Venta[];
    let monthsForAverage: number;

    if (joinDate < oneYearAgo) {
        // More than 1 year, average only current year
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        salesToAverage = advisorSales.filter(v => new Date(v.fechaCierre || v.fechaInicioProceso) >= startOfYear);
        monthsForAverage = now.getMonth() + 1;
    } else {
        // Less than 1 year, average since join date
        salesToAverage = advisorSales;
        monthsForAverage = monthsOfWork <= 0 ? 1 : monthsOfWork;
    }
    
    const totalAmount = salesToAverage.reduce((acc, v) => acc + getMontoAsignado(v, asesor.id), 0);
    
    return monthsForAverage > 0 ? totalAmount / monthsForAverage : 0;
};
