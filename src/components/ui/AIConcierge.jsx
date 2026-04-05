import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '../../hooks/useResponsive';

export default function AIConcierge() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    return () => { if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current); };
  }, []);

  useEffect(() => { 
    const s = sessionStorage.getItem('ai_concierge_msgs'); 
    if (s) { 
      try { 
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) setMessages(parsed);
      } catch (err) {
        console.error('Failed to parse AI messages', err);
        sessionStorage.removeItem('ai_concierge_msgs');
      } 
    } 
  }, []);

  useEffect(() => { 
    if (messages.length > 0) {
      try {
        sessionStorage.setItem('ai_concierge_msgs', JSON.stringify(messages.slice(-20))); 
      } catch (err) {
        console.error('Failed to save AI messages', err);
      }
    } else {
      sessionStorage.removeItem('ai_concierge_msgs');
    }
  }, [messages]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  if (!isMobile) return null;

  const moods = [
    { emoji: '🎬', label: 'Exciting', query: 'action thriller movies' },
    { emoji: '😂', label: 'Comedy', query: 'comedy movies' },
    { emoji: '🤔', label: 'Mind-bending', query: 'psychological thriller' },
    { emoji: '💕', label: 'Romantic', query: 'romance movies' },
    { emoji: '👨‍👩‍👧', label: 'Family', query: 'family friendly movies' },
    { emoji: '😢', label: 'Emotional', query: 'emotional drama movies' },
  ];

  const respond = (msg) => {
    const l = msg.toLowerCase();
    if (l.includes('action') || l.includes('exciting')) return { text: 'Adrenaline-pumping picks for you:', query: 'action thriller movies' };
    if (l.includes('comedy') || l.includes('laugh')) return { text: 'Time to laugh!', query: 'comedy movies' };
    if (l.includes('drama') || l.includes('cry') || l.includes('emotional')) return { text: 'Powerful stories await:', query: 'emotional drama movies' };
    if (l.includes('romance') || l.includes('love')) return { text: 'Beautiful romantic films:', query: 'romance movies' };
    if (l.includes('family') || l.includes('kids')) return { text: 'For the whole family:', query: 'family friendly movies' };
    if (l.includes('trending') || l.includes('popular')) return { text: "What's hot right now:", query: 'trending movies this week' };
    if (l.includes('top') || l.includes('best')) return { text: 'Critically acclaimed:', query: 'highest rated movies' };
    if (l.includes('new') || l.includes('2026')) return { text: 'Fresh releases:', query: 'new movies 2026' };
    if (l.includes('series') || l.includes('binge')) return { text: 'Binge-worthy series:', query: 'best tv series to binge' };
    if (l.includes('mind') || l.includes('psychological')) return { text: 'Mind-bending stories:', query: 'psychological thriller' };
    return { text: `Here's what I found for "${msg}":`, query: msg };
  };

  const handleSend = (text) => {
    const t = text || input.trim();
    if (!t) return;
    setMessages(prev => [...prev, { role: 'user', text: t }]);
    setInput('');
    setIsTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      const r = respond(t);
      setMessages(prev => [...prev, { role: 'bot', text: r.text, query: r.query }]);
      setIsTyping(false);
    }, 600 + Math.random() * 500);
  };

  return (
    <>
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="pm-ai-fab" aria-label="Open AI Concierge"><MessageCircle size={18} strokeWidth={1.5} /></button>
      )}
      {isOpen && (
        <div className="pm-ai-panel">
          <div className="pm-ai-header">
            <div className="pm-ai-brand"><Sparkles size={14} /> AI Concierge</div>
            <button onClick={() => setIsOpen(false)} className="pm-ai-close" aria-label="Close AI Concierge"><X size={16} /></button>
          </div>
          <div className="pm-ai-messages">
            {messages.length === 0 && (
              <div className="pm-ai-welcome">
                <h3>What are you in the mood for?</h3>
                <div className="pm-ai-mood-grid">{moods.map(m => <button key={m.label} className="pm-ai-mood-btn" onClick={() => handleSend(m.query)}><span>{m.emoji}</span><span>{m.label}</span></button>)}</div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`pm-ai-msg ${msg.role}`}>
                <div className="pm-ai-bubble">
                  <p>{msg.text}</p>
                  {msg.query && <button className="pm-ai-action" onClick={() => { navigate(`/search?q=${encodeURIComponent(msg.query)}`); setIsOpen(false); }}>View Results</button>}
                </div>
              </div>
            ))}
            {isTyping && <div className="pm-ai-msg bot"><div className="pm-ai-bubble pm-ai-typing"><span /><span /><span /></div></div>}
            <div ref={messagesEndRef} />
          </div>
          <div className="pm-ai-input">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSend(); }} placeholder="Ask me anything..." className="pm-ai-field" aria-label="Message AI Concierge" />
            <button onClick={() => handleSend()} className="pm-ai-send" aria-label="Send message"><Send size={14} /></button>
          </div>
        </div>
      )}
      <style>{`
        .pm-ai-fab { position: fixed; bottom: 80px; right: 16px; width: 44px; height: 44px; border-radius: 14px; background: rgba(255,255,255,0.06); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 999; }
        .pm-ai-panel { position: fixed; bottom: 0; left: 0; right: 0; height: 65vh; max-height: 480px; background: rgba(10,10,10,0.97); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); border-top: 1px solid rgba(255,255,255,0.04); z-index: 2000; display: flex; flex-direction: column; overflow: hidden; }
        .pm-ai-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.04); flex-shrink: 0; }
        .pm-ai-brand { display: flex; align-items: center; gap: 6px; color: var(--accent); font-family: 'Inter', sans-serif; font-weight: 600; font-size: 13px; }
        .pm-ai-close { background: none; border: none; color: rgba(255,255,255,0.5); width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .pm-ai-messages { flex: 1; overflow-y: auto; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
        .pm-ai-welcome { display: flex; flex-direction: column; gap: 14px; }
        .pm-ai-welcome h3 { font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 500; color: rgba(255,255,255,0.7); margin: 0; }
        .pm-ai-mood-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .pm-ai-mood-btn { display: flex; flex-direction: column; align-items: center; gap: 4px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.04); border-radius: 10px; padding: 12px 6px; cursor: pointer; color: rgba(255,255,255,0.6); font-family: 'Inter', sans-serif; font-size: 11px; }
        .pm-ai-mood-btn span:first-child { font-size: 18px; }
        .pm-ai-msg { display: flex; flex-direction: column; }
        .pm-ai-msg.user { align-items: flex-end; }
        .pm-ai-msg.bot { align-items: flex-start; }
        .pm-ai-bubble { max-width: 85%; padding: 10px 14px; border-radius: 14px; font-size: 13px; line-height: 1.5; }
        .pm-ai-msg.user .pm-ai-bubble { background: rgba(0,122,255,0.15); color: rgba(255,255,255,0.9); border-bottom-right-radius: 4px; }
        .pm-ai-msg.bot .pm-ai-bubble { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.7); border-bottom-left-radius: 4px; }
        .pm-ai-bubble p { margin: 0 0 8px 0; }
        .pm-ai-action { background: rgba(0,122,255,0.1); border: 1px solid rgba(0,122,255,0.15); color: var(--accent); padding: 6px 14px; border-radius: 8px; font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500; cursor: pointer; width: 100%; }
        .pm-ai-typing { display: flex; gap: 4px; padding: 10px 14px; }
        .pm-ai-typing span { width: 5px; height: 5px; border-radius: 50%; background: rgba(255,255,255,0.2); animation: aiDot 1.4s ease-in-out infinite; }
        .pm-ai-typing span:nth-child(2) { animation-delay: 0.2s; }
        .pm-ai-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes aiDot { 0%,60%,100% { opacity: 0.2; } 30% { opacity: 0.8; } }
        .pm-ai-input { display: flex; align-items: center; gap: 8px; padding: 10px 16px; padding-bottom: max(10px, env(safe-area-inset-bottom)); border-top: 1px solid rgba(255,255,255,0.04); flex-shrink: 0; }
        .pm-ai-field { flex: 1; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 10px 12px; color: white; font-family: 'Inter', sans-serif; font-size: 13px; outline: none; }
        .pm-ai-send { width: 34px; height: 34px; border-radius: 10px; background: rgba(0,122,255,0.15); border: none; color: var(--accent); display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
      `}</style>
    </>
  );
}
