import React from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

export interface Column<T = any> {
  key: string
  label: string
  render?: (value: any, row: T) => React.ReactNode
  sortable?: boolean
  width?: string
}

export interface DataTableProps<T = any> {
  columns: Column<T>[]
  rows: T[]
  onRowClick?: (row: T) => void
  emptyMessage?: string
  /** Chat injection alternative to rows */
  data?: T[]
}

function DataTable<T extends Record<string, any> = Record<string, any>>(
  props: DataTableProps<T>,
) {
  const rows = props.data ?? props.rows
  const { columns, onRowClick, emptyMessage = '暂无数据' } = props

  const [sortKey, setSortKey] = React.useState<string | null>(null)
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('asc')

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sortedRows = React.useMemo(() => {
    if (!sortKey) return rows
    return [...rows].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal
      }
      const cmp = String(aVal).localeCompare(String(bVal))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [rows, sortKey, sortDir])

  if (rows.length === 0) {
    return (
      <div className="bg-white border border-[#E8ECF4] rounded-[10px] p-8 text-center text-base text-light-text-secondary">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="bg-white border border-[#E8ECF4] rounded-[10px] overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-[#E6FAF0]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-5 py-[18px] text-left text-base font-medium text-light-text border-b border-[#E8ECF4] ${
                  col.sortable
                    ? 'cursor-pointer select-none hover:text-light-text transition-colors'
                    : ''
                }`}
                style={col.width ? { width: col.width } : undefined}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  {col.sortable && (
                    <span className="inline-flex flex-col">
                      {sortKey === col.key ? (
                        sortDir === 'asc' ? (
                          <ChevronUp size={13} className="text-primary" />
                        ) : (
                          <ChevronDown size={13} className="text-primary" />
                        )
                      ) : (
                        <ChevronsUpDown size={13} className="text-[#919AA3]" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, idx) => (
            <tr
              key={idx}
              className={`transition-colors ${
                onRowClick
                  ? 'hover:bg-[#F4F6FC] cursor-pointer'
                  : 'hover:bg-[#F4F6FC]'
              }`}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="px-5 py-[19px] text-base text-light-text-secondary border-b border-[#E8ECF4]"
                >
                  {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable
