# আড্ডা — Bangladesh Real-time Chat

Real-time chat app with MongoDB persistence. Built with Node.js, Express, Socket.io, and MongoDB Atlas.

## Quick Start (Local)

```bash
npm install
npm start
```

Open http://localhost:3001

For development with auto-reload:
```bash
npm run dev
```

## Project Structure

```
addda/
├── server.js          # Express + Socket.io server
├── models/
│   ├── Message.js     # Chat message schema
│   └── Room.js        # Room schema
├── public/
│   └── index.html     # Frontend (served by Express)
├── .env               # MongoDB URI + port
└── package.json
```

## Environment Variables (.env)

```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/addda
PORT=3001
```

## Deploy to Render (Free)

1. Push this folder to a GitHub repo
2. Go to https://render.com → New Web Service
3. Connect your repo
4. Set:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. Add Environment Variable:
   - `MONGO_URI` = your MongoDB Atlas connection string
6. Deploy — your app will be live at `https://your-app.onrender.com`

## Features

- Real-time messaging via Socket.io
- Message history stored in MongoDB (last 100 per room)
- Typing indicators
- Live online user list
- Shareable Room IDs
- No login required
- Mobile responsive
