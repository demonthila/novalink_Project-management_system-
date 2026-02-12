
import React, { useState, useEffect, useMemo } from 'react';
import { Client, Developer, Project, ProjectType, ProjectStatus, Priority } from '../types';
import { ICONS } from '../constants';
import {
  formatCurrency,
  getMilestonesByProjectType,
  calculateTotalAdditionalCosts,
  calculateDeveloperTotalPayout,
  getDevPayoutSplits
} from '../utils';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: any) => void;
  clients: Client[];
  developers: Developer[];
  initialData?: Project | null;
}

const INPUT_CLASSES = "w-full h-[52px] px-5 bg-white border border-[#E2E8F0] rounded-xl text-[14px] font-bold text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-[#94A3B8] placeholder:font-medium";
const TEXTAREA_CLASSES = "w-full px-5 py-4 bg-white border border-[#E2E8F0] rounded-xl text-[14px] font-bold text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-[#94A3B8] placeholder:font-medium resize-none";
const SECTION_CONTAINER = "p-6 sm:p-8 border border-[#E2E8F0] rounded-[24px] sm:rounded-[32px] bg-white space-y-6 relative overflow-hidden";
const LABEL_CLASSES = "text-[10px] sm:text-[11px] font-black text-[#475569] mb-2 block uppercase tracking-widest";
const PRIMARY_BUTTON_CLASSES = "h-[60px] px-10 bg-[#2563EB] text-white rounded-[20px] text-[13px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/25 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3 w-full sm:w-auto";

