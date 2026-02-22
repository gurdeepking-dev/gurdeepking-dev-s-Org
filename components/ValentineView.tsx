
import React, { useState, useEffect, useRef } from 'react';
import { StyleTemplate, CartItem, User, TransactionRecord } from '../types';
import { storageService } from '../services/storage';
import { geminiService } from '../services/geminiService';
import { usageService } from '../services/usageService';
import { authService } from '../services/authService';
import { logger } from '../services/logger';
import { analytics } from '../services/analytics';
import Watermark from './Watermark';
import CheckoutModal from './CheckoutModal';
import LoginModal from './LoginModal';

interface ValentineViewProps {
  cart: CartItem[];
  user: User | null;
  addToCart: (item: CartItem) => void;
  showCheckout: boolean;
  setShowCheckout: (val: boolean) => void;
  removeFromCart: (id: string) => void;
  onLoginRequired: () => void;
  onUserUpdate: (user: User | null) => void;
  setCart: (cart: CartItem[]) => void;
  onAnimate?: (photo: string, prompt: string, isVerified: boolean) => void;
}

interface GenerationState {
  [styleId: string]: {
    isLoading: boolean;
    result: string | null;
    error: string | null;
    refinement: string;
    isHighRes: boolean;
  }
}

const ValentineView: React.FC<ValentineViewProps> = ({ 
  cart, user, addToCart, showCheckout, setShowCheckout, removeFromCart, setCart, onAnimate, onUserUpdate
}) => {
  const [styles, setStyles] = useState<StyleTemplate[]>([]);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [genStates, setGenStates] = useState<GenerationState>({});
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [freePhotoClaimed, setFreePhotoClaimed] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // New Prompt Bar & Custom Generation States
  const [globalPrompt, setGlobalPrompt] = useState('');
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [customGenState, setCustomGenState] = useState<{
    isLoading: boolean;
    result: string | null;
    error: string | null;
    refinement: string;
    isHighRes: boolean;
  }>({
    isLoading: false,
    result: null,
    error: null,
    refinement: '',
    isHighRes: false
  });

  useEffect(() => {
    loadContent();
    return () => {
      if (userPhoto && userPhoto.startsWith('blob:')) {
        URL.revokeObjectURL(userPhoto);
      }
    };
  }, [user]);

  const loadContent = async () => {
    try {
      const [loadedStyles, adminSettings] = await Promise.all([
        storageService.getStyles(),
        storageService.getAdminSettings()
      ]);
      setStyles(loadedStyles);
      setSettings(adminSettings);
      
      const initialStates: GenerationState = {};
      loadedStyles.forEach(s => {
        initialStates[s.id] = { 
          isLoading: false, result: null, error: null, refinement: '', isHighRes: false 
        };
      });
      setGenStates(initialStates);
      setFreePhotoClaimed(usageService.hasClaimedFreePhoto());
    } catch (err) {
      logger.error('View', 'Failed to load content', err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setUserPhoto(base64);
        setGenStates(prev => {
          const newState = { ...prev };
          Object.keys(newState).forEach(id => {
            newState[id] = { ...newState[id], result: null, error: null, isHighRes: false };
          });
          return newState;
        });
        setCustomGenState(prev => ({ ...prev, result: null, error: null }));
        analytics.track('Lead', { method: 'upload' });
        styles.forEach(s => { if (s.autoGenerate) handleGenerate(s, base64); });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMagicGenerate = async () => {
    if (!userPhoto) { uploadInputRef.current?.click(); return; }
    if (!globalPrompt) { setIsPromptExpanded(true); return; }

    setCustomGenState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await geminiService.generateStyle(userPhoto, globalPrompt, customGenState.refinement);
      setCustomGenState(prev => ({ ...prev, isLoading: false, result }));
      analytics.track('CustomGeneration', { prompt: globalPrompt });
    } catch (err: any) {
      setCustomGenState(prev => ({ ...prev, isLoading: false, error: err.message }));
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Voice input not supported in this browser.");
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setGlobalPrompt(transcript);
      setIsPromptExpanded(true);
    };
    recognition.start();
  };

  const handleGenerate = async (style: StyleTemplate, overridePhoto?: string) => {
    const photoToUse = overridePhoto || userPhoto;
    if (!photoToUse) { uploadInputRef.current?.click(); return; }

    setGenStates(prev => ({ ...prev, [style.id]: { ...prev[style.id], isLoading: true, error: null } }));
    try {
      const state = genStates[style.id] || { refinement: '' };
      const promptToUse = globalPrompt ? `${style.prompt}. Context: ${globalPrompt}` : style.prompt;
      const result = await geminiService.generateStyle(photoToUse, promptToUse, state.refinement);
      setGenStates(prev => ({ ...prev, [style.id]: { ...prev[style.id], isLoading: false, result } }));
    } catch (err: any) {
      setGenStates(prev => ({ ...prev, [style.id]: { ...prev[style.id], isLoading: false, error: err.message } }));
    }
  };

  const handleClaimFree = (id: string, isCustom = false) => {
    if (freePhotoClaimed) return;
    
    usageService.markFreePhotoAsUsed();
    setFreePhotoClaimed(true);
    
    if (isCustom) {
      setCustomGenState(prev => ({ ...prev, isHighRes: true }));
      handleDownload('custom');
    } else {
      setGenStates(prev => ({
        ...prev,
        [id]: { ...prev[id], isHighRes: true }
      }));
      handleDownload(id);
    }

    analytics.track('ClaimFree', { style_id: id });
    storageService.logActivity('free_claim', { style_id: id });
  };

  const handleClaimWithCredits = async (id: string, isCustom = false) => {
    if (!user) { setShowLoginModal(true); return; }
    
    if (user.credits < 1) {
      setShowCheckout(true);
      return;
    }

    const success = await storageService.deductCredit(user.email);
    if (success) {
      const newCredits = await authService.refreshUserCredits();
      onUserUpdate({ ...user, credits: newCredits });

      if (isCustom) {
        setCustomGenState(prev => ({ ...prev, isHighRes: true }));
        handleDownload('custom');
      } else {
        setGenStates(prev => ({
          ...prev,
          [id]: { ...prev[id], isHighRes: true }
        }));
        handleDownload(id);
      }
      analytics.track('SpendCredit', { type: 'photo' });
    }
  };

  const handleDownload = (styleId: string) => {
    const state = styleId === 'custom' ? customGenState : genStates[styleId];
    if (!state.result) return;
    const link = document.createElement('a');
    link.href = state.result;
    link.download = `studio-art-${styleId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderCustomPreview = () => {
    if (!customGenState.result && !customGenState.isLoading) return null;
    
    const state = customGenState;
    return (
      <div className="max-w-xl mx-auto mt-12 animate-in zoom-in-95 duration-500">
        <div className="group bg-white rounded-[3rem] overflow-hidden border-4 border-rose-500/20 shadow-2xl flex flex-col relative">
          <div className="absolute top-6 left-6 z-40 bg-rose-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Your Magic Result ✨</div>
          
          <div className="aspect-square relative bg-rose-50 flex items-center justify-center overflow-hidden">
            {state.isLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center gap-4 bg-white/80 backdrop-blur-xl z-30">
                <div className="w-16 h-16 border-4 border-rose-500 border-t-rose-100 rounded-full animate-spin" />
                <p className="text-sm font-black uppercase tracking-[0.2em] text-rose-600 animate-pulse italic">Synthesizing Imagination...</p>
              </div>
            ) : state.result ? (
              <div className="w-full h-full relative z-20 flex items-center justify-center">
                <img src={state.result} className={`max-w-full max-h-full object-contain ${!state.isHighRes ? 'pointer-events-none select-none' : ''}`} alt="Custom Result" />
                {!state.isHighRes && <Watermark text="www.chatgptdigital.store" />}
                <button onClick={() => setCustomGenState(prev => ({...prev, result: null}))} className="absolute top-6 right-6 p-2.5 bg-white/80 backdrop-blur-md rounded-2xl text-rose-600 hover:bg-rose-600 hover:text-white transition-all z-40 shadow-xl">✕</button>
              </div>
            ) : null}
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-4">
               <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1 block">Want to adjust anything?</label>
               <div className="flex gap-2">
                   <input 
                       type="text" value={state.refinement}
                       onChange={(e) => setCustomGenState(prev => ({...prev, refinement: e.target.value}))}
                       placeholder="e.g. brighter sky, more cinematic..."
                       className="flex-grow px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-semibold outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                   />
                   <button onClick={handleMagicGenerate} className="px-6 py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg active:scale-95">Retry</button>
               </div>
            </div>

            <div className="flex flex-col gap-3">
              {state.isHighRes ? (
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => handleDownload('custom')} className="py-5 bg-slate-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-xl">Download 🖼️</button>
                  <button onClick={() => onAnimate?.(state.result!, globalPrompt, true)} className="py-5 bg-rose-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-xl border-b-4 border-rose-800 hover:bg-rose-700 transition-all">Animate ✨</button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {!freePhotoClaimed && (
                    <button onClick={() => handleClaimFree('custom', true)} className="w-full py-5 bg-rose-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-xl border-b-4 border-rose-800 hover:bg-rose-700 active:scale-95">
                      Get First free photo 🎁
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handleClaimWithCredits('custom', true)} className="py-5 bg-slate-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-xl border-b-4 border-black hover:bg-black active:scale-95">
                      {user && user.credits > 0 ? 'Use 1 Credit' : 'Get HD (1 Credit)'}
                    </button>
                    <button onClick={() => setShowCheckout(true)} className="py-5 bg-white border-2 border-slate-200 text-slate-900 rounded-[2rem] font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 active:scale-95">Buy Credits</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const currencySymbol = storageService.getCurrencySymbol(settings?.payment.currency);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto px-4">
      <section className="relative overflow-hidden bg-white rounded-[4rem] p-10 sm:p-16 shadow-2xl border border-rose-100 text-center">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-rose-50 rounded-full blur-[100px] opacity-60"></div>
        <div className="relative max-w-4xl mx-auto flex flex-col items-center gap-8">
          <div className="relative group" onClick={() => uploadInputRef.current?.click()}>
            <div className={`w-36 h-36 md:w-52 md:h-52 rounded-[3rem] overflow-hidden shadow-2xl border-[12px] transition-all duration-500 bg-slate-50 cursor-pointer hover:scale-105 active:scale-95 ${userPhoto ? 'border-rose-50' : 'border-white'}`}>
              {userPhoto ? <img src={userPhoto} className="w-full h-full object-cover" alt="Source" /> : <div className="w-full h-full flex flex-col items-center justify-center text-rose-200"><span className="text-5xl">📸</span><p className="text-[10px] font-black uppercase mt-3 tracking-widest">Pick Photo</p></div>}
            </div>
            {user?.isLoggedIn && (
              <div className="absolute -top-4 -right-4 bg-slate-900 text-white px-4 py-2 rounded-full text-[10px] font-black shadow-2xl border-2 border-white ring-4 ring-rose-50">
                {user.credits} CREDITS
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
                  <button onClick={handleVoiceInput} className={`p-3.5 rounded-2xl transition-all shadow-md ${isListening ? 'bg-rose-500 text-white animate-pulse scale-110' : 'bg-white text-rose-400 hover:text-rose-500'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                  </button>
                  <button onClick={handleMagicGenerate} disabled={customGenState.isLoading} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-black active:scale-95 disabled:opacity-50 flex items-center gap-2">
                    {customGenState.isLoading ? 'Generating...' : 'Magic Generate ✨'}
                  </button>
                </div>
              </div>
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] ml-2">Type your imagination & click Magic Generate to see the result below</p>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 serif italic tracking-tighter leading-none">AI Art <span className="text-rose-500">Studio</span></h1>
            <p className="text-slate-400 font-bold max-w-lg mx-auto leading-relaxed text-sm uppercase tracking-wide">
              Transform your persona into any artistic vision. New users get <span className="text-rose-600">5 FREE credits</span> on signup! 🎁
            </p>
          </div>

          {!userPhoto && (
            <button onClick={() => uploadInputRef.current?.click()} className="px-12 py-6 bg-rose-600 text-white rounded-[2rem] font-black text-xl shadow-2xl hover:bg-rose-700 transition-all active:scale-95 border-b-8 border-rose-800 tracking-widest">START MAGIC 📸</button>
          )}
          <input type="file" ref={uploadInputRef} accept="image/*" onChange={handleFileUpload} className="hidden" />
        </div>

        {renderCustomPreview()}
      </section>

      <div className="space-y-10">
        <div className="flex flex-col items-center gap-2">
            <h2 className="text-3xl font-black text-slate-900 serif italic">Preset Masterpieces</h2>
            <div className="h-1.5 w-20 bg-rose-500 rounded-full"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12">
            {styles.map(s => (
                <div key={s.id} className="group bg-white rounded-[3rem] overflow-hidden border-2 border-rose-50 shadow-lg hover:shadow-2xl transition-all duration-500 flex flex-col hover:-translate-y-2">
                    <div className="px-8 pt-8 pb-4 bg-gradient-to-b from-rose-50/30 to-white flex justify-between items-center">
                        <h4 className="font-black text-xl text-slate-800 serif italic">{s.name}</h4>
                    </div>
                    <div className="aspect-square relative bg-rose-50 flex items-center justify-center overflow-hidden">
                        {genStates[s.id]?.isLoading ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center gap-4 bg-white/60 backdrop-blur-md z-30">
                                <div className="w-12 h-12 border-4 border-rose-500 border-t-rose-100 rounded-full animate-spin" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-rose-600">Neural Sync...</p>
                            </div>
                        ) : genStates[s.id]?.result ? (
                            <div className="w-full h-full relative z-20 flex items-center justify-center">
                                <img src={genStates[s.id].result!} className={`max-w-full max-h-full object-contain ${!genStates[s.id].isHighRes ? 'pointer-events-none select-none' : ''}`} alt={s.name} />
                                {!genStates[s.id].isHighRes && <Watermark text="www.chatgptdigital.store" />}
                                <button onClick={() => setGenStates(prev => ({...prev, [s.id]: {...prev[s.id], result: null}}))} className="absolute top-6 right-6 p-2.5 bg-white/80 backdrop-blur-md rounded-2xl text-rose-600 hover:bg-rose-600 hover:text-white transition-all z-40 shadow-lg">✕</button>
                            </div>
                        ) : (
                            <div className="w-full h-full cursor-pointer relative z-20 flex items-center justify-center group/img" onClick={() => handleGenerate(s)}>
                                <img src={s.imageUrl} className="max-w-full max-h-full object-contain transition-all duration-700 group-hover/img:scale-105" alt={s.name} />
                                <div className="absolute inset-0 bg-rose-900/10 opacity-0 group-hover/img:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                                    <span className="bg-white/95 px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest text-rose-600 shadow-2xl">Use This Style ✨</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="p-8 space-y-6 flex-grow flex flex-col justify-between">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">{s.description}</p>
                        <div className="space-y-4 pt-4 border-t-2 border-rose-50">
                            {genStates[s.id]?.result ? (
                                <div className="flex flex-col gap-3">
                                    {genStates[s.id].isHighRes ? (
                                        <div className="grid grid-cols-2 gap-3">
                                            <button onClick={() => handleDownload(s.id)} className="py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-xl">Saved! 🖼️</button>
                                            <button onClick={() => onAnimate?.(genStates[s.id].result!, s.prompt, true)} className="py-4 bg-rose-600 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest shadow-xl border-b-4 border-rose-800">Animate ✨</button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-3">
                                            {!freePhotoClaimed && (
                                              <button onClick={() => handleClaimFree(s.id)} className="w-full py-4 bg-rose-600 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest shadow-xl border-b-4 border-rose-800 hover:bg-rose-700">
                                                Get First free photo 🎁
                                              </button>
                                            )}
                                            <div className="grid grid-cols-2 gap-3">
                                                <button onClick={() => handleClaimWithCredits(s.id)} className="py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest shadow-xl border-b-4 border-black hover:bg-black">Spend 1 Credit</button>
                                                <button onClick={() => setShowCheckout(true)} className="py-4 bg-white border-2 border-slate-200 text-slate-900 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all">Buy Credits</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button onClick={() => handleGenerate(s)} className="w-full py-5 bg-rose-600 text-white rounded-[1.5rem] font-black text-lg uppercase tracking-widest shadow-xl hover:bg-rose-700 transition-all active:scale-95 border-b-4 border-rose-800">Transform Now ✨</button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      <CheckoutModal 
        isOpen={showCheckout} onClose={() => setShowCheckout(false)}
        cart={cart} onRemove={removeFromCart}
        onComplete={async (paymentId, items) => {
            // Logic handled in Modal to add credits
            const updatedCredits = await authService.refreshUserCredits();
            onUserUpdate(user ? { ...user, credits: updatedCredits } : null);
            setCart([]);
            setShowCheckout(false);
        }}
      />

      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={(u) => onUserUpdate(u)}
      />
    </div>
  );
};

export default ValentineView;
