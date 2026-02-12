
import React, { useMemo, useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer // Fixed import
} from 'recharts';
import { Project, Client, Notification } from '../types';
import {
  formatCurrency,
  calculateGrandTotal,
  calculatePaidAmount,
  calculateDeveloperTotalPayout,
  calculateTotalAdditionalCosts,
  downloadCSV
} from '../utils';
import { ICONS } from '../constants';

interface DashboardProps {
  projects: Project[];
  clients: Client[];
  notifications: Notification[];
  onAddProject: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ projects, clients, notifications, onAddProject }) => {
  const [metrics, setMetrics] = useState({
    totalPotential: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    contributorsCount: 0,
    currency: 'AUD'
  });

  const [loading, setLoading] = useState(true);

  // Fetch metrics from backend
  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard.php');
      const data = await res.json();
      setMetrics({
        totalPotential: data.totalPotential || 0,
        totalRevenue: data.totalRevenue || 0,
        totalExpenses: data.totalExpenses || 0,
        netProfit: data.netProfit || 0,
        profitMargin: data.profitMargin || 0,
        contributorsCount: data.activeContributors || 0,
        currency: data.currency || 'USD'
      });
    } catch (error) {
      console.error("Failed to fetch dashboard metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const handleCurrencyChange = () => fetchDashboard();
    window.addEventListener('stratis-currency-change', handleCurrencyChange);
    return () => window.removeEventListener('stratis-currency-change', handleCurrencyChange);
  }, []);

  // Transactions Logic
  const transactions = useMemo(() => {
    const list: any[] = [];
    projects.forEach(p => {
      // Income from paid payments
      p.payments?.forEach((m) => {
        if (m.status === 'Paid') {
          list.push({
            id: `TRX-IN-${m.id}`,
            projectName: p.name,
            type: 'INCOME',
            category: `Payment ${m.payment_number}`,
            amount: m.amount,
            date: m.paid_date || p.start_date,
          });
        }
      });
      // Expenses (Mocked as 60% of dev cost at start, 40% at end? or just flat)
      // Since we don't track dev payments status, let's just show Project Start expense
      if (p.developers && p.developers.length > 0) {
        const totalDevCost = calculateDeveloperTotalPayout(p.developers);
        // Assume 40% advance paid on start
        list.push({
          id: `TRX-OUT-${p.id}-Start`,
          projectName: p.name,
          type: 'EXPENSE',
          category: 'Dev Advance',
          amount: totalDevCost * 0.4,
          date: p.start_date
        });
      }
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [projects]);

  // Mock Chart Data
  const chartData = [
    { name: 'MAY', revenue: 32000, expenses: 14000 },
    { name: 'JUN', revenue: 28000, expenses: 16000 },
    { name: 'JUL', revenue: 35000, expenses: 18000 },
    { name: 'AUG', revenue: 42000, expenses: 20000 },
    { name: 'SEP', revenue: 31000, expenses: 17000 },
    { name: 'OCT', revenue: 45000, expenses: 15000 },
  ];

  const handleMasterExport = () => {
    const exportData = projects.map(p => {
      const client = clients.find(c => c.id === p.client_id);
      const totalDevCost = calculateDeveloperTotalPayout(p.developers || []);
      const otherCosts = calculateTotalAdditionalCosts(p.additional_costs || []);
      const profit = calculateGrandTotal(p) - (totalDevCost + otherCosts);

      return {
        'Project ID': p.id,
        'Project Name': p.name,
        'Client': client?.company_name || 'Private Partner',
        'Status': p.status,
        'Total Contract Value': calculateGrandTotal(p),
        'Amount Paid by Client': calculatePaidAmount(p),
        'Total Developer Costs': totalDevCost,
        'Additional Costs': otherCosts,
        'Net Project Profit': profit,
        'Start Date': p.start_date,
        'End Date': p.end_date,
        'Currency': p.currency
      };
    });

    downloadCSV(exportData, 'Stratis_Project_Report');
  };

  return (
    <div className="space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[32px] font-black text-[#0F172A] tracking-tighter">Main Dashboard</h1>
          <p className="text-[#64748B] text-sm sm:text-base mt-1 font-medium italic">Enterprise-grade financial and operational overview.</p>
        </div>
        <button
          onClick={handleMasterExport}
          className="flex items-center justify-center h-[60px] px-10 bg-[#2563EB] text-white rounded-[20px] text-[13px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
        >
          <ICONS.Download />
          <span className="ml-3">Master Export</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <KPICard
          label="Total Revenue"
          value={formatCurrency(metrics.totalRevenue, metrics.currency)}
          growth={`Total Pot: ${formatCurrency(metrics.totalPotential, metrics.currency)}`}
          footer={<div className="h-1.5 w-full bg-[#E2E8F0] rounded-full overflow-hidden mt-6"><div className="h-full bg-[#2563EB]" style={{ width: '72%' }} /></div>}
        />
        <KPICard
          label="Operational Expense"
          value={formatCurrency(metrics.totalExpenses, metrics.currency)}
          subValue={`${metrics.contributorsCount} engineers assigned`}
          icon={<ICONS.Teams />}
        />
        <KPICard
          label="Net Profit"
          value={formatCurrency(metrics.netProfit, metrics.currency)}
          valueColor="text-[#2563EB]"
          growth={`↗ ${metrics.profitMargin.toFixed(1)}% Margin`}
          growthColor="text-[#10B981]"
        />
      </div>

      {/* Notifications Section */}
      <div className="bg-white p-6 sm:p-10 rounded-[24px] sm:rounded-[40px] border border-[#F1F5F9] shadow-sm overflow-hidden">
        <h3 className="text-lg font-black text-[#0F172A] uppercase tracking-widest mb-6">Important Notifications</h3>
        <div className="space-y-4">
          {notifications.length > 0 ? (
            notifications.slice(0, 5).map(note => (
              <div key={note.id} className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-xl flex items-start gap-4">
                <div className="p-2 bg-yellow-100 rounded-full text-yellow-600">
                  <ICONS.Info />
                </div>
                <div>
                  <h4 className="font-bold text-[#0F172A]">{note.type}</h4>
                  <p className="text-sm text-slate-600 mt-1">{note.message}</p>
                  <span className="text-xs text-slate-400 mt-2 block">{new Date(note.sent_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-400 italic">No new notifications.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
        <div className="bg-white p-6 sm:p-10 rounded-[24px] sm:rounded-[40px] border border-[#F1F5F9] shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <h3 className="text-lg font-black text-[#0F172A] uppercase tracking-widest">Financial Velocity</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                <span className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">Income</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#F43F5E]" />
                <span className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">Burn</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} tickFormatter={(value) => `${value / 1000}k`} />
                <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)' }} />
                <Bar dataKey="revenue" fill="#2563EB" radius={[6, 6, 0, 0]} barSize={24} />
                <Bar dataKey="expenses" fill="#F43F5E" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-[24px] sm:rounded-[40px] border border-[#F1F5F9] shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 sm:px-10 py-8 flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-black text-[#0F172A] uppercase tracking-widest">Recent Ledgers</h2>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left min-w-[500px]">
              <thead className="bg-[#F8FAFC] text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] border-y border-[#F1F5F9]">
                <tr>
                  <th className="px-6 sm:px-10 py-5">CONTEXT</th>
                  <th className="px-6 sm:px-10 py-5">TYPE</th>
                  <th className="px-6 sm:px-10 py-5">VALUE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {transactions.map((trx, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 sm:px-10 py-6">
                      <p className="text-sm font-bold text-[#0F172A]">{trx.projectName}</p>
                      <p className="text-[10px] font-medium text-[#94A3B8] mt-0.5">{trx.category}</p>
                    </td>
                    <td className="px-6 sm:px-10 py-6">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase ${trx.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                        {trx.type}
                      </span>
                    </td>
                    <td className={`px-6 sm:px-10 py-6 text-sm font-black ${trx.type === 'INCOME' ? 'text-[#0F172A]' : 'text-[#F43F5E]'}`}>
                      {trx.type === 'EXPENSE' ? '-' : '+'}{formatCurrency(trx.amount, metrics.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ label, value, valueColor = "text-[#0F172A]", growth, growthColor = "text-[#10B981]", subValue, icon, footer }: any) => (
  <div className="bg-white p-6 sm:p-10 rounded-[24px] sm:rounded-[40px] border border-[#F1F5F9] shadow-sm flex flex-col justify-between hover:border-blue-100 transition-all duration-500 group">
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-[11px] font-black text-[#94A3B8] uppercase tracking-[0.2em] group-hover:text-[#2563EB] transition-colors">{label}</p>
        {icon && <div className="text-[#94A3B8] group-hover:scale-110 transition-transform duration-500">{icon}</div>}
      </div>
      <div className="space-y-2">
        <p className={`text-2xl sm:text-4xl font-black ${valueColor} tracking-tighter leading-none`}>{value}</p>
        {growth && <span className={`text-[11px] font-black ${growthColor} uppercase tracking-widest`}>{growth}</span>}
        {subValue && <p className="text-xs font-bold text-[#94A3B8] italic">{subValue}</p>}
      </div>
    </div>
    {footer}
  </div>
);

export default Dashboard;
