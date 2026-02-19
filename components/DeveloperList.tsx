
import React, { useState } from 'react';
import { Developer } from '../types';
import { createDeveloper, updateDeveloper, deleteDeveloper } from '../services/api';
import { ICONS } from '../constants';
import { toast } from 'react-hot-toast';


const MODAL_INPUT = "w-full h-[52px] px-5 bg-white border border-[#E2E8F0] rounded-xl text-[14px] font-bold text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-[#94A3B8] placeholder:font-medium";

interface DeveloperListProps {
  developers: Developer[];
  onAdd: () => void;
  onUpdate: () => void;
  onDelete: (id: number) => void;
}

const DeveloperList: React.FC<DeveloperListProps> = ({ developers, onAdd, onUpdate, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingDev, setEditingDev] = useState<Developer | null>(null);
  const [viewingDev, setViewingDev] = useState<Developer | null>(null);

  const filtered = developers.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleOpenAdd = () => {
    setEditingDev(null);
    setShowModal(true);
  };

  const handleOpenEdit = (dev: Developer) => {
    setEditingDev(dev);
    setShowModal(true);
  };

  const handleViewProfile = (dev: Developer) => {
    setViewingDev(dev);
    setShowProfileModal(true);
  };

  const handleSubmit = async (data: any) => {
    try {
      let result;
      if (editingDev) {
        result = await updateDeveloper(editingDev.id, data);
      } else {
        result = await createDeveloper(data);
      }

      if (result.success) {
        setShowModal(false);
        onAdd(); // Refresh
        toast.success(editingDev ? 'Team member updated' : 'New developer onboarded');
      } else {
        toast.error("Error: " + (result.error || result.message || "Failed"));
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to save developer record");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this developer? They will be removed from all project assignments.")) return;
    try {
      const result = await deleteDeveloper(id);
      if (result.success) {
        onDelete(id);
        toast.success('Team member removed');
      } else {
        toast.error("Delete Failed: " + (result.error || result.message));
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to delete developer.");
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
            placeholder="Search team members..."
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
          Onboard New Developer
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest">
            <tr>
              <th className="px-8 py-5">Talent Profile</th>
              <th className="px-8 py-5">Role</th>
              <th className="px-8 py-5">Status</th>
              {/* Hourly Rate column removed */}
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(d => (
              <tr key={d.id} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleViewProfile(d)}
                      className="w-10 h-10 rounded-full bg-[#0A69E1] text-white flex items-center justify-center font-black text-xs hover:scale-110 transition-transform">
                      {(d.name || 'D').split(' ').filter(n => n).map(n => n[0]).join('')}
                    </button>
                    <div>
                      <button
                        onClick={() => handleViewProfile(d)}
                        className="font-black text-slate-900 hover:text-[#0A69E1] block text-left">
                        {d.name}
                      </button>
                      <p className="text-xs text-slate-400 font-medium">{d.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="px-3 py-1 bg-blue-50 text-[#0A69E1] text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100">
                    {d.role}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border ${d.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                    {d.status}
                  </span>
                </td>
                {/* Hourly rate removed */}
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(d); }} className="p-2 text-slate-400 hover:text-[#0A69E1] hover:bg-blue-50 rounded-lg transition-colors"><ICONS.Edit /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(d.id); }} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><ICONS.Delete /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <DeveloperModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
          initialData={editingDev}
        />
      )}

      {showProfileModal && viewingDev && (
        <DeveloperProfileModal
          dev={viewingDev}
          onClose={() => setShowProfileModal(false)}
          onEdit={() => {
            setShowProfileModal(false);
            handleOpenEdit(viewingDev);
          }}
        />
      )}
    </div>
  );
};

