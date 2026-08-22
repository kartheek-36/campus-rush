import React, { useEffect, useState } from 'react';
import { CrowdBadge } from './CrowdBadge';
import { crowdService } from '../../services/crowdService';
import { RawCrowdReport } from '../../types';

interface RecentCrowdReportsProps {
  locationId: string;
  lastReportAt?: string | null;
  onReport?: () => void;
}

const relativeTime = (timestamp: string) => {
  const minutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
  if (minutes <= 0) return 'just now';
  return `${minutes} min ago`;
};

export const RecentCrowdReports: React.FC<RecentCrowdReportsProps> = ({ locationId, lastReportAt, onReport }) => {
  const [reports, setReports] = useState<RawCrowdReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void crowdService.getRecentCrowdReports(locationId).then(setReports).catch(() => setReports([])).finally(() => setLoading(false));
  }, [locationId]);

  if (loading) return <p className="text-sm text-slate-500">Loading recent reports...</p>;
  if (!reports.length) return <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200"><h4 className="text-sm font-bold text-slate-700">No recent data</h4><p className="text-xs text-slate-500 mt-1">There are no crowd reports for this facility in the last 30 minutes.</p><p className="text-xs text-slate-500 mt-1">{lastReportAt ? `Last report: ${new Date(lastReportAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}` : 'No reports have been submitted yet.'}</p>{onReport && <button type="button" onClick={onReport} className="mt-4 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold">Submit First Report</button>}</div>;
  return <div className="space-y-2.5">{reports.map((report) => <div key={report.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3"><div><CrowdBadge level={report.crowdLevel} size="sm" /><p className="text-[11px] text-slate-400 mt-1">Reported {relativeTime(report.createdAt)}</p></div></div>)}</div>;
};