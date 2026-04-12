# GC-TeamWork 阿里云部署手册

> 适用环境：阿里云 ECS + ACR + Supabase Cloud + DeepSeek API  
> 维护者：运维团队  
> 最后更新：2026-04

---

## 1. 架构概览

```
用户浏览器
    │
    ▼ HTTPS/HTTP
阿里云 SLB（负载均衡）
    │
    ├─► gc-frontend（Nginx:80，Docker）
    │       │  /api/* 反向代理
    │       ▼
    │   gc-backend（uvicorn:8000，Docker）
    │       │
    │       ├─► Supabase Cloud（PostgreSQL + pgvector）
    │       └─► DeepSeek API（LLM 推理）
    │
    └─► （Wave 2）Sentry / 日志平台
```

---

## 2. 前置条件

| 资源 | 规格 / 说明 |
|------|-----------|
| ECS | c7.large（2vCPU 4GB）及以上，Ubuntu 22.04 LTS |
| 系统盘 | ≥40 GB，数据盘可选 |
| 阿里云 ACR | 标准版，华东一（cn-hangzhou）或按实际 region |
| Supabase | 已创建生产项目，获取 URL / Anon Key / Service Role Key |
| DeepSeek | 已申请 API Key |
| 域名（可选） | 已备案，SLB 绑定 SSL 证书 |

---

## 3. ACR 仓库配置

```bash
# 登录 ACR（替换为实际 registry 地址）
REGISTRY=registry.cn-hangzhou.aliyuncs.com
NAMESPACE=gc-teamwork

# 在控制台创建以下两个镜像仓库（或通过 CLI）：
#   ${REGISTRY}/${NAMESPACE}/backend
#   ${REGISTRY}/${NAMESPACE}/frontend
```

---

## 4. 本地构建并推送镜像

```bash
# 获取当前 git SHA（8位）
GIT_SHA=$(git rev-parse --short=8 HEAD)

REGISTRY=registry.cn-hangzhou.aliyuncs.com
NAMESPACE=gc-teamwork

# 登录 ACR
docker login ${REGISTRY} \
  --username=<阿里云账号> \
  --password=<ACR 登录密码>

# 构建并推送 backend
docker build -t ${REGISTRY}/${NAMESPACE}/backend:${GIT_SHA} \
             -t ${REGISTRY}/${NAMESPACE}/backend:latest \
             -f Dockerfile .
docker push ${REGISTRY}/${NAMESPACE}/backend:${GIT_SHA}
docker push ${REGISTRY}/${NAMESPACE}/backend:latest

# 构建并推送 frontend
docker build -t ${REGISTRY}/${NAMESPACE}/frontend:${GIT_SHA} \
             -t ${REGISTRY}/${NAMESPACE}/frontend:latest \
             -f frontend/Dockerfile .
docker push ${REGISTRY}/${NAMESPACE}/frontend:${GIT_SHA}
docker push ${REGISTRY}/${NAMESPACE}/frontend:latest

echo "镜像已推送：${GIT_SHA}"
```

---

## 5. ECS 首次初始化

```bash
# 5.1 安装 Docker（Ubuntu 22.04）
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker $USER

# 5.2 登录 ACR（ECS 侧）
docker login registry.cn-hangzhou.aliyuncs.com \
  --username=<阿里云账号> \
  --password=<ACR 登录密码>

# 5.3 创建应用目录
sudo mkdir -p /opt/gc-teamwork
sudo chown $USER:$USER /opt/gc-teamwork
cd /opt/gc-teamwork
```

---

## 6. 生产 docker-compose.yml（使用 ACR 镜像）

在 `/opt/gc-teamwork/docker-compose.yml` 创建如下内容：

```yaml
name: gc-teamwork

services:
  backend:
    image: registry.cn-hangzhou.aliyuncs.com/gc-teamwork/backend:${IMAGE_TAG:-latest}
    container_name: gc-backend
    restart: unless-stopped
    env_file: .env.production
    expose:
      - "8000"
    ports:
      - "8000:8000"
    healthcheck:
      test: ["CMD", "curl", "-fsS", "http://localhost:8000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 30s
    networks:
      - gc-net

  frontend:
    image: registry.cn-hangzhou.aliyuncs.com/gc-teamwork/frontend:${IMAGE_TAG:-latest}
    container_name: gc-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - gc-net

networks:
  gc-net:
    driver: bridge
```

---

## 7. 配置 .env.production

```bash
cd /opt/gc-teamwork

# 从模板生成配置文件
cp .env.production.example .env.production

# 编辑填写真实值
nano .env.production

# 收紧权限，防止其他用户读取密钥
chmod 600 .env.production
```

`.env.production` 必填项：

```
LLM_API_KEY=sk-xxxx
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres
```

---

## 8. 首次启动 + 数据库迁移

