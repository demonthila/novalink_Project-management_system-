
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

  const [isSaving, setIsSaving] = useState(false);

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

  const isValid = !!(formData.name && formData.client_id && formData.end_date);

  const handleSubmit = async () => {
    // If user attempts to mark Completed, verify payments first
    if (String(formData.status) === 'Completed' || String(formData.status) === 'Finished') {
      const payments = formData.payments || [];
      const allPaid = payments.length >= 3 && payments.every((p: any) => String((p.status || '')).toLowerCase() === 'paid');
      if (!allPaid) {
        alert('⚠ Please collect all remaining payments (minimum 3 milestones and full contractual value) before completing this project.');
        return;
      }

      if (!confirm('Are you sure you want to mark this project as Completed?')) return;
    }

    // Basic validation
    if (!formData.name || !formData.client_id) {
      alert("Please fill in all mandatory fields (Name and Partner).");
      return;
    }

    setIsSaving(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white sm:rounded-[40px] w-full max-w-4xl h-full sm:h-auto sm:max-h-[92vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-300">

        <div className="px-8 sm:px-12 py-8 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-[110]">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {initialData ? 'Update Project' : 'Project Onboarding'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md leading-none">Management Matrix</p>
              <div className="w-1 h-1 rounded-full bg-slate-200" />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">V2.4 Enterprise</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all group">
            <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-4 sm:p-12 overflow-y-auto max-h-[calc(92vh-100px)]">
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-12">

            {/* Financial Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <FinancialWidget label="Net Profit Yield" value={formatCurrency(financialSummary.profit, formData.currency)} color="emerald" sub={`${financialSummary.profitMargin.toFixed(1)}% Margin`} />
              <FinancialWidget label="Resource Burn" value={formatCurrency(financialSummary.devCosts, formData.currency)} color="blue" sub={`${formData.developers.filter((d: any) => d.id).length} Assigned Members`} />
              <FinancialWidget label="Operating Costs" value={formatCurrency(financialSummary.additionalCosts, formData.currency)} color="amber" sub="External assets & Fees" />
            </div>

            <div className={SECTION_CONTAINER}>
              <div className={SECTION_HEADER}>
                <div className="w-12 h-12 rounded-[14px] bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                  <ICONS.Info />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#0F172A]">Project Details</h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider italic">Primary information & classification</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1.5">
                  <label className={LABEL_CLASSES}>Project Name</label>
                  <input required className={INPUT_CLASSES} placeholder="Ex: Cloud Infrastructure Overhaul" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className={LABEL_CLASSES}>Status Protocol</label>
                  <select className={INPUT_CLASSES} value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                    <option value="Pending">Pending</option>
                    <option value="Active">Active</option>
                    <option value="Finished">Finished</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className={LABEL_CLASSES}>Commencement Date</label>
                  <input required type="date" className={INPUT_CLASSES} value={formData.start_date || ''} onChange={e => setFormData({ ...formData, start_date: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className={LABEL_CLASSES}>Target Milestone (Deadline)</label>
                  <input required type="date" className={INPUT_CLASSES} value={formData.end_date || ''} onChange={e => setFormData({ ...formData, end_date: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Client Info Section */}
            <div className={SECTION_CONTAINER}>
              <div className={SECTION_HEADER}>
                <div className="w-12 h-12 rounded-[14px] bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                  <ICONS.Clients />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#0F172A]">Client Info</h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider italic">Authorized partner details</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1.5">
                  <label className={LABEL_CLASSES}>Partner / Client</label>
                  <select
                    required
                    className={INPUT_CLASSES}
                    value={formData.client_id ? String(formData.client_id) : ""}
                    onChange={e => setFormData({ ...formData, client_id: e.target.value })}
                  >
                    <option value="">Select Authorized Partner</option>
                    {Array.isArray(clients) && clients.length > 0 ? (
                      clients.map(c => (
                        <option key={String(c.id)} value={String(c.id)}>
                          {c.company_name} - {c.name}
                        </option>
                      ))
                    ) : (
                      <option disabled>No partners available</option>
                    )}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className={LABEL_CLASSES}>Contractual Value</label>
                  <div className="relative">
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      className={`${INPUT_CLASSES} text-right pr-32`}
                      placeholder="0.00"
                      value={formData.total_revenue || ''}
                      onChange={e => setFormData({ ...formData, total_revenue: parseFloat(e.target.value) || 0 })}
                      onWheel={(e) => (e.target as HTMLElement).blur()}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">CURRENCY: {formData.currency}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Developers */}
            <div className={SECTION_CONTAINER}>
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[14px] bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                    <ICONS.Teams />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#0F172A]">Talent Deployment</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider italic">Squad allocation & budget distribution</p>
                  </div>
                </div>
                <button type="button" onClick={handleAddDeveloper} className="px-5 py-2.5 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95">Assign Staff</button>
              </div>

              <div className="space-y-6">
                {formData.developers.map((dev: any, idx: number) => (
                  <div key={idx} className="p-8 bg-slate-50/50 rounded-[32px] border border-slate-100/80 group hover:bg-white hover:border-indigo-100 transition-all duration-300 relative">
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                      <div className="xl:col-span-4 space-y-1.5">
                        <label className={LABEL_CLASSES}>Member Profile</label>
                        <select
                          required
                          className={INPUT_CLASSES}
                          value={dev.id ? String(dev.id) : ""}
                          onChange={e => handleUpdateDeveloper(idx, 'id', e.target.value)}
                        >
                          <option value="">Select Talent</option>
                          {Array.isArray(developers) && developers.map(d => (
                            <option key={String(d.id)} value={String(d.id)}>
                              {d.name} — {d.role}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="xl:col-span-2 space-y-1.5">
                        <label className={LABEL_CLASSES}>Member Budget</label>
                        <input
                          type="number"
                          className={`${INPUT_CLASSES} text-right`}
                          placeholder="0.00"
                          value={dev.cost || ''}
                          onChange={e => handleUpdateDeveloper(idx, 'cost', parseFloat(e.target.value) || 0)}
                          onWheel={(e) => (e.target as HTMLElement).blur()}
                        />
                      </div>
                      <div className="xl:col-span-5 space-y-1.5">
                        <label className={LABEL_CLASSES}>Payment Milestones</label>
                        <div className="h-12 flex items-center justify-between gap-4 px-5 bg-white border border-slate-100 rounded-xl">
                          <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 text-[11px] font-bold text-slate-600 cursor-pointer select-none">
                              <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20" checked={!!dev.is_advance_paid} onChange={e => handleUpdateDeveloper(idx, 'is_advance_paid', e.target.checked)} />
                              <span>Advance (40%)</span>
                            </label>
                            <label className="flex items-center gap-2 text-[11px] font-bold text-slate-600 cursor-pointer select-none">
                              <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20" checked={!!dev.is_final_paid} onChange={e => handleUpdateDeveloper(idx, 'is_final_paid', e.target.checked)} />
                              <span>Final (60%)</span>
                            </label>
                          </div>
                          <div className="text-[9px] font-black text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                            {formatCurrency(((dev.is_advance_paid ? dev.cost * 0.4 : 0) + (dev.is_final_paid ? dev.cost * 0.6 : 0)) || 0, formData.currency)} Paid
                          </div>
                        </div>
                      </div>
                      <div className="xl:col-span-1 flex items-end justify-end">
                        <button type="button" onClick={() => handleRemoveDeveloper(idx)} className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all h-12 w-12 flex items-center justify-center shadow-sm">
                          <ICONS.Delete />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {formData.developers.length === 0 && (
                  <div className="py-12 border-2 border-dashed border-slate-100 rounded-[32px] flex flex-col items-center justify-center text-slate-400">
                    <div className="p-3 bg-slate-50 rounded-full mb-3"><ICONS.Teams /></div>
                    <p className="font-bold text-sm">No specialists assigned to this project.</p>
                    <p className="text-[10px] uppercase font-black tracking-widest mt-1">Authorized personnel only</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Milestones (ReadOnly in this modal) */}
            {initialData && formData.payments && formData.payments.length > 0 && (
              <div className={SECTION_CONTAINER}>
                <div className={SECTION_HEADER}>
                  <div className="w-12 h-12 rounded-[14px] bg-slate-200 flex items-center justify-center text-slate-600">
                    <ICONS.Calendar />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#0F172A]">Payment Milestones</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider italic">Automated Fiscal Schedule</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {formData.payments.map((p: any, idx: number) => (
                    <div key={idx} className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phase {p.payment_number}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${p.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {p.status}
                        </span>
                      </div>
                      <p className="text-xl font-black text-slate-900">{formatCurrency(p.amount, formData.currency)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Costs */}
            <div className={SECTION_CONTAINER}>
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[14px] bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                    <ICONS.Finances />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#0F172A]">Operational Overheads</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider italic">Third-party assets & contingencies</p>
                  </div>
                </div>
                <button type="button" onClick={() => setFormData({ ...formData, additional_costs: [...formData.additional_costs, { cost_type: 'Third Party Cost', description: '', amount: 0 }] })} className="px-5 py-2.5 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-500 hover:text-white transition-all shadow-sm active:scale-95">Add Expense</button>
              </div>

              <div className="space-y-4">
                {formData.additional_costs.map((cost: any, idx: number) => (
                  <div key={idx} className="p-8 bg-slate-50/50 rounded-[28px] border border-slate-100/80 flex flex-col md:flex-row gap-6 md:items-end group hover:bg-white hover:border-amber-100 transition-all duration-300">
                    <div className="w-full md:w-64 space-y-1.5">
                      <label className={LABEL_CLASSES}>Ledger Type</label>
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
                        <option value="Third Party Cost">Critical Resource</option>
                        <option value="Revision Cost">Service Fee</option>
                        <option value="Custom">Other Expense</option>
                      </select>
                    </div>
                    <div className="flex-[2] space-y-1.5">
                      <label className={LABEL_CLASSES}>Journal Description</label>
                      <input
                        required
                        placeholder="Ex: API Gateway Subscription"
                        className={INPUT_CLASSES}
                        value={cost.description}
                        onChange={e => {
                          const newCosts = [...formData.additional_costs];
                          newCosts[idx] = { ...newCosts[idx], description: e.target.value };
                          setFormData({ ...formData, additional_costs: newCosts });
                        }}
                      />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <label className={LABEL_CLASSES}>Fiscal Amount</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        className={`${INPUT_CLASSES} text-right`}
                        value={cost.amount || ''}
                        onChange={e => {
                          const newCosts = [...formData.additional_costs];
                          newCosts[idx] = { ...newCosts[idx], amount: parseFloat(e.target.value) || 0 };
                          setFormData({ ...formData, additional_costs: newCosts });
                        }}
                        onWheel={(e) => (e.target as HTMLElement).blur()}
                      />
                    </div>
                    <button type="button" onClick={() => {
                      const newCosts = [...formData.additional_costs];
                      newCosts.splice(idx, 1);
                      setFormData({ ...formData, additional_costs: newCosts });
                    }} className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all h-12 w-12 flex items-center justify-center shadow-sm">
                      <ICONS.Delete />
                    </button>
                  </div>
                ))}
                {formData.additional_costs.length === 0 && (
                  <div className="py-12 border-2 border-dashed border-slate-100 rounded-[32px] flex flex-col items-center justify-center text-slate-400">
                    <div className="p-3 bg-slate-50 rounded-full mb-3"><ICONS.Finances /></div>
                    <p className="font-bold text-sm">No additional fiscal entries found.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Project Notes */}
            <div className={SECTION_CONTAINER}>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-[14px] bg-slate-900 flex items-center justify-center text-white">
                  <ICONS.Info />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">Project Additional Details</h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider italic">Strategic details & context</p>
                </div>
              </div>
              <textarea
                className={`${INPUT_CLASSES} h-40 py-6 resize-none bg-slate-50/30 border-slate-100 italic font-medium`}
                placeholder="Secure project notes and additional context here..."
                value={formData.notes || ''}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-6 pt-10 border-t border-slate-100 bg-white sticky bottom-0 z-[110] pb-2 sm:pb-0 font-sans">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-10 py-4 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-rose-600 transition-all"
              >
                Abort Changes
              </button>
              <button
                type="submit"
                disabled={isSaving || !isValid}
                className={`${PRIMARY_BUTTON_CLASSES} min-w-[240px] ${isSaving || !isValid ? 'opacity-50 cursor-not-allowed shadow-none' : ''}`}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Encrypting Data...
                  </>
                ) : (
                  initialData ? 'Update Matrix' : 'Initialize Project'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const FinancialWidget = ({ label, value, color, sub }: any) => {
  const colors: any = {
    emerald: "bg-[#ECFDF5] text-[#059669] border-[#D1FAE5]",
    blue: "bg-[#EFF6FF] text-[#2563EB] border-[#DBEAFE]",
    amber: "bg-[#FFFBEB] text-[#D97706] border-[#FEF3C7]",
  };
  return (
    <div className={`p-8 rounded-[36px] border shadow-sm group relative overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-1 ${colors[color]}`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 blur-3xl -translate-x-4 -translate-y-12 group-hover:translate-x-4 transition-transform duration-1000" />
      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-75 mb-3 leading-none">{label}</p>
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <p className="text-2xl sm:text-3xl font-black tracking-tighter leading-tight break-all">{value}</p>
      </div>
      <div className="flex items-center gap-2 mt-4">
        <div className="w-1.5 h-1.5 rounded-full bg-current opacity-30 animate-pulse" />
        <p className="text-[11px] font-black opacity-60 uppercase tracking-widest">{sub}</p>
      </div>
    </div>
  );
};

export default ProjectModal;
