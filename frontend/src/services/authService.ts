import { User } from '../types';
import { DEFAULT_USER, ADMIN_USER } from '../data/mockCampusData';
import { api } from './api';

const TOKEN_KEY = 'campus-rush-token';

interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'LIBRARY_ADMIN' | 'CAFETERIA_ADMIN' | 'VOLLEYBALL_ADMIN' | 'GYM_ADMIN' | 'SUPER_ADMIN' | 'ADMIN';
  adminFacilityId?: string | null;
  reportsSubmitted?: number;
  reputationPoints?: number;
  joinedDate?: string;
}

const facilityAdminIds: Partial<Record<ApiUser['role'], string>> = {
  LIBRARY_ADMIN: 'library',
  CAFETERIA_ADMIN: 'cafeteria',
  VOLLEYBALL_ADMIN: 'volleyball-court',
  GYM_ADMIN: 'gym',
};

const mapUser = (user: ApiUser): User => ({
  ...(user.role === 'ADMIN' ? ADMIN_USER : DEFAULT_USER),
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role === 'STUDENT' ? 'student' : 'admin',
  accessRole: user.role,
  adminFacilityId: user.adminFacilityId ?? facilityAdminIds[user.role] ?? null,
  reportsSubmitted: user.reportsSubmitted ?? 0,
  reputationPoints: user.reputationPoints ?? 0,
  joinedDate: user.joinedDate || 'Recently',
});

class AuthService {
  private currentUser: User = DEFAULT_USER;
  private listeners: Array<(user: User | null) => void> = [];
  private authenticated = false;

  public getCurrentUser(): User {
    return this.currentUser;
  }

  public setCurrentUser(user: User): void {
    this.currentUser = user;
    this.authenticated = true;
    this.notify();
  }

  public isAuthenticated(): boolean {
    return this.authenticated;
  }

  public async login(email: string, password: string): Promise<User> {
    const response = await api.post<{ token: string; user: ApiUser }>('/auth/login', { email, password });
    window.localStorage.setItem(TOKEN_KEY, response.data.token);
    const user = mapUser(response.data.user);
    this.currentUser = user;
    this.authenticated = true;
    this.notify();
    return user;
  }

  public async signup(name: string, email: string, password: string): Promise<User> {
    const response = await api.post<{ user: ApiUser }>('/auth/signup', { name, email, password });
    return mapUser(response.data.user);
  }

  public async restoreSession(): Promise<User | null> {
    if (!window.localStorage.getItem(TOKEN_KEY)) return null;
    try {
      const response = await api.get<{ user: ApiUser }>('/auth/me');
      const user = mapUser(response.data.user);
      this.currentUser = user;
      this.authenticated = true;
      this.notify();
      return user;
    } catch {
      this.logout();
      return null;
    }
  }

  public loginAsStudent(): User {
    this.currentUser = { ...DEFAULT_USER };
    this.authenticated = true;
    this.notify();
    return this.currentUser;
  }

  public loginAsAdmin(): User {
    this.currentUser = { ...ADMIN_USER };
    this.authenticated = true;
    this.notify();
    return this.currentUser;
  }

  public loginWithCredentials(studentId: string, name?: string): User {
    this.currentUser = {
      ...DEFAULT_USER,
      studentId: studentId.toUpperCase(),
      name: name || (studentId.startsWith('FAC') ? 'Dr. Faculty User' : 'Student User'),
      role: studentId.startsWith('FAC') || studentId.toLowerCase().includes('admin') ? 'admin' : 'student',
    };
    this.authenticated = true;
    this.notify();
    return this.currentUser;
  }

  public logout(): void {
    window.localStorage.removeItem(TOKEN_KEY);
    this.authenticated = false;
    this.notify();
  }

  public incrementUserReportCount(): void {
    this.currentUser = {
      ...this.currentUser,
      reportsSubmitted: this.currentUser.reportsSubmitted + 1,
      reputationPoints: this.currentUser.reputationPoints + 20, // +20 points per community crowd report
    };
    this.notify();
  }

  public subscribe(callback: (user: User | null) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notify(): void {
    this.listeners.forEach((cb) => cb(this.currentUser));
  }
}

export const authService = new AuthService();
