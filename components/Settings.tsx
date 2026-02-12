
import React, { useState } from 'react';
import { User } from '../types';
import { ICONS } from '../constants';

interface SettingsProps {
    users: User[];
    onAddUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
    onDeleteUser: (id: string) => void;
    currentUserEmail: string;
}

const Settings: React.FC<SettingsProps> = ({ users, onAddUser, onDeleteUser, currentUserEmail }) => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'User' as 'Admin' | 'User' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddUser(newUser);
        setShowAddModal(false);
        setNewUser({ name: '', email: '', password: '', role: 'User' });
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-[#0F172A] tracking-tighter">System Access Control</h2>
                    <p className="text-slate-500 font-medium mt-1">Manage user access and permissions.</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-3 bg-[#0F172A] hover:bg-[#1E293B] text-white px-6 py-4 rounded-[18px] transition-all shadow-xl shadow-slate-200 group"
                >
                    <span className="font-bold text-sm uppercase tracking-widest">New Access Profile</span>
                    <div className="bg-white/10 p-1 rounded-lg group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                    </div>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map(user => (
                    <div key={user.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                            {user.email !== 'admin' && user.email !== currentUserEmail && (
                                <button
                                    onClick={() => onDeleteUser(user.id)}
                                    className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
                                >
                                    <ICONS.Delete />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-4 mb-6">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg ${user.role === 'Admin' ? 'bg-[#0F172A] text-white shadow-slate-200' : 'bg-blue-50 text-blue-600 shadow-blue-100'}`}>
                                {user.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-bold text-[#0F172A] text-lg">{user.name}</h3>
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${user.role === 'Admin' ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-500'}`}>
                                    {user.role}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Access ID</p>
                                <p className="font-bold text-slate-700 text-sm truncate">{user.email}</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Created</p>
                                <p className="font-bold text-slate-700 text-sm">{new Date(user.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white rounded-[40px] w-full max-w-lg p-8 sm:p-12 shadow-2xl animate-in zoom-in-95 duration-300">
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
                                    className="flex-[2] py-4 bg-[#0F172A] text-white rounded-xl font-bold shadow-xl shadow-slate-200 hover:bg-[#1E293B] transition-all"
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
