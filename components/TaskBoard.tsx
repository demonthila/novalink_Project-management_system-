
import React, { useMemo } from 'react';
import { Project, ProjectTask, TaskStatus, Priority, Developer } from '../types';
import { ICONS } from '../constants';

const COLUMNS: TaskStatus[] = ['Backlog', 'In Progress', 'Review', 'Deployed'];

const TaskBoard: React.FC<TaskBoardProps> = ({ projects, developers, onUpdateProject }) => {











// TaskBoard (Mission Control) was removed. Keep a no-op placeholder to avoid import errors.
const TaskBoard: React.FC = () => null;

export default TaskBoard;
