# API Contracts

> Extend file — referenced from `CLAUDE.md`.
> Document every endpoint here. Agent reads this before writing any fetch call, route handler, or service function.

---

## Base

**Base URL (dev):** `http://localhost:3000/api`
**Base URL (prod):**
**Auth header:** `Authorization: Bearer <token>` / Cookie / API Key
**Content-Type:** `application/json`

---

## Response Envelope

> All responses follow this shape.

```ts
// Success
{
  data: T,
  meta?: {
    total: number,
    page: number,
    limit: number
  }
}

// Error
{
  error: {
    code: string,     // e.g. "UNAUTHORIZED", "VALIDATION_ERROR"
    message: string,  // human-readable
    details?: unknown
  }
}
```

---

## Common Error Codes

| Code               | HTTP Status | Description                             |
| ------------------ | :---------: | --------------------------------------- |
| `UNAUTHORIZED`     |     401     | Missing or invalid auth token           |
| `FORBIDDEN`        |     403     | Authenticated but lacks permission      |
| `NOT_FOUND`        |     404     | Resource does not exist                 |
| `VALIDATION_ERROR` |     422     | Request body / params failed validation |
| `RATE_LIMITED`     |     429     | Too many requests                       |
| `SERVER_ERROR`     |     500     | Unexpected server error                 |

---

## Conventions

- Timestamps: ISO 8601 (`2024-01-15T08:30:00Z`)
- IDs: UUID v4 string
- Pagination: `?page=1&limit=20`
- Sorting: `?sort=created_at&order=desc`
- Filtering: `?status=active&type=post`
- Soft delete: use `deleted_at` column, never hard-delete user content

---

## Endpoints

> Duplicate this block per resource group.

---

### [Resource: e.g. Posts]

---

#### `GET /[resource]`

**Description:**
**Auth required:** Yes / No
**Cache:** No-store / Revalidate / Static

**Query params:**

| Param   | Type     | Required | Description |
| ------- | -------- | :------: | ----------- |
| `page`  | `number` |    ❌    | Default: 1  |
| `limit` | `number` |    ❌    | Default: 20 |

**Response `200`:**

```json
{
  "data": [],
  "meta": { "total": 0, "page": 1, "limit": 20 }
}
```

---

#### `GET /[resource]/:id`

**Description:**
**Auth required:** Yes / No

**Response `200`:**

```json
{
  "data": {}
}
```

---

#### `POST /[resource]`

**Description:**
**Auth required:** Yes / No

**Request body:**

```json
{}
```

**Response `201`:**

```json
{
  "data": {}
}
```

---

#### `PATCH /[resource]/:id`

**Description:**
**Auth required:** Yes

**Request body:**

```json
{}
```

**Response `200`:**

```json
{
  "data": {}
}
```

---

#### `DELETE /[resource]/:id`

**Description:**
**Auth required:** Yes

**Response `200`:**

```json
{
  "data": { "id": "" }
}
```

---

_Last updated: [YYYY-MM-DD]_
