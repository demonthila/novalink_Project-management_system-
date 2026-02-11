
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ClientList from './components/ClientList';
import ProjectList from './components/ProjectList';
import Login from './components/Login';
import { Client, Project } from './types';
import { INITIAL_CLIENTS, INITIAL_PROJECTS } from './services/mockData';
import { generateInvoiceNumber } from './utils';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);

  // Persistence (Simulating Hostinger/DB)
  useEffect(() => {
    const savedClients = localStorage.getItem('it_clients');
    const savedProjects = localStorage.getItem('it_projects');
    const auth = localStorage.getItem('it_auth');

    if (savedClients) setClients(JSON.parse(savedClients));
    if (savedProjects) setProjects(JSON.parse(savedProjects));
    if (auth === 'true') setIsAuthenticated(true);
  }, []);

  const persistData = (newClients: Client[], newProjects: Project[]) => {
    localStorage.setItem('it_clients', JSON.stringify(newClients));
    localStorage.setItem('it_projects', JSON.stringify(newProjects));
  };

  const handleLogin = (pass: string) => {
    if (pass === 'admin123') { // Demo auth
      setIsAuthenticated(true);
      localStorage.setItem('it_auth', 'true');
    } else {
      alert('Invalid Credentials');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('it_auth');
  };

  // CRUD Actions
  const addClient = (client: Omit<Client, 'id'>) => {
    const newClient = { ...client, id: Date.now().toString() };
    const updated = [...clients, newClient];
    setClients(updated);
    persistData(updated, projects);
  };

  const updateClient = (client: Client) => {
    const updated = clients.map(c => c.id === client.id ? client : c);
    setClients(updated);
    persistData(updated, projects);
  };

  const deleteClient = (id: string) => {
    if (confirm('Delete client and all associated projects?')) {
      const updatedClients = clients.filter(c => c.id !== id);
      const updatedProjects = projects.filter(p => p.clientId !== id);
      setClients(updatedClients);
      setProjects(updatedProjects);
      persistData(updatedClients, updatedProjects);
    }
  };

  const addProject = (project: Omit<Project, 'id'>) => {
    const newProject = { 
      ...project, 
      id: Date.now().toString(),
      invoiceNumber: generateInvoiceNumber()
    };
    const updated = [...projects, newProject];
    setProjects(updated);
    persistData(clients, updated);
  };

  const updateProject = (project: Project) => {
    const updated = projects.map(p => p.id === project.id ? project : p);
    setProjects(updated);
    persistData(clients, updated);
  };

  const deleteProject = (id: string) => {
    if (confirm('Delete this project?')) {
      const updated = projects.filter(p => p.id !== id);
      setProjects(updated);
      persistData(clients, updated);
    }
  };

  const handleGenerateInvoice = (project: Project) => {
    // In a real app, this would use jspdf. 
    // Here we'll simulate the download.
    alert(`Generating Invoice ${project.invoiceNumber} for ${project.name}... (PDF download starting)`);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout}>
      {activeTab === 'dashboard' && <Dashboard projects={projects} clients={clients} />}
      {activeTab === 'clients' && (
        <ClientList 
          clients={clients} 
          onAdd={addClient} 
          onUpdate={updateClient} 
          onDelete={deleteClient} 
        />
      )}
      {activeTab === 'projects' && (
        <ProjectList 
          projects={projects} 
          clients={clients} 
          onAdd={addProject} 
          onUpdate={updateProject} 
          onDelete={deleteProject}
          onGenerateInvoice={handleGenerateInvoice}
        />
      )}
      {activeTab === 'reports' && (
        <div className="bg-white p-8 rounded-xl border border-slate-200">
          <h3 className="text-xl font-bold mb-4">Financial Reports</h3>
          <p className="text-slate-500 mb-6">Detailed reports for revenue, profit, and developer balances.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <button className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 text-left transition-colors">
                <span className="block font-bold">Monthly Revenue Export</span>
                <span className="text-xs text-slate-400">Download XLSX format</span>
             </button>
             <button className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 text-left transition-colors">
                <span className="block font-bold">Profit & Loss Statement</span>
                <span className="text-xs text-slate-400">Download PDF format</span>
             </button>
             <button className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 text-left transition-colors">
                <span className="block font-bold">Developer Payout History</span>
                <span className="text-xs text-slate-400">Download CSV format</span>
             </button>
             <button className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 text-left transition-colors">
                <span className="block font-bold">Outstanding Payments</span>
                <span className="text-xs text-slate-400">View live tracker</span>
             </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
