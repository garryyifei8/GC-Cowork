import React from 'react'
import { Search, ChevronDown } from 'lucide-react'

export interface FilterOption {
  value: string
  label: string
}

export interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  filterOptions?: FilterOption[]
  filterValue?: string
  onFilterChange?: (value: string) => void
  /** Chat injection data */
  data?: { value?: string; placeholder?: string }
}

const SearchBar: React.FC<SearchBarProps> = (props) => {
  const d = props.data
  const value = d?.value ?? props.value
  const placeholder = d?.placeholder ?? props.placeholder ?? '搜索...'
  const { onChange, filterOptions, filterValue, onFilterChange } = props
  const [dropdownOpen, setDropdownOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!dropdownOpen) return
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [dropdownOpen])

  return (
    <div className="relative flex items-center gap-2" ref={ref}>
      <div className="relative flex-1">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
        />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          aria-label={placeholder}
        />
      </div>

      {filterOptions && filterOptions.length > 0 && (
        <div className="relative">
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            {filterOptions.find((o) => o.value === filterValue)?.label ?? '全部'}
            <ChevronDown size={14} />
          </button>
          {dropdownOpen && (
            <div className="absolute z-50 top-full right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1 min-w-[140px]">
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  className={`w-full text-left px-3 py-1.5 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    filterValue === opt.value
                      ? 'text-primary font-medium'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                  onClick={() => {
                    onFilterChange?.(opt.value)
                    setDropdownOpen(false)
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchBar
