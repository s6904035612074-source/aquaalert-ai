-- AquaAlert AI : วางทั้งไฟล์นี้ใน Supabase > SQL Editor แล้วกด Run ครั้งเดียว

-- 1) ตารางรายงานน้ำท่วม
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  district    text not null check (char_length(district) between 2 and 40),
  place       text check (char_length(place) <= 80),
  water_cm    int  not null check (water_cm between 0 and 300),
  rain_mm     int  check (rain_mm between 0 and 500),
  note        text check (char_length(note) <= 240),
  photo_url   text check (char_length(photo_url) <= 500),
  ai_note     text check (char_length(ai_note) <= 200)
);
create index if not exists reports_created_at_idx on public.reports (created_at desc);

-- 2) สิทธิ์: ทุกคนอ่านและส่งรายงานได้ แต่แก้ไข/ลบไม่ได้
alter table public.reports enable row level security;
drop policy if exists "anyone can read reports" on public.reports;
create policy "anyone can read reports" on public.reports for select to anon, authenticated using (true);
drop policy if exists "anyone can add reports" on public.reports;
create policy "anyone can add reports" on public.reports for insert to anon, authenticated with check (true);

-- 3) อัปเดตสดเมื่อมีรายงานใหม่
do $$ begin
  alter publication supabase_realtime add table public.reports;
exception when duplicate_object then null; end $$;

-- 4) ที่เก็บรูป (ไฟล์ jpg ไม่เกิน 1 MB เปิดดูได้สาธารณะ)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('flood-photos', 'flood-photos', true, 1048576, array['image/jpeg'])
on conflict (id) do nothing;
drop policy if exists "anyone can upload flood photos" on storage.objects;
create policy "anyone can upload flood photos" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'flood-photos');
