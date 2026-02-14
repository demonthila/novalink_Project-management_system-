import React, { useState } from 'react';
import { formatCurrency } from '../utils';
import { ICONS } from '../constants';
import { Payment } from '../types';
import { updatePayment } from '../services/api';

interface PaymentTrackerProps {
    projectId: number;
    projectName: string;
    milestones: Payment[]; // Renamed internally to match prop usage context, but Type is Payment
    currency: string;
    onPaymentUpdate: (milestoneId: number, isPaid: boolean, paidDate: string) => void;
}

const PaymentTracker: React.FC<PaymentTrackerProps> = ({
    projectId,
    projectName,
    milestones,
    currency,
    onPaymentUpdate
}) => {
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [editingDueDateId, setEditingDueDateId] = useState<number | null>(null);
    const [tempDueDate, setTempDueDate] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const handleCheckboxChange = async (paymentId: number, currentStatus: string) => {
        setUpdatingId(paymentId);
        setError(null);

        const newStatus = currentStatus === 'Paid' ? 'Unpaid' : 'Paid';
        // If becoming Paid, set date to today. If Unpaid, null (backend handles details via 'status')
        const paidDate = newStatus === 'Paid' ? new Date().toISOString().split('T')[0] : null;

        try {
            const data = await updatePayment(paymentId, { status: newStatus, paid_date: paidDate });

            if (data.success) {
                onPaymentUpdate(paymentId, newStatus === 'Paid', paidDate || '');
            } else {
                setError('Failed to update payment status');
            }
        } catch (error) {
            console.error('Payment update error:', error);
            setError('Error updating payment status');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDueDateUpdate = async (paymentId: number, newDueDate: string) => {
        try {
            setError(null);
            const data = await updatePayment(paymentId, { due_date: newDueDate });

            if (data.success) {
                // We rely on parent to re-fetch or optimistically update. 
                // Since this component uses props, we should callback or reload.
                // For now, let's call onPaymentUpdate to trigger refresh if parent supports generic updates, 
                // but onPaymentUpdate signature is specific to paid status.
                // Ideally, we should have onRefresh() prop.
                window.location.reload();
            } else {
                setError('Failed to update due date');
            }
        } catch (error) {
            console.error('Due date update error:', error);
            setError('Error updating due date');
        } finally {
            setEditingDueDateId(null);
        }
    };

    const getPaymentStatus = (payment: Payment) => {
        if (payment.status === 'Paid') {
            return {
                label: 'Paid',
                color: 'bg-emerald-50 border-emerald-200',
                textColor: 'text-emerald-600',
                icon: '✓'
            };
        }

        const dueDate = new Date(payment.due_date);
        const today = new Date();
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilDue < 0) {
            return {
                label: 'Overdue',
                color: 'bg-rose-50 border-rose-200',
                textColor: 'text-rose-600',
                icon: '!'
            };
        } else if (daysUntilDue <= 3) {
            return {
                label: 'Due Soon',
                color: 'bg-amber-50 border-amber-200',
                textColor: 'text-amber-600',
                icon: '⚠'
            };
        } else {
            return {
                label: 'Pending',
                color: 'bg-slate-50 border-slate-200',
                textColor: 'text-slate-600',
                icon: '○'
            };
        }
    };

    // Calculate profit based on paid milestones
    const totalRevenue = milestones.filter(m => m.status === 'Paid').reduce((sum, m) => sum + Number(m.amount), 0);
    const totalPending = milestones.filter(m => m.status !== 'Paid').reduce((sum, m) => sum + Number(m.amount), 0);
    const totalExpected = milestones.reduce((sum, m) => sum + Number(m.amount), 0);

    return (
        <div className="bg-white p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between pb-6 border-b border-slate-50">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <ICONS.Finances />
                    </div>
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 leading-none">Financial Stream</h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Project Invoice Lifecycle</p>
                    </div>
                </div>
            </div>

            {error && <div className="p-4 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-rose-100">{error}</div>}

            <div className="space-y-4">
                {milestones.map((payment, index) => {
                    const status = getPaymentStatus(payment);
                    const isUpdating = updatingId === payment.id;
                    const isEditingDueDate = editingDueDateId === payment.id;
                    const isPaid = payment.status === 'Paid';

                    return (
                        <div
                            key={payment.id}
                            className={`p-6 rounded-[24px] border border-slate-100 transition-all group ${isPaid ? 'bg-emerald-50/20' : 'bg-white hover:border-blue-100 hover:shadow-lg hover:shadow-slate-200/50'}`}
                        >
                            <div className="flex items-start gap-6">
                                {/* Checkbox Node */}
                                <div className="flex items-center pt-1">
                                    <label className="relative flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isPaid}
                                            onChange={() => handleCheckboxChange(payment.id, payment.status)}
                                            disabled={isUpdating}
                                            className="sr-only peer"
                                        />
                                        <div className={`
                                            w-8 h-8 rounded-xl border-2 transition-all flex items-center justify-center
                                            ${isPaid
                                                ? 'bg-emerald-600 border-emerald-600 shadow-lg shadow-emerald-500/20'
                                                : 'bg-white border-slate-200'
                                            }
                                            ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-emerald-400'}
                                        `}>
                                            {isPaid ? (
                                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : isUpdating ? (
                                                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                                            ) : null}
                                        </div>
                                    </label>
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Milestone {index + 1}</p>
                                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${isPaid ? 'bg-emerald-100 text-emerald-600' :
                                                    status.label === 'Overdue' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                {status.label}
                                            </span>
                                        </div>
                                        <p className="text-sm font-black text-slate-900 tracking-tight">{formatCurrency(payment.amount, currency)}</p>
                                    </div>

                                    <div className="p-5 bg-white border border-slate-50 rounded-2xl flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Schedule Node</p>
                                            {isEditingDueDate ? (
                                                <div className="flex items-center gap-2 mt-2">
                                                    <input
                                                        type="date"
                                                        value={tempDueDate}
                                                        onChange={(e) => setTempDueDate(e.target.value)}
                                                        className="text-[11px] font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500"
                                                    />
                                                    <button onClick={() => handleDueDateUpdate(payment.id, tempDueDate)} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"><ICONS.Check /></button>
                                                    <button onClick={() => setEditingDueDateId(null)} className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-slate-200 transition-colors"><ICONS.Delete /></button>
                                                </div>
                                            ) : (
                                                <p className={`text-xs font-black tracking-tight ${status.label === 'Overdue' ? 'text-rose-500' : 'text-slate-700'}`}>
                                                    {new Date(payment.due_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            )}
                                        </div>
                                        {!isEditingDueDate && !isPaid && (
                                            <button
                                                onClick={() => { setEditingDueDateId(payment.id); setTempDueDate(payment.due_date); }}
                                                className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors"
                                            >
                                                Reschedule
                                            </button>
                                        )}
                                    </div>

                                    {isPaid && payment.paid_date && (
                                        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-100/50">
                                            <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                                                Archive Log: Received {new Date(payment.paid_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-3 gap-6 pt-4">
                <FinancialSummaryNode label="Received" value={formatCurrency(totalRevenue, currency)} color="emerald" />
                <FinancialSummaryNode label="Pending" value={formatCurrency(totalPending, currency)} color="amber" />
                <FinancialSummaryNode label="Projected" value={formatCurrency(totalExpected, currency)} color="blue" />
            </div>
        </div>
    );
};

const FinancialSummaryNode = ({ label, value, color }: any) => {
    const colors: any = {
        emerald: "bg-emerald-50 text-emerald-600",
        amber: "bg-amber-50 text-amber-600",
        blue: "bg-blue-50 text-blue-600",
    };
    return (
        <div className={`p-4 rounded-2xl border border-transparent hover:shadow-sm transition-all ${colors[color]}`}>
            <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">{label}</p>
            <p className="text-sm font-black tracking-tight">{value}</p>
        </div>
    );
};

export default PaymentTracker;
