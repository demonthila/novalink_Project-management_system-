
import { Client, Project, Developer } from '../types';

export const INITIAL_DEVELOPERS: Developer[] = [
  { 
    id: 'd1', 
    name: 'Kasun Perera', 
    specialization: 'Full Stack', 
    email: 'kasun@dev.lk', 
    phone: '0771112223', 
    status: 'Active',
    address: 'No 45, Temple Road, Maharagama',
    idCardNumber: '199212304567',
    dateJoined: '2023-01-15',
    country: 'Sri Lanka'
  },
  { 
    id: 'd2', 
    name: 'Duminda Silva', 
    specialization: 'UI/UX & Mobile', 
    email: 'duminda@dev.lk', 
    phone: '0774445556', 
    status: 'Active',
    address: '12/A, High Level Road, Pannipitiya',
    idCardNumber: '199588204567',
    dateJoined: '2023-06-20',
    country: 'Sri Lanka'
  },
  { 
    id: 'd3', 
    name: 'Sarah Wilson', 
    specialization: 'WordPress Specialist', 
    email: 'sarah@dev.lk', 
    phone: '0777778889', 
    status: 'Active',
    address: '456 Wall St, New York',
    idCardNumber: 'NY-8892011',
    dateJoined: '2024-02-01',
    country: 'USA'
  }
];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: '1',
    name: 'Anura Kumara',
    companyName: 'Lanka Tech Solutions',
    phone: '+94 77 123 4567',
    email: 'anura@lankatech.lk',
    address: '123 Galle Road, Colombo 03',
    country: 'Sri Lanka',
    notes: 'Premium client, prefers WordPress.',
    createdDate: '2024-01-15'
  },
  {
    id: '2',
    name: 'Sarah Jennings',
    companyName: 'Global Markets Inc.',
    phone: '+1 202 555 0192',
    email: 'sarah@globalmarkets.com',
    address: '456 Wall St, New York',
    country: 'USA',
    notes: 'Mobile app project inquiry.',
    createdDate: '2024-02-10'
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: '101',
    clientId: '1',
    name: 'Corporate Website Redesign',
    projectType: '30-30-40',
    // Added missing 'priority' property required by Project type
    priority: 'Medium',
    startDate: '2024-01-20',
    endDate: '2024-02-15',
    status: 'Completed',
    currency: 'USD',
    baseProjectAmount: 18000,
    milestones: [
      { label: 'Upfront Payment (30%)', amount: 5400, isPaid: true },
      { label: 'Middle Payment (30%)', amount: 5400, isPaid: true },
      { label: 'Final Payment (40%)', amount: 7200, isPaid: true },
    ],
    additionalCosts: [
      { id: 'ac1', name: 'Server setup', description: 'Monthly dedicated server', amount: 500 }
    ],
    // Added isInvoiceIssued property which was required by Project type
    isInvoiceIssued: true,
    squad: [
      { developerId: 'd1', totalCost: 3000, isAdvancePaid: true, isFinalPaid: true },
      { developerId: 'd3', totalCost: 3000, isAdvancePaid: true, isFinalPaid: true }
    ],
    // Added missing 'tasks' property required by Project interface
    tasks: [],
    developerTotalCost: 6000,
    notes: 'Client was very happy with the delivery.',
    invoiceNumber: 'NL-20240215-4521'
  }
];
