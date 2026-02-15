import React, { useState } from 'react';
import { DigitalCard, AspectRatio } from '../types';
import { generateCardImage } from '../services/geminiService';
import { Loader2, Sparkles, Save, Image as ImageIcon } from 'lucide-react';

interface CardCreatorProps {
  onSave: (card: DigitalCard) => void;
  onCancel: () => void;
}

const CardCreator: React.FC<CardCreatorProps> = ({ onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [condition, setCondition] = useState('');
  const [needs, setNeeds] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [themeColor, setThemeColor] = useState('#60a5fa');
  const [generatedImage, setGeneratedImage] = useState<string | undefined>(undefined);
  const [imagePrompt, setImagePrompt] = useState('A calming abstract sunflower design, soft colors, minimalist vector art');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.SQUARE);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateImage = async () => {
    if (!imagePrompt) return;
    setIsGenerating(true);
    try {
      const b64 = await generateCardImage(imagePrompt, aspectRatio);
      setGeneratedImage(b64);
    } catch (e) {
      console.error(e);
      alert('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    const newCard: DigitalCard = {
      id: crypto.randomUUID(),
      name,
      condition,
      needs,
      emergencyContactName: emergencyName,
      emergencyContactPhone: emergencyPhone,
      themeColor,
      iconUrl: generatedImage
    };
    onSave(newCard);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl max-w-2xl mx-auto border border-slate-100">
      <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-2">
        <Sparkles className="w-6 h-6 text-purple-600" />
        Create Digital Card
      </h2>

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Your Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="e.g. Alex Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Condition (Optional)</label>
            <input 
              type="text" 
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="e.g. Autism Spectrum, Fibromyalgia"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">I need...</label>
          <textarea 
            value={needs}
            onChange={(e) => setNeeds(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none h-24"
            placeholder="e.g. Please be patient, I may need extra time to process information. I am sensitive to loud noises."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Contact</label>
            <input 
              type="text" 
              value={emergencyName}
              onChange={(e) => setEmergencyName(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Phone</label>
            <input 
              type="tel" 
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="Phone Number"
            />
          </div>
        </div>

        {/* AI Image Generation */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Card Decoration (AI Generated)
          </label>
          
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
               <input 
                type="text" 
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                className="flex-1 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                placeholder="Describe the image you want..."
              />
              <select 
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                className="p-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                {Object.values(AspectRatio).map((ratio) => (
                  <option key={ratio} value={ratio}>{ratio}</option>
                ))}
              </select>
            </div>
            
            <button 
              onClick={handleGenerateImage}
              disabled={isGenerating}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              Generate Art
            </button>
          </div>

          {generatedImage && (
            <div className="mt-4 flex justify-center">
              <img src={generatedImage} alt="Generated Card Art" className="rounded-lg shadow-sm max-h-48 object-cover" />
            </div>
          )}
        </div>

        <div className="flex gap-4 pt-4 border-t border-slate-100">
          <button 
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Save Card
          </button>
        </div>
      </div>
    </div>
  );
};

export default CardCreator;
