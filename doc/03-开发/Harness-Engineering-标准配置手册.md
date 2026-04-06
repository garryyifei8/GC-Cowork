# Harness Engineering 标准配置手册

> **用途：** 本文档是团队项目工程化配置的标准参考。新项目可按照本手册逐步导入全部或部分模块。
>
> **适用架构：** pnpm + Turbo 前端 Monorepo + Python FastAPI 后端
>
> **版本：** v1.0 (2026-04-05)
>
> **来源项目：** DigitSpace (GC_DigitalAvatarOversea)

---

## 目录

1. [总览与设计原则](#1-总览与设计原则)
2. [前置条件](#2-前置条件)
3. [Phase 1 — 代码格式与质量](#3-phase-1--代���格式与质量)
4. [Phase 2 — Git Hooks 与提交规范](#4-phase-2--git-hooks-与提交规范)
5. [Phase 3 — 前端测试 (Vitest)](#5-phase-3--前端测试-vitest)
6. [Phase 4 — 后端测试 (pytest)](#6-phase-4--后端测试-pytest)
7. [Phase 5 — CI 持续集成](#7-phase-5--ci-持���集成)
8. [Phase 6 — CD 持续部署 (GCP Cloud Run)](#8-phase-6--cd-持续部署-gcp-cloud-run)
9. [Phase 7 — E2E 测试、文档、Code Review](#9-phase-7--e2e-测试文档code-review)
10. [Phase 8 — 熵管理 (Entropy Management)](#10-phase-8--熵管理-entropy-management)
11. [验收检查清单](#11-验收检查清单)
12. [新项目导入指引](#12-新项目导入指引)
13. [版本依赖参考](#13-��本依赖参考)

---

## 1. ��览与设计原则

### 设计原则

| 原则 | 说明 |
|------|------|
| **机械执行优于文档约定** | 能用工具自动强制的规则，绝不靠口头约定 |
| **渐进式采用** | 新规则先 `warn`，稳定后升级为 `error` |
| **Repo 即唯一真相源** | 所有配置、规范、文档都在仓库内，不依赖外部 wiki |
| **最小必要复杂度** | 只添加当前需要的配置，不为假设性需求过度设计 |

### 模块矩阵

| 阶段 | 模块 | 文件 | 可选/必选 |
|------|------|------|-----------|
| Phase 1 | EditorConfig | `.editorconfig` | 必选 |
| Phase 1 | Prettier | `.prettierrc` `.prettierignore` | 必选 |
| Phase 1 | ESLint (flat config) | `eslint.config.js` | 必选 |
| Phase 1 | Ruff (Python) | `pyproject.toml [tool.ruff]` | 有 Python 时必选 |
| Phase 2 | husky + lint-staged | `.husky/` `package.json` | 必选 |
| Phase 2 | commitlint | `commitlint.config.js` | 必选 |
| Phase 2 | PR template | `.github/pull_request_template.md` | 必选 |
| Phase 3 | Vitest | `vitest.config.ts` 各包配置 | 有前端���必选 |
| Phase 4 | pytest + coverage | `pyproject.toml` | 有 Python 时必选 |
| Phase 5 | CI workflow | `.github/workflows/ci.yml` | 必选 |
| Phase 6 | CD workflows | `.github/workflows/deploy-*.yml` | 按需 |
| Phase 7 | Playwright E2E | `playwright.config.ts` `e2e/` | 推荐 |
| Phase 7 | 文档结构 | `docs/guides/` `docs/adr/` | 推荐 |
| Phase 7 | CODEOWNERS | `.github/CODEOWNERS` | 推荐 |
| Phase 7 | CLAUDE.md | `CLAUDE.md` | 推荐 |
| Phase 8 | Dependabot | `.github/dependabot.yml` | 推荐 |
| Phase 8 | knip 死代码检测 | `knip.config.ts` | 推荐 |
| Phase 8 | Entropy Scan | `.github/workflows/entropy-scan.yml` | 推荐 |

---

## 2. 前置条件

```bash
# 运行时
node >= 20
pnpm >= 9
python >= 3.11   # 如有后端

# 工具链（自动由 pnpm install 安装）
turbo             # Monorepo 任务编排
```

---

## 3. Phase 1 — 代码格式与质量

### 3.1 EditorConfig

> **作用：** 统一编辑器的缩进、换行符、字符编码等基础设置。

创建 `.editorconfig`：

```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.py]
indent_size = 4

[*.md]
trim_trailing_whitespace = false
```

### 3.2 Prettier

> **作用：** 统一前端代码风格，消除格式争论。

**安装：**

```bash
pnpm add -Dw prettier
```

**创建 `.prettierrc`：**

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

**创建 `.prettierignore`：**

```
dist/
node_modules/
.turbo/
coverage/
*.min.js
*.min.css
pnpm-lock.yaml
packages/backend/
.venv/
```

> **自定义提示：** `packages/backend/` 排除 Python 目录；如果项目无后端可删除此行。

**添加 scripts 到根 `package.json`���**

```json
{
  "scripts": {
    "format": "prettier --write \"packages/**/*.{ts,tsx,css,json,md}\"",
    "format:check": "prettier --check \"packages/**/*.{ts,tsx,css,json,md}\""
  }
}
```

**首次格式化���**

```bash
pnpm format
```

### 3.3 ESLint (Flat Config)

> **作用：** TypeScript + React 静态分析。使用 ESLint 9+/10 的 flat config 格式。

**安装：**

```bash
pnpm add -Dw eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh eslint-config-prettier globals
```

**确保根 `package.json` 包含：**

```json
{
  "type": "module"
}
```

**创建 `eslint.config.js`：**

```javascript
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: ['**/dist/', '**/node_modules/', '**/.turbo/', '**/coverage/'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['packages/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // --- 渐进式策略：先 warn，稳定后改 error ---
      'prefer-const': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      'react-hooks/rules-of-hooks': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  prettierConfig
);
```

> **渐进式升级路线：** 项目稳定后将 `warn` 逐步改为 `error`。优先升级 `react-hooks/rules-of-hooks` 和 `@typescript-eslint/no-unused-vars`。

**添加 scripts 和 turbo task：**

```json
// package.json
{
  "scripts": {
    "lint": "turbo lint"
  }
}

// turbo.json tasks
{
  "lint": {
    "dependsOn": ["^build"],
    "inputs": ["src/**/*.ts", "src/**/*.tsx", "eslint.config.*"]
  }
}
```

每个前端 `packages/*/package.json` 需要有：

```json
{
  "scripts": {
    "lint": "eslint src/"
  }
}
```

### 3.4 Ruff (Python)

> **作用：** Python 代码的 lint + format，替代 flake8 + isort + black。

**安装：**

```bash
pip install ruff   # 或 uv pip install ruff
```

**添加到 `packages/backend/pyproject.toml`：**

```toml
[tool.ruff]
line-length = 120
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "I", "UP", "B", "SIM"]
# E: pycodestyle, F: pyflakes, I: isort, UP: pyupgrade, B: bugbear, SIM: simplify

[tool.ruff.format]
quote-style = "double"
```

> **规则说明：**
> - `E` + `F`：基础的 pycodestyle 和 pyflakes
> - `I`：import 排序 (替代 isort)
> - `UP`：自动升级到更现代的 Python 语法
> - `B`：flake8-bugbear 常见错误检测
> - `SIM`：代码简化建议

**首次格式化：**

```bash
cd packages/backend
ruff check --fix app/
ruff format app/
```

---

## 4. Phase 2 — Git Hooks 与提交规范

### 4.1 husky + lint-staged

> **作用：** 在 `git commit` 时自动对暂存文件运行 lint 和 format。

**安装：**

```bash
pnpm add -Dw husky lint-staged
pnpm exec husky init
```

**创建 `.husky/pre-commit`：**

```
pnpm exec lint-staged
```

**在根 `package.json` 添加：**

```json
{
  "scripts": {
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{css,json,yml,yaml}": [
      "prettier --write"
    ],
    "*.md": [
      "prettier --write"
    ],
    "packages/backend/**/*.py": [
      "ruff check --fix",
      "ruff format"
    ]
  }
}
```

> **自定义提示：** 如果项目无 Python 后端，删除 `packages/backend/**/*.py` 段。如果前端不用 React，可调整 eslint 规则。

### 4.2 commitlint (Conventional Commits)

> **作用：** 强制 `<type>(<scope>): <subject>` 格式的提交消息。

**安装：**

```bash
pnpm add -Dw @commitlint/cli @commitlint/config-conventional
```

**创建 `.husky/commit-msg`：**

```
pnpm exec commitlint --edit $1
```

**创建 `commitlint.config.js`：**

```javascript
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        // ↓↓↓ 按项目实际 package 名称修改 ↓↓↓
        'app',
        'admin',
        'landing',
        'player',
        'shared',
        'backend',
        'gpu-worker',
        'infra',
        'docs',
      ],
    ],
    'scope-empty': [1, 'never'],  // warn，允许不写 scope 但建议写
  },
};
```

> **Conventional Commits 速查：**
>
> | Type | 用途 |
> |------|------|
> | `feat` | 新功能 |
> | `fix` | Bug 修复 |
> | `docs` | 文档变更 |
> | `style` | 格式变更（不影响逻辑） |
> | `refactor` | 重构（不新增功能、不修复 bug��� |
> | `test` | 测试相关 |
> | `chore` | 构建、依赖、工具 |
> | `ci` | CI/CD 变更 |

### 4.3 PR Template

**创建 `.github/pull_request_template.md`：**

```markdown
## Summary

<!-- Briefly describe what changed and why -->

## Type of Change

- [ ] `feat`: New feature
- [ ] `fix`: Bug fix
- [ ] `refactor`: Code refactoring
- [ ] `docs`: Documentation only
- [ ] `test`: Adding or updating tests
- [ ] `chore`: Build process or tooling
- [ ] `ci`: CI/CD changes

## Testing

<!-- How did you verify this change? -->

## Checklist

- [ ] Lint passes (`pnpm lint`)
- [ ] Tests pass (`pnpm test` / `pytest`)
- [ ] No hardcoded secrets or credentials
- [ ] API changes documented (if applicable)
- [ ] Self-reviewed the diff before requesting review
```

---

## 5. Phase 3 — 前端���试 (Vitest)

> **作用：** 基于 Vitest 4 + React Testing Library 的组件/单元测试。

### 5.1 安装

```bash
pnpm add -Dw vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### 5.2 根配置 (Workspace)

**��建 `vitest.config.ts`：**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // ↓↓↓ 列出所有前端 package 路径 ↓↓↓
    projects: [
      'packages/app',
      'packages/admin',
      'packages/landing',
      'packages/player',
      'packages/shared',
    ],
  },
});
```

> **注意：** Vitest 4 已移除 `defineWorkspace` 和 `vitest.workspace.ts`，改用 `test.projects`。

### 5.3 各 Package 配置

每个前端 package 创建 `vitest.config.ts`：

**React 应用包 (app/admin/landing/player)：**

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
```

**纯工具/类型包 (shared)：**

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
```

### 5.4 测试 Setup 文件

每个 React 包创建 `src/test/setup.ts`：

```typescript
import '@testing-library/jest-dom/vitest';
```

### 5.5 示例测试

创建 `src/__tests__/smoke.test.tsx`：

```tsx
import { describe, it, expect } from 'vitest';

describe('Package Smoke Test', () => {
  it('should pass', () => {
    expect(1 + 1).toBe(2);
  });
});
```

### 5.6 Scripts 和 Turbo Task

```json
// 根 package.json scripts
{
  "test": "vitest run --config vitest.config.ts",
  "test:watch": "vitest --config vitest.config.ts",
  "test:coverage": "vitest run --coverage --config vitest.config.ts"
}

// turbo.json task
{
  "test": {
    "dependsOn": ["^build"],
    "outputs": ["coverage/**"],
    "inputs": ["src/**", "tests/**", "**/*.test.ts", "**/*.test.tsx", "vitest.config.*"]
  }
}
```

---

## 6. Phase 4 — 后端��试 (pytest)

> **作用：** 为 Python 后端配置 pytest 标记分类和覆盖率。

**在 `pyproject.toml` 添加：**

```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
python_files = "test_*.py"
python_classes = "Test*"
python_functions = "test_*"
addopts = "--cov=app --cov-report=term-missing --cov-report=html:coverage/html"
markers = [
    "unit: Unit tests (no external dependencies)",
    "integration: Integration tests (requires database/Redis)",
    "e2e: End-to-end tests",
    "slow: Slow tests (>5s)",
]

[tool.coverage.run]
source = ["app"]
omit = [
    "app/migrations/*",
    "app/scripts/*",
    "app/initial_data.py",
    "app/seed_*.py",
]

[tool.coverage.report]
fail_under = 60
show_missing = true
exclude_lines = [
    "pragma: no cover",
    "if __name__ == .__main__.",
    "if TYPE_CHECKING:",
]
```

> **自定义提示：**
> - `source = ["app"]`：改为你的 Python 包目录名
> - `fail_under = 60`：项目初期可设为 40-60，稳定后逐步提高
> - `omit`：根据项目实际排除不需要覆盖的目录

**常用测试命令：**

```bash
cd packages/backend
pytest tests/ -v                     # 运行全部
pytest tests/ -m unit                # 只运行 unit 标记
pytest tests/ -m "not slow"          # 跳过慢测试
pytest tests/ --cov --cov-report=html  # 带 HTML 覆盖报告
```

---

## 7. Phase 5 — CI 持续集成

> **作用：** PR 触发自动检查 — lint、type-check、test、build 全部通过才可合并。

**创�� `.github/workflows/ci.yml`：**

```yaml
name: CI

on:
  pull_request:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - name: ESLint
        run: pnpm lint

      - name: Prettier check
        run: pnpm format:check

  lint-backend:
    name: Lint Backend
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install Ruff
        run: pip install ruff

      - name: Ruff check
        run: ruff check packages/backend/app/

      - name: Ruff format check
        run: ruff format --check packages/backend/app/

  type-check:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile
      - run: pnpm type-check

  test-frontend:
    name: Test Frontend
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - name: Run Vitest
        run: pnpm test:coverage

      - name: Upload frontend coverage
        uses: actions/upload-artifact@v4
        with:
          name: frontend-coverage
          path: packages/*/coverage/

  test-backend:
    name: Test Backend
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          cd packages/backend
          pip install -r requirements.txt

      - name: Run pytest
        run: |
          cd packages/backend
          python -m pytest tests/ -v --cov --cov-report=term-missing
        env:
          DATABASE_URL: sqlite:///./test.db
          SECRET_KEY: test-secret-key-for-ci
          ENVIRONMENT: test

      - name: Upload backend coverage
        uses: actions/upload-artifact@v4
        with:
          name: backend-coverage
          path: packages/backend/coverage/

  build:
    name: Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile
      - run: pnpm build
```

> **自定义提示：**
> - 如无 Python 后端，删除 `lint-backend` 和 `test-backend` jobs
> - 如无 TypeScript，删除 `type-check` job
> - `python-version` 和 `node-version` 按项目实际调整

---

## 8. Phase 6 — CD 持续部署 (GCP Cloud Run)

> **作用：** Staging 自动部署（push to main）+ Production 手动部署（需确认）。

### 8.1 Staging 自动部署

**创建 `.github/workflows/deploy-staging.yml`：**

```yaml
name: Deploy Staging

on:
  push:
    branches: [main]

concurrency:
  group: deploy-staging
  cancel-in-progress: false

jobs:
  deploy:
    name: Build & Deploy to Staging
    runs-on: ubuntu-latest
    environment: staging

    permissions:
      contents: read
      id-token: write

    steps:
      - uses: actions/checkout@v4

      - name: Authenticate to GCP
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker for Artifact Registry
        run: gcloud auth configure-docker ${{ vars.GCP_REGION }}-docker.pkg.dev

      - name: Build Docker image
        run: |
          docker build \
            -t ${{ vars.GCP_REGION }}-docker.pkg.dev/${{ vars.GCP_PROJECT_ID }}/<app-name>/app:${{ github.sha }} \
            -t ${{ vars.GCP_REGION }}-docker.pkg.dev/${{ vars.GCP_PROJECT_ID }}/<app-name>/app:staging-latest \
            .

      - name: Push Docker image
        run: |
          docker push ${{ vars.GCP_REGION }}-docker.pkg.dev/${{ vars.GCP_PROJECT_ID }}/<app-name>/app:${{ github.sha }}
          docker push ${{ vars.GCP_REGION }}-docker.pkg.dev/${{ vars.GCP_PROJECT_ID }}/<app-name>/app:staging-latest

      - name: Deploy to Cloud Run (staging)
        run: |
          gcloud run deploy <app-name>-staging \
            --image ${{ vars.GCP_REGION }}-docker.pkg.dev/${{ vars.GCP_PROJECT_ID }}/<app-name>/app:${{ github.sha }} \
            --region ${{ vars.GCP_REGION }} \
            --platform managed \
            --allow-unauthenticated \
            --set-env-vars "ENVIRONMENT=staging"

      - name: Smoke test
        run: |
          STAGING_URL=$(gcloud run services describe <app-name>-staging --region ${{ vars.GCP_REGION }} --format 'value(status.url)')
          curl -sf "${STAGING_URL}/api/v1/health" || (echo "Smoke test failed!" && exit 1)
```

> **替换 `<app-name>`** 为项目实际名称（如 `digitspace`）。

### 8.2 Production 手动部署

**创建 `.github/workflows/deploy-production.yml`：**

```yaml
name: Deploy Production

on:
  workflow_dispatch:
    inputs:
      confirm:
        description: 'Type "deploy" to confirm production deployment'
        required: true
        type: string

concurrency:
  group: deploy-production
  cancel-in-progress: false

jobs:
  validate:
    name: Validate Input
    runs-on: ubuntu-latest
    steps:
      - name: Check confirmation
        if: github.event.inputs.confirm != 'deploy'
        run: |
          echo "Deployment not confirmed. Type 'deploy' to proceed."
          exit 1

  deploy:
    name: Deploy to Production
    needs: validate
    runs-on: ubuntu-latest
    environment: production

    permissions:
      contents: read
      id-token: write

    steps:
      - uses: actions/checkout@v4

      - name: Authenticate to GCP
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker for Artifact Registry
        run: gcloud auth configure-docker ${{ vars.GCP_REGION }}-docker.pkg.dev

      - name: Promote staging image to production
        run: |
          docker pull ${{ vars.GCP_REGION }}-docker.pkg.dev/${{ vars.GCP_PROJECT_ID }}/<app-name>/app:staging-latest
          docker tag \
            ${{ vars.GCP_REGION }}-docker.pkg.dev/${{ vars.GCP_PROJECT_ID }}/<app-name>/app:staging-latest \
            ${{ vars.GCP_REGION }}-docker.pkg.dev/${{ vars.GCP_PROJECT_ID }}/<app-name>/app:production-${{ github.sha }}
          docker push ${{ vars.GCP_REGION }}-docker.pkg.dev/${{ vars.GCP_PROJECT_ID }}/<app-name>/app:production-${{ github.sha }}

      - name: Deploy to Cloud Run (production)
        run: |
          gcloud run deploy <app-name>-production \
            --image ${{ vars.GCP_REGION }}-docker.pkg.dev/${{ vars.GCP_PROJECT_ID }}/<app-name>/app:production-${{ github.sha }} \
            --region ${{ vars.GCP_REGION }} \
            --platform managed \
            --allow-unauthenticated \
            --set-env-vars "ENVIRONMENT=production"

      - name: Smoke test
        run: |
          PROD_URL=$(gcloud run services describe <app-name>-production --region ${{ vars.GCP_REGION }} --format 'value(status.url)')
          curl -sf "${PROD_URL}/api/v1/health" || (echo "Production smoke test failed!" && exit 1)
```

### 8.3 GitHub 环境配置要求

| 类型 | 名称 | 说明 |
|------|------|------|
| Secret | `GCP_SA_KEY` | GCP Service Account JSON Key |
| Variable | `GCP_PROJECT_ID` | GCP 项目 ID |
| Variable | `GCP_REGION` | 部署区域，如 `asia-southeast1` |

在 GitHub → Settings → Environments 中分别创建 `staging` 和 `production` 环境。

---

## 9. Phase 7 — E2E 测试、文档、Code Review

### 9.1 Playwright E2E

**安装���**

```bash
pnpm add -Dw @playwright/test
pnpm exec playwright install chromium
```

**创建 `playwright.config.ts`��**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    baseURL: 'http://localhost:3001',   // ← 改为项目实际端口
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // 取消注释可启用多浏览器 CI 测试：
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
  ],
  webServer: {
    command: 'pnpm dev:app',            // ← 改为项目实际启动命令
    url: 'http://localhost:3001',       // ← 同上
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
```

**创建示例测试 `e2e/example.spec.ts`：**

```typescript
import { test, expect } from '@playwright/test';

test('app loads successfully', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/.*/);
});
```

**添加 scripts：**

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

**添加到 `.gitignore`：**

```
# Playwright
test-results/
playwright-report/
blob-report/
```

**Turbo task：**

```json
{
  "test:e2e": {
    "dependsOn": ["build"],
    "cache": false
  }
}
```

### 9.2 文档结构

推荐的文档目录结构：

```
docs/
├── README.md              # 文档首页/索引
├── guides/
│   ├── getting-started.md    # 新人上手
│   ├── development-workflow.md  # 开发流程
���   ├── testing-guide.md         # 测试指南
│   └── deployment-guide.md      # 部署指南
├── adr/
│   ├── README.md              # ADR 索引
│   └── 0001-harness-engineering.md  # 第一条 ADR
├── api/
│   └── README.md              # API 文档入口
├── specs/                     # 设计文档
└── architecture/              # 架构文档
```

### 9.3 CODEOWNERS

**创建 `.github/CODEOWNERS`：**

```
# Default reviewer for all changes
* @<github-username>

# Frontend packages
packages/app/        @<github-username>
packages/admin/      @<github-username>

# Backend
packages/backend/    @<github-username>

# Infrastructure
.github/             @<github-username>

# Documentation
docs/                @<github-username>
```

> **随团队扩大更新：** 添加其他成员和 GitHub Team handles。

### 9.4 CLAUDE.md (Agent Feedforward)

> **作用：** 项目级别的 AI Agent 上下文指引，让 Claude Code / Copilot 等工具快速了解项目规范。

**创建 `CLAUDE.md`：**

```markdown
# <Project Name> Project Conventions

## Architecture
- Monorepo: pnpm 9 + Turbo
- Frontend: React 19 + Vite 6 + TypeScript 5.8 + TailwindCSS
- Backend: Python 3.11 + FastAPI + SQLAlchemy 2.0
- State: Zustand | Database: PostgreSQL (Supabase)

## Code Style
- Frontend: ESLint flat config + Prettier (see `eslint.config.js`, `.prettierrc`)
- Backend: Ruff (see `pyproject.toml` `[tool.ruff]`)
- Commits: Conventional Commits `<type>(<scope>): <subject>`
- Scopes: <list-your-scopes>

## Testing
- Frontend: `pnpm test` (Vitest) | `pnpm test:e2e` (Playwright)
- Backend: `cd packages/backend && pytest tests/ -v`

## Package Structure
- `packages/app` — Main app (port 3001)
- `packages/shared` — Shared types, utils, components
- `packages/backend` — FastAPI server (port 8000)
```

### 9.5 Branch Protection (手动配置)

GitHub → Settings → Branches → Add rule → Branch name: `main`

| 设置 | 值 |
|------|-----|
| Require PR before merging | 1 approval |
| Require status checks | Lint, Lint Backend, Type Check, Test Frontend, Test Backend, Build |
| Require up to date | Yes |
| Enforce admins | No (方便紧急修复) |

> **注意：** 需要 CI workflow 至少运行一次后，status checks 名称才会出现在选项中。

---

## 10. Phase 8 — 熵管理 (Entropy Management)

> **作用：** 自动化检测依赖过期、死代码堆积、技术债增长等熵增问题。

### 10.1 Dependabot

**创建 `.github/dependabot.yml`：**

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
      day: monday
    open-pull-requests-limit: 10
    groups:
      dev-dependencies:
        dependency-type: development
      production-dependencies:
        dependency-type: production

  - package-ecosystem: pip
    directory: /packages/backend
    schedule:
      interval: weekly
      day: monday
    open-pull-requests-limit: 5

  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 5
```

### 10.2 knip 死代码检测

**安装：**

```bash
pnpm add -Dw knip
```

**创建 `knip.config.ts`��**

```typescript
import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  workspaces: {
    '.': {
      entry: ['packages/*/src/main.{ts,tsx}', 'packages/*/src/index.ts'],
      ignoreDependencies: ['turbo'],
    },
    // ↓↓↓ 按项目实际 package 列出 ↓↓↓
    'packages/app': {
      entry: ['src/main.tsx'],
      ignore: ['src/vite-env.d.ts'],
    },
    'packages/shared': {
      entry: ['src/index.ts'],
    },
  },
};

export default config;
```

**添加 script：**

```json
{
  "scripts": {
    "knip": "knip"
  }
}
```

### 10.3 Entropy Scan 定时工作流

**创建 `.github/workflows/entropy-scan.yml`：**

```yaml
name: Entropy Scan

on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday 9am UTC
  workflow_dispatch:

jobs:
  dead-code:
    name: Dead Code Detection
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - name: Run knip
        run: pnpm knip
        continue-on-error: true

  todo-count:
    name: TODO Tracking
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Count TODOs
        run: |
          echo "## TODO Count" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "| Pattern | Count |" >> $GITHUB_STEP_SUMMARY
          echo "|---------|-------|" >> $GITHUB_STEP_SUMMARY
          TODO_COUNT=$(grep -r "TODO" --include="*.ts" --include="*.tsx" --include="*.py" packages/ | wc -l || echo 0)
          FIXME_COUNT=$(grep -r "FIXME" --include="*.ts" --include="*.tsx" --include="*.py" packages/ | wc -l || echo 0)
          HACK_COUNT=$(grep -r "HACK" --include="*.ts" --include="*.tsx" --include="*.py" packages/ | wc -l || echo 0)
          echo "| TODO | $TODO_COUNT |" >> $GITHUB_STEP_SUMMARY
          echo "| FIXME | $FIXME_COUNT |" >> $GITHUB_STEP_SUMMARY
          echo "| HACK | $HACK_COUNT |" >> $GITHUB_STEP_SUMMARY
```

---

## 11. 验收检查清单

新项目完成配置后，依次运行以下命令确认：

```bash
# 1. ESLint — 应退出码 0（warnings OK）
pnpm lint

# 2. Prettier — 应显示 "All matched files use Prettier code style!"
pnpm format:check

# 3. Vitest — 应显示所有测试 passed
pnpm test

# 4. Build — 应成功（如有 TS 错误需先修复��
pnpm build

# 5. 后端测试（如有）
cd packages/backend && pytest tests/ -v

# 6. Commit Hook 验证 — 应触发 lint-staged + commitlint
echo "" >> README.md
git add README.md
git commit -m "chore: verify commit hooks"
git reset --soft HEAD~1 && git checkout README.md

# 7. knip — 信息性输出（不要求零报告）
pnpm knip
```

---

## 12. 新项目导入指引

### 快速导入步骤

1. **复制基础配置文件：**
   ```
   .editorconfig
   .prettierrc
   .prettierignore
   eslint.config.js
   commitlint.config.js
   turbo.json
   ```

2. **安装依赖：**
   ```bash
   pnpm add -Dw prettier eslint @eslint/js typescript-eslint \
     eslint-plugin-react-hooks eslint-plugin-react-refresh \
     eslint-config-prettier globals husky lint-staged \
     @commitlint/cli @commitlint/config-conventional \
     vitest @vitest/coverage-v8 @testing-library/react \
     @testing-library/jest-dom @testing-library/user-event jsdom \
     @playwright/test knip
   ```

3. **初始化 husky：**
   ```bash
   pnpm exec husky init
   # 然后创建 .husky/pre-commit 和 .husky/commit-msg
   ```

4. **按项目调整：**
   - `commitlint.config.js` → 修改 `scope-enum` 为实际 package 名
   - `vitest.config.ts` → 修改 `projects` 列表
   - `knip.config.ts` → 修改 `workspaces`
   - `playwright.config.ts` → 修改 `baseURL` 和 `webServer.command`
   - `.github/workflows/*.yml` → 修改应用名称和部署配置

5. **首次格式化 + commit：**
   ```bash
   pnpm format
   git add -A
   git commit -m "chore(infra): bootstrap harness engineering"
   ```

### 部分导入

如果项目不需要全部模块：

| 场景 | 推荐模块 |
|------|----------|
| 最小可行 | Phase 1 (格式) + Phase 2 (hooks) |
| + 测试 | + Phase 3 (Vitest) |
| + CI | + Phase 5 (CI workflow) |
| 完整版 | 全部 Phase 1-8 |

---

## 13. 版本依赖参考

| 包 | 版本 | 用途 |
|----|------|------|
| `prettier` | ^3.8 | 代码格式化 |
| `eslint` | ^10.2 | 静态分析 |
| `@eslint/js` | ^10.0 | ESLint 核心规则 |
| `typescript-eslint` | ^8.58 | TypeScript ESLint |
| `eslint-plugin-react-hooks` | ^7.0 | React Hooks 规则 |
| `eslint-plugin-react-refresh` | ^0.5 | React Fast Refresh |
| `eslint-config-prettier` | ^10.1 | ESLint × Prettier 兼容 |
| `globals` | ^17.4 | ESLint 全局变量定义 |
| `husky` | ^9.1 | Git hooks |
| `lint-staged` | ^16.4 | 暂存文件 lint |
| `@commitlint/cli` | ^20.5 | 提交消息校验 |
| `@commitlint/config-conventional` | ^20.5 | Conventional Commits 规则 |
| `vitest` | ^4.1 | 前端测试 |
| `@vitest/coverage-v8` | ^4.1 | 覆盖率 |
| `@testing-library/react` | ^16.3 | React 组件测试 |
| `@testing-library/jest-dom` | ^6.9 | DOM 断�� |
| `@testing-library/user-event` | ^14.6 | 用户交互模拟 |
| `jsdom` | ^29.0 | 浏览器 DOM 模拟 |
| `@playwright/test` | ^1.59 | E2E 测试 |
| `knip` | ^6.3 | 死代码检测 |
| `ruff` | ^0.15 | Python lint + format |

---

> **维护说明：** 本文档随团队实践演进更新。修改时请同步更新版本号和日期。
