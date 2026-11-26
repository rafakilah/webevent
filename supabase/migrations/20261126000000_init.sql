-- =============================================================================
-- INIT: skema platform event
--
-- Prinsip keamanan:
--   1. Role `anon` (pengunjung tanpa login) TIDAK punya akses langsung ke tabel.
--      Semua aksi publik lewat fungsi yang menerima token dan hanya mengembalikan
--      kolom yang perlu.
--   2. Role `authenticated` hanya bisa membaca/mengubah data kalau user tercatat
--      di tabel `admins` (dicek oleh fungsi is_admin() di setiap policy RLS).
--   3. Check-in dijaga constraint UNIQUE(participant_id), jadi dua scan bersamaan
--      tidak mungkin tercatat dua kali.
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

-- -----------------------------------------------------------------------------
-- Tipe & tabel
-- -----------------------------------------------------------------------------

create type public.payment_status as enum (
  'menunggu_pembayaran',
  'menunggu_verifikasi',
  'lunas',
  'ditolak'
);

-- Daftar user Supabase Auth yang boleh mengakses dashboard panitia.
create table public.admins (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table public.participants (
  id                  uuid primary key default gen_random_uuid(),
  full_name           text not null check (char_length(full_name) between 3 and 100),
  nim                 text not null check (nim ~ '^[0-9A-Za-z]{5,20}$'),
  -- Email selalu disimpan lowercase supaya "A@x.com" dan "a@x.com" dianggap sama.
  email               text not null check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  -- Nomor WA disimpan ternormalisasi: 628xxxxxxxxx.
  phone               text not null check (phone ~ '^628[0-9]{7,12}$'),
  major               text not null check (char_length(major) between 2 and 100),
  -- 128 bit acak (32 karakter hex). Inilah satu-satunya isi QR tiket.
  token               text not null default encode(extensions.gen_random_bytes(16), 'hex'),
  payment_status      public.payment_status not null default 'menunggu_pembayaran',
  payment_proof_path  text,
  proof_uploaded_at   timestamptz,
  rejection_reason    text,
  verified_at         timestamptz,
  verified_by         uuid references auth.users (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint participants_nim_key   unique (nim),
  constraint participants_email_key unique (email),
  constraint participants_token_key unique (token),
  constraint participants_rejection_has_reason
    check (payment_status <> 'ditolak' or coalesce(btrim(rejection_reason), '') <> ''),
  constraint participants_waiting_has_proof
    check (payment_status <> 'menunggu_verifikasi' or payment_proof_path is not null)
);

create index participants_payment_status_idx on public.participants (payment_status);
create index participants_created_at_idx on public.participants (created_at desc);

create table public.checkins (
  id              uuid primary key default gen_random_uuid(),
  -- UNIQUE: satu peserta hanya bisa punya satu baris check-in.
  participant_id  uuid not null references public.participants (id) on delete cascade,
  checked_in_at   timestamptz not null default now(),
  checked_in_by   uuid references auth.users (id) on delete set null,

  constraint checkins_participant_id_key unique (participant_id)
);

create index checkins_checked_in_at_idx on public.checkins (checked_in_at desc);

-- updated_at otomatis
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger participants_set_updated_at
  before update on public.participants
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Helper: apakah user yang sedang login adalah admin?
-- SECURITY DEFINER supaya bisa membaca tabel admins tanpa terhalang RLS-nya.
-- -----------------------------------------------------------------------------

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins where user_id = (select auth.uid())
  );
$$;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

alter table public.admins       enable row level security;
alter table public.participants enable row level security;
alter table public.checkins     enable row level security;

-- Supabase memberi hak penuh ke anon/authenticated secara default. Kita cabut
-- semuanya lalu beri lagi seperlunya. RLS tetap jadi lapisan kedua.
revoke all on public.admins, public.participants, public.checkins from anon, authenticated;

grant select on public.admins to authenticated;
grant select on public.participants to authenticated;
-- Admin hanya boleh mengubah kolom verifikasi. Data diri peserta tidak bisa diedit.
grant update (payment_status, rejection_reason, verified_at, verified_by)
  on public.participants to authenticated;
grant select, insert, delete on public.checkins to authenticated;

create policy "User dapat melihat status admin dirinya sendiri"
  on public.admins for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Admin dapat melihat peserta"
  on public.participants for select to authenticated
  using ((select public.is_admin()));

create policy "Admin dapat memverifikasi peserta"
  on public.participants for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admin dapat melihat check-in"
  on public.checkins for select to authenticated
  using ((select public.is_admin()));

create policy "Admin dapat mencatat check-in"
  on public.checkins for insert to authenticated
  with check ((select public.is_admin()));

create policy "Admin dapat membatalkan check-in"
  on public.checkins for delete to authenticated
  using ((select public.is_admin()));

-- =============================================================================
-- FUNGSI PUBLIK (dipanggil tanpa login, berbekal token)
-- SECURITY DEFINER: berjalan dengan hak pemilik fungsi, jadi bisa menyentuh
-- tabel walau anon tidak punya akses. Karena itu setiap fungsi wajib:
--   - memvalidasi input sendiri,
--   - hanya mengembalikan kolom yang perlu,
--   - memakai search_path kosong (mencegah pembajakan lewat schema lain).
-- =============================================================================

create function public.register_participant(
  p_full_name text,
  p_nim       text,
  p_email     text,
  p_phone     text,
  p_major     text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text;
begin
  -- Pelanggaran UNIQUE (NIM/email ganda) dibiarkan naik sebagai error 23505
  -- dengan nama constraint, lalu diterjemahkan jadi pesan ramah di aplikasi.
  insert into public.participants (full_name, nim, email, phone, major)
  values (
    btrim(p_full_name),
    btrim(p_nim),
    lower(btrim(p_email)),
    btrim(p_phone),
    btrim(p_major)
  )
  returning token into v_token;

  return v_token;
end;
$$;

create function public.get_participant_by_token(p_token text)
returns table (
  full_name          text,
  nim                text,
  email              text,
  major              text,
  payment_status     public.payment_status,
  rejection_reason   text,
  proof_uploaded_at  timestamptz,
  created_at         timestamptz,
  checked_in_at      timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.full_name, p.nim, p.email, p.major, p.payment_status,
    p.rejection_reason, p.proof_uploaded_at, p.created_at, c.checked_in_at
  from public.participants p
  left join public.checkins c on c.participant_id = p.id
  where p.token = p_token;
$$;

-- Dipanggil setelah file berhasil diunggah lewat signed upload URL.
-- Path wajib berada di folder milik peserta dan file-nya harus benar-benar ada.
create function public.submit_payment_proof(p_token text, p_path text)
returns public.payment_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_participant public.participants;
begin
  select * into v_participant
  from public.participants
  where token = p_token
  for update;

  if not found then
    raise exception 'Token tidak valid' using errcode = 'P0002', hint = 'invalid_token';
  end if;

  if v_participant.payment_status not in ('menunggu_pembayaran', 'ditolak') then
    raise exception 'Bukti transfer tidak bisa diunggah pada status %', v_participant.payment_status
      using errcode = 'P0001', hint = 'invalid_state';
  end if;

  if p_path is null or p_path not like v_participant.id::text || '/%' then
    raise exception 'Path bukti transfer tidak valid' using errcode = 'P0001', hint = 'invalid_path';
  end if;

  if not exists (
    select 1 from storage.objects where bucket_id = 'payment-proofs' and name = p_path
  ) then
    raise exception 'File bukti transfer tidak ditemukan' using errcode = 'P0001', hint = 'missing_file';
  end if;

  update public.participants
  set payment_proof_path = p_path,
      proof_uploaded_at  = now(),
      payment_status     = 'menunggu_verifikasi',
      rejection_reason   = null
  where id = v_participant.id;

  return 'menunggu_verifikasi';
end;
$$;

-- =============================================================================
-- FUNGSI ADMIN
-- SECURITY INVOKER: berjalan dengan hak user yang memanggil, jadi RLS tetap
-- berlaku. Ditambah pengecekan is_admin() eksplisit supaya pesan error jelas.
-- =============================================================================

create function public.assert_admin()
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Akses khusus admin' using errcode = '42501';
  end if;
end;
$$;

create function public.verify_payment(
  p_participant_id uuid,
  p_approve        boolean,
  p_reason         text default null
)
returns public.payment_status
language plpgsql
set search_path = ''
as $$
declare
  v_status public.payment_status;
begin
  perform public.assert_admin();

  if not p_approve and coalesce(btrim(p_reason), '') = '' then
    raise exception 'Alasan penolakan wajib diisi' using errcode = 'P0001', hint = 'reason_required';
  end if;

  update public.participants
  set payment_status   = case when p_approve then 'lunas' else 'ditolak' end::public.payment_status,
      rejection_reason = case when p_approve then null else btrim(p_reason) end,
      verified_at      = now(),
      verified_by      = auth.uid()
  where id = p_participant_id
    and payment_status = 'menunggu_verifikasi'
  returning payment_status into v_status;

  if not found then
    raise exception 'Peserta tidak sedang menunggu verifikasi' using errcode = 'P0001', hint = 'invalid_state';
  end if;

  return v_status;
end;
$$;

-- Hasil check-in:
--   berhasil     : baru saja check-in
--   sudah        : sudah check-in sebelumnya (checked_in_at = jam check-in pertama)
--   belum_lunas  : token valid tapi pembayaran belum diterima
--   tidak_valid  : token tidak dikenal
create function public.check_in(
  p_token          text default null,
  p_participant_id uuid default null
)
returns table (
  result          text,
  participant_id  uuid,
  full_name       text,
  nim             text,
  major           text,
  checked_in_at   timestamptz
)
language plpgsql
set search_path = ''
as $$
declare
  v_p  public.participants;
  v_at timestamptz;
begin
  perform public.assert_admin();

  select * into v_p
  from public.participants p
  where (p_token is not null and p.token = btrim(p_token))
     or (p_participant_id is not null and p.id = p_participant_id)
  limit 1;

  if not found then
    return query select 'tidak_valid'::text, null::uuid, null::text, null::text, null::text, null::timestamptz;
    return;
  end if;

  if v_p.payment_status <> 'lunas' then
    return query select 'belum_lunas'::text, v_p.id, v_p.full_name, v_p.nim, v_p.major, null::timestamptz;
    return;
  end if;

  -- Inti anti race condition: kalau dua transaksi menyisipkan baris yang sama,
  -- Postgres membuat yang kedua menunggu, lalu ON CONFLICT DO NOTHING membuatnya
  -- tidak menyisipkan apa-apa. Hanya satu yang mendapat RETURNING.
  insert into public.checkins (participant_id, checked_in_by)
  values (v_p.id, auth.uid())
  on conflict on constraint checkins_participant_id_key do nothing
  returning checkins.checked_in_at into v_at;

  if v_at is not null then
    return query select 'berhasil'::text, v_p.id, v_p.full_name, v_p.nim, v_p.major, v_at;
  else
    select c.checked_in_at into v_at from public.checkins c where c.participant_id = v_p.id;
    return query select 'sudah'::text, v_p.id, v_p.full_name, v_p.nim, v_p.major, v_at;
  end if;
end;
$$;

create function public.undo_check_in(p_participant_id uuid)
returns boolean
language plpgsql
set search_path = ''
as $$
begin
  perform public.assert_admin();
  delete from public.checkins where participant_id = p_participant_id;
  return found;
end;
$$;

create function public.dashboard_stats()
returns table (
  total                bigint,
  menunggu_pembayaran  bigint,
  menunggu_verifikasi  bigint,
  lunas                bigint,
  ditolak              bigint,
  checked_in           bigint
)
language plpgsql
stable
set search_path = ''
as $$
begin
  perform public.assert_admin();
  return query
  select
    count(*),
    count(*) filter (where p.payment_status = 'menunggu_pembayaran'),
    count(*) filter (where p.payment_status = 'menunggu_verifikasi'),
    count(*) filter (where p.payment_status = 'lunas'),
    count(*) filter (where p.payment_status = 'ditolak'),
    (select count(*) from public.checkins)
  from public.participants p;
end;
$$;

-- -----------------------------------------------------------------------------
-- Hak eksekusi fungsi
-- Postgres memberi EXECUTE ke PUBLIC secara default, dan Supabase juga ke
-- anon/authenticated. Cabut semua, lalu beri sesuai kebutuhan.
-- -----------------------------------------------------------------------------

revoke execute on function
  public.set_updated_at(),
  public.is_admin(),
  public.assert_admin(),
  public.register_participant(text, text, text, text, text),
  public.get_participant_by_token(text),
  public.submit_payment_proof(text, text),
  public.verify_payment(uuid, boolean, text),
  public.check_in(text, uuid),
  public.undo_check_in(uuid),
  public.dashboard_stats()
from public, anon, authenticated;

grant execute on function
  public.register_participant(text, text, text, text, text),
  public.get_participant_by_token(text),
  public.submit_payment_proof(text, text)
to anon, authenticated;

grant execute on function
  public.is_admin(),
  public.assert_admin(),
  public.verify_payment(uuid, boolean, text),
  public.check_in(text, uuid),
  public.undo_check_in(uuid),
  public.dashboard_stats()
to authenticated;

-- -----------------------------------------------------------------------------
-- Storage: bucket PRIVATE untuk bukti transfer
-- Batas 2 MB dan tipe file ditegakkan oleh Storage, bukan hanya di browser.
-- Tidak ada policy INSERT: unggahan hanya lewat signed upload URL yang dibuat
-- server setelah token peserta divalidasi.
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "Admin dapat melihat bukti transfer"
  on storage.objects for select to authenticated
  using (bucket_id = 'payment-proofs' and (select public.is_admin()));

-- -----------------------------------------------------------------------------
-- Realtime: dashboard admin mendengarkan perubahan dua tabel ini.
-- Realtime tetap menghormati RLS, jadi hanya admin yang menerima event.
-- -----------------------------------------------------------------------------

alter publication supabase_realtime add table public.participants, public.checkins;
