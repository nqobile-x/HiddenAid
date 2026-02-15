import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../services/geminiService';
import { MessageRole, ChatMessage } from '../types';
import ReactMarkdown from 'react-markdown';
import { Send, MapPin, Globe, Brain, User, Bot, Loader2 } from 'lucide-react';

interface ChatAssistantProps {
  initialMode?: 'general' | 'search' | 'maps' | 'thinking';
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ initialMode = 'general' }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: MessageRole.MODEL,
      text: "Hi! I'm your assistant. How can I help you today? I can search the web, find accessible places on maps, or think deeply about complex questions.",
      timestamp: new Date()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'general' | 'search' | 'maps' | 'thinking'>(initialMode);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: MessageRole.USER,
      text: input,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Determine model and tools based on mode
      let model = 'gemini-3-pro-preview';
      let useSearch = false;
      let useMaps = false;
      let useThinking = false;
      let loc = undefined;

      if (mode === 'search') {
        model = 'gemini-3-flash-preview';
        useSearch = true;
      } else if (mode === 'maps') {
        model = 'gemini-2.5-flash'; // Required for maps
        useMaps = true;
        
        // Try get location for maps
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        } catch (e) {
          console.warn("Location denied, maps grounding may be less accurate.");
        }
      } else if (mode === 'thinking') {
        model = 'gemini-3-pro-preview';
        useThinking = true;
      }

      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await sendChatMessage(userMsg.text, model, history, useSearch, useMaps, useThinking, loc);

      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: MessageRole.MODEL,
        text: response.text,
        timestamp: new Date(),
        isThinking: useThinking,
        groundingSources: response.sources
      };
      setMessages(prev => [...prev, botMsg]);

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: MessageRole.MODEL,
        text: "Sorry, I encountered an error. Please check your connection or API key.",
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header / Mode Selector */}
      <div className="p-4 bg-white shadow-sm border-b border-slate-200 z-10">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button 
            onClick={() => setMode('general')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${mode === 'general' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <Bot className="w-4 h-4" /> General (Pro)
          </button>
          <button 
            onClick={() => setMode('search')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${mode === 'search' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <Globe className="w-4 h-4" /> Web Search
          </button>
          <button 
            onClick={() => setMode('maps')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${mode === 'maps' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <MapPin className="w-4 h-4" /> Maps
          </button>
          <button 
            onClick={() => setMode('thinking')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${mode === 'thinking' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <Brain className="w-4 h-4" /> Deep Think
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
              msg.role === MessageRole.USER 
                ? 'bg-slate-900 text-white rounded-br-none' 
                : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
            }`}>
              {msg.isThinking && (
                <div className="flex items-center gap-2 text-xs text-purple-600 font-bold uppercase tracking-wider mb-2">
                  <Brain className="w-3 h-3" /> Thought Process
                </div>
              )}
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
              
              {/* Grounding Sources */}
              {msg.groundingSources && msg.groundingSources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100/20">
                  <p className="text-xs font-semibold mb-1 opacity-70">Sources:</p>
                  <ul className="space-y-1">
                    {msg.groundingSources.map((s, idx) => (
                      <li key={idx}>
                        <a href={s.uri} target="_blank" rel="noopener noreferrer" className="text-xs underline hover:opacity-80 flex items-center gap-1 truncate">
                          <Globe className="w-3 h-3 inline" /> {s.title || s.uri}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
             <div className="bg-white p-4 rounded-2xl rounded-bl-none shadow-sm border border-slate-100 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                <span className="text-sm text-slate-400">Gemini is thinking...</span>
             </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={
              mode === 'thinking' ? "Ask a complex question..." :
              mode === 'maps' ? "Find accessible places nearby..." :
              mode === 'search' ? "Search the web..." :
              "Type a message..."
            }
            className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all"
            disabled={loading}
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;
