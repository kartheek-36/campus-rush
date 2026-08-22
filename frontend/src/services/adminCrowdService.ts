import { CrowdLevel, RawCrowdReport } from '../types';
import { api } from './api';

export const adminCrowdService = {
  async getMetrics(): Promise<AdminMetrics> { return (await api.get<AdminMetrics>('/crowd/admin/metrics')).data; },
  async updateCrowd(locationId: string, crowdLevel: Exclude<CrowdLevel, 'UNKNOWN'>): Promise<RawCrowdReport> {
    return (await api.post<RawCrowdReport>(`/crowd/admin/${encodeURIComponent(locationId)}`, { crowdLevel })).data;
  },
};

export interface AdminMetrics {
  totalLocations: number;
  reportsPastHour: number;
  unknownCount: number;
  rushCount: number;
  recentReports: RawCrowdReport[];
}