"use client";

import { useRef, useState } from 'react';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  subject?: string;
  concept?: string;
  isStreaming?: boolean;
  saveable?: boolean;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  saveError?: string;
};

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function parseSaveFields(responseText: string, subject: string, concept: string) {
  const paragraphs = responseText
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  const bulletLines = responseText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^(-|\d+\.)\s+/.test(line));

  const toArray = (value?: string) =>
    value
      ? value
          .split(/[,;]| and /i)
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

  const matchField = (label: string) => {
    const regex = new RegExp(`${label}[:\-]\s*(.*)`, 'i');
    const match = responseText.match(regex);
    return match?.[1] ?? '';
  };

  return {
    subject,
    concept,
    masteryLevel: 'Developing',
    overviewGist: paragraphs[0] ?? responseText.slice(0, 240),
    deepDiveGist: paragraphs.slice(1, 4),
    strongAreas: toArray(matchField('strong areas?')),
    weakAreas: toArray(matchField('weak areas?')),
    nextSteps: bulletLines.map((line) => line.replace(/^(-|\d+\.)\s+/, '')),
    notes: responseText,
  };
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  };

  const detectConcept = async (userMessage: string) => {
    const res = await fetch('/api/detect-concept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userMessage }),
    });
    if (!res.ok) throw new Error('Concept detection failed');
    const data = await res.json();
    return {
      subject: typeof data.subject === 'string' ? data.subject : '',
      concept: typeof data.concept === 'string' ? data.concept : '',
    };
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    setInput('');
    setIsSending(true);

    const userMessage: Message = {
      id: createId(),
      role: 'user',
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);

    let subject = '';
    let concept = '';

    try {
      const detection = await detectConcept(trimmed);
      subject = detection.subject;
      concept = detection.concept;
    } catch {
      subject = '';
      concept = '';
    }

    const assistantId = createId();
    const assistantMessage: Message = {
      id: assistantId,
      role: 'assistant',
      text: '',
      subject,
      concept,
      isStreaming: true,
      saveable: false,
      saveStatus: 'idle',
    };

    setMessages((prev) => [...prev, assistantMessage]);
    scrollToBottom();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage: trimmed, subject, concept }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Chat request failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assistantText += chunk;
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId ? { ...message, text: assistantText, isStreaming: true } : message
          )
        );
        scrollToBottom();
      }

      // Flush any remaining data from decoder
      const finalChunk = decoder.decode();
      if (finalChunk) {
        assistantText += finalChunk;
      }

      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                text: assistantText,
                isStreaming: false,
                saveable: Boolean(subject && concept),
              }
            : message
        )
      );
    } catch (error) {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? { ...message, text: 'Unable to load assistant response.', isStreaming: false }
            : message
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleSave = async (messageId: string) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === messageId ? { ...message, saveStatus: 'saving', saveError: undefined } : message
      )
    );

    const message = messages.find((msg) => msg.id === messageId);
    if (!message || !message.subject || !message.concept) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, saveStatus: 'error', saveError: 'Missing subject or concept.' }
            : msg
        )
      );
      return;
    }

    const payload = parseSaveFields(message.text, message.subject, message.concept);

    try {
      const res = await fetch('/api/save-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        // Check if setup is needed
        if (data.setupUrl) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId
                ? { 
                    ...msg, 
                    saveStatus: 'error', 
                    saveError: 'Click here to configure database' 
                  }
                : msg
            )
          );
          return;
        }
        throw new Error(data.error || 'Save failed');
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, saveStatus: 'saved' } : msg
        )
      );
    } catch (error) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, saveStatus: 'error', saveError: error instanceof Error ? error.message : 'Save failed' }
            : msg
        )
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-black/20 backdrop-blur-xl">
          <h1 className="text-3xl font-semibold text-slate-50">Study Agent</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Ask a concept question, then save progress once the assistant has detected the topic.
          </p>
        </div>

        <div className="flex-1 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-xl shadow-black/20">
          <div ref={scrollerRef} className="flex h-[60vh] flex-col gap-4 overflow-y-auto px-6 py-6">
            {messages.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/60 p-8 text-center text-slate-500">
                Start the conversation by typing a message below.
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] ${message.role === 'user' ? 'bg-slate-800 text-slate-100' : 'bg-slate-900 text-slate-100 border border-slate-700'} rounded-3xl px-5 py-4 shadow-lg shadow-black/20`}>
                    <div className="whitespace-pre-wrap break-words text-sm leading-7">{message.text || (message.isStreaming ? 'Streaming response...' : '')}</div>
                    {message.role === 'assistant' && !message.isStreaming && (
                      <div className="mt-4 flex flex-col gap-2">
                        <button
                          onClick={() => handleSave(message.id)}
                          disabled={!message.saveable || message.saveStatus === 'saving' || message.saveStatus === 'saved'}
                          title={message.saveable ? 'Save this concept' : 'No concept detected in this response'}
                          className="inline-flex items-center justify-center rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {message.saveStatus === 'saved' ? '✓ Saved' : message.saveStatus === 'saving' ? 'Saving...' : 'Save progress'}
                        </button>
                        {!message.saveable && (
                          <p className="text-xs text-slate-400">💡 Tip: Ask about a specific concept to enable saving</p>
                        )}
                        {message.saveStatus === 'error' && message.saveError ? (
                          <p className="text-xs text-rose-300">
                            {message.saveError.includes('configure') ? (
                              <>
                                {message.saveError}:{' '}
                                <a href="/setup" className="underline hover:text-rose-200">Go to setup →</a>
                              </>
                            ) : (
                              message.saveError
                            )}
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-slate-800 bg-slate-950/90 px-6 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label htmlFor="chat-input" className="sr-only">Message</label>
              <input
                id="chat-input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask a concept question..."
                className="min-h-[52px] flex-1 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || isSending}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-sky-600 px-6 text-sm font-semibold text-slate-950 transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
