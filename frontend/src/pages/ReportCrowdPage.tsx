import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { CrowdLevel, CrowdReportRequest } from '../types';
import { crowdService } from '../services/crowdService';
import { 
  PlusCircle, 
  MapPin, 
  Send, 
  CheckCircle2, 
  Sparkles, 
  Smile, 
  Coffee, 
  Meh, 
  Flame, 
  History 
} from 'lucide-react';

export const ReportCrowdPage: React.FC = () => {
  const { locations, user, navigateTo } = useApp();
  const [selectedLocId, setSelectedLocId] = useState<string>(locations[0]?.id || '');
  const [selectedLevel, setSelectedLevel] = useState<Exclude<CrowdLevel, 'UNKNOWN'> | ''>('');
  const [note, setNote] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [recentReports, setRecentReports] = useState<import('../types').RawCrowdReport[]>([]);

  useEffect(() => {
    void crowdService.getCrowdReports().then(setRecentReports).catch(() => setRecentReports([]));
  }, [isSubmitted]);

  useEffect(() => {
    if (locations.length > 0 && (!selectedLocId || !locations.some((location) => location.id === selectedLocId))) {
      setSelectedLocId(locations[0].id);
    }
  }, [locations, selectedLocId]);

  const crowdOptions: Array<{
    level: Exclude<CrowdLevel, 'UNKNOWN'>;
    label: string;
    description: string;
    icon: React.FC<{ className?: string }>;
    color: string;
  }> = [
    {
      level: 'EMPTY',
      label: 'Empty',
      description: 'Virtually no one here, plenty of open seats',
      icon: Sparkles,
      color: 'bg-emerald-50 text-emerald-700',
    },
    {
      level: 'LOW',
      label: 'Low',
      description: 'Quiet, plenty of available space & fast counters',
      icon: Smile,
      color: 'bg-emerald-50 text-emerald-800',
    },
    {
      level: 'MEDIUM',
      label: 'Medium',
      description: 'Moderate buzz, normal line, few spots available',
      icon: Coffee,
      color: 'bg-amber-50 text-amber-800',
    },
    {
      level: 'HIGH',
      label: 'High',
      description: 'Busy, limited seating, noticeable line at counter',
      icon: Meh,
      color: 'bg-orange-50 text-orange-800',
    },
    {
      level: 'VERY_HIGH',
      label: 'Very High',
      description: 'Peak rush, packed capacity, long wait times',
      icon: Flame,
      color: 'bg-rose-50 text-rose-800',
    },
  ];

  const quickTags = [
    'Quick service',
    'Long queue',
    'Few seats left',
    'Open power plugs',
    'Printer operational',
    'Very noisy',
    'Pin-drop silent',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocId || !selectedLevel) {
      setSubmitError('Select a location and crowd level before submitting.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    try {
      const report: CrowdReportRequest = { locationId: selectedLocId, crowdLevel: selectedLevel };
      await crowdService.submitCrowdReport(report);
      setIsSubmitted(true);
    } catch {
      setSubmitError('Unable to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setNote('');
    setSelectedTag('');
    setSelectedLevel('');
    setSubmitError('');
  };

  const selectedLocation = locations.find((l) => l.id === selectedLocId);
  const userRecentReports = recentReports.filter((report) => report.userId === user.id);
  const relativeTime = (timestamp: string) => {
    const minutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
    if (minutes <= 0) return 'just now';
    if (minutes === 1) return '1 min ago';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    return hours === 1 ? '1 hr ago' : `${hours} hrs ago`;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-card">
        <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
          <PlusCircle className="w-4 h-4" />
          <span>Real-time Crowd Reporter</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Report Live Campus Crowd
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Provide instant crowd level observations to help fellow students save time and avoid long queues.
        </p>
      </div>

      {/* Main Report Box */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-8">
        {isSubmitted ? (
          <div className="text-center py-8 space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">Report submitted</h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Thank you for helping improve campus crowd information.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 max-w-sm mx-auto text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Location:</span>
                <span className="font-bold text-slate-800">{selectedLocation?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reported Crowd:</span>
                <span className="font-bold text-indigo-600">{selectedLevel}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition"
              >
                Submit Another Report
              </button>
              <button
                type="button"
                onClick={() => navigateTo('explore')}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition"
              >
                View Live Directory
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Location Picker */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                1. Select Location
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedLocId}
                  onChange={(e) => setSelectedLocId(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-sm"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.building}) • {loc.category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Crowd Level Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                2. Select Crowd Level
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {crowdOptions.map((opt) => {
                  const isChecked = selectedLevel === opt.level;
                  const Icon = opt.icon;
                  return (
                    <label
                      key={opt.level}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                        isChecked
                          ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="pageCrowdLevel"
                        value={opt.level}
                        checked={isChecked}
                        onChange={() => setSelectedLevel(opt.level)}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${opt.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">{opt.label}</span>
                          <span className="text-[11px] text-slate-500 leading-tight block">{opt.description}</span>
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ml-2 ${
                          isChecked ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                        }`}
                      >
                        {isChecked && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Quick Status Tags */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                3. Quick Tags (Optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {quickTags.map((tag) => {
                  const isSelected = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTag(isSelected ? '' : tag)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Observation Note */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                4. Additional Notes (Optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Counter 2 is fastest, ground floor tables are fully occupied..."
                rows={2}
                className="w-full p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit report'}</span>
            </button>
            {submitError && <p role="alert" className="text-sm text-red-600 text-center">{submitError}</p>}
          </form>
        )}
      </div>

      {/* User Submission History */}
      {userRecentReports.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Your Recent Contributions</h2>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              {user.reputationPoints} Karma
            </span>
          </div>

          <div className="space-y-2">
            {userRecentReports.slice(0, 4).map((rep) => {
              const loc = locations.find((l) => l.id === rep.locationId);
              return (
                <div
                  key={rep.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-800">{loc?.name || 'Campus Spot'}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Reported {relativeTime(rep.createdAt)}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800">
                    {rep.crowdLevel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
