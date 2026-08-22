import React, { useEffect, useState } from 'react';
import { CalendarDays, Clock3, X, XCircle } from 'lucide-react';
import QRCode from 'qrcode';
import { bookingService, Booking, Facility, FacilitySlot } from '../services/bookingService';

const formatDate = (value: string) => {
  const dateValue = value.slice(0, 10);
  const date = new Date(`${dateValue}T00:00:00`);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};
const formatTime = (value: string) => value ? value.slice(0, 5) : 'Time unavailable';

export const BookingsPage: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<FacilitySlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<FacilitySlot | null>(null);
  const [qrBooking, setQrBooking] = useState<Booking | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrExpiresAt, setQrExpiresAt] = useState<string | null>(null);
  const [qrRemaining, setQrRemaining] = useState(0);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [slotLoading, setSlotLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reloadBookings = async () => setBookings(await bookingService.getMyBookings());

  useEffect(() => {
    void Promise.all([bookingService.getFacilities(), bookingService.getMyBookings()]).then(([loadedFacilities, loadedBookings]) => {
      setFacilities(loadedFacilities); setBookings(loadedBookings); setSelectedFacility(loadedFacilities[0]?.id || '');
    }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Unable to connect to Campus Rush services.')).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedFacility) return;
    setSlotLoading(true); setSelectedSlot(null);
    void bookingService.getSlots(selectedFacility, date).then(setSlots).catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Unable to load facility slots.')).finally(() => setSlotLoading(false));
  }, [selectedFacility, date]);

  useEffect(() => {
    if (!qrExpiresAt) return;
    const tick = () => setQrRemaining(Math.max(0, Math.ceil((new Date(qrExpiresAt).getTime() - Date.now()) / 1000)));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [qrExpiresAt]);

  const openQr = async (booking: Booking) => {
    setError(null); setQrBooking(booking); setQrLoading(true); setQrImage(null); setQrRemaining(0);
    try {
      const qr = await bookingService.createCheckinQr(booking.bookingId);
      setQrExpiresAt(booking.bookingExpiresAt || qr.expiresAt); setQrImage(await QRCode.toDataURL(qr.qrToken, { margin: 2, width: 260 }));
    } catch (qrError) { setError(qrError instanceof Error ? qrError.message : 'Unable to generate check-in QR.'); setQrBooking(null); } finally { setQrLoading(false); }
  };

  const confirmBooking = async () => {
    if (!selectedSlot) return;
    setBookingLoading(true); setError(null);
    try { await bookingService.createBooking(selectedFacility, selectedSlot.slotId); setSelectedSlot(null); setSlots(await bookingService.getSlots(selectedFacility, date)); await reloadBookings(); }
    catch (bookingError) { setError(bookingError instanceof Error ? bookingError.message : 'Unable to confirm booking.'); } finally { setBookingLoading(false); }
  };

  const confirmCancellation = async () => {
    if (!cancelTarget) return;
    setCancelLoading(true); setError(null);
    try { await bookingService.cancelBooking(cancelTarget.bookingId); setCancelTarget(null); if (qrBooking?.bookingId === cancelTarget.bookingId) setQrBooking(null); await reloadBookings(); }
    catch (cancelError) { setError(cancelError instanceof Error ? cancelError.message : 'Unable to cancel booking.'); } finally { setCancelLoading(false); }
  };

  const groups: Array<[string, Booking['status']]> = [['Upcoming', 'CONFIRMED'], ['Checked In', 'CHECKED_IN'], ['Completed', 'COMPLETED'], ['Cancelled', 'CANCELLED']];
  const qrExpired = qrRemaining === 0;

  return <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
    <header><div className="flex items-center gap-2 text-indigo-600 mb-2"><CalendarDays className="w-5 h-5" /><span className="text-xs font-semibold uppercase tracking-wider">Facility access</span></div><h1 className="text-3xl sm:text-4xl font-semibold text-slate-900">Book a Facility</h1><p className="text-base text-slate-500 mt-2">Choose a campus facility and reserve an available time slot.</p></header>
    {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
    {loading ? <p className="text-sm text-slate-500">Loading facilities...</p> : <>
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">{facilities.map((facility) => <button key={facility.id} type="button" onClick={() => setSelectedFacility(facility.id)} className={`p-4 rounded-2xl border text-left transition ${selectedFacility === facility.id ? 'border-indigo-500 bg-indigo-50 text-indigo-900' : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'}`}><p className="font-semibold text-sm">{facility.name}</p><p className="text-xs mt-1 text-slate-500">{facility.nextAvailableSlot ? `Next: ${formatDate(facility.nextAvailableSlot.date)} ${formatTime(facility.nextAvailableSlot.startTime)}` : 'No open slots yet'}</p></button>)}</section>
      <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4"><label className="block text-sm font-semibold text-slate-800">Select a date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="block mt-2 rounded-xl border border-slate-200 px-3 py-2 text-sm" /></label><h2 className="text-lg font-semibold text-slate-900">Available slots</h2>{slotLoading ? <p className="text-sm text-slate-500">Loading slots...</p> : slots.length === 0 ? <p className="text-sm text-slate-500">No slots available for this date.</p> : <div className="grid sm:grid-cols-2 gap-3">{slots.map((slot) => <button key={slot.slotId} type="button" disabled={slot.status !== 'OPEN' || slot.availableCapacity < 1} onClick={() => setSelectedSlot(slot)} className={`p-4 rounded-xl border text-left ${selectedSlot?.slotId === slot.slotId ? 'border-indigo-500 bg-indigo-50' : slot.status === 'OPEN' && slot.availableCapacity > 0 ? 'border-slate-200 hover:border-indigo-300' : 'border-slate-100 bg-slate-50 opacity-60'}`}><p className="text-sm font-semibold">{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</p><p className="text-xs text-slate-500 mt-1">{slot.status === 'OPEN' ? `${slot.availableCapacity} spots available` : slot.status}</p></button>)}</div>}{selectedSlot && <button type="button" disabled={bookingLoading} onClick={() => void confirmBooking()} className="w-full sm:w-auto px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">{bookingLoading ? 'Booking...' : 'Confirm Booking'}</button>}</section>
      <section className="bg-white rounded-2xl border border-slate-200 p-5"><h2 className="text-lg font-semibold text-slate-900 mb-4">My Bookings</h2>{bookings.length === 0 ? <p className="text-sm text-slate-500">No bookings yet.</p> : <div className="max-h-[32rem] overflow-y-auto space-y-5 pr-1">{groups.map(([heading, status]) => { const grouped = bookings.filter((booking) => booking.status === status); if (!grouped.length) return null; return <div key={status}><h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{heading}</h3><div className="space-y-3">{grouped.map((booking) => <div key={booking.bookingId} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0"><div><p className="text-sm font-semibold text-slate-800">{booking.facility}</p><p className="text-xs text-slate-500 mt-1"><Clock3 className="inline w-3 h-3 mr-1" />{formatDate(booking.date)} · {formatTime(booking.startTime)} - {formatTime(booking.endTime)}</p></div><div className="flex items-center gap-3"><span className="text-xs font-semibold text-slate-500">{status.replace('_', ' ')}</span>{status === 'CONFIRMED' && <><button type="button" onClick={() => void openQr(booking)} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">Show Check-in QR</button><button type="button" onClick={() => setCancelTarget(booking)} title="Cancel booking" className="text-red-500 hover:text-red-700"><XCircle className="w-4 h-4" /></button></>}</div></div>)}</div></div>; })}</div>}</section>
    </>}
    {qrBooking && <div className="fixed inset-0 z-50 bg-slate-900/50 p-4 flex items-center justify-center"><div role="dialog" aria-modal="true" aria-labelledby="qr-title" className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl text-center relative"><button type="button" onClick={() => setQrBooking(null)} title="Close QR" className="absolute right-4 top-4 text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button><h2 id="qr-title" className="text-xl font-semibold text-slate-900">Check-in QR</h2><p className="text-sm font-semibold text-slate-700 mt-4">{qrBooking.facility}</p><p className="text-xs text-slate-500 mt-1">{formatDate(qrBooking.date)} · {formatTime(qrBooking.startTime)} - {formatTime(qrBooking.endTime)}</p>{qrLoading ? <p className="py-12 text-sm text-slate-500">Generating QR...</p> : qrExpired ? <div className="py-10 space-y-3"><p className="text-sm font-semibold text-red-600">QR expired</p><button type="button" onClick={() => void openQr(qrBooking)} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold">Generate New QR</button></div> : <><img src={qrImage || ''} alt="Secure check-in QR code" className="w-56 h-56 mx-auto mt-5" /><p className="text-sm font-semibold text-amber-700 mt-3">Valid for {String(Math.floor(qrRemaining / 60)).padStart(2, '0')}:{String(qrRemaining % 60).padStart(2, '0')}</p><p className="text-xs text-slate-500 mt-2">Show this QR to the facility admin.</p></>}</div></div>}
    {cancelTarget && <div className="fixed inset-0 z-50 bg-slate-900/50 p-4 flex items-center justify-center"><div role="dialog" aria-modal="true" className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl"><h2 className="text-xl font-semibold text-slate-900">Cancel booking?</h2><p className="text-sm text-slate-500 mt-2">Are you sure you want to cancel this booking?</p><div className="text-sm text-slate-700 mt-4 space-y-1"><p><strong>Facility:</strong> {cancelTarget.facility}</p><p><strong>Date:</strong> {formatDate(cancelTarget.date)}</p><p><strong>Time:</strong> {formatTime(cancelTarget.startTime)} - {formatTime(cancelTarget.endTime)}</p></div><div className="flex justify-end gap-3 mt-6"><button type="button" disabled={cancelLoading} onClick={() => setCancelTarget(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold">Keep Booking</button><button type="button" disabled={cancelLoading} onClick={() => void confirmCancellation()} className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold disabled:opacity-50">{cancelLoading ? 'Canceling...' : 'Cancel Booking'}</button></div></div></div>}
  </div>;
};