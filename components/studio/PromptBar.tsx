
import React from 'react';

interface PromptBarProps {
  userPhoto: string | null;
  userCredits?: number;
  isLoggedIn?: boolean;
  globalPrompt: string;
  setGlobalPrompt: (val: string) => void;
  isPromptExpanded: boolean;
  setIsPromptExpanded: (val: boolean) => void;
  isListening: boolean;
  isLoading: boolean;
  onUploadClick: () => void;
  onVoiceInput: () => void;
  onMagicGenerate: () => void;
}

const PromptBar: React.FC<PromptBarProps> = ({
  userPhoto, userCredits, isLoggedIn, globalPrompt, setGlobalPrompt,
  isPromptExpanded, setIsPromptExpanded, isListening, isLoading,
  onUploadClick, onVoiceInput, onMagicGenerate
}) => {
  return (
    <div className="relative max-w-4xl mx-auto flex flex-col items-center gap-8">
      <div className="relative group" onClick={onUploadClick}>
        <div className={`w-36 h-36 md:w-52 md:h-52 rounded-[3rem] overflow-hidden shadow-2xl border-[12px] transition-all duration-500 bg-slate-50 cursor-pointer hover:scale-105 active:scale-95 ${userPhoto ? 'border-rose-50' : 'border-white'}`}>
          {userPhoto ? <img src={userPhoto} className="w-full h-full object-cover" alt="Source" /> : <div className="w-full h-full flex flex-col items-center justify-center text-rose-200"><span className="text-5xl">📸</span><p className="text-[10px] font-black uppercase mt-3 tracking-widest">Pick Photo</p></div>}
        </div>
        {isLoggedIn && (
          <div className="absolute -top-4 -right-4 bg-slate-900 text-white px-4 py-2 rounded-full text-[10px] font-black shadow-2xl border-2 border-white ring-4 ring-rose-50">
            {userCredits} CREDITS
          </div>
        )}
      </div>

      <div className={`w-full max-w-2xl transition-all duration-500 ${isPromptExpanded ? 'scale-105' : 'scale-100'}`}>
        <div className="flex flex-col gap-4">
          <div className={`relative flex items-center bg-slate-50 border-2 rounded-[2.5rem] transition-all overflow-hidden ${isPromptExpanded ? 'border-rose-400 shadow-2xl p-3' : 'border-slate-100 hover:border-slate-200 p-2'}`}>
            {isPromptExpanded ? (
              <textarea 
                autoFocus value={globalPrompt}
                onChange={(e) => setGlobalPrompt(e.target.value)}
                placeholder="Describe custom features (e.g. wearing a spacesuit, anime style, cyber look...)"
                className="w-full bg-transparent p-6 text-sm font-semibold outline-none h-32 resize-none leading-relaxed"
              />
            ) : (
              <input 
                type="text" placeholder="Imagine any style... (e.g. Pixar Character, oil painting)"
                onClick={() => setIsPromptExpanded(true)}
                className="w-full bg-transparent px-8 py-4 text-xs font-bold outline-none cursor-pointer placeholder:text-slate-300"
                readOnly value={globalPrompt}
              />
            )}
            <div className={`flex gap-3 px-2 ${isPromptExpanded ? 'absolute bottom-6 right-6' : ''}`}>
              <button onClick={onVoiceInput} className={`p-3.5 rounded-2xl transition-all shadow-md ${isListening ? 'bg-rose-500 text-white animate-pulse scale-110' : 'bg-white text-rose-400 hover:text-rose-500'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </button>
              <button onClick={onMagicGenerate} disabled={isLoading} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-black active:scale-95 disabled:opacity-50 flex items-center gap-2">
                {isLoading ? 'Generating...' : 'Magic Generate ✨'}
              </button>
            </div>
          </div>
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] ml-2">Type your imagination & click Magic Generate to see the result below</p>
        </div>
      </div>
    </div>
  );
};

export default PromptBar;
