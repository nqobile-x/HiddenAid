import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createPcmBlob, decodeAudioData } from '../services/audioUtils';
import { Mic, MicOff, Volume2, X } from 'lucide-react';

const LiveAssistant: React.FC = () => {
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  
  // Refs for audio handling to avoid re-renders disrupting the stream
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const startSession = async () => {
    setStatus('connecting');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup Audio Contexts
      inputCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const inputCtx = inputCtxRef.current;
      const outputCtx = outputCtxRef.current;
      const outputNode = outputCtx.createGain();
      outputNode.connect(outputCtx.destination);

      // Connect to Live API
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: 'You are a helpful, calm, and empathetic assistant for someone with a hidden disability. Keep responses concise and supportive.',
        },
        callbacks: {
          onopen: () => {
            console.log('Session Opened');
            setStatus('connected');
            setActive(true);

            // Setup Mic Stream
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
               // Schedule audio playback
               const ctx = outputCtxRef.current;
               if (!ctx) return;

               nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
               
               const audioBytes = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0));
               const audioBuffer = await decodeAudioData(audioBytes, ctx, 24000, 1);
               
               const source = ctx.createBufferSource();
               source.buffer = audioBuffer;
               source.connect(outputNode);
               source.onended = () => sourcesRef.current.delete(source);
               
               source.start(nextStartTimeRef.current);
               nextStartTimeRef.current += audioBuffer.duration;
               sourcesRef.current.add(source);
            }
            
            // Handle Interruption
             if (msg.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
             }
          },
          onclose: () => {
            console.log("Session Closed");
            setStatus('idle');
            setActive(false);
          },
          onerror: (err) => {
            console.error("Session Error", err);
            setStatus('error');
            setActive(false);
          }
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const stopSession = () => {
    // Cleanup logic
    if (sessionRef.current) {
      sessionRef.current.then((s: any) => s.close());
    }
    inputCtxRef.current?.close();
    outputCtxRef.current?.close();
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    setActive(false);
    setStatus('idle');
  };

  useEffect(() => {
    return () => {
      // Unmount cleanup
      if (active) stopSession();
    };
  }, [active]);

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className={`relative flex items-center justify-center w-32 h-32 rounded-full mb-8 transition-all duration-500 ${active ? 'bg-red-100 scale-110 shadow-xl' : 'bg-slate-100'}`}>
        {active && (
          <span className="absolute w-full h-full rounded-full bg-red-400 opacity-20 animate-ping"></span>
        )}
        <div className={`z-10 text-4xl ${active ? 'text-red-600' : 'text-slate-400'}`}>
          {active ? <Volume2 className="w-12 h-12" /> : <MicOff className="w-12 h-12" />}
        </div>
      </div>

      <h2 className="text-2xl font-bold text-slate-800 mb-2">
        {status === 'connecting' ? 'Connecting...' : 
         status === 'connected' ? 'Listening...' : 
         'Start Voice Assistant'}
      </h2>
      <p className="text-slate-500 mb-8 max-w-xs">
        Have a natural conversation with Gemini to get help instantly.
      </p>

      {status === 'idle' || status === 'error' ? (
        <button 
          onClick={startSession}
          className="bg-slate-900 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2"
        >
          <Mic className="w-6 h-6" /> Start Conversation
        </button>
      ) : (
        <button 
          onClick={stopSession}
          className="bg-red-500 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg hover:bg-red-600 transition-all flex items-center gap-2"
        >
          <X className="w-6 h-6" /> End Call
        </button>
      )}

      {status === 'error' && (
        <p className="mt-4 text-red-500 text-sm">Could not connect. Please check permissions.</p>
      )}
    </div>
  );
};

export default LiveAssistant;
