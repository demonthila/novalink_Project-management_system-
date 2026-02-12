
import React, { useState, useEffect, useMemo } from 'react';
import { Client, Developer, Project, ProjectStatus } from '../types';
import { ICONS } from '../constants';
import {
  formatCurrency,
  calculateTotalAdditionalCosts,
  calculateDeveloperTotalPayout
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
const LABEL_CLASSES = "text-[10px] sm:text-[11px] font-black text-[#475569] mb-2 block uppercase tracking-widest";
const PRIMARY_BUTTON_CLASSES = "h-[60px] px-10 bg-[#2563EB] text-white rounded-[20px] text-[13px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/25 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3 w-full sm:w-auto";
const SECTION_CONTAINER = "p-6 sm:p-8 border border-[#E2E8F0] rounded-[24px] sm:rounded-[32px] bg-white space-y-6 relative overflow-hidden";

const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSubmit, clients, developers, initialData }) => {
  const [formData, setFormData] = useState<any>({
    name: '',
    client_id: '',
    status: 'Pending' as ProjectStatus,
    currency: 'USD',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    total_revenue: 0,
    developers: [] as any[],
    additional_costs: [] as any[],
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      // Map initial data to form.
      // initialData comes from API (snake_case)
      setFormData({
        id: initialData.id,
        name: initialData.name,
        client_id: initialData.client_id,
        status: initialData.status,
        currency: initialData.currency || 'USD',
        start_date: initialData.start_date || new Date().toISOString().split('T')[0],
        end_date: initialData.end_date || '',
        total_revenue: initialData.total_revenue || 0,
        developers: (initialData.developers || []).map(d => ({ id: d.id, cost: d.cost })), // Map to flat structure for form if needed
        additional_costs: initialData.additional_costs || [],
        notes: initialData.notes || ''
      });
    } else {
      setFormData({
        name: '',
        client_id: '',
        status: 'Pending',
        currency: 'USD',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        total_revenue: 0,
        developers: [],
        additional_costs: [],
        notes: ''
      });
    }
  }, [initialData, isOpen]);

  const financialSummary = useMemo(() => {
    const revenue = parseFloat(formData.total_revenue) || 0;

    // Additional Costs
    const totalAddCosts = calculateTotalAdditionalCosts(formData.additional_costs || []); // Sum of amounts

    // Developer Costs
    // Map formData.developers (which has {id, cost})
    const devCosts = (formData.developers || []).reduce((sum: number, d: any) => sum + (parseFloat(d.cost) || 0), 0);

    const totalCosts = totalAddCosts + devCosts;
    const profit = revenue - totalCosts;

    return {
      revenue,
      totalCosts,
      devCosts,
      additionalCosts: totalAddCosts,
      profit,
      profitMargin: revenue > 0 ? (profit / revenue) * 100 : 0
    };
  }, [formData.total_revenue, formData.additional_costs, formData.developers]);

  if (!isOpen) return null;

  const handleUpdateDeveloper = (index: number, field: string, value: any) => {
    const newDevs = [...formData.developers];
    newDevs[index] = { ...newDevs[index], [field]: value };
    setFormData({ ...formData, developers: newDevs });
  };

  const handleAddDeveloper = () => {
    setFormData({ ...formData, developers: [...formData.developers, { id: '', cost: 0 }] });
  };

  const handleRemoveDeveloper = (index: number) => {
    const newDevs = [...formData.developers];
    newDevs.splice(index, 1);
    setFormData({ ...formData, developers: newDevs });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white sm:rounded-[40px] w-full max-w-4xl h-full sm:h-auto sm:max-h-[92vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-300">

        <div className="px-6 sm:px-12 py-8 sm:py-10 border-b border-[#F8FAFC] flex items-center justify-between sticky top-0 bg-white z-20">
          <div>
            <h2 className="text-xl sm:text-3xl font-black text-[#0F172A] tracking-tighter">
              {initialData ? 'Update Project' : 'New Project'}
            </h2>
            <p className="text-xs sm:text-base text-[#94A3B8] font-medium mt-1">Strategic resource allocation and budgeting.</p>
          </div>
          <button onClick={onClose} className="p-2 sm:p-3 text-[#94A3B8] hover:text-[#0F172A] hover:bg-slate-50 rounded-2xl transition-all">
            <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="px-6 sm:px-12 py-6 sm:py-10 space-y-6 sm:space-y-10">

          {/* Financial Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FinancialWidget label="Project Profit" value={formatCurrency(financialSummary.profit, formData.currency)} color="emerald" sub={`${financialSummary.profitMargin.toFixed(1)}% Margin`} />
            <FinancialWidget label="Technical Spend" value={formatCurrency(financialSummary.devCosts, formData.currency)} color="blue" sub={`${formData.developers.length} Developers`} />
            <FinancialWidget label="Additional Costs" value={formatCurrency(financialSummary.additionalCosts, formData.currency)} color="amber" sub="External Costs" />
          </div>

          <div className={SECTION_CONTAINER}>
            <div className="flex items-center gap-3 text-[#2563EB] mb-4 sm:mb-8">
              <ICONS.Info />
              <h3 className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.2em]">Project Core</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
              <div className="space-y-1">
                <label className={LABEL_CLASSES}>Project Name</label>
                <input required className={INPUT_CLASSES} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className={LABEL_CLASSES}>Status</label>
                <select className={INPUT_CLASSES} value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                  <option value="Pending">Pending</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className={LABEL_CLASSES}>Client</label>
                <select required className={INPUT_CLASSES} value={formData.client_id} onChange={e => setFormData({ ...formData, client_id: e.target.value })}>
                  <option value="">Select Client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className={LABEL_CLASSES}>Total Revenue (Contract Value)</label>
                <input type="number" className={INPUT_CLASSES} value={formData.total_revenue || ''} onChange={e => setFormData({ ...formData, total_revenue: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1">
                <label className={LABEL_CLASSES}>Start Date</label>
                <input type="date" className={INPUT_CLASSES} value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className={LABEL_CLASSES}>End Date (Deadline)</label>
                <input type="date" className={INPUT_CLASSES} value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Developers */}
          <div className={SECTION_CONTAINER}>
            <div className="flex items-center justify-between mb-4 sm:mb-8">
              <div className="flex items-center gap-3 text-indigo-600">
                <ICONS.Teams />
                <h3 className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.2em]">Developers & Costs</h3>
              </div>
              <button type="button" onClick={handleAddDeveloper} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">+ Assign Developer</button>
            </div>

            <div className="space-y-4">
              {formData.developers.map((dev: any, idx: number) => (
                <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row gap-4 sm:items-end">
                  <div className="flex-1 space-y-1">
                    <label className={LABEL_CLASSES}>Developer</label>
                    <select required className={INPUT_CLASSES} value={dev.id} onChange={e => handleUpdateDeveloper(idx, 'id', e.target.value)}>
                      <option value="">Select Developer</option>
                      {developers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.role})</option>)}
                    </select>
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className={LABEL_CLASSES}>Cost for Project</label>
                    <input type="number" className={INPUT_CLASSES} value={dev.cost || ''} onChange={e => handleUpdateDeveloper(idx, 'cost', parseFloat(e.target.value) || 0)} />
                  </div>
                  <button type="button" onClick={() => handleRemoveDeveloper(idx)} className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all h-[52px] flex items-center justify-center">
                    <ICONS.Delete />
                  </button>
                </div>
              ))}
              {formData.developers.length === 0 && <p className="text-center text-slate-400 font-medium text-sm">No developers assigned.</p>}
            </div>
          </div>

          {/* Additional Costs */}
          <div className={SECTION_CONTAINER}>
            <div className="flex items-center justify-between mb-4 sm:mb-8">
              <div className="flex items-center gap-3 text-amber-600">
                <ICONS.Finances />
                <h3 className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.2em]">Additional Costs</h3>
              </div>
              <button type="button" onClick={() => setFormData({ ...formData, additional_costs: [...formData.additional_costs, { description: '', amount: 0 }] })} className="text-[10px] font-black text-amber-600 uppercase tracking-widest">+ Add Cost</button>
            </div>

            <div className="space-y-4">
              {formData.additional_costs.map((cost: any, idx: number) => (
                <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row gap-4 sm:items-end">
                  <div className="flex-[2] space-y-1">
                    <label className={LABEL_CLASSES}>Description</label>
                    <input
                      required
                      className={INPUT_CLASSES}
                      value={cost.description}
                      onChange={e => {
                        const newCosts = [...formData.additional_costs];
                        newCosts[idx] = { ...newCosts[idx], description: e.target.value };
                        setFormData({ ...formData, additional_costs: newCosts });
                      }}
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className={LABEL_CLASSES}>Amount</label>
                    <input
                      type="number"
                      className={INPUT_CLASSES}
                      value={cost.amount || ''}
                      onChange={e => {
                        const newCosts = [...formData.additional_costs];
                        newCosts[idx] = { ...newCosts[idx], amount: parseFloat(e.target.value) || 0 };
                        setFormData({ ...formData, additional_costs: newCosts });
                      }}
                    />
                  </div>
                  <button type="button" onClick={() => {
                    const newCosts = [...formData.additional_costs];
                    newCosts.splice(idx, 1);
                    setFormData({ ...formData, additional_costs: newCosts });
                  }} className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all h-[52px] flex items-center justify-center">
                    <ICONS.Delete />
                  </button>
                </div>
              ))}
              {formData.additional_costs.length === 0 && <p className="text-center text-slate-400 font-medium text-sm">No additional costs.</p>}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-6 pb-12 sm:pb-0">
            <button type="button" onClick={onClose} className="w-full sm:w-auto px-8 py-4 text-xs font-black text-[#64748B] uppercase tracking-[0.2em]">Discard</button>
            <button type="submit" className={PRIMARY_BUTTON_CLASSES}>Save Project</button>
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
