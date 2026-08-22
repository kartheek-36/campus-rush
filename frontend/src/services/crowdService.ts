import { BestTimeResponse, CrowdMapItem, CrowdReport, CrowdEstimate, CrowdLevel, ConfidenceLevel, CrowdReportRequest, RawCrowdReport, CrowdEstimateResponse } from '../types';
import { locationService } from './locationService';
import { api } from './api';

class CrowdService {
  private reports: CrowdReport[] = [];

  public async submitCrowdReport(report: CrowdReportRequest): Promise<RawCrowdReport> {
    const response = await api.post<RawCrowdReport>('/crowd/report', report);
    return response.data;
  }

  public async getCrowdReports(): Promise<RawCrowdReport[]> {
    const response = await api.get<RawCrowdReport[]>('/crowd/reports');
    return response.data;
  }

  public async getCrowdMap(): Promise<CrowdMapItem[]> {
    return (await api.get<CrowdMapItem[]>('/location/crowd-map')).data;
  }

  public async getRecentCrowdReports(locationId: string): Promise<RawCrowdReport[]> {
    const response = await api.get<RawCrowdReport[]>(`/crowd/${encodeURIComponent(locationId)}/recent`);
    return response.data;
  }

  public async getCrowdHistory(locationId: string): Promise<Array<{ crowdLevel: Exclude<CrowdLevel, 'UNKNOWN'>; reportedAt: string }>> {
    const response = await api.get<Array<{ crowdLevel: Exclude<CrowdLevel, 'UNKNOWN'>; reportedAt: string }>>(`/crowd/${encodeURIComponent(locationId)}/history`);
    return response.data;
  }

  public async getCrowdEstimate(locationId: string): Promise<CrowdEstimateResponse> {
    const response = await api.get<CrowdEstimateResponse>(`/crowd/${encodeURIComponent(locationId)}`);
    return response.data;
  }

  public async getBestTime(locationId: string): Promise<BestTimeResponse> {
    const response = await api.get<BestTimeResponse>(`/recommendations/best-time/${encodeURIComponent(locationId)}`);
    return response.data;
  }

  public getReports(locationId?: string): CrowdReport[] {
    if (locationId) {
      return this.reports
        .filter((r) => r.locationId === locationId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    return [...this.reports].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public getReportsByUser(userName: string): CrowdReport[] {
    return this.reports
      .filter((r) => r.reportedBy.toLowerCase() === userName.toLowerCase())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public submitReport(
    locationId: string,
    crowdLevel: CrowdLevel,
    reportedBy: string,
    note?: string,
    tag?: string
  ): { report: CrowdReport; updatedEstimate: CrowdEstimate } {
    const newReport: CrowdReport = {
      id: `rep-${Date.now()}`,
      locationId,
      crowdLevel,
      timestamp: new Date().toISOString(),
      reportedBy,
      note,
      tag,
    };

    this.reports.unshift(newReport);

    const updatedEstimate = this.calculateEstimateForLocation(locationId);
    locationService.updateLocationCrowdEstimate(locationId, updatedEstimate);

    return { report: newReport, updatedEstimate };
  }

  public calculateEstimateForLocation(locationId: string): CrowdEstimate {
    const locReports = this.getReports(locationId);

    // Filter reports from the last 2 hours
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    const recentReports = locReports.filter(
      (r) => new Date(r.timestamp).getTime() > twoHoursAgo
    );

    if (recentReports.length === 0) {
      return {
        locationId,
        currentCrowd: 'UNKNOWN',
        confidence: 'NONE',
        lastUpdated: null,
        reportCount: 0,
        expectedWaitMinutes: null,
      };
    }

    const latestReport = recentReports[0];
    const mostRecentCrowd = latestReport.crowdLevel;

    // Confidence derived from number of reports within 2 hours
    let confidence: ConfidenceLevel = 'LOW';
    if (recentReports.length >= 5) {
      confidence = 'HIGH';
    } else if (recentReports.length >= 2) {
      confidence = 'MEDIUM';
    }

    const timeDiffMinutes = Math.floor(
      (Date.now() - new Date(latestReport.timestamp).getTime()) / (60 * 1000)
    );
    const lastUpdatedText = timeDiffMinutes <= 1 ? 'Just now' : `${timeDiffMinutes} mins ago`;

    return {
      locationId,
      currentCrowd: mostRecentCrowd,
      confidence,
      lastUpdated: lastUpdatedText,
      reportCount: recentReports.length,
      expectedWaitMinutes: null,
    };
  }

  public getAdminStats() {
    const allLocations = locationService.filterLocations();
    const totalLocations = allLocations.length;
    const totalReports = this.reports.length;
    
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const reportsPastHour = this.reports.filter(
      (r) => new Date(r.timestamp).getTime() > oneHourAgo
    ).length;

    const unknownCount = allLocations.filter(
      (l) => l.crowdEstimate?.currentCrowd === 'UNKNOWN' || !l.crowdEstimate
    ).length;

    const rushCount = allLocations.filter(
      (l) => l.crowdEstimate?.currentCrowd === 'HIGH' || l.crowdEstimate?.currentCrowd === 'VERY_HIGH'
    ).length;

    return {
      totalLocations,
      totalReports,
      reportsPastHour,
      unknownCount,
      rushCount,
    };
  }
}

export const crowdService = new CrowdService();
