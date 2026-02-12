
export type ProjectStatus = 'Pending' | 'Approved' | 'Ongoing' | 'Completed' | 'On Hold' | 'Cancelled' | 'Rejected';
export type ProjectType = '40-30-30' | 'Custom Milestone' | 'Full Payment Upfront';
export type Priority = 'High' | 'Medium' | 'Low';
export type NotificationCategory = 'Payment' | 'Deadline' | 'Handover' | 'Task' | 'StatusChange' | 'System';

// Added TaskStatus for Mission Control/Task Board workflow
export type TaskStatus = 'Backlog' | 'In Progress' | 'Review' | 'Deployed';

// Added ProjectTask interface for granular task tracking within projects
export interface ProjectTask {
  id: string;
  projectId: string;
  label: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string;
  assignedTo: string;
}

export interface Milestone {
  label: string;
  amount: number;
  isPaid: boolean;
  dueDate?: string;
}

export interface AdditionalCost {
  id: string;
  name: string;
  description: string;
  amount: number;
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

export interface Developer {
  id: string;
  name: string;
  specialization: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive';
  address: string;
  idCardNumber: string;
  dateJoined: string;
  country: string;
}

export interface DeveloperAssignment {
  developerId: string;
  totalCost: number;
  isAdvancePaid: boolean;
  isFinalPaid: boolean;
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  projectType: ProjectType;
  priority: Priority;
  startDate: string;
  endDate: string;
  status: ProjectStatus;

  // Financials
  currency: string;
  baseProjectAmount: number;
  milestones: Milestone[];
  additionalCosts: AdditionalCost[];
  isInvoiceIssued: boolean;

  // Team
  squad: DeveloperAssignment[];
  developerTotalCost: number;

  // Added tasks property to fix missing property error in mockData.ts and Project interface
  tasks: ProjectTask[];

  notes: string;
  invoiceNumber?: string;
}

export interface Notification {
  id: string;
  timestamp: string;
  type: NotificationCategory;
  priority: Priority;
  recipients: string[];
  subject: string;
  message: string;
  projectName: string;
  isRead: boolean;
  isResolved: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'User';
  password: string; // In a real app, this should be hashed.
  createdAt: string;
}
