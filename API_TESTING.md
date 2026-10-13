# API Testing Guide (Postman / Thunder Client)

This guide walks through every endpoint in a sensible order, then proves that one user cannot reach another user's data.

## Setup

1. Start the backend: `cd backend && npm run dev` (it must print `MongoDB connected`).
2. In Postman or Thunder Client create these variables (or just paste values by hand):

| Variable   | Value                       |
| ---------- | --------------------------- |
| `baseUrl`  | `http://localhost:5000/api` |
| `tokenA`   | (filled in step 2)          |
| `tokenB`   | (filled in step 12)         |
| `clientId` | (filled in step 3)          |
| `projectId`| (filled in step 4)          |
| `log1Id`, `log2Id`, `log3Id` | (filled in step 5) |

3. Every request except register and login needs this header:

```
Authorization: Bearer <token>
```

In Postman you can also choose **Authorization -> Bearer Token** and paste the token. For POST/PUT requests set `Content-Type: application/json` and use a raw JSON body.

All error responses have the form `{ "message": "..." }`.

---

## Part 1: Happy path as User A

### 1. Register User A

`POST {{baseUrl}}/auth/register`

```json
{ "name": "Asha Verma", "email": "asha@example.com", "password": "secret123" }
```

Expected: **201**

```json
{
  "token": "eyJhbGciOi...",
  "user": { "id": "...", "name": "Asha Verma", "email": "asha@example.com" }
}
```

The response never contains the password. Registering the same email again returns **400** `Email is already registered`.

### 2. Login User A

`POST {{baseUrl}}/auth/login`

```json
{ "email": "asha@example.com", "password": "secret123" }
```

Expected: **200** with `token` and `user`. **Copy the token into `tokenA`.**

Also try:
- Wrong password -> **401** `Invalid email or password`
- `GET {{baseUrl}}/auth/me` with `tokenA` -> **200** `{ "id": "...", "name": "Asha Verma", "email": "asha@example.com" }`
- `GET {{baseUrl}}/auth/me` with no header -> **401** `Not authorized, token missing`

### 3. Create a client

`POST {{baseUrl}}/clients` (header: `Bearer {{tokenA}}`)

```json
{ "name": "Acme Corp", "email": "billing@acme.com", "phone": "9876543210" }
```

Expected: **201**. The response has `_id`, `name`, `email`, `phone`, `freelancer` (your user id) and `createdAt`. **Copy `_id` into `clientId`.**

Other client requests (all with `tokenA`):
- `GET {{baseUrl}}/clients` -> **200**, array with Acme Corp
- `GET {{baseUrl}}/clients/{{clientId}}` -> **200**
- `PUT {{baseUrl}}/clients/{{clientId}}` with `{ "phone": "9000000000" }` -> **200**, phone updated
- `DELETE {{baseUrl}}/clients/{{clientId}}` -> **400** `This client still has projects. Delete those projects first.` (once step 4 is done; do not delete it now)

### 4. Create a project

`POST {{baseUrl}}/projects` (header: `Bearer {{tokenA}}`)

```json
{
  "name": "Website Development",
  "description": "Company website rebuild",
  "client": "{{clientId}}",
  "hourlyRate": 1500
}
```

Expected: **201**. `client` comes back as `{ "_id": "...", "name": "Acme Corp", "email": "billing@acme.com" }`. **Copy `_id` into `projectId`.**

Other project requests:
- `GET {{baseUrl}}/projects` -> **200**
- `GET {{baseUrl}}/projects/{{projectId}}` -> **200**
- `PUT {{baseUrl}}/projects/{{projectId}}` with `{ "description": "Rebuild and SEO" }` -> **200**

### 5. Create time logs

Create three logs. `POST {{baseUrl}}/time-logs` (header: `Bearer {{tokenA}}`):

```json
{ "project": "{{projectId}}", "date": "2026-09-10", "hours": 5, "description": "Design mockups" }
```
```json
{ "project": "{{projectId}}", "date": "2026-09-15", "hours": 7.5, "description": "Frontend build" }
```
```json
{ "project": "{{projectId}}", "date": "2026-10-02", "hours": 7.5, "description": "Testing and fixes" }
```

Expected: **201** each, with `project` shown as `{ "_id": "...", "name": "Website Development", "hourlyRate": 1500 }`. Copy the three `_id` values into `log1Id`, `log2Id`, `log3Id`.

