
import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
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

const Dashboard: React.FC<DashboardProps> = ({ projects, clients }) => {
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let totalDevCosts = 0;
    let totalOtherCosts = 0;
    let activeContributors = new Set();
    let totalPotential = 0;

    projects.forEach(p => {
      totalPotential += calculateGrandTotal(p);
      totalRevenue += calculatePaidAmount(p);
      totalDevCosts += calculateDeveloperTotalPayout(p.squad || []);
      totalOtherCosts += calculateTotalAdditionalCosts(p.additionalCosts || []);
      p.squad?.forEach(s => activeContributors.add(s.developerId));
    });

    const netProfit = totalRevenue - (totalDevCosts + totalOtherCosts);
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      totalPotential,
      totalRevenue,
      totalDevCosts,
      totalOtherCosts,
      netProfit,
      profitMargin,
      contributorsCount: activeContributors.size
    };
  }, [projects]);

  const chartData = [
    { name: 'MAY', revenue: 32000, expenses: 14000 },
    { name: 'JUN', revenue: 28000, expenses: 16000 },
    { name: 'JUL', revenue: 35000, expenses: 18000 },
    { name: 'AUG', revenue: 42000, expenses: 20000 },
    { name: 'SEP', revenue: 31000, expenses: 17000 },
    { name: 'OCT', revenue: 45000, expenses: 15000 },
  ];

  const transactions = useMemo(() => {
    const list: any[] = [];
    projects.forEach(p => {
      p.milestones.forEach((m) => {
        if (m.isPaid) {
          list.push({
            id: `TRX-${Math.floor(Math.random() * 90000) + 10000}`,
            projectName: p.name,
            type: 'INCOME',
            category: m.label,
            amount: m.amount,
            date: p.startDate,
          });
        }
      });
      p.squad?.forEach(s => {
        if (s.isAdvancePaid) {
          list.push({
            id: `TRX-${Math.floor(Math.random() * 90000) + 10000}`,
            projectName: p.name,
            type: 'EXPENSE',
            category: 'Dev Advance',
            amount: s.totalCost * 0.4,
            date: p.startDate,
          });
        }
      });
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [projects]);

  const handleMasterExport = () => {
    const exportData = projects.map(p => {
      const client = clients.find(c => c.id === p.clientId);
      const totalDevCost = calculateDeveloperTotalPayout(p.squad);
      const otherCosts = calculateTotalAdditionalCosts(p.additionalCosts);
      const profit = calculateGrandTotal(p) - (totalDevCost + otherCosts);
      
      return {
        'Project ID': p.id,
        'Project Name': p.name,
        'Client': client?.companyName || 'Private Partner',
        'Status': p.status,
        'Priority': p.priority,
        'Total Contract Value': calculateGrandTotal(p),
        'Amount Paid by Client': calculatePaidAmount(p),
        'Total Developer Costs': totalDevCost,
        'Additional Costs': otherCosts,
        'Net Project Profit': profit,
        'Start Date': p.startDate,
        'End Date': p.endDate,
        'Currency': p.currency
      };
    });

    downloadCSV(exportData, 'Stratis_Project_Report');
  };

  return (
    <div className="space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[32px] font-black text-[#0F172A] tracking-tighter">Strategic Intelligence</h1>
          <p className="text-[#64748B] text-sm sm:text-base mt-1 font-medium italic">Enterprise-grade financial and operational overview.</p>
        </div>
        <button 
          onClick={handleMasterExport}
          className="flex items-center justify-center h-[60px] px-10 bg-[#2563EB] text-white rounded-[20px] text-[13px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
        >
          <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          Master Export
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <KPICard 
          label="Total Revenue"
          value={formatCurrency(metrics.totalRevenue)}
          growth={`Total Pot: ${formatCurrency(metrics.totalPotential)}`}
          footer={<div className="h-1.5 w-full bg-[#E2E8F0] rounded-full overflow-hidden mt-6"><div className="h-full bg-[#2563EB]" style={{ width: '72%' }} /></div>}
        />
        <KPICard 
          label="Operational Expense"
          value={formatCurrency(metrics.totalDevCosts + metrics.totalOtherCosts)}
          subValue={`${metrics.contributorsCount} engineers assigned`}
          icon={<ICONS.Teams />}
        />
        <KPICard 
          label="Net Profit"
          value={formatCurrency(metrics.netProfit)}
          valueColor="text-[#2563EB]"
          growth={`↗ ${metrics.profitMargin.toFixed(1)}% Margin`}
          growthColor="text-[#10B981]"
        />
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
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase ${
                        trx.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {trx.type}
                      </span>
                    </td>
                    <td className={`px-6 sm:px-10 py-6 text-sm font-black ${trx.type === 'INCOME' ? 'text-[#0F172A]' : 'text-[#F43F5E]'}`}>
                      {trx.type === 'EXPENSE' ? '-' : '+'}{formatCurrency(trx.amount)}
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
