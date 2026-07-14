import { NextRequest } from 'next/server'
import ExcelJS from 'exceljs'
import path from 'path'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { buildInvoiceLines, type InvoiceSessionInput } from '@/lib/invoice'

const MONTH_ABBREV = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const TEMPLATE_PATH = path.join(process.cwd(), 'lib/templates/invoice-template.xlsx')

// Fixed layout of lib/templates/invoice-template.xlsx: 6 blank labor rows
// (17-22), then a static tail block below. Both exceljs's spliceRows/
// duplicateRow shift cell *values* correctly when the row count changes,
// but do NOT update merged-cell ranges (a documented library limitation) -
// so merges are unmerged and manually recreated at the right rows instead
// of trusting either operation to carry them along.
const LABOR_START_ROW = 17
const TEMPLATE_LABOR_ROWS = 6
const TEMPLATE_LABOR_END_ROW = LABOR_START_ROW + TEMPLATE_LABOR_ROWS - 1 // 22
// [rowOffsetFromLaborEnd, colRange] for every merged range in the tail block
const TAIL_MERGES: [number, string][] = [
  [1, 'A:E'], // blank spacer
  [2, 'A:E'], // blank spacer (holds a stray " " in G)
  [3, 'A:F'], // Discount
  [4, 'A:F'], // Comments + TOTAL
  [5, 'A:H'], // blank spacer
  [6, 'A:H'], // blank spacer
  [7, 'A:H'], // Thank you
  [8, 'A:H'], // blank spacer
]

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Not authenticated', { status: 401 })
  }
  const userId = parseInt(session.user.id)

  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period') ?? '' // "YYYY-MM"
  const match = /^(\d{4})-(\d{2})$/.exec(period)
  if (!match) {
    return new Response('Invalid period, expected YYYY-MM', { status: 400 })
  }
  const year = parseInt(match[1])
  const month = parseInt(match[2]) // 1-12

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })

  const monthStart = new Date(Date.UTC(year, month - 1, 1))
  const monthEnd = new Date(Date.UTC(year, month, 1))

  const sessions = await prisma.session.findMany({
    where: {
      students: { some: { student: { userId } } },
      date: { gte: monthStart, lt: monthEnd },
    },
    include: { students: { include: { student: true } } },
    orderBy: { date: 'asc' },
  })

  const sessionInputs: InvoiceSessionInput[] = sessions.flatMap(s =>
    s.students.map(ss => ({
      date: s.date,
      duration: Number(s.duration),
      rateCharged: Number(s.rateCharged),
      studentId: ss.studentId,
      studentName: ss.student.name,
      studentCount: s.students.length,
    }))
  )

  const lines = buildInvoiceLines(sessionInputs)

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(TEMPLATE_PATH)
  const ws = workbook.getWorksheet('Invoice')!

  // Header / bank details
  ws.getCell('A2').value = user.billToName ?? ''
  ws.getCell('A3').value = user.name ?? ''
  ws.getCell('A4').value = `ABN: ${user.abn ?? ''}`
  ws.getCell('A6').value = `BSB: ${user.bsb ?? ''}`
  ws.getCell('A7').value = `Account Number: ${user.accountNumber ?? ''}`
  ws.getCell('H4').value = new Date(Date.UTC(year, month, 0)) // last day of the month

  ws.getCell('A10').value = user.billToName ?? ''
  const addressLines = (user.billToAddress ?? '').split('\n').filter(Boolean)
  ws.getCell('A11').value = addressLines[0] ?? ''
  ws.getCell('A12').value = addressLines[1] ?? ''
  ws.getCell('A13').value = addressLines[2] ?? ''

  const lineCount = Math.max(lines.length, 1)
  const laborEndRow = LABOR_START_ROW + lineCount - 1

  // Wipe every merge in the labor block + tail before touching row count,
  // so the (buggy) shift behavior of spliceRows/duplicateRow can't leave
  // stale merge ranges behind.
  ;(ws as unknown as { unMergeCells: (range: string) => void }).unMergeCells(
    `A${LABOR_START_ROW}:H${TEMPLATE_LABOR_END_ROW + 8}`
  )

  if (lineCount < TEMPLATE_LABOR_ROWS) {
    ws.spliceRows(LABOR_START_ROW + lineCount, TEMPLATE_LABOR_ROWS - lineCount)
  } else if (lineCount > TEMPLATE_LABOR_ROWS) {
    ws.duplicateRow(TEMPLATE_LABOR_END_ROW, lineCount - TEMPLATE_LABOR_ROWS, true)
  }

  // Re-create the labor row merges (one per line item) and the tail block
  // merges at their new positions relative to the actual final row count.
  for (let row = LABOR_START_ROW; row <= laborEndRow; row++) {
    ws.mergeCells(`A${row}:E${row}`)
  }
  for (const [offset, colRange] of TAIL_MERGES) {
    const row = laborEndRow + offset
    const [colA, colB] = colRange.split(':')
    ws.mergeCells(`${colA}${row}:${colB}${row}`)
  }

  lines.forEach((line, i) => {
    const row = LABOR_START_ROW + i
    ws.getCell(`A${row}`).value = line.label
    ws.getCell(`F${row}`).value = line.hours
    ws.getCell(`G${row}`).value = line.rate
    ws.getCell(`H${row}`).value = { formula: `F${row}*G${row}` }
  })

  const discountRow = laborEndRow + 3
  const totalRow = laborEndRow + 4

  ws.getCell(`H${discountRow}`).value = 0
  ws.getCell(`H${totalRow}`).value = { formula: `SUM(H${LABOR_START_ROW}:H${laborEndRow})-H${discountRow}` }

  const buffer = await workbook.xlsx.writeBuffer()
  const filename = `${MONTH_ABBREV[month - 1]} ${String(year).slice(-2)} invoice.xlsx`

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
