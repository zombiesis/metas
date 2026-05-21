'use client';
import { useState, useRef, useEffect } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: 'Hi! I can help with admissions, programs, and campus info. Ask me anything!' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    const res = await fetch('/api/chatbot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userMsg, history: messages.slice(-4) }) }).catch(() => null);
    const data = res ? await res.json() : { reply: 'Sorry, I couldn\'t connect. Please try again.' };
    setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'Please contact our admissions office.' }]);
    setLoading(false);
  }

  return (
    <>
      {!open && <button className="chatbot-fab" onClick={() => setOpen(true)} aria-label="Open chat"><svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg></button>}
      {open && (
        <div className="chatbot-panel" role="dialog" aria-label="Chat assistant">
          <div className="chatbot-header"><strong>Admissions Assistant</strong><button onClick={() => setOpen(false)} aria-label="Close">✕</button></div>
          <div className="chatbot-messages">
            {messages.map((m, i) => <div key={i} className={`chatbot-msg ${m.role}`}>{m.content}</div>)}
            {loading && <div className="chatbot-msg assistant">Typing...</div>}
            <div ref={endRef} />
          </div>
          <form className="chatbot-input" onSubmit={send}>
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about admissions, programs..." maxLength={500} aria-label="Type your message" />
            <button type="submit" disabled={loading}>Send</button>
          </form>
        </div>
      )}
      <style>{`
        .chatbot-fab{position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:#071B33;color:#fff;border:none;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.3);z-index:9000;display:flex;align-items:center;justify-content:center}
        .chatbot-panel{position:fixed;bottom:24px;right:24px;width:360px;height:500px;background:#fff;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.2);z-index:9000;display:flex;flex-direction:column;overflow:hidden}
        .chatbot-header{background:#071B33;color:#fff;padding:12px 16px;display:flex;justify-content:space-between;align-items:center}
        .chatbot-header button{background:none;border:none;color:#fff;font-size:18px;cursor:pointer}
        .chatbot-messages{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px}
        .chatbot-msg{padding:8px 12px;border-radius:12px;max-width:85%;font-size:0.9rem;line-height:1.4}
        .chatbot-msg.user{background:#071B33;color:#fff;align-self:flex-end;border-bottom-right-radius:4px}
        .chatbot-msg.assistant{background:#f3f4f6;color:#333;align-self:flex-start;border-bottom-left-radius:4px}
        .chatbot-input{display:flex;border-top:1px solid #eee;padding:8px}
        .chatbot-input input{flex:1;border:1px solid #ddd;border-radius:20px;padding:8px 14px;font-size:0.9rem;outline:none}
        .chatbot-input button{background:#071B33;color:#fff;border:none;border-radius:20px;padding:8px 16px;margin-left:8px;cursor:pointer;font-size:0.85rem}
        @media(max-width:480px){.chatbot-panel{width:calc(100vw - 16px);right:8px;bottom:8px;height:70vh}}
      `}</style>
    </>
  );
}
