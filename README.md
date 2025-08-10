
---
# WhatsApp Web – Frontend (React + Vite + Tailwind + Socket.IO)

## Overview
A WhatsApp Web–style UI that lists conversations, shows message threads, sends messages, and updates in real-time via Socket.IO.

## Features
- Sidebar with chat list
- Chat window with messages, timestamps, and status ticks
- Emoji picker
- New chat creation
- Real-time status updates
- Loads conversations and messages from backend API

## Tech Stack
React (Vite), Tailwind CSS, Socket.IO Client.

## Live URL
Frontend: [https://whatsapp-web-frontend.onrender.com](https://whatsapp-web-frontend.onrender.com)

## Local Setup
```bash
git clone <repo-url>
cd whatsapp-web-frontend
npm install
npm run dev

Configure Backend URL
In src/App.jsx: const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001';
