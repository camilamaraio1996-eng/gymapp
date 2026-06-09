-- GymApp Database Schema
-- Run this in your Supabase SQL Editor

-- Enable RLS
alter table auth.users enable row level security;

-- Profiles table (linked to auth.users)
create table if not exists public.profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade unique not null,
  role text not null check (role in ('admin', 'profesor', 'alumno')) default 'alumno',
  nombre text not null,
  apellido text not null,
  email text not null,
  telefono text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Profesores table
create table if not exists public.profesores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  nombre text not null,
  apellido text not null,
  especialidad text,
  email text not null unique,
  telefono text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Alumnos table
create table if not exists public.alumnos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  nombre text not null,
  apellido text not null,
  email text not null unique,
  telefono text,
  fecha_ingreso date default current_date,
  objetivo text,
  observaciones text,
  profesor_id uuid references public.profesores(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Rutinas table
create table if not exists public.rutinas (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  objetivo text,
  dias_por_semana int not null default 3 check (dias_por_semana between 1 and 7),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ejercicios table
create table if not exists public.ejercicios (
  id uuid default gen_random_uuid() primary key,
  rutina_id uuid references public.rutinas(id) on delete cascade not null,
  nombre text not null,
  series int not null default 3,
  repeticiones text not null default '10',
  descanso text default '60s',
  observaciones text,
  orden int not null default 0,
  created_at timestamptz default now()
);

-- Asignaciones table
create table if not exists public.asignaciones (
  id uuid default gen_random_uuid() primary key,
  rutina_id uuid references public.rutinas(id) on delete cascade not null,
  alumno_id uuid references public.alumnos(id) on delete cascade not null,
  fecha_asignacion date default current_date,
  activa boolean default true,
  created_at timestamptz default now()
);

-- Progreso table
create table if not exists public.progreso (
  id uuid default gen_random_uuid() primary key,
  asignacion_id uuid references public.asignaciones(id) on delete cascade not null,
  ejercicio_id uuid references public.ejercicios(id) on delete cascade not null,
  alumno_id uuid references public.alumnos(id) on delete cascade not null,
  completado boolean default false,
  fecha date default current_date,
  created_at timestamptz default now(),
  unique(asignacion_id, ejercicio_id, fecha)
);

-- RLS Policies

-- Helper function to check if user is an admin without causing infinite recursion in RLS
create or replace function public.is_admin()
returns boolean as $$
begin
  return coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin';
end;
$$ language plpgsql stable security definer;

-- Profiles
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = user_id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = user_id);
create policy "Admins can view all profiles" on public.profiles for select using (public.is_admin());
create policy "Admins can insert profiles" on public.profiles for insert with check (public.is_admin());

-- Profesores
alter table public.profesores enable row level security;
create policy "Admins full access to profesores" on public.profesores for all using (
  exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin')
);
create policy "Profesores can view own data" on public.profesores for select using (user_id = auth.uid());
create policy "Alumnos can view profesores" on public.profesores for select using (auth.uid() is not null);

-- Alumnos
alter table public.alumnos enable row level security;
create policy "Admins full access to alumnos" on public.alumnos for all using (
  exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin')
);
create policy "Profesores can view their alumnos" on public.alumnos for select using (
  exists (
    select 1 from public.profesores p
    where p.user_id = auth.uid() and p.id = profesor_id
  )
);
create policy "Profesores can update their alumnos" on public.alumnos for update using (
  exists (
    select 1 from public.profesores p
    where p.user_id = auth.uid() and p.id = profesor_id
  )
);
create policy "Alumnos can view own data" on public.alumnos for select using (user_id = auth.uid());

-- Rutinas
alter table public.rutinas enable row level security;
create policy "Anyone authenticated can view rutinas" on public.rutinas for select using (auth.uid() is not null);
create policy "Admins and profesores can manage rutinas" on public.rutinas for all using (
  exists (select 1 from public.profiles where user_id = auth.uid() and role in ('admin', 'profesor'))
);

-- Ejercicios
alter table public.ejercicios enable row level security;
create policy "Anyone authenticated can view ejercicios" on public.ejercicios for select using (auth.uid() is not null);
create policy "Admins and profesores can manage ejercicios" on public.ejercicios for all using (
  exists (select 1 from public.profiles where user_id = auth.uid() and role in ('admin', 'profesor'))
);

-- Asignaciones
alter table public.asignaciones enable row level security;
create policy "Admins and profesores can manage asignaciones" on public.asignaciones for all using (
  exists (select 1 from public.profiles where user_id = auth.uid() and role in ('admin', 'profesor'))
);
create policy "Alumnos can view own asignaciones" on public.asignaciones for select using (
  exists (select 1 from public.alumnos where user_id = auth.uid() and id = alumno_id)
);

-- Progreso
alter table public.progreso enable row level security;
create policy "Alumnos can manage own progreso" on public.progreso for all using (
  exists (select 1 from public.alumnos where user_id = auth.uid() and id = alumno_id)
);
create policy "Profesores can view alumnos progreso" on public.progreso for select using (
  exists (
    select 1 from public.alumnos a
    join public.profesores p on p.id = a.profesor_id
    where p.user_id = auth.uid() and a.id = alumno_id
  )
);
create policy "Admins can view all progreso" on public.progreso for select using (
  exists (select 1 from public.profiles where user_id = auth.uid() and role = 'admin')
);

-- Function to handle new user registration
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, role, nombre, apellido, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'alumno'),
    coalesce(new.raw_user_meta_data->>'nombre', ''),
    coalesce(new.raw_user_meta_data->>'apellido', ''),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update timestamp function
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply update triggers
create trigger update_profiles_updated_at before update on public.profiles for each row execute function public.update_updated_at();
create trigger update_profesores_updated_at before update on public.profesores for each row execute function public.update_updated_at();
create trigger update_alumnos_updated_at before update on public.alumnos for each row execute function public.update_updated_at();
create trigger update_rutinas_updated_at before update on public.rutinas for each row execute function public.update_updated_at();
