
import React, { useState, useEffect, useRef } from 'react';
import { StyleTemplate, CartItem, User, TransactionRecord } from '../types';
import { storageService } from '../services/storage';
import { geminiService } from '../services/geminiService';
import { usageService } from '../services/usageService';
import { authService } from '../services/authService';
import { logger } from '../services/logger';
import { analytics } from '../services/analytics';
import ArtCard from './studio/ArtCard';
import CustomArtCard from './studio/CustomArtCard';
import PromptBar from './studio/PromptBar';

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
  lastPurchasedIds?: string[];
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
  cart, user, addToCart, showCheckout, setShowCheckout, removeFromCart, setCart, onAnimate, onUserUpdate,
  onLoginRequired, lastPurchasedIds = []
}) => {
  const [styles, setStyles] = useState<StyleTemplate[]>([]);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [genStates, setGenStates] = useState<GenerationState>({});
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [freePhotoClaimed, setFreePhotoClaimed] = useState(false);
  const [settings, setSettings] = useState<any>(null);

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
    if (lastPurchasedIds.length > 0) {
      lastPurchasedIds.forEach(id => {
        const styleId = id.split('-')[0];
        if (styleId === 'custom') {
          setCustomGenState(prev => ({ ...prev, isHighRes: true }));
        } else {
          setGenStates(prev => ({
            ...prev,
            [styleId]: { ...prev[styleId], isHighRes: true }
          }));
        }
      });
    }
  }, [lastPurchasedIds]);

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
    if (!user) { onLoginRequired(); return; }
    
    if (user.credits < 1) {
      handleAddToCart(id, isCustom);
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

  const handleAddToCart = (id: string, isCustom = false) => {
    const state = isCustom ? customGenState : genStates[id];
    if (!state.result) return;

    const isInCart = cart.some(item => item.id.startsWith(id));
    if (isInCart) {
      setShowCheckout(true);
      return;
    }

    const style = styles.find(s => s.id === id);
    const item: CartItem = {
      id: `${id}-${Date.now()}`,
      styledImage: state.result,
      styleName: isCustom ? 'Custom Creation' : (style?.name || 'Art Piece'),
      price: settings?.payment.photoPrice || 8
    };

    addToCart(item);
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

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto px-4">
      <section className="relative overflow-hidden bg-white rounded-[4rem] p-10 sm:p-16 shadow-2xl border border-rose-100 text-center">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-rose-50 rounded-full blur-[100px] opacity-60"></div>
        
        <PromptBar 
          userPhoto={userPhoto}
          userCredits={user?.credits}
          isLoggedIn={user?.isLoggedIn}
          globalPrompt={globalPrompt}
          setGlobalPrompt={setGlobalPrompt}
          isPromptExpanded={isPromptExpanded}
          setIsPromptExpanded={setIsPromptExpanded}
          isListening={isListening}
          isLoading={customGenState.isLoading}
          onUploadClick={() => uploadInputRef.current?.click()}
          onVoiceInput={handleVoiceInput}
          onMagicGenerate={handleMagicGenerate}
        />

        <div className="mt-8 space-y-4">
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 serif italic tracking-tighter leading-none">AI Art <span className="text-rose-500">Studio</span></h1>
          <p className="text-slate-400 font-bold max-w-lg mx-auto leading-relaxed text-sm uppercase tracking-wide">
            Transform your persona into any artistic vision. New users get <span className="text-rose-600">5 FREE credits</span> on signup! 🎁
          </p>
        </div>

        {!userPhoto && (
          <button onClick={() => uploadInputRef.current?.click()} className="mt-8 px-12 py-6 bg-rose-600 text-white rounded-[2rem] font-black text-xl shadow-2xl hover:bg-rose-700 transition-all active:scale-95 border-b-8 border-rose-800 tracking-widest">START MAGIC 📸</button>
        )}
        <input type="file" ref={uploadInputRef} accept="image/*" onChange={handleFileUpload} className="hidden" />

        <CustomArtCard 
          state={customGenState}
          globalPrompt={globalPrompt}
          onMagicGenerate={handleMagicGenerate}
          onDownload={handleDownload}
          onAnimate={onAnimate}
          onClaimFree={(id) => handleClaimFree(id, true)}
          onClaimWithCredits={(id) => handleClaimWithCredits(id, true)}
          onAddToCart={(id) => handleAddToCart(id, true)}
          onReset={() => setCustomGenState(prev => ({...prev, result: null}))}
          onRefinementChange={(val) => setCustomGenState(prev => ({...prev, refinement: val}))}
          freePhotoClaimed={freePhotoClaimed}
          isInCart={cart.some(i => i.id.startsWith('custom'))}
          userCredits={user?.credits}
        />
      </section>

      <div className="space-y-10">
        <div className="flex flex-col items-center gap-2">
            <h2 className="text-3xl font-black text-slate-900 serif italic">Preset Masterpieces</h2>
            <div className="h-1.5 w-20 bg-rose-500 rounded-full"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12">
            {styles.map(s => (
                <ArtCard 
                  key={s.id}
                  style={s}
                  state={genStates[s.id]}
                  onGenerate={handleGenerate}
                  onDownload={handleDownload}
                  onAnimate={onAnimate}
                  onClaimFree={handleClaimFree}
                  onClaimWithCredits={handleClaimWithCredits}
                  onAddToCart={handleAddToCart}
                  onReset={(id) => setGenStates(prev => ({...prev, [id]: {...prev[id], result: null}}))}
                  freePhotoClaimed={freePhotoClaimed}
                  isInCart={cart.some(i => i.id.startsWith(s.id))}
                  userCredits={user?.credits}
                />
            ))}
            {styles.length === 0 && (
              <div className="col-span-full py-20 text-center space-y-4 bg-white rounded-[3rem] border-2 border-dashed border-rose-100">
                <div className="text-4xl">🎨</div>
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest italic">No preset styles found. Add some in the Admin Panel!</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ValentineView;
