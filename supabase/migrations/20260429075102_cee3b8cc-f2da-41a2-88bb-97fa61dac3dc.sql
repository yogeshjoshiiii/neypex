create table if not exists public.payment_settings (
  id uuid primary key default gen_random_uuid(),
  esewa_number text not null default '+977-9769874535',
  khalti_number text not null default '+977-9769874535',
  esewa_qr_url text,
  khalti_qr_url text,
  terms text not null default 'Payment goes directly to the content creator. Access is granted for 90 days from approval and is bound to the device used at checkout. Once a purchase is approved, it is non-refundable. If you sent the wrong amount, contact support on WhatsApp.',
  updated_at timestamptz not null default now()
);

alter table public.payment_settings enable row level security;

drop policy if exists payment_settings_read on public.payment_settings;
create policy payment_settings_read on public.payment_settings for select using (true);

drop policy if exists payment_settings_insert on public.payment_settings;
create policy payment_settings_insert on public.payment_settings for insert with check (true);

drop policy if exists payment_settings_update on public.payment_settings;
create policy payment_settings_update on public.payment_settings for update using (true) with check (true);

insert into public.payment_settings (id) select gen_random_uuid()
where not exists (select 1 from public.payment_settings);

insert into storage.buckets (id, name, public)
values ('payment-qr','payment-qr', true)
on conflict (id) do nothing;

drop policy if exists "payment_qr_public_read" on storage.objects;
create policy "payment_qr_public_read" on storage.objects for select using (bucket_id = 'payment-qr');

drop policy if exists "payment_qr_public_write" on storage.objects;
create policy "payment_qr_public_write" on storage.objects for insert with check (bucket_id = 'payment-qr');

drop policy if exists "payment_qr_public_update" on storage.objects;
create policy "payment_qr_public_update" on storage.objects for update using (bucket_id = 'payment-qr');

drop policy if exists "payment_qr_public_delete" on storage.objects;
create policy "payment_qr_public_delete" on storage.objects for delete using (bucket_id = 'payment-qr');