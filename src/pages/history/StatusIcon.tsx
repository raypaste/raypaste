import { CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import type { CompletionEntry } from "#/services/db";

export function StatusIcon({ row }: { row: CompletionEntry }) {
  if (row.hadError)
    return <XCircle size={13} className="shrink-0 text-red-500" />;
  if (row.wasApplied)
    return <CheckCircle2 size={13} className="shrink-0 text-emerald-500" />;
  return <MinusCircle size={13} className="shrink-0 text-orange-400" />;
}
