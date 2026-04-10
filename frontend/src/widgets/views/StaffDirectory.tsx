import React, { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { StaffCard } from '../business'
import { EmptyState } from '../atomic'
import { useHRStore } from '../../stores/hrStore'
import type { Employee } from '../../types'

export interface StaffDirectoryProps {
  data?: { employees?: Employee[] }
  onEmployeeClick?: (employee: Employee) => void
}

const StaffDirectory: React.FC<StaffDirectoryProps> = ({ data, onEmployeeClick }) => {
  const storeEmployees = useHRStore((s) => s.employees)
  const employees = data?.employees ?? storeEmployees

  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const departments = useMemo(() => {
    return Array.from(new Set(employees.map((e) => e.department))).sort()
  }, [employees])

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      if (deptFilter && e.department !== deptFilter) return false
      if (statusFilter && e.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !e.name.toLowerCase().includes(q) &&
          !e.position.toLowerCase().includes(q) &&
          !e.department.toLowerCase().includes(q)
        ) {
          return false
        }
      }
      return true
    })
  }, [employees, deptFilter, statusFilter, search])

  if (employees.length === 0) {
    return <EmptyState icon="users" title="暂无员工数据" description="尚未导入员工信息" />
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#919AA3] " />
          <input
            type="text"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[#E8ECF4]  bg-white  text-light-text  focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            placeholder="搜索姓名、职位..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="rounded-lg border border-[#E8ECF4]  bg-white  px-3 py-2 text-sm text-light-text  focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          aria-label="按部门筛选"
        >
          <option value="">全部部门</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          className="rounded-lg border border-[#E8ECF4]  bg-white  px-3 py-2 text-sm text-light-text  focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="按状态筛选"
        >
          <option value="">全部状态</option>
          <option value="active">在职</option>
          <option value="on_leave">休假中</option>
          <option value="resigned">已离职</option>
        </select>
        <span className="ml-auto text-xs text-light-text-secondary ">
          共 {filtered.length} 人
        </span>
      </div>

      {/* Card grid */}
      {filtered.length === 0 ? (
        <EmptyState icon="users" title="无匹配结果" description="请调整筛选条件" />
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          role="list"
          aria-label="员工列表"
        >
          {filtered.map((emp) => (
            <StaffCard key={emp.id} employee={emp} onClick={onEmployeeClick} />
          ))}
        </div>
      )}
    </div>
  )
}

export default StaffDirectory
