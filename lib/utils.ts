
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
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Filter sales to exclude current month and focus on contracted ones
    // CRITERIO: Usar estrictamente fechaInicioProceso (Fecha de Apartado)
    const advisorSales = ventas.filter(v => {
        const saleDate = new Date(v.fechaInicioProceso);
        return (v.asesorPrincipalId === asesor.id || v.asesorSecundarioId === asesor.id) && 
               v.etapaProceso === 'Contratado' &&
               saleDate < startOfCurrentMonth;
    });
    
    if (advisorSales.length === 0) return 0;
    
    const joinDate = new Date(asesor.fechaIngreso);
    
    // Calculate total full months of work excluding current month
    let monthsOfWork = (startOfCurrentMonth.getFullYear() - joinDate.getFullYear()) * 12;
    monthsOfWork += (startOfCurrentMonth.getMonth() - joinDate.getMonth());
    
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    
    let salesToAverage: Venta[];
    let monthsForAverage: number;

    if (joinDate < oneYearAgo) {
        // More than 1 year: average only the full months of the current year
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        salesToAverage = advisorSales.filter(v => new Date(v.fechaInicioProceso) >= startOfYear);
        monthsForAverage = now.getMonth(); 
    } else {
        // Less than 1 year: average since join date until the end of last month
        salesToAverage = advisorSales;
        monthsForAverage = monthsOfWork;
    }
    
    if (monthsForAverage <= 0) return 0;
    
    const totalAmount = salesToAverage.reduce((acc, v) => acc + getMontoAsignado(v, asesor.id), 0);
    
    return totalAmount / monthsForAverage;
};

// --- Helper functions for Supabase snake_case to camelCase conversion ---

const toCamel = (s: string): string => {
  return s.replace(/([-_][a-z])/ig, ($1) => {
    return $1.toUpperCase()
      .replace('-', '')
      .replace('_', '');
  });
};

const toSnake = (s: string): string => {
  if (s === 'id') return s;
  return s.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

export const keysToCamel = (o: any): any => {
  if (Array.isArray(o)) {
    return o.map(v => keysToCamel(v));
  } else if (o !== null && typeof o === 'object' && o.constructor === Object) {
    return Object.keys(o).reduce((acc, key) => {
      acc[toCamel(key)] = keysToCamel(o[key]);
      return acc;
    }, {} as any);
  }
  return o;
};

export const keysToSnake = (o: any): any => {
    if (Array.isArray(o)) {
    return o.map(v => keysToSnake(v));
  } else if (o !== null && typeof o === 'object' && o.constructor === Object) {
    return Object.keys(o).reduce((acc, key) => {
      const snakeKey = toSnake(key);
      acc[snakeKey] = keysToSnake(o[key]);
      return acc;
    }, {} as any);
  }
  return o;
}
