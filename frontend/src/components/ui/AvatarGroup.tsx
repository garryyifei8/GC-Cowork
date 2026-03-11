import React from 'react';

interface AvatarGroupProps {
  avatars: { src: string; alt: string }[];
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
};

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  max = 3,
  size = 'md',
}) => {
  const visible = avatars.slice(0, max);
  const overflow = avatars.length - max;

  return (
    <div className="flex -space-x-2">
      {visible.map((avatar, i) => (
        <img
          key={i}
          src={avatar.src}
          alt={avatar.alt}
          className={`${sizeClasses[size]} rounded-full border-2 border-light-surface dark:border-dark-surface object-cover`}
        />
      ))}
      {overflow > 0 && (
        <div
          className={`${sizeClasses[size]} rounded-full border-2 border-light-surface dark:border-dark-surface
            bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300
            flex items-center justify-center font-medium`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
};