```bash
cd /opt/gc-teamwork

# 拉取最新镜像
IMAGE_TAG=<GIT_SHA> docker compose pull

# 启动服务
IMAGE_TAG=<GIT_SHA> docker compose up -d

# 查看日志，确认启动成功
docker compose logs -f --tail=50

# 执行数据库迁移（如有 Supabase migrations）
docker exec gc-backend python -m src.db.migrate
# 或通过 Supabase CLI 在本地执行：
# supabase db push --db-url $DATABASE_URL

# 可选：向量知识库初始化 ingest
# docker exec gc-backend python -m scripts.ingest --source ./data
```

---

## 9. 安全组规则

| 方向 | 端口 | 来源 | 说明 |
|------|------|------|------|
| 入站 | 80 | SLB 安全组 | HTTP 流量（由 SLB 转发） |
| 入站 | 443 | SLB 安全组 | HTTPS 流量（由 SLB 转发） |
| 入站 | 22 | 跳板机 IP | SSH 管理 |
| 入站 | 8000 | 禁止公网 | backend 仅内网访问 |
| 出站 | ALL | 0.0.0.0/0 | 允许访问 Supabase / DeepSeek |

---

## 10. 验证部署

```bash
# 10.1 检查容器状态
docker compose ps

# 10.2 Backend 健康检查
curl -fsS http://localhost:8000/health
# 预期返回：{"status":"ok"} 或类似

# 10.3 Frontend 可达性
curl -fsS -o /dev/null -w "%{http_code}" http://localhost:80/
# 预期返回：200

# 10.4 通过 SLB 公网验证
curl -fsS https://<your-domain>/health
```

---

## 11. 滚动更新流程

```bash
cd /opt/gc-teamwork

# 1. 在开发机构建并推送新镜像（见第 4 节），记录新的 GIT_SHA
NEW_SHA=<新的 GIT_SHA>

# 2. 在 ECS 上拉取新镜像
IMAGE_TAG=${NEW_SHA} docker compose pull

# 3. 滚动重启（backend 先，等健康后 frontend 跟上）
IMAGE_TAG=${NEW_SHA} docker compose up -d --no-deps backend
# 等待 backend 健康（约 30s）
docker compose ps backend

IMAGE_TAG=${NEW_SHA} docker compose up -d --no-deps frontend

# 4. 验证
curl -fsS http://localhost:8000/health
echo "部署完成：${NEW_SHA}"
```

---

## 12. 回滚流程

```bash
cd /opt/gc-teamwork

# 回滚到上一个已知可用版本
ROLLBACK_SHA=<上一个稳定版本的 GIT_SHA>

IMAGE_TAG=${ROLLBACK_SHA} docker compose up -d --no-deps backend
IMAGE_TAG=${ROLLBACK_SHA} docker compose up -d --no-deps frontend

# 确认回滚成功
docker compose ps
curl -fsS http://localhost:8000/health
echo "已回滚至：${ROLLBACK_SHA}"
```

> **提示：** 每次部署前记录当前运行的 IMAGE_TAG，存入 `/opt/gc-teamwork/CURRENT_SHA` 文件，便于快速回滚。

---

## 13. 监控检查清单

- [ ] **ECS 监控**：CPU 使用率 < 70%，内存使用率 < 80%（云监控告警）
- [ ] **容器健康**：`docker compose ps` 所有服务状态为 `healthy`
- [ ] **日志轮转**：配置 Docker log driver 限制大小
  ```bash
  # /etc/docker/daemon.json
  {
    "log-driver": "json-file",
    "log-opts": { "max-size": "50m", "max-file": "5" }
  }
  ```
- [ ] **Supabase 备份**：确认每日自动备份已开启（Supabase Dashboard → Database → Backups）
- [ ] **ACR 镜像清理**：保留最近 10 个 tag，定期删除旧镜像
- [ ] **SSL 证书**：SLB 证书有效期 > 30 天
- [ ] **API Key 轮换**：DeepSeek Key 建议每季度轮换

---

## 14. 故障排查

### ACR 拉取失败

```bash
# 重新登录 ACR
docker login registry.cn-hangzhou.aliyuncs.com \
  --username=<账号> --password=<密码>

# 检查网络连通性
curl -I https://registry.cn-hangzhou.aliyuncs.com

# 确认镜像 tag 存在
docker manifest inspect registry.cn-hangzhou.aliyuncs.com/gc-teamwork/backend:<SHA>
```

### Backend 启动失败

```bash
# 查看详细日志
docker compose logs backend --tail=100

# 常见原因：
# 1. .env.production 缺少必填变量 → 检查 LLM_API_KEY、DATABASE_URL
# 2. Supabase 连接超时 → 确认安全组出站规则放通 5432/443
# 3. 端口 8000 已被占用 → lsof -i:8000
```

### FastEmbed 首次下载模型慢

```bash
# FastEmbed 首次启动会下载 Embedding 模型（约 90MB）
# 可提前在容器内预下载：
docker exec gc-backend python -c "
from fastembed import TextEmbedding
model = TextEmbedding('BAAI/bge-small-zh-v1.5')
print('模型缓存完成')
"
# 之后重启容器即可秒级启动
```

### pgvector 扩展缺失

```bash
# 在 Supabase SQL Editor 执行：
CREATE EXTENSION IF NOT EXISTS vector;

# 验证
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
```
