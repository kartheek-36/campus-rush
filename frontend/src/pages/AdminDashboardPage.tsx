import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CrowdLevel, ConfidenceLevel, Location } from '../types';
import { crowdService } from '../services/crowdService';
import { locationService } from '../services/locationService';
import { CrowdBadge } from '../components/common/CrowdBadge';
import { ConfidenceBadge } from '../components/common/ConfidenceBadge';
import { 
  ShieldCheck, 
  Activity, 
  AlertTriangle, 
  Building2, 
  Radio, 
  RefreshCw, 
  Edit3, 
  Check, 
  X,
  Clock,
  Server
} from 'lucide-react';
import { FacilityAdminPanel } from '../components/admin/FacilityAdminPanel';
import { AdminQrScanner } from '../components/admin/AdminQrScanner';
import { adminCrowdService, AdminMetrics } from '../services/adminCrowdService';

export const AdminDashboardPage: React.FC = () => {
  const { user, locations, refreshData, addToast } = useApp();
  const [editingLocId, setEditingLocId] = useState<string | null>(null);
  const [overrideCrowd, setOverrideCrowd] = useState<CrowdLevel>('LOW');
  const [overrideConfidence, setOverrideConfidence] = useState<ConfidenceLevel>('HIGH');
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);

  const loadMetrics = async () => {
    try {
      setMetrics(await adminCrowdService.getMetrics());
    } catch {
      setMetrics(null);
    }
  };

  useEffect(() => {
    void loadMetrics();
  }, []);

  const stats = useMemo(() => {
    return metrics || crowdService.getAdminStats();
  }, [locations, metrics]);

  const recentReports = useMemo(() => {
    return crowdService.getReports().slice(0, 8);
  }, [locations]);

  const handleStartEdit = (loc: Location) => {
    setEditingLocId(loc.id);
    setOverrideCrowd(loc.crowdEstimate?.currentCrowd || 'UNKNOWN');
    setOverrideConfidence(loc.crowdEstimate?.confidence || 'MEDIUM');
  };

  const handleSaveOverride = async (locationId: string) => {
    const existing = locationService.getLocationById(locationId);
    if (!existing) return;

    try {
      await adminCrowdService.updateCrowd(locationId, overrideCrowd === 'UNKNOWN' ? 'MEDIUM' : overrideCrowd);
      refreshData();
      setEditingLocId(null);
      addToast({ title: 'Facility Status Updated', message: `${existing.name} was saved to PostgreSQL.`, type: 'success' });
    } catch (error) {
      addToast({ title: 'Update failed', message: error instanceof Error ? error.message : 'Unable to save crowd status.', type: 'error' });
    }
  };

  if (user.adminFacilityId) {
    return (
      <div className="max-w-6xl mx-auto animate-fade-in">
        <AdminQrScanner />
        <FacilityAdminPanel />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <AdminQrScanner />
      <FacilityAdminPanel />
      {/* Admin Header */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-elevation space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Campus Operations Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {user.accessRole === 'SUPER_ADMIN' ? 'Super Admin & Facility Oversight' : 'Admin & Facility Oversight'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Monitor crowd metrics across all campus blocks, verify data confidence, and manage facilities.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                refreshData();
                void loadMetrics();
                addToast({ title: 'Data Refreshed', message: 'Loaded latest metrics.', type: 'info' });
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Metrics</span>
            </button>
          </div>
        </div>

        {/* Status Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" /> Monitored Spots
            </span>
            <p className="text-2xl font-black text-white mt-1">{stats.totalLocations}</p>
            <span className="text-[10px] text-slate-400">100% campus facilities</span>
          </div>

          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" /> Recent Reports
            </span>
            <p className="text-2xl font-black text-emerald-400 mt-1">{stats.reportsPastHour}</p>
            <span className="text-[10px] text-slate-400">Past 60 minutes</span>
          </div>

          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Unknown State
            </span>
            <p className="text-2xl font-black text-amber-400 mt-1">{stats.unknownCount}</p>
            <span className="text-[10px] text-slate-400">Needs student reports</span>
          </div>

          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-rose-400" /> Rush Warnings
            </span>
            <p className="text-2xl font-black text-rose-400 mt-1">{stats.rushCount}</p>
            <span className="text-[10px] text-slate-400">High / Peak traffic spots</span>
          </div>
        </div>
      </div>

      {/* Microservice & Subsystem Readiness Grid */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-card space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Server className="w-4 h-4 text-indigo-600" />
          <span>System & Microservices Connectivity</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-900">Frontend Service Layer</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                ACTIVE
              </span>
            </div>
            <p className="text-slate-600 text-[11px]">
              React + Tailwind CSS architecture with typed contracts for all modules.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">ai-service / ML Engine</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-200 text-slate-700">
                STUBBED (AI READY)
              </span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Prediction service contracts return honest unavailable states until Python API connects.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Blockchain / Web3</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-200 text-slate-700">
                FUTURE MODULE
              </span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Student karma rewards designed for EVM smart contract tokenization.
            </p>
          </div>
        </div>
      </div>

      {/* Facilities Management & Verification Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Facility Crowd Status Management</h2>
            <p className="text-xs text-slate-500">
              Review live crowd levels and perform manual administrative verifications when required.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="pb-3 pr-4">Location</th>
                <th className="pb-3 pr-4">Category</th>
                <th className="pb-3 pr-4">Crowd Level</th>
                <th className="pb-3 pr-4">Confidence</th>
                <th className="pb-3 pr-4">Last Updated</th>
                <th className="pb-3 text-right">Admin Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {locations.map((loc) => {
                const isEditing = editingLocId === loc.id;
                const crowd = loc.crowdEstimate?.currentCrowd || 'UNKNOWN';
                const conf = loc.crowdEstimate?.confidence || 'NONE';

                return (
                  <tr key={loc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 pr-4">
                      <span className="font-bold text-slate-900 block">{loc.name}</span>
                      <span className="text-[11px] text-slate-400">{loc.building}</span>
                    </td>

                    <td className="py-3.5 pr-4">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 rounded-md text-[10px] font-bold text-slate-600">
                        {loc.category}
                      </span>
                    </td>

                    <td className="py-3.5 pr-4">
                      {isEditing ? (
                        <select
                          value={overrideCrowd}
                          onChange={(e) => setOverrideCrowd(e.target.value as any)}
                          className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                        >
                          <option value="EMPTY">EMPTY</option>
                          <option value="LOW">LOW</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="HIGH">HIGH</option>
                          <option value="VERY_HIGH">VERY HIGH</option>
                          <option value="UNKNOWN">UNKNOWN</option>
                        </select>
                      ) : (
                        <CrowdBadge level={crowd} size="sm" />
                      )}
                    </td>

                    <td className="py-3.5 pr-4">
                      {isEditing ? (
                        <select
                          value={overrideConfidence}
                          onChange={(e) => setOverrideConfidence(e.target.value as any)}
                          className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                        >
                          <option value="HIGH">HIGH</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="LOW">LOW</option>
                          <option value="NONE">NONE</option>
                        </select>
                      ) : (
                        <ConfidenceBadge confidence={conf} reportCount={loc.crowdEstimate?.reportCount} />
                      )}
                    </td>

                    <td className="py-3.5 pr-4 text-slate-500 text-[11px]">
                      {loc.crowdEstimate?.lastUpdated || <span className="italic text-slate-400">No reports</span>}
                    </td>

                    <td className="py-3.5 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSaveOverride(loc.id)}
                            className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
                            title="Save Status Override"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingLocId(null)}
                            className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(loc)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-semibold transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Verify</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Moderation Stream */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Live Campus Report Stream</h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">Past community submissions</span>
        </div>

        <div className="space-y-2">
          {recentReports.map((report) => {
            const loc = locations.find((l) => l.id === report.locationId);
            return (
              <div
                key={report.id}
                className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{report.reportedBy}</span>
                    <span className="text-slate-400">reported</span>
                    <span className="font-bold text-indigo-700">{loc?.name || 'Facility'}</span>
                    <span className="text-[10px] text-slate-400">
                      ({new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                    </span>
                  </div>
                  {report.note && (
                    <p className="text-[11px] text-slate-500 italic">"{report.note}"</p>
                  )}
                </div>

                <CrowdBadge level={report.crowdLevel} size="sm" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
