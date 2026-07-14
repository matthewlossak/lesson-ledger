# Architecture

A tour of how LessonLedger is built, and the decisions behind the parts that
are more than routine CRUD. If you want to understand or explain this project,
start here.

## Stack at a glance

| Concern | Choice |
| --- | --- |
| Framework | Next.js (App Router) + React, TypeScript |
| Rendering | Server Components by default; Client Components only where interactivity is needed |
| Mutations | Server Actions (no hand-written REST layer for internal writes) |
| Database | Neon (serverless Postgres) |
| ORM | Prisma, via the Neon serverless adapter |
| Auth | NextAuth (Auth.js) with credentials + bcrypt password hashing |
| Invoicing | ExcelJS, filling a real `.xlsx` template |
| Styling | Tailwind CSS |
| Hosting | Vercel |

## Request flow

```
Browser
  |
  v
middleware.ts ............ gate: unauthenticated users are redirected to /login
  |
  v
app/<route>/page.tsx ..... Server Component: runs on the server, queries the DB
  |                         directly via Prisma, renders HTML
  |
  |  (interactive bits)
  +--> "use client" components (forms, calendar) hydrate in the browser
             |
             v
        Server Actions (app/<route>/actions.ts)
             |  auth() -> verify ownership -> Prisma write -> revalidatePath()
             v
        Database
```

The key idea of the App Router: **the page itself is server code**. There is no
separate API the frontend calls to load data - the page component `await`s the
database and returns HTML. Writes go through **Server Actions**, which are
server functions the client can call directly (see `app/sessions/actions.ts`).

---

## The five things worth understanding

### 1. Timezone correctness (`lib/sessions.ts`)

**The problem:** the app is used in Melbourne, but Vercel runs the server in
UTC. Naive date logic (`new Date()`, server-local time) would make a session
flip from "upcoming" to "past" at the wrong moment, or show the wrong day,
depending on where the code runs.

**The approach:** all date/time comparisons are pinned to `Australia/Melbourne`
regardless of the server's clock. `melbourneComparable()` uses
`Intl.DateTimeFormat` to read the wall-clock date/time a Melbourne clock would
show for a given instant, packs it into a single comparable number, and only
ever compares those packed numbers against each other. Session dates are stored
as UTC midnight and their calendar day is read back from the UTC parts, so the
stored day never drifts.

`isUpcoming()` encodes the product rule: a session stays "upcoming" until its
*end* (start time + duration) has passed, and legacy sessions with no start time
count as upcoming for their whole calendar day. This one file is the single
source of truth so the dashboard, session list, and calendar all agree.

*Why it's worth talking about:* timezone bugs are a classic source of subtle,
hard-to-reproduce failures. Centralising the logic and testing it against a
fixed zone is a real engineering decision, not boilerplate.

### 2. Server Components + Server Actions + authorization

Pages are Server Components that query Prisma directly. Mutations are Server
Actions in `actions.ts` files. Every action:

1. resolves the current user with `auth()`,
2. **verifies ownership** before touching data - e.g. `verifyStudentsOwned()`
   in `app/sessions/actions.ts` confirms the students named in a write actually
   belong to the signed-in user, and `deleteSession()` only deletes a session
   reachable through that user's students,
3. performs the Prisma write,
4. calls `revalidatePath()` so the affected pages re-render with fresh data.

*Why it's worth talking about:* it shows you understand that authentication
(who you are) and authorization (what you're allowed to touch) are different,
and that in a multi-user app every write needs an ownership check, not just a
login gate.

### 3. Money is never stored - it's derived

Earnings are never written to the database. Every monetary figure is computed on
demand as `duration x rateCharged`, and aggregates (per student, per period) are
computed in queries. Hourly rates live as constants in `lib/rates.ts`, keyed by
tier (`REGULAR` / `SENIOR`) and number of students in the session.

*Why it's worth talking about:* it's a deliberate data-modelling choice. Storing
derived values invites them to drift out of sync with the inputs; deriving them
keeps a single source of truth. Good "why did you do it this way" answer.

### 4. Invoice line-item aggregation (`lib/invoice.ts`)

The most algorithmically interesting file. Given a month's raw sessions, it
produces the lines of a real invoice:

- Sessions are grouped by student and by **effective rate** (a group session's
  charge is split across its students, so the same student can appear at an
  individual rate and a group rate in the same month).
- A student with more than one rate gets one line per rate, tagged
  `[Individual]` / `[Group @ $X/hr]`; a student with a single rate gets one clean
  line.
- Dates within a line are collapsed and formatted with ordinals (`1st, 8th`),
  grouped by duration.

The result feeds `app/api/invoice/route.ts`, which fills the ExcelJS template
and streams back an `.xlsx`.

*Why it's worth talking about:* it's real domain logic with genuine edge cases
(mixed individual/group rates), and it maps a messy real-world document format
into clean code.

### 5. Authentication (`auth.ts`, `auth.config.ts`, `middleware.ts`)

NextAuth with a credentials provider: passwords are hashed with bcrypt on
registration and verified on login. `middleware.ts` protects routes by
redirecting unauthenticated requests to `/login`. User identity is carried in
the session and read by Server Actions via `auth()`.

*Why it's worth talking about:* auth is where a lot of hobby projects cut
corners. Hashed passwords + middleware route protection + per-request identity
is the baseline done properly.

---

## Data model

```
User ---< Student ---< SessionStudent >--- Session
```

- **User** - login (email + hashed password) and saved invoice details (ABN,
  BSB, account, bill-to) used to fill exported invoices.
- **Student** - name, subjects, default rate tier; owned by a User.
- **Session** - date, optional start time, duration, rate charged, note.
- **SessionStudent** - join table implementing the many-to-many (a session can
  have several students; a student appears in many sessions).

Schema lives in `prisma/schema.prisma`; migrations in `prisma/migrations/`.

## Where things live

| Path | What |
| --- | --- |
| `app/` | Routes. Each folder is a route; `page.tsx` renders it, `actions.ts` holds its Server Actions. |
| `app/api/invoice/route.ts` | Generates and streams the `.xlsx` invoice. |
| `lib/sessions.ts` | Timezone-safe date logic (upcoming vs past, formatting). |
| `lib/invoice.ts` | Invoice line-item aggregation. |
| `lib/rates.ts` | Rate constants and `getRate()`. |
| `lib/db.ts` | Prisma client (Neon adapter). |
| `lib/templates/` | The `.xlsx` invoice template ExcelJS fills. |
| `prisma/` | Schema and migrations. |
| `auth.ts`, `auth.config.ts`, `middleware.ts` | Authentication and route protection. |
