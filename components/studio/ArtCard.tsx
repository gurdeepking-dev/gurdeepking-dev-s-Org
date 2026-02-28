
import React from 'react';
import { StyleTemplate, CartItem } from '../../types';
import Watermark from '../Watermark';

interface ArtCardProps {
  style: StyleTemplate;
  state: {
    isLoading: boolean;
    result: string | null;
    error: string | null;
    refinement: string;
    isHighRes: boolean;
  };
  onGenerate: (style: StyleTemplate) => void;
  onDownload: (id: string) => void;
  onAnimate?: (photo: string, prompt: string, isVerified: boolean) => void;
  onClaimFree: (id: string) => void;
  onClaimWithCredits: (id: string) => void;
  onAddToCart: (id: string) => void;
  onReset: (id: string) => void;
  freePhotoClaimed: boolean;
  isInCart: boolean;
  userCredits?: number;
}

const ArtCard: React.FC<ArtCardProps> = ({
  style, state, onGenerate, onDownload, onAnimate, onClaimFree, 
  onClaimWithCredits, onAddToCart, onReset, freePhotoClaimed, isInCart, userCredits
}) => {
  return (
    <div className="group bg-white rounded-[3rem] overflow-hidden border-2 border-rose-50 shadow-lg hover:shadow-2xl transition-all duration-500 flex flex-col hover:-translate-y-2">
      <div className="px-8 pt-8 pb-4 bg-gradient-to-b from-rose-50/30 to-white flex justify-between items-center">
        <h4 className="font-black text-xl text-slate-800 serif italic">{style.name}</h4>
      </div>
      <div className="aspect-square relative bg-rose-50 flex items-center justify-center overflow-hidden">
        {state.isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center gap-4 bg-white/60 backdrop-blur-md z-30">
            <div className="w-12 h-12 border-4 border-rose-500 border-t-rose-100 rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-600">Neural Sync...</p>
          </div>
        ) : state.result ? (
          <div className="w-full h-full relative z-20 flex items-center justify-center">
            <img 
              src={state.result} 
              className={`max-w-full max-h-full object-contain ${!state.isHighRes ? 'pointer-events-none select-none' : ''}`} 
              alt={style.name} 
            />
            {!state.isHighRes && <Watermark text="www.chatgptdigital.store" />}
            <button 
              onClick={() => onReset(style.id)} 
              className="absolute top-6 right-6 p-2.5 bg-white/80 backdrop-blur-md rounded-2xl text-rose-600 hover:bg-rose-600 hover:text-white transition-all z-40 shadow-xl"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="w-full h-full cursor-pointer relative z-20 flex items-center justify-center group/img" onClick={() => onGenerate(style)}>
            <img src={style.imageUrl} className="max-w-full max-h-full object-contain transition-all duration-700 group-hover/img:scale-105" alt={style.name} />
            <div className="absolute inset-0 bg-rose-900/10 opacity-0 group-hover/img:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
              <span className="bg-white/95 px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest text-rose-600 shadow-2xl">Use This Style ✨</span>
            </div>
          </div>
        )}
      </div>
      <div className="p-8 space-y-6 flex-grow flex flex-col justify-between">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">{style.description}</p>
        <div className="space-y-4 pt-4 border-t-2 border-rose-50">
          {state.result ? (
            <div className="flex flex-col gap-3">
              {state.isHighRes ? (
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => onDownload(style.id)} className="py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-xl">Saved! 🖼️</button>
                  <button onClick={() => onAnimate?.(state.result!, style.prompt, true)} className="py-4 bg-rose-600 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest shadow-xl border-b-4 border-rose-800">Animate ✨</button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {!freePhotoClaimed && (
                    <button onClick={() => onClaimFree(style.id)} className="w-full py-4 bg-rose-600 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest shadow-xl border-b-4 border-rose-800 hover:bg-rose-700">
                      Get First free photo 🎁
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => onClaimWithCredits(style.id)} className="py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest shadow-xl border-b-4 border-black hover:bg-black">
                      {userCredits && userCredits > 0 ? 'Use 1 Credit' : 'Get HD (1 Credit)'}
                    </button>
                    <button 
                      onClick={() => onAddToCart(style.id)} 
                      className={`py-4 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest transition-all ${
                        isInCart
                          ? 'bg-rose-600 text-white border-b-4 border-rose-800'
                          : 'bg-white border-2 border-slate-200 text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      {isInCart ? 'Checkout Now' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => onGenerate(style)} className="w-full py-5 bg-rose-600 text-white rounded-[1.5rem] font-black text-lg uppercase tracking-widest shadow-xl hover:bg-rose-700 transition-all active:scale-95 border-b-4 border-rose-800">Transform Now ✨</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArtCard;
