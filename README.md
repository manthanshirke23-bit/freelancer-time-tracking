# Freelancer Time Tracking and Invoicing System

A full-stack web application (MERN) where freelancers register clients and projects, log the hours they work, and see how much to invoice for each project. The invoice total is calculated by a **MongoDB aggregation pipeline**, not by the frontend.

---

## 1. Problem Statement

Freelancers usually track their hours in notebooks or spreadsheets and calculate invoices by hand. This is slow and error-prone: hours are forgotten, rates are applied incorrectly, and there is no single place to see how much a client owes.

## 2. Objectives

- Let a freelancer manage **clients**, **projects** (each with an hourly rate) and **time logs**.
- Calculate invoice totals accurately on the server using MongoDB aggregation.
- Make sure every freelancer can see **only their own data**.
- Build a secure REST API with JWT authentication and password hashing.
- Provide a simple, responsive React interface.

## 3. Features

- Register and log in (JWT authentication, bcrypt password hashing)
- Clients: create, list, view, edit, delete
- Projects: create, list, view, edit, delete (each linked to one of your clients, with an hourly rate)
- Time logs: create, list, view, edit, delete, and filter by project and date range
- Invoice total per project (`hours x hourlyRate`, summed by MongoDB)
- Dashboard with client count, project count, total hours and recent time logs
- Ownership enforced in every database query
- Centralised error handling with meaningful status codes
- Responsive layout for desktop and mobile

## 4. Technologies

| Layer    | Technology                                                                 |
| -------- | -------------------------------------------------------------------------- |
| Backend  | Node.js, Express.js, MongoDB Atlas, Mongoose, JSON Web Tokens, bcryptjs, dotenv, cors |
| Frontend | React 18, Vite, React Router, Axios, plain CSS                             |

Requires **Node.js 20.19 or newer** (Node 22 LTS recommended).

## 5. Project Architecture

```
 Browser (React + Vite)
   |  Axios  (adds  Authorization: Bearer <JWT>)
   v
 Express API  (/api/...)
   |-- routes        -> which URL calls which controller
   |-- middleware    -> protect (JWT check), errorHandler
   |-- controllers   -> validation + business logic
   |-- models        -> Mongoose schemas
   v
 MongoDB Atlas
```

The backend follows the MVC idea: **models** describe data, **controllers** hold the logic, **routes** connect URLs to controllers. The frontend talks to the backend only through `src/services/api.js`.

## 6. Folder Structure

```
freelancer-time-tracking/
├── backend/
│   ├── config/db.js                  MongoDB connection
│   ├── controllers/
│   │   ├── authController.js         register, login, me
│   │   ├── clientController.js       client CRUD
│   │   ├── projectController.js      project CRUD + invoice total
│   │   └── timeLogController.js      time log CRUD + filtering
│   ├── middleware/
│   │   ├── authMiddleware.js         JWT verification
│   │   └── errorMiddleware.js        404 handler + central error handler
│   ├── models/                       User, Client, Project, TimeLog
│   ├── routes/                       authRoutes, clientRoutes, projectRoutes, timeLogRoutes
│   ├── utils/
│   │   ├── generateToken.js          creates the JWT
│   │   ├── asyncHandler.js           forwards async errors to the error handler
│   │   ├── httpError.js              error with an HTTP status code
│   │   ├── validate.js               input validation helpers
│   │   └── findOwned.js              "find my document" helper (ownership check)
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/               Navbar, ProtectedRoute, ProjectCard, TimeLogForm, Loading
│   │   ├── pages/                    Login, Register, Dashboard, Projects, LogTime, InvoiceSummary
│   │   ├── services/api.js           Axios instance + login-state helpers
│   │   ├── utils/format.js           display formatting (currency, dates)
│   │   ├── App.jsx, main.jsx, index.css
│   ├── index.html
│   ├── vercel.json                   makes page refresh work on Vercel
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
├── API_TESTING.md                    step-by-step Postman / Thunder Client guide
├── README.md
└── .gitignore
```

## 7. Database Schema

**User**

| Field     | Type   | Rules                                                     |
| --------- | ------ | --------------------------------------------------------- |
| name      | String | required                                                  |
| email     | String | required, unique, lowercase, valid format                 |
| password  | String | required, min 6 characters, stored as a bcrypt hash, hidden from queries (`select: false`) |
| createdAt | Date   | default: now                                              |

**Client**

| Field      | Type                | Rules                  |
| ---------- | ------------------- | ---------------------- |
| name       | String              | required               |
| email      | String              | optional               |
| phone      | String              | optional               |
| freelancer | ObjectId -> User    | required, set by server |
| createdAt  | Date                | default: now           |

**Project**

