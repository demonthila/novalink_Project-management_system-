export type ProjectStatus = 'Pending' | 'Active' | 'Completed';

export interface Developer {
  id: number;
  name: string;
  role: string;
  email: string;
  status: 'Active' | 'Inactive';
  created_at?: string;
}

export interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  company_name: string;
  created_at?: string;
}

export interface ProjectDeveloper {
  id: number; // Developer ID
  name: string;
  role: string;
  cost: number; // Cost for this project
}

export interface AdditionalCost {
  id?: number;
  project_id?: number;
  description: string;
  amount: number;
}

export interface Payment {
  id: number;
  project_id: number;
  payment_number: number;
  amount: number;
  due_date: string;
  status: 'Paid' | 'Unpaid';
  paid_date: string | null;
}

export interface Project {
  id: number;
  name: string;
  client_id: number;
  start_date: string;
  end_date: string;
  status: ProjectStatus;
  total_revenue: number;
  total_profit: number;
  currency: string;
  notes?: string;
  created_at?: string;

  // Relations
  developers?: ProjectDeveloper[];
  additional_costs?: AdditionalCost[];
  payments?: Payment[];
}

export interface Notification {
  id: number;
  project_id: number | null;
  type: string;
  message: string;
  sent_to: string;
  sent_at: string;
  is_read: number; // 0 or 1
}

export interface Settings {
  currency: string;
  reminder_email: string;
  backup_schedule_months: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  pendingPaymentsTotal: number;
  projectStats: { [key: string]: number };
  recentProjects: Project[];
  upcomingPayments: Payment[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'Admin' | 'User';
  createdAt: string;
}

