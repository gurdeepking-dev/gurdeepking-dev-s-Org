
import React from 'react';
import Watermark from '../Watermark';

interface CustomArtCardProps {
  state: {
    isLoading: boolean;
    result: string | null;
    error: string | null;
    refinement: string;
    isHighRes: boolean;
  };
  globalPrompt: string;
  onMagicGenerate: () => void;
  onDownload: (id: string) => void;
  onAnimate?: (photo: string, prompt: string, isVerified: boolean) => void;
  onClaimFree: (id: string) => void;
  onClaimWithCredits: (id: string) => void;
  onAddToCart: (id: string) => void;
  onReset: () => void;
  onRefinementChange: (val: string) => void;
  freePhotoClaimed: boolean;
  isInCart: boolean;
  userCredits?: number;
}

const CustomArtCard: React.FC<CustomArtCardProps> = ({
  state, globalPrompt, onMagicGenerate, onDownload, onAnimate, onClaimFree,
  onClaimWithCredits, onAddToCart, onReset, onRefinementChange,
  freePhotoClaimed, isInCart, userCredits
}) => {
  if (!state.result && !state.isLoading) return null;

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
              <button onClick={onReset} className="absolute top-6 right-6 p-2.5 bg-white/80 backdrop-blur-md rounded-2xl text-rose-600 hover:bg-rose-600 hover:text-white transition-all z-40 shadow-xl">✕</button>
            </div>
          ) : null}
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-4">
             <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1 block">Want to adjust anything?</label>
             <div className="flex gap-2">
                 <input 
                     type="text" value={state.refinement}
                     onChange={(e) => onRefinementChange(e.target.value)}
                     placeholder="e.g. brighter sky, more cinematic..."
                     className="flex-grow px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-semibold outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                 />
                 <button onClick={onMagicGenerate} className="px-6 py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg active:scale-95">Retry</button>
             </div>
          </div>

          <div className="flex flex-col gap-3">
            {state.isHighRes ? (
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => onDownload('custom')} className="py-5 bg-slate-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-xl">Download 🖼️</button>
                <button onClick={() => onAnimate?.(state.result!, globalPrompt, true)} className="py-5 bg-rose-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-xl border-b-4 border-rose-800 hover:bg-rose-700 transition-all">Animate ✨</button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {!freePhotoClaimed && (
                  <button onClick={() => onClaimFree('custom')} className="w-full py-5 bg-rose-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-xl border-b-4 border-rose-800 hover:bg-rose-700 active:scale-95">
                    Get First free photo 🎁
                  </button>
                )}
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => onClaimWithCredits('custom')} className="py-5 bg-slate-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-xl border-b-4 border-black hover:bg-black active:scale-95">
                      {userCredits && userCredits > 0 ? 'Use 1 Credit' : 'Get HD (1 Credit)'}
                    </button>
                    <button 
                      onClick={() => onAddToCart('custom')} 
                      className={`py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 ${
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
        </div>
      </div>
    </div>
  );
};

export default CustomArtCard;
