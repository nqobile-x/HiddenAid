import React, { useState } from 'react';
import { DigitalCard } from '../types';
import { generateSpeech } from '../services/geminiService';
import { decodeAudioData } from '../services/audioUtils';
import { Volume2, Loader2, Phone, AlertCircle } from 'lucide-react';

interface CardViewerProps {
  card: DigitalCard;
}

const CardViewer: React.FC<CardViewerProps> = ({ card }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingTTS, setIsLoadingTTS] = useState(false);

  const playTTS = async () => {
    if (isPlaying) return;
    setIsLoadingTTS(true);
    try {
      const textToSpeak = `Hello, my name is ${card.name}. ${card.condition ? `I have ${card.condition}.` : ''} ${card.needs}. In an emergency, please call ${card.emergencyContactName}.`;
      
      const base64Audio = await generateSpeech(textToSpeak);
      if (!base64Audio) throw new Error("No audio generated");

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const audioBytes = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0));
      const audioBuffer = await decodeAudioData(audioBytes, audioCtx, 24000, 1);
      
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.onended = () => setIsPlaying(false);
      source.start(0);
      setIsPlaying(true);
    } catch (err) {
      console.error(err);
      alert("Could not play audio.");
    } finally {
      setIsLoadingTTS(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto perspective-1000">
      <div 
        className="relative bg-white rounded-3xl overflow-hidden shadow-2xl transition-transform hover:scale-[1.02] duration-300"
        style={{ borderTop: `8px solid ${card.themeColor}` }}
      >
        {card.iconUrl && (
          <div className="h-40 w-full overflow-hidden">
            <img src={card.iconUrl} alt="Card Theme" className="w-full h-full object-cover" />
          </div>
        )}
        
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">{card.name}</h2>
              {card.condition && (
                <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                  {card.condition}
                </span>
              )}
            </div>
            <button 
              onClick={playTTS}
              disabled={isLoadingTTS || isPlaying}
              className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              aria-label="Read card aloud"
            >
              {isLoadingTTS ? <Loader2 className="w-6 h-6 animate-spin" /> : <Volume2 className={`w-6 h-6 ${isPlaying ? 'text-green-600' : ''}`} />}
            </button>
          </div>

          <div className="mb-8">
            <h3 className="text-sm uppercase tracking-wide text-slate-500 font-semibold mb-3">I Need</h3>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-lg text-slate-800 leading-relaxed">
              {card.needs}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-red-50 p-2 rounded-full">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase">Emergency Contact</p>
                <p className="text-slate-900 font-medium">{card.emergencyContactName}</p>
              </div>
            </div>
            <a 
              href={`tel:${card.emergencyContactPhone}`}
              className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transition-transform hover:scale-110"
            >
              <Phone className="w-6 h-6" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardViewer;
