# TaskFlow — Scalable REST API with Auth & RBAC

A

##  Architecture

```
project/
├── backend/
│   ├── src/
│   │   ├── app.js              # Express app entry point
│   │   ├── config/
│   │   │   ├── database.js     # MongoDB connection
│   │   │   └── swagger.js      # Swagger/OpenAPI config
│   │   ├── controllers/
│   │   │   ├── authController.js    # Register, login, token refresh
│   │   │   ├── taskController.js    # Task CRUD + stats
│   │   │   └── userController.js    # Admin user management
│   │   ├── middleware/
│   │   │   ├── auth.js          # JWT protect + restrictTo
│   │   │   ├── errorHandler.js  # Global error handler
│   │   │   └── rateLimiter.js   # express-rate-limit
│   │   ├── models/
│   │   │   ├── User.js          # User schema + password hashing
│   │   │   └── Task.js          # Task schema + indexes
│   │   ├── routes/
│   │   │   ├── authRoutes.js    # /api/v1/auth/*
│   │   │   ├── taskRoutes.js    # /api/v1/tasks/*
│   │   │   └── adminRoutes.js   # /api/v1/admin/* (admin only)
│   │   ├── utils/
│   │   │   ├── apiResponse.js   # Standardized response helpers
│   │   │   ├── jwtUtils.js      # Token generation/verification
│   │   │   └── logger.js        # Winston logger
│   │   └── validators/
│   │       ├── authValidator.js  # express-validator rules
│   │       └── taskValidator.js
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Routes + protected routes
│   │   ├── context/
│   │   │   └── AuthContext.js   # Global auth state
│   │   ├── hooks/
│   │   │   └── useTasks.js      # Task CRUD hook
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx    # Task management UI
│   │   │   └── AdminPanel.jsx   # User & task admin
│   │   ├── components/
│   │   │   ├── Layout.jsx       # Sidebar + nav
│   │   │   └── TaskModal.jsx    # Create/edit task modal
│   │   └── services/
│   │       └── api.js           # Axios + auto token refresh
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
└── docker-compose.yml





```


---

## 🔑API Reference

### Authentication Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/register` | None | Register new user |
| POST | `/api/v1/auth/login` | None | Login, get JWT tokens |
| POST | `/api/v1/auth/refresh-token` | None | Refresh access token |
| POST | `/api/v1/auth/logout` | Bearer | Invalidate refresh token |
| GET | `/api/v1/auth/me` | Bearer | Get current user profile |
| PATCH | `/api/v1/auth/change-password` | Bearer | Change password |

### Task Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/tasks` | Bearer | Get tasks (paginated, filtered) |
| POST | `/api/v1/tasks` | Bearer | Create task |
| GET | `/api/v1/tasks/:id` | Bearer | Get task by ID |
| PUT | `/api/v1/tasks/:id` | Bearer | Update task |
| DELETE | `/api/v1/tasks/:id` | Bearer | Delete task |
| GET | `/api/v1/tasks/stats` | Bearer | Task statistics |

### Admin Endpoints (Admin Role Required)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/admin/stats` | Admin | Platform stats |
| GET | `/api/v1/admin/users` | Admin | List all users |
| GET | `/api/v1/admin/users/:id` | Admin | Get user by ID |
| PATCH | `/api/v1/admin/users/:id` | Admin | Update user role/status |
| DELETE | `/api/v1/admin/users/:id` | Admin | Delete user + tasks |
| GET | `/api/v1/admin/tasks` | Admin | All tasks platform-wide |

---

##  Security Features

- **Helmet.js** — HTTP security headers
- **CORS** — Configurable origin whitelist
- **Rate Limiting** — 100 req/15min global; 10 req/15min for auth
- **MongoDB Sanitization** — Prevents NoSQL injection
- **Password Hashing** — bcrypt with salt rounds = 12
- **JWT Dual Token** — Short-lived access (7d) + refresh (30d) tokens
- **Input Validation** — express-validator on all inputs
- **Role-Based Access** — `protect` + `restrictTo('admin')` middleware

---

##  Database Schema

### User
```
_id, name, email (unique), password (hashed), role (user|admin),
isActive, refreshToken, lastLogin, passwordChangedAt, timestamps
```

### Task
```
_id, title, description, status (todo|in-progress|done),
priority (low|medium|high), dueDate, tags[], owner (ref: User),
isArchived, completedAt, timestamps
Indexes: { owner, status }, { owner, createdAt }, text index
```

---

##  API Documentation

Swagger UI available at: **http://localhost:5000/api-docs**

All endpoints are documented with:
- Request body schemas
- Response examples
- Authentication requirements
- Query parameter descriptions

---

##  Extending the API

To add a new module (e.g., `notes`):

1. **Model** → `src/models/Note.js`
2. **Controller** → `src/controllers/noteController.js`
3. **Validator** → `src/validators/noteValidator.js`
4. **Routes** → `src/routes/noteRoutes.js` (with Swagger JSDoc)
5. **Register** → `app.js`: `app.use('/api/v1/notes', noteRoutes)`

The pattern is consistent and scalable across all modules.

---

##  Environment Variables

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/taskmanager
JWT_SECRET=your_super_secret_32+_char_key
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRE=30d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
CLIENT_URL=http://localhost:3000
```
