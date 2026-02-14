
import React, { useState, useEffect } from 'react';
import { User, Settings as AppSettings } from '../types';
import { ICONS } from '../constants';
import { fetchSettings, updateSettings } from '../services/api';

interface SettingsProps {
    users: User[];
    onAddUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
    onDeleteUser: (id: string) => void;
    currentUserEmail: string;
}

const Settings: React.FC<SettingsProps> = ({ users, onAddUser, onDeleteUser, currentUserEmail }) => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'User' as 'Admin' | 'User' });
    const [currency, setCurrency] = useState('AUD');

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const settings = await fetchSettings();
                if (settings && settings.currency) {
                    setCurrency(settings.currency);
                    localStorage.setItem('stratis_currency', settings.currency);
                }
            } catch (error) {
                console.error("Failed to load settings", error);
            }
        };
        loadSettings();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddUser(newUser);
        setShowAddModal(false);
        setNewUser({ name: '', email: '', password: '', role: 'User' });
    };

    const handleCurrencyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCurrency = e.target.value;
        setCurrency(newCurrency);
        localStorage.setItem('stratis_currency', newCurrency);
        window.dispatchEvent(new Event('stratis-currency-change'));

        try {
            await updateSettings({ currency: newCurrency });
        } catch (error) {
            console.error("Failed to save currency setting", error);
        }
    };

    // Reminder/testing endpoints removed from UI per request

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-[#0F172A] tracking-tighter">System Settings</h2>
                    <p className="text-slate-500 font-medium mt-1">Manage global preferences and user access.</p>
                </div>
            </div>

            {/* Global Preferences Card */}
            <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-slate-100 shadow-sm">
                <h3 className="text-xl font-black text-[#0F172A] mb-6 flex items-center gap-2">
                    <ICONS.Settings /> Preferences
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Currency Selector */}
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">System Currency</label>
                        <div className="relative">
                            <select
                                value={currency}
                                onChange={handleCurrencyChange}
                                className="w-full appearance-none bg-slate-50 border border-slate-200 text-[#0F172A] font-bold text-lg rounded-2xl px-5 py-4 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all cursor-pointer hover:bg-slate-100"
                            >
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                                <option value="LKR">LKR (Rs)</option>
                                <option value="AUD">AUD ($)</option>
                                <option value="CAD">CAD ($)</option>
                            </select>
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 font-medium px-1">Applied to all financial reports.</p>
                    </div>

                    {/* Data Management */}
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Data Management</label>
                        <div className="flex gap-3">
                            <button
                                onClick={async () => {
                                    const date = new Date().toISOString().slice(0,10);
                                    try {
                                        const res = await fetch('/api/export_projects_csv.php');
                                        if (!res.ok) throw new Error('Export failed');
                                        const blob = await res.blob();
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `projects_export_${date}.csv`;
                                        document.body.appendChild(a);
                                        a.click();
                                        a.remove();
                                        window.URL.revokeObjectURL(url);
                                    } catch (err) {
                                        console.error(err);
                                        alert('Failed to export projects.');
                                    }
                                }}
                                className="flex-1 bg-white border border-slate-100 text-slate-800 font-bold rounded-2xl px-5 py-4 hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <ICONS.Download />
                                Export Projects (CSV)
                            </button>
                            <button
                                onClick={async () => {
                                    const date = new Date().toISOString().slice(0,10);
                                    try {
                                        const res = await fetch('/api/export_clients_csv.php');
                                        if (!res.ok) throw new Error('Export failed');
                                        const blob = await res.blob();
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `clients_export_${date}.csv`;
                                        document.body.appendChild(a);
                                        a.click();
                                        a.remove();
                                        window.URL.revokeObjectURL(url);
                                    } catch (err) {
                                        console.error(err);
                                        alert('Failed to export clients.');
                                    }
                                }}
                                className="flex-1 bg-white border border-slate-100 text-slate-800 font-bold rounded-2xl px-5 py-4 hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <ICONS.Download />
                                Export Clients (CSV)
                            </button>
                            <button
                                onClick={async () => {
                                    const date = new Date().toISOString().slice(0,10);
                                    try {
                                        const res = await fetch('/api/export_developers_csv.php');
                                        if (!res.ok) throw new Error('Export failed');
                                        const blob = await res.blob();
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `developers_export_${date}.csv`;
                                        document.body.appendChild(a);
                                        a.click();
                                        a.remove();
                                        window.URL.revokeObjectURL(url);
                                    } catch (err) {
                                        console.error(err);
                                        alert('Failed to export developers.');
                                    }
                                }}
                                className="flex-1 bg-white border border-slate-100 text-slate-800 font-bold rounded-2xl px-5 py-4 hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <ICONS.Download />
                                Export Developers (CSV)
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 font-medium px-1">Export structured CSVs for Projects, Clients and Developers.</p>
                    </div>

                    {/* Email Test removed per request (reminders handled by server cron) */}
                </div>
            </div>

            {/* Access Control Header */}
            <div className="flex items-center justify-between pt-4">
                <div>
                    <h2 className="text-2xl font-black text-[#0F172A] tracking-tighter">Access Control</h2>
                    <p className="text-slate-500 font-medium mt-1">Manage team permissions.</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-3 bg-[#2563EB] hover:bg-blue-600 text-white px-6 py-4 rounded-[20px] transition-all shadow-xl shadow-blue-200 group active:scale-95"
                >
                    <span className="font-bold text-sm uppercase tracking-widest">Add User</span>
                    <div className="bg-white/20 p-1 rounded-lg group-hover:rotate-90 transition-transform duration-300">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                    </div>
                </button>
            </div>

            {/* User Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map(user => (
                    <div key={user.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group relative overflow-hidden">
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            {user.email !== 'admin' && user.email !== currentUserEmail && (
                                <button
                                    onClick={() => onDeleteUser(user.id)}
                                    className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                    title="Revoke Access"
                                >
                                    <ICONS.Delete />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-4 mb-6">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg border-2 border-white ${user.role === 'Admin' ? 'bg-[#0F172A] text-white shadow-slate-200' : 'bg-blue-50 text-blue-600 shadow-blue-100'}`}>
                                {user.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-bold text-[#0F172A] text-lg leading-tight">{user.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className={`w-2 h-2 rounded-full ${user.role === 'Admin' ? 'bg-[#0F172A]' : 'bg-blue-500'}`} />
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                        {user.role}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</span>
                                <span className="font-bold text-slate-700 text-xs truncate max-w-[120px]">{user.email}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Joined</span>
                                <span className="font-bold text-slate-700 text-xs">{new Date(user.createdAt || new Date()).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white rounded-[40px] w-full max-w-lg p-8 sm:p-12 shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-100">
                        <h3 className="text-2xl font-black text-[#0F172A] mb-8">Create New Access</h3>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-3">Full Name</label>
                                <input
                                    required
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-bold focus:bg-white focus:border-[#0F172A] focus:ring-4 focus:ring-slate-100 transition-all outline-none"
                                    placeholder="e.g. John Doe"
                                    value={newUser.name}
                                    onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-3">Email / Username</label>
                                <input
                                    required
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-bold focus:bg-white focus:border-[#0F172A] focus:ring-4 focus:ring-slate-100 transition-all outline-none"
                                    placeholder="e.g. john@company.com"
                                    value={newUser.email}
                                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-3">Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-bold focus:bg-white focus:border-[#0F172A] focus:ring-4 focus:ring-slate-100 transition-all outline-none"
                                    placeholder="••••••••"
                                    value={newUser.password}
                                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-3">Role Permission</label>
                                <select
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-bold focus:bg-white focus:border-[#0F172A] focus:ring-4 focus:ring-slate-100 transition-all outline-none appearance-none"
                                    value={newUser.role}
                                    onChange={e => setNewUser({ ...newUser, role: e.target.value as 'Admin' | 'User' })}
                                >
                                    <option value="User">User</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-4 rounded-xl text-slate-500 font-bold hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] py-4 bg-[#0F172A] text-white rounded-xl font-bold shadow-xl shadow-slate-200 hover:bg-[#1E293B] transition-all active:scale-95"
                                >
                                    Create Access
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
