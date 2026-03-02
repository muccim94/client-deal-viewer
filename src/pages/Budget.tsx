import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getMeseNome } from "@/types/data";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface BudgetRow {
  mese: number;
  budget: number;
  fatturato: number;
}

const fmt = (v: number) =>
  v.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function Budget() {
  const [anno, setAnno] = useState(2026);
  const [agente, setAgente] = useState<string>("all");

  const { data: rows = [], isLoading } = useQuery<BudgetRow[]>({
    queryKey: ["budget", anno, agente],
    queryFn: async () => {
      const params: Record<string, unknown> = { p_anno: anno };
      if (agente !== "all") params.p_agente = agente;
      const { data, error } = await supabase.rpc("get_budget_data", params as any);
      if (error) throw error;
      return (data as unknown as BudgetRow[]) ?? [];
    },
  });

  const totals = rows.reduce(
    (acc, r) => ({
      budget: acc.budget + r.budget,
      fatturato: acc.fatturato + r.fatturato,
    }),
    { budget: 0, fatturato: 0 }
  );

  const deltaColor = (delta: number) =>
    delta >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Budget</h1>
        <div className="flex gap-3">
          <Select value={String(anno)} onValueChange={(v) => setAnno(Number(v))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2027">2027</SelectItem>
            </SelectContent>
          </Select>
          <Select value={agente} onValueChange={setAgente}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti</SelectItem>
              <SelectItem value="FO_FO75">FO75</SelectItem>
              <SelectItem value="FO_FO77">FO77</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Caricamento…</p>
      ) : (
        <div className="rounded-md border text-[1.05rem]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-1.5">Mese</TableHead>
                <TableHead className="text-right px-1.5">Budget</TableHead>
                <TableHead className="text-right px-1.5">Fatturato</TableHead>
                <TableHead className="text-right px-1.5">Delta €</TableHead>
                <TableHead className="text-right px-1.5">Delta %</TableHead>
                <TableHead className="w-[160px] px-1.5">Progresso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const delta = r.fatturato - r.budget;
                const pct = r.budget > 0 ? (r.fatturato / r.budget) * 100 : 0;
                return (
                  <TableRow key={r.mese}>
                    <TableCell className="font-medium px-1.5">{getMeseNome(r.mese)}</TableCell>
                    <TableCell className="text-right px-1.5">{fmt(r.budget)}</TableCell>
                    <TableCell className="text-right px-1.5">{fmt(r.fatturato)}</TableCell>
                    <TableCell className={`text-right px-1.5 ${deltaColor(delta)}`}>
                      {delta >= 0 ? "+" : ""}
                      {fmt(delta)}
                    </TableCell>
                    <TableCell className={`text-right px-1.5 ${deltaColor(delta)}`}>
                      {r.budget > 0
                        ? `${delta >= 0 ? "+" : ""}${((delta / r.budget) * 100).toFixed(1)}%`
                        : "—"}
                    </TableCell>
                    <TableCell className="px-1.5">
                      <Progress
                        value={Math.min(pct, 100)}
                        className="h-2"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-bold px-1.5">Totale</TableCell>
                <TableCell className="text-right font-bold px-1.5">{fmt(totals.budget)}</TableCell>
                <TableCell className="text-right font-bold px-1.5">{fmt(totals.fatturato)}</TableCell>
                <TableCell className={`text-right font-bold px-1.5 ${deltaColor(totals.fatturato - totals.budget)}`}>
                  {totals.fatturato - totals.budget >= 0 ? "+" : ""}
                  {fmt(totals.fatturato - totals.budget)}
                </TableCell>
                <TableCell className={`text-right font-bold px-1.5 ${deltaColor(totals.fatturato - totals.budget)}`}>
                  {totals.budget > 0
                    ? `${totals.fatturato - totals.budget >= 0 ? "+" : ""}${(((totals.fatturato - totals.budget) / totals.budget) * 100).toFixed(1)}%`
                    : "—"}
                </TableCell>
                <TableCell className="px-1.5" />
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </div>
  );
}
