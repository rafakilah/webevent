-- =============================================================================
-- TES KEAMANAN DATABASE
--
-- Mensimulasikan tiga jenis pengguna (anon, user login biasa, admin) lalu
-- memastikan setiap aturan RLS dan fungsi bekerja sesuai rencana.
-- Semua berjalan dalam satu transaksi yang di-ROLLBACK, jadi aman dijalankan
-- berulang kali.
--
-- Jalankan:  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/security_test.sql
-- =============================================================================

\o /dev/null
begin;

-- Fixture (sebagai superuser) ------------------------------------------------
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin@test.local'),
  ('00000000-0000-0000-0000-0000000000b1', 'bukan-admin@test.local');
insert into public.admins (user_id) values ('00000000-0000-0000-0000-0000000000a1');

-- =============================================================================
-- 1. PENGUNJUNG ANONIM
-- =============================================================================
set local role anon;
select set_config('request.jwt.claims', '', true);

do $$
declare
  v_token text;
  v_count int;
begin
  -- Pendaftaran lewat fungsi berhasil dan mengembalikan token 32 hex.
  v_token := public.register_participant('Budi Santoso', '1234567890', 'Budi@Test.Local', '6281234567890', 'Manajemen');
  assert v_token ~ '^[0-9a-f]{32}$', 'token harus 32 karakter hex';
  perform set_config('test.token_budi', v_token, false);

  v_token := public.register_participant('Sari Dewi', '1234567891', 'sari@test.local', '6281234567891', 'Akuntansi');
  perform set_config('test.token_sari', v_token, false);
  raise notice 'OK  anon bisa mendaftar dan menerima token';

  -- NIM ganda ditolak.
  begin
    perform public.register_participant('Orang Lain', '1234567890', 'lain@test.local', '6281234567892', 'Manajemen');
    assert false, 'NIM ganda seharusnya ditolak';
  exception when unique_violation then
    assert sqlerrm like '%participants_nim_key%', 'error harus menyebut constraint NIM';
  end;

  -- Email ganda ditolak walau beda huruf besar/kecil.
  begin
    perform public.register_participant('Orang Lain', '9999999999', 'BUDI@test.local', '6281234567892', 'Manajemen');
    assert false, 'email ganda seharusnya ditolak';
  exception when unique_violation then
    assert sqlerrm like '%participants_email_key%', 'error harus menyebut constraint email';
  end;
  raise notice 'OK  NIM dan email ganda ditolak';

  -- Format data dijaga constraint walau aplikasi dilewati.
  begin
    perform public.register_participant('Xy', 'abc', 'bukan-email', '0812', '');
    assert false, 'data tidak valid seharusnya ditolak';
  exception when check_violation then null;
  end;
  raise notice 'OK  data tidak valid ditolak oleh CHECK constraint';

  -- Tidak bisa membaca atau menulis tabel secara langsung.
  begin
    select count(*) into v_count from public.participants;
    assert false, 'anon seharusnya tidak bisa SELECT participants';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.participants (full_name, nim, email, phone, major)
    values ('Penyusup', '5555555555', 'p@test.local', '6281200000000', 'X');
    assert false, 'anon seharusnya tidak bisa INSERT langsung';
  exception when insufficient_privilege then null;
  end;
  begin
    select count(*) into v_count from public.checkins;
    assert false, 'anon seharusnya tidak bisa SELECT checkins';
  exception when insufficient_privilege then null;
  end;
  raise notice 'OK  anon tidak punya akses langsung ke tabel';

  -- Membaca data sendiri lewat token, token salah tidak mengembalikan apa pun.
  select count(*) into v_count from public.get_participant_by_token(current_setting('test.token_budi'));
  assert v_count = 1, 'token valid harus mengembalikan 1 baris';
  assert (select email from public.get_participant_by_token(current_setting('test.token_budi'))) = 'budi@test.local',
    'email disimpan lowercase';
  select count(*) into v_count from public.get_participant_by_token('00000000000000000000000000000000');
  assert v_count = 0, 'token salah tidak boleh mengembalikan data';
  raise notice 'OK  data hanya bisa dibaca dengan token yang benar';

  -- Fungsi admin tidak bisa dipanggil anon.
  begin
    perform public.check_in(current_setting('test.token_budi'), null);
    assert false, 'anon seharusnya tidak bisa check-in';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.dashboard_stats();
    assert false, 'anon seharusnya tidak bisa melihat statistik';
  exception when insufficient_privilege then null;
  end;
  raise notice 'OK  anon tidak bisa memanggil fungsi admin';
