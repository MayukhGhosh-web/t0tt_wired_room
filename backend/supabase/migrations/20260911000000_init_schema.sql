-- Drop old tables from previous setup
DROP TABLE IF EXISTS article_entities CASCADE;
DROP TABLE IF EXISTS entities CASCADE;
DROP TABLE IF EXISTS entity_aliases CASCADE;
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS trends CASCADE;
DROP TABLE IF EXISTS clusters CASCADE;

create extension if not exists vector;
create extension if not exists pg_cron;
create extension if not exists pg_net;

create table clusters (
    id             uuid primary key default gen_random_uuid(),
    label          text,
    centroid       vector(768),
    entity_set     text[],
    status         text default 'active',
    last_updated   timestamptz default now(),
    created_at     timestamptz default now()
);

create table articles (
    id            uuid primary key default gen_random_uuid(),
    source_name   text not null,
    source_lean   text,
    title         text not null,
    snippet       text,
    url           text not null,
    published_at  timestamptz,
    embedding     vector(768),
    cluster_id    uuid references clusters(id),
    created_at    timestamptz default now()
);

create table entities (
    id              text primary key,
    canonical_name  text not null,
    entity_type     text not null,
    description     text,
    image_url       text,
    wikidata_qid    text unique,
    created_at      timestamptz default now()
);

create table entity_aliases (
    alias_text  text primary key,
    entity_id   text not null references entities(id),
    source      text not null,
    created_at  timestamptz default now()
);

create table article_entities (
    article_id    uuid not null references articles(id),
    entity_id     text not null references entities(id),
    role          text,
    primary key (article_id, entity_id)
);

create index on article_entities (entity_id);
create index on article_entities (article_id);
create index on entity_aliases (entity_id);

-- Schedule ingestion to run every 15 minutes
SELECT cron.schedule(
    'ingest-job',
    '*/15 * * * *',
    $$
    SELECT net.http_post(
        url:='https://mmnxzumlspuxrvzkdynj.supabase.co/functions/v1/ingest',
        headers:='{"Authorization": "Bearer sb_publishable_KDwhhGU_wDzQ-Fv2rIdhew_UgN6t6E2"}'::jsonb
    );
    $$
);
