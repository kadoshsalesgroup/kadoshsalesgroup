
import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { Lead, Asesor, Venta, StatusProspecto, Role, AsesorStatus, SaleStage, SaleStatus, MonthlyGoal, Appointment } from '../types';
import { supabase } from '../lib/supabaseClient';
import { keysToCamel, keysToSnake } from '../lib/utils';

export type CurrentUser = Asesor | { id: 'LIDER'; nombreCompleto: string; email: string; } | null;

interface AppContextType {
  leads: Lead[];
  addLead: (lead: Omit<Lead, 'id' | 'interacciones' | 'createdByEmail'>) => Promise<void>;
  addMultipleLeads: (leadsData: Omit<Lead, 'id' | 'interacciones' | 'createdByEmail'>[]) => Promise<void>;
  updateLead: (updatedLead: Lead) => Promise<void>;
  deleteLead: (leadId: string) => Promise<void>;
  updateLeadStatus: (leadId: string, newStatus: StatusProspecto, motivoDescarte?: string) => Promise<void>;
  
  asesores: Asesor[];
  addAsesor: (asesor: Omit<Asesor, 'id'>) => Promise<boolean>;
  updateAsesor: (updatedAsesor: Asesor) => Promise<boolean>;

  ventas: Venta[];
  addVenta: (venta: Omit<Venta, 'id' | 'createdByEmail'>) => Promise<void>;
  updateVenta: (updatedVenta: Venta) => Promise<void>;
  deleteVenta: (ventaId: string) => Promise<void>;

  monthlyGoals: MonthlyGoal[];
  addOrUpdateMonthlyGoal: (goal: Omit<MonthlyGoal, 'id'>) => Promise<void>;

  appointments: Appointment[];
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdByEmail'>) => Promise<void>;

