type CardTone = "default" | "positive" | "caution" | "critical";

const toneStyles: Record<CardTone, string> = {
  default: "border-slate-200/80 hover:border-slate-300/90",
  positive: "border-emerald-200/80 hover:border-emerald-300/90",
  caution: "border-amber-200/80 hover:border-amber-300/90",
  critical: "border-rose-200/80 hover:border-rose-300/90"
};

const accentBar: Record<CardTone, string> = {
  default: "bg-slate-400",
  positive: "bg-emerald-500",
  caution: "bg-amber-500",
  critical: "bg-rose-500"
};

export default function Card({
  title,
  value,
  tone = "default"
}: {
  title: string;
  value: number;
  tone?: CardTone;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-xl border bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md sm:p-6 ${toneStyles[tone]}`}
    >
      <div
        className={`absolute left-0 top-0 h-full w-1 rounded-l-xl opacity-90 transition-opacity group-hover:opacity-100 ${accentBar[tone]}`}
        aria-hidden
      />
      <div className="pl-2">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</p>
        <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-slate-900 sm:text-4xl">{value}</p>
      </div>
    </div>
  );
}
