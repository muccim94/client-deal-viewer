
-- Create sales_records table
CREATE TABLE public.sales_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL,
  azienda TEXT NOT NULL,
  azienda_nome TEXT NOT NULL,
  anno INTEGER NOT NULL,
  mese INTEGER NOT NULL,
  codice_cliente TEXT NOT NULL,
  nome_cliente TEXT NOT NULL,
  agente TEXT NOT NULL DEFAULT '',
  marchio TEXT NOT NULL DEFAULT '',
  articolo TEXT NOT NULL,
  imponibile NUMERIC NOT NULL DEFAULT 0,
  provvigione NUMERIC NOT NULL DEFAULT 0,
  UNIQUE (user_id, azienda, anno, mese, codice_cliente, articolo, imponibile)
);

-- Enable RLS
ALTER TABLE public.sales_records ENABLE ROW LEVEL SECURITY;

-- SELECT: user sees only own records
CREATE POLICY "Users can view own records"
  ON public.sales_records FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT: user can insert only own records
CREATE POLICY "Users can insert own records"
  ON public.sales_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- DELETE: user can delete only own records
CREATE POLICY "Users can delete own records"
  ON public.sales_records FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index for faster queries by user
CREATE INDEX idx_sales_records_user_id ON public.sales_records (user_id);
