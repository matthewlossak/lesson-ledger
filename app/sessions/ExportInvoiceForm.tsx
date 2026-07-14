'use client'

function currentMonthValue() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function ExportInvoiceForm() {
  return (
    <form
      action="/api/invoice"
      method="GET"
      className="flex items-center gap-2 border border-border bg-badge rounded-lg pl-3 pr-2 py-1.5"
    >
      <label htmlFor="export-period" className="text-sm text-muted whitespace-nowrap">
        Export invoice for
      </label>
      <input
        id="export-period"
        type="month"
        name="period"
        defaultValue={currentMonthValue()}
        required
        className="border border-border rounded-lg px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary bg-white"
      />
      <button
        type="submit"
        className="border border-border bg-white text-sm font-medium text-foreground px-3 py-1.5 rounded-lg hover:bg-badge transition-colors whitespace-nowrap"
      >
        Export
      </button>
    </form>
  )
}
