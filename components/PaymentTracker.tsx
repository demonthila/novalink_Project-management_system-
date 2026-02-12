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
        <div className="bg-white p-6 sm:p-10 rounded-[24px] sm:rounded-[40px] border border-[#F1F5F9] shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <ICONS.Finances />
                    <h3 className="text-lg font-black text-[#0F172A] uppercase tracking-widest">Payment Schedule & Reminders</h3>
                </div>
                <div className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                    📅 Each payment has its own due date
                </div>
            </div>

            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-bold rounded-lg">{error}</div>}

            <div className="space-y-4">
                {milestones.map((payment, index) => {
                    const status = getPaymentStatus(payment);
                    const isUpdating = updatingId === payment.id;
                    const isEditingDueDate = editingDueDateId === payment.id;
                    const isPaid = payment.status === 'Paid';

                    return (
                        <div
                            key={payment.id}
                            className={`p-6 rounded-2xl border-2 ${status.color} transition-all hover:shadow-md`}
                        >
                            <div className="flex items-start gap-4">
                                {/* Checkbox */}
                                <div className="flex items-center pt-1">
                                    <label className="relative flex items-center cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={isPaid}
                                            onChange={() => handleCheckboxChange(payment.id, payment.status)}
                                            disabled={isUpdating}
                                            className="sr-only peer"
                                        />
                                        <div className={`
                      w-7 h-7 border-3 rounded-lg transition-all
                      ${isPaid
                                                ? 'bg-emerald-500 border-emerald-500'
                                                : 'bg-white border-slate-300 group-hover:border-emerald-400'
                                            }
                      ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      flex items-center justify-center
                    `}>
                                            {isPaid && (
                                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                            {isUpdating && !isPaid && (
                                                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                                            )}
                                        </div>
                                    </label>
                                </div>

                                {/* Payment Details */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-2xl">{status.icon}</span>
                                        <h4 className="text-sm font-black text-[#0F172A] uppercase tracking-wide">
                                            Payment {index + 1}
                                        </h4>
                                        <span className={`ml-auto px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${status.color} ${status.textColor}`}>
                                            {status.label}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment Amount</p>
                                            <p className="text-lg font-black text-[#0F172A]">{formatCurrency(payment.amount, currency)}</p>
                                        </div>

                                        <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">
                                                    📅 Payment Due Date
                                                </p>
                                                {!isEditingDueDate && (
                                                    <button
                                                        onClick={() => {
                                                            setEditingDueDateId(payment.id);
                                                            setTempDueDate(payment.due_date);
                                                        }}
                                                        className="px-2 py-1 bg-blue-500 text-white text-[9px] font-bold rounded hover:bg-blue-600 transition-all flex items-center gap-1"
                                                        title="Change due date"
                                                    >
                                                        EDIT
                                                    </button>
                                                )}
                                            </div>

                                            {isEditingDueDate ? (
                                                <div className="space-y-2">
                                                    <input
                                                        type="date"
                                                        value={tempDueDate}
                                                        onChange={(e) => setTempDueDate(e.target.value)}
                                                        className="w-full text-sm font-bold text-slate-700 border-2 border-blue-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleDueDateUpdate(payment.id, tempDueDate)}
                                                            className="flex-1 px-3 py-2 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-all"
                                                        >
                                                            ✓ Save Date
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingDueDateId(null)}
                                                            className="flex-1 px-3 py-2 bg-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-400 transition-all"
                                                        >
                                                            ✕ Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-base font-black text-blue-700">
                                                    {new Date(payment.due_date).toLocaleDateString('en-US', {
                                                        weekday: 'short',
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </p>
                                            )}

                                            {!isPaid && !isEditingDueDate && (
                                                <p className="text-[9px] font-bold text-blue-600 mt-2">
                                                    🔔 Reminder: 3 days before
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {isPaid && payment.paid_date && (
                                        <div className="mt-3 pt-3 border-t-2 border-emerald-200">
                                            <p className="text-xs font-bold text-emerald-600 flex items-center gap-2">
                                                Payment received on {new Date(payment.paid_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Received (Revenue)</p>
                    <p className="text-xl font-black text-emerald-700">
                        {formatCurrency(totalRevenue, currency)}
                    </p>
                </div>

                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Pending</p>
                    <p className="text-xl font-black text-amber-700">
                        {formatCurrency(totalPending, currency)}
                    </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Total Expected</p>
                    <p className="text-xl font-black text-blue-700">
                        {formatCurrency(totalExpected, currency)}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PaymentTracker;
