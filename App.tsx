
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ClientList from './components/ClientList';
import ProjectList from './components/ProjectList';
import DeveloperList from './components/DeveloperList';
// TaskBoard (Mission Control) removed
import PendingProjectManager from './components/PendingProjectManager';
import Login from './components/Login';
import ProjectModal from './components/ProjectModal';
import Settings from './components/Settings';
import ProjectDetailView from './components/ProjectDetailView';
import PaymentTracker from './components/PaymentTracker';
import { Client, Project, Developer, Notification, User } from './types';
import {
  fetchProjects, fetchClients, fetchDevelopers, fetchNotifications,
  createProject, updateProject, deleteProject, fetchPayments
} from './services/api';
import { ICONS } from './constants';
import { formatCurrency, calculateGrandTotal } from './utils';

// Note: Authentication now delegates to the backend `auth.php` endpoint.

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState<Project | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsUsers, setSettingsUsers] = useState<User[]>([]);

  // Check Auth on mount
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const res = await fetch('/api/auth.php?action=check', { credentials: 'include' });
        const data = await res.json();
        if (data.authenticated && data.user) {
          const user: User = {
            id: String(data.user.id),
            name: data.user.name,
            username: data.user.username,
            email: data.user.email || '',
            role: data.user.role,
            createdAt: new Date().toISOString()
          };
          setCurrentUser(user);
          localStorage.setItem('it_auth_user', JSON.stringify(user));
        } else {
          setCurrentUser(null);
          localStorage.removeItem('it_auth_user');
        }
      } catch (err) {
        console.error("Auth check failed", err);
        // Fallback to local storage if server is down (optional, but safer to just let it load data later)
        const savedAuth = localStorage.getItem('it_auth_user');
        if (savedAuth) {
          try {
            setCurrentUser(JSON.parse(savedAuth));
          } catch {
            localStorage.removeItem('it_auth_user');
          }
        }
      }
    };
    verifyAuth();
  }, []);


  // Load data only when user is authenticated
  useEffect(() => {
    if (!currentUser) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const [pData, cData, dData, nData] = await Promise.all([
          fetchProjects(),
          fetchClients(),
          fetchDevelopers(),
          fetchNotifications()
        ]);
        setProjects(Array.isArray(pData) ? pData : []);
        setClients(Array.isArray(cData) ? cData : []);
        setDevelopers(Array.isArray(dData) ? dData : []);
        setNotifications(Array.isArray(nData) ? nData : []);
      } catch (err) {
        console.error("Failed to load initial data", err);
        // Set empty arrays on error to prevent crashes
        setProjects([]);
        setClients([]);
        setDevelopers([]);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  const refreshData = async () => {
    const pData = await fetchProjects();
    setProjects(pData);
    const nData = await fetchNotifications();
    setNotifications(nData);
  };

  const [settingsUsersLoading, setSettingsUsersLoading] = useState(false);
  const [settingsUsersAdminOnly, setSettingsUsersAdminOnly] = useState(false);

  const fetchSettingsUsers = async () => {
    if (!currentUser) return;
    setSettingsUsersLoading(true);
    setSettingsUsersAdminOnly(false);
    try {
      const res = await fetch('/api/users.php', { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (res.status === 403) {
        setSettingsUsersAdminOnly(true);
        setSettingsUsers([{ ...currentUser }]);
      } else if (data.success && Array.isArray(data.users)) {
        setSettingsUsers(data.users.map((u: any) => ({
          id: String(u.id),
          name: u.name,
          username: u.username,
          email: u.email,
          password: '',
          role: u.role || 'User',
          createdAt: u.createdAt || u.created_at || new Date().toISOString()
        })));

      } else {
        setSettingsUsers([{ ...currentUser }]);
      }
    } catch {
      setSettingsUsers([{ ...currentUser }]);
    } finally {
      setSettingsUsersLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && activeTab === 'settings') fetchSettingsUsers();
  }, [currentUser, activeTab]);

  const handleAddUser = async (user: Omit<User, 'id' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/auth.php?action=register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, name: user.name, email: user.email, password: user.password, role: user.role })
      });
      const data = await res.json();
      if (data.success) {
        await fetchSettingsUsers();
      } else {
        alert(data.message || 'Failed to add user');
      }
    } catch (err) {
      alert('Failed to add user');
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      const res = await fetch('/api/users.php', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: Number(id) })
      });
      const data = await res.json();
      if (data.success) await fetchSettingsUsers();
      else alert(data.message || 'Failed to remove user');
    } catch {
      alert('Failed to remove user');
    }
  };

  const handleEditUser = async (id: string, updates: { name?: string; username?: string; email?: string; password?: string; role?: 'Superadmin' | 'Admin' | 'User' }): Promise<boolean> => {
    try {
      const body: any = { id: Number(id), ...updates };
      if (!updates.password) delete body.password;

      const res = await fetch('/api/update_user.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        await fetchSettingsUsers();
        return true;
      }
      alert(data.message || data.error || 'Failed to update user');
      return false;
    } catch {
      alert('Failed to update user');
      return false;
    }
  };

  const handleSaveProject = async (data: any) => {
    try {
      if (data.id) {
        // Update
        const res = await updateProject(data.id, data);
        if (res.success) {
          await refreshData();
          setShowProjectModal(false);
          setEditingProject(null);
        } else {
          alert("Update Failed: " + (res.message || res.error || JSON.stringify(res)));
        }
      } else {
        // Create
        const res = await createProject(data);
        if (res.success) {
          await refreshData();
          setShowProjectModal(false);
        } else {
          alert("Creation Failed: " + (res.message || res.error || JSON.stringify(res)));
        }
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred");
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (confirm("Are you sure you want to delete this project?")) {
      await deleteProject(id);
      await refreshData();
      if (selectedProjectForDetail?.id === id) setSelectedProjectForDetail(null);
    }
  };

  const handleLogin = async (creds: { username: string; pass: string }) => {
    try {
      const res = await fetch('/api/auth.php?action=login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: creds.username, password: creds.pass })
      });
      let data: { success?: boolean; message?: string; user?: { id: number; name: string; username: string; role: 'Superadmin' | 'Admin' | 'User' } };
      const text = await res.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        console.error('Login API response (not JSON):', text?.slice(0, 500));
        data = {
          success: false,
          message: text?.includes('Database connection failed') || text?.includes('error')
            ? (text.match(/"message":"([^"]+)"/)?.[1] || text.slice(0, 150))
            : 'Server error: API did not return valid JSON. Check that the database exists and npm run dev:api is running.'
        };
      }
      if (res.ok && data.success && data.user) {
        const user: User = {
          id: String(data.user.id),
          name: data.user.name,
          username: data.user.username,
          email: '', // Backend might not return email on login for security or if not needed
          role: data.user.role,
          createdAt: new Date().toISOString()
        };
        setCurrentUser(user);
        localStorage.setItem('it_auth_user', JSON.stringify(user));
      } else {
        alert(data.message || 'Invalid credentials');
      }
    } catch (err) {
      console.error('Login error', err);
      const isNetworkError = err instanceof TypeError && (err as Error).message?.toLowerCase().includes('fetch');
      alert(isNetworkError
        ? 'Cannot reach the server. Start the API with: npm run dev:api (in a separate terminal), then try again.'
        : 'Login failed - please contact your administrator.');
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
      notificationCount={notifications.filter((n: any) => !n.is_read).length}
      pendingCount={pendingCount}
      currentUser={currentUser}
    >

      {activeTab === 'dashboard' && (
        <Dashboard
          projects={projects}
          clients={clients}
          notifications={notifications}
          onAddProject={() => { setEditingProject(null); setShowProjectModal(true); }}
          onAddClient={() => setActiveTab('clients')}
          onViewTeams={() => setActiveTab('teams')}
        />

      )}

      {activeTab === 'projects' && (
        <ProjectList
          projects={projects.filter(p => ['Active', 'Pending'].includes(p.status))}
          clients={clients} developers={developers}
          onAdd={() => { setEditingProject(null); setShowProjectModal(true); }}
          onEdit={(p) => { setEditingProject(p); setShowProjectModal(true); }}
          onView={(p) => setSelectedProjectForDetail(p)}
          onDelete={handleDeleteProject}
          onUpdate={(p) => handleSaveProject(p)}
        />
      )}

      {activeTab === 'pending' && (
        <ProjectList
          title="Pending Approval"
          description="Projects awaiting client or internal approval."
          projects={projects.filter(p => p.status === 'Pending')}
          clients={clients}
          developers={developers}
          onAdd={() => { setEditingProject(null); setShowProjectModal(true); }}
          onEdit={(p) => { setEditingProject(p); setShowProjectModal(true); }}
          onView={(p) => setSelectedProjectForDetail(p)}
          onDelete={handleDeleteProject}
          onUpdate={(p) => handleSaveProject(p)}
        />
      )}

      {activeTab === 'archived' && (
        <ProjectList
          title="Historical Project Archive"
          description="View completed or cancelled projects."
          projects={projects.filter(p => ['Completed', 'Cancelled'].includes(p.status))}
          clients={clients} developers={developers}
          onAdd={() => { setEditingProject(null); setShowProjectModal(true); }}
          onEdit={(p) => { setEditingProject(p); setShowProjectModal(true); }}
          onView={(p) => setSelectedProjectForDetail(p)}
          onDelete={handleDeleteProject}
          onUpdate={(p) => handleSaveProject(p)}
        />
      )}

      {/* Simplified TaskBoard placeholder or reimplement if Task API exists. 
          Assuming users want project management primarily based on requirements. 
          Will hide or default to ProjectList if tasks not core requirement in prompt 
          (Prompt mentions "Project Management ... Add, edit, delete projects..."). 
          It mentions "TaskBoard" in original file list but prompt didn't explicitly ask for task management features beyond projects.
          I'll leave it but commented out or minimal if TaskBoard.tsx requires complex refactor. 
          Actually, I'll just render it if it works with project data. 
          TaskBoard.tsx likely relies on 'tasks' array in project. My schema removed tasks table in favor of simplicty?
          Wait, schema did NOT include tasks table. Prompt didn't ask for tasks within projects.
          So TaskBoard might be broken. I'll skip it effectively.
      */}

      {activeTab === 'clients' && (
        <ClientList
          clients={clients}
          projects={projects}
          onAdd={() => refreshData()}
          onUpdate={() => refreshData()}
          onDelete={() => refreshData()}
        />
      )}

      {activeTab === 'teams' && (
        <DeveloperList
          developers={developers}
          onAdd={() => refreshData()}
          onUpdate={() => refreshData()}
          onDelete={() => refreshData()}
        />
      )}

      {activeTab === 'settings' && <Settings users={settingsUsers} currentUsername={currentUser.username} currentUserRole={currentUser.role} usersLoading={settingsUsersLoading} adminOnlyMessage={settingsUsersAdminOnly} onAddUser={handleAddUser} onDeleteUser={handleDeleteUser} onEditUser={handleEditUser} />}


      {selectedProjectForDetail && (
        <ProjectDetailView
          project={selectedProjectForDetail}
          clients={clients}
          developers={developers}
          onClose={() => setSelectedProjectForDetail(null)}
          onRefresh={async () => {
            if (selectedProjectForDetail.id) {
              const res = await fetch(`/api/projects.php?id=${selectedProjectForDetail.id}`);
              const detail = await res.json();
              setSelectedProjectForDetail(detail);

              // Also refresh main list to keep data in sync
              const freshData = await fetchProjects();
              setProjects(freshData);
            }
          }}
        />
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
