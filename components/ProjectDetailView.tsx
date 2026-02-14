
import React from 'react';
import { Project, Client, Developer } from '../types';
import { ICONS } from '../constants';
import { formatCurrency, calculateGrandTotal, calculatePaidAmount, calculateTotalAdditionalCosts } from '../utils';
import PaymentTracker from './PaymentTracker';

interface ProjectDetailViewProps {
    project: Project;
    clients: Client[];
    developers: Developer[];
    onClose: () => void;
    onRefresh: () => void;
}

const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
    project,
    clients,
    developers,
    onClose,
    onRefresh
}) => {
    const client = clients.find(c => c.id === project.client_id);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md" onClick={onClose}>
            <div
                className="bg-white sm:rounded-[40px] w-full max-w-6xl h-full sm:h-auto sm:max-h-[92vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-300 border border-slate-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Glassmorphic Header */}
                <div className="px-8 sm:px-12 py-8 sm:py-10 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-20">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[24px] bg-blue-600 text-white flex items-center justify-center text-2xl font-black shadow-xl shadow-blue-500/20">
                            {project.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                                    {project.name}
                                </h2>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${project.status === 'Active' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                    project.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                        'bg-slate-50 text-slate-600 border border-slate-100'
                                    }`}>
                                    {project.status}
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                <span className="text-blue-600">ID: #{project.id}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                <span>Stratis Deployment Protocol</span>
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-4 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-8 sm:p-12 space-y-12">
                    {/* Top Level Intelligence Matrix */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <IntelligenceCard
                            label="Contract Value"
                            value={formatCurrency(project.total_revenue, project.currency)}
                            sub="Total Agreement"
                            icon={<ICONS.Finances />}
                            color="blue"
                        />
                        <IntelligenceCard
                            label="Realized Profit"
                            value={formatCurrency(
                                calculatePaidAmount(project) -
                                ((project.developers || []).reduce((s, d) => s + (d.is_advance_paid ? d.cost * 0.4 : 0) + (d.is_final_paid ? d.cost * 0.6 : 0), 0) +
                                    calculateTotalAdditionalCosts(project.additional_costs || []))
                                , project.currency)}
                            sub="Received vs Expenses"
                            icon={<ICONS.Check />}
                            color="emerald"
                        />
                        <IntelligenceCard
                            label="Client Partner"
                            value={client?.company_name || 'Private'}
                            sub={client?.name || 'Authorized Personnel'}
                            icon={<ICONS.Clients />}
                            color="indigo"
                        />
                        <IntelligenceCard
                            label="Temporal Logic"
                            value={project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Continuous'}
                            sub={`Started: ${new Date(project.start_date).toLocaleDateString()}`}
                            icon={<ICONS.Calendar />}
                            color="amber"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Left Column: Details & Notes */}
                        <div className="space-y-12">
                            <section className="space-y-6">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                        <ICONS.Info />
                                    </div>
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">Project Context</h3>
                                </div>
                                <div className="bg-slate-50/50 border border-slate-100 rounded-[32px] p-8 space-y-8">
                                    <div className="grid grid-cols-2 gap-8">
                                        <DetailItem label="Currency Node" value={project.currency} />
                                        <DetailItem label="Milestone Count" value={project.payments?.length || 0} />
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Internal Narrative</p>
                                        <div className="text-sm font-medium text-slate-600 leading-relaxed bg-white/50 p-6 rounded-2xl border border-white min-h-[120px]">
                                            {project.notes || "No additional intelligence provided for this project."}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-6">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                                        <ICONS.Teams />
                                    </div>
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">Assigned Squad</h3>
                                </div>
                                <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm">
                                    <div className="divide-y divide-slate-50">
                                        {(project.developers || []).length > 0 ? (
                                            project.developers?.map((pd: any, idx) => (
                                                <div key={idx} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
                                                            {pd.name?.split(' ').map((n: string) => n[0]).join('') || 'D'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-900">{pd.name}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{pd.role || 'Contributor'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-black text-slate-900">{formatCurrency(pd.cost, project.currency)}</p>
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-[#2563EB]">Project Payout</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-12 text-center text-slate-400 font-medium text-sm italic">
                                                No team members officially deployed.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-6">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                                        <ICONS.Finances />
                                    </div>
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">Categorized Expenses</h3>
                                </div>
                                <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm">
                                    <div className="divide-y divide-slate-50">
                                        {(project.additional_costs || []).length > 0 ? (
                                            project.additional_costs?.map((cost: any, idx) => (
                                                <div key={idx} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black ${cost.cost_type === 'Third Party Cost' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                                                            {cost.cost_type === 'Third Party Cost' ? 'TP' : 'RV'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-900">{cost.description}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cost.cost_type}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-black text-slate-900">{formatCurrency(cost.amount, project.currency)}</p>
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Ledger Entry</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-12 text-center text-slate-400 font-medium text-sm italic">
                                                No additional expenses logged.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Right Column: Financial Matrix (Payment Tracker) */}
                        <div className="space-y-12">
                            {project.payments ? (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                    <PaymentTracker
                                        projectId={project.id}
                                        projectName={project.name}
                                        milestones={project.payments}
                                        currency={project.currency}
                                        onPaymentUpdate={onRefresh}
                                    />
                                </div>
                            ) : (
                                <div className="h-[400px] bg-slate-50 rounded-[40px] border border-slate-100 flex flex-col items-center justify-center space-y-4 animate-pulse">
                                    <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Compiling Payment Data...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-10 py-3 bg-slate-900 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all active:scale-95"
                    >
                        Close Intelligent Overview
                    </button>
                </div>
            </div>
        </div>
    );
};

const IntelligenceCard = ({ label, value, sub, icon, color }: any) => {
    const themes: any = {
        blue: "bg-blue-600 text-white shadow-blue-500/20",
        emerald: "bg-emerald-600 text-white shadow-emerald-500/20",
        indigo: "bg-[#0F172A] text-white shadow-slate-900/20",
    };

    return (
        <div className={`p-8 rounded-[32px] shadow-2xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-500 ${themes[color]}`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -translate-x-4 -translate-y-8 group-hover:bg-white/20 transition-all duration-1000" />
            <div className="flex items-center gap-3 mb-6 opacity-80">
                <div className="p-2 bg-white/10 rounded-lg">
                    {icon}
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</p>
            </div>
            <p className="text-3xl font-black tracking-tight mb-2 leading-none">{value}</p>
            <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-white/40" />
                {sub}
            </p>
        </div>
    );
};

const DetailItem = ({ label, value }: any) => (
    <div className="space-y-1.5">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none">{label}</p>
        <p className="text-base font-black text-slate-900 tracking-tight">{value}</p>
    </div>
);

export default ProjectDetailView;
