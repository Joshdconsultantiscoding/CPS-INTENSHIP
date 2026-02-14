-- specific appeals table
create table if not exists public.appeals (
  id uuid primary key default gen_random_uuid(),
  user_id text references public.profiles(id) on delete cascade not null,
  email text,
  reason text not null,
  status text check (status in ('pending', 'approved', 'rejected', 'ignored')) default 'pending',
  admin_notes text,
  reviewed_by text references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.appeals enable row level security;

-- Policies
create policy "Users can view their own appeals"
  on public.appeals for select
  using (
    -- If using Supabase Auth with Clerk, auth.uid() might be UUID, need to cast or rely on custom claim
    -- Assuming auth.uid() is the user ID string from the JWT
    (select auth.jwt() ->> 'sub') = user_id
  );

create policy "Users can create their own appeals"
  on public.appeals for insert
  with check (
    (select auth.jwt() ->> 'sub') = user_id
  );

create policy "Admins can view all appeals"
  on public.appeals for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.jwt() ->> 'sub')
      and profiles.role = 'admin'
    )
  );

create policy "Admins can update appeals"
  on public.appeals for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.jwt() ->> 'sub')
      and profiles.role = 'admin'
    )
  );

-- Function to handle appeal approval (restore user)
create or replace function handle_appeal_decision()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.status = 'approved' and old.status != 'approved' then
    -- Restore the user account
    update public.profiles
    set account_status = 'active',
        suspended_reason = null
    where id = new.user_id;
  end if;
  return new;
end;
$$;

-- Trigger for appeal approval
create trigger on_appeal_decision
  after update on public.appeals
  for each row
  execute function handle_appeal_decision();