  currentUser: CurrentUser;
  login: (email: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  role: Role;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<CurrentUser>(null);
  const [loading, setLoading] = useState(true);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [asesores, setAsesores] = useState<Asesor[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [monthlyGoals, setMonthlyGoals] = useState<MonthlyGoal[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const role = useMemo(() => {
    if (!currentUser) return Role.Asesor;
    return currentUser.id === 'LIDER' ? Role.Lider : Role.Asesor;
  }, [currentUser]);

  const fetchAllData = useCallback(async () => {
    if (!currentUser) return;

    const isAsesor = role === Role.Asesor;
    const userId = currentUser.id;

    let leadsQuery = supabase.from('leads').select('*');
    let ventasQuery = supabase.from('ventas').select('*');
    let goalsQuery = supabase.from('monthly_goals').select('*');
    let appointmentsQuery = supabase.from('appointments').select('*');
    
    if (isAsesor) {
        leadsQuery = leadsQuery.eq('asesor_id', userId);
        ventasQuery = ventasQuery.or(`asesor_principal_id.eq.${userId},asesor_secundario_id.eq.${userId}`);
        goalsQuery = goalsQuery.eq('asesor_id', userId);
    }

    const [leadsRes, ventasRes, goalsRes, asesoresRes, appointmentsRes] = await Promise.all([
        leadsQuery,
        ventasQuery,
        goalsQuery,
        supabase.from('asesores').select('*'),
        appointmentsQuery
    ]);

    if (leadsRes.error) console.error("Error fetching leads:", leadsRes.error.message);
    else setLeads(keysToCamel(leadsRes.data));
    
    if (ventasRes.error) console.error("Error fetching ventas:", ventasRes.error.message);
    else setVentas(keysToCamel(ventasRes.data));

    if (goalsRes.error) console.error("Error fetching monthly goals:", goalsRes.error.message);
    else setMonthlyGoals(keysToCamel(goalsRes.data));

    if (appointmentsRes.error) {
        // Error 42P01 means "Relation does not exist"
        // PGRST200 can also happen if the table is missing from schema cache
        if (appointmentsRes.error.code === '42P01' || appointmentsRes.error.message.includes('schema cache')) {
            console.warn("⚠️ La tabla 'appointments' no se encuentra o no está en el cache de la API.");
            console.info("Acción requerida: Ejecuta el SQL de 'appointments' y pulsa 'Reload PostgREST config' en Supabase Settings > API.");
        } else {
            console.error("Error fetching appointments:", appointmentsRes.error.message);
        }
    } else {
        setAppointments(keysToCamel(appointmentsRes.data));
    }

    if (asesoresRes.error) {
        console.error("Error fetching asesores:", asesoresRes.error.message);
        if (isAsesor) {
             setAsesores([currentUser as Asesor]);
        } else {
             setAsesores([]);
        }
    } else {
        setAsesores(keysToCamel(asesoresRes.data));
    }
  }, [currentUser, role]);


  // --- AUTHENTICATION ---
  const establishSession = async (email: string): Promise<boolean> => {
      const userEmail = email.toLowerCase();
      
      const leaderEmails = [
          'carina.mendoza@ciudadmaderas.com',
          'kadoshsalesgroup@gmail.com'
      ];

      if (leaderEmails.includes(userEmail)) {
          const leaderNames: Record<string, string> = {
              'carina.mendoza@ciudadmaderas.com': 'MIRTHA CARINA MENDOZA CONTRERAS',
              'kadoshsalesgroup@gmail.com': 'Kadosh Sales Group'
          };
          setCurrentUser({ id: 'LIDER', nombreCompleto: leaderNames[userEmail] || 'Líder', email: userEmail });
          return true;
      }

      const { data: asesorData, error: asesorError } = await supabase.from('asesores').select('*').eq('email', userEmail).single();
      
      if (asesorError || !asesorData) {
          if (asesorError) console.error('Error fetching asesor by email:', asesorError.message);
          setCurrentUser(null);
          return false;
      }
      
      const asesor: Asesor = keysToCamel(asesorData);
      if (asesor && asesor.estatus === AsesorStatus.Activo) {
          setCurrentUser(asesor);
          return true;
      }

      setCurrentUser(null);
      return false;
  };

  useEffect(() => {
    const checkSession = async () => {
        setLoading(true);
        const userEmail = localStorage.getItem('userEmail');
        if (userEmail) {
            await establishSession(userEmail);
        }
        setLoading(false);
    };
    checkSession();
  }, []);
  
  // --- DATA FETCHING & REALTIME ---
  useEffect(() => {
    if (!currentUser) return;

    const initialLoad = async () => {
        setLoading(true);
        await fetchAllData();
        setLoading(false);
    }
    initialLoad();

    // Set up real-time subscriptions
    const isAsesor = role === Role.Asesor;
    const userId = currentUser.id;

    const leadsFilter = isAsesor ? `asesor_id=eq.${userId}` : undefined;
    const ventasFilter = isAsesor ? `or(asesor_principal_id.eq.${userId},asesor_secundario_id.eq.${userId})` : undefined;
    const goalsFilter = isAsesor ? `asesor_id=eq.${userId}` : undefined;

    const channel = supabase.channel('public-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads', filter: leadsFilter }, (payload) => {
          handleRealtimeChange(payload, setLeads);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ventas', filter: ventasFilter }, (payload) => {
          handleRealtimeChange(payload, setVentas);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'asesores' }, (payload) => {
          handleRealtimeChange(payload, setAsesores);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_goals', filter: goalsFilter }, (payload) => {
          handleRealtimeChange(payload, setMonthlyGoals);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, (payload) => {
          handleRealtimeChange(payload, setAppointments);
      })
      .subscribe();
      
    return () => {
        supabase.removeChannel(channel);
    };
  }, [currentUser, role, fetchAllData]);

  const handleRealtimeChange = (payload: any, setter: React.Dispatch<React.SetStateAction<any[]>>) => {
      const newRecord = keysToCamel(payload.new);
      const oldRecord = keysToCamel(payload.old);

      setter(current => {
          if (payload.eventType === 'INSERT') {
              if (current.some(item => item.id === newRecord.id)) return current;
              return [...current, newRecord];
          }
          if (payload.eventType === 'UPDATE') {
              return current.map(item => item.id === newRecord.id ? newRecord : item);
          }
          if (payload.eventType === 'DELETE') {
              return current.filter(item => item.id !== oldRecord.id);
          }
          return current;
      });
  };

  const login = async (email: string) => {
    const success = await establishSession(email);
    if (success) {
        localStorage.setItem('userEmail', email);
        return { error: null };
    } else {
        localStorage.removeItem('userEmail');
        return { error: 'Correo no encontrado o el usuario no está activo.' };
    }
  };

  const logout = async () => {
    localStorage.removeItem('userEmail');
    setCurrentUser(null);
    setLeads([]);
    setAsesores([]);
    setVentas([]);
    setMonthlyGoals([]);
    setAppointments([]);
  };

  const addLead = async (leadData: Omit<Lead, 'id' | 'interacciones' | 'createdByEmail'>) => {
    if (!currentUser) return;
    const newLeadData = { ...leadData, interacciones: 1, createdByEmail: currentUser.email };
    const { error } = await supabase.from('leads').insert(keysToSnake(newLeadData));
    if (error) {
        console.error("Error adding lead:", error.message);
    } else {
        await fetchAllData();
    }
  };

  const addMultipleLeads = async (leadsData: Omit<Lead, 'id' | 'interacciones' | 'createdByEmail'>[]) => {
      if (!currentUser) return;
      const newLeads = leadsData.map(lead => ({
          ...lead,
          interacciones: 1,
          createdByEmail: currentUser.email,
      }));
      const { error } = await supabase.from('leads').insert(keysToSnake(newLeads));
      if (error) {
          console.error("Error adding multiple leads:", error.message);
      } else {
          await fetchAllData();
      }
  };

  const updateLead = async (updatedLead: Lead) => {
    const { error } = await supabase.from('leads').update(keysToSnake(updatedLead)).eq('id', updatedLead.id);
    if (error) {
        console.error("Error updating lead:", error.message);
    } else {
        await fetchAllData();
    }
  };

  const deleteLead = async (leadId: string) => {
    const { error } = await supabase.from('leads').delete().eq('id', leadId);
    if (error) {
        console.error("Error deleting lead:", error.message);
    } else {
        await fetchAllData();
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: StatusProspecto, motivoDescarte?: string) => {
      if (!currentUser) return;
      const leadToUpdate = leads.find(l => l.id === leadId);

      if (!leadToUpdate) return;
      
      if (leadToUpdate.estatus !== newStatus && newStatus === StatusProspecto.Apartado) {
          const { data: existingSales } = await supabase.from('ventas').select('id').ilike('nombre_cliente', `%${leadToUpdate.nombreCompletoProspecto.trim()}%`);
          if (!existingSales || existingSales.length === 0) {
              const newVentaData: Omit<Venta, 'id' | 'createdByEmail'> = {
                  nombreLote: 'Lote por Asignar',
                  nombreCliente: leadToUpdate.nombreCompletoProspecto,
                  monto: 0,
                  fechaInicioProceso: new Date().toISOString().split('T')[0],
                  etapaProceso: SaleStage.Apartado,
                  asesorPrincipalId: leadToUpdate.asesorId,
                  estatusProceso: SaleStatus.InProgress,
                  observaciones: `Venta creada automáticamente desde el prospecto.`,
              };
              await addVenta(newVentaData);
          }
      }

      const isStatusChange = leadToUpdate.estatus !== newStatus;
      const interacciones = isStatusChange ? leadToUpdate.interacciones + 1 : leadToUpdate.interacciones;
      const updatePayload = {
          estatus: newStatus,
          motivoDescarte: newStatus === StatusProspecto.Descartado ? motivoDescarte : null,
          interacciones,
      };
      
      const { error } = await supabase.from('leads').update(keysToSnake(updatePayload)).eq('id', leadId);
      
      if (error) {
          console.error("Error updating lead status:", error.message);
          alert(`Error al actualizar el estado: ${error.message}`);
      } else {
          await fetchAllData();
      }
  };

  const addVenta = async (ventaData: Omit<Venta, 'id' | 'createdByEmail'>) => {
      if (!currentUser) return;
      const newVentaData = { ...ventaData, createdByEmail: currentUser.email };
      const { error } = await supabase.from('ventas').insert(keysToSnake(newVentaData));
      if (error) {
          console.error("Error adding venta:", error.message);
      } else {
          await fetchAllData();
      }
  };

  const updateVenta = async (updatedVenta: Venta) => {
      const { error } = await supabase.from('ventas').update(keysToSnake(updatedVenta)).eq('id', updatedVenta.id);
      if (error) {
          console.error("Error updating venta:", error.message);
      } else {
          await fetchAllData();
      }
  };

  const deleteVenta = async (ventaId: string) => {
      const { error } = await supabase.from('ventas').delete().eq('id', ventaId);
      if (error) {
          console.error("Error deleting venta:", error.message);
          alert(`Error al eliminar la venta: ${error.message}`);
      } else {
          await fetchAllData();
      }
  };

  const addAsesor = async (asesorData: Omit<Asesor, 'id'>): Promise<boolean> => {
      const { error } = await supabase.from('asesores').insert(keysToSnake(asesorData));
      if (error) {
          alert('Error: El correo electrónico ya está en uso por otro asesor.');
          console.error("Error adding asesor:", error.message);
          return false;
      }
      await fetchAllData();
      return true;
  };

  const updateAsesor = async (updatedAsesor: Asesor): Promise<boolean> => {
      const { error } = await supabase.from('asesores').update(keysToSnake(updatedAsesor)).eq('id', updatedAsesor.id);
      if (error) {
          alert('Error: El correo electrónico ya está en uso por otro asesor.');
          console.error("Error updating asesor:", error.message);
          return false;
      }
      await fetchAllData();
      return true;
  };

  const addOrUpdateMonthlyGoal = async (goalData: Omit<MonthlyGoal, 'id'>) => {
      const { data: existingGoal, error: fetchError } = await supabase.from('monthly_goals')
          .select('id')
          .eq('asesor_id', goalData.asesorId)
          .eq('year', goalData.year)
          .eq('month', goalData.month)
          .maybeSingle();

      if (fetchError) {
          console.error("Error checking for existing goal:", fetchError);
          return;
      }
      
      if (existingGoal) {
          const { error } = await supabase.from('monthly_goals').update(keysToSnake({ goalAmount: goalData.goalAmount })).eq('id', existingGoal.id);
          if (error) {
            console.error("Error updating goal:", error);
          } else {
            await fetchAllData();
          }
      } else {
          const { error } = await supabase.from('monthly_goals').insert(keysToSnake(goalData));
          if (error) {
            console.error("Error adding goal:", error);
          } else {
            await fetchAllData();
          }
      }
  };

  const addAppointment = async (appointmentData: Omit<Appointment, 'id' | 'createdByEmail'>) => {
      if (!currentUser) return;
      const newAppointment = { ...appointmentData, createdByEmail: currentUser.email };
      const { error } = await supabase.from('appointments').insert(keysToSnake(newAppointment));
      if (error) {
          console.error("Error adding appointment:", error.message);
          if (error.code === '42P01' || error.message.includes('schema cache')) {
             alert("⚠️ Error de Base de Datos: La tabla 'appointments' no existe o la API no la reconoce todavía. Contacta al administrador.");
          } else {
             alert("Error al guardar la cita: " + error.message);
          }
      } else {
          await fetchAllData();
      }
  };

  const value = {
    leads, addLead, addMultipleLeads, updateLead, deleteLead, updateLeadStatus,
    asesores, addAsesor, updateAsesor,
    ventas, addVenta, updateVenta, deleteVenta,
    monthlyGoals, addOrUpdateMonthlyGoal,
    appointments, addAppointment,
    currentUser, login, logout, role,
    loading
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
