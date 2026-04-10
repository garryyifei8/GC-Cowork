import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2 } from 'lucide-react';
import type { InteractiveCard } from '../../types';
import { projectService, financeService, hrService } from '../../services/api';
import { useNotificationStore } from '../../stores/notificationStore';

interface AlertCardProps {
  card: InteractiveCard;
}

type AlertStatus = NonNullable<InteractiveCard['status']>;

const BORDER_ACCENT: Record<AlertStatus, string> = {
  success: 'border-l-success',
  warning: 'border-l-warning',
  danger: 'border-l-danger',
  info: 'border-l-info',
};

const DOT_COLOR: Record<AlertStatus, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
};

export const AlertCard: React.FC<AlertCardProps> = ({ card }) => {
  const navigate = useNavigate();
  const addNotification = useNotificationStore((s) => s.addNotification);
  const [executedActions, setExecutedActions] = useState<Set<number>>(new Set());
  const [loadingAction, setLoadingAction] = useState<number | null>(null);

  const rawSeverity = card.status || card.data?.severity || 'info';
  const validStatuses: AlertStatus[] = ['success', 'warning', 'danger', 'info'];
  const status: AlertStatus = validStatuses.includes(rawSeverity as AlertStatus)
    ? (rawSeverity as AlertStatus)
    : 'info';

  const handleAction = async (action: string | undefined, index: number) => {
    if (!action || executedActions.has(index)) return;

    setLoadingAction(index);

    try {
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

        case 'approve':
        case 'confirm': {
          const projectId = card.data?.project_id as string;
          const expenseId = card.data?.expense_id as string;
          const leaveId = card.data?.leave_id as string;
          if (expenseId) {
            await financeService.updateExpense(expenseId, { status: 'approved' });
            addNotification({ title: '审批通过', message: '报销单已批准', type: 'success' });
          } else if (leaveId) {
            await hrService.updateLeave(leaveId, { status: 'approved' });
            addNotification({ title: '审批通过', message: '请假申请已批准', type: 'success' });
          } else if (projectId) {
            await projectService.update(projectId, { status: 'active' });
            addNotification({ title: '操作成功', message: '已批准', type: 'success' });
          } else {
            addNotification({ title: '操作成功', message: '已批准', type: 'success' });
          }
          break;
        }

        case 'reject':
        case 'decline': {
          const projectId = card.data?.project_id as string;
          const expenseId = card.data?.expense_id as string;
          const leaveId = card.data?.leave_id as string;
          if (expenseId) {
            await financeService.updateExpense(expenseId, { status: 'rejected' });
            addNotification({ title: '已拒绝', message: '报销单已拒绝', type: 'info' });
          } else if (leaveId) {
            await hrService.updateLeave(leaveId, { status: 'rejected' });
            addNotification({ title: '已拒绝', message: '请假申请已拒绝', type: 'info' });
          } else if (projectId) {
            await projectService.update(projectId, { status: 'planning' });
            addNotification({ title: '已拒绝', message: '已拒绝', type: 'info' });
          } else {
            addNotification({ title: '已拒绝', message: '操作已拒绝', type: 'info' });
          }
          break;
        }

        case 'resolve':
        case 'dismiss': {
          addNotification({ title: '告警处理', message: '告警已标记为已处理', type: 'success' });
          break;
        }

        case 'create_risk': {
          const projectId = card.data?.project_id as string;
          if (projectId) {
            await projectService.createRisk(projectId, {
              description: card.title,
              level: status === 'danger' ? 'high' : status === 'warning' ? 'medium' : 'low',
              mitigation: card.content || '',
            });
            addNotification({ title: '风险已记录', message: '已添加到项目风险列表', type: 'success' });
          }
          break;
        }

        case 'transition': {
          const [projId, targetStage] = param.split(',');
          if (projId && targetStage) {
            await projectService.transition(projId, targetStage);
            addNotification({ title: '阶段推进', message: `项目已推进至${targetStage}阶段`, type: 'success' });
          }
          break;
        }

        default:
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
    <div
      className={`bg-light-surface border border-light-border border-l-4 ${BORDER_ACCENT[status]} rounded-[10px] p-4 transition-colors duration-200 hover:-translate-y-px`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${DOT_COLOR[status]}`}
          aria-hidden="true"
        />
        <p className="text-sm font-medium m-0 leading-snug">{card.title}</p>
      </div>

      {card.content && (
        <p className="text-[0.8125rem] text-light-text-secondary leading-relaxed m-0">
          {card.content}
        </p>
      )}

      {card.data?.description && (
        <p className="text-[0.8125rem] text-light-text-secondary leading-relaxed m-0">
          {card.data.description}
        </p>
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
