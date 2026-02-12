
import { Project, Milestone, AdditionalCost, DeveloperAssignment } from './types';

export const formatCurrency = (amount: number, currency: string = 'USD') => {
  const matches = (currency || 'USD').match(/[A-Z]{3}/i);
  const isoCode = (matches ? matches[0] : 'USD').toUpperCase();

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: isoCode,
      minimumFractionDigits: 2,
    }).format(amount || 0);
  } catch (e) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  }
};

export const calculateTotalAdditionalCosts = (costs: AdditionalCost[]) => {
  return (costs || []).reduce((sum, cost) => sum + (cost.amount || 0), 0);
};

export const calculateGrandTotal = (project: Project) => {
  if (!project) return 0;
  return (project.baseProjectAmount || 0) + calculateTotalAdditionalCosts(project.additionalCosts);
};

export const calculatePaidAmount = (project: Project) => {
  if (!project || !project.milestones) return 0;
  return project.milestones
    .filter(m => m.isPaid)
    .reduce((sum, m) => sum + (m.amount || 0), 0);
};

export const calculateDeveloperTotalPayout = (squad: DeveloperAssignment[]) => {
  return (squad || []).reduce((sum, dev) => sum + (dev.totalCost || 0), 0);
};

export const calculateProjectProfit = (project: Project) => {
  if (!project) return 0;
  const revenue = calculateGrandTotal(project);
  const devExpenses = calculateDeveloperTotalPayout(project.squad || []);
  const otherExpenses = calculateTotalAdditionalCosts(project.additionalCosts) * 0.2; // Only 20% is actual expense, 80% is profit
  return revenue - (devExpenses + otherExpenses);
};

export const generateInvoiceNumber = () => {
  const prefix = "NL";
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${date}-${random}`;
};

export const getMilestonesByProjectType = (type: string, amount: number): Milestone[] => {
  const safeAmount = amount || 0;
  switch (type) {
    case '40-30-30':
    case '30-30-40': // Legacy support but defaulting to 40-30-30
      return [
        { label: 'Upfront Payment (40%)', amount: Math.round(safeAmount * 0.4), isPaid: false },
        { label: 'Middle Payment (30%)', amount: Math.round(safeAmount * 0.3), isPaid: false },
        { label: 'Final Payment (30%)', amount: Math.round(safeAmount * 0.3), isPaid: false },
      ];
    case 'Full Payment Upfront':
      return [
        { label: 'Full Payment (100%)', amount: safeAmount, isPaid: false },
      ];
    case 'Custom Milestone':
    default:
      return [
        { label: 'Initial Milestone', amount: safeAmount, isPaid: false },
      ];
  }
};

export const getDevPayoutSplits = (total: number) => {
  return {
    advance: Math.round(total * 0.4),
    remaining: Math.round(total * 0.6)
  };
};

/**
 * Downloads provided data as a CSV file
 */
export const downloadCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Header row
  csvRows.push(headers.join(','));

  // Data rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      // Escape double quotes and wrap in double quotes
      const escaped = ('' + (val ?? '')).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
