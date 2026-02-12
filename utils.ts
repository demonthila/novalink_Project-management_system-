
import { Project, Payment, AdditionalCost, ProjectDeveloper } from './types';

export const formatCurrency = (amount: number, currency: string = 'AUD') => {
  const storedCurrency = typeof window !== 'undefined' ? localStorage.getItem('stratis_currency') : 'AUD';
  const targetCurrency = currency && currency !== 'LKR' ? currency : (storedCurrency || 'AUD');

  const matches = (targetCurrency || 'AUD').match(/[A-Z]{3}/i);
  const isoCode = (matches ? matches[0] : 'AUD').toUpperCase();

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: isoCode,
      minimumFractionDigits: 2,
    }).format(amount || 0);
  } catch (e) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount || 0);
  }
};

export const calculateTotalAdditionalCosts = (costs: AdditionalCost[]) => {
  return (costs || []).reduce((sum, cost) => sum + Number(cost.amount || 0), 0);
};

export const calculateGrandTotal = (project: Project) => {
  if (!project) return 0;
  return Number(project.total_revenue || 0);
};

export const calculatePaidAmount = (project: Project) => {
  if (!project || !project.payments) return 0;
  return project.payments
    .filter(p => p.status === 'Paid')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
};

export const calculateDeveloperTotalPayout = (developers: ProjectDeveloper[]) => {
  return (developers || []).reduce((sum, dev) => sum + Number(dev.cost || 0), 0);
};

export const calculateProjectProfit = (project: Project) => {
  if (!project) return 0;
  // Backend provides this, but if we need to calc client-side:
  return Number(project.total_profit || 0);
};

export const generateInvoiceNumber = () => {
  const prefix = "NL";
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${date}-${random}`;
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
