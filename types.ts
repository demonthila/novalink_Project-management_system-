
export type ProjectStatus = 'In Progress' | 'Completed' | 'Cancelled';

export interface PaymentMilestone {
  amount: number;
  isPaid: boolean;
  label: string;
}

export interface Client {
  id: string;
  name: string;
  companyName: string;
  phone: string;
  email: string;
  address: string;
  country: string;
  notes: string;
  createdDate: string;
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  projectCost: number; // LKR (Internal cost)
  finalTotal: number;  // LKR (Client total)
  pluginCosts: number;
  templateCosts: number;
  otherCosts: number;
  
  // New Milestone Payments
  paymentStart: PaymentMilestone;
  paymentMiddle: PaymentMilestone;
  paymentFinal: PaymentMilestone;
  
  developerName: string;
  developerTotalCost: number;
  advancePaymentToDeveloper: number;
  notes: string;
  invoiceNumber?: string;
}

export interface FinancialStats {
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  pendingPayments: number;
  paidProjects: number;
  cancelledProjects: number;
}
