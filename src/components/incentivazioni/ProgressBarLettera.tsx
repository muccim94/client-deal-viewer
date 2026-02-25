import { useMemo } from "react";
import { Loader2 } from "lucide-react";

interface Riga {
  fatturato: number;
  percentuale: number;
}

interface Props {
  righe: Riga[];
  fatturatoAttuale: number | null;
  isLoading?: boolean;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

export default function ProgressBarLettera({ righe, fatturatoAttuale, isLoading }: Props) {
  const steps = useMemo(() => {
    const valid = righe.filter((r) => r.fatturato > 0);
    let cumulative = 0;
    return valid.map((r) => {
      cumulative += r.fatturato;
      return { fatturato: r.fatturato, percentuale: r.percentuale, cumulativo: cumulative };
    });
  }, [righe]);

  const totaleFatturato = steps.length > 0 ? steps[steps.length - 1].cumulativo : 0;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 justify-center text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Caricamento fatturato...
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <div className="py-4 text-center text-muted-foreground text-sm">
        Nessuno scaglione definito
      </div>
    );
  }

  const fatt = fatturatoAttuale ?? 0;
  const pctComplete = totaleFatturato > 0 ? Math.min((fatt / totaleFatturato) * 100, 100) : 0;

  // Determine which steps are reached
  let runningSum = 0;
  const stepsWithStatus = steps.map((s) => {
    const start = runningSum;
    runningSum += s.fatturato;
    const end = runningSum;
    const widthPct = totaleFatturato > 0 ? (s.fatturato / totaleFatturato) * 100 : 0;
    const reached = fatt >= end;
    const partial = !reached && fatt > start;
    const partialPct = partial ? ((fatt - start) / (end - start)) * 100 : 0;
    return { ...s, start, end, widthPct, reached, partial, partialPct };
  });

  return (
    <div className="px-4 py-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          Fatturato attuale:{" "}
          <span className="font-semibold text-foreground">{fmt(fatt)}</span>
        </span>
        <span className="text-muted-foreground">
          Obiettivo:{" "}
          <span className="font-semibold text-foreground">{fmt(totaleFatturato)}</span>
          <span className="ml-1.5 font-medium text-primary">
            ({pctComplete.toFixed(1)}%)
          </span>
        </span>
      </div>

      {/* Segmented bar */}
      <div className="relative">
        <div className="flex h-7 rounded-md overflow-hidden border border-border">
          {stepsWithStatus.map((s, i) => (
            <div
              key={i}
              className="relative h-full overflow-hidden"
              style={{ width: `${s.widthPct}%` }}
              title={`Step ${i + 1}: ${fmt(s.fatturato)} (${s.percentuale}%)`}
            >
              {/* Background */}
              <div className={`absolute inset-0 ${s.reached ? "bg-emerald-500/80" : "bg-muted"}`} />
              {/* Partial fill */}
              {s.partial && (
                <div
                  className="absolute inset-y-0 left-0 bg-emerald-500/60"
                  style={{ width: `${s.partialPct}%` }}
                />
              )}
              {/* Separator line */}
              {i < stepsWithStatus.length - 1 && (
                <div className="absolute right-0 inset-y-0 w-px bg-border z-10" />
              )}
              {/* Step label inside bar */}
              {s.widthPct > 8 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-[10px] font-medium ${s.reached ? "text-white" : "text-muted-foreground"}`}>
                    {s.percentuale}%
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Current revenue indicator line */}
        {fatt > 0 && fatt < totaleFatturato && (
          <div
            className="absolute top-0 h-full w-0.5 bg-primary z-20"
            style={{ left: `${pctComplete}%` }}
          >
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[9px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap">
              {fmt(fatt)}
            </div>
          </div>
        )}
      </div>

      {/* Step labels below */}
      <div className="flex text-[10px] text-muted-foreground">
        {stepsWithStatus.map((s, i) => (
          <div
            key={i}
            className="text-center truncate"
            style={{ width: `${s.widthPct}%` }}
          >
            <span className={s.reached ? "text-emerald-600 font-medium" : ""}>
              {fmt(s.cumulativo)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
