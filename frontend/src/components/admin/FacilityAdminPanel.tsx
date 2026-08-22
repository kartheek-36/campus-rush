import React, { useEffect, useState } from 'react';
import { CalendarPlus, Clock3, LockKeyhole, XCircle } from 'lucide-react';
import { adminBookingService } from '../../services/adminBookingService';
import { bookingService, Booking, Facility, FacilitySlot } from '../../services/bookingService';
import { useApp } from '../../context/AppContext';

export const FacilityAdminPanel: React.FC = () => {
  const { user } = useApp();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [facilityId, setFacilityId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [capacity, setCapacity] = useState('10');
  const [slots, setSlots] = useState<FacilitySlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFacilityData = async (id: string) => {
    if (!id) return;
    setLoading(true); setError(null);
    try {
      const [loadedSlots, loadedBookings] = await Promise.all([bookingService.getSlots(id, date), adminBookingService.getBookings(id)]);
      setSlots(loadedSlots); setBookings(loadedBookings);
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Unable to load facility data.'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    void adminBookingService.getFacilities().then((loaded) => {
      const assigned = user.adminFacilityId ? loaded.filter((facility) => facility.id === user.adminFacilityId) : loaded;
      setFacilities(assigned); setFacilityId(assigned[0]?.id || '');
    }).catch(() => setError('Unable to load facilities.')).finally(() => setLoading(false));
  }, [user.adminFacilityId]);
  useEffect(() => { if (facilityId) void loadFacilityData(facilityId); }, [facilityId, date]);

  const createSlot = async (event: React.FormEvent) => {
    event.preventDefault(); setError(null);
    try { await adminBookingService.createSlot(facilityId, { date, startTime, endTime, capacity: Number(capacity) }); await loadFacilityData(facilityId); }
    catch (slotError) { setError(slotError instanceof Error ? slotError.message : 'Unable to create slot.'); }
  };
  const updateSlot = async (slot: FacilitySlot, action: 'close' | 'cancel') => {
    try { await (action === 'close' ? adminBookingService.closeSlot(slot.slotId) : adminBookingService.cancelSlot(slot.slotId)); await loadFacilityData(facilityId); }
    catch (slotError) { setError(slotError instanceof Error ? slotError.message : 'Unable to update slot.'); }
  };

  return <section className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-card space-y-5">
    <div className="flex items-center gap-2"><CalendarPlus className="w-5 h-5 text-indigo-600" /><div><h2 className="text-lg font-bold text-slate-900">{user.adminFacilityId ? `${facilities[0]?.name || 'Facility'} administration` : 'Facility booking administration'}</h2><p className="text-xs text-slate-500">Manage slots and review bookings for the authorized facility.</p></div></div>
    {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Facility<select value={facilityId} onChange={(event) => setFacilityId(event.target.value)} className="block mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">{facilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.name}</option>)}</select></label>
    <form onSubmit={(event) => void createSlot(event)} className="grid grid-cols-2 lg:grid-cols-5 gap-3 items-end"><label className="text-xs font-semibold text-slate-600">Date<input required type="date" value={date} onChange={(event) => setDate(event.target.value)} className="block mt-1 w-full rounded-xl border border-slate-200 px-2 py-2 text-sm" /></label><label className="text-xs font-semibold text-slate-600">Start<input required type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="block mt-1 w-full rounded-xl border border-slate-200 px-2 py-2 text-sm" /></label><label className="text-xs font-semibold text-slate-600">End<input required type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="block mt-1 w-full rounded-xl border border-slate-200 px-2 py-2 text-sm" /></label><label className="text-xs font-semibold text-slate-600">Capacity<input required min="1" type="number" value={capacity} onChange={(event) => setCapacity(event.target.value)} className="block mt-1 w-full rounded-xl border border-slate-200 px-2 py-2 text-sm" /></label><button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"><CalendarPlus className="w-4 h-4" />Create slot</button></form>
    <div><h3 className="text-sm font-bold text-slate-800 mb-2">Slots</h3>{loading ? <p className="text-sm text-slate-500">Loading facility data...</p> : slots.length === 0 ? <p className="text-sm text-slate-500">No slots created for this date.</p> : <div className="space-y-2">{slots.map((slot) => <div key={slot.slotId} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3"><div><p className="text-sm font-semibold text-slate-800"><Clock3 className="inline w-4 h-4 mr-1" />{slot.startTime} - {slot.endTime}</p><p className="text-xs text-slate-500 mt-1">{slot.availableCapacity}/{slot.capacity} available · {slot.status}</p></div><div className="flex gap-2">{slot.status === 'OPEN' && <button type="button" title="Close slot" onClick={() => void updateSlot(slot, 'close')} className="text-amber-600"><LockKeyhole className="w-4 h-4" /></button>}{slot.status !== 'CANCELLED' && <button type="button" title="Cancel slot" onClick={() => void updateSlot(slot, 'cancel')} className="text-red-500"><XCircle className="w-4 h-4" /></button>}</div></div>)}</div>}</div>
    <div><h3 className="text-sm font-bold text-slate-800 mb-2">Bookings</h3>{bookings.length === 0 ? <p className="text-sm text-slate-500">No bookings for this facility.</p> : <div className="max-h-64 overflow-y-auto space-y-2 pr-1">{bookings.map((booking) => <div key={booking.bookingId} role="button" tabIndex={0} title="Open booking details" onClick={() => setSelectedBooking(selectedBooking === booking.bookingId ? null : booking.bookingId)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelectedBooking(selectedBooking === booking.bookingId ? null : booking.bookingId); }} className="rounded-xl border border-slate-100 p-3 text-sm cursor-pointer transition-colors hover:border-indigo-200 hover:bg-indigo-50/40"><div className="flex items-center justify-between gap-3"><div><p>{booking.date} · {booking.startTime} - {booking.endTime}</p></div><span className="text-xs font-semibold text-slate-500">{booking.status.replace('_', ' ')}</span></div>{selectedBooking === booking.bookingId && <div className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-500"><p>Booking ID: {booking.bookingId}</p><p>Facility: {booking.facility}</p><p>Status: {booking.status.replace('_', ' ')}</p></div>}</div>)}</div>}</div>
  </section>;
};