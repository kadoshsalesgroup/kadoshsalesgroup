
import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { Lead, Asesor, Venta, StatusProspecto, Role, AsesorStatus, SaleStage, SaleStatus, MonthlyGoal } from '../types';
import { initialAsesores, initialLeads, initialVentas, initialMonthlyGoals } from '../data/initialData';

export type CurrentUser = Asesor | { id: 'LIDER'; nombreCompleto: string; email: string; } | null;

interface AppContextType {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  addLead: (lead: Omit<Lead, 'id' | 'interacciones' | 'createdByEmail'>) => void;
  addMultipleLeads: (leadsData: Omit<Lead, 'id' | 'interacciones' | 'createdByEmail'>[]) => void;
  updateLead: (updatedLead: Lead) => void;
  deleteLead: (leadId: string) => void;
  updateLeadStatus: (leadId: string, newStatus: StatusProspecto, motivoDescarte?: string) => void;
  
  asesores: Asesor[];
  setAsesores: React.Dispatch<React.SetStateAction<Asesor[]>>;
  addAsesor: (asesor: Omit<Asesor, 'id'>) => boolean;
  updateAsesor: (updatedAsesor: Asesor) => boolean;

  ventas: Venta[];
  setVentas: React.Dispatch<React.SetStateAction<Venta[]>>;
  addVenta: (venta: Omit<Venta, 'id' | 'createdByEmail'>) => void;
  updateVenta: (updatedVenta: Venta) => void;

  monthlyGoals: MonthlyGoal[];
  setMonthlyGoals: React.Dispatch<React.SetStateAction<MonthlyGoal[]>>;
  addOrUpdateMonthlyGoal: (goal: Omit<MonthlyGoal, 'id'>) => void;

  currentUser: CurrentUser;
  login: (email: string) => boolean;
  logout: () => void;
  role: Role;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [asesores, setAsesores] = useState<Asesor[]>(initialAsesores);
  const [ventas, setVentas] = useState<Venta[]>(initialVentas);
  const [monthlyGoals, setMonthlyGoals] = useState<MonthlyGoal[]>(initialMonthlyGoals);
  const [currentUser, setCurrentUser] = useState<CurrentUser>(null);

  const role = useMemo(() => {
    if (!currentUser) return Role.Asesor; // Should be irrelevant as app is blocked, but provides a default
    return currentUser.id === 'LIDER' ? Role.Lider : Role.Asesor;
  }, [currentUser]);


