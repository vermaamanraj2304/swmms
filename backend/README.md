# SWM&MS - Backend API & Real-time Telemetry Service

This is the official Node.js, Express, MongoDB, and Socket.io backend service for the SWM&MS (Solid Waste Management & Monitoring System).

---

## 🚀 Key Features

1. **Multi-Role User Authentication & Management**
   - Support for 4 distinct roles: `resident`, `driver`, `admin`, `superadmin`.
   - JWT authentication and bcrypt password hashing.

2. **Real-time Live GPS Tracking & Telemetry (Socket.io)**
   - Drivers broadcast live GPS location coordinates, heading, and speed in real-time.
   - Live location stream is received by residents for map tracking and city admins for fleet monitoring.

3. **Geofenced Proximity & Doorstep Ringtone Alerts**
   - Automatic triggers when driver reaches within **100 meters** of resident house (`proximity-alert`).
   - High-volume ringtone alert when driver arrives directly at house doorstep (`doorstep-alert`).

4. **Emergency Overflow Dispatching**
   - Instant socket event broadcast on creation of emergency garbage pickup request.
   - Direct driver assignment and status updates (`PENDING_DISPATCH` -> `DISPATCHED` -> `ON THE WAY` -> `RESOLVED`).

5. **Multi-Tenant Global Superadmin HQ**
   - Add, suspend, edit, or delete municipal authorities (`City`).
   - Global revenue metrics, active fleet statistics, and security audit logging (`AuditLog`).

---

## 📂 Backend Project Structure

```
backend/
├── config/
├── middleware/
│   └── auth.js              # JWT & role authorization middleware
├── models/
│   ├── User.js              # User schema for all 4 roles
│   ├── City.js              # Superadmin municipality schema
│   ├── Route.js             # Drivers routes and route stops schema
│   ├── EmergencyRequest.js # Emergency pickups schema
│   ├── Complaint.js         # Resident complaints schema
│   ├── Collection.js        # Historical collections log schema
│   └── AuditLog.js          # System audit log schema
├── routes/
│   ├── authRoutes.js        # Register, login, demo-login endpoints
│   ├── residentRoutes.js    # Resident dashboard, emergencies, complaints
│   ├── driverRoutes.js      # Driver duty toggle, GPS location, pickup status
│   ├── adminRoutes.js       # Admin stats, driver assignment, residents list
│   └── superadminRoutes.js  # Global HQ city onboarding, audit logs
├── .env                     # Environment variables configuration
├── package.json             # Dependencies and scripts
└── server.js                # Express & Socket.io server entry point
```

---

## 🛠️ Installation & Setup

### 1. Requirements
- **Node.js**: v18+
- **MongoDB**: Running locally on `mongodb://localhost:27017` or a MongoDB Atlas URI.

### 2. Install Dependencies
```bash
cd backend
npm install
```

### 3. Environment Variables (`.env`)
```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/trackmytrash
JWT_SECRET=tmt_super_secret_jwt_key_2026_smart_waste
NODE_ENV=development
```

### 4. Seed Initial Database
Populate database with demo users, initial routes, emergency requests, complaints, and cities:
```bash
npm run seed
```

### 5. Start Backend Server
```bash
npm start
# or with dev watching:
npm run dev
```

---

## 📡 REST API Endpoint Reference

### Auth Routes (`/api/auth`)
- `POST /api/auth/login` - User authentication (email, password)
- `POST /api/auth/demo-login` - Fast role-based login (`role`: `resident` | `driver` | `admin` | `superadmin`)
- `POST /api/auth/register` - Create user account

### Resident Routes (`/api/resident`)
- `GET /api/resident/dashboard` - Get resident stats, assigned driver, collections, emergency requests
- `POST /api/resident/emergency-request` - Create emergency garbage pickup request
- `POST /api/resident/complaint` - Submit missed pickup or broken bin complaint
- `POST /api/resident/confirm-pickup/:id` - Confirm collection pickup
- `POST /api/resident/switch-plan` - Update eco-subscription plan

### Driver Routes (`/api/driver`)
- `GET /api/driver/dashboard` - Get driver shift stats, active route stops, emergencies
- `POST /api/driver/location-update` - Broadcast driver live GPS lat/lng location
- `POST /api/driver/toggle-duty` - Toggle driver duty & broadcasting status (`isOnDuty`)
- `POST /api/driver/mark-stop` - Mark route stop as `PICKED` or `SKIPPED` with photo proof
- `POST /api/driver/accept-emergency/:id` - Accept assigned emergency request

### Admin Routes (`/api/admin`)
- `GET /api/admin/dashboard` - City metrics, residents list, drivers list, open complaints
- `POST /api/admin/add-resident` - Register new resident in municipal database
- `POST /api/admin/add-driver` - Onboard new collection truck driver
- `POST /api/admin/assign-emergency` - Dispatch driver to emergency request
- `POST /api/admin/resolve-complaint/:id` - Mark complaint as resolved

### Superadmin Routes (`/api/superadmin`)
- `GET /api/superadmin/dashboard` - Global platform stats, all municipalities, audit logs
- `POST /api/superadmin/add-city` - Onboard new city municipality authority
- `POST /api/superadmin/toggle-city-status/:id` - Toggle city status (`Active` / `Suspended`)
- `DELETE /api/superadmin/delete-city/:id` - Delete city authority record

---

## ⚡ Socket.io Real-Time Events

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `update-location` | Client -> Server -> All | `{ lat, lng, speedKm }` | Driver live GPS stream |
| `driver-location-update` | Server -> All | `{ driverId, location }` | Broadcast location update |
| `proximity-alert` | Server -> Resident | `{ title, message }` | Driver within 100m alert |
| `doorstep-alert` | Server -> Resident | `{ title, message }` | Driver at house doorstep chime |
| `emergency-created` | Server -> All | `EmergencyRequest Object` | New emergency request created |
| `emergency-assigned` | Server -> Driver/Admin | `EmergencyRequest Object` | Driver assigned to emergency |

---
