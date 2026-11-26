-- =============================================================================
-- Upload bukti transfer langsung dari browser, tanpa secret key di server.
--
-- Sebelumnya: server memakai secret key untuk membuat signed upload URL.
-- Sekarang  : browser mengunggah sendiri ke folder `<token>/` dan policy
--             Storage memeriksa bahwa token itu ada dan statusnya boleh upload.
--
-- Hasilnya aplikasi web tidak lagi memegang kunci yang bisa melewati RLS
-- (prinsip least privilege). Yang tahu token hanya pemilik link status.
-- =============================================================================

-- Dipakai policy INSERT di storage.objects. SECURITY DEFINER karena anon tidak
-- boleh membaca tabel participants secara langsung.
create function public.can_upload_payment_proof(p_object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    -- tepat satu tingkat folder: <token>/<nama-file>
    array_length(storage.foldername(p_object_name), 1) = 1
    and exists (
      select 1
      from public.participants
      where token = (storage.foldername(p_object_name))[1]
        and payment_status in ('menunggu_pembayaran', 'ditolak')
    );
$$;

revoke execute on function public.can_upload_payment_proof(text) from public, anon, authenticated;
grant execute on function public.can_upload_payment_proof(text) to anon, authenticated;

-- Hanya INSERT. Tanpa policy SELECT/UPDATE, peserta tidak bisa melihat,
-- menimpa, atau menghapus file (termasuk miliknya sendiri).
create policy "Peserta dapat mengunggah bukti ke folder tokennya"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'payment-proofs' and (select public.can_upload_payment_proof(name)));

-- Path bukti sekarang berada di folder token, bukan folder id.
create or replace function public.submit_payment_proof(p_token text, p_path text)
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

  if p_path is null or p_path not like v_participant.token || '/%' then
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
