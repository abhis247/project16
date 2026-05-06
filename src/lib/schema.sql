CREATE TABLE public.admin_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  action text,
  data jsonb,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT admin_logs_pkey PRIMARY KEY (id)
);

CREATE TABLE public.deposits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  amount numeric,
  payment_gateway text,
  status text DEFAULT 'pending'::text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT deposits_pkey PRIMARY KEY (id),
  CONSTRAINT deposits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  lottery_id uuid,
  number integer NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT entries_pkey PRIMARY KEY (id),
  CONSTRAINT entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT entries_lottery_id_fkey FOREIGN KEY (lottery_id) REFERENCES public.lotteries(id)
);

CREATE TABLE public.lotteries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  entry_fee numeric NOT NULL,
  prize numeric NOT NULL,
  total_numbers integer DEFAULT 1000,
  max_entries_per_user integer DEFAULT 10,
  draw_time timestamp without time zone,
  status text DEFAULT 'active'::text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT lotteries_pkey PRIMARY KEY (id)
);

CREATE TABLE public.payout_details (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  upi_id text,
  bank_account text,
  ifsc text,
  account_name text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT payout_details_pkey PRIMARY KEY (id),
  CONSTRAINT payout_details_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.payouts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  amount numeric,
  status text DEFAULT 'pending'::text,
  admin_note text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT payouts_pkey PRIMARY KEY (id),
  CONSTRAINT payouts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  amount numeric NOT NULL,
  type text CHECK (type = ANY (ARRAY['credit'::text, 'debit'::text])),
  source text,
  reference_id uuid,
  status text DEFAULT 'success'::text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  firebase_uid text NOT NULL UNIQUE,
  name text,
  email text,
  phone text,
  social_handle text,
  is_blocked boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

CREATE TABLE public.wallets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  balance numeric DEFAULT 0,
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT wallets_pkey PRIMARY KEY (id),
  CONSTRAINT wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.winners (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lottery_id uuid,
  user_id uuid,
  entry_id uuid,
  number integer,
  prize numeric,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT winners_pkey PRIMARY KEY (id),
  CONSTRAINT winners_lottery_id_fkey FOREIGN KEY (lottery_id) REFERENCES public.lotteries(id),
  CONSTRAINT winners_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT winners_entry_id_fkey FOREIGN KEY (entry_id) REFERENCES public.entries(id)
);
