import { api } from './api';

export interface Facility { id: string; name: string; type: string; locationId: string; status: 'ACTIVE' | 'INACTIVE'; nextAvailableSlot?: Pick<FacilitySlot, 'slotId' | 'date' | 'startTime' | 'endTime' | 'availableCapacity'> | null; }
export interface FacilitySlot { slotId: string; date: string; startTime: string; endTime: string; capacity: number; availableCapacity: number; status: 'OPEN' | 'FULL' | 'CLOSED' | 'CANCELLED'; }
export type BookingStatus = 'CONFIRMED' | 'CHECKED_IN' | 'CANCELLED' | 'COMPLETED';
export interface Booking { bookingId: string; facility: string; date: string; startTime: string; endTime: string; status: BookingStatus; createdAt?: string; bookingExpiresAt?: string; verified?: boolean; }
export interface CheckinQr { qrToken: string; expiresAt: string; validForSeconds: number; }

export const bookingService = {
  async getFacilities(): Promise<Facility[]> { return (await api.get<Facility[]>('/facilities')).data; },
  async getSlots(facilityId: string, date: string): Promise<FacilitySlot[]> { return (await api.get<FacilitySlot[]>(`/facilities/${encodeURIComponent(facilityId)}/slots?date=${encodeURIComponent(date)}`)).data; },
  async createBooking(facilityId: string, slotId: string): Promise<Booking> { return (await api.post<Booking>('/bookings', { facilityId, slotId })).data; },
  async getMyBookings(): Promise<Booking[]> { return (await api.get<Booking[]>('/bookings/my')).data; },
  async createCheckinQr(bookingId: string): Promise<CheckinQr> { return (await api.post<CheckinQr>(`/bookings/${encodeURIComponent(bookingId)}/checkin-qr`, {})).data; },
  async cancelBooking(bookingId: string): Promise<void> { await api.patch(`/bookings/${encodeURIComponent(bookingId)}/cancel`, {}); },
};