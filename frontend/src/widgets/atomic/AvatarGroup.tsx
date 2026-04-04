import React from 'react'

export interface AvatarGroupProps {
  avatars: { src: string; alt: string }[]
  max?: number
  size?: 'sm' | 'md' | 'lg'
  /** Chat injection data */
  data?: { avatars?: { src: string; alt: string }[] }
}

const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-8 h-8 text-[11px]',
  md: 'w-10 h-10 text-[11px]',
  lg: 'w-12 h-12 text-[13px]',
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
          className={`${sizeClasses[size]} rounded-full border-2 border-white object-cover`}
        />
      ))}
      {overflow > 0 && (
        <div
          className={`${sizeClasses[size]} rounded-full border-2 border-white bg-primary text-white flex items-center justify-center font-bold`}
        >
          +{overflow}
        </div>
      )}
    </div>
  )
}

export default AvatarGroup
