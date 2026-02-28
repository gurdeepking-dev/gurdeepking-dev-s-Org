
import React from 'react';
import { StyleTemplate } from '../../types';
import Watermark from '../Watermark';

interface UserArtCardProps {
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
  onClaimFree: (id: string) => void;
  onAddToCart: (id: string) => void;
  onReset: (id: string) => void;
  onRefinementChange: (id: string, val: string) => void;
  onAnimate?: (photo: string, prompt: string, isVerified: boolean) => void;
  onBuyHD: (id: string) => void;
  freePhotoClaimed: boolean;
  isInCart: boolean;
}

const UserArtCard: React.FC<UserArtCardProps> = ({
  style, state, onGenerate, onDownload, onClaimFree, onAddToCart, onReset,
  onRefinementChange, onAnimate, onBuyHD, freePhotoClaimed, isInCart
}) => {
  return (
    <div className="group relative bg-white rounded-[2.5rem] overflow-hidden border-2 border-rose-50 shadow-lg hover:shadow-2xl hover:shadow-rose-100 transition-all duration-500 flex flex-col hover:-translate-y-2">
      <div className="px-7 pt-7 pb-4 flex justify-between items-center bg-gradient-to-b from-rose-50/50 to-white">
        <h4 className="font-black text-xl sm:text-2xl text-slate-800 tracking-tight leading-tight serif italic">{style.name}</h4>
      </div>

      <div className="aspect-square relative bg-rose-50 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-10 pointer-events-none ring-1 ring-inset ring-rose-500/20 shadow-[inset_0_0_80px_rgba(244,63,94,0.1)]"></div>
        
        {state.isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center gap-4 bg-white/60 backdrop-blur-md z-30">
            <div className="w-12 h-12 border-4 border-rose-500 border-t-rose-100 rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 animate-pulse">
              AI is working...
            </p>
          </div>
        ) : state.result ? (
          <div 
            className="w-full h-full relative z-20 animate-in zoom-in-95 duration-700 flex items-center justify-center overflow-hidden group/preview"
            onContextMenu={(e) => !state.isHighRes && e.preventDefault()}
          >
            <img 
              src={state.result} 
              className={`max-w-full max-h-full object-contain ${!state.isHighRes ? 'pointer-events-none select-none' : ''}`} 
              alt={style.name} 
              decoding="async" 
              style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
            />
            
            {!state.isHighRes && (
              <>
                <Watermark text="www.chatgptdigital.store" />
                <div className="absolute inset-0 z-40 bg-transparent cursor-default"></div>
              </>
            )}
            
            <button 
              onClick={() => onReset(style.id)}
              className="absolute top-4 right-4 p-2.5 bg-white/60 backdrop-blur-md rounded-xl text-rose-600 hover:bg-rose-600 hover:text-white transition-all z-[50] shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ) : (
          <div className="w-full h-full cursor-pointer relative z-20 group/img flex items-center justify-center" onClick={() => onGenerate(style)}>
            <img 
              src={style.imageUrl} 
              className="relative z-10 max-w-full max-h-full object-contain transition-all duration-700 group-hover/img:scale-[1.03]" 
              alt={style.name} 
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 z-30 bg-rose-900/20 opacity-0 group-hover/img:opacity-100 transition-all duration-500 flex items-center justify-center backdrop-blur-[2px]">
              <div className="bg-white/95 px-7 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-rose-600 shadow-2xl flex items-center gap-2">
                <span>Try this style</span>
                <span className="text-base">✨</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-7 space-y-4 flex-grow flex flex-col justify-between bg-gradient-to-b from-white to-rose-50/20">
        <div className="space-y-3">
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">{style.description}</p>
            
           {state.result && (
            <div className="animate-in slide-in-from-bottom-2 duration-500 space-y-2">
                <label className="text-[9px] font-black text-rose-400 uppercase tracking-widest ml-1 block">Want to change anything? (Optional)</label>
                <div className="flex gap-2">
                    <input 
                        type="text" value={state.refinement}
                        onChange={(e) => onRefinementChange(style.id, e.target.value)}
                        placeholder="Example: more blue, smiling..."
                        className="flex-grow px-4 py-2.5 rounded-xl bg-white border-2 border-rose-100 text-[11px] font-semibold outline-none focus:border-rose-300 transition-all placeholder:text-slate-300"
                        onKeyPress={(e) => e.key === 'Enter' && onGenerate(style)}
                    />
                    <button 
                        onClick={() => onGenerate(style)}
                        className="px-4 py-2.5 bg-rose-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 transition-all shadow-md active:scale-95"
                    >
                        Try Again
                    </button>
                </div>
            </div>
           )}
        </div>

        <div className="space-y-3 pt-4 border-t-2 border-rose-50">
          {state.result ? (
            <div className="flex flex-col gap-3">
              {state.isHighRes ? (
                <div className="flex gap-2">
                  <button onClick={() => onDownload(style.id)} className="flex-grow py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Saved to gallery
                  </button>
                  {onAnimate && (
                    <button 
                      onClick={() => onAnimate(state.result!, style.prompt, true)}
                      className="p-4 bg-indigo-600 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all active:scale-95"
                      title="Animate this photo"
                    >
                      🎬
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {!freePhotoClaimed ? (
                    <button onClick={() => onClaimFree(style.id)} className="w-full py-4 bg-rose-600 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-rose-700 transition-all active:scale-95 border-b-4 border-rose-800">
                      Get your 1 free photo 🎁
                    </button>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => onAddToCart(style.id)} 
                        className={`py-3 rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest transition-all ${
                          isInCart
                            ? 'bg-rose-600 text-white border-b-4 border-rose-800'
                            : 'border-2 border-rose-100 bg-white text-rose-400 hover:bg-rose-50'
                        }`}
                      >
                        {isInCart ? 'Checkout' : 'Save'}
                      </button>
                      <button 
                        onClick={() => onBuyHD(style.id)} 
                        className="py-3 bg-slate-900 text-white rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest hover:bg-black shadow-xl transition-all"
                      >
                        Buy HD
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            !state.isLoading && (
              <button onClick={() => onGenerate(style)} className="w-full py-5 bg-rose-600 text-white rounded-[1.5rem] font-black text-2xl uppercase tracking-widest shadow-xl shadow-rose-100 hover:bg-rose-700 transition-all flex items-center justify-center gap-3 group/btn active:scale-95 border-b-4 border-rose-800">
                <span>Transform My Photo ✨</span>
              </button>
            )
          )}
          {state.error && (
            <div className="p-3 rounded-2xl bg-rose-50 border-2 border-rose-100">
              <p className="text-[9px] text-rose-600 font-bold uppercase tracking-widest text-center">{state.error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserArtCard;
