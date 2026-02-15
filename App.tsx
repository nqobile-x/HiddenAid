import React, { useState } from 'react';
import { DigitalCard, AppMode } from './types';
import CardViewer from './components/CardViewer';
import CardCreator from './components/CardCreator';
import ChatAssistant from './components/ChatAssistant';
import LiveAssistant from './components/LiveAssistant';
import MediaTools from './components/MediaTools';
import { Wallet, MessageSquare, Mic, Menu, Plus, Grid } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('cards');
  const [cards, setCards] = useState<DigitalCard[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Initial mock card if empty
  if (cards.length === 0 && !isCreating) {
     // Usually would load from local storage, keeping simple for demo
  }

  const renderContent = () => {
    switch (mode) {
      case 'cards':
        if (isCreating) {
          return (
            <div className="p-4">
              <CardCreator 
                onSave={(c) => { setCards([...cards, c]); setIsCreating(false); }}
                onCancel={() => setIsCreating(false)}
              />
            </div>
          );
        }
        if (cards.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="bg-purple-100 p-6 rounded-full mb-6">
                 <Wallet className="w-12 h-12 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">No Cards Yet</h2>
              <p className="text-slate-500 mb-8">Create a digital hidden disability card to communicate your needs discreetly.</p>
              <button 
                onClick={() => setIsCreating(true)}
                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:bg-slate-800 transition-transform hover:scale-105 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" /> Create First Card
              </button>
            </div>
          );
        }
        return (
          <div className="p-4 h-full overflow-y-auto">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">My Cards</h2>
                <button 
                    onClick={() => setIsCreating(true)}
                    className="bg-slate-900 text-white p-2 rounded-full shadow hover:bg-slate-800"
                >
                    <Plus className="w-5 h-5" />
                </button>
             </div>
             <div className="space-y-6 pb-20">
                {cards.map(card => <CardViewer key={card.id} card={card} />)}
             </div>
          </div>
        );
      
      case 'chat':
        return <ChatAssistant />;
      
      case 'live':
        return <LiveAssistant />;
      
      case 'tools':
        return (
            <div className="p-4 h-full overflow-y-auto">
                <h2 className="text-xl font-bold text-slate-800 mb-6 px-2">AI Tools</h2>
                <MediaTools />
            </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-center sticky top-0 z-20">
        <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
          HiddenAid
        </h1>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        {renderContent()}
      </main>

      {/* Bottom Nav */}
      <nav className="bg-white border-t border-slate-200 p-2 safe-area-pb">
        <div className="flex justify-around items-center">
          <button 
            onClick={() => setMode('cards')}
            className={`flex flex-col items-center p-2 rounded-xl transition-colors ${mode === 'cards' ? 'text-purple-600 bg-purple-50' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Wallet className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">Cards</span>
          </button>
          
          <button 
            onClick={() => setMode('chat')}
            className={`flex flex-col items-center p-2 rounded-xl transition-colors ${mode === 'chat' ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <MessageSquare className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">Chat</span>
          </button>

          <div className="relative -mt-8">
            <button 
              onClick={() => setMode('live')}
              className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform hover:scale-110 ${mode === 'live' ? 'bg-red-500 text-white' : 'bg-slate-900 text-white'}`}
            >
              <Mic className="w-6 h-6" />
            </button>
          </div>

          <button 
            onClick={() => setMode('tools')}
            className={`flex flex-col items-center p-2 rounded-xl transition-colors ${mode === 'tools' ? 'text-green-600 bg-green-50' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Grid className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">Tools</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;
