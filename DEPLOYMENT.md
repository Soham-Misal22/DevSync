# 🚀 DevSync Deployment Guide

This guide provides a step-by-step walkthrough for deploying the DevSync project.

## 📋 Prerequisites
- A **Google AI Studio** account (for Gemini API Key).
- A **MongoDB Atlas** account (for the database).
- A **GitHub** account (to host your repository).
- **Node.js** installed locally for building.

---

## ☁️ 1. Database Setup (MongoDB Atlas)
1. Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new Cluster (the Shared/Free tier is sufficient).
3. Under **Network Access**, add `0.0.0.0/0` (allow access from anywhere) or your server's IP address.
4. Under **Database Access**, create a user with "Read and Write to any database" permissions.
5. Click **Connect** -> **Drivers** -> Copy your **Connection String**.
   - It should looks like: `mongodb+srv://<db_username>:<db_password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority&appName=DevSync`

---

## 🛠️ 2. Backend Deployment (e.g., Render)
1. Push your code to a GitHub repository.
2. Sign in to [Render](https://render.com/).
3. Click **New +** -> **Web Service**.
4. Connect your GitHub repository.
5. Configure the service:
   - **Environment**: `Node`
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && node index.js`
6. Add the following **Environment Variables**:
   | Key | Value |
   | :--- | :--- |
   | `PORT` | `5000` |
   | `MONGO_URL` | *Your MongoDB Atlas Connection String* |
   | `JWT_SECRET` | *A long random string* |
   | `SECRET_KEY` | *Another long random string* |
   | `GEMINI_API_KEY` | *Your Gemini API Key* |
   | `NODE_ENV` | `production` |

---

## 🎨 3. Frontend Deployment (e.g., Vercel)
1. Sign in to [Vercel](https://vercel.com/).
2. Click **Add New** -> **Project**.
3. Import your GitHub repository.
4. Configure the build settings:
   - **Root Directory**: `client`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add the following **Environment Variables**:
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_BASE_URL` | *The URL of your deployed Backend (e.g., `https://devsync-api.onrender.com/api`)* |

---

## 🔧 4. Important Configuration Changes
To make the app work in production, ensure your frontend is calling the correct backend URL.

### Update `client/src/services/api.js`
Change the `baseURL` to use an environment variable:
```javascript
const API = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});
```

### CORS Configuration
In `server/index.js`, ensure CORS is restricted to your frontend domain in production:
```javascript
app.use(cors({
    origin: process.env.CLIENT_URL || "*"
}));
```

---

## ✅ 5. Verification
1. Open your deployed Frontend URL.
2. Try signing up or logging in.
3. Test the AI Task Generator to ensure the Gemini API is connected.
4. Verify that snippets and projects are being saved to MongoDB Atlas.

---

> [!TIP]
> Always keep your `.env` file out of Git by including it in `.gitignore`. Use the hosting platform's environment variable dashboard instead.
