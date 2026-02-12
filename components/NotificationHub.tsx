
import React, { useState } from 'react';
import { Notification, Priority, NotificationCategory } from '../types';
import { ICONS } from '../constants';

interface NotificationHubProps {
  notifications: Notification[];
  onClear: () => void;
  onMarkRead: (id: string) => void;
  onResolve: (id: string) => void;
}

const NotificationHub: React.FC<NotificationHubProps> = ({ notifications, onClear, onMarkRead, onResolve }) => {
  const [filterPriority, setFilterPriority] = useState<Priority | 'All'>('All');
  const [filterCategory, setFilterCategory] = useState<NotificationCategory | 'All'>('All');

  const filtered = notifications
    .filter(n => (filterPriority === 'All' || n.priority === filterPriority))
    .filter(n => (filterCategory === 'All' || n.type === filterCategory))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-6">
      <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Intelligence & Alerts</h3>
            <p className="text-slate-500 font-medium mt-1">Audit log and active reminder management system.</p>
          </div>
          <button 
            onClick={onClear}
            className="px-8 py-4 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-3 border border-slate-200"
          >
            <ICONS.Delete />
            Purge History
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap gap-4 pt-8 border-t border-slate-100">
           <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Priority:</span>
              <select 
                className="bg-transparent text-xs font-black text-slate-900 outline-none"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value as any)}
              >
                <option value="All">All Levels</option>
                <option value="High">High Only</option>
                <option value="Medium">Medium Only</option>
                <option value="Low">Low Only</option>
              </select>
           </div>
           <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Category:</span>
              <select 
                className="bg-transparent text-xs font-black text-slate-900 outline-none"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as any)}
              >
                <option value="All">All Contexts</option>
                <option value="Payment">Payments</option>
                <option value="Deadline">Deadlines</option>
                <option value="Handover">Handovers</option>
                <option value="Task">Tasks</option>
                <option value="StatusChange">Status</option>
              </select>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-10 py-6">Priority</th>
                <th className="px-10 py-6">Context & Event</th>
                <th className="px-10 py-6">Recipients</th>
                <th className="px-10 py-6">Timestamp</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-10 py-24 text-center">
                    <div className="flex flex-col items-center opacity-20">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                      <p className="font-black mt-4 uppercase tracking-[0.2em] text-xs">The dispatch log is empty.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((n) => (
                  <tr key={n.id} className={`hover:bg-blue-50/10 transition-colors group ${n.isResolved ? 'opacity-50 grayscale' : ''}`}>
                    <td className="px-10 py-8">
                       <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${n.priority === 'High' ? 'bg-rose-500 animate-pulse' : n.priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                          <span className={`text-[10px] font-black uppercase tracking-widest ${n.priority === 'High' ? 'text-rose-600' : n.priority === 'Medium' ? 'text-amber-600' : 'text-blue-600'}`}>{n.priority}</span>
                       </div>
                    </td>
                    <td className="px-10 py-8">
                      <div>
                        <p className="font-black text-slate-900 text-base tracking-tight leading-tight">{n.subject}</p>
                        <p className="text-[10px] text-[#0A69E1] font-black uppercase tracking-widest mt-1">{n.projectName} • {n.type}</p>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {n.recipients.slice(0, 2).map((r, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold truncate">
                            {r}
                          </span>
                        ))}
                        {n.recipients.length > 2 && <span className="text-[9px] font-bold text-slate-400">+{n.recipients.length - 2} more</span>}
                      </div>
                    </td>
                    <td className="px-10 py-8 text-[11px] font-bold text-slate-500">
                      {new Date(n.timestamp).toLocaleString()}
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                         {!n.isResolved && (
                           <button 
                             onClick={() => onResolve(n.id)}
                             className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all shadow-sm"
                             title="Mark as Resolved"
                           >
                             <ICONS.Check />
                           </button>
                         )}
                         <button 
                           onClick={() => {
                             alert(n.message);
                             onMarkRead(n.id);
                           }}
                           className="p-3 bg-[#0A69E1] text-white rounded-2xl hover:bg-[#0857b8] transition-all shadow-lg shadow-blue-600/20"
                           title="Read Transmission"
                         >
                           <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                         </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NotificationHub;
