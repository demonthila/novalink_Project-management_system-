
import React, { useMemo } from 'react';
import { Project, ProjectTask, TaskStatus, Priority, Developer } from '../types';
import { ICONS } from '../constants';

interface TaskBoardProps {
  projects: Project[];
  developers: Developer[];
  onUpdateProject: (project: Project) => void;
}

const COLUMNS: TaskStatus[] = ['Backlog', 'In Progress', 'Review', 'Deployed'];

const TaskBoard: React.FC<TaskBoardProps> = ({ projects, developers, onUpdateProject }) => {
  // Combine all tasks from all projects
  const tasks = React.useMemo(() =>
    projects.flatMap(p => (p.tasks || []).map(t => ({ ...t, projectId: p.id }))),
    [projects]);

  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('taskId', id);
  };

  const onDrop = (e: React.DragEvent, status: TaskStatus) => {
    const taskId = e.dataTransfer.getData('taskId');
    const task = tasks.find(t => t.id === taskId);

    if (task) {
      const project = projects.find(p => p.id === task.projectId);
      if (project) {
        const updatedTasks = (project.tasks || []).map(t =>
          t.id === taskId ? { ...t, status } : t
        );
        onUpdateProject({ ...project, tasks: updatedTasks });
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter">Mission Control</h1>
        <p className="text-[#64748B] text-lg mt-1 font-medium">Strategic task allocation and delivery workflow.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 h-[calc(100vh-280px)] min-h-[600px]">
        {COLUMNS.map(col => (
          <div
            key={col}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, col)}
            className="flex flex-col bg-slate-50/50 rounded-[40px] border border-[#F1F5F9] p-6 space-y-6"
          >
            <div className="flex items-center justify-between px-4">
              <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-[#94A3B8] flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${col === 'Deployed' ? 'bg-emerald-500' : col === 'In Progress' ? 'bg-blue-500' : 'bg-slate-300'}`} />
                {col}
              </h3>
              <span className="text-[11px] font-black text-[#CBD5E1] bg-white w-6 h-6 rounded-lg flex items-center justify-center border border-[#F1F5F9] shadow-sm">
                {tasks.filter(t => t.status === col).length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
              {tasks.filter(t => t.status === col).map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onDragStart={onDragStart}
                  project={projects.find(p => p.id === task.projectId)}
                  developer={developers.find(d => d.id === task.assignedTo)}
                />
              ))}
              {tasks.filter(t => t.status === col).length === 0 && (
                <div className="h-32 border-2 border-dashed border-[#F1F5F9] rounded-3xl flex items-center justify-center">
                  <p className="text-[10px] font-bold text-[#CBD5E1] uppercase tracking-widest">Zone Clear</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TaskCard = ({ task, onDragStart, project, developer }: any) => {
  const priorityColor = task.priority === 'High' ? 'text-rose-500 bg-rose-50' : task.priority === 'Medium' ? 'text-amber-500 bg-amber-50' : 'text-blue-500 bg-blue-50';

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      className="bg-white p-6 rounded-[28px] border border-[#F1F5F9] shadow-sm hover:shadow-xl hover:shadow-blue-600/5 hover:-translate-y-1 transition-all cursor-grab active:cursor-grabbing group"
    >
      <div className="flex items-center justify-between mb-4">
        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${priorityColor}`}>
          {task.priority}
        </span>
        <button className="text-[#CBD5E1] hover:text-[#0F172A] transition-colors"><ICONS.MoreVertical /></button>
      </div>

      <h4 className="text-[15px] font-bold text-[#0F172A] leading-tight mb-2 group-hover:text-[#2563EB] transition-colors">{task.label}</h4>
      <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest mb-6">{project?.name || 'Internal Ops'}</p>

      <div className="flex items-center justify-between pt-4 border-t border-[#F8FAFC]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#0F172A] flex items-center justify-center text-[8px] font-black text-white">
            {developer?.name.split(' ').map((n: string) => n[0]).join('')}
          </div>
          <span className="text-[10px] font-bold text-[#475569]">{developer?.name.split(' ')[0]}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-black text-[#94A3B8] uppercase">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          {task.dueDate.split('-').slice(1).join('/')}
        </div>
      </div>
    </div>
  );
};

export default TaskBoard;
