
import React, { useState } from 'react';
import { Client, Project } from '../types';
import { ICONS } from '../constants';
import { createClient, updateProject } from '../services/api';
import { toast } from 'react-hot-toast';

// Note: onAdd/onUpdate props in ClientList are usually wrappers around API calls in App.tsx. 
// However, since App.tsx passes refreshData, we might want to call API here or in App.
// In App.tsx refactor (Step 141), I passed `onAdd={() => refreshData()}`. 
// So THIS component is responsible for calling the API? 
// Original App.tsx code: `onAdd={(newClient) => ... setClients ...}`
// New App.tsx code: `onAdd={() => refreshData()}`.
// So ClientList MUST call the API itself before calling onAdd() to refresh.
// I will update ClientList to call API.

interface ClientListProps {
  clients: Client[];
  projects: Project[];
  onAdd: () => void;
  onUpdate: () => void;
  onDelete: (id: number) => void; // App.tsx probably doesn't implement delete for clients yet in api.ts? 
  // I implemented createClient in api.ts. I need updateClient and deleteClient too.
  // api.ts only has createClient.
  // I should add updateClient and deleteClient to api.ts or just fetch directly here.
  // To be safe, I'll fetch directly here or assume props passed handle it?
  // Re-reading App.tsx Step 141:
  // onAdd={() => refreshData()}
  // This implies ClientList does the work and then notifies parent to refresh.
}

const MODAL_INPUT = "w-full h-[52px] px-5 bg-white border border-[#E2E8F0] rounded-xl text-[14px] font-bold text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-[#94A3B8] placeholder:font-medium";