| Field       | Type               | Rules                   |
| ----------- | ------------------ | ----------------------- |
| name        | String             | required                |
| description | String             | optional                |
| client      | ObjectId -> Client | required                |
| freelancer  | ObjectId -> User   | required, set by server |
| hourlyRate  | Number             | required, >= 0          |
| createdAt   | Date               | default: now            |

**TimeLog**

| Field       | Type                | Rules                   |
| ----------- | ------------------- | ----------------------- |
| project     | ObjectId -> Project | required                |
| freelancer  | ObjectId -> User    | required, set by server |
| date        | Date                | required                |
| hours       | Number              | required, > 0           |
| description | String              | optional                |
| createdAt   | Date                | default: now            |

Relationships: one User has many Clients, Projects and TimeLogs. One Client has many Projects. One Project has many TimeLogs.

## 8. Authentication Flow

1. The user registers (`POST /api/auth/register`). The password is hashed with bcryptjs (10 salt rounds) before it is saved.
2. The server returns a JWT that contains the user's ID (`{ id }`) and expires in 7 days. Logging in (`POST /api/auth/login`) returns the same kind of response.
3. The React app stores the token and basic user info in `localStorage`.
4. The Axios instance in `services/api.js` adds `Authorization: Bearer <token>` to every request.
5. `authMiddleware.js` reads the header, verifies the token with `JWT_SECRET`, and sets `req.user.id`. A missing, malformed, invalid or expired token gets a `401`.
6. If any API call returns `401`, the frontend clears the stored login and sends the user to `/login`.

## 9. Authorization Flow

Authentication answers "who are you?". Authorization answers "is this yours?". In this project:

- The owner of a new resource is **always** `req.user.id` (from the verified JWT). A `freelancer` value sent in the request body is ignored.
- Every read, update and delete looks the document up with **both** its ID and the owner:

  ```js
  Project.findOne({ _id: projectId, freelancer: req.user.id })
  ```

  This is done by one shared helper, `utils/findOwned.js`, used by all controllers.
- List endpoints always include `{ freelancer: req.user.id }` in the query, including filtered time-log searches.
- When creating a project or time log, the referenced client or project must also belong to the logged-in user.
- If a document exists but belongs to someone else, the API answers **404 Not Found** (not 403). This is deliberate: a 403 would confirm that the ID exists. The `403` status is therefore not used anywhere; a missing/invalid token is `401`.

Because ownership is part of the database query, changing an ObjectId in the URL can never expose another user's data.

## 10. API Documentation

All routes except register and login need the header `Authorization: Bearer <token>`. Errors look like `{ "message": "Project not found" }`.

**Auth**

| Method | Endpoint             | Description                        |
| ------ | -------------------- | ---------------------------------- |
| POST   | /api/auth/register   | Create account, returns token + user |
| POST   | /api/auth/login      | Log in, returns token + user       |
| GET    | /api/auth/me         | Current user                       |

**Clients**

| Method | Endpoint          | Description                                  |
| ------ | ----------------- | -------------------------------------------- |
| POST   | /api/clients      | Create a client                              |
| GET    | /api/clients      | List my clients                              |
| GET    | /api/clients/:id  | Get one client                               |
| PUT    | /api/clients/:id  | Update a client                              |
| DELETE | /api/clients/:id  | Delete a client (refused if it has projects) |

**Projects**

| Method | Endpoint                        | Description                                  |
| ------ | ------------------------------- | -------------------------------------------- |
| POST   | /api/projects                   | Create a project                             |
| GET    | /api/projects                   | List my projects (with client name)          |
| GET    | /api/projects/:id               | Get one project                              |
| PUT    | /api/projects/:id               | Update a project                             |
| DELETE | /api/projects/:id               | Delete a project **and its time logs**       |
| GET    | /api/projects/:id/invoice-total | Total hours and invoice total (aggregation)  |

**Time logs**

| Method | Endpoint             | Description                                        |
| ------ | -------------------- | -------------------------------------------------- |
| POST   | /api/time-logs       | Create a time log                                  |
| GET    | /api/time-logs       | List my time logs. Optional `?project=&from=&to=`  |
| GET    | /api/time-logs/:id   | Get one time log                                   |
| PUT    | /api/time-logs/:id   | Update a time log                                  |
| DELETE | /api/time-logs/:id   | Delete a time log                                  |

Filters work alone or together. `from` and `to` use `YYYY-MM-DD` and are both **inclusive** (a date-only `to` includes the whole day). Dates are treated as UTC.

**Status codes**

| Code | Meaning                                                            |
| ---- | ------------------------------------------------------------------ |
| 200  | Success                                                            |
| 201  | Resource created                                                   |
| 400  | Validation error or invalid ID                                     |
| 401  | Missing, invalid or expired token; wrong login                     |
| 404  | Resource not found (or not yours), unknown route                   |
| 500  | Unexpected server error (details are logged, not sent to the client) |

## 11. Invoice Aggregation Explained

