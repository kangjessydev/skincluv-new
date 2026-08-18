-- Migration 010: Give users 1000 coins for testing

INSERT INTO public.coin_balances (user_id, balance)
SELECT id, 1000 FROM auth.users
ON CONFLICT (user_id) 
DO UPDATE SET balance = 1000;
