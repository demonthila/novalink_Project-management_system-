
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

const INPUT_CLASSES = "w-full h-12 px-5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-slate-400 placeholder:font-medium";
const LABEL_CLASSES = "text-[10px] font-black text-slate-400 mb-2 block uppercase tracking-widest";
const PRIMARY_BUTTON_CLASSES = "px-10 py-3 bg-blue-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2.5 w-full sm:w-auto";
const SECTION_CONTAINER = "p-6 sm:p-10 border border-slate-100 rounded-[32px] bg-white shadow-sm space-y-8 relative overflow-hidden";
const SECTION_HEADER = "flex items-center gap-4 mb-8 pb-4 border-b border-slate-50";


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
        developers: (initialData.developers || []).map(d => ({ id: d.id, cost: d.cost, is_advance_paid: !!d.is_advance_paid, is_final_paid: !!d.is_final_paid })), // Map to flat structure for form if needed
        payments: initialData.payments || [],
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
        payments: [],
        additional_costs: [],
        notes: ''
      });
    }
  }, [initialData, isOpen]);

  const financialSummary = useMemo(() => {
    const revenue = parseFloat(formData.total_revenue) || 0;

    // Additional Costs
    const totalAddCosts = calculateTotalAdditionalCosts(formData.additional_costs || []); // Sum of amounts

    // Developer Costs (only amounts actually paid to developers)
    // Each developer: advance = 40% of cost when is_advance_paid, final = 60% when is_final_paid
    const devCosts = (formData.developers || []).reduce((sum: number, d: any) => {
      const cost = parseFloat(d.cost) || 0;
      const paid = (d.is_advance_paid ? cost * 0.4 : 0) + (d.is_final_paid ? cost * 0.6 : 0);
      return sum + paid;
    }, 0);

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
    setFormData({ ...formData, developers: [...formData.developers, { id: '', cost: 0, is_advance_paid: false, is_final_paid: false }] });
  };

  const handleRemoveDeveloper = (index: number) => {
    const newDevs = [...formData.developers];
    newDevs.splice(index, 1);
    setFormData({ ...formData, developers: newDevs });
  };

  const handleSubmit = () => {
    // If user attempts to mark Completed, verify payments first
    if (String(formData.status) === 'Completed') {
      const payments = formData.payments || [];
      const allPaid = payments.length >= 3 && payments.every((p: any) => String((p.status || '')).toLowerCase() === 'paid');
      if (!allPaid) {
        alert('⚠ Please collect all remaining payments before completing this project.');
        return;
      }

      if (!confirm('Are you sure you want to mark this project as Completed?')) return;
    }

    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white sm:rounded-[40px] w-full max-w-4xl h-full sm:h-auto sm:max-h-[92vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-300">

        <div className="px-8 sm:px-12 py-8 sm:py-10 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-20">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {initialData ? 'Update Deployment' : 'Project Onboarding'}
            </h2>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Resource allocation & Financial Matrix</p>
          </div>
          <button onClick={onClose} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="px-6 sm:px-12 py-6 sm:py-10 space-y-6 sm:space-y-10">

          {/* Financial Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FinancialWidget label="Project Profit" value={formatCurrency(financialSummary.profit, formData.currency)} color="emerald" sub={`${financialSummary.profitMargin.toFixed(1)}% Margin`} />
            <FinancialWidget label="Technical Spend" value={formatCurrency(financialSummary.devCosts, formData.currency)} color="blue" sub={`${formData.developers.length} Developers`} />
            <FinancialWidget label="Additional Costs" value={formatCurrency(financialSummary.additionalCosts, formData.currency)} color="amber" sub="External Costs" />
          </div>

          <div className={SECTION_CONTAINER}>
            <div className={SECTION_HEADER}>
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                <ICONS.Info />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 leading-none">Project Identity</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Core meta-data and taxonomy</p>
              </div>
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
                <select
                  required
                  className={INPUT_CLASSES}
                  value={formData.client_id ? String(formData.client_id) : ""}
                  onChange={e => setFormData({ ...formData, client_id: e.target.value })}
                >
                  <option value="">Select Client</option>
                  {Array.isArray(clients) && clients.length > 0 ? (
                    clients.map(c => (
                      <option key={String(c.id)} value={String(c.id)}>
                        {c.company_name} ({c.name})
                      </option>
                    ))
                  ) : (
                    <option disabled>No clients available</option>
                  )}
                </select>
                {Array.isArray(clients) && clients.length === 0 && (
                  <p className="text-xs text-red-500 mt-1 italic font-medium">Please add a partner/client first.</p>
                )}
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
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <ICONS.Teams />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 leading-none">Human Resources</h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Squad allocation & technical payout</p>
                </div>
              </div>
              <button type="button" onClick={handleAddDeveloper} className="px-4 py-2 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-indigo-100 transition-colors">+ Assign</button>
            </div>

            <div className="space-y-4">
              {formData.developers.map((dev: any, idx: number) => (
                <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row gap-4 sm:items-end">
                  <div className="flex-1 space-y-1">
                    <label className={LABEL_CLASSES}>Developer</label>
                    <select
                      required
                      className={INPUT_CLASSES}
                      value={dev.id ? String(dev.id) : ""}
                      onChange={e => handleUpdateDeveloper(idx, 'id', e.target.value)}
                    >
                      <option value="">Select Developer</option>
                      {Array.isArray(developers) && developers.map(d => (
                        <option key={String(d.id)} value={String(d.id)}>
                          {d.name} ({d.role})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className={LABEL_CLASSES}>Cost for Project</label>
                    <input type="number" className={INPUT_CLASSES} value={dev.cost || ''} onChange={e => handleUpdateDeveloper(idx, 'cost', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className={LABEL_CLASSES}>Developer Payments</label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={!!dev.is_advance_paid} onChange={e => handleUpdateDeveloper(idx, 'is_advance_paid', e.target.checked)} />
                        <span className="text-xs">Advance (40%)</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={!!dev.is_final_paid} onChange={e => handleUpdateDeveloper(idx, 'is_final_paid', e.target.checked)} />
                        <span className="text-xs">Final (60%)</span>
                      </label>
                      <div className="ml-auto text-xs font-bold text-slate-600">
                        {formatCurrency(((dev.is_advance_paid ? dev.cost * 0.4 : 0) + (dev.is_final_paid ? dev.cost * 0.6 : 0)) || 0, formData.currency)} paid
                      </div>
                    </div>
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
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                  <ICONS.Finances />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 leading-none">Operational Costs</h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">External overheads & assets</p>
                </div>
              </div>
              <button type="button" onClick={() => setFormData({ ...formData, additional_costs: [...formData.additional_costs, { cost_type: 'Third Party Cost', description: '', amount: 0 }] })} className="px-4 py-2 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-amber-100 transition-colors">+ New Expense</button>
            </div>

            <div className="space-y-4">
              {formData.additional_costs.map((cost: any, idx: number) => (
                <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-4 md:items-end">
                  <div className="flex-1 space-y-1">
                    <label className={LABEL_CLASSES}>Cost Type</label>
                    <select
                      required
                      className={INPUT_CLASSES}
                      value={cost.cost_type || 'Third Party Cost'}
                      onChange={e => {
                        const newCosts = [...formData.additional_costs];
                        newCosts[idx] = { ...newCosts[idx], cost_type: e.target.value };
                        setFormData({ ...formData, additional_costs: newCosts });
                      }}
                    >
                      <option value="Third Party Cost">Third Party Cost</option>
                      <option value="Revision Cost">Revision Cost</option>
                    </select>
                  </div>
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

          {/* Project Notes */}
          <div className={SECTION_CONTAINER}>
            <div className="flex items-center gap-3 text-slate-600 mb-8">
              <ICONS.Info />
              <h3 className="text-[12px] font-black uppercase tracking-[0.2em]">Project Notes</h3>
            </div>
            <textarea
              className={`${INPUT_CLASSES} h-32 py-4 resize-none`}
              placeholder="Internal project notes and details..."
              value={formData.notes || ''}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-6 pb-12 sm:pb-0">
            <button type="button" onClick={onClose} className="w-full sm:w-auto px-10 py-3 text-[11px] font-black text-[#64748B] uppercase tracking-widest hover:text-[#0F172A] transition-all">Discard</button>

            <button type="submit" className={PRIMARY_BUTTON_CLASSES}>Save Project</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const FinancialWidget = ({ label, value, color, sub }: any) => {
  const colors: any = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100/50",
    blue: "bg-blue-50 text-blue-600 border-blue-100/50",
    amber: "bg-amber-50 text-amber-600 border-amber-100/50",
  };
  return (
    <div className={`p-6 rounded-[24px] border border-transparent hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 overflow-hidden relative group ${colors[color]}`}>
      <div className="absolute top-0 right-0 w-16 h-16 bg-white/20 blur-2xl rotate-45 translate-x-12 -translate-y-12 group-hover:translate-x-10 transition-transform duration-1000" />
      <p className="text-[9px] font-black uppercase tracking-[0.15em] opacity-60 mb-1 leading-none">{label}</p>
      <p className="text-2xl font-black tracking-tight leading-none mb-1.5">{value}</p>
      <div className="flex items-center gap-2">
        <div className="w-1 h-1 rounded-full bg-current opacity-40" />
        <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">{sub}</p>
      </div>
    </div>
  );
};

export default ProjectModal;