const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSubmit, clients, developers, initialData }) => {
  const [formData, setFormData] = useState<any>({
    name: '',
    clientId: '',
    projectType: '40-30-30' as ProjectType,
    priority: 'Medium' as Priority,
    notes: '',
    baseProjectAmount: 0,
    currency: 'USD',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    status: 'Pending' as ProjectStatus,
    squad: [] as any[],
    additionalCosts: [] as any[],
    tasks: [],
  });

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData });
    } else {
      setFormData({
        name: '',
        clientId: '',
        projectType: '40-30-30',
        priority: 'Medium',
        notes: '',
        baseProjectAmount: 0,
        currency: 'USD',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        status: 'Pending',
        squad: [],
        additionalCosts: [],
        tasks: [],
      });
    }
  }, [initialData, isOpen]);

  const financialSummary = useMemo(() => {
    const baseRevenue = formData.baseProjectAmount || 0;
    const totalAddCosts = calculateTotalAdditionalCosts(formData.additionalCosts || []);
    const operatingExpense = totalAddCosts * 0.2; // 20% actual cost

    const totalRevenue = baseRevenue + totalAddCosts;
    const devCosts = calculateDeveloperTotalPayout(formData.squad || []);
    const totalInvestment = operatingExpense + devCosts;
    const profit = totalRevenue - totalInvestment;

    return {
      revenue: totalRevenue,
      operatingExpense,
      devCosts,
      profit,
      profitMargin: totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0
    };
  }, [formData.baseProjectAmount, formData.additionalCosts, formData.squad]);

  if (!isOpen) return null;

  const handleUpdateDeveloper = (index: number, field: string, value: any) => {
    const newSquad = [...formData.squad];
    newSquad[index] = { ...newSquad[index], [field]: value };
    setFormData({ ...formData, squad: newSquad });
  };

  const milestones = getMilestonesByProjectType(formData.projectType, formData.baseProjectAmount);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white sm:rounded-[40px] w-full max-w-4xl h-full sm:h-auto sm:max-h-[92vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-300">

        <div className="px-6 sm:px-12 py-8 sm:py-10 border-b border-[#F8FAFC] flex items-center justify-between sticky top-0 bg-white z-20">
          <div>
            <h2 className="text-xl sm:text-3xl font-black text-[#0F172A] tracking-tighter">{initialData ? 'Update Deployment' : 'New Project Deployment'}</h2>
            <p className="text-xs sm:text-base text-[#94A3B8] font-medium mt-1">Strategic resource allocation and budgeting.</p>
          </div>
          <button onClick={onClose} className="p-2 sm:p-3 text-[#94A3B8] hover:text-[#0F172A] hover:bg-slate-50 rounded-2xl transition-all">
            <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="px-6 sm:px-12 py-6 sm:py-10 space-y-6 sm:space-y-10">

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FinancialWidget label="Estimated Profit" value={formatCurrency(financialSummary.profit, formData.currency)} color="emerald" sub={`${financialSummary.profitMargin.toFixed(1)}% Yield`} />
            <FinancialWidget label="Technical Spend" value={formatCurrency(financialSummary.devCosts, formData.currency)} color="blue" sub={`${formData.squad.length} Engineers`} />
            <FinancialWidget label="Operating Expense (20%)" value={formatCurrency(financialSummary.operatingExpense, formData.currency)} color="amber" sub="External Costs" />
          </div>

          <div className={SECTION_CONTAINER}>
            <div className="flex items-center gap-3 text-[#2563EB] mb-4 sm:mb-8">
              <ICONS.Info />
              <h3 className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.2em]">Project Core</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
              <div className="space-y-1">
                <label className={LABEL_CLASSES}>Project Title</label>
                <input required className={INPUT_CLASSES} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className={LABEL_CLASSES}>Lifecycle Status</label>
                <select className={INPUT_CLASSES} value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                  <option value="Pending">Pending Approval</option>
                  <option value="Approved">Approved</option>
                  <option value="Ongoing">Active Development</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed / Archived</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className={LABEL_CLASSES}>Client Partner</label>
                <select required className={INPUT_CLASSES} value={formData.clientId} onChange={e => setFormData({ ...formData, clientId: e.target.value })}>
                  <option value="">Select Enterprise Client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className={LABEL_CLASSES}>Strategic Priority</label>
                <select className={INPUT_CLASSES} value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Standard Priority</option>
                  <option value="High">High-Stakes Priority</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className={LABEL_CLASSES}>Total Project Cost (USD)</label>
                <input type="number" className={INPUT_CLASSES} value={formData.baseProjectAmount || ''} onChange={e => setFormData({ ...formData, baseProjectAmount: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1">
                <label className={LABEL_CLASSES}>Payment Structure</label>
                <select className={INPUT_CLASSES} value={formData.projectType} onChange={e => setFormData({ ...formData, projectType: e.target.value })}>
                  <option value="40-30-30">Default (40% / 30% / 30%)</option>
                  <option value="Full Payment Upfront">Upfront (100%)</option>
                  <option value="Custom Milestone">Custom Allocation</option>
                </select>
              </div>
            </div>
          </div>

          <div className={SECTION_CONTAINER}>
            <div className="flex items-center justify-between mb-4 sm:mb-8">
              <div className="flex items-center gap-3 text-indigo-600">
                <ICONS.Teams />
                <h3 className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.2em]">Engineering Squad (40/60 Split)</h3>
              </div>
              <button type="button" onClick={() => setFormData({ ...formData, squad: [...formData.squad, { developerId: '', totalCost: 0, isAdvancePaid: false, isFinalPaid: false }] })} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">+ Assign Resource</button>
            </div>

            <div className="space-y-4">
              {formData.squad.map((s: any, idx: number) => {
                const splits = getDevPayoutSplits(s.totalCost || 0);
                return (
                  <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
                      <div className="flex-1 space-y-1">
                        <label className={LABEL_CLASSES}>Resource</label>
                        <select required className={INPUT_CLASSES} value={s.developerId} onChange={e => handleUpdateDeveloper(idx, 'developerId', e.target.value)}>
                          <option value="">Select Resource</option>
                          {developers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className={LABEL_CLASSES}>Total Compensation</label>
                        <input type="number" className={INPUT_CLASSES} value={s.totalCost || ''} onChange={e => handleUpdateDeveloper(idx, 'totalCost', parseFloat(e.target.value) || 0)} />
                      </div>
                      <button type="button" onClick={() => {
                        const newSquad = [...formData.squad];
                        newSquad.splice(idx, 1);
                        setFormData({ ...formData, squad: newSquad });
                      }} className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all h-[52px] flex items-center justify-center">
                        <ICONS.Delete />
                      </button>
                    </div>
                    {s.totalCost > 0 && (
                      <div className="flex gap-4">
                        <div className="flex-1 bg-white p-3 rounded-xl border border-slate-100">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Advance (40%)</p>
                          <p className="text-sm font-bold text-[#0F172A]">{formatCurrency(splits.advance, formData.currency)}</p>
                        </div>
                        <div className="flex-1 bg-white p-3 rounded-xl border border-slate-100">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Final (60%)</p>
                          <p className="text-sm font-bold text-[#0F172A]">{formatCurrency(splits.remaining, formData.currency)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className={SECTION_CONTAINER}>
            <div className="flex items-center justify-between mb-4 sm:mb-8">
              <div className="flex items-center gap-3 text-amber-600">
                <ICONS.Finances />
                <h3 className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.2em]">Additional Operational Costs</h3>
              </div>
              <button type="button" onClick={() => setFormData({ ...formData, additionalCosts: [...formData.additionalCosts, { id: Date.now().toString(), name: '', amount: 0, description: '' }] })} className="text-[10px] font-black text-amber-600 uppercase tracking-widest">+ Add Cost Item</button>
            </div>

            <div className="space-y-4">
              {formData.additionalCosts.map((cost: any, idx: number) => (
                <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
                    <div className="flex-[2] space-y-1">
                      <label className={LABEL_CLASSES}>Cost Item Name</label>
                      <input
                        required
                        placeholder="e.g. Server Licensing, Third-party API"
                        className={INPUT_CLASSES}
                        value={cost.name}
                        onChange={e => {
                          const newCosts = [...formData.additionalCosts];
                          newCosts[idx] = { ...newCosts[idx], name: e.target.value };
                          setFormData({ ...formData, additionalCosts: newCosts });
                        }}
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className={LABEL_CLASSES}>Cost Amount ($)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                        <input
                          type="number"
                          className={`${INPUT_CLASSES} pl-8`}
                          value={cost.amount || ''}
                          onChange={e => {
                            const newCosts = [...formData.additionalCosts];
                            newCosts[idx] = { ...newCosts[idx], amount: parseFloat(e.target.value) || 0 };
                            setFormData({ ...formData, additionalCosts: newCosts });
                          }}
                        />
                      </div>
                    </div>
                    <button type="button" onClick={() => {
                      const newCosts = [...formData.additionalCosts];
                      newCosts.splice(idx, 1);
                      setFormData({ ...formData, additionalCosts: newCosts });
                    }} className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all h-[52px] flex items-center justify-center">
                      <ICONS.Delete />
                    </button>
                  </div>
                </div>
              ))}
              {formData.additionalCosts.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl">
                  <p className="text-xs font-bold text-slate-400">No additional costs recorded</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-6 pb-12 sm:pb-0">
            <button type="button" onClick={onClose} className="w-full sm:w-auto px-8 py-4 text-xs font-black text-[#64748B] uppercase tracking-[0.2em]">Discard</button>
            <button type="submit" className={PRIMARY_BUTTON_CLASSES}>Commit Deployment</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const FinancialWidget = ({ label, value, color, sub }: any) => {
  const colors: any = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
  };
  return (
    <div className={`p-4 sm:p-6 rounded-[16px] sm:rounded-[24px] border ${colors[color]} shadow-sm`}>
      <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] opacity-80 mb-2">{label}</p>
      <p className="text-xl sm:text-2xl font-black tracking-tighter leading-none mb-1">{value}</p>
      <p className="text-[9px] font-bold opacity-70">{sub}</p>
    </div>
  );
};

export default ProjectModal;