  const login = (email: string): boolean => {
    const normalizedEmail = email.trim().toLowerCase();
    
    const leaderEmails = [
      'carina.mendoza@ciudadmaderas.com',
      'kadoshsalesgroup@gmail.com'
    ];

    const advisorEmails = [
      'daniriccociudadmaderas@gmail.com',
      'j.ambrosio.cmaderasp@gmail.com',
      'sandra11.ciudadmaderas@gmail.com',
      'marisaj.ciudadmaderas@gmail.com',
      'jperaza13.ciudadmaderas@gmail.com',
      'alediazciudadmaderas@gmail.com',
      'mercedes50ciudadmaderas@gmail.com'
    ];

    const allowedEmails = [...leaderEmails, ...advisorEmails];

    if (!allowedEmails.includes(normalizedEmail)) {
      return false; // Not an allowed user
    }

    if (leaderEmails.includes(normalizedEmail)) {
        const leaderNames: Record<string, string> = {
            'carina.mendoza@ciudadmaderas.com': 'MIRTHA CARINA MENDOZA CONTRERAS',
            'kadoshsalesgroup@gmail.com': 'Kadosh Sales Group'
        };
        setCurrentUser({ id: 'LIDER', nombreCompleto: leaderNames[normalizedEmail] || 'Líder', email: normalizedEmail });
        return true;
    }

    // At this point, it must be an advisor.
    // We still need to find their full user object from the asesores list.
    const asesor = asesores.find(a => a.email.toLowerCase() === normalizedEmail);
    if (asesor && asesor.estatus === AsesorStatus.Activo) {
        setCurrentUser(asesor);
        return true;
    }

    // This case covers if an advisor is in the allowed list but not in the 'asesores' data
    // or is marked as inactive.
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const addLead = (leadData: Omit<Lead, 'id' | 'interacciones' | 'createdByEmail'>) => {
    if (!currentUser) return;
    const newLead: Lead = { 
        ...leadData, 
        id: new Date().getTime().toString(),
        interacciones: 1,
        createdByEmail: currentUser.email,
    };
    setLeads(prev => [...prev, newLead]);
  };

  const addMultipleLeads = (leadsData: Omit<Lead, 'id' | 'interacciones' | 'createdByEmail'>[]) => {
    if (!currentUser) return;
    const time = new Date().getTime();
    const newLeads: Lead[] = leadsData.map((lead, index) => ({
      ...lead,
      id: `${time}-${index}`,
      interacciones: 1,
      createdByEmail: currentUser.email,
    }));
    setLeads(prev => [...prev, ...newLeads]);
  };

  const updateLead = (updatedLead: Lead) => {
    setLeads(prev => prev.map(lead => lead.id === updatedLead.id ? updatedLead : lead));
  };
  
  const deleteLead = (leadId: string) => {
    setLeads(prev => prev.filter(lead => lead.id !== leadId));
  };
  

  const addVenta = (ventaData: Omit<Venta, 'id' | 'createdByEmail'>) => {
    if (!currentUser) return;
    const newVenta: Venta = { 
      ...ventaData, 
      id: new Date().getTime().toString(),
      createdByEmail: currentUser.email,
    };
    setVentas(prev => [...prev, newVenta]);
  };
  
  const updateVenta = (updatedVenta: Venta) => {
    setVentas(prev => prev.map(v => v.id === updatedVenta.id ? updatedVenta : v));
  };


  const updateLeadStatus = (leadId: string, newStatus: StatusProspecto, motivoDescarte?: string) => {
    if (!currentUser) return;
    const leadToUpdate = leads.find(l => l.id === leadId);

    if (leadToUpdate && leadToUpdate.estatus !== newStatus && newStatus === StatusProspecto.Apartado) {
        const saleExists = ventas.some(v => v.nombreCliente.trim().toLowerCase() === leadToUpdate.nombreCompleto.trim().toLowerCase());
        
        if (!saleExists) {
            const newVentaData: Omit<Venta, 'id' | 'createdByEmail'> = {
                nombreLote: 'Lote por Asignar',
                nombreCliente: leadToUpdate.nombreCompleto,
                monto: 0,
                fechaInicioProceso: new Date().toISOString().split('T')[0],
                etapaProceso: SaleStage.Apartado,
                asesorPrincipalId: leadToUpdate.asesorId,
                estatusProceso: SaleStatus.InProgress,
                observaciones: `Venta creada automáticamente desde el prospecto.`,
            };
            addVenta(newVentaData);
        }
    }

    setLeads(prevLeads => prevLeads.map(lead => {
        if (lead.id === leadId) {
            const isStatusChange = lead.estatus !== newStatus;
            return {
                ...lead,
                estatus: newStatus,
                motivoDescarte: newStatus === StatusProspecto.Descartado ? motivoDescarte : lead.motivoDescarte,
                interacciones: isStatusChange ? lead.interacciones + 1 : lead.interacciones,
            };
        }
        return lead;
    }));
  };

  const addAsesor = (asesorData: Omit<Asesor, 'id'>): boolean => {
    const emailExists = asesores.some(a => a.email.toLowerCase() === asesorData.email.toLowerCase().trim());
    if (emailExists) {
      alert('Error: El correo electrónico ya está en uso por otro asesor.');
      return false;
    }
    const newAsesor: Asesor = { ...asesorData, id: new Date().getTime().toString() };
    setAsesores(prev => [...prev, newAsesor]);
    return true;
  };
  
  const updateAsesor = (updatedAsesor: Asesor): boolean => {
    const emailExists = asesores.some(a => a.id !== updatedAsesor.id && a.email.toLowerCase() === updatedAsesor.email.toLowerCase().trim());
    if (emailExists) {
      alert('Error: El correo electrónico ya está en uso por otro asesor.');
      return false;
    }
    setAsesores(prev => prev.map(a => a.id === updatedAsesor.id ? updatedAsesor : a));
    return true;
  };

  const addOrUpdateMonthlyGoal = (goalData: Omit<MonthlyGoal, 'id'>) => {
    setMonthlyGoals(prev => {
        const existingGoalIndex = prev.findIndex(g => 
            g.asesorId === goalData.asesorId &&
            g.year === goalData.year &&
            g.month === goalData.month
        );
        if (existingGoalIndex > -1) {
            const updatedGoals = [...prev];
            const existingGoal = updatedGoals[existingGoalIndex];
            updatedGoals[existingGoalIndex] = { ...existingGoal, goalAmount: goalData.goalAmount };
            return updatedGoals;
        } else {
            const newGoal: MonthlyGoal = { ...goalData, id: new Date().getTime().toString() };
            return [...prev, newGoal];
        }
    });
  };

  const value = {
    leads, setLeads, addLead, addMultipleLeads, updateLead, deleteLead, updateLeadStatus,
    asesores, setAsesores, addAsesor, updateAsesor,
    ventas, setVentas, addVenta, updateVenta,
    monthlyGoals, setMonthlyGoals, addOrUpdateMonthlyGoal,
    currentUser, login, logout, role
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};