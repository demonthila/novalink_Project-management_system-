
import { Project } from './types';

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
  }).format(amount);
};

export const calculateProjectProfit = (
  finalTotal: number,
  devCost: number,
  pluginCosts: number,
  otherCosts: number
) => {
  return finalTotal - (devCost + pluginCosts + otherCosts);
};

export const calculatePaidAmount = (project: Project) => {
  let total = 0;
  if (project.paymentStart.isPaid) total += project.paymentStart.amount;
  if (project.paymentMiddle.isPaid) total += project.paymentMiddle.amount;
  if (project.paymentFinal.isPaid) total += project.paymentFinal.amount;
  return total;
};

export const calculateRemainingBalance = (finalTotal: number, project: Project) => {
  return finalTotal - calculatePaidAmount(project);
};

export const calculateDevBalance = (totalDevCost: number, advance: number) => {
  return totalDevCost - advance;
};

export const generateInvoiceNumber = () => {
  const prefix = "NL";
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${date}-${random}`;
};
