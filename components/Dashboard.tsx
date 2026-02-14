
import React, { useMemo, useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
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
  onAddClient: () => void;
  onViewTeams: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ projects, clients, notifications, onAddProject, onAddClient, onViewTeams }) => {
  const [metrics, setMetrics] = useState<any>({
    totalRevenue: 0,
    totalExpenses: 0,
    totalProfit: 0,
    totalDevCost: 0,
    totalAddCost: 0,
    totalProjects: 0,
    totalPaymentsReceived: 0,
    totalPendingPayments: 0,
    overdueUnpaidTotal: 0,
    overdueUnpaidCount: 0,
    currency: 'USD'
  });

  const [loading, setLoading] = useState(true);
  const [revenueVsExpenses, setRevenueVsExpenses] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<any>({});

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard.php');
      const data = await res.json();
      setMetrics({
        totalRevenue: data.totalRevenue || 0,
        totalExpenses: data.totalExpenses || 0,
        totalProfit: data.totalProfit || 0,
        totalDevCost: data.totalDevCost || 0,
        totalAddCost: data.totalAddCost || 0,
        totalProjects: data.totalProjects || 0,
        totalPaymentsReceived: data.totalPaymentsReceived || 0,
        totalPendingPayments: data.totalPendingPayments || 0,
        overdueUnpaidTotal: data.overdueUnpaidTotal || 0,
        overdueUnpaidCount: data.overdueUnpaidCount || 0,
        currency: data.currency || 'USD'
      });

      setRevenueVsExpenses(Array.isArray(data.revenueVsExpenses) ? data.revenueVsExpenses : []);
      setMonthlyData(Array.isArray(data.monthly) ? data.monthly.map((m: any) => ({ name: m.label, revenue: m.revenue, expenses: m.expenses, profit: m.profit })) : []);
      setStatusDistribution(data.statusDistribution || {});
    } catch (error) {
      console.error('Failed to fetch dashboard metrics:', error);
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

  const transactions = useMemo(() => {
    const list: any[] = [];
    projects.forEach((p) => {
      p.payments?.forEach((m) => {
        if (m.status === 'Paid') {
          list.push({ id: `TRX-IN-${m.id}`, projectName: p.name, type: 'INCOME', category: `Payment ${m.payment_number || ''}`, amount: m.amount, date: m.paid_date || p.start_date });
        }
      });
    });
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);
  }, [projects]);

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

  const chartData = revenueVsExpenses.map(r => ({ name: r.name || r.project_name || `#${r.id}`, revenue: Number(r.revenue || 0), expenses: Number(r.expenses || 0) }));

  const pieData = Object.entries(statusDistribution).map(([k, v]) => ({ name: k, value: v }));

  return (
    <div className="space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-4">
        <div>
          <h1 className="text-3xl sm:text-[38px] font-black text-[#0F172A] tracking-tight leading-none">Dashboard</h1>
          <p className="text-[#64748B] text-sm sm:text-[15px] mt-3 font-medium opacity-80 italic">Enterprise dynamic overview and management shortcuts.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 p-1.5 bg-slate-100/50 rounded-2xl border border-slate-200/60 transition-all hover:bg-slate-100">
            <button
              onClick={onAddProject}
              className="flex items-center gap-2.5 px-6 py-3 bg-blue-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all"
            >
              <ICONS.Add />
              <span>Project</span>
            </button>
            <button
              onClick={onAddClient}
              className="flex items-center gap-2.5 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-[11px] font-black uppercase tracking-widest hover:border-slate-300 hover:bg-white hover:shadow-sm transition-all"
            >
              <ICONS.Clients />
              <span>Partner</span>
            </button>
            <button
              onClick={onViewTeams}
              className="flex items-center gap-2.5 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-[11px] font-black uppercase tracking-widest hover:border-slate-300 hover:bg-white hover:shadow-sm transition-all"
            >
              <ICONS.Teams />
              <span>add new Dev</span>
            </button>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
        <KPICard label="Total Profit" value={formatCurrency(metrics.totalProfit, metrics.currency)} valueColor={metrics.totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'} />
        <KPICard label="Active Projects" value={String(metrics.totalProjects && statusDistribution['Active'] ? statusDistribution['Active'] : (metrics.totalProjects || 0))} />
        <KPICard label="Completed Projects" value={String(statusDistribution['Completed'] || 0)} />
        <KPICard label="Total Revenue" value={formatCurrency(metrics.totalRevenue, metrics.currency)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
        <div className="bg-white p-6 sm:p-10 rounded-[24px] sm:rounded-[40px] border border-[#F1F5F9] shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <h3 className="text-lg font-black text-[#0F172A] uppercase tracking-widest">Revenue vs Expenses (Recent)</h3>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} tickFormatter={(value) => `${value / 1000}k`} />
                <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '16px', border: 'none' }} />
                <Bar dataKey="revenue" fill="#2563EB" radius={[6, 6, 0, 0]} barSize={18} />
                <Bar dataKey="expenses" fill="#F43F5E" radius={[6, 6, 0, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 sm:p-10 rounded-[24px] sm:rounded-[40px] border border-[#F1F5F9] shadow-sm">
          <h3 className="text-lg font-black text-[#0F172A] uppercase tracking-widest mb-6">Project Status Distribution</h3>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={90} innerRadius={40} label>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={["#2563EB", "#10B981", "#F59E0B", "#F43F5E"][i % 4]} />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
        <div className="bg-white p-6 sm:p-10 rounded-[24px] sm:rounded-[40px] border border-[#F1F5F9] shadow-sm">
          <h3 className="text-lg font-black text-[#0F172A] uppercase tracking-widest mb-6">Monthly Profit Growth</h3>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fill: '#94A3B8' }} />
                <YAxis tickFormatter={(v) => (v >= 1000 ? (v / 1000) + 'k' : v)} tick={{ fill: '#94A3B8' }} />
                <Tooltip />
                <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
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
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase ${trx.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
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
  <div className="bg-white p-6 sm:p-8 rounded-[16px] sm:rounded-[20px] border border-[#F1F5F9] shadow-sm flex flex-col justify-between hover:border-blue-100 transition-all duration-500 group">
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-black text-[#94A3B8] uppercase tracking-[0.2em] group-hover:text-[#2563EB] transition-colors">{label}</p>
        {icon && <div className="text-[#94A3B8] group-hover:scale-110 transition-transform duration-500">{icon}</div>}
      </div>
      <div className="space-y-2">
        <p className={`text-2xl sm:text-3xl font-black ${valueColor} tracking-tighter leading-none`}>{value}</p>
        {growth && <span className={`text-[11px] font-black ${growthColor} uppercase tracking-widest`}>{growth}</span>}
        {subValue && <p className="text-xs font-bold text-[#94A3B8] italic">{subValue}</p>}
      </div>
    </div>
    {footer}
  </div>
);

export default Dashboard;
