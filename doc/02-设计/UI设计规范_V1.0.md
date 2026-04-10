# UI设计规范 V1.0

| 属性 | 值 |
|------|------|
| 版本 | V1.0 |
| 日期 | 2026-03-16 |
| 状态 | 初稿 |
| 适用范围 | 牛油果CoWork AI原生项目协作平台 前端UI |

---

## 目录

1. [设计理念](#1-设计理念)
2. [色彩体系](#2-色彩体系)
3. [主题系统](#3-主题系统)
4. [排版系统](#4-排版系统)
5. [组件规范](#5-组件规范)
6. [动画规范](#6-动画规范)
7. [响应式设计](#7-响应式设计)
8. [图标系统](#8-图标系统)

---

## 1. 设计理念

### 1.1 设计风格

牛油果CoWork的UI设计以 **Monday.com Vibe Design System** 为核心参考，在此基础上融入了以下设计原则：

- **信息密度适中**：面向项目管理场景，需要在单屏内展示足够的项目数据，同时保持视觉清爽
- **对话驱动**：AI聊天面板作为核心交互入口，与传统页面操作并存
- **卡片化信息组织**：关键数据通过交互卡片呈现，支持点击展开为完整控件
- **柔和亲和**：通过品牌色（牛油果绿 `#00c875`）和圆角设计传达友好感

### 1.2 布局结构

整体布局采用Monday.com的经典三栏结构：

```
+-- 全局顶栏 (56px, 透明) ---------------------+
|  Logo + 品牌名  |  搜索 | AI | 通知 | 用户头像   |
+------+------------------------------------------+
| 侧边 |  内容区 (白底, 左上圆角12px)               |
| 栏   |                                          |
| 240px|  页面标题栏                                |
| 薰衣 |  +------------------------------------+   |
| 草色 |  | 页面内容 (Outlet)                    |  |
| 背景 |  |                                    |   |
|      |  +------------------------------------+   |
+------+------------------------------------------+
```

- **全局顶栏**：56px高度，透明背景，包含Logo、搜索框、AI助手入口、通知、用户头像
- **侧边栏**：240px宽度，薰衣草色背景（`#edf1fc`），包含导航项、工作区、项目看板列表
- **内容区**：白色背景，左上角12px圆角，阴影效果模拟Monday.com的卡片视觉

---

## 2. 色彩体系

### 2.1 品牌色

| 色彩变量 | 色值 | 用途 |
|---------|------|------|
| `--color-primary` | `#0073ea` | 主色调 — 按钮、链接、激活状态 |
| `--color-primary-light` | `#579bfc` | 浅主色 — hover态、辅助装饰 |
| `--color-primary-dark` | `#0060b9` | 深主色 — 按钮按下态 |

### 2.2 语义色

| 色彩变量 | 色值 | 用途 |
|---------|------|------|
| `--color-success` | `#00c875` | 成功/完成 — 同时作为牛油果品牌色 |
| `--color-success-light` | `#9cd326` | 浅成功色 |
| `--color-warning` | `#fdab3d` | 警告/注意 |
| `--color-warning-light` | `#ffcb00` | 浅警告色 |
| `--color-danger` | `#df2f4a` | 危险/错误 |
| `--color-danger-light` | `#ff7575` | 浅危险色 |
| `--color-info` | `#579bfc` | 信息/提示 |
| `--color-info-light` | `#66ccff` | 浅信息色 |

### 2.3 特殊品牌色

| 色彩变量 | 色值 | 用途 |
|---------|------|------|
| `--color-avocado` | `#00c875` | 牛油果绿（与success同色） |
| `--color-pink` | `#e50073` | 强调色 / 粉色 |

### 2.4 项目状态色

侧边栏项目列表使用不同颜色标识项目状态：

| 状态 | 色值 | 说明 |
|------|------|------|
| active | `#00C875` | 活跃项目 — 绿色 |
| risk | `#E2445C` | 风险项目 — 红色 |
| planning | `#FDAB3D` | 规划中项目 — 橙色 |
| completed | `#C4C4C4` | 已完成项目 — 灰色 |

---

## 3. 主题系统

### 3.1 深色/浅色主题

系统支持深色和浅色两套主题，通过在 `<html>` 元素上添加/移除 `.dark` 类来切换。

**CSS实现：**
```css
@custom-variant dark (&:where(.dark, .dark *));
```

### 3.2 浅色主题色板

| 色彩变量 | 色值 | 用途 |
|---------|------|------|
| `--color-light-bg` | `#f6f7fb` | 页面背景 |
| `--color-light-surface` | `#ffffff` | 卡片/面板表面 |
| `--color-light-surface-hover` | `#f0f1f8` | 表面hover态 |
| `--color-light-border` | `#d0d4e4` | 边框色 |
| `--color-light-text` | `#323338` | 主文本色 |
| `--color-light-text-secondary` | `#676879` | 次要文本色 |

### 3.3 深色主题色板

| 色彩变量 | 色值 | 用途 |
|---------|------|------|
| `--color-dark-bg` | `#181b34` | 页面背景 |
| `--color-dark-surface` | `#30324e` | 卡片/面板表面 |
| `--color-dark-surface-hover` | `#4b4e69` | 表面hover态 |
| `--color-dark-border` | `#4b4e69` | 边框色 |
| `--color-dark-text` | `#f1f5f9` | 主文本色 |
| `--color-dark-text-secondary` | `#9699a7` | 次要文本色 |

### 3.4 主题切换机制

主题状态存储在前端的 `themeStore` 中，使用 Zustand 管理。切换主题时：
1. 在 `<html>` 元素上切换 `.dark` 类
2. 持久化到 localStorage
3. CSS通过 `dark:` 变体自动响应

默认使用浅色主题，防止系统深色主题意外泄露。

---

## 4. 排版系统

### 4.1 字体

| 字体变量 | 字体族 | 用途 |
|---------|--------|------|
| `--font-sans` | Figtree, Inter, ui-sans-serif, system-ui, sans-serif | 正文字体 |
| `--font-heading` | Figtree, Outfit, ui-sans-serif, system-ui, sans-serif | 标题字体 |

**字体权重：**
- Figtree: 300 (light) / 400 (regular) / 500 (medium) / 600 (semibold) / 700 (bold) / 800 (extra-bold)
- Inter: 300 / 400 / 500 / 600 / 700

### 4.2 字号规范

| 场景 | 字号 | 字重 | 说明 |
|------|------|------|------|
| 页面标题 | 15px | font-semibold (600) | 页面标题栏 |
| 品牌名 | 16px | font-bold (700) | 顶栏品牌文字 |
| 侧边栏导航 | 15px | regular/semibold | 导航项文字 |
| 侧边栏看板 | 14px / 13px | regular/medium | 项目看板列表 |
| 分组标签 | 12px (xs) | font-semibold | 侧边栏分组标题（大写+字间距） |
| 面板标题 | 14px (sm) | font-semibold | AI面板标题 |
| 面板副标题 | 0.7rem (~11px) | regular | AI面板上下文标签 |
| 通知标题 | 0.8125rem (~13px) | font-semibold | 通知面板标题 |
| 通知内容 | 12px (xs) | regular | 通知正文 |
| 通知时间 | 0.6875rem (~11px) | regular | 时间戳 |
| 快捷建议按钮 | 12px (xs) | font-medium | 聊天建议标签 |

### 4.3 文本渲染

```css
html {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

---

## 5. 组件规范

### 5.1 卡片 (Card)

AI对话返回的卡片按类型分为多种样式：

| 卡片类型 | 用途 | 视觉特征 |
|---------|------|---------|
| DataCard | 数据展示 | 键值对展示，蓝色强调 |
| ActionCard | 操作按钮 | 包含可点击按钮组 |
| AlertCard | 预警提示 | 左侧色条（warning橙/danger红/info蓝/success绿） |
| ChartCard | 图表 | 内嵌图表控件 |
| TableCard | 表格 | 行列数据表 |
| FileCard | 文件 | 文件图标+元信息 |
| ReportCard | 报告 | 分段长文本 |
| ProgressCard | 进度 | 进度条/柱状图 |
| TaskListCard | 任务列表 | 状态标签+优先级色标 |
| KanbanMiniCard | 迷你看板 | 分栏看板预览 |

### 5.2 按钮

按钮样式遵循Monday.com的设计：

| 类型 | 样式 | 场景 |
|------|------|------|
| 主按钮 | 蓝底白字 `bg-primary text-white` | 主要操作 |
| 次要按钮 | 白底蓝字带边框 | 次要操作 |
| 幽灵按钮 | 透明底，hover变色 | 工具栏操作 |
| 图标按钮 | 正方形，仅图标 | 关闭/设置/切换 |

**按钮尺寸：**
- 工具栏图标按钮：28x28px (w-7 h-7)
- 顶栏图标按钮：32x32px (w-8 h-8)
- 侧边栏添加按钮：28x28px (w-7 h-7)

### 5.3 徽章/标签 (Badge)

| 颜色 | CSS | 场景 |
|------|-----|------|
| 绿色 | `bg-success/10 text-success` | 完成/成功 |
| 橙色 | `bg-warning/10 text-warning` | 警告/注意 |
| 红色 | `bg-danger/10 text-danger` | 错误/危险 |
| 蓝色 | `bg-info/10 text-info` | 信息/进行中 |

通知未读小圆点：`bg-primary`

### 5.4 侧边栏导航项

**结构：**
- 导航项高度：32px (h-8)
- 内边距：px-4
- 图标区域：20x20px
- 图标与文字间距：12px (gap-3)

**状态样式：**
- 默认：`text-[#323338]` + `hover:bg-[#dcdfec]`
- 激活：`bg-[#cce5ff] text-[#0073ea] font-semibold`

**项目看板项：**
- 高度：30px (h-[30px])
- 左边3px色条（`border-l-[3px]`），激活时蓝色
- 项目图标：18x18px 圆角方块，颜色对应项目状态

### 5.5 通知面板

- 宽度：320px (w-80)
- 最大高度：384px (max-h-96)
- 圆角：12px (rounded-xl)
- 定位：绝对定位于通知按钮下方
- 内部分为：头部（标题+全部已读）、列表区（滚动）、底部（关闭按钮）
- 未读通知底色：`bg-primary/[0.03]`

### 5.6 AI聊天面板

- 宽度：380px
- 位于页面右侧，通过 `w-0` / `w-[380px]` 实现展开/收起动画
- 包含：头部（吉祥物+标题+关闭）、消息区（滚动）、快捷建议（标签组）、输入区

### 5.7 滚动条

自定义滚动条样式：
- 宽度/高度：6px
- 滑块：`bg-[#c3c6d4]`，圆角
- 轨道：透明

---

## 6. 动画规范

### 6.1 页面切换动画

| 动画名 | CSS类 | 参数 | 用途 |
|--------|------|------|------|
| fade-in | `animate-fade-in` | 0.3s ease-out | 页面内容淡入 |
| slide-in-right | `animate-slide-in-right` | 0.3s ease-out | 右侧面板滑入 |

### 6.2 加载动画

| 动画名 | CSS类 | 参数 | 用途 |
|--------|------|------|------|
| pulse-dot | `animate-pulse-dot` | 1.5s ease-in-out infinite | 状态指示器脉冲 |
| bounce-dots | `animate-bounce-dot` | 1.2s ease-in-out infinite | AI思考中跳动圆点 |

### 6.3 吉祥物动画

| 动画名 | CSS类 | 参数 | 用途 |
|--------|------|------|------|
| avocado-wave | `animate-avocado-wave` | 1.5s ease-in-out infinite | 牛油果挥手动画 |
| avocado-fade | `animate-avocado-fade` | 1.5s ease-in-out infinite | 牛油果动效光点 |

### 6.4 过渡效果

- 颜色过渡：`transition-colors duration-200`（主题切换等）
- 通用过渡：`transition-all duration-300`（面板展开/收起）
- 快速过渡：`duration-100`（侧边栏hover）
- 中速过渡：`duration-150`（通知项hover）

---

## 7. 响应式设计

### 7.1 布局断点

系统使用TailwindCSS的默认断点：

| 断点 | 最小宽度 | 说明 |
|------|---------|------|
| sm | 640px | 小屏 |
| md | 768px | 中屏 — 搜索框显示 |
| lg | 1024px | 大屏 — 用户名文字显示 |
| xl | 1280px | 超大屏 |

### 7.2 响应式适配规则

- **搜索框**：`hidden md:flex` — 中屏以上显示
- **用户名**：`hidden lg:block` — 大屏以上显示
- **侧边栏**：固定240px宽度（当前未做折叠适配）
- **AI面板**：固定380px宽度，通过展开/收起切换

### 7.3 溢出处理

- 项目名称：`truncate`（单行省略）
- 通知内容：`line-clamp-2`（两行省略）
- 侧边栏看板列表：`overflow-y-auto`（垂直滚动）

---

## 8. 图标系统

### 8.1 图标库

使用 **Lucide React** 图标库（与Monday.com风格一致的线性图标）。

### 8.2 常用图标映射

| 图标 | 组件名 | 用途 |
|------|--------|------|
| Home | 首页导航 |
| ListTodo | 我的工作 |
| Coffee | 我的日常 |
| Users | 人事管理 |
| CircleDollarSign | 财务管理 |
| BookOpen | 知识库 |
| Settings | 设置 |
| Sparkles | AI功能标识 |
| Bot | AI小助理入口 |
| Bell | 通知 |
| Search | 搜索 |
| Plus | 新建 |
| X | 关闭 |
| PenSquare | 新对话 |
| FolderOpen | 项目上下文标识 |
| ChevronDown/Right | 折叠/展开 |
| ClipboardList | 项目看板图标 |
| LayoutGrid | 项目总览图标 |

### 8.3 图标尺寸规范

| 场景 | 尺寸 |
|------|------|
| 侧边栏导航 | 18px |
| 顶栏操作 | 17px |
| 面板头部操作 | 15-16px |
| 看板项图标 | 11px |
| 分组展开图标 | 12-13px |
| 通知类型图标 | 15px |
| 空状态图标 | 32px |

---

*文档结束*
