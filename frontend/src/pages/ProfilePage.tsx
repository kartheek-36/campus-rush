import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { crowdService } from '../services/crowdService';
import { locationService } from '../services/locationService';
import { 
  Award, 
  Send, 
  MapPin, 
  ShieldCheck, 
  GraduationCap, 
  Calendar, 
  CheckCircle2, 
  History, 
  LogOut,
  Sparkles,
  Zap
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { 
    user, 
    origin, 
    setOrigin, 
    loginAsStudent, 
    loginAsAdmin, 
    logout, 
    locations 
  } = useApp();

  const [userReports, setUserReports] = useState<ReturnType<typeof crowdService.getReportsByUser>>([]);
  const [reportsLoading, setReportsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void crowdService.getCrowdReports()
      .then((reports) => {
        if (!cancelled) setUserReports(reports.filter((report) => report.userId === user.id).map((report) => ({
          id: report.id,
          userId: report.userId,
          locationId: report.locationId,
          crowdLevel: report.crowdLevel,
          timestamp: report.createdAt,
          reportedBy: user.name,
        })));
      })
      .catch(() => { if (!cancelled) setUserReports([]); })
      .finally(() => { if (!cancelled) setReportsLoading(false); });
    return () => { cancelled = true; };
  }, [user.id, user.name]);
  const origins = locationService.getOrigins();

  const badges = [
    { title: 'Campus Scout', desc: '10+ reports submitted', unlocked: user.reportsSubmitted >= 10, icon: Sparkles },
    { title: 'Rush Buster', desc: 'Reported peak rush accurately', unlocked: true, icon: Zap },
    { title: 'Top Contributor', desc: '200+ Karma points', unlocked: user.reputationPoints >= 200, icon: Award },
    { title: 'Verified Student', desc: 'University email connected', unlocked: true, icon: CheckCircle2 },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl font-black shadow-md">
              {user.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">{user.name}</h1>
                <span
                  className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                    user.role === 'admin'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-indigo-100 text-indigo-800'
                  }`}
                >
                  {user.role === 'admin' ? '🛡️ Campus Admin' : '🎓 Student'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {user.studentId} • {user.department}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Send className="w-3.5 h-3.5 text-indigo-600" /> Reports Given
            </span>
            <p className="text-2xl font-black text-slate-900 mt-1">{userReports.length}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-emerald-600" /> Karma Points
            </span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{userReports.length * 20}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Member Since
            </span>
            <p className="text-sm font-bold text-slate-800 mt-2">{user.joinedDate}</p>
          </div>
        </div>
      </div>

      {/* Preferences & Quick Account Switcher */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Preferred Campus Origin */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Default Origin Landmark</h2>
          </div>
          <p className="text-xs text-slate-500">
            Choose your primary building. Distance calculations default to this landmark.
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {origins.map((orig) => {
              const isSelected = origin === orig;
              return (
                <button
                  key={orig}
                  type="button"
                  onClick={() => setOrigin(orig)}
                  className={`p-2.5 rounded-xl text-xs font-semibold border text-left transition ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-bold'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {orig}
                </button>
              );
            })}
          </div>
        </div>

        {/* Demo Role Switcher */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <h2 className="text-base font-bold text-slate-900">Demo Role Switcher</h2>
          </div>
          <p className="text-xs text-slate-500">
            Switch between demo personas to test student features and administrative privileges.
          </p>

          <div className="space-y-2 pt-1">
            <button
              onClick={loginAsStudent}
              className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition ${
                user.role === 'student'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <span>Alex Rivera (Student Account)</span>
              </div>
              {user.role === 'student' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
            </button>

            <button
              onClick={loginAsAdmin}
              className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition ${
                user.role === 'admin'
                  ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Prof. Sarah Jenkins (Admin Console)</span>
              </div>
              {user.role === 'admin' && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
            </button>
          </div>
        </div>

      </div>

      {/* Badges Earned */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-card space-y-4">
        <h2 className="text-base font-bold text-slate-900">Community Badges & Honors</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {badges.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                className={`p-4 rounded-2xl border ${
                  b.unlocked
                    ? 'bg-indigo-50/40 border-indigo-200 text-slate-900'
                    : 'bg-slate-50 border-slate-200 opacity-50'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-white shadow-xs flex items-center justify-center text-indigo-600 mb-2">
                  <Icon className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold">{b.title}</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">{b.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* User Submission Log */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Your Activity Feed</h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">{userReports.length} reports logged</span>
        </div>

        {reportsLoading ? (
          <p className="text-xs text-slate-500 italic py-4">Loading your reports...</p>
        ) : userReports.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-4">No reports recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {userReports.map((r) => {
              const loc = locations.find((l) => l.id === r.locationId);
              return (
                <div
                  key={r.id}
                  className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div>
                    <h4 className="font-bold text-slate-800">{loc?.name || 'Campus Location'}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {new Date(r.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      {r.tag && ` • Tag: ${r.tag}`}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800">
                    {r.crowdLevel}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
