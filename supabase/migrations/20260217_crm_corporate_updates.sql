-- Create table for Rateio (Apportionments)
create table if not exists rateios (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create table for Hiring Reasons
create table if not exists hiring_reasons (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create table for Termination Initiatives (Colaborador, Escritório, etc.)
create table if not exists termination_initiatives (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create table for Termination Types (Ativo do SKA, etc.)
create table if not exists termination_types (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create table for Termination Reasons
create table if not exists termination_reasons (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  initiative_id uuid references termination_initiatives(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add new columns to collaborators
alter table collaborators add column if not exists rateio_id uuid references rateios(id);
alter table collaborators add column if not exists hiring_reason_id uuid references hiring_reasons(id);
alter table collaborators add column if not exists termination_initiative_id uuid references termination_initiatives(id);
alter table collaborators add column if not exists termination_type_id uuid references termination_types(id);
alter table collaborators add column if not exists termination_reason_id uuid references termination_reasons(id);

-- Seed Data

-- Termination Initiatives
insert into termination_initiatives (name) values 
('Colaborador'), 
('Escritório')
on conflict do nothing;

-- Termination Types
insert into termination_types (name) values 
('Ativo do SKA'),
('Outros'),
('Passivo Integrante'),
('Rescisão contratual por parte do cliente'),
('Término do contrato de estágio')
on conflict do nothing;

-- Hiring Reasons
insert into hiring_reasons (name) values
('Aumento de quadro'),
('Substituição'),
('Fusão'),
('Temporário')
on conflict do nothing;

-- Termination Reasons (Mapping to Initiatives)
do $$
declare
  colab_id uuid;
  office_id uuid;
begin
  select id into colab_id from termination_initiatives where name = 'Colaborador';
  select id into office_id from termination_initiatives where name = 'Escritório';

  -- Motivos Colaborador
  insert into termination_reasons (name, initiative_id) values
  ('Mudança de área profissional', colab_id),
  ('Mudança de Escritório', colab_id),
  ('Dedicação aos estudos', colab_id),
  ('Incompatibilidade', colab_id),
  ('Intercâmbio', colab_id),
  ('Recebeu proposta melhor', colab_id),
  ('Motivos pessoais', colab_id)
  on conflict do nothing; -- Note: termination_reasons might not have unique constraint on name, duplicate check might be needed if re-running

  -- Motivos Escritório
  insert into termination_reasons (name, initiative_id) values
  ('Baixo desempenho', office_id),
  ('Contrato de férias', office_id),
  ('Encerramento do contrato', office_id),
  ('Incompatibilidade', office_id), -- Duplicate name, different initiative
  ('Reorganização da área', office_id),
  ('Rescisão contratual por parte do cliente', office_id),
  ('Substituição', office_id),
  ('Temporário', office_id)
  on conflict do nothing;
end $$;

-- Enable RLS (if not already enabled, good practice)
alter table rateios enable row level security;
alter table hiring_reasons enable row level security;
alter table termination_initiatives enable row level security;
alter table termination_types enable row level security;
alter table termination_reasons enable row level security;

-- Policies (Public read, Authenticated write for simplicity as per current pattern)
create policy "Enable read access for all users" on rateios for select using (true);
create policy "Enable insert for authenticated users only" on rateios for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users only" on rateios for update using (auth.role() = 'authenticated');
create policy "Enable delete for authenticated users only" on rateios for delete using (auth.role() = 'authenticated');

create policy "Enable read access for all users" on hiring_reasons for select using (true);
create policy "Enable insert for authenticated users only" on hiring_reasons for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users only" on hiring_reasons for update using (auth.role() = 'authenticated');
create policy "Enable delete for authenticated users only" on hiring_reasons for delete using (auth.role() = 'authenticated');

create policy "Enable read access for all users" on termination_initiatives for select using (true);
create policy "Enable insert for authenticated users only" on termination_initiatives for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users only" on termination_initiatives for update using (auth.role() = 'authenticated');
create policy "Enable delete for authenticated users only" on termination_initiatives for delete using (auth.role() = 'authenticated');

create policy "Enable read access for all users" on termination_types for select using (true);
create policy "Enable insert for authenticated users only" on termination_types for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users only" on termination_types for update using (auth.role() = 'authenticated');
create policy "Enable delete for authenticated users only" on termination_types for delete using (auth.role() = 'authenticated');

create policy "Enable read access for all users" on termination_reasons for select using (true);
create policy "Enable insert for authenticated users only" on termination_reasons for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users only" on termination_reasons for update using (auth.role() = 'authenticated');
create policy "Enable delete for authenticated users only" on termination_reasons for delete using (auth.role() = 'authenticated');
