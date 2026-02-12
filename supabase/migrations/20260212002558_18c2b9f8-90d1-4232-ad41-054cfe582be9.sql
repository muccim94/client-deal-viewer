ALTER TABLE sales_records ADD COLUMN fattura_riga text;
ALTER TABLE sales_records DROP CONSTRAINT IF EXISTS sales_records_unique_record;
ALTER TABLE sales_records ADD CONSTRAINT sales_records_unique_record 
  UNIQUE (user_id, azienda, anno, mese, codice_cliente, articolo, fattura_riga);