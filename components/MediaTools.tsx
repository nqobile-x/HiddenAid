import React, { useState } from 'react';
import { analyzeMedia, transcribeAudio, getFastResponse } from '../services/geminiService';
import { Camera, FileVideo, Mic, Loader2, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const MediaTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'visual' | 'audio' | 'quick'>('visual');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
      setResult('');
    }
  };

  const handleAnalyze = async () => {
    if (loading) return;
    setLoading(true);
    setResult('');
    
    try {
      if (activeTab === 'quick') {
         // Fast Response
         const text = await getFastResponse(prompt);
         setResult(text);
      } else if (file && preview) {
        const base64Data = preview.split(',')[1];
        
        if (activeTab === 'visual') {
          // Analyze Image or Video
          const isVideo = file.type.startsWith('video/');
          const text = await analyzeMedia(prompt || "Describe this in detail.", base64Data, file.type, isVideo);
          setResult(text);
        } else if (activeTab === 'audio') {
          // Transcribe Audio
          const text = await transcribeAudio(base64Data, file.type);
          setResult(text);
        }
      }
    } catch (e) {
      console.error(e);
      setResult("Error processing request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
        <button 
          onClick={() => { setActiveTab('visual'); setFile(null); setPreview(null); setResult(''); }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'visual' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Visual Analysis
        </button>
        <button 
          onClick={() => { setActiveTab('audio'); setFile(null); setPreview(null); setResult(''); }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'audio' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Audio Transcription
        </button>
        <button 
          onClick={() => { setActiveTab('quick'); setFile(null); setPreview(null); setResult(''); }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'quick' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Quick Check
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            {activeTab === 'visual' && <Camera className="w-5 h-5 text-blue-500" />}
            {activeTab === 'audio' && <Mic className="w-5 h-5 text-purple-500" />}
            {activeTab === 'quick' && <Zap className="w-5 h-5 text-yellow-500" />}
            {activeTab === 'visual' ? "Analyze Images or Videos" : activeTab === 'audio' ? "Transcribe Audio File" : "Lightning Fast AI"}
        </h3>

        {activeTab !== 'quick' && (
            <div className="mb-4">
            <label className="block w-full p-8 border-2 border-dashed border-slate-300 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-center">
                <input 
                type="file" 
                accept={activeTab === 'visual' ? "image/*,video/*" : "audio/*"}
                onChange={handleFileChange}
                className="hidden" 
                />
                {preview ? (
                   activeTab === 'visual' && file?.type.startsWith('image/') ? (
                    <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg shadow-sm" />
                   ) : (
                    <div className="flex flex-col items-center">
                        <FileVideo className="w-12 h-12 text-slate-400 mb-2" />
                        <span className="text-slate-600 font-medium">{file?.name}</span>
                    </div>
                   )
                ) : (
                <div className="text-slate-500">
                    <p className="font-medium">Click to upload {activeTab === 'visual' ? 'Photo or Video' : 'Audio File'}</p>
                    <p className="text-xs mt-1">Supports {activeTab === 'visual' ? 'JPG, PNG, MP4' : 'MP3, WAV'}</p>
                </div>
                )}
            </label>
            </div>
        )}

        <div className="flex gap-2 mb-4">
          <input 
            type="text" 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
                activeTab === 'visual' ? "Ask something about the image/video..." : 
                activeTab === 'quick' ? "Ask a quick question..." : 
                "Optional instructions..."
            }
            className="flex-1 p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none"
          />
          <button 
            onClick={handleAnalyze}
            disabled={loading || (activeTab !== 'quick' && !file)}
            className="bg-slate-900 text-white px-6 rounded-xl font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Run"}
          </button>
        </div>

        {result && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 prose prose-slate max-w-none">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaTools;
