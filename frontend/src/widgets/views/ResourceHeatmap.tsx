import React, { useEffect, useMemo } from 'react'
import { useProjectStore } from '../../stores/projectStore'
import { useTaskWorkbenchStore } from '../../stores/taskWorkbenchStore'

export interface ResourceHeatmapProps {
  data?: { tasks?: any[]; projects?: any[] }
}

// Returns Tailwind-compatible inline style for cell bg based on task count
function getCellStyle(count: number): React.CSSProperties {
  if (count === 0) return { backgroundColor: 'transparent' }
  if (count <= 2) return { backgroundColor: 'rgba(0,200,117,0.15)' }
  if (count <= 4) return { backgroundColor: 'rgba(0,200,117,0.35)' }
  return { backgroundColor: 'rgba(0,200,117,0.65)' }
}

function getCellTextColor(count: number): string {
  if (count === 0) return '#919AA3'
  if (count <= 2) return '#065F46'
  if (count <= 4) return '#064E3B'
  return '#ffffff'
}

const OVERLOAD_THRESHOLD = 8

const ResourceHeatmap: React.FC<ResourceHeatmapProps> = ({ data }) => {
  const storeTasks = useTaskWorkbenchStore((s) => s.tasks)
  const fetchTasks = useTaskWorkbenchStore((s) => s.fetchTasks)
  const storeProjects = useProjectStore((s) => s.projects)
  const fetchProjects = useProjectStore((s) => s.fetchProjects)

  useEffect(() => {
    if (!storeTasks.length) fetchTasks()
    if (!storeProjects.length) fetchProjects()
  }, [storeTasks.length, storeProjects.length, fetchTasks, fetchProjects])

  const tasks = data?.tasks ?? storeTasks
  const projects = data?.projects ?? storeProjects

  // Derive unique assignees and project names from tasks
  const assignees = useMemo<string[]>(() => {
    const set = new Set<string>()
    for (const t of tasks) {
      const a = t.assignee ?? t.assignee_name
      if (a) set.add(a)
    }
    return Array.from(set).sort()
  }, [tasks])

  const projectNames = useMemo<string[]>(() => {
    if (projects.length) {
      return projects.map((p: any) => p.name ?? p.project_name ?? p.id)
    }
    // Fallback: derive from tasks
    const set = new Set<string>()
    for (const t of tasks) {
      const name = t.project_name ?? t.project_id
      if (name) set.add(name)
    }
    return Array.from(set).sort()
  }, [projects, tasks])

  // Build count matrix: matrix[assignee][projectName] = count
  const matrix = useMemo<Record<string, Record<string, number>>>(() => {
    const m: Record<string, Record<string, number>> = {}
    for (const assignee of assignees) {
      m[assignee] = {}
      for (const pname of projectNames) {
        m[assignee][pname] = 0
      }
    }
    for (const t of tasks) {
      const assignee = t.assignee ?? t.assignee_name
      if (!assignee) continue
      // Try to match project name
      const pname =
        t.project_name ??
        projects.find((p: any) => p.id === t.project_id)?.name ??
        t.project_id
      if (m[assignee] && pname && projectNames.includes(pname)) {
        m[assignee][pname] = (m[assignee][pname] ?? 0) + 1
      }
    }
    return m
  }, [tasks, projects, assignees, projectNames])

  // Row totals
  const rowTotals = useMemo<Record<string, number>>(() => {
    const rt: Record<string, number> = {}
    for (const assignee of assignees) {
      rt[assignee] = projectNames.reduce((s, p) => s + (matrix[assignee]?.[p] ?? 0), 0)
    }
    return rt
  }, [matrix, assignees, projectNames])

  // Column totals
  const colTotals = useMemo<Record<string, number>>(() => {
    const ct: Record<string, number> = {}
    for (const pname of projectNames) {
      ct[pname] = assignees.reduce((s, a) => s + (matrix[a]?.[pname] ?? 0), 0)
    }
    return ct
  }, [matrix, assignees, projectNames])

  if (!assignees.length || !projectNames.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-[#E8ECF4] dark:border-gray-700 rounded-[10px] p-5 transition-colors duration-200 flex flex-col items-center justify-center min-h-[240px]">
        <p className="text-sm text-light-text-secondary dark:text-gray-500">暂无任务分配数据</p>
      </div>
    )
  }

  return (
    <div
      className="bg-white dark:bg-gray-800 border border-[#E8ECF4] dark:border-gray-700 rounded-[10px] p-5 transition-colors duration-200 flex flex-col gap-4"
      role="region"
      aria-label="资源分配热力图"
    >
      <div className="flex items-center justify-between flex-shrink-0">
        <h2 className="text-base font-medium text-light-text dark:text-gray-100">
          资源分配热力图
        </h2>
        <div className="flex items-center gap-3 text-xs text-light-text-secondary dark:text-gray-400">
          {/* Intensity legend */}
          {[
            { label: '0', style: { backgroundColor: 'rgba(0,200,117,0)' } },
            { label: '1-2', style: { backgroundColor: 'rgba(0,200,117,0.15)' } },
            { label: '3-4', style: { backgroundColor: 'rgba(0,200,117,0.35)' } },
            { label: '5+', style: { backgroundColor: 'rgba(0,200,117,0.65)' } },
          ].map(({ label, style }) => (
            <span key={label} className="flex items-center gap-1">
              <span
                className="inline-block w-3 h-3 rounded border border-[#E8ECF4] dark:border-gray-600"
                style={style}
                aria-hidden="true"
              />
              <span>{label}件</span>
            </span>
          ))}
          <span className="flex items-center gap-1 ml-2">
            <span
              className="inline-block w-3 h-3 rounded"
              style={{ backgroundColor: 'rgba(231,76,60,0.15)', border: '1px solid #E74C3C' }}
              aria-hidden="true"
            />
            <span>超负荷 (&gt;{OVERLOAD_THRESHOLD})</span>
          </span>
        </div>
      </div>

      {/* Scrollable table wrapper */}
      <div className="overflow-x-auto rounded-lg border border-[#E8ECF4] dark:border-gray-700">
        <table className="text-xs border-collapse min-w-full" role="grid" aria-label="成员任务分配矩阵">
          <thead>
            <tr>
              {/* Corner cell */}
              <th
                className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-900 border-b border-r border-[#E8ECF4] dark:border-gray-700 px-3 py-2 text-left text-light-text-secondary dark:text-gray-400 font-medium min-w-[120px]"
                scope="col"
              >
                成员 / 项目
              </th>
              {projectNames.map((pname) => (
                <th
                  key={pname}
                  className="bg-gray-50 dark:bg-gray-900 border-b border-r border-[#E8ECF4] dark:border-gray-700 px-2 py-2 text-center text-light-text dark:text-gray-300 font-medium whitespace-nowrap max-w-[100px] overflow-hidden text-ellipsis"
                  scope="col"
                  title={pname}
                >
                  <span className="block max-w-[90px] overflow-hidden text-ellipsis whitespace-nowrap mx-auto">
                    {pname}
                  </span>
                </th>
              ))}
              {/* Row total header */}
              <th
                className="bg-gray-50 dark:bg-gray-900 border-b border-[#E8ECF4] dark:border-gray-700 px-3 py-2 text-center text-light-text-secondary dark:text-gray-400 font-medium whitespace-nowrap"
                scope="col"
              >
                合计
              </th>
            </tr>
          </thead>

          <tbody>
            {assignees.map((assignee) => {
              const total = rowTotals[assignee] ?? 0
              const isOverloaded = total > OVERLOAD_THRESHOLD
              return (
                <tr
                  key={assignee}
                  className={
                    isOverloaded
                      ? 'bg-red-50 dark:bg-red-950/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-750'
                  }
                >
                  {/* Assignee name cell */}
                  <td
                    className={`sticky left-0 z-10 border-b border-r border-[#E8ECF4] dark:border-gray-700 px-3 py-2 font-medium whitespace-nowrap ${
                      isOverloaded
                        ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {/* Avatar initial */}
                      <span
                        className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold flex-shrink-0 ${
                          isOverloaded
                            ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                            : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300'
                        }`}
                        aria-hidden="true"
                      >
                        {assignee.charAt(0).toUpperCase()}
                      </span>
                      {assignee}
                      {isOverloaded && (
                        <span
                          className="text-xs font-bold text-red-500 dark:text-red-400 ml-0.5"
                          title="任务量超过8件，已超负荷"
                        >
                          !
                        </span>
                      )}
                    </span>
                  </td>

                  {/* Project cells */}
                  {projectNames.map((pname) => {
                    const count = matrix[assignee]?.[pname] ?? 0
                    const cellStyle = getCellStyle(count)
                    const textColor = getCellTextColor(count)
                    return (
                      <td
                        key={pname}
                        className="border-b border-r border-[#E8ECF4] dark:border-gray-700 text-center transition-all duration-150 cursor-default select-none"
                        style={cellStyle}
                        title={count > 0 ? `${assignee} / ${pname}: ${count}件任务` : undefined}
                      >
                        <span
                          className="block py-2 px-1 font-semibold leading-none"
                          style={{ color: count === 0 ? '#E8ECF4' : textColor, fontSize: 11 }}
                        >
                          {count === 0 ? '·' : count}
                        </span>
                      </td>
                    )
                  })}

                  {/* Row total */}
                  <td
                    className={`border-b border-[#E8ECF4] dark:border-gray-700 text-center px-3 py-2 font-bold ${
                      isOverloaded
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {total}
                  </td>
                </tr>
              )
            })}

            {/* Column totals row */}
            <tr className="bg-gray-50 dark:bg-gray-900 border-t border-[#E8ECF4] dark:border-gray-700">
              <td
                className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-900 border-r border-[#E8ECF4] dark:border-gray-700 px-3 py-2 font-semibold text-light-text-secondary dark:text-gray-400"
              >
                合计
              </td>
              {projectNames.map((pname) => (
                <td
                  key={pname}
                  className="border-r border-[#E8ECF4] dark:border-gray-700 text-center px-2 py-2 font-bold text-gray-700 dark:text-gray-300"
                >
                  {colTotals[pname] ?? 0}
                </td>
              ))}
              <td className="text-center px-3 py-2 font-bold text-gray-700 dark:text-gray-300">
                {assignees.reduce((s, a) => s + (rowTotals[a] ?? 0), 0)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ResourceHeatmap
