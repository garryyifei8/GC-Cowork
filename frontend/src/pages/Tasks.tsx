import React, { useEffect, useMemo } from 'react';
import { useTaskWorkbenchStore } from '../stores/taskWorkbenchStore';
import { TaskStatsBar } from '../components/tasks/TaskStatsBar';
import { TaskFilters } from '../components/tasks/TaskFilters';
import { TaskListView } from '../components/tasks/TaskListView';
import { TaskKanbanView } from '../components/tasks/TaskKanbanView';

export const Tasks: React.FC = () => {
  const {
    tasks,
    isLoading,
    error,
    filterStatus,
    filterPriority,
    filterProjectId,
    viewMode,
    groupBy,
    fetchTasks,
    updateTaskStatus,
    updateTaskPriority,
    setFilterStatus,
    setFilterPriority,
    setFilterProjectId,
    setViewMode,
    setGroupBy,
  } = useTaskWorkbenchStore();

  // Initial load
  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when server-side filters change
  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterPriority]);

  // Client-side filtering for project (not sent to API)
  const filteredTasks = useMemo(() => {
    if (!filterProjectId) return tasks;
    return tasks.filter((t) => t.project_name === filterProjectId);
  }, [tasks, filterProjectId]);

  return (
    <div className="flex flex-col gap-4 p-6 min-h-0 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-light-text dark:text-dark-text font-heading">
          任务工作台
        </h1>
      </div>

      {/* Stats bar — always based on full filtered set */}
      <TaskStatsBar tasks={filteredTasks} />

      {/* Filter / view controls */}
      <TaskFilters
        tasks={tasks}
        filterStatus={filterStatus}
        filterPriority={filterPriority}
        filterProjectId={filterProjectId}
        viewMode={viewMode}
        groupBy={groupBy}
        onFilterStatus={setFilterStatus}
        onFilterPriority={setFilterPriority}
        onFilterProjectId={setFilterProjectId}
        onViewMode={setViewMode}
        onGroupBy={setGroupBy}
      />

      {/* Error state */}
      {error && (
        <div className="bg-danger/[0.08] border border-danger/25 rounded-lg text-danger px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-16 text-light-text-secondary dark:text-dark-text-secondary text-sm gap-2.5">
          <span>加载中...</span>
        </div>
      )}

      {/* Content */}
      {!isLoading && (
        viewMode === 'list' ? (
          <TaskListView
            tasks={filteredTasks}
            groupBy={groupBy}
            onStatusChange={updateTaskStatus}
            onPriorityChange={updateTaskPriority}
          />
        ) : (
          <TaskKanbanView
            tasks={filteredTasks}
            onStatusChange={updateTaskStatus}
            onPriorityChange={updateTaskPriority}
          />
        )
      )}
    </div>
  );
};
