import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Brain, Loader, ArrowLeft } from "@/components/icons";
import { useLocation } from 'wouter';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AnalyseportalBereichProps {
  bereich: '1' | '2' | '3';
}

export default function AnalyseportalBereich({ bereich }: AnalyseportalBereichProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const bereichConfig = {
    '1': {
      title: 'Analyseportal – Regulatorische Informationen',
      description: 'Fragen zu regulatorischen Änderungen, FDA, EMA, Compliance',
      color: 'from-blue-600 to-blue-700',
      agents: ['FDA', 'EMA', 'Compliance', 'General']
    },
    '2': {
      title: 'Analyseportal – Zulassungen & Freigaben',
      description: 'Fragen zu globalen Zulassungen, Freigabenmanagement, Timelines',
      color: 'from-green-600 to-emerald-700',
      agents: ['Global', 'Regional', 'Timeline', 'General']
    },
    '3': {
      title: 'Analyseportal – Patentinformationen',
      description: 'Fragen zu Patenten, IP-Strategien, Wettbewerbsanalyse, Prior Art',
      color: 'from-purple-600 to-violet-700',
      agents: ['Patent', 'IP Strategy', 'Competitors', 'Prior Art']
    }
  } as const;

  const config = bereichConfig[bereich];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: inputValue,
          bereich: bereich,
          context: messages.slice(-5).map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      });

      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.data?.response || 'Entschuldigung, ich konnte keine Antwort generieren.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Fehler bei der Verarbeitung. Bitte versuchen Sie es später erneut.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`bg-gradient-to-r ${config.color} rounded-xl p-8 text-white shadow-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/dashboard')}
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück
              </Button>
            </div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Brain className="h-8 w-8" />
              {config.title}
            </h1>
            <div className="text-xs uppercase tracking-wide text-white/60 mb-2">
              Stand: {new Date().toLocaleDateString('de-DE')} • Neueste Inhalte zuerst
            </div>
            <p className="text-white/80 text-lg">{config.description}</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <Card className="h-96 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Bereich {bereich} – Fach-Dialog
          </CardTitle>
          <CardDescription>
            Nutzen Sie den Dialog für spezialisierte Fachfragen.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Brain className="h-12 w-12 mb-2 opacity-50" />
                <p>Starten Sie eine Konversation mit dem System</p>
              </div>
            ) : (
              [...messages]
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div>{message.content}</div>
                      <div className="text-[10px] mt-1 opacity-60">
                        {message.timestamp.toLocaleString('de-DE')}
                      </div>
                    </div>
                  </div>
                ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg flex items-center gap-2">
                  <Loader className="h-4 w-4 animate-spin" />
                  Verarbeite Anfrage...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Stellen Sie eine Frage..."
              disabled={loading}
            />
            <Button
              onClick={sendMessage}
              disabled={loading || !inputValue.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