`GET /api/projects/:id/invoice-total` first checks that the project belongs to the logged-in user (`404` otherwise). Then MongoDB does the maths:

```js
TimeLog.aggregate([
  { $match: { project: project._id, freelancer: <logged-in user id> } },
  { $lookup: { from: 'projects', localField: 'project', foreignField: '_id', as: 'projectInfo' } },
  { $unwind: '$projectInfo' },
  { $group: {
      _id: '$project',
      totalHours:   { $sum: '$hours' },
      invoiceTotal: { $sum: { $multiply: ['$hours', '$projectInfo.hourlyRate'] } }
  } },
  { $project: { _id: 0,
      totalHours:   { $round: ['$totalHours', 2] },
      invoiceTotal: { $round: ['$invoiceTotal', 2] } } }
])
```

| Stage      | What it does                                                                   |
| ---------- | ------------------------------------------------------------------------------ |
| `$match`   | Keeps only this freelancer's logs for this project.                            |
| `$lookup`  | Joins each log with its project document to get `hourlyRate`.                  |
| `$unwind`  | Turns the joined array into a single object per log.                           |
| `$group`   | Adds everything up: `$sum` of hours, and `$sum` of `hours x hourlyRate`.       |
| `$project` | Rounds to 2 decimals so floating-point noise such as `30.000000000000004` never appears. |

Example: rate 1500, logs of 5 h, 7.5 h and 7.5 h -> `totalHours: 20`, `invoiceTotal: 30000`. A project with no logs returns `0` for both. React only displays these numbers.

Note: the invoice always uses the project's **current** hourly rate. Changing the rate changes the total for all its logs.

## 12. Installation

```bash
cd freelancer-time-tracking

cd backend
npm install

cd ../frontend
npm install
```

## 13. Environment Variables

**backend/.env** (copy from `.env.example`)

```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/freelancer_tracker?retryWrites=true&w=majority
JWT_SECRET=a_long_random_string
```

Generate a good secret with: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

Optional: `CLIENT_URL` restricts CORS to your deployed frontend (leave it unset locally).

**frontend/.env** (copy from `.env.example`)

```
VITE_API_URL=http://localhost:5000/api
```

Never commit real `.env` files. They are already in `.gitignore`.

## 14. Running the Backend

```bash
cd backend
npm run dev      # auto-restarts on changes (nodemon)
# or
npm start        # plain node
```

You should see `MongoDB connected: ...` and `Server running on port 5000`. Health check: http://localhost:5000/api/health

## 15. Running the Frontend

```bash
cd frontend
npm run dev
```

Open http://localhost:5173. Register an account, add a client, create a project, log time, then open the project's invoice.

## 16. Testing

Follow [API_TESTING.md](API_TESTING.md) in Postman or Thunder Client. It covers every endpoint, a full happy-path sequence, filtering, validation errors, and the cross-user ownership tests (User B must not reach User A's data).

The project has no automated test suite; testing is manual through the API and the UI.

## 17. Deployment

**MongoDB Atlas** (database)

1. Create a free M0 cluster at https://cloud.mongodb.com.
2. Database Access -> add a database user (username + password).
3. Network Access -> add an IP address. For Render/Railway (which have changing IPs) use `0.0.0.0/0`.
4. Connect -> Drivers -> copy the connection string, put the password in, and add a database name (`/freelancer_tracker`). If the password has special characters, URL-encode them.

**Backend on Render** (Railway is similar)

1. Push the project to GitHub.
2. Render -> New -> Web Service -> select the repo.
3. Root Directory: `backend`. Build Command: `npm install`. Start Command: `npm start`.
4. Environment variables: `MONGO_URI`, `JWT_SECRET` (Render sets `PORT` itself, but you may also add it). After the frontend is deployed, add `CLIENT_URL` with the Vercel URL.
5. Deploy and note the URL, e.g. `https://freelancer-api.onrender.com`. Check `/api/health`.

On Railway: New Project -> Deploy from GitHub -> set the root directory to `backend`, add the same variables, and generate a public domain.

**Frontend on Vercel**

1. Vercel -> Add New Project -> select the repo.
2. Root Directory: `frontend`. Framework preset: Vite (build `npm run build`, output `dist`).
3. Environment variable: `VITE_API_URL` = `https://<your-backend-url>/api`.
4. Deploy. `vercel.json` makes sure refreshing pages such as `/dashboard` works.

`VITE_API_URL` is baked in at build time, so redeploy the frontend after changing it. Free Render services sleep when idle, so the first request after a pause can take about a minute.

## 18. Future Enhancements

- Live start/stop timer
- Downloadable PDF invoices and invoice history
- Different rates per time log, and currency selection
- Edit and delete screens for clients, projects and time logs in the UI
- Pagination and search for long lists
- Email delivery of invoices, password reset
- Automated tests (Jest and Supertest)
- Refresh tokens and httpOnly cookies instead of `localStorage`
