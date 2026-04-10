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
      {/* Search input */}
      <div className="relative flex-1 flex items-center bg-[#EFF3F9] rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
        <Search
          size={16}
          className="text-[#919AA3] pointer-events-none flex-shrink-0"
        />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 ml-2 text-[15px] text-light-text bg-transparent outline-none border-0 placeholder:text-[#919AA3]"
          aria-label={placeholder}
        />
      </div>

      {/* Filter dropdown */}
      {filterOptions && filterOptions.length > 0 && (
        <div className="relative">
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E8ECF4] bg-white text-[15px] text-light-text hover:border-primary/40 transition-colors"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            {filterOptions.find((o) => o.value === filterValue)?.label ?? '全部'}
            <ChevronDown size={14} className="text-[#919AA3]" />
          </button>
          {dropdownOpen && (
            <div className="absolute z-50 top-full right-0 mt-1 bg-white border border-[#E8ECF4] rounded-lg shadow-lg py-1 min-w-[140px]">
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  className={`w-full text-left px-3 py-1.5 text-[15px] transition-colors hover:bg-[#F4F6FC] ${
                    filterValue === opt.value
                      ? 'text-primary font-semibold'
                      : 'text-light-text'
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
