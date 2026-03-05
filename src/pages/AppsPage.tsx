import { LayoutGrid } from "lucide-react";

export function AppsPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
        <span className="text-2xl text-neutral-100">
          <LayoutGrid />
        </span>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-neutral-100">Apps</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Manage per-app prompt configurations — coming soon.
        </p>
      </div>
    </div>
  );
}
