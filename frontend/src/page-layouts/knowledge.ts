import type { PageLayout } from '../widgets/types'

export const knowledgeLayout: PageLayout = {
  title: '企业智能知识库',
  grid: 'single',
  slots: [
    // Search bar
    { id: 'search-bar', widgetType: 'search_bar', props: { placeholder: '使用自然语言搜索：例如 "找一下关于专项债申请的最新模板"' } },
    // Document list
    { id: 'document-list', widgetType: 'document_list' },
  ],
}
