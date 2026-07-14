export const dynamic = 'force-dynamic'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import SettingsForm from './SettingsForm'

export default async function SettingsPage() {
  const session = await auth()
  const userId = parseInt(session!.user.id)
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-foreground mb-2">Settings</h1>
      <p className="text-sm text-muted mb-6">
        These details are used to fill out exported invoices.
      </p>
      <SettingsForm
        abn={user.abn ?? ''}
        bsb={user.bsb ?? ''}
        accountNumber={user.accountNumber ?? ''}
        billToName={user.billToName ?? ''}
        billToAddress={user.billToAddress ?? ''}
      />
    </div>
  )
}
