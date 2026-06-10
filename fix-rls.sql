-- fix-rls.sql
-- Corrige la recursión infinita en los policies de la tabla profiles.
-- Ejecutar en el SQL Editor de Supabase.

-- 1. Eliminar todos los policies existentes en profiles para evitar conflictos
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Admins can insert profiles" on public.profiles;
drop policy if exists "Admins can update all profiles" on public.profiles;
drop policy if exists "Admins can delete profiles" on public.profiles;

-- 2. Recrear is_admin() usando solo auth.jwt() (sin queries a profiles)
create or replace function public.is_admin()
returns boolean as $$
begin
  return coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin';
end;
$$ language plpgsql stable security definer;

-- 3. Recrear políticas limpias (sin recursión)
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "Admins can insert profiles"
  on public.profiles for insert
  with check (public.is_admin());

create policy "Admins can update all profiles"
  on public.profiles for update
  using (public.is_admin());

-- 4. Verificar que el trigger handle_new_user existe
-- (si no existe, el perfil no se crea automáticamente al registrar usuarios)
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
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
