# Database Schema

> Extend file — referenced from `CLAUDE.md`.
> Keep this updated whenever schema changes. Agent reads this before writing any DB query or migration.

---

## Connection

**ORM / Query builder:** Prisma / Drizzle / SQLAlchemy / raw
**Database:** PostgreSQL / SQLite / MySQL / MongoDB
**Host:** Supabase / PlanetScale / Railway / local
**Schema file:** `prisma/schema.prisma` / `src/db/schema.ts`

---

## Tables

> Duplicate this block per table.

---

### [table_name]

**Description:**

| Column       | Type              | Nullable | Default             | Description |
| ------------ | ----------------- | :------: | ------------------- | ----------- |
| `id`         | `uuid` / `serial` |    ❌    | `gen_random_uuid()` | Primary key |
| `created_at` | `timestamp`       |    ❌    | `now()`             |             |
| `updated_at` | `timestamp`       |    ❌    | `now()`             |             |

**Relations:**

- Belongs to:
- Has many:
- Many-to-many through:

## **Indexes:**

---

## Row Level Security (Supabase)

> Fill this in if using Supabase RLS.

| Table | Policy                                    | Role                     | Condition |
| ----- | ----------------------------------------- | ------------------------ | --------- |
|       | `SELECT` / `INSERT` / `UPDATE` / `DELETE` | `anon` / `authenticated` |           |

---

## Migrations

> Log every migration here in order.

| #   | Date | Description    |
| --- | ---- | -------------- |
| 001 |      | Initial schema |

---

## Seed Data

> Describe any seed/fixture data needed for dev environment.

---

_Last updated: [YYYY-MM-DD]_
