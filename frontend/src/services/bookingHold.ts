export interface BookingHold {
  bookingId: string;
  facility: string;
  date: string;
  startTime: string;
  endTime: string;
  verificationToken: string;
  verificationExpiresAt: string;
}

const HOLD_KEY = 'campus-rush-booking-hold';
const HOLD_EVENT = 'campus-rush-booking-hold-changed';

export const bookingHold = {
  get(): BookingHold | null {
    try {
      const value = window.localStorage.getItem(HOLD_KEY);
      return value ? JSON.parse(value) as BookingHold : null;
    } catch {
      return null;
    }
  },
  save(hold: BookingHold): void {
    window.localStorage.setItem(HOLD_KEY, JSON.stringify(hold));
    window.dispatchEvent(new Event(HOLD_EVENT));
  },
  clear(): void {
    window.localStorage.removeItem(HOLD_KEY);
    window.dispatchEvent(new Event(HOLD_EVENT));
  },
  eventName: HOLD_EVENT,
};