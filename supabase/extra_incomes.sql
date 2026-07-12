create table if not exists public.extra_incomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cycle_id uuid not null references public.monthly_cycles(id) on delete cascade,
  income_date date not null,
  source text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'CRC' check (currency in ('CRC', 'USD')),
  exchange_rate numeric(12, 4) not null default 1 check (exchange_rate > 0),
  amount_crc numeric(12, 2) not null default 0 check (amount_crc >= 0),
  created_at timestamptz not null default now()
);

alter table public.extra_incomes
  add column if not exists currency text not null default 'CRC'
    check (currency in ('CRC', 'USD'));

alter table public.extra_incomes
  add column if not exists exchange_rate numeric(12, 4) not null default 1
    check (exchange_rate > 0);

alter table public.extra_incomes
  add column if not exists amount_crc numeric(12, 2) not null default 0
    check (amount_crc >= 0);

update public.extra_incomes
set
  currency = coalesce(currency, 'CRC'),
  exchange_rate = coalesce(exchange_rate, 1),
  amount_crc = case
    when coalesce(amount_crc, 0) > 0 then amount_crc
    when coalesce(currency, 'CRC') = 'USD' then amount * coalesce(exchange_rate, 1)
    else amount
  end
where amount_crc = 0 or amount_crc is null;

alter table public.extra_incomes enable row level security;

create index if not exists extra_incomes_user_id_idx
  on public.extra_incomes(user_id);

create index if not exists extra_incomes_cycle_id_idx
  on public.extra_incomes(cycle_id);

drop policy if exists "Users can read their own extra incomes"
  on public.extra_incomes;

drop policy if exists "Users can insert their own extra incomes"
  on public.extra_incomes;

drop policy if exists "Users can update their own extra incomes"
  on public.extra_incomes;

drop policy if exists "Users can delete their own extra incomes"
  on public.extra_incomes;

create policy "Users can read their own extra incomes"
  on public.extra_incomes
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own extra incomes"
  on public.extra_incomes
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own extra incomes"
  on public.extra_incomes
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own extra incomes"
  on public.extra_incomes
  for delete
  using (auth.uid() = user_id);
