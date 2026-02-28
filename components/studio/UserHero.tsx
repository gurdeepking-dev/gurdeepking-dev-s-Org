
import React from 'react';

interface UserHeroProps {
  userPhoto: string | null;
  onUploadClick: () => void;
  currencySymbol: string;
  photoPrice: number;
}

const UserHero: React.FC<UserHeroProps> = ({ userPhoto, onUploadClick, currencySymbol, photoPrice }) => {
  return (
    <section className="relative overflow-hidden bg-white rounded-[2.5rem] md:rounded-[4rem] p-6 md:p-12 shadow-2xl border border-rose-100 text-center">
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-rose-50 rounded-full blur-3xl opacity-60" />
      <div className="relative max-w-4xl mx-auto flex flex-col items-center gap-6 sm:gap-8">
        <div className="relative" onClick={onUploadClick}>
          <div className={`w-36 h-36 md:w-52 md:h-52 rounded-[2.5rem] flex items-center justify-center transition-all duration-500 shadow-2xl cursor-pointer hover:scale-[1.03] active:scale-95 ${userPhoto ? 'bg-white ring-8 ring-rose-50' : 'bg-gradient-to-br from-rose-500 to-pink-500 shadow-rose-200'}`}>
            {userPhoto ? (
              <img src={userPhoto} className="w-full h-full object-cover rounded-[2.5rem]" alt="Your Photo" />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <span className="text-white text-3xl sm:text-4xl">📸</span>
                <span className="text-[10px] sm:text-[11px] font-black text-rose-100 uppercase tracking-widest">Upload Photo</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Get your 1 free photo 🎁</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tighter leading-tight serif">
            AI Magic <span className="text-rose-500 italic">Photos</span>
          </h1>
          <p className="text-sm md:text-base text-slate-400 font-semibold max-w-lg mx-auto leading-relaxed px-4">
            Change your photo to a cool style. Get 1 photo for <span className="text-rose-500">FREE</span>. Others for just <span className="text-slate-900">{currencySymbol}{photoPrice}</span>.
          </p>
        </div>

        {!userPhoto && (
          <button onClick={onUploadClick} className="group px-8 py-4 bg-rose-600 text-white rounded-[1.5rem] font-black text-base shadow-2xl shadow-rose-200 hover:bg-rose-700 transition-all active:scale-95">
            Choose Your Photo 📸
          </button>
        )}
      </div>
    </section>
  );
};

export default UserHero;
