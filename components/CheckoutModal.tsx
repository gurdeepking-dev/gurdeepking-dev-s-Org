
import React, { useState, useMemo, useEffect } from 'react';
import { CartItem, Coupon, AdminSettings } from '../types';
import { storageService } from '../services/storage';
import { logger } from '../services/logger';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onRemove: (id: string) => void;
  onComplete: (paymentId: string, paidItemIds: string[]) => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, cart, onRemove, onComplete }) => {
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Credit Bundle state
  const [buyBundle, setBuyBundle] = useState(false);

  useEffect(() => {
    storageService.getAdminSettings().then(setSettings);
  }, []);

  const subtotal = useMemo(() => {
    let sum = cart.reduce((s, item) => s + item.price, 0);
    if (buyBundle && settings) sum += settings.payment.creditBundlePrice;
    return sum;
  }, [cart, buyBundle, settings]);
  
  const discount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'percentage') return (subtotal * appliedCoupon.value) / 100;
    return Math.min(appliedCoupon.value, subtotal);
  }, [subtotal, appliedCoupon]);

  const total = useMemo(() => Math.max(0, subtotal - discount), [subtotal, discount]);

  const handleApplyCoupon = async () => {
    if (!couponCode || !settings) return;
    const code = couponCode.toUpperCase().trim();
    const coupon = settings.coupons?.find(c => c.code === code && c.isActive);
    if (coupon) { setAppliedCoupon(coupon); setCouponError(null); }
    else { setAppliedCoupon(null); setCouponError("Invalid code"); }
  };

  const handlePay = async () => {
    if (!email) { setError("Please type your email for delivery."); return; }
    try {
      setIsProcessing(true);
      setError(null);
      if (total <= 0) {
        if (buyBundle && settings) await storageService.addCredits(email, settings.payment.creditBundleAmount);
        onComplete(`free_${Date.now()}`, cart.map(i => i.id));
        return;
      }

      const keyId = settings?.payment?.keyId;
      const options = {
        key: keyId,
        amount: Math.round(total * 100),
        currency: settings?.payment?.currency || "INR",
        name: "chatgpt digital store",
        description: buyBundle ? `Credit Bundle + ${cart.length} Art Pieces` : `${cart.length} Art Pieces`,
        handler: async (res: any) => {
          if (buyBundle && settings) {
            await storageService.addCredits(email, settings.payment.creditBundleAmount);
          }
          onComplete(res.razorpay_payment_id, cart.map(i => i.id));
        },
        prefill: { email },
        theme: { color: "#f43f5e" },
        modal: { ondismiss: () => setIsProcessing(false) }
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) { 
      logger.error('Checkout', 'Payment Error', err);
      setError("Payment initiation failed. Please try again."); 
      setIsProcessing(false); 
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 space-y-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto scrollbar-hide">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h4 className="text-3xl font-black text-slate-900 tracking-tighter">Summary</h4>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-600 text-2xl font-bold">×</button>
        </div>

        {settings && (
          <div onClick={() => setBuyBundle(!buyBundle)} className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all ${buyBundle ? 'border-rose-500 bg-rose-50 ring-4 ring-rose-500/10' : 'border-slate-100 bg-white hover:border-rose-200'}`}>
             <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg transition-all ${buyBundle ? 'bg-rose-500 text-white rotate-12' : 'bg-slate-100 text-slate-400'}`}>🎁</div>
                <div className="flex-grow">
                   <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">BEST VALUE BUNDLE</p>
                   <p className="font-black text-slate-900 leading-tight">Get {settings.payment.creditBundleAmount} HD Credits</p>
                   <p className="text-[11px] font-bold text-slate-400">Unlock {settings.payment.creditBundleAmount} high-res downloads for {storageService.getCurrencySymbol()}{settings.payment.creditBundlePrice}</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${buyBundle ? 'border-rose-500 bg-rose-500' : 'border-slate-200'}`}>
                  {buyBundle && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                </div>
             </div>
          </div>
        )}
        
        <div className="space-y-3 max-h-40 overflow-y-auto pr-2 scrollbar-hide border-y border-slate-50 py-4">
          {cart.map(item => (
            <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <img src={item.styledImage} className="w-12 h-12 rounded-xl object-cover" alt={item.styleName} />
              <div className="flex-grow">
                <p className="font-bold text-sm text-slate-800">{item.styleName}</p>
                <p className="text-[10px] text-rose-600 font-black">{storageService.getCurrencySymbol()} {item.price.toFixed(2)}</p>
              </div>
              {!isProcessing && <button onClick={() => onRemove(item.id)} className="p-2 text-slate-300 hover:text-red-500">✕</button>}
            </div>
          ))}
          {cart.length === 0 && !buyBundle && <p className="text-center py-4 text-slate-400 text-sm italic font-medium">Your cart is currently empty.</p>}
        </div>

        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2">
            <input type="text" placeholder="Promo Code" className="flex-grow px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-rose-500" value={couponCode} onChange={e => setCouponCode(e.target.value)} />
            <button onClick={handleApplyCoupon} className="px-6 py-3 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase">Apply</button>
          </div>
          <div className="space-y-2 border-t pt-4 text-slate-900 font-black">
             <div className="flex justify-between text-xl">
                <span>Total Due</span>
                <span>{storageService.getCurrencySymbol()} {total.toFixed(2)}</span>
             </div>
          </div>
        </div>

        <div className="space-y-4">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email for delivery" disabled={isProcessing} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-2 focus:ring-rose-500 font-medium" />
          {error && <p className="text-xs text-red-500 font-bold text-center">{error}</p>}
        </div>

        <button onClick={handlePay} disabled={isProcessing || (cart.length === 0 && !buyBundle)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-black transition-all active:scale-95 disabled:opacity-30">
          {isProcessing ? "Processing..." : `Pay Securely`}
        </button>
      </div>
    </div>
  );
};

export default CheckoutModal;
