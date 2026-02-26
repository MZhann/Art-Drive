# ArtDrive - Photography Competition Platform

> Kazakhstan's Premier Online Platform for Photographer Competitions and Content Sharing

![ArtDrive Banner](https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1200)

## 📋 Overview

ArtDrive is a gamified competitive platform that combines:
- **Portfolio Platform** - Showcase your photography work
- **Real-time Tournaments** - Compete in themed photography competitions
- **Community Networking** - Connect with fellow photographers
- **Employer Marketplace** - Find photography jobs
- **Monetization & Rewards** - Earn points, badges, and prizes

## 🚀 Features

### Authentication & Roles
- User registration with JWT authentication
- **DEV Mode**: Uses localStorage for quick development testing
- **PROD Mode**: Full backend JWT authentication
- Role-based access: Photographer, Employer, Admin, Judge

### Tournament System
- Live/Upcoming/Past tournament filtering
- Real-time countdown timers
- Participant registration
- Voting system with live leaderboard
- Prize fund tracking

### User Profiles
- Professional portfolio showcase
- Points & leveling system
- Achievement badges
- Tournament history
- Social links integration

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express.js**
- **MongoDB** with Mongoose
- **JWT** for authentication
- **Socket.IO** for real-time features

### Frontend
- **React** 18
- **React Router** v6
- **Framer Motion** for animations
- **Axios** for API calls
- **Lucide React** for icons

## 📁 Project Structure

```
Art-Drive/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── auth.config.js
│   │   │   └── database.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── user.controller.js
│   │   │   └── tournament.controller.js
│   │   ├── middleware/
│   │   │   └── auth.middleware.js
│   │   ├── models/
│   │   │   ├── User.model.js
│   │   │   └── Tournament.model.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── user.routes.js
│   │   │   └── tournament.routes.js
│   │   └── server.js
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout/
│   │   ├── config/
│   │   │   └── api.config.js
│   │   ├── contexts/
│   │   │   └── AuthContext.js
│   │   ├── pages/
│   │   │   ├── Home.js
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Tournaments.js
│   │   │   ├── TournamentDetail.js
│   │   │   └── Profile.js
│   │   ├── services/
│   │   │   └── api.service.js
│   │   ├── styles/
│   │   │   └── index.css
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
│
└── README.md
```

## ⚡ Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
cd Art-Drive
```

2. **Setup Backend**
```bash
cd backend
npm install

# Create .env file
echo "PORT=5000
MONGODB_URI=mongodb://localhost:27017/artdrive
JWT_SECRET=your-secret-key-here
AUTH_MODE=DEV" > .env

# Start the server
npm run dev
```

3. **Setup Frontend**
```bash
cd ../frontend
npm install

# Start React app
npm start
```

4. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## 🔐 Authentication Modes

### DEV Mode (Default)
In development mode, authentication works without a backend:

**Test Accounts:**
| Email | Role |
|-------|------|
| photographer@test.com | Photographer |
| employer@test.com | Employer |
| admin@test.com | Admin |

Password: `test123` (or any password in DEV mode)

### PROD Mode
Set `AUTH_MODE=PROD` in backend `.env` to enable full JWT authentication.

## Design System

### Colors
```css
--color-accent-primary: #a855f7;    /* Purple */
--color-accent-secondary: #6366f1;  /* Indigo */
--color-accent-cyan: #22d3ee;       /* Cyan */
--color-accent-green: #22c55e;      /* Green */
--color-accent-yellow: #eab308;     /* Yellow */
```

### Typography
- **Display Font**: Syne (for headings)
- **Body Font**: Outfit (for text)

## 📡 API Endpoints

### Authentication
```
POST /api/auth/register    - Register new user
POST /api/auth/login       - Login user
GET  /api/auth/me          - Get current user
POST /api/auth/logout      - Logout user
GET  /api/auth/config      - Get auth configuration
```

### Users
```
GET  /api/users/photographers     - List photographers
GET  /api/users/leaderboard       - Get global leaderboard
GET  /api/users/:id               - Get user by ID
GET  /api/users/username/:username - Get user by username
PUT  /api/users/profile           - Update profile (auth)
```

### Tournaments
```
GET  /api/tournaments              - List tournaments
GET  /api/tournaments/status/live  - Get live tournaments
GET  /api/tournaments/status/upcoming - Get upcoming tournaments
GET  /api/tournaments/:id          - Get tournament details
POST /api/tournaments/:id/register - Register for tournament (auth)
POST /api/tournaments/:id/vote/:participantId - Vote (auth)
GET  /api/tournaments/:id/leaderboard - Get tournament leaderboard
```

## 🗓️ Development Timeline (Week 3-11)

| Week | Focus | Status |
|------|-------|--------|
| 3 | Architecture & Planning | ✅ Complete |
| 4 | Auth & Base Structure | ✅ Complete |
| 5 | Profile & Portfolio | 🔄 In Progress |
| 6 | Tournament System | Pending |
| 7 | Voting & Leaderboard | Pending |
| 8 | Job Marketplace | Pending |
| 9 | Messaging & Notifications | Pending |
| 10 | Gamification | Pending |
| 11 | Testing & Deployment | Pending |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is part of a capstone project for educational purposes.

---

Built with ❤️ in Kazakhstan | © 2024 ArtDrive

