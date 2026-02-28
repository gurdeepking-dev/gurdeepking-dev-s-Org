
import React from 'react';

const TutorialSection: React.FC = () => {
  return (
    <section className="bg-white rounded-[2.5rem] p-6 sm:p-10 shadow-2xl border border-rose-100 text-center space-y-8 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-3xl -mr-10 -mt-10"></div>
      <div className="relative space-y-4">
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl animate-bounce">📽️</span>
          <h3 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight uppercase tracking-widest serif italic">Watch video to learn how it work</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="relative mx-auto w-full max-w-[280px] sm:max-w-xs aspect-[9/16] bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl ring-8 ring-rose-50 overflow-hidden">
            <video autoPlay muted playsInline loop controls className="w-full h-full object-contain rounded-2xl">
              <source src="https://ghdwufjkpjuidyfsgkde.supabase.co/storage/v1/object/public/media/howto.mp4" type="video/mp4" />
            </video>
          </div>
          <div className="text-left space-y-6">
            <div className="space-y-4">
              {[1, 2, 3].map(num => (
                <div key={num} className="flex gap-4 items-start group">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-black flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm">{num}</div>
                  <div>
                    <h4 className="font-black text-slate-800 uppercase tracking-wide text-sm">{num === 1 ? 'Upload Photo' : num === 2 ? 'Choose Style' : 'Get Your Art'}</h4>
                    <p className="text-slate-500 text-xs font-medium">{num === 1 ? 'Pick a clear photo from your phone.' : num === 2 ? 'Click "Transform My Photo" on any style you like.' : 'Claim your 1 Free photo or buy more in HD!'}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 shadow-inner">
              <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest text-center">It takes only 30 seconds! ✨</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TutorialSection;
