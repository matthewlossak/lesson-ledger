'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

type InvoiceDetailsInput = {
  abn: string
  bsb: string
  accountNumber: string
  billToName: string
  billToAddress: string
}

async function currentUserId(): Promise<number> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Not authenticated')
  return parseInt(session.user.id)
}

export async function updateInvoiceDetails(input: InvoiceDetailsInput) {
  const userId = await currentUserId()
  await prisma.user.update({
    where: { id: userId },
    data: {
      abn: input.abn || null,
      bsb: input.bsb || null,
      accountNumber: input.accountNumber || null,
      billToName: input.billToName || null,
      billToAddress: input.billToAddress || null,
    },
  })
  revalidatePath('/settings')
}
