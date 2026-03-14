import React from 'react'

export interface AvatarGroupProps {
  avatars: { src: string; alt: string }[]
  max?: number
  size?: 'sm' | 'md' | 'lg'
  /** Chat injection data */
  data?: { avatars?: { src: string; alt: string }[] }
}

const sizeClasses = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
}

const AvatarGroup: React.FC<AvatarGroupProps> = (props) => {
  const d = props.data
  const avatars = d?.avatars ?? props.avatars
  const max = props.max ?? 3
  const size = props.size ?? 'md'

  const visible = avatars.slice(0, max)
  const overflow = avatars.length - max

  return (
    <div className="flex -space-x-2">
      {visible.map((avatar, i) => (
        <img
          key={i}
          src={avatar.src}
          alt={avatar.alt}
          className={`${sizeClasses[size]} rounded-full border-2 border-white dark:border-gray-800 object-cover`}
        />
      ))}
      {overflow > 0 && (
        <div
          className={`${sizeClasses[size]} rounded-full border-2 border-white dark:border-gray-800
            bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300
            flex items-center justify-center font-medium`}
        >
          +{overflow}
        </div>
      )}
    </div>
  )
}

export default AvatarGroup
