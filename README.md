# AI Assistant with React, Vite, Node.js, Express, and Gemini

This project contains:
- A React + Vite frontend in the frontend folder
- A Node.js + Express backend in the backend folder
- Gemini API integration for chat responses
- A clean chat UI with a loading animation and error handling

## Requirements
- Node.js 18+ recommended
- A Google Gemini API key

## 1. Create a Gemini API key
1. Go to https://aistudio.google.com/
2. Create a new API key
3. Copy the key

## 2. Configure the backend environment
1. Open the backend folder
2. Replace the value in backend/.env with your real Gemini API key

Example:
```env
PORT=5009
API_KEY=your_api_key_here
API_PROVIDER=openai
OPENAI_MODEL=gpt-4o-mini
```

If you use an OpenAI key, set `API_PROVIDER=openai` and `OPENAI_MODEL` to a supported model.
If you use a Google Gemini key, set `API_PROVIDER=gemini` or omit it and use `API_KEY` with `GEMINI_MODEL`.

If you see a quota error, it means the selected key does not currently have requests available. In that case, verify your billing plan or use a different API key.

## 3. Run the backend
Open a terminal and run:
```bash
cd backend
npm install
npm run dev
```

The backend will run at http://localhost:5009

## 4. Run the frontend
Open a second terminal and run:
```bash
cd frontend
npm install
npm run dev
```

The frontend will run at http://localhost:5173

## 5. Use the app
1. Open http://localhost:5173
2. Type a question in the chat box
3. The backend will send the message to Gemini
4. The response will appear in the chat

## Project structure
- frontend/src/App.jsx: main chat UI
- frontend/src/App.css: chat styling
- backend/server.js: Express server and Gemini integration
- backend/.env: API key configuration

## Notes
- The backend uses CORS so the frontend can call it safely.
- The frontend displays a loading indicator while waiting for Gemini.
- API errors are surfaced in the chat UI.
