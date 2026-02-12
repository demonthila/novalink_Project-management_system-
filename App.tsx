
import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ClientList from './components/ClientList';
import ProjectList from './components/ProjectList';
import DeveloperList from './components/DeveloperList';
import TaskBoard from './components/TaskBoard';
import PendingProjectManager from './components/PendingProjectManager';
import Login from './components/Login';
import ProjectModal from './components/ProjectModal';
import Settings from './components/Settings';
import { Client, Project, Developer, Notification, Priority, NotificationCategory, User } from './types';
import { INITIAL_CLIENTS, INITIAL_PROJECTS, INITIAL_DEVELOPERS } from './services/mockData';
// Removed non-existent downloadCSV import from utils
import {
  generateInvoiceNumber,
  calculateGrandTotal,
  calculateProjectProfit,
  calculatePaidAmount,
  formatCurrency,
  getMilestonesByProjectType
} from './utils';
import { ICONS } from './constants';

const DEFAULT_ADMIN: User = {
  id: 'admin-1',
  name: 'Administrator',
  email: 'admin',
  role: 'Admin',
  password: 'admin123',
  createdAt: new Date().toISOString()
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [developers, setDevelopers] = useState<Developer[]>(INITIAL_DEVELOPERS);
  const [users, setUsers] = useState<User[]>([DEFAULT_ADMIN]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState<Project | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  useEffect(() => {
    const savedClients = localStorage.getItem('it_clients');
    const savedProjects = localStorage.getItem('it_projects');
    const savedDevs = localStorage.getItem('it_devs');
    const savedUsers = localStorage.getItem('it_users');
    const savedAuth = localStorage.getItem('it_auth_user');

    if (savedClients) setClients(JSON.parse(savedClients));
    if (savedProjects) setProjects(JSON.parse(savedProjects));
    if (savedDevs) setDevelopers(JSON.parse(savedDevs));
    if (savedUsers) setUsers(JSON.parse(savedUsers));
    if (savedAuth) setCurrentUser(JSON.parse(savedAuth));
  }, []);

  const persistData = (newClients: Client[], newProjects: Project[], newDevs: Developer[], newUsers: User[]) => {
    localStorage.setItem('it_clients', JSON.stringify(newClients));
    localStorage.setItem('it_projects', JSON.stringify(newProjects));
    localStorage.setItem('it_devs', JSON.stringify(newDevs));
    localStorage.setItem('it_users', JSON.stringify(newUsers));
  };

  const addNotification = (type: NotificationCategory, subject: string, message: string, projectName: string) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type,
      priority: 'Medium',
      recipients: ['Admin'],
      subject,
      message,
      projectName,
      isRead: false,
      isResolved: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const updateProject = (updatedProject: Project) => {
    const oldProject = projects.find(p => p.id === updatedProject.id);

    // Check for status change
    if (oldProject && oldProject.status !== updatedProject.status) {
      addNotification(
        'StatusChange',
        'Project Status Updated',
        `Status changed from ${oldProject.status} to ${updatedProject.status}`,
        updatedProject.name
      );
    }

    const updated = projects.map(p => p.id === updatedProject.id ? updatedProject : p);
    setProjects(updated);
    persistData(clients, updated, developers, users);
  };

  const handleCreateProject = (newProject: Project) => {
    const updated = [...projects, newProject];
    setProjects(updated);
    persistData(clients, updated, developers, users);
    addNotification('System', 'New Project Created', 'Project has been successfully created.', newProject.name);
  };

  const handleSaveProject = (data: any) => {
    const isNew = !data.id;

    if (isNew) {
      const newProject: Project = {
        ...data,
        id: Date.now().toString(),
        invoiceNumber: generateInvoiceNumber(),
        isInvoiceIssued: false,
        status: data.status || 'Pending',
        milestones: getMilestonesByProjectType(data.projectType, data.baseProjectAmount),
        developerTotalCost: (data.squad || []).reduce((sum: number, d: any) => sum + d.totalCost, 0),
        tasks: []
      };
      handleCreateProject(newProject);
    } else {
      const currentProject = projects.find(p => p.id === data.id);
      if (currentProject) {
        const updatedProject: Project = {
          ...currentProject, // Keep existing fields like status if not strictly overwritten, but 'data' likely has all form fields.
          ...data,
          milestones: currentProject.baseProjectAmount !== data.baseProjectAmount ? getMilestonesByProjectType(data.projectType, data.baseProjectAmount) : (data.milestones || currentProject.milestones),
          developerTotalCost: (data.squad || []).reduce((sum: number, d: any) => sum + d.totalCost, 0)
        };
        updateProject(updatedProject);
      }
    }

    setShowProjectModal(false);
    setEditingProject(null);
  };

  const handleLogin = (creds: { email: string; pass: string }) => {
    const user = users.find(u => u.email === creds.email && u.password === creds.pass);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('it_auth_user', JSON.stringify(user));
    } else {
      alert('Invalid Credentials');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('it_auth_user');
  };

  if (!currentUser) return <Login onLogin={handleLogin} />;

  const pendingCount = projects.filter(p => p.status === 'Pending').length;

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onLogout={handleLogout}
      notificationCount={notifications.filter(n => !n.isRead).length}
      pendingCount={pendingCount}
    >
      {activeTab === 'dashboard' && (
        <Dashboard projects={projects} clients={clients} notifications={notifications} onAddProject={() => setShowProjectModal(true)} />
      )}

      {activeTab === 'settings' && (
        <Settings
          users={users}
          currentUserEmail={currentUser.email}
          onAddUser={(newUser) => {
            const user: User = { ...newUser, id: Date.now().toString(), createdAt: new Date().toISOString() };
            const updated = [...users, user];
            setUsers(updated);
            persistData(clients, projects, developers, updated);
          }}
          onDeleteUser={(id) => {
            const updated = users.filter(u => u.id !== id);
            setUsers(updated);
            persistData(clients, projects, developers, updated);
          }}
        />
      )}

      {activeTab === 'projects' && (
        <ProjectList
          projects={projects.filter(p => ['Approved', 'Ongoing', 'On Hold'].includes(p.status))}
          clients={clients} developers={developers}
          onAdd={() => setShowProjectModal(true)}
          onEdit={(p) => { setEditingProject(p); setShowProjectModal(true); }}
          onView={(p) => setSelectedProjectForDetail(p)}
          onDelete={(id) => {
            const updated = projects.filter(p => p.id !== id);
            setProjects(updated);
            persistData(clients, updated, developers, users);
          }}
          onUpdate={updateProject}
        />
      )}

      {activeTab === 'archived' && (
        <ProjectList
          title="Historical Project Archive"
          description="View completed, cancelled, or rejected projects."
          projects={projects.filter(p => ['Completed', 'Cancelled', 'Rejected'].includes(p.status))}
          clients={clients} developers={developers}
          onAdd={() => setShowProjectModal(true)}
          onEdit={(p) => { setEditingProject(p); setShowProjectModal(true); }}
          onView={(p) => setSelectedProjectForDetail(p)}
          onDelete={(id) => {
            const updated = projects.filter(p => p.id !== id);
            setProjects(updated);
            persistData(clients, updated, developers, users);
          }}
          onUpdate={updateProject}
        />
      )}

      {activeTab === 'tasks' && (
        <TaskBoard projects={projects} developers={developers} onUpdateProject={handleSaveProject} />
      )}

      {activeTab === 'pending' && (
        <PendingProjectManager
          projects={projects} clients={clients} developers={developers}
          onUpdateStatus={(id, status) => {
            const project = projects.find(p => p.id === id);
            if (project) updateProject({ ...project, status });
          }}
          onUpdateInvoice={() => { }} onViewDetails={(p) => setSelectedProjectForDetail(p)}
          onAddProject={handleSaveProject}
        />
      )}

      {activeTab === 'clients' && (
        <ClientList
          clients={clients}
          projects={projects}
          onAdd={(newClient) => {
            const updated = [...clients, { ...newClient, id: Date.now().toString() }];
            setClients(updated);
            persistData(updated, projects, developers, users);
          }}
          onUpdate={(updatedClient) => {
            const updated = clients.map(c => c.id === updatedClient.id ? updatedClient : c);
            setClients(updated);
            persistData(updated, projects, developers, users);
          }}
          onDelete={(id) => {
            const updated = clients.filter(c => c.id !== id);
            setClients(updated);
            persistData(updated, projects, developers, users);
          }}
        />
      )}

      {activeTab === 'teams' && (
        <DeveloperList
          developers={developers}
          onAdd={(d) => {
            const updated = [...developers, { ...d, id: Date.now().toString() }];
            setDevelopers(updated);
            persistData(clients, projects, updated, users);
          }}
          onUpdate={(d) => {
            const updated = developers.map(dev => dev.id === d.id ? d : dev);
            setDevelopers(updated);
            persistData(clients, projects, updated, users);
          }}
          onDelete={(id) => {
            const updated = developers.filter(dev => dev.id !== id);
            setDevelopers(updated);
            persistData(clients, projects, updated, users);
          }}
        />
      )}

      {selectedProjectForDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedProjectForDetail(null)}>
          <div className="bg-white rounded-[40px] w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 sm:p-12 shadow-2xl border border-[#F1F5F9]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8 sm:mb-12 border-b border-[#F1F5F9] pb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">{selectedProjectForDetail.name}</h2>
                <p className="text-[#2563EB] font-bold text-xs uppercase tracking-widest mt-1">Project Detailed View</p>
              </div>
              <button onClick={() => setSelectedProjectForDetail(null)} className="p-3 bg-[#F8FAFC] hover:bg-rose-50 hover:text-rose-500 rounded-2xl transition-all"><ICONS.Delete /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
              <div className="space-y-6">
                <div className="p-6 bg-slate-50 rounded-3xl space-y-4">
                  <h4 className="text-xs font-black text-[#94A3B8] uppercase tracking-widest">Client Context</h4>
                  <p className="text-lg font-bold text-[#0F172A]">{clients.find(c => c.id === selectedProjectForDetail.clientId)?.companyName || 'Private'}</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl space-y-4">
                  <h4 className="text-xs font-black text-[#94A3B8] uppercase tracking-widest">Budgeting</h4>
                  <p className="text-2xl font-black text-[#0F172A]">{formatCurrency(calculateGrandTotal(selectedProjectForDetail), selectedProjectForDetail.currency)}</p>
                </div>
              </div>
              <div className="p-8 bg-blue-50 rounded-[40px] border border-blue-100">
                <h4 className="text-xs font-black text-[#2563EB] uppercase tracking-widest mb-4">Milestone Progress</h4>
                <div className="space-y-4">
                  {selectedProjectForDetail.milestones.map((m, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-blue-100 last:border-0">
                      <span className="text-sm font-bold text-[#1E3A8A]">{m.label}</span>
                      <span className="text-sm font-black text-[#2563EB]">{formatCurrency(m.amount, selectedProjectForDetail.currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ProjectModal
        isOpen={showProjectModal}
        onClose={() => { setShowProjectModal(false); setEditingProject(null); }}
        onSubmit={handleSaveProject}
        clients={clients}
        developers={developers}
        initialData={editingProject}
      />
    </Layout>
  );
};

export default App;