const DeveloperModal = ({ isOpen, onClose, onSubmit, initialData }: any) => {
  const [formData, setFormData] = useState(initialData || {
    full_name: '',
    id_card_number: '',
    address: '',
    personal_email: '',
    company_email: '',
    slack: '',
    skills: '',
    comments: '',
    status: 'Active'
  });

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white rounded-[40px] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300 border border-slate-200 flex flex-col">

        <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-white">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {initialData ? 'Refine Talent Profile' : 'Onboard New Talent'}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Human capital acquisition & deployment</p>
          </div>
          <button onClick={onClose} className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all group">
            <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={e => { e.preventDefault(); onSubmit(formData); }} className="flex-1 overflow-y-auto p-10 space-y-10">

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Legal Name</label>
                <input required placeholder="Ex: Harrison Ford" className={MODAL_INPUT} name="full_name" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity/National ID</label>
                <input required placeholder="Ex: 901234567V" className={MODAL_INPUT} name="id_card_number" value={formData.id_card_number} onChange={e => setFormData({ ...formData, id_card_number: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Personal Email</label>
                <input type="email" placeholder="Ex: personal@gmail.com" className={MODAL_INPUT} name="personal_email" value={formData.personal_email} onChange={e => setFormData({ ...formData, personal_email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Professional Email</label>
                <input type="email" required placeholder="Ex: talent@novalink.com" className={MODAL_INPUT} name="company_email" value={formData.company_email} onChange={e => setFormData({ ...formData, company_email: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">role</label>
                <input placeholder="Ex: @harrison_dev" className={MODAL_INPUT} name="slack" value={formData.slack} onChange={e => setFormData({ ...formData, slack: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                <select
                  className={MODAL_INPUT}
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Technical Stack (CSV)</label>
                <input placeholder="Ex: React, Node.js, AWS" className={MODAL_INPUT} name="skills" value={formData.skills} onChange={e => setFormData({ ...formData, skills: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Residential Address</label>
              <textarea placeholder="Physical location details" className={`${MODAL_INPUT} h-24 py-4 resize-none`} rows={3} name="address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Operational Briefing/Notes</label>
              <textarea placeholder="Performance notes or special instructions" className={`${MODAL_INPUT} h-24 py-4 resize-none`} rows={3} name="comments" value={formData.comments} onChange={e => setFormData({ ...formData, comments: e.target.value })} />
            </div>
          </div>

          <div className="flex justify-end gap-6 pt-6 border-t border-slate-50 items-center">
            <button type="button" onClick={onClose} className="text-slate-400 font-bold uppercase text-[11px] tracking-widest hover:text-rose-600 transition-colors px-4 py-2">Discard</button>
            <button type="submit" className="flex items-center gap-2.5 px-8 py-4 bg-[#2563EB] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-1 active:scale-95 transition-all">Onboard Specialist</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DeveloperProfileModal = ({ dev, onClose, onEdit }: any) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-blue-900/40 backdrop-blur-md">
      <div className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in slide-in-from-bottom-8 duration-300">
        <div className="h-32 bg-[#0A69E1] relative">
          <div className="absolute -bottom-12 left-10">
            <div className="w-24 h-24 rounded-3xl bg-white text-[#0A69E1] flex items-center justify-center font-black text-3xl shadow-2xl border-4 border-white">
              {(dev.name || 'D').split(' ').filter((n: string) => n).map((n: string) => n[0]).join('')}
            </div>
          </div>
          <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"><ICONS.Delete /></button>
        </div>

        <div className="px-10 pt-16 pb-10 space-y-10">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{dev.name}</h2>
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-[#0A69E1] uppercase tracking-widest">{dev.role}</span>
                <span className={`text-[10px] font-black uppercase tracking-wider ${dev.status === 'Active' ? 'text-emerald-500' : 'text-rose-500'}`}>● {dev.status} Member</span>
              </div>
            </div>
            <button onClick={onEdit} className="h-[52px] px-6 bg-blue-50 border border-blue-100 rounded-xl font-bold text-[#0A69E1] text-sm hover:bg-blue-100 transition-colors flex items-center gap-2"><ICONS.Edit /> Edit Profile</button>
          </div>

          <div className="grid grid-cols-2 gap-y-8 gap-x-12 p-8 bg-blue-50/20 border border-blue-100 rounded-[32px]">
            <DetailItem label="Email" value={dev.email} />
            <DetailItem label="Joined" value={dev.created_at} />
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

export default DeveloperList;
