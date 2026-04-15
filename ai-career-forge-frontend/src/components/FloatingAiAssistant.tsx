"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Loader2, User, Bot } from "lucide-react";
import api from "@/lib/api";

export default function FloatingAiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: "Hi! I'm the ZENITH intelligent interface. How can I help you refine your profile or prepare for your next interview today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await api.post("/chat", {
        message: userMessage,
        context: "The user is currently browsing their dashboard. Help them with career advice, resume tips, or interview kit refinements."
      });
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[2000] font-sans">
      {isOpen ? (
        <div className="bg-card border border-border w-[350px] md:w-[400px] h-[550px] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-foreground p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-background/20 p-2 rounded-xl">
                <Bot className="w-5 h-5 text-background" />
              </div>
              <div>
                <h3 className="text-background font-black text-xs uppercase tracking-widest">Neural Navigator</h3>
                <div className="flex items-center gap-1.5 pt-0.5">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                  <span className="text-[9px] text-background/60 font-black uppercase tracking-tight">Active Operation</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-background/60 hover:text-background transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5 bg-background">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-[13px] leading-relaxed font-medium ${
                  m.role === 'user' 
                    ? 'bg-foreground text-background rounded-tr-none shadow-xl' 
                    : 'bg-secondary text-foreground border border-border rounded-tl-none font-semibold'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-secondary p-4 rounded-2xl rounded-tl-none border border-border shadow-sm">
                  <Loader2 className="w-4 h-4 text-foreground/40 animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-5 bg-card border-t border-border flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Query the system..."
              className="flex-1 bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20 placeholder:text-muted-foreground/50 font-medium"
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="bg-foreground p-3 rounded-xl text-background hover:opacity-90 disabled:opacity-30 transition-all shadow-lg active:scale-90"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-foreground hover:bg-foreground/90 text-background p-5 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 group relative border-4 border-background ring-1 ring-border"
        >
          <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background shadow-lg shadow-green-500/20"></div>
          <MessageSquare className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
