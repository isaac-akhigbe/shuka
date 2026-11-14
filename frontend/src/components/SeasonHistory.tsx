import type { Season } from "@/types/shuka";

interface Props {
  seasons: Season[];
  excludedYears: number[];
}

// One small block per year. Red = the first rains were a false start.
export default function SeasonHistory({ seasons, excludedYears }: Props) {
  const byYear = new Map(seasons.map((s) => [s.year, s]));
  const years = [...seasons.map((s) => s.year), ...excludedYears].sort((a, b) => a - b);

  return (
    <div>
      <div className="flex gap-[3px]">
        {years.map((year) => {
          const s = byYear.get(year);
          const excluded = !s;
          const label = excluded
            ? `${year}: left out (data quality)`
            : s.false_onset
              ? `${year}: false start`
              : `${year}: rains held`;
          return (
            <div
              key={year}
              title={label}
              className={`h-8 flex-1 rounded-sm ${
                excluded ? "bg-zinc-200" : s.false_onset ? "bg-red-500" : "bg-emerald-500/70"
              }`}
            />
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-zinc-400">
        <span>{years[0]}</span>
        <span>{years[years.length - 1]}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-red-500" /> False start
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500/70" /> Rains held
        </span>
        {excludedYears.length > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-zinc-200" /> Left out (bad data)
          </span>
        )}
      </div>
    </div>
  );
}
