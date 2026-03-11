import React from 'react';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: EmptyStateAction;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-3 py-12 px-6" role="status">
      {icon && (
        <div
          className="flex items-center justify-center w-18 h-18 rounded-full bg-light-bg dark:bg-dark-bg text-light-text-secondary dark:text-dark-text-secondary mb-1"
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <h3 className="font-heading text-lg font-semibold m-0 leading-snug">{title}</h3>
      {description && (
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary m-0 leading-relaxed max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <button
          type="button"
          className="mt-2 inline-flex items-center justify-center px-5 py-2 bg-primary text-white border-none rounded-full text-sm font-semibold cursor-pointer transition-colors duration-150 hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
