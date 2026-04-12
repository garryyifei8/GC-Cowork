-- 20260411_knowledge_embeddings.sql
-- 启用 pgvector 扩展并建立知识库向量表
-- 维度 512 对应 FastEmbed bge-small-zh-v1.5

create extension if not exists vector;

create table if not exists knowledge_embeddings (
    id           text primary key,
    title        text not null,
    content      text not null,
    category     text not null default 'general',
    tags         text[] default '{}',
    project_id   text,
    department   text,
    metadata     jsonb default '{}'::jsonb,
    embedding    vector(512) not null,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now()
);

-- HNSW 索引：m=16, ef_construction=64 为 pgvector 官方推荐起点
create index if not exists knowledge_embeddings_embedding_idx
    on knowledge_embeddings
    using hnsw (embedding vector_cosine_ops)
    with (m = 16, ef_construction = 64);

-- 常用过滤列的 btree 索引
create index if not exists knowledge_embeddings_category_idx
    on knowledge_embeddings (category);

create index if not exists knowledge_embeddings_project_id_idx
    on knowledge_embeddings (project_id)
    where project_id is not null;

-- updated_at 触发器（复用 init_schema.sql 中已定义的 update_updated_at_column 函数）
create trigger knowledge_embeddings_updated_at
    before update on knowledge_embeddings
    for each row execute function update_updated_at_column();
