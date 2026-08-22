import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Clock3, X } from 'lucide-react';
import { bookingHold, BookingHold } from '../../services/bookingHold';

export const BookingHoldBanner: React.FC = () => {
  const [hold, setHold] = useState<BookingHold | null>(() => bookingHold.get());
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [qrImage, setQrImage] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setHold(bookingHold.get());
    window.addEventListener(bookingHold.eventName, refresh);
    return () => window.removeEventListener(bookingHold.eventName, refresh);
  }, []);

  useEffect(() => {
    if (!hold) { setQrImage(null); return; }
    void QRCode.toDataURL(hold.verificationToken).then(setQrImage);
    const update = () => {
      const seconds = Math.max(0, Math.ceil((new Date(hold.verificationExpiresAt).getTime() - Date.now()) / 1000));
      setRemainingSeconds(seconds);
      if (seconds === 0) bookingHold.clear();
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [hold]);

  if (!hold || remainingSeconds <= 0 || !qrImage) return null;
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = String(remainingSeconds % 60).padStart(2, '0');

  return <div className="fixed bottom-20 md:bottom-5 right-4 z-30 w-[min(360px,calc(100vw-2rem))] p-3 bg-white border border-emerald-200 rounded-2xl shadow-xl"><div className="flex items-start gap-3"><img src={qrImage} alt="Booking verification QR code" className="w-20 h-20 bg-white p-1 rounded-lg" /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="text-sm font-bold text-slate-900">{hold.facility} booking</p><button type="button" title="Hide QR" onClick={() => bookingHold.clear()} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button></div><p className="text-xs text-slate-500 mt-1">Show this QR to the facility admin.</p><p className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 mt-2"><Clock3 className="w-3.5 h-3.5" />Expires in {minutes}:{seconds}</p></div></div></div>;
};