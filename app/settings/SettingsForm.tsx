'use client'

import { useState, useTransition } from 'react'
import { updateInvoiceDetails } from './actions'

const inputClass = 'w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary'

export default function SettingsForm({
  abn,
  bsb,
  accountNumber,
  billToName,
  billToAddress,
}: {
  abn: string
  bsb: string
  accountNumber: string
  billToName: string
  billToAddress: string
}) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await updateInvoiceDetails({
        abn: fd.get('abn') as string,
        bsb: fd.get('bsb') as string,
        accountNumber: fd.get('accountNumber') as string,
        billToName: fd.get('billToName') as string,
        billToAddress: fd.get('billToAddress') as string,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-md">
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Your details</h2>
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">ABN</label>
            <input name="abn" defaultValue={abn} placeholder="e.g. 12 345 678 901" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">BSB</label>
            <input name="bsb" defaultValue={bsb} placeholder="e.g. 123-456" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Account number</label>
            <input name="accountNumber" defaultValue={accountNumber} placeholder="e.g. 123456789" className={inputClass} />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Bill to</h2>
        <p className="text-xs text-muted mb-3">Who you invoice: a tutoring platform, an agency, or a private client.</p>
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Name</label>
            <input name="billToName" defaultValue={billToName} placeholder="e.g. Acme Tutoring Pty Ltd" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Address</label>
            <textarea
              name="billToAddress"
              defaultValue={billToAddress}
              rows={3}
              placeholder={'e.g. 123 Example Street\nMelbourne\nVIC 3000'}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Saving…' : 'Save'}
        </button>
        {saved && <span className="text-sm text-muted">Saved.</span>}
      </div>
    </form>
  )
}
