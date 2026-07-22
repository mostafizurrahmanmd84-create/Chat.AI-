import { useMemo, useState } from 'react';
import './App.css';

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5009';

const starterMessages = [
  {
    id: 1,
    role: 'assistant',
    content: 'Hello! I am your AI assistant of Mostafizur Rahman. Ask me anything!',
  },
];

function App() {
  const [messages, setMessages] = useState(starterMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const canSend = input.trim().length > 0 && !isLoading;

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: trimmedInput,
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: trimmedInput }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to contact Cohere.');
      }

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.reply,
      };

      setMessages((currentMessages) => [...currentMessages, assistantMessage]);
    } catch (error) {
      const assistantMessage = {
        id: Date.now() + 2,
        role: 'assistant',
        content: `Sorry, something went wrong. ${error.message}`,
      };
      setMessages((currentMessages) => [...currentMessages, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const messageCount = useMemo(() => messages.length, [messages]);

  return (
    <div className={`app-shell ${darkMode ? 'dark' : 'light'}`}>
      <header className="topbar">
        <div>
          <p className="eyebrow">AI Assistant of</p>
          <h1>Mostafizur chat AI</h1>
        </div>
        <button type="button" className="theme-toggle" onClick={() => setDarkMode((value) => !value)}>
          {darkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
      </header>

      <main className="chat-card">
        <div className="chat-header">
          <div>
            <h2>Make Life Easier with AI 😊</h2>
            <p>{messageCount} messages in this session</p>
          </div>
        </div>

        <section className="messages" aria-live="polite">
          {messages.map((message) => (
            <article key={message.id} className={`message ${message.role}`}>
              <div className="avatar">{message.role === 'user' ? 'U' : 'AI'}</div>
              <div className="bubble">
                <p>{message.content}</p>
              </div>
            </article>
          ))}

          {isLoading && (
            <article className="message assistant">
              <div className="avatar">AI</div>
              <div className="bubble loading">
                <span />
                <span />
                <span />
              </div>
            </article>
          )}
        </section>

        <form className="composer" onSubmit={handleSubmit}>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask Cohere anything..."
            rows={1}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSubmit(event);
              }
            }}
          />
          <button type="submit" disabled={!canSend}>
            {isLoading ? 'Thinking...' : 'Send'}
          </button>
        </form>
      </main>
    </div>
  );
}

export default App;
