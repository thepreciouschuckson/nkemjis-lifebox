create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  link text not null default '',
  image text not null default '',
  notes text not null default '',
  tags text[] not null default '{}',
  status text not null default 'want',
  extra jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists items_category_idx on items (category);
