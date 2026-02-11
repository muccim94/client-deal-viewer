import { supabase } from "@/integrations/supabase/client";
import { SalesRecord } from "@/types/data";

interface DbRecord {
  id: string;
  user_id: string;
  azienda: string;
  azienda_nome: string;
  anno: number;
  mese: number;
  codice_cliente: string;
  nome_cliente: string;
  agente: string;
  marchio: string;
  articolo: string;
  imponibile: number;
  provvigione: number;
}

function toSalesRecord(r: DbRecord): SalesRecord {
  return {
    azienda: r.azienda,
    aziendaNome: r.azienda_nome,
    anno: r.anno,
    mese: r.mese,
    codiceCliente: r.codice_cliente,
    nomeCliente: r.nome_cliente,
    agente: r.agente,
    marchio: r.marchio,
    articolo: r.articolo,
    imponibile: Number(r.imponibile),
    provvigione: Number(r.provvigione),
  };
}

function toDbInsert(r: SalesRecord, userId: string) {
  return {
    user_id: userId,
    azienda: r.azienda,
    azienda_nome: r.aziendaNome,
    anno: r.anno,
    mese: r.mese,
    codice_cliente: r.codiceCliente,
    nome_cliente: r.nomeCliente,
    agente: r.agente,
    marchio: r.marchio,
    articolo: r.articolo,
    imponibile: r.imponibile,
    provvigione: r.provvigione,
  };
}

export async function loadData(): Promise<SalesRecord[]> {
  const { data, error } = await supabase
    .from("sales_records")
    .select("*")
    .order("anno", { ascending: false })
    .order("mese", { ascending: false });

  if (error) {
    console.error("Error loading data:", error);
    return [];
  }
  return (data as DbRecord[]).map(toSalesRecord);
}

export async function saveData(records: SalesRecord[], userId: string): Promise<number> {
  const rows = records.map((r) => toDbInsert(r, userId));
  
  // Use upsert with onConflict to skip duplicates
  const { data, error } = await supabase
    .from("sales_records")
    .upsert(rows, { onConflict: "user_id,azienda,anno,mese,codice_cliente,articolo,imponibile", ignoreDuplicates: true })
    .select();

  if (error) {
    console.error("Error saving data:", error);
    throw error;
  }
  return data?.length ?? 0;
}

export async function clearData(): Promise<void> {
  const { error } = await supabase
    .from("sales_records")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // delete all rows (RLS filters to user)

  if (error) {
    console.error("Error clearing data:", error);
    throw error;
  }
}
