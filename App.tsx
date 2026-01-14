
import React, { useState } from 'react';
import { useAppContext } from './context/AppContext';
import { Role } from './types';

// Import components
import LeadsList from './components/Leads/LeadsList';
import KanbanBoard from './components/Kanban/KanbanBoard';
import KPIsDashboard from './components/Dashboard/KPIsDashboard';
import MonthlyReport from './components/Dashboard/MonthlyReport';
import AdvisorManagement from './components/Advisors/AdvisorManagement';
import SalesDashboard from './components/Sales/SalesDashboard';
import SalesSummaryDashboard from './components/Dashboard/SalesSummaryDashboard';
import GoalsDashboard from './components/Goals/GoalsDashboard';
import CalendarView from './components/Calendar/CalendarView';

type Tab = 'leads' | 'kanban' | 'kpis' | 'monthly' | 'sales' | 'salesSummary' | 'advisors' | 'goals' | 'calendar';

const Login = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAppContext();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!email) {
            setError('Por favor, ingrese un correo electrónico.');
            setLoading(false);
            return;
        }

        const { error: loginError } = await login(email);
        
        if (loginError) {
            setError(loginError);
        }
        // On success, the app will automatically transition to the main view.
        setLoading(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-maderas-blue">
                        CRM <span className="text-maderas-gold">Kadosh</span>
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">Bienvenido, ingrese su correo para acceder.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="text-sm font-medium text-gray-700 sr-only">
                            Correo electrónico
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-maderas-blue focus:border-maderas-blue"
                            placeholder="Correo electrónico"
                            disabled={loading}
                        />
                    </div>
                    {error && <p className="text-sm text-center text-red-600">{error}</p>}
                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-maderas-blue hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-maderas-blue disabled:bg-opacity-50"
                        >
                            {loading ? 'Accediendo...' : 'Acceder'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const LoadingScreen = () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-maderas-blue">
                Cargando CRM <span className="text-maderas-gold">Kadosh...</span>
            </h1>
            {/* You can add a spinner here */}
        </div>
    </div>
);


const App = () => {
  const [activeTab, setActiveTab] = useState<Tab>('leads');
  const { role, currentUser, logout, loading } = useAppContext();

  if (loading) {
      return <LoadingScreen />;
  }

  if (!currentUser) {
    return <Login />;
  }
  
  const renderContent = () => {
    switch (activeTab) {
      case 'leads':
        return <LeadsList />;
      case 'kanban':
        return <KanbanBoard />;
      case 'sales':
        return <SalesDashboard />;
      case 'salesSummary':
        return <SalesSummaryDashboard />;
      case 'goals':
        return <GoalsDashboard />;
      case 'kpis':
        return <KPIsDashboard />;
      case 'monthly':
        return <MonthlyReport />;
      case 'calendar':
        return <CalendarView />;
      case 'advisors':
        return role === Role.Lider ? <AdvisorManagement /> : <p className="p-8 text-center text-red-500">Acceso denegado. Solo los líderes pueden gestionar asesores.</p>;
      default:
        return <LeadsList />;
    }
  };

  const NavItem = ({ tab, label }: { tab: Tab, label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab ? 'bg-maderas-gold text-maderas-blue' : 'text-white hover:bg-maderas-blue/50'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-maderas-blue shadow-md sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
            <div className="flex flex-col sm:flex-row justify-between items-center">
                 <h1 className="text-2xl font-bold text-white mb-2 sm:mb-0">
                    CRM <span className="text-maderas-gold">Kadosh</span>
                </h1>
                <div className="flex items-center gap-4">
                    <span className="text-white text-sm">
                        Hola, <span className="font-bold">{currentUser.nombreCompleto}</span>
                    </span>
                    <button 
                        onClick={logout} 
                        className="text-white text-sm bg-maderas-gold/80 hover:bg-maderas-gold px-3 py-1 rounded-md"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </div>
            <nav className="mt-2 flex items-center gap-1 flex-wrap justify-center sm:justify-start">
                <NavItem tab="leads" label="Prospectos" />
                <NavItem tab="kanban" label="Proceso de Venta" />
                <NavItem tab="calendar" label="Calendario" />
                <NavItem tab="sales" label="Gestión de Ventas" />
                <NavItem tab="salesSummary" label="Resumen de Ventas" />
                <NavItem tab="goals" label="Metas" />
                <NavItem tab="kpis" label="KPIs" />
                <NavItem tab="monthly" label="Reporte Mensual" />
                {role === Role.Lider && <NavItem tab="advisors" label="Asesores" />}
            </nav>
        </div>
      </header>
      <main>
        {renderContent()}
      </main>
      <footer className="text-center py-4 text-gray-500 text-xs">
        {/* Fix: Corrected typo from newgetFullYear() to new Date().getFullYear() to get the current year. */}
        <p>&copy; {new Date().getFullYear()} Kadosh CRM. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default App;
