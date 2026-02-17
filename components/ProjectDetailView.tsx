
import React from 'react';
import { Project, Client, Developer } from '../types';
import { ICONS } from '../constants';
import { formatCurrency, calculateGrandTotal, calculatePaidAmount, calculateTotalAdditionalCosts } from '../utils';
import PaymentTracker from './PaymentTracker';
import { generateProjectInvoice } from '../services/invoiceService';
import logo from '../assets/logo.png';

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
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = React.useState(false);

    // Initialize complex invoice state
    const [invoiceData, setInvoiceData] = React.useState<any>(null);

    const [isGenerating, setIsGenerating] = React.useState(false);

    // Populate default data when modal opens
    React.useEffect(() => {
        if (isInvoiceModalOpen && !invoiceData) {
            const unpaidMilestones = (project.payments || []).filter(p => p.status === 'Unpaid');
            const additionalCosts = (project.additional_costs || []).map(c => ({
                id: `cost-${c.id}`,
                type: `Cost: ${c.cost_type}`,
                description: c.description,
                amount: Number(c.amount),
                included: true
            }));

            const milestoneItems = unpaidMilestones.map(p => ({
                id: `milestone-${p.id}`,
                type: `Milestone ${p.payment_number}`,
                description: `Project Payment Phase ${p.payment_number}`,
                amount: Number(p.amount),
                included: true
            }));

            setInvoiceData({
                invoiceNumber: `INV-${project.id}-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`,
                dueDate: project.end_date || new Date().toISOString().split('T')[0],
                billedBy: {
                    name: "Novalink Innovations (Pvt) Ltd",
                    address: "Colombo, Western Province, Sri Lanka",
                    email: "info@novalinkinnovations.com",
                    phone: "+94 76 006 8914"
                },
                billedTo: {
                    company: client?.company_name || "Private Client",
                    name: client?.name || "Authorized Personnel",
                    email: client?.email || "",
                    phone: client?.phone || "",
                    address: "" // Optional addition
                },
                items: [...milestoneItems, ...additionalCosts]
            });
        }
    }, [isInvoiceModalOpen, project, client, invoiceData]);

    const handleDownload = async () => {
        setIsGenerating(true);
        try {
            await generateProjectInvoice(project, client, invoiceData);
            setIsInvoiceModalOpen(false);
            setInvoiceData(null); // Reset for next time
        } catch (error) {
            console.error("Failed to generate invoice:", error);
            alert("Failed to generate invoice. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const toggleItem = (id: string) => {
        const newItems = invoiceData.items.map((item: any) =>
            item.id === id ? { ...item, included: !item.included } : item
        );
        setInvoiceData({ ...invoiceData, items: newItems });
    };

    const updateItem = (id: string, field: string, value: any) => {
        const newItems = invoiceData.items.map((item: any) =>
            item.id === id ? { ...item, [field]: value } : item
        );
        setInvoiceData({ ...invoiceData, items: newItems });
    };

    const calculateTotal = () => {
        if (!invoiceData) return 0;
        return invoiceData.items
            .filter((i: any) => i.included)
            .reduce((sum: number, i: any) => sum + i.amount, 0);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md" onClick={onClose}>
            <div
                className="bg-white sm:rounded-[40px] w-full max-w-6xl h-full sm:h-[94vh] sm:max-h-[94vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-300 border border-slate-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Invoice Finalization Console */}
                {isInvoiceModalOpen && invoiceData && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white rounded-[40px] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200 animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>

                            <div className="px-10 py-7 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                                <div className="space-y-1">
                                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Invoice Customization</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Resource Matrix Optimization</p>
                                </div>
                                <button onClick={() => setIsInvoiceModalOpen(false)} className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all group">
                                    <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 sm:p-10 space-y-10 custom-scrollbar">
                                <section className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1 h-3 bg-blue-600 rounded-full" />
                                        <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-900">Document Protocol</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">ID CARD</label>
                                            <input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                                                value={invoiceData.invoiceNumber} onChange={e => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">SETTLEMENT DATE</label>
                                            <input type="date" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                                                value={invoiceData.dueDate} onChange={e => setInvoiceData({ ...invoiceData, dueDate: e.target.value })} />
                                        </div>
                                    </div>
                                </section>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <section className="space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-1 h-3 bg-blue-600 rounded-full" />
                                            <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-900">Issuer Details</h4>
                                        </div>
                                        <div className="space-y-3 bg-slate-50/50 p-5 rounded-3xl border border-slate-100">
                                            <input className="w-full bg-transparent text-xs font-black text-slate-900 border-b border-slate-200 focus:border-blue-500 outline-none pb-1.5 transition-colors"
                                                placeholder="Company Name" value={invoiceData.billedBy.name} onChange={e => setInvoiceData({ ...invoiceData, billedBy: { ...invoiceData.billedBy, name: e.target.value } })} />
                                            <input className="w-full bg-transparent text-[10px] font-bold text-slate-500 border-b border-slate-200 focus:border-blue-500 outline-none pb-1.5 transition-colors"
                                                placeholder="Address" value={invoiceData.billedBy.address} onChange={e => setInvoiceData({ ...invoiceData, billedBy: { ...invoiceData.billedBy, address: e.target.value } })} />
                                        </div>
                                    </section>

                                    <section className="space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-1 h-3 bg-blue-600 rounded-full" />
                                            <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-900">Client Info</h4>
                                        </div>
                                        <div className="space-y-3 bg-slate-50/50 p-5 rounded-3xl border border-slate-100">
                                            <input className="w-full bg-transparent text-xs font-black text-slate-900 border-b border-slate-200 focus:border-blue-500 outline-none pb-1.5 transition-colors"
                                                placeholder="Company Name" value={invoiceData.billedTo.company} onChange={e => setInvoiceData({ ...invoiceData, billedTo: { ...invoiceData.billedTo, company: e.target.value } })} />
                                            <input className="w-full bg-transparent text-[10px] font-bold text-slate-500 border-b border-slate-200 focus:border-blue-500 outline-none pb-1.5 transition-colors"
                                                placeholder="Contact Name" value={invoiceData.billedTo.name} onChange={e => setInvoiceData({ ...invoiceData, billedTo: { ...invoiceData.billedTo, name: e.target.value } })} />
                                        </div>
                                    </section>
                                </div>

                                <section className="space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-3 bg-amber-500 rounded-full" />
                                            <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-900">Line Items</h4>
                                        </div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">{invoiceData.items.filter((i: any) => i.included).length} Active</span>
                                    </div>
                                    <div className="space-y-2">
                                        {invoiceData.items.map((item: any) => (
                                            <div key={item.id} className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${item.included ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50/50 border-transparent opacity-40'}`}>
                                                <div className="flex items-center gap-3 flex-1">
                                                    <input type="checkbox" checked={item.included} onChange={() => toggleItem(item.id)} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20" />
                                                    <input className="flex-1 text-[11px] font-bold text-slate-800 bg-transparent border-none outline-none p-0 focus:ring-0"
                                                        value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} />
                                                </div>
                                                <input type="number" className="w-20 text-[11px] font-black text-blue-600 bg-transparent border-none outline-none p-0 text-right focus:ring-0"
                                                    value={item.amount} onChange={e => updateItem(item.id, 'amount', parseFloat(e.target.value) || 0)} />
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <div className="bg-[#0F172A] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-2xl rounded-full translate-x-8 -translate-y-8" />
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Receivable</p>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-blue-400">{project.currency}</p>
                                    </div>
                                    <p className="text-3xl font-black tracking-tighter">{formatCurrency(calculateTotal(), project.currency)}</p>
                                </div>
                            </div>

                            <div className="p-6 sm:px-8 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between gap-4 sticky bottom-0 z-10">
                                <button onClick={() => setIsInvoiceModalOpen(false)} className="text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-rose-600 transition-all px-4 py-2">Discard</button>
                                <button
                                    onClick={handleDownload}
                                    disabled={isGenerating}
                                    className={`flex-1 max-w-[240px] px-6 py-3.5 ${isGenerating ? 'bg-blue-400 cursor-not-allowed' : 'bg-[#2563EB] hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95'} text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2`}
                                >
                                    {isGenerating ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Generating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <ICONS.Download />
                                            <span>Download PDF</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}


                {/* Glassmorphic Header */}
                <div className="px-8 sm:px-12 py-8 sm:py-10 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-20">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[24px] bg-blue-600 text-white flex items-center justify-center text-2xl font-black shadow-xl shadow-blue-500/20 overflow-hidden">
                            <img src={logo} className="w-full h-full object-cover p-2 bg-white" alt="N" onError={(e: any) => e.target.src = ''} />
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
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsInvoiceModalOpen(true)}
                            className="flex items-center gap-2.5 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-[11px] font-black uppercase tracking-widest hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm group"
                        >
                            <ICONS.Download />
                            <span>Download Invoice</span>
                        </button>
                        <button onClick={onClose} className="p-4 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
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
                                                            {(pd.name || 'D').split(' ').filter((n: string) => n).map((n: string) => n[0]).join('')}
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
                                        projectStatus={project.status}
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
