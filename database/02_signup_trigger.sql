-- Rana Pesticides: run AFTER 01_schema.sql
-- Creates the pending wholesaler row automatically when someone signs up from the website.
-- The registration form sends shop details as user metadata; this trigger copies them into public.wholesalers.
-- (Needed because with email confirmation on, the browser has no session yet right after sign-up.)

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.raw_user_meta_data ? 'shop_name' then
    insert into public.wholesalers (id, shop_name, owner_name, phone, city, gst_no, status)
    values (
      new.id,
      left(coalesce(new.raw_user_meta_data->>'shop_name', ''), 120),
      left(coalesce(new.raw_user_meta_data->>'owner_name', ''), 120),
      left(coalesce(new.raw_user_meta_data->>'phone', ''), 20),
      left(nullif(new.raw_user_meta_data->>'city', ''), 80),
      left(nullif(new.raw_user_meta_data->>'gst_no', ''), 15),
      'pending'            -- always pending, whatever the browser sent
    )
    on conflict (id) do nothing;
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