end;
$$;

-- Simulasikan file yang sudah diunggah ke Storage (sebagai superuser).
reset role;
insert into storage.objects (bucket_id, name)
select 'payment-proofs', p.id || '/bukti-1.jpg' from public.participants p where nim in ('1234567890', '1234567891');
insert into storage.objects (bucket_id, name)
select 'payment-proofs', p.id || '/bukti-2.jpg' from public.participants p where nim = '1234567890';

set local role anon;

do $$
declare
  v_count int;
begin
  -- Bucket private dan tidak ada policy SELECT untuk anon.
  select count(*) into v_count from storage.objects where bucket_id = 'payment-proofs';
  assert v_count = 0, 'anon tidak boleh melihat isi bucket bukti transfer';
  raise notice 'OK  anon tidak bisa melihat bukti transfer';
end;
$$;

reset role;
select set_config('test.budi_id', (select id::text from public.participants where nim = '1234567890'), false);
select set_config('test.sari_id', (select id::text from public.participants where nim = '1234567891'), false);
set local role anon;

do $$
declare
  v_status public.payment_status;
begin
  -- Path di luar folder milik peserta ditolak.
  begin
    perform public.submit_payment_proof(current_setting('test.token_budi'),
      current_setting('test.sari_id') || '/bukti-1.jpg');
    assert false, 'path milik orang lain seharusnya ditolak';
  exception when raise_exception then
    assert sqlerrm like '%Path%', 'harus ditolak karena path';
  end;

  -- File yang belum benar-benar diunggah ditolak.
  begin
    perform public.submit_payment_proof(current_setting('test.token_budi'),
      current_setting('test.budi_id') || '/tidak-ada.jpg');
    assert false, 'file yang tidak ada seharusnya ditolak';
  exception when raise_exception then
    assert sqlerrm like '%tidak ditemukan%', 'harus ditolak karena file tidak ada';
  end;

  -- Token salah ditolak.
  begin
    perform public.submit_payment_proof('ffffffffffffffffffffffffffffffff', 'x/y.jpg');
    assert false, 'token salah seharusnya ditolak';
  exception when no_data_found then null;
  end;

  v_status := public.submit_payment_proof(current_setting('test.token_budi'),
    current_setting('test.budi_id') || '/bukti-1.jpg');
  assert v_status = 'menunggu_verifikasi';
  perform public.submit_payment_proof(current_setting('test.token_sari'),
    current_setting('test.sari_id') || '/bukti-1.jpg');

  -- Tidak bisa upload ulang saat sedang menunggu verifikasi.
  begin
    perform public.submit_payment_proof(current_setting('test.token_budi'),
      current_setting('test.budi_id') || '/bukti-2.jpg');
    assert false, 'upload ulang saat menunggu verifikasi seharusnya ditolak';
  exception when raise_exception then null;
  end;
  raise notice 'OK  alur unggah bukti transfer aman';
end;
$$;

-- =============================================================================
-- 2. USER LOGIN TAPI BUKAN ADMIN
-- =============================================================================
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}', true);

do $$
declare
  v_count int;
begin
  select count(*) into v_count from public.participants;
  assert v_count = 0, 'non-admin tidak boleh melihat peserta';

  select count(*) into v_count from storage.objects where bucket_id = 'payment-proofs';
  assert v_count = 0, 'non-admin tidak boleh melihat bukti transfer';

  begin
    perform public.check_in(current_setting('test.token_budi'), null);
    assert false, 'non-admin seharusnya tidak bisa check-in';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.verify_payment(current_setting('test.budi_id')::uuid, true, null);
    assert false, 'non-admin seharusnya tidak bisa verifikasi';
  exception when insufficient_privilege then null;
  end;

  update public.participants set payment_status = 'lunas';
  get diagnostics v_count = row_count;
  assert v_count = 0, 'non-admin tidak boleh mengubah peserta';

  assert not public.is_admin(), 'is_admin() harus false';
  raise notice 'OK  user login non-admin tidak bisa apa-apa';
end;
$$;

-- =============================================================================
-- 3. ADMIN
-- =============================================================================
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

do $$
declare
  v_count  int;
  v_status public.payment_status;
  r        record;
  v_first  timestamptz;
