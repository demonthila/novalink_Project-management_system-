
import React, { useState, useEffect } from 'react';
import { Project, Client, Developer } from '../types';
import { fetchProject } from '../services/api';
import { ICONS } from '../constants';
import { formatCurrency, calculateGrandTotal } from '../utils';
import ProjectQuickViewModal from './ProjectQuickViewModal';

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
  userRole?: string;
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
  description = "Review and manage live project workflows.",
  userRole = 'User'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuickView, setSelectedQuickView] = useState<Project | null>(null);

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clients.find(c => c.id === p.client_id)?.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Local cache for fetched project details (payments, developers)
  const [detailsMap, setDetailsMap] = useState<Record<number, any>>({});
  const [loadingMap, setLoadingMap] = useState<Record<number, boolean>>({});

  const loadDetails = async (projectId: number) => {
    if (detailsMap[projectId] || loadingMap[projectId]) return;
    setLoadingMap(prev => ({ ...prev, [projectId]: true }));
    try {
      const detail = await fetchProject(projectId);
      setDetailsMap(prev => ({ ...prev, [projectId]: detail }));
    } catch (err) {
      console.error('Failed to load project detail', err);
    } finally {
      setLoadingMap(prev => ({ ...prev, [projectId]: false }));
    }
  };

  // Auto-load details for visible/filtered projects to avoid manual Load button
  useEffect(() => {
    filtered.forEach(p => {
      if (p && p.id) loadDetails(p.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered]);

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
            className="flex items-center gap-2.5 px-6 py-3 bg-[#2563EB] text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all"
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
                <th className="px-6 sm:px-8 py-5">SQUAD DEVELOPERS</th>
                <th className="px-6 sm:px-8 py-5">PAYMENTS</th>
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

                  const canRestore = ['Completed', 'Cancelled', 'On Hold'].includes(p.status);
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
                          {((detailsMap[p.id]?.developers) || (p.developers || [])).slice(0, 3).map((d: any) => (
                            <div key={d.id} className="w-7 h-7 rounded-full bg-[#0F172A] border-2 border-white flex items-center justify-center text-white text-[9px] font-black" title={d.name}>
                              {(d.name || 'D').split(' ').filter((n: string) => n).map((n: string) => n[0]).join('')}
                            </div>
                          ))}
                          {(((detailsMap[p.id]?.developers) || (p.developers || [])).length) > 3 && (
                            <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-slate-500 text-[9px] font-bold">
                              +{(((detailsMap[p.id]?.developers) || (p.developers || [])).length) - 3}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Squad Developers (names) */}
                      <td className="px-6 sm:px-8 py-5 text-sm text-[#475569]">
                        {detailsMap[p.id]?.developers ? (
                          (detailsMap[p.id].developers || []).map((d: any) => d.name).join(', ') || '—'
                        ) : (
                          (p.developers || []).length > 0 ? (p.developers || []).map((d: any) => d.name).join(', ') : (
                            loadingMap[p.id] ? 'Loading...' : '—'
                          )
                        )}
                      </td>

                      {/* Payments brief status */}
                      <td className="px-6 sm:px-8 py-5 text-sm text-[#475569]">
                        {detailsMap[p.id]?.payments ? (
                          (() => {
                            const payments = detailsMap[p.id].payments || [];
                            const totalDue = payments.reduce((s: number, m: any) => s + (Number(m.amount) || 0), 0);
                            const paid = payments.filter((m: any) => String(m.status).toLowerCase() === 'paid');
                            const totalPaid = paid.reduce((s: number, m: any) => s + (Number(m.amount) || 0), 0);
                            const pct = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0;
                            return (<div className="flex items-center justify-between gap-4">
                              <div className="text-sm font-bold">{paid.length}/{payments.length} paid</div>
                              <div className="text-xs text-slate-500">{pct}%</div>
                            </div>);
                          })()
                        ) : (
                          loadingMap[p.id] ? 'Loading...' : '—'
                        )}
                      </td>
                      <td className="px-6 sm:px-8 py-5 text-sm font-black text-[#0F172A]">
                        {formatCurrency(calculateGrandTotal(p), p.currency)}
                      </td>
                      <td className="px-6 sm:px-8 py-5">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black tracking-widest uppercase ${p.status === 'Completed' || p.status === 'Finished' ? 'bg-slate-100 text-slate-500' :
                          p.status === 'Active' ? 'bg-blue-50 text-blue-600' :
                            'bg-emerald-50 text-emerald-600'
                          }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 sm:px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-1 sm:opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={() => setSelectedQuickView(p)}
                            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-all active:scale-90"
                            title="Quick View Project Details"
                          >
                            <ICONS.Eye />
                          </button>
                          {canRestore && p.status !== 'Finished' && (userRole === 'Admin' || userRole === 'Superadmin') && (
                            <button
                              onClick={() => handleRestore(p)}
                              className="w-10 h-10 flex items-center justify-center text-emerald-500 hover:bg-emerald-50 rounded-full transition-all active:scale-90"
                              title="Resume Project"
                            >
                              <ICONS.Restore />
                            </button>
                          )}
                          {title !== "On Hold Projects" && (
                            <button onClick={async () => {
                              try {
                                const detail = await fetchProject(Number(p.id));
                                onView(detail);
                              } catch (err) {
                                console.error('Failed to fetch project detail', err);
                                onView(p); // fallback to list item
                              }
                            }} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-full transition-all active:scale-90" title="View Details"><ICONS.Check /></button>
                          )}
                          {(userRole === 'Admin' || userRole === 'Superadmin') && p.status !== 'Finished' && (
                            <>
                              {title !== "On Hold Projects" && (
                                <button onClick={async () => {
                                  try {
                                    const detail = await fetchProject(Number(p.id));
                                    onEdit(detail);
                                  } catch (err) {
                                    console.error('Failed to fetch project detail for edit', err);
                                    onEdit(p);
                                  }
                                }} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-slate-50 rounded-full transition-all active:scale-90" title="Edit Deployment"><ICONS.Edit /></button>
                              )}
                              <button onClick={() => onDelete(p.id)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all active:scale-90" title="Delete Permanent"><ICONS.Delete /></button>
                            </>
                          )}
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
      {/* Quick View Modal */}
      {selectedQuickView && (
        <ProjectQuickViewModal
          project={selectedQuickView}
          clients={clients}
          onClose={() => setSelectedQuickView(null)}
          onEdit={onEdit}
        />
      )}
    </div>
  );
};

export default ProjectList;
