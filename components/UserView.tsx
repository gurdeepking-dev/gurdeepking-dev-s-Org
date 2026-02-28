
import React, { useState, useEffect, useRef } from 'react';
import { StyleTemplate, CartItem, User, TransactionRecord } from '../types';
import { storageService } from '../services/storage';
import { geminiService } from '../services/geminiService';
import { usageService } from '../services/usageService';
import { logger } from '../services/logger';
import { analytics } from '../services/analytics';
import TutorialSection from './studio/TutorialSection';
import UserHero from './studio/UserHero';
import UserArtCard from './studio/UserArtCard';

interface UserViewProps {
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

const UserView: React.FC<UserViewProps> = ({ 
  cart, user, addToCart, showCheckout, setShowCheckout, removeFromCart, setCart, onAnimate,
  lastPurchasedIds = []
}) => {
  const [styles, setStyles] = useState<StyleTemplate[]>([]);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [genStates, setGenStates] = useState<GenerationState>({});
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [freePhotoClaimed, setFreePhotoClaimed] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    if (lastPurchasedIds.length > 0) {
      setGenStates(prev => {
        const next = { ...prev };
        lastPurchasedIds.forEach(id => {
          const styleId = id.split('-')[0];
          if (next[styleId]) next[styleId].isHighRes = true;
        });
        return next;
      });
    }
  }, [lastPurchasedIds]);

  useEffect(() => {
    logger.info('View', 'UserView mounted');
    loadContent();
    
    return () => {
      if (userPhoto && userPhoto.startsWith('blob:')) {
        URL.revokeObjectURL(userPhoto);
      }
    };
  }, []);

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
        const isFirstUpload = !userPhoto;
        setUserPhoto(base64);
        
        setGenStates(prev => {
          const newState = { ...prev };
          Object.keys(newState).forEach(id => {
            newState[id] = { ...newState[id], result: null, error: null, isHighRes: false };
          });
          return newState;
        });

        if (isFirstUpload) analytics.track('Lead', { method: 'upload' });
        storageService.logActivity('photo_uploaded', { size: file.size, type: file.type });

        styles.forEach(s => { if (s.autoGenerate) handleGenerate(s, base64); });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async (style: StyleTemplate, overridePhoto?: string) => {
    const photoToUse = overridePhoto || userPhoto;
    if (!photoToUse) { uploadInputRef.current?.click(); return; }

    analytics.track('StartGeneration', { style_name: style.name });
    setGenStates(prev => ({
      ...prev,
      [style.id]: { ...prev[style.id], isLoading: true, error: null }
    }));

    try {
      const state = genStates[style.id] || { refinement: '' };
      const result = await geminiService.generateStyle(photoToUse, style.prompt, state.refinement);
      setGenStates(prev => ({ ...prev, [style.id]: { ...prev[style.id], isLoading: false, result } }));
      storageService.logActivity('generation_success', { style_id: style.id });
    } catch (err: any) {
      setGenStates(prev => ({ ...prev, [style.id]: { ...prev[style.id], isLoading: false, error: err.message } }));
      storageService.logActivity('generation_error', { style_id: style.id, error: err.message });
    }
  };

  const handleClaimFree = (styleId: string) => {
    if (freePhotoClaimed) return;
    usageService.markFreePhotoAsUsed();
    setFreePhotoClaimed(true);
    setGenStates(prev => {
      const current = prev[styleId];
      if (current && current.result) return { ...prev, [styleId]: { ...current, isHighRes: true } };
      return prev;
    });
    handleDownload(styleId);
    analytics.track('ClaimFree', { style_id: styleId });
    storageService.logActivity('free_claim', { style_id: styleId });
  };

  const handleAddToCart = (styleId: string) => {
    const state = genStates[styleId];
    const style = styles.find(s => s.id === styleId);
    if (!state.result || !style) return;

    const isInCart = cart.some(item => item.id.startsWith(styleId));
    if (isInCart) {
      setShowCheckout(true);
      return;
    }

    const newItem: CartItem = {
      id: `${styleId}-${Date.now()}`, 
      styledImage: state.result,
      styleName: style.name,
      price: settings?.payment.photoPrice || 5.00,
    };
    addToCart(newItem);
  };

  const handleDownload = (styleId: string) => {
    const state = genStates[styleId];
    if (!state.result) return;
    const link = document.createElement('a');
    link.href = state.result;
    link.download = `photo-${styleId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    storageService.logActivity('download', { style_id: styleId });
  };

  if (!settings) return (
    <div className="py-20 flex flex-col items-center justify-center gap-4 text-rose-400">
      <div className="w-10 h-10 border-4 border-rose-100 border-t-rose-500 rounded-full animate-spin" />
      <p className="font-bold tracking-tight">Opening store...</p>
    </div>
  );

  const currencySymbol = storageService.getCurrencySymbol(settings.payment.currency);

  return (
    <div className="space-y-8 sm:space-y-12 pb-24 max-w-7xl mx-auto px-4">
      <TutorialSection />

      <UserHero 
        userPhoto={userPhoto}
        onUploadClick={() => uploadInputRef.current?.click()}
        currencySymbol={currencySymbol}
        photoPrice={settings.payment.photoPrice}
      />
      
      <input type="file" ref={uploadInputRef} accept="image/*" onChange={handleFileUpload} className="hidden" />

      <section className="space-y-8">
        <div className="flex flex-col items-center text-center gap-2">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight serif italic">Explore More Styles</h2>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Discover hundreds of artistic variations</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12">
          {styles.map((s) => (
            <UserArtCard 
              key={s.id}
              style={s}
              state={genStates[s.id] || { isLoading: false, result: null, error: null, refinement: '', isHighRes: false }}
              onGenerate={handleGenerate}
              onDownload={handleDownload}
              onClaimFree={handleClaimFree}
              onAddToCart={handleAddToCart}
              onReset={(id) => setGenStates(prev => ({...prev, [id]: {...prev[id], result: null}}))}
              onRefinementChange={(id, val) => setGenStates(prev => ({...prev, [id]: {...prev[id], refinement: val}}))}
              onAnimate={onAnimate}
              onBuyHD={(id) => {
                if (cart.some(i => i.id.startsWith(id))) {
                  setShowCheckout(true);
                } else {
                  handleAddToCart(id);
                  setShowCheckout(true);
                }
              }}
              freePhotoClaimed={freePhotoClaimed}
              isInCart={cart.some(i => i.id.startsWith(s.id))}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default UserView;
