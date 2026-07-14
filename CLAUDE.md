@AGENTS.md

# LessonLedger — Project Context

Single-user web app to log tutoring sessions and track income.

## Stack

- **Framework**: Next.js (App Router) with TypeScript
- **Database**: Neon (hosted serverless Postgres)
- **ORM**: Prisma
- **Deployment target**: Vercel (not yet deployed)

## Data Model (v1)

### Entities

**Student**
- `name` — string
- `subject` — string
- `defaultRateTier` — enum: `SENIOR` | `REGULAR`

**Session**
- `date` — date
- `duration` — decimal (hours)
- `rateCharged` — decimal (auto-filled from rate constants, editable)
- `note` — free text (what was covered)
- Linked to **one or more Students** (many-to-many)

**SessionStudent** (join table — implements the many-to-many)
- Links a Session to a Student

### Rate Constants (in code, not in DB)

Rates are defined as constants in `lib/rates.ts`. Placeholder values — update with real numbers when known.

```
RATES = {
  REGULAR: {
    1_student:  [placeholder, e.g. 60],
    2_students: [placeholder, e.g. 45],
    3_or_more:  [placeholder, e.g. 35],
  },
  SENIOR: {
    1_student:  [placeholder, e.g. 75],
    2_students: [placeholder, e.g. 55],
    3_or_more:  [placeholder, e.g. 45],
  },
}
```

### Money Calculation Rule

**Never store earnings in the database.** All monetary values are derived on demand:
`earnings = duration × rateCharged`

Aggregate earnings (per student, per period) are computed in queries/server functions, not persisted.

## Built So Far

The original v1 scope is done, plus several items once in the parking lot:
1. Fast session-logging form
2. Overview list of all sessions
3. Per-student view: session history, notes, total earnings over selectable time periods
4. Multi-user support (email/password auth via NextAuth, per-user data)
5. Invoicing (per-student xlsx export, with saved invoice details in settings)
6. Calendar view (FullCalendar, themed to the app)
7. Scheduling groundwork: sessions carry a start time and an upcoming-vs-past distinction

## Parking Lot (not built — do not build without asking)

- Assessment dates per student
- Parent sharing
- External calendar sync (import/export to Google Calendar etc; the in-app calendar view exists)
- Structured / searchable notes
- Configurable rate settings (rates are still hardcoded in `lib/rates.ts`)
- EdAtlas integration

## Architecture Notes

- App Router means each folder under `app/` is a route. Server Components (default) run on the server and can query the DB directly. Client Components (marked `"use client"`) run in the browser.
- Prisma schema lives in `prisma/schema.prisma`. After any schema change: run `npx prisma migrate dev` to update the DB, then `npx prisma generate` to regenerate TypeScript types.
- Environment variable `DATABASE_URL` must be set in `.env.local` (local) and in Vercel's dashboard (production). Never commit this file.
