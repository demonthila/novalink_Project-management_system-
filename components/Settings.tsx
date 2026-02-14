
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { ICONS } from '../constants';
import { fetchSettings, updateSettings } from '../services/api';
import { toast } from 'react-hot-toast';

interface SettingsProps {
    users: User[];
    currentUsername: string;
    currentUserRole: string;
    usersLoading: boolean;
    adminOnlyMessage: boolean;
    onAddUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
    onDeleteUser: (id: string) => void;
    onEditUser: (id: string, updates: { name?: string; username?: string; email?: string; password?: string; role?: 'Superadmin' | 'Admin' | 'User' }) => void | Promise<boolean>;
}

const Settings: React.FC<SettingsProps> = ({ users, currentUsername, currentUserRole, usersLoading, adminOnlyMessage, onAddUser, onDeleteUser, onEditUser }) => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editForm, setEditForm] = useState({ name: '', username: '', email: '', password: '', role: 'Admin' as 'Superadmin' | 'Admin' | 'User' });
    const [newUser, setNewUser] = useState({ name: '', username: '', email: '', password: '', role: 'Admin' as 'Superadmin' | 'Admin' | 'User' });
    const [currency, setCurrency] = useState('AUD');
    const [demoAdminExists, setDemoAdminExists] = useState<boolean | null>(null);
    const [reminderEmail, setReminderEmail] = useState('novalinkhelp@gmail.com');


    useEffect(() => {
        const loadSettings = async () => {
            try {
                const settings = await fetchSettings();
                if (settings?.currency) {
                    setCurrency(settings.currency);
                    localStorage.setItem('stratis_currency', settings.currency);
                }
                if (settings?.reminder_email) {
                    setReminderEmail(settings.reminder_email);
                }
            } catch (error) {
                console.error("Failed to load settings", error);
            }
        };
        loadSettings();
        (async () => {
            try {
                const res = await fetch('/api/create_demo_admin.php');
                const j = await res.json();
                setDemoAdminExists(j.exists === true);
            } catch {
                setDemoAdminExists(null);
            }
        })();
    }, []);

    const isAdmin = currentUserRole === 'Admin' || currentUserRole === 'Superadmin';
    const isSuperadmin = currentUserRole === 'Superadmin';


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddUser(newUser);
        setShowAddModal(false);
        setNewUser({ name: '', username: '', email: '', password: '', role: 'Admin' });
    };

    const handleCurrencyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const v = e.target.value;
        setCurrency(v);
        localStorage.setItem('stratis_currency', v);
        window.dispatchEvent(new Event('stratis-currency-change'));
        try {
            await updateSettings({ currency: v });
            toast.success(`Currency updated to ${v}`);
        } catch (error) {
            toast.error("Failed to save currency");
        }
    };

    const handleReminderEmailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value;
        setReminderEmail(v);
        try {
            await updateSettings({ reminder_email: v });
            toast.success('Reminder email updated');
        } catch (error) {
            toast.error("Failed to save reminder email");
        }
    };

    const handleDeleteClick = (user: User) => {
        if (user.username === currentUsername) {
            alert("You cannot delete your own account.");
            return;
        }
        if (user.role === 'Superadmin' && !isSuperadmin) {
            alert("Only Superadmins can delete other Superadmins.");
            return;
        }
        if (!confirm(`Remove access for ${user.name} (${user.username})?`)) return;
        onDeleteUser(user.id);
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Settings</h2>
                <p className="text-slate-500 text-sm mt-0.5">Preferences and access control.</p>
            </div>

            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                        <ICONS.Settings /> Preferences
                    </h3>
                </div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Currency</label>
                        <select
                            value={currency}
                            onChange={handleCurrencyChange}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        >
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="LKR">LKR (Rs)</option>
                            <option value="AUD">AUD ($)</option>
                            <option value="CAD">CAD ($)</option>
                        </select>
                        <p className="text-xs text-slate-400 mt-1">Used for reports and amounts.</p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Reminders Email</label>
                        <div className="relative">
                            <input
                                type="email"
                                value={reminderEmail}
                                onChange={handleReminderEmailChange}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                placeholder="novalinkhelp@gmail.com"
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 text-emerald-600 font-bold">System notifications will be routed here.</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Export data</label>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { label: 'Projects', url: '/api/export_projects_csv.php', file: 'projects' },
                                { label: 'Clients', url: '/api/export_clients_csv.php', file: 'clients' },
                                { label: 'Developers', url: '/api/export_developers_csv.php', file: 'developers' },
                            ].map(({ label, url, file }) => (
                                <button
                                    key={file}
                                    onClick={async () => {
                                        try {
                                            const res = await fetch(url);
                                            if (!res.ok) throw new Error('Export failed');
                                            const blob = await res.blob();
                                            const a = document.createElement('a');
                                            a.href = URL.createObjectURL(blob);
                                            a.download = `${file}_${new Date().toISOString().slice(0, 10)}.csv`;
                                            a.click();
                                            URL.revokeObjectURL(a.href);
                                        } catch {
                                            alert(`Failed to export ${label.toLowerCase()}.`);
                                        }
                                    }}
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2"
                                >
                                    <ICONS.Download /> {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Access control</h3>
                        <p className="text-slate-500 text-xs mt-0.5">Add, edit, or remove user access and roles.</p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        {demoAdminExists !== null && (
                            <span className="text-xs text-slate-400">
                                {demoAdminExists ? (
                                    <button type="button" onClick={async () => {
                                        if (!confirm('Remove demo admin (admin)?')) return;
                                        try {
                                            const res = await fetch('/api/create_demo_admin.php', { credentials: 'include', method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete' }) });
                                            const j = await res.json();
                                            if (j.success) setDemoAdminExists(false);
                                            else alert(j.message || 'Failed');
                                        } catch { alert('Request failed'); }
                                    }} className="text-rose-500 hover:underline">Remove demo admin</button>
                                ) : (
                                    <button type="button" onClick={async () => {
                                        try {
                                            const res = await fetch('/api/create_demo_admin.php', { credentials: 'include', method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create' }) });
                                            const j = await res.json();
                                            if (j.success) setDemoAdminExists(true);
                                            else alert(j.message || 'Failed');
                                        } catch { alert('Request failed'); }
                                    }} className="text-emerald-600 hover:underline">Create demo admin</button>
                                )}
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={() => setShowAddModal(true)}
                            disabled={!isAdmin}
                            title={!isAdmin ? 'Admin access required to add users' : ''}
                            className="flex items-center gap-2 px-6 py-3 bg-[#2563EB] text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                            Add user
                        </button>
                    </div>
                </div>

                {adminOnlyMessage && (
                    <div className="mx-6 mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                        Admin access is required to view and manage all users. You can edit your own details below.
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                                <th className="px-5 py-3">Name</th>
                                <th className="px-5 py-3">Email / Username</th>
                                <th className="px-5 py-3">Role</th>
                                <th className="px-5 py-3">Joined</th>
                                <th className="px-5 py-3 text-right w-24">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {usersLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-sm">
                                        Loading users…
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-sm">
                                        No users yet. Admins can click “Add user” to create access.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${user.role === 'Superadmin' ? 'bg-indigo-600 text-white' : user.role === 'Admin' ? 'bg-slate-800 text-white' : 'bg-blue-100 text-blue-700'}`}>
                                                    {user.name.split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                </div>
                                                <span className="font-semibold text-slate-800">{user.name}</span>
                                                {user.username === currentUsername && (
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">You</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-slate-600 text-sm font-medium">{user.username} {user.email && <span className="text-slate-400">({user.email})</span>}</td>
                                        <td className="px-5 py-3">
                                            <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold uppercase ${user.role === 'Superadmin' ? 'bg-indigo-600 text-white' : user.role === 'Admin' ? 'bg-slate-800 text-white' : 'bg-blue-100 text-blue-700'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-slate-500 text-sm">
                                            {new Date(user.createdAt || 0).toLocaleDateString()}
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingUser(user);
                                                        setEditForm({ name: user.name, username: user.username, email: user.email, password: '', role: user.role });
                                                    }}
                                                    className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                    title="Edit"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                </button>
                                                {user.username !== currentUsername && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteClick(user)}
                                                        className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                                        title="Remove access"
                                                    >
                                                        <ICONS.Delete />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Edit user modal */}
            {editingUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setEditingUser(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-200 p-6 sm:p-8" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-black text-slate-800 mb-6">Edit user</h3>
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const result = await onEditUser(editingUser.id, {
                                    name: editForm.name,
                                    username: editForm.username,
                                    email: editForm.email,
                                    password: editForm.password || undefined,
                                    role: editForm.role,
                                });
                                if (result) {
                                    setEditingUser(null);
                                    setEditForm({ name: '', username: '', email: '', password: '', role: 'Admin' });
                                }

                            }}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Name</label>
                                <input
                                    required
                                    value={editForm.name}
                                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    placeholder="Full name"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Username</label>
                                <input
                                    required
                                    value={editForm.username}
                                    onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    placeholder="Username"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email (optional)</label>
                                <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    placeholder="email@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">New password (optional)</label>
                                <input
                                    type="password"
                                    value={editForm.password}
                                    onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    placeholder="Leave blank to keep current"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Role</label>
                                <select
                                    value={editForm.role}
                                    onChange={e => setEditForm(f => ({ ...f, role: e.target.value as any }))}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                >
                                    <option value="User">User</option>
                                    <option value="Admin">Admin</option>
                                    {isSuperadmin && <option value="Superadmin">Superadmin</option>}
                                </select>
                            </div>
                            <div className="flex gap-4 pt-4 items-center">
                                <button
                                    type="button"
                                    onClick={() => { setEditingUser(null); setEditForm({ name: '', username: '', email: '', password: '', role: 'Admin' }); }}
                                    className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-500 font-bold uppercase text-[11px] tracking-widest hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 rounded-xl bg-slate-800 text-white font-black uppercase text-[11px] tracking-widest shadow-lg shadow-slate-200 hover:bg-slate-700 hover:-translate-y-0.5 transition-all"
                                >
                                    Save changes
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}

            {/* Add user modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-200 p-6 sm:p-8" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-black text-slate-800 mb-6">Add user</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Name</label>
                                <input
                                    required
                                    value={newUser.name}
                                    onChange={e => setNewUser(u => ({ ...u, name: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    placeholder="Full name"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Username</label>
                                <input
                                    required
                                    value={newUser.username}
                                    onChange={e => setNewUser(u => ({ ...u, username: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    placeholder="Username"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email (optional)</label>
                                <input
                                    type="email"
                                    value={newUser.email}
                                    onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    placeholder="email@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Password</label>
                                <input
                                    required
                                    type="password"
                                    value={newUser.password}
                                    onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Role</label>
                                <select
                                    value={newUser.role}
                                    onChange={e => setNewUser(u => ({ ...u, role: e.target.value as any }))}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                >
                                    <option value="Admin">Admin</option>
                                    <option value="User">User</option>
                                    {isSuperadmin && <option value="Superadmin">Superadmin</option>}
                                </select>
                            </div>
                            <div className="flex gap-4 pt-4 items-center">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-500 font-bold uppercase text-[11px] tracking-widest hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 rounded-xl bg-slate-800 text-white font-black uppercase text-[11px] tracking-widest shadow-lg shadow-slate-200 hover:bg-slate-700 hover:-translate-y-0.5 transition-all"
                                >
                                    Create user
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
