const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from the backend/.env file.
dotenv.config();

const app = express();
// Fall back to 5009 if the environment does not specify a port.
const requestedPort = Number(process.env.PORT || 5009);

// Enable cross-origin requests so the frontend can call the backend.
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Receive chat messages from the frontend and forward them to the configured provider.
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ error: 'A non-empty message is required.' });
    }

    const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || process.env.COHERE_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key is not configured. Please set GROQ_API_KEY, OPENAI_API_KEY, COHERE_API_KEY, or API_KEY in backend/.env.' });
    }

    const useProvider = process.env.API_PROVIDER
      ? process.env.API_PROVIDER.toLowerCase()
      : 'cohere';

    let response;
    let data;
    let reply;
    let model;
    let rawMessage;

    if (useProvider === 'openai' || useProvider === 'groq') {
      const isGroq = useProvider === 'groq';
      model = isGroq ? (process.env.GROQ_MODEL || 'llama-3.1-8b-instant') : (process.env.OPENAI_MODEL || 'gpt-4o-mini');
      const endpoint = isGroq
        ? 'https://api.groq.com/openai/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';
      const providerName = isGroq ? 'Groq' : 'OpenAI';

      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: message }],
          temperature: 0.2
        })
      });

      data = await response.json();

      if (!response.ok) {
        rawMessage = data?.error?.message || `${providerName} API request failed.`;
        const lower = rawMessage.toLowerCase();
        let userMessage = rawMessage;
        let statusCode = response.status;

        if (lower.includes('quota') || lower.includes('rate limit') || lower.includes('rate limit exceeded')) {
          userMessage = `${providerName} quota has been reached or is not available for this API key. Please check your ${providerName} plan or use a different key.`;
          statusCode = 429;
        } else if (lower.includes('model') && lower.includes('not found')) {
          userMessage = `The ${providerName} model '${model}' is unavailable. Update ${isGroq ? 'GROQ_MODEL' : 'OPENAI_MODEL'} in backend/.env to a supported model.`;
          statusCode = 400;
        } else if (lower.includes('permission') || lower.includes('access denied')) {
          userMessage = `Your ${providerName} API key does not have permission to access this model. Check your ${providerName} account settings.`;
          statusCode = 403;
        }

        console.error(`${providerName} API error:`, rawMessage, data);
        return res.status(statusCode).json({ error: userMessage, details: rawMessage });
      }

      reply = data?.choices?.[0]?.message?.content || 'No response generated.';
      return res.json({ reply });
    }

    model = process.env.COHERE_MODEL || 'command-r-plus';
    response = await fetch('https://api.cohere.com/v2/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: message }],
        temperature: 0.2
      })
    });

    data = await response.json();

    if (!response.ok) {
      rawMessage = data?.message || data?.error?.message || 'Cohere API request failed.';
      const lower = rawMessage.toLowerCase();
      let userMessage = rawMessage;
      let statusCode = response.status;

      if (lower.includes('quota') || lower.includes('rate limit') || lower.includes('limit: 0')) {
        userMessage = 'Cohere quota has been reached or is not available for this API key. Please check your Cohere plan or use a different key.';
        statusCode = 429;
      } else if (lower.includes('model') && lower.includes('not found')) {
        userMessage = `The Cohere model '${model}' is unavailable. Update COHERE_MODEL in backend/.env to a supported model.`;
        statusCode = 400;
      } else if (lower.includes('permission') || lower.includes('access denied')) {
        userMessage = 'Your Cohere API key does not have permission to access the model. Check your Cohere account settings.';
        statusCode = 403;
      }

      console.error('Cohere API error:', rawMessage, data);
      return res.status(statusCode).json({ error: userMessage, details: rawMessage });
    }

    reply = data?.message?.content?.[0]?.text || 'No response generated.';
    return res.json({ reply });
  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: 'Server error while contacting the configured AI provider.' });
  }
});

const startServer = (portToUse) => {
  const server = app.listen(portToUse, '0.0.0.0', () => {
    const address = server.address();
    const actualPort = typeof address === 'object' && address ? address.port : portToUse;
    console.log(`Backend running on http://localhost:${actualPort}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.warn(`Port ${portToUse} is busy. Trying an available port instead...`);
      server.close(() => startServer(0));
    } else {
      console.error('Failed to start backend server:', error);
      process.exit(1);
    }
  });
};

startServer(requestedPort);