const ClientList: React.FC<ClientListProps> = ({ clients, projects, onAdd, onUpdate, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingClient(null);
    setShowModal(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setShowModal(true);
  };

  const handleViewProfile = (client: Client) => {
    setViewingClient(client);
    setShowProfileModal(true);
  };

  const getClientProjectCount = (clientId: number) => {
    return projects.filter(p => p.client_id === clientId).length;
  };

  const handleSubmit = async (data: any) => {
    try {
      let res;
      if (editingClient) {
        // Update
        res = await fetch(`/api/clients.php?id=${editingClient.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      } else {
        // Create
        res = await fetch(`/api/clients.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      }
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        onAdd(); // Trigger refresh
        toast.success(editingClient ? 'Partner record updated' : 'New partner onboarded');
      } else {
        toast.error("Error: " + json.error);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to save client record");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this client? Their projects will also be removed.")) return;
    try {
      const res = await fetch(`/api/clients.php?id=${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        onDelete(id);
        toast.success('Partner record removed');
      } else {
        toast.error(data.error || data.message || "Could not delete client.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete client.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
            <ICONS.Search />
          </div>
          <input
            type="text"
            placeholder="Search partners..."
            className="w-full h-[52px] pl-12 pr-4 bg-white border border-[#E2E8F0] rounded-xl text-[14px] font-bold shadow-sm outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#2563EB] transition-all text-[#0F172A] placeholder:text-[#94A3B8] placeholder:font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2.5 px-6 py-3 bg-[#2563EB] text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all"
        >
          <ICONS.Add />
          Add New Partner
        </button>

      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">Partner Profile</th>
                <th className="px-8 py-5">Organization</th>
                <th className="px-8 py-5">Projects</th>
                <th className="px-8 py-5">Location</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleViewProfile(client)}
                        className="w-10 h-10 rounded-full bg-[#0A69E1] text-white flex items-center justify-center font-black text-[10px] uppercase hover:scale-110 transition-transform shadow-md">
                        {(client.name || 'C').split(' ').filter(n => n).map(n => n[0]).join('')}
                      </button>
                      <div>
                        <button
                          onClick={() => handleViewProfile(client)}
                          className="font-black text-slate-900 hover:text-[#0A69E1] block text-left">
                          {client.name}
                        </button>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{client.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm font-bold text-slate-600">
                    {client.company_name}
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-blue-50 text-[#0A69E1] text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100">
                      {getClientProjectCount(client.id)} Projects
                    </span>
                  </td>
                  <td className="px-8 py-6 text-sm font-bold text-slate-600">
                    {client.phone}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenEdit(client)} className="p-2 text-slate-400 hover:text-[#0A69E1] hover:bg-blue-50 rounded-lg transition-colors"><ICONS.Edit /></button>
                      <button onClick={() => handleDelete(client.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><ICONS.Delete /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <ClientModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
          initialData={editingClient}
        />
      )}

      {showProfileModal && viewingClient && (
        <ClientProfileModal
          client={viewingClient}
          projectCount={getClientProjectCount(viewingClient.id)}
          onClose={() => setShowProfileModal(false)}
          onEdit={() => {
            setShowProfileModal(false);
            handleOpenEdit(viewingClient);
          }}
        />
      )}
    </div>
  );
};

const ClientModal = ({ isOpen, onClose, onSubmit, initialData }: any) => {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    company_name: '',
    phone: '',
    email: '',
  });

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white rounded-[40px] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300 border border-slate-200 flex flex-col">

        <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-white">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {initialData ? 'Update Partner Profile' : 'Onboard New Partner'}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Strategic relationship management</p>
          </div>
          <button onClick={onClose} className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all group">
            <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="flex-1 overflow-y-auto p-10 space-y-8">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Legal Name</label>
              <input required className={MODAL_INPUT} placeholder="Ex: John Harrison" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Organization Name</label>
              <input className={MODAL_INPUT} placeholder="Ex: Acme Dynamics" value={formData.company_name} onChange={e => setFormData({ ...formData, company_name: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Professional Email</label>
              <input type="email" required className={MODAL_INPUT} placeholder="Ex: john@acme.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Number</label>
              <input className={MODAL_INPUT} placeholder="Ex: +1 (555) 000-0000" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            </div>
          </div>

          <div className="bg-blue-50/50 p-6 rounded-[28px] border border-blue-100/50">
            <div className="flex items-center gap-3 text-blue-600 mb-2">
              <ICONS.Info />
              <span className="text-[10px] font-black uppercase tracking-widest">Onboarding Protocol</span>
            </div>
            <p className="text-xs font-medium text-slate-500 leading-relaxed italic">Registered entities will be accessible for project assignment and resource allocation within the Stratis Intelligence Engine.</p>
          </div>

          <div className="flex justify-end gap-6 pt-6 border-t border-slate-50 items-center mt-4">
            <button type="button" onClick={onClose} className="text-slate-400 font-bold uppercase text-[11px] tracking-widest hover:text-rose-600 transition-colors px-4 py-2">Discard</button>
            <button type="submit" className="flex items-center gap-2.5 px-8 py-4 bg-[#2563EB] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-1 active:scale-95 transition-all">Commit Records</button>
          </div>

        </form>
      </div>
    </div>
  );
}

const ClientProfileModal = ({ client, projectCount, onClose, onEdit }: any) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-blue-900/40 backdrop-blur-md">
      <div className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in slide-in-from-bottom-8 duration-300">
        <div className="h-32 bg-[#0A69E1] relative">
          <div className="absolute -bottom-12 left-10">
            <div className="w-24 h-24 rounded-3xl bg-white text-[#0A69E1] flex items-center justify-center font-black text-3xl shadow-2xl border-4 border-white">
              {(client.name || 'C').split(' ').filter((n: string) => n).map((n: string) => n[0]).join('')}
            </div>
          </div>
          <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"><ICONS.Delete /></button>
        </div>

        <div className="px-10 pt-16 pb-10 space-y-10">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{client.name}</h2>
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-[#0A69E1] uppercase tracking-widest">{client.company_name}</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{projectCount} System Projects</span>
              </div>
            </div>
            <button onClick={onEdit} className="h-[52px] px-6 bg-blue-50 border border-blue-100 rounded-xl font-bold text-[#0A69E1] text-sm hover:bg-blue-100 transition-colors flex items-center gap-2"><ICONS.Edit /> Update Records</button>
          </div>

          <div className="grid grid-cols-2 gap-y-8 gap-x-12 p-8 bg-blue-50/20 border border-blue-100 rounded-[32px]">
            <DetailItem label="Communication Hub" value={client.email} subValue={client.phone} />
            <DetailItem label="Onboarding Date" value={client.created_at} />
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ label, value, subValue }: any) => (
  <div className="space-y-1">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <p className="text-sm font-black text-slate-900 leading-tight">{value}</p>
    {subValue && <p className="text-xs font-bold text-slate-500">{subValue}</p>}
  </div>
);

export default ClientList;
