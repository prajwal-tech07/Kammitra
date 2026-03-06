<div align="center">

# 🤝 KaamMitra

**Hyperlocal Job Board for India's Informal Workforce**

Connecting blue-collar workers — plumbers, electricians, drivers, cleaners & more — with local employers through a simple, multilingual, mobile-friendly platform.

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.7-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Internationalization](#-internationalization)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**KaamMitra** (_काम मित्र_ — "Work Friend") is a full-stack web application designed to bridge the gap between India's informal workers and local employers. Traditional job boards don't serve daily-wage and blue-collar workers well — KaamMitra solves that with:

- **Phone-based login** — no email or password required
- **Multilingual UI** — supports Hindi, English, Kannada, Tamil & Telugu
- **AI-powered chatbot** — helps workers with job advice, labor laws & document analysis
- **Government scheme discovery** — personalized scheme recommendations with live news updates

---

## ✨ Features

### For Workers
- 📱 One-tap phone login (no passwords)
- 🛠️ Profile setup — skills, availability, location
- 🔍 Browse & apply to local jobs with one click
- 📊 Track all applications and their status
- ⭐ Build reputation through employer ratings
- 🏛️ Discover eligible government schemes (MGNREGA, eShram, PM-JAY, etc.)

### For Employers
- 📝 Post jobs with category, pay, and location details
- 👥 View applicants with full profiles, skills & ratings
- ✅ Accept/reject applicants & mark jobs as filled
- ⭐ Rate workers after job completion

### AI Chatbot (Groq-powered)
- 💬 Career advice for blue-collar workers
- 📄 Document & image analysis (upload support up to 10 MB)
- ⚖️ Indian labor law & minimum wage guidance
- 🌐 Hindi/English conversational support

### Government Schemes
- 🔄 Auto-updated scheme news via RSS feeds (6-hour cron)
- 🎯 Personalized recommendations based on worker skills
- 📋 Track scheme application status
- 🗣️ Bilingual scheme info (Hindi & English)

---

## 🛠 Tech Stack

| Layer        | Technology                                             |
| ------------ | ------------------------------------------------------ |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, React Router |
| **Backend**  | Node.js, Express.js, Mongoose ODM                      |
| **Database** | MongoDB (Atlas or local)                               |
| **Auth**     | JWT (phone-based, 7-day tokens)                        |
| **AI**       | Groq SDK, Google Generative AI (Gemini)                |
| **i18n**     | i18next with browser language auto-detection           |
| **Cron**     | node-cron (RSS feed parsing for scheme news)           |
| **Upload**   | Multer (images, PDFs, documents)                       |

---

## 📁 Project Structure

```
KaamMitra/
├── client/                     # React frontend
│   ├── src/
│   │   ├── pages/              # Route pages (Home, Worker, Employer, Dashboards, etc.)
│   │   ├── components/         # Shared components (Navbar, Layout, Chatbot)
│   │   ├── context/            # React context (AuthContext)
│   │   ├── i18n/               # Translation files (en, hi, kn, ta, te)
│   │   └── App.tsx             # Main router
│   ├── tailwind.config.js
│   └── vite.config.ts          # Vite config with API proxy
│
├── server/                     # Express backend
│   ├── src/
│   │   ├── config/             # Database connection
│   │   ├── middleware/         # Auth & role-based middleware
│   │   ├── models/             # Mongoose schemas (User, Job, Application, Scheme, etc.)
│   │   ├── routes/             # API route handlers
│   │   ├── cron/               # Scheduled tasks (scheme news RSS)
│   │   ├── seed/               # Database seeders
│   │   └── index.js            # App entry point
│   └── uploads/                # File upload directory
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **MongoDB** (local instance or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **Groq API Key** — [Get one here](https://console.groq.com/keys)
- **Gemini API Key** _(optional)_ — [Get one here](https://aistudio.google.com/apikey)

### Installation

```bash
# Clone the repository
git clone https://github.com/prajwal-tech07/Kammitra.git
cd Kammitra

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### Configuration

```bash
# Create your environment file
cp server/.env.example server/.env
```

Edit `server/.env` with your credentials (see [Environment Variables](#-environment-variables)).

### Run Development Servers

```bash
# Terminal 1 — Backend (http://localhost:5000)
cd server
npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd client
npm run dev
```

### Verify Setup

| Service      | URL                                |
| ------------ | ---------------------------------- |
| Frontend     | http://localhost:5173              |
| API Server   | http://localhost:5000              |
| Health Check | http://localhost:5000/api/health   |

> Vite automatically proxies `/api` requests to the backend — no CORS issues in development.

---

## 🔐 Environment Variables

Create a `server/.env` file based on `server/.env.example`:

```env
# Express server port
PORT=5000

# MongoDB connection string
MONGO_URI=mongodb://localhost:27017/kaammitra

# JWT secret (use a strong random string)
JWT_SECRET=your_jwt_secret_here

# Groq API Key (for AI chatbot)
GROQ_API_KEY=gsk_xxxxx

# Google Gemini API Key (optional)
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 📡 API Reference

### Authentication
| Method | Endpoint                | Description           |
| ------ | ----------------------- | --------------------- |
| POST   | `/api/auth/phone-login` | Login with phone+role |
| PATCH  | `/api/auth/update-name` | Update user name      |

### Jobs
| Method | Endpoint               | Description              |
| ------ | ---------------------- | ------------------------ |
| GET    | `/api/jobs`            | Browse open jobs         |
| POST   | `/api/jobs/:id/apply`  | Apply to a job           |

### Worker
| Method | Endpoint                  | Description              |
| ------ | ------------------------- | ------------------------ |
| POST   | `/api/worker/profile`     | Create/update profile    |
| GET    | `/api/worker/profile`     | Get worker profile       |
| GET    | `/api/worker/full-profile`| Full profile with stats  |
| GET    | `/api/worker/applications`| List applications        |

### Employer
| Method | Endpoint                           | Description            |
| ------ | ---------------------------------- | ---------------------- |
| POST   | `/api/employer/jobs`               | Post a new job         |
| GET    | `/api/employer/jobs`               | List employer's jobs   |
| GET    | `/api/employer/jobs/:id/applicants`| View applicants        |
| PATCH  | `/api/employer/jobs/:id/fill`      | Mark job as filled     |
| POST   | `/api/employer/jobs/:id/rate`      | Rate a worker          |

### Schemes
| Method | Endpoint                        | Description                   |
| ------ | ------------------------------- | ----------------------------- |
| GET    | `/api/schemes`                  | List active schemes           |
| GET    | `/api/schemes/eligible`         | Top 5 matching schemes        |
| POST   | `/api/schemes/apply`            | Apply to a scheme             |

### Chat (AI)
| Method | Endpoint     | Description                          |
| ------ | ------------ | ------------------------------------ |
| POST   | `/api/chat`  | Send message + optional file upload  |

---

## 🌐 Internationalization

KaamMitra supports **5 languages** to serve India's diverse workforce:

| Language | Code | File        |
| -------- | ---- | ----------- |
| English  | `en` | `en.json`   |
| Hindi    | `hi` | `hi.json`   |
| Kannada  | `kn` | `kn.json`   |
| Tamil    | `ta` | `ta.json`   |
| Telugu   | `te` | `te.json`   |

- **Auto-detection** — defaults to browser language
- **Manual switch** — language selector in the navbar
- **Persistent** — preference saved to `localStorage`

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for India's informal workforce**

</div>
