import { api } from './api';
import { Booking, Facility, FacilitySlot } from './bookingService';

export const adminBookingService = {
  async getFacilities(): Promise<Facility[]> { return (await api.get<Facility[]>('/facilities')).data; },
  async getBookings(facilityId: string): Promise<Booking[]> { return (await api.get<Booking[]>(`/admin/facilities/${encodeURIComponent(facilityId)}/bookings`)).data; },
  async createSlot(facilityId: string, data: { date: string; startTime: string; endTime: string; capacity: number }): Promise<FacilitySlot> { return (await api.post<FacilitySlot>(`/admin/facilities/${encodeURIComponent(facilityId)}/slots`, data)).data; },
  async closeSlot(slotId: string): Promise<FacilitySlot> { return (await api.patch<FacilitySlot>(`/admin/slots/${encodeURIComponent(slotId)}/close`, {})).data; },
  async cancelSlot(slotId: string): Promise<FacilitySlot> { return (await api.patch<FacilitySlot>(`/admin/slots/${encodeURIComponent(slotId)}/cancel`, {})).data; },
  async cancelBooking(bookingId: string): Promise<void> { await api.patch(`/admin/bookings/${encodeURIComponent(bookingId)}/cancel`, {}); },
  async verifyScannedToken(qrToken: string): Promise<{ bookingId: string; facility: string; studentName: string; date: string; startTime: string; endTime: string; checkedInAt: string }> { return (await api.post<{ bookingId: string; facility: string; studentName: string; date: string; startTime: string; endTime: string; checkedInAt: string }>('/admin/checkin/verify', { qrToken })).data; },
};