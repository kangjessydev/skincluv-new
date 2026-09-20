-- Migration 045: Add chatbot_memory_consent to profiles table
-- NULL = Belum ditanya (tampilkan consent banner)
-- TRUE = Setuju (aktifkan ekstraksi dan injeksi memori AI)
-- FALSE = Menolak / Lewati (nonaktifkan memori AI)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS chatbot_memory_consent BOOLEAN DEFAULT NULL;

COMMENT ON COLUMN public.profiles.chatbot_memory_consent IS 'Consent status for chatbot episodic memory (UU PDP compliant): NULL=unasked, TRUE=consented, FALSE=rejected';
