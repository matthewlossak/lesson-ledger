// Shown instantly on navigation while a page's server data loads. Next.js
// prefetches this shell for every <Link>, so clicks get immediate feedback.
export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-8 w-48 bg-badge rounded-lg mb-6" />
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[0, 1, 2].map(i => (
          <div key={i} className="border border-border rounded-xl p-4">
            <div className="h-3 w-16 bg-badge rounded mb-2" />
            <div className="h-7 w-12 bg-badge rounded" />
          </div>
        ))}
      </div>
      <div className="border border-border rounded-xl divide-y divide-border">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="px-4 py-3 flex justify-between">
            <div className="h-4 w-40 bg-badge rounded" />
            <div className="h-4 w-14 bg-badge rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
