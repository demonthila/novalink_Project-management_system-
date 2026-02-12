
import React, { useState } from 'react';
import { Project, Client, Developer, ProjectType, ProjectStatus, Priority } from '../types';
import { ICONS } from '../constants';
import { formatCurrency, calculateGrandTotal, getMilestonesByProjectType } from '../utils';

interface PendingProjectManagerProps {
  projects: Project[];
  clients: Client[];
  developers: Developer[];
  onUpdateStatus: (projectId: string, status: Project['status']) => void;
  onUpdateInvoice: (projectId: string, isIssued: boolean) => void;
  onViewDetails: (project: Project) => void;
  onAddProject: (project: any) => void;
}

const PendingProjectManager: React.FC<PendingProjectManagerProps> = ({ 
  projects, clients, developers, onUpdateStatus, onUpdateInvoice, onViewDetails, onAddProject
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  const pendingList = projects.filter(p => p.status === 'Pending' || p.status === 'Rejected' || p.status === 'On Hold');
  const filtered = pendingList.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clients.find(c => c.id === p.clientId)?.companyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="space-y-4">
        <nav className="flex items-center gap-2 text-[12px] font-medium text-[#94A3B8]">
          <span className="hover:text-[#64748B] cursor-pointer">Projects</span>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <span className="text-[#64748B] font-bold">Pending Approval Queue</span>
        </nav>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-[#0F172A] tracking-tight">Pending Projects Approval Queue</h1>
            <p className="text-[#64748B] text-lg mt-1 font-medium">Review and manage project requests awaiting administrative authorization.</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto h-[60px] px-10 bg-[#2563EB] text-white rounded-[20px] text-[13px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/25 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <ICONS.Add />
            New Request
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative group max-w-md">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#94A3B8]">
          <ICONS.Search />
        </div>
        <input 
          type="text" 
          placeholder="Search pending projects..." 
          className="w-full h-[52px] pl-12 pr-4 bg-white border border-[#E2E8F0] rounded-xl text-[14px] font-bold shadow-sm outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#2563EB] transition-all text-[#0F172A] placeholder:text-[#94A3B8] placeholder:font-medium"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[32px] border border-[#F1F5F9] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#F8FAFC] border-b border-[#F1F5F9] text-[11px] font-black text-[#94A3B8] uppercase tracking-[0.1em]">
              <tr>
                <th className="px-8 py-5">Project Name</th>
                <th className="px-8 py-5">Client Name</th>
                <th className="px-8 py-5">Quota Status</th>
                <th className="px-8 py-5">Total Cost</th>
                <th className="px-8 py-5">Quotation Ref</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-[#94A3B8] font-medium">
                    No projects awaiting approval at this time.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const client = clients.find(c => c.id === p.clientId);
                  
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="space-y-0.5">
                          <button 
                            onClick={() => onViewDetails(p)}
                            className="text-[15px] font-bold text-[#0F172A] hover:text-[#2563EB] transition-colors text-left"
                          >
                            {p.name}
                          </button>
                          <p className="text-[12px] font-medium text-[#94A3B8]">ID: PRJ-{p.id}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-[14px] font-medium text-[#475569]">{client?.companyName || 'Private Partner'}</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                          p.status === 'Pending' ? 'bg-slate-100 text-slate-500' : 
                          p.status === 'On Hold' ? 'bg-amber-50 text-amber-600' : 
                          'bg-rose-50 text-rose-600'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-[14px] font-bold text-[#0F172A]">{formatCurrency(calculateGrandTotal(p), p.currency)}</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-[13px] font-medium text-[#64748B]">
                          #{p.invoiceNumber || 'QUO-PENDING'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => onUpdateStatus(p.id, 'Approved')}
                            className="h-[40px] px-6 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all"
                          >
                            Approve & Move
                          </button>
                          <button 
                            onClick={() => onViewDetails(p)}
                            className="p-2 text-[#94A3B8] hover:text-[#0F172A] hover:bg-slate-100 rounded-lg transition-all"
                          >
                            <ICONS.MoreVertical />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <PendingRequestModal 
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          clients={clients}
          onSubmit={(data) => {
            onAddProject(data);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
};

const PendingRequestModal = ({ isOpen, onClose, clients, onSubmit }: any) => {
  const [formData, setFormData] = useState({
    name: '',
    clientId: '',
    projectType: '40-30-30' as ProjectType,
    priority: 'Medium' as Priority,
    baseProjectAmount: 0,
    currency: 'USD',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    status: 'Pending' as ProjectStatus,
    notes: '',
    squad: [],
    additionalCosts: [],
  });

  const INPUT_CLASSES = "w-full h-[52px] px-5 bg-white border border-[#E2E8F0] rounded-xl text-[14px] font-bold text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/5 transition-all";
  const LABEL_CLASSES = "text-[10px] font-black text-[#475569] mb-2 block uppercase tracking-widest";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-[40px] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 sm:p-12 shadow-2xl border border-[#F1F5F9] animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-10 border-b border-[#F1F5F9] pb-8">
          <div>
            <h2 className="text-2xl font-black text-[#0F172A]">New Quoted Request</h2>
            <p className="text-sm text-[#94A3B8] font-medium mt-1">Initial project details for client approval.</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-50 rounded-2xl transition-all text-[#94A3B8]"><ICONS.Delete /></button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-6">
          <div className="space-y-1">
            <label className={LABEL_CLASSES}>Project Title / Reference</label>
            <input required className={INPUT_CLASSES} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className={LABEL_CLASSES}>Enterprise Client</label>
              <select required className={INPUT_CLASSES} value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})}>
                <option value="">Select Partner</option>
                {clients.map((c: any) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className={LABEL_CLASSES}>Budget Allocation (USD)</label>
              <input type="number" required className={INPUT_CLASSES} value={formData.baseProjectAmount || ''} onChange={e => setFormData({...formData, baseProjectAmount: parseFloat(e.target.value) || 0})} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className={LABEL_CLASSES}>Quotation Status</label>
              <select className={INPUT_CLASSES} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                <option value="Pending">Pending Quotation</option>
                <option value="On Hold">On Hold / Revision</option>
                <option value="Rejected">Rejected</option>
                <option value="Approved">Client Approved (Go Live)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className={LABEL_CLASSES}>Proposed Start Date</label>
              <input type="date" className={INPUT_CLASSES} value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
            </div>
          </div>

          <div className="pt-8 border-t border-[#F1F5F9] flex flex-col sm:flex-row justify-end gap-4">
            <button type="button" onClick={onClose} className="px-8 py-4 text-xs font-black text-[#64748B] uppercase tracking-widest">Discard</button>
            <button type="submit" className="h-[60px] px-10 bg-[#2563EB] text-white rounded-[20px] text-[13px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/25">Submit for Review</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PendingProjectManager;