begin
  assert public.is_admin(), 'is_admin() harus true';

  select count(*) into v_count from public.participants;
  assert v_count = 2, 'admin harus melihat semua peserta';

  select count(*) into v_count from storage.objects where bucket_id = 'payment-proofs';
  assert v_count = 3, 'admin harus bisa melihat bukti transfer';

  select * into r from public.dashboard_stats();
  assert r.total = 2 and r.menunggu_verifikasi = 2 and r.lunas = 0 and r.checked_in = 0, 'statistik awal salah';
  raise notice 'OK  admin bisa melihat peserta, bukti, dan statistik';

  -- Admin tidak bisa mengedit data diri (hanya kolom verifikasi).
  begin
    update public.participants set full_name = 'Diubah' where nim = '1234567890';
    assert false, 'admin seharusnya tidak bisa mengubah nama';
  exception when insufficient_privilege then null;
  end;
  raise notice 'OK  data diri peserta tidak bisa diedit';

  -- Tolak tanpa alasan gagal, dengan alasan berhasil.
  begin
    perform public.verify_payment(current_setting('test.budi_id')::uuid, false, '   ');
    assert false, 'penolakan tanpa alasan seharusnya gagal';
  exception when raise_exception then null;
  end;
  v_status := public.verify_payment(current_setting('test.budi_id')::uuid, false, 'Nominal tidak sesuai');
  assert v_status = 'ditolak';

  v_status := public.verify_payment(current_setting('test.sari_id')::uuid, true);
  assert v_status = 'lunas';

  -- Tidak bisa memverifikasi dua kali.
  begin
    perform public.verify_payment(current_setting('test.sari_id')::uuid, false, 'iseng');
    assert false, 'verifikasi ulang seharusnya ditolak';
  exception when raise_exception then null;
  end;
  raise notice 'OK  verifikasi pembayaran (terima/tolak) sesuai aturan';

  -- Check-in.
  select * into r from public.check_in(current_setting('test.token_budi'), null);
  assert r.result = 'belum_lunas', 'peserta ditolak harus belum_lunas';

  select * into r from public.check_in('tokenngawur', null);
  assert r.result = 'tidak_valid', 'token ngawur harus tidak_valid';

  select * into r from public.check_in(current_setting('test.token_sari'), null);
  assert r.result = 'berhasil' and r.full_name = 'Sari Dewi', 'check-in pertama harus berhasil';
  v_first := r.checked_in_at;

  select * into r from public.check_in(current_setting('test.token_sari'), null);
  assert r.result = 'sudah' and r.checked_in_at = v_first, 'scan kedua harus "sudah" dengan jam pertama';

  select * into r from public.check_in(null, current_setting('test.sari_id')::uuid);
  assert r.result = 'sudah', 'check-in manual via id juga harus "sudah"';

  select count(*) into v_count from public.checkins;
  assert v_count = 1, 'hanya boleh ada 1 baris check-in';
  raise notice 'OK  check-in: berhasil / sudah / belum_lunas / tidak_valid';

  assert public.undo_check_in(current_setting('test.sari_id')::uuid), 'undo harus mengembalikan true';
  assert not public.undo_check_in(current_setting('test.sari_id')::uuid), 'undo kedua harus false';
  select * into r from public.check_in(null, current_setting('test.sari_id')::uuid);
  assert r.result = 'berhasil', 'setelah undo, check-in harus berhasil lagi';
  raise notice 'OK  undo check-in berfungsi';
end;
$$;

-- Peserta yang ditolak bisa upload ulang (kembali sebagai anon).
reset role;
set local role anon;
select set_config('request.jwt.claims', '', true);

do $$
begin
  assert (select payment_status from public.get_participant_by_token(current_setting('test.token_budi'))) = 'ditolak';
  assert (select rejection_reason from public.get_participant_by_token(current_setting('test.token_budi'))) = 'Nominal tidak sesuai';
  perform public.submit_payment_proof(current_setting('test.token_budi'),
    current_setting('test.budi_id') || '/bukti-2.jpg');
  assert (select payment_status from public.get_participant_by_token(current_setting('test.token_budi'))) = 'menunggu_verifikasi';
  assert (select rejection_reason from public.get_participant_by_token(current_setting('test.token_budi'))) is null;
  raise notice 'OK  peserta yang ditolak bisa mengunggah ulang';
  raise notice '==== SEMUA TES KEAMANAN LULUS ====';
end;
$$;

rollback;
