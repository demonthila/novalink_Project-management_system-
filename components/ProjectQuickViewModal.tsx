import React from 'react';
import { Project, Client } from '../types';
import { ICONS } from '../constants';
import { formatCurrency, calculateGrandTotal, calculateTotalAdditionalCosts, calculateDeveloperTotalPayout } from '../utils';

interface ProjectQuickViewModalProps {
    project: Project;
    clients: Client[];
    onClose: () => void;
    onEdit?: (project: Project) => void;
    isLoading?: boolean;
}

const ProjectQuickViewModal: React.FC<ProjectQuickViewModalProps> = ({
    project,
    clients,
    onClose,
    onEdit,
    isLoading = false
}) => {
    const client = clients.find(c => c.id === project.client_id);

    // Financial Calculations
    const totalRevenue = calculateGrandTotal(project);
    const additionalCosts = calculateTotalAdditionalCosts(project.additional_costs || []);
    const devCosts = calculateDeveloperTotalPayout(project.developers || []);
    const totalCost = devCosts + additionalCosts;
    const currentProfit = totalRevenue - totalCost;
    const profitPercentage = totalRevenue > 0 ? (currentProfit / totalRevenue) * 100 : 0;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div
                className="bg-white rounded-[24px] w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 transition-all flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">{project.name}</h2>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${project.status === 'Active' ? 'bg-blue-50 text-blue-600' :
                            project.status === 'Finished' ? 'bg-emerald-50 text-emerald-600' :
                                'bg-slate-100 text-slate-500'
                            }`}>
                            {project.status}
                        </span>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                    {/* Section: Project Info & Client */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <SectionHeader label="Project Context" icon={<ICONS.Info />} />
                            <div className="space-y-3">
                                <DataField label="ID Code" value={`PRJ-${project.id}`} />
                                <DataField label="Commencement" value={project.start_date || 'N/A'} />
                                <DataField label="Target Deadline" value={project.end_date || 'Continuous'} />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <SectionHeader label="Client Details" icon={<ICONS.Clients />} />
                            <div className="space-y-3">
                                <DataField label="Partner Name" value={client?.company_name || 'Private Enterprise'} />
                                <DataField label="Contact Person" value={client?.name || 'Authorized Personnel'} />
                                <DataField label="Contact Email" value={client?.email || 'N/A'} />
                            </div>
                        </div>
                    </div>

                    {/* Section: Financial Architecture & Milestones */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-4 border-t border-slate-50">
                        <div className="space-y-4">
                            <SectionHeader label="Financial Architecture" icon={<ICONS.Finances />} />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contract Value</p>
                                    <p className="text-sm font-bold text-slate-900">{formatCurrency(totalRevenue, project.currency)}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Projected Profit</p>
                                    {isLoading ? (
                                        <p className="text-sm font-bold text-blue-500 animate-pulse">Calculating...</p>
                                    ) : (
                                        <p className={`text-sm font-bold ${currentProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {formatCurrency(currentProfit, project.currency)} ({profitPercentage.toFixed(1)}%)
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <SectionHeader label="Payment Milestones" icon={<ICONS.Calendar />} />
                            <div className="space-y-2">
                                {(project.payments || []).length > 0 ? (
                                    (project.payments || []).map((p: any, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-xs p-2.5 bg-slate-50/50 rounded-lg border border-slate-100">
                                            <span className="font-medium text-slate-600">Phase {p.payment_number}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-slate-900">{formatCurrency(p.amount, project.currency)}</span>
                                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${p.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {p.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-[11px] text-slate-400 italic">No milestones defined.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Section: Developer Assignment & Additional Costs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-4 border-t border-slate-50">
                        <div className="space-y-4">
                            <SectionHeader label="Developer Assignment" icon={<ICONS.Teams />} />
                            <div className="flex flex-wrap gap-2">
                                {isLoading ? (
                                    <p className="text-[11px] text-blue-500 animate-pulse font-medium">Synchronizing developer data...</p>
                                ) : (project.developers || []).length > 0 ? (
                                    (project.developers || []).map((d: any, idx) => (
                                        <div key={idx} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 shadow-sm">
                                            {d.name}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-[11px] text-slate-400 italic">No developers assigned.</p>
                                )}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <SectionHeader label="Additional Costs" icon={<ICONS.Finances />} />
                            <div className="space-y-2">
                                {isLoading ? (
                                    <p className="text-[11px] text-blue-500 animate-pulse font-medium">Fetching cost ledgers...</p>
                                ) : (project.additional_costs || []).length > 0 ? (
                                    (project.additional_costs || []).map((c: any, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-xs p-2.5 bg-white border border-slate-200 rounded-lg shadow-sm">
                                            <span className="text-slate-600">{c.description || c.cost_type}</span>
                                            <span className="font-bold text-slate-900">{formatCurrency(c.amount, project.currency)}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-[11px] text-slate-400 italic">No additional costs logged.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="px-8 py-6 border-t border-slate-50 bg-slate-50 flex justify-end items-center gap-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-widest hover:text-slate-700 transition-colors"
                    >
                        Dismiss
                    </button>
                    <div className="flex items-center gap-3">
                        {onEdit && (
                            <button
                                onClick={() => { onEdit(project); onClose(); }}
                                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
                            >
                                <ICONS.Edit />
                                <span>Edit Matrix</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const SectionHeader = ({ label, icon }: { label: string, icon: React.ReactNode }) => (
    <div className="flex items-center gap-2 mb-2">
        <div className="text-slate-400 scale-90">{icon}</div>
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</h3>
    </div>
);

const DataField = ({ label, value }: { label: string, value: string }) => (
    <div className="space-y-1">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-[13px] font-semibold text-slate-800 tracking-tight">{value}</p>
    </div>
);

export default ProjectQuickViewModal;
