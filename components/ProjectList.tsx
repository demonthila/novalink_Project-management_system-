
import React, { useState } from 'react';
import { Project, Client, Developer } from '../types';
import { ICONS } from '../constants';
import { formatCurrency, calculateGrandTotal } from '../utils';

interface ProjectListProps {
  projects: Project[];
  clients: Client[];
  developers: Developer[];
  onAdd: () => void;
  onUpdate: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (id: number) => void;
  onView: (project: Project) => void;
  title?: string;
  description?: string;
}

const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  clients,
  developers,
  onAdd,
  onUpdate,
  onEdit,
  onDelete,
  onView,
  title = "Active Projects Queue",
  description = "Review and manage live project workflows."
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clients.find(c => c.id === p.client_id)?.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRestore = (project: Project) => {
    onUpdate({ ...project, status: 'Active' });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full">
      {/* Breadcrumbs & Header */}
      <div className="space-y-4">
        <nav className="flex items-center gap-2 text-[10px] sm:text-[12px] font-medium text-[#94A3B8]">
          <span className="hover:text-[#64748B] cursor-pointer" onClick={() => window.location.reload()}>Projects</span>
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <span className="text-[#64748B] font-bold">{title}</span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-xl">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">{title}</h1>
            <p className="text-[#64748B] text-sm sm:text-lg mt-1 font-medium">{description}</p>
          </div>
          <button
            onClick={onAdd}
            className="w-full sm:w-auto h-[56px] sm:h-[60px] px-8 sm:px-10 bg-[#2563EB] text-white rounded-[16px] sm:rounded-[20px] text-xs sm:text-[13px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/25 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <ICONS.Add />
            Create Project
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative group w-full max-w-md">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#94A3B8]">
          <ICONS.Search />
        </div>
        <input
          type="text"
          placeholder="Search projects..."
          className="w-full h-[52px] pl-12 pr-4 bg-white border border-[#E2E8F0] rounded-xl text-[14px] font-bold shadow-sm outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#2563EB] transition-all text-[#0F172A] placeholder:text-[#94A3B8] placeholder:font-medium"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-[16px] sm:rounded-[24px] border-2 border-[#D6E4FF] shadow-lg shadow-blue-500/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-[#F8FAFC] border-b border-[#F1F5F9] text-[10px] sm:text-[11px] font-black text-[#94A3B8] uppercase tracking-widest">
              <tr>
                <th className="px-6 sm:px-8 py-5">PROJECT NAME</th>
                <th className="px-6 sm:px-8 py-5">CLIENT NAME</th>
                <th className="px-6 sm:px-8 py-5">SQUAD</th>
                <th className="px-6 sm:px-8 py-5">TOTAL REVENUE</th>
                <th className="px-6 sm:px-8 py-5">STATUS</th>
                <th className="px-6 sm:px-8 py-5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-16 text-center text-[#94A3B8] font-medium">
                    No matching projects found in this queue.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const client = clients.find(c => c.id === p.client_id);
                  const assignedDevs = (p.developers || []).map(pd => pd.name); // Using embedded names or join with developers list?
                  // p.developers comes from API with names fully populated in my projects.php query

                  const isArchived = ['Completed', 'Cancelled'].includes(p.status);

                  return (
                    <tr key={p.id} className="hover:bg-blue-50/20 transition-colors group">
                      <td className="px-6 sm:px-8 py-5">
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold text-[#0F172A]">{p.name}</p>
                          <p className="text-[10px] font-medium text-[#94A3B8]">#{p.id}</p>
                        </div>
                      </td>
                      <td className="px-6 sm:px-8 py-5 text-sm font-medium text-[#475569]">
                        {client?.company_name || 'Private'}
                      </td>
                      <td className="px-6 sm:px-8 py-5">
                        <div className="flex items-center -space-x-1.5">
                          {(p.developers || []).slice(0, 3).map((d) => (
                            <div key={d.id} className="w-7 h-7 rounded-full bg-[#0F172A] border-2 border-white flex items-center justify-center text-white text-[9px] font-black" title={d.name}>
                              {d.name.split(' ').map((n: string) => n[0]).join('')}
                            </div>
                          ))}
                          {(p.developers || []).length > 3 && (
                            <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-slate-500 text-[9px] font-bold">
                              +{(p.developers || []).length - 3}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 sm:px-8 py-5 text-sm font-black text-[#0F172A]">
                        {formatCurrency(calculateGrandTotal(p), p.currency)}
                      </td>
                      <td className="px-6 sm:px-8 py-5">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black tracking-widest uppercase ${p.status === 'Completed' ? 'bg-slate-100 text-slate-500' :
                            p.status === 'Active' ? 'bg-blue-50 text-blue-600' :
                              'bg-emerald-50 text-emerald-600'
                          }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 sm:px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-1 sm:opacity-0 group-hover:opacity-100 transition-all">
                          {isArchived && (
                            <button
                              onClick={() => handleRestore(p)}
                              className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Restore to Active"
                            >
                              <ICONS.Restore />
                            </button>
                          )}
                          <button onClick={() => onView(p)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="View Details"><ICONS.Check /></button>
                          <button onClick={() => onEdit(p)} className="p-2 text-slate-400 hover:text-amber-600 transition-colors" title="Edit Deployment"><ICONS.Edit /></button>
                          <button onClick={() => onDelete(p.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors" title="Delete Permanent"><ICONS.Delete /></button>
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
    </div>
  );
};

export default ProjectList;
