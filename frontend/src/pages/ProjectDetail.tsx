import { useParams } from 'react-router-dom'
import { useEffect } from 'react'
import PageRenderer from './PageRenderer'
import { projectDetailLayout } from '../page-layouts'
import { useProjectStore } from '../stores/projectStore'

export const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>()
  const fetchProjectDetail = useProjectStore((s) => s.fetchProjectDetail)

  useEffect(() => {
    if (id) fetchProjectDetail(id)
  }, [id, fetchProjectDetail])

  return <PageRenderer layout={projectDetailLayout} pageProps={{ projectId: id }} />
}