### 6. Get time logs

`GET {{baseUrl}}/time-logs` -> **200**, an array of 3 logs, newest date first (Oct 2, Sep 15, Sep 10).

`GET {{baseUrl}}/time-logs/{{log1Id}}` -> **200**, one log.

### 7. Filter time logs

| Request | Expected |
| ------- | -------- |
| `GET {{baseUrl}}/time-logs?project={{projectId}}` | 3 logs |
| `GET {{baseUrl}}/time-logs?from=2026-09-01&to=2026-09-30` | 2 logs (Sep 10 and Sep 15) |
| `GET {{baseUrl}}/time-logs?project={{projectId}}&from=2026-09-12&to=2026-10-31` | 2 logs (Sep 15 and Oct 2) |
| `GET {{baseUrl}}/time-logs?from=2026-10-02` | 1 log (Oct 2) |
| `GET {{baseUrl}}/time-logs?to=2026-09-10` | 1 log (Sep 10; `to` includes the whole day) |
| `GET {{baseUrl}}/time-logs?project=abc` | **400** `Invalid project ID` |
| `GET {{baseUrl}}/time-logs?from=garbage` | **400** `From date must be a valid date (YYYY-MM-DD)` |
| `GET {{baseUrl}}/time-logs?from=2026-09-30&to=2026-09-01` | **400** `From date must not be after To date` |

### 8. Get the invoice total

`GET {{baseUrl}}/projects/{{projectId}}/invoice-total` -> **200**

```json
{
  "project": {
    "id": "...",
    "name": "Website Development",
    "hourlyRate": 1500,
    "client": { "id": "...", "name": "Acme Corp" }
  },
  "totalHours": 20,
  "invoiceTotal": 30000
}
```

Check: (5 + 7.5 + 7.5) x 1500 = 30000.

### 9. Update a time log

`PUT {{baseUrl}}/time-logs/{{log2Id}}`

```json
{ "hours": 4, "description": "Frontend build (revised)" }
```

Expected: **200** with `hours: 4`. Re-run step 8: `totalHours` is **16.5** and `invoiceTotal` is **24750**.

### 10. Delete a time log

`DELETE {{baseUrl}}/time-logs/{{log3Id}}` -> **200** `{ "message": "Time log deleted" }`

Then `GET {{baseUrl}}/time-logs/{{log3Id}}` -> **404** `Time log not found`. Re-run step 8: `totalHours` is **9** and `invoiceTotal` is **13500**.

---

## Part 2: Ownership tests (User B must be locked out)

User A now owns `clientId`, `projectId` and `log1Id`, `log2Id` (log 3 was deleted).

### 11. Register User B

`POST {{baseUrl}}/auth/register`

```json
{ "name": "Ravi Shah", "email": "ravi@example.com", "password": "secret123" }
```

Expected: **201**.

### 12. Login User B

`POST {{baseUrl}}/auth/login`

```json
{ "email": "ravi@example.com", "password": "secret123" }
```

**Copy the token into `tokenB`.** Use `Bearer {{tokenB}}` for all requests below.

### 13. Try to access User A's client

| Request (as User B) | Expected |
| ------------------- | -------- |
| `GET {{baseUrl}}/clients/{{clientId}}` | **404** `Client not found` |
| `PUT {{baseUrl}}/clients/{{clientId}}` with `{ "name": "Hacked" }` | **404** `Client not found` |
| `DELETE {{baseUrl}}/clients/{{clientId}}` | **404** `Client not found` |
| `GET {{baseUrl}}/clients` | **200** `[]` (B has no clients) |

### 14. Try to access User A's project

