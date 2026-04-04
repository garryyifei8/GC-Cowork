import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2 } from 'lucide-react';
import type { InteractiveCard } from '../../types';
import { projectService } from '../../services/api';
import { useNotificationStore } from '../../stores/notificationStore';

interface ActionCardProps {
  card: InteractiveCard;
}

export const ActionCard: React.FC<ActionCardProps> = ({ card }) => {
  const navigate = useNavigate();
  const addNotification = useNotificationStore((s) => s.addNotification);
  const [executedActions, setExecutedActions] = useState<Set<number>>(new Set());
  const [loadingAction, setLoadingAction] = useState<number | null>(null);

  const handleAction = async (action: string | undefined, index: number) => {
    if (!action || executedActions.has(index)) return;

    setLoadingAction(index);

    try {
      // Parse action string — format: "action_type:param" or just "action_type"
      const [actionType, ...params] = action.split(':');
      const param = params.join(':');

      switch (actionType) {
        case 'navigate':
        case 'view_project':
          navigate(param || '/projects');
          break;

        case 'view_projects':
          navigate('/projects');
          break;

        case 'view_chat':
          navigate('/chat');
          break;

        case 'view_knowledge':
          navigate('/knowledge');
          break;

        case 'approve':
        case 'confirm': {
          // Approve action — update project status if project_id in data
          const projectId = card.data?.project_id as string;
          if (projectId) {
            await projectService.update(projectId, { status: 'active' });
            addNotification({ title: '操作成功', message: '已批准', type: 'success' });
          }
          break;
        }

        case 'reject':
        case 'decline': {
          const projectId = card.data?.project_id as string;
          if (projectId) {
            await projectService.update(projectId, { status: 'planning' });
            addNotification({ title: '操作完成', message: '已拒绝', type: 'info' });
          }
          break;
        }

        case 'transition': {
          // Stage transition — param = "project_id,target_stage"
          const [projId, targetStage] = param.split(',');
          if (projId && targetStage) {
            await projectService.transition(projId, targetStage);
            addNotification({ title: '阶段推进', message: `项目已推进至${targetStage}阶段`, type: 'success' });
          }
          break;
        }

        case 'create_task': {
          const projectId = card.data?.project_id as string;
          const taskName = card.data?.task_name as string;
          if (projectId && taskName) {
            await projectService.createTask(projectId, { name: taskName });
            addNotification({ title: '任务创建', message: `已创建任务: ${taskName}`, type: 'success' });
          }
          break;
        }

        case 'assign': {
          const taskId = card.data?.task_id as string;
          const assignee = param || (card.data?.assignee as string);
          if (taskId && assignee) {
            await projectService.updateTask(taskId, { assignee });
            addNotification({ title: '任务分配', message: `已分配给 ${assignee}`, type: 'success' });
          }
          break;
        }

        default:
          // Unknown action — navigate if it looks like a path, otherwise notify
          if (action.startsWith('/')) {
            navigate(action);
          } else {
            addNotification({ title: '操作', message: `执行: ${action}`, type: 'info' });
          }
      }

      setExecutedActions((prev) => new Set(prev).add(index));
    } catch (err) {
      addNotification({
        title: '操作失败',
        message: err instanceof Error ? err.message : '请稍后重试',
        type: 'error',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="bg-light-surface border border-light-border border-l-4 border-l-primary rounded-[10px] p-4 transition-colors duration-200 hover:-translate-y-px">
      <div className="flex items-center gap-2 mb-2">
        <p className="text-sm font-medium m-0 leading-snug">{card.title}</p>
      </div>
      {card.content && (
        <p className="text-[0.8125rem] text-light-text-secondary leading-relaxed m-0">
          {card.content}
        </p>
      )}
      {card.data && Object.keys(card.data).length > 0 && (
        <div className="flex flex-col my-2.5">
          {Object.entries(card.data)
            .filter(([key]) => !['severity', 'project_id', 'task_id', 'task_name', 'assignee'].includes(key))
            .map(([key, value]) => (
              <div
                key={key}
                className="flex justify-between items-center py-1.5 border-b border-light-border/60 last:border-b-0 text-[0.8125rem]"
              >
                <span className="text-light-text-secondary font-medium flex-shrink-0 mr-4">
                  {key}
                </span>
                <span className="font-medium text-right">{String(value)}</span>
              </div>
            ))}
        </div>
      )}
      {card.actions && card.actions.length > 0 && (
        <div className="flex flex-row flex-wrap gap-2 mt-3">
          {card.actions.map((btn, index) => {
            const isExecuted = executedActions.has(index);
            const isLoadingThis = loadingAction === index;

            return (
              <button
                key={index}
                className={`inline-flex items-center justify-center gap-1 px-4 py-1.5 rounded-full text-[0.8125rem] font-medium whitespace-nowrap border transition-colors duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                  isExecuted
                    ? 'bg-[#ecedf5] text-light-text-secondary border-light-border'
                    : btn.primary
                    ? 'bg-primary text-white border-primary hover:bg-primary/90'
                    : 'bg-transparent text-light-text border-light-border hover:bg-light-bg'
                }`}
                onClick={() => handleAction(btn.action, index)}
                type="button"
                disabled={isExecuted || isLoadingThis}
              >
                {isLoadingThis ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : isExecuted ? (
                  <Check size={14} />
                ) : null}
                {isExecuted ? '已执行' : btn.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
