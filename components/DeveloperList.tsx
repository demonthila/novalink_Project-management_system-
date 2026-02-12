
import React, { useState } from 'react';
import { Developer } from '../types';
import { ICONS } from '../constants';

interface DeveloperListProps {
  developers: Developer[];
  onAdd: (dev: Omit<Developer, 'id'>) => void;
  onUpdate: (dev: Developer) => void;
  onDelete: (id: string) => void;
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
          className="h-[60px] px-10 bg-[#2563EB] text-white rounded-[20px] text-[13px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/25 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3"
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
              <th className="px-8 py-5">Core Specialization</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5">Location</th>
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
                      {d.name.split(' ').map(n => n[0]).join('')}
                    </button>
                    <div>
                      <button 
                        onClick={() => handleViewProfile(d)}
                        className="font-black text-slate-900 hover:text-[#0A69E1] block text-left">
                        {d.name}
                      </button>
                      <p className="text-xs text-slate-400 font-medium">Joined: {d.dateJoined}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="px-3 py-1 bg-blue-50 text-[#0A69E1] text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100">
                    {d.specialization}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border ${d.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    {d.status}
                  </span>
                </td>
                <td className="px-8 py-6 text-sm font-bold text-slate-600">
                  {d.country}
                </td>
                <td className="px-8 py-6 text-right">
                   <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleViewProfile(d)} className="p-2 text-slate-400 hover:text-[#0A69E1] hover:bg-blue-50 rounded-lg transition-colors"><ICONS.Search /></button>
                      <button onClick={() => handleOpenEdit(d)} className="p-2 text-slate-400 hover:text-[#0A69E1] hover:bg-blue-50 rounded-lg transition-colors"><ICONS.Edit /></button>
                      <button onClick={() => onDelete(d.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><ICONS.Delete /></button>
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
          onSubmit={(data: any) => {
            if (editingDev) onUpdate({ ...data, id: editingDev.id });
            else onAdd(data);
            setShowModal(false);
          }}
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
    name: '',
    specialization: '',
    email: '',
    phone: '',
    status: 'Active',
    address: '',
    idCardNumber: '',
    dateJoined: new Date().toISOString().split('T')[0],
    country: 'Sri Lanka'
  });

  const MODAL_INPUT = "w-full h-[52px] px-5 bg-white border border-[#E2E8F0] rounded-xl text-[14px] font-bold text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-[#94A3B8] placeholder:font-medium";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-blue-900/20 backdrop-blur-sm">
      <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-200">
        <div className="flex items-center justify-between mb-8 sticky top-0 bg-white pb-4 z-10 border-b border-slate-100">
          <div>
            <h3 className="text-2xl font-black text-[#0A69E1] tracking-tight">{initialData ? 'Update Profile' : 'Developer Onboarding'}</h3>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Talent Acquisition Hub</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ICONS.Delete /></button>
        </div>
        
        <form onSubmit={e => { e.preventDefault(); onSubmit(formData); }} className="space-y-6">
           <div className="grid grid-cols-2 gap-6">
             <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Legal Name</label>
               <input required placeholder="Full name" className={MODAL_INPUT} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
             </div>
             <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Core Skillset</label>
               <input placeholder="e.g. React Expert" required className={MODAL_INPUT} value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} />
             </div>
           </div>

           <div className="grid grid-cols-2 gap-6">
             <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</label>
               <input type="email" required className={MODAL_INPUT} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
             </div>
             <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</label>
               <input required className={MODAL_INPUT} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
             </div>
           </div>

           <div className="grid grid-cols-2 gap-6">
             <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID / Passport No.</label>
               <input required className={MODAL_INPUT} value={formData.idCardNumber} onChange={e => setFormData({...formData, idCardNumber: e.target.value})} />
             </div>
             <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Country</label>
               <input className={MODAL_INPUT} value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} />
             </div>
           </div>

           <div className="flex justify-end gap-6 pt-6 border-t border-slate-100">
             <button type="button" onClick={onClose} className="px-8 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-[#0A69E1] transition-colors">Discard</button>
             <button type="submit" className="h-[60px] px-10 bg-[#2563EB] text-white rounded-[20px] text-[13px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/25 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center">Save Profile</button>
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
              {dev.name.split(' ').map((n: string) => n[0]).join('')}
            </div>
          </div>
          <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"><ICONS.Delete /></button>
        </div>

        <div className="px-10 pt-16 pb-10 space-y-10">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{dev.name}</h2>
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-[#0A69E1] uppercase tracking-widest">{dev.specialization}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span className={`text-[10px] font-black uppercase tracking-wider ${dev.status === 'Active' ? 'text-emerald-500' : 'text-rose-500'}`}>● {dev.status} Member</span>
              </div>
            </div>
            <button onClick={onEdit} className="h-[52px] px-6 bg-blue-50 border border-blue-100 rounded-xl font-bold text-[#0A69E1] text-sm hover:bg-blue-100 transition-colors flex items-center gap-2"><ICONS.Edit /> Edit Profile</button>
          </div>

          <div className="grid grid-cols-2 gap-y-8 gap-x-12 p-8 bg-blue-50/20 border border-blue-100 rounded-[32px]">
            <DetailItem label="Identification" value={dev.idCardNumber} />
            <DetailItem label="Date Joined" value={dev.dateJoined} />
            <DetailItem label="Communication" value={dev.email} subValue={dev.phone} />
            <DetailItem label="Country" value={dev.country} />
            <div className="col-span-2">
              <DetailItem label="Address" value={dev.address || 'Not Provided'} />
            </div>
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