| Request (as User B) | Expected |
| ------------------- | -------- |
| `GET {{baseUrl}}/projects/{{projectId}}` | **404** `Project not found` |
| `PUT {{baseUrl}}/projects/{{projectId}}` with `{ "hourlyRate": 1 }` | **404** `Project not found` |
| `DELETE {{baseUrl}}/projects/{{projectId}}` | **404** `Project not found` |
| `GET {{baseUrl}}/projects` | **200** `[]` |
| `POST {{baseUrl}}/projects` with `{ "name": "Steal", "client": "{{clientId}}", "hourlyRate": 100 }` | **404** `Client not found` (cannot attach a project to A's client) |

### 15. Try to access User A's time log

| Request (as User B) | Expected |
| ------------------- | -------- |
| `GET {{baseUrl}}/time-logs/{{log1Id}}` | **404** `Time log not found` |
| `PUT {{baseUrl}}/time-logs/{{log1Id}}` with `{ "hours": 99 }` | **404** `Time log not found` |
| `DELETE {{baseUrl}}/time-logs/{{log1Id}}` | **404** `Time log not found` |
| `GET {{baseUrl}}/time-logs` | **200** `[]` |
| `GET {{baseUrl}}/time-logs?project={{projectId}}` | **200** `[]` (filtering by A's project id still returns nothing) |
| `POST {{baseUrl}}/time-logs` with `{ "project": "{{projectId}}", "date": "2026-09-20", "hours": 1 }` | **404** `Project not found` (cannot log time on A's project) |

### 16. Try to access User A's invoice

`GET {{baseUrl}}/projects/{{projectId}}/invoice-total` (as User B) -> **404** `Project not found`. No totals are leaked.

### Extra: the request body cannot choose the owner

As User B, create a client while pretending to be User A:

`POST {{baseUrl}}/clients`

```json
{ "name": "Sneaky", "freelancer": "<User A's id from step 1>" }
```

Expected: **201**, but the returned `freelancer` is **User B's** id (taken from the token). `GET {{baseUrl}}/clients` as User A must not list "Sneaky".

### Finally: confirm User A is untouched

As User A, `GET {{baseUrl}}/projects/{{projectId}}/invoice-total` still returns `totalHours: 9` and `invoiceTotal: 13500`.

Why 404 and not 403? The API looks a document up by ID **and** owner. To User B, someone else's document is indistinguishable from one that does not exist, so nothing is revealed.

---

## Part 3: Validation and authentication checks

Paths in this table are relative to `{{baseUrl}}`. Use `tokenA` where a token is needed.

| Request | Expected |
| ------- | -------- |
| `POST /auth/register` with `{ "email": "a@b.co", "password": "secret123" }` | **400** `Name is required` |
| `POST /auth/register` with `{ "name": "X", "email": "not-an-email", "password": "secret123" }` | **400** `Please provide a valid email` |
| `POST /auth/register` with `{ "name": "X", "email": "x@y.co", "password": "123" }` | **400** `Password must be at least 6 characters` |
| `POST /clients` with `{}` | **400** `Name is required` |
| `POST /projects` with `{ "client": "{{clientId}}", "hourlyRate": 100 }` | **400** `Name is required` |
| `POST /projects` with `{ "name": "X", "hourlyRate": 100 }` | **400** `Client is required` |
| `POST /projects` with `{ "name": "X", "client": "{{clientId}}" }` | **400** `Hourly rate is required` |
| `POST /projects` with `{ "name": "X", "client": "{{clientId}}", "hourlyRate": -5 }` | **400** `Hourly rate must be 0 or more` |
| `POST /time-logs` with `{ "date": "2026-09-10", "hours": 1 }` | **400** `Project is required` |
| `POST /time-logs` with `{ "project": "{{projectId}}", "hours": 1 }` | **400** `Date is required` |
| `POST /time-logs` with `{ "project": "{{projectId}}", "date": "2026-09-10" }` | **400** `Hours is required` |
| `POST /time-logs` with `{ "project": "{{projectId}}", "date": "2026-09-10", "hours": 0 }` | **400** `Hours must be greater than 0` |
| `POST /time-logs` with `{ "project": "{{projectId}}", "date": "2026-02-31", "hours": 1 }` | **400** `Date must be a valid date (YYYY-MM-DD)` |
| `GET /projects/abc` | **400** `Invalid Project ID` |
| Any protected route with no `Authorization` header | **401** `Not authorized, token missing` |
| Any protected route with `Authorization: Bearer garbage` | **401** `Not authorized, token invalid or expired` |
| `GET {{baseUrl}}/does-not-exist` | **404** `Route not found: GET /api/does-not-exist` |

Finally, clean up as User A: `DELETE {{baseUrl}}/projects/{{projectId}}` -> **200** `Project and its time logs deleted`, then `DELETE {{baseUrl}}/clients/{{clientId}}` -> **200** `Client deleted`.
