export default function Loading() {
  return (
    <div className="container-site flex min-h-[50vh] items-center justify-center py-20" aria-busy>
      <div className="w-full max-w-xl space-y-4">
        <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
        <div className="h-10 w-3/4 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-4 w-full animate-pulse rounded-lg bg-slate-100" />
        <div className="h-4 w-5/6 animate-pulse rounded-lg bg-slate-100" />
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
