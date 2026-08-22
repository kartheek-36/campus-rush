import React, { useState, useEffect } from 'react';
import { CrowdLevel, CrowdReportRequest } from '../../types';
import { useApp } from '../../context/AppContext';
import { crowdService } from '../../services/crowdService';
import { 
  X, 
  MapPin, 
  Send, 
  CheckCircle2, 
  Users, 
  Sparkles,
  Smile,
  Meh,
  Flame,
  Coffee
} from 'lucide-react';

interface ReportCrowdModalProps {
  initialLocationId?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportCrowdModal: React.FC<ReportCrowdModalProps> = ({
  initialLocationId,
  isOpen,
  onClose,
}) => {
  const { locations, refreshData } = useApp();
  const [selectedLocId, setSelectedLocId] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<Exclude<CrowdLevel, 'UNKNOWN'> | ''>('');
  const [note, setNote] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (initialLocationId && locations.some((location) => location.id === initialLocationId)) {
      setSelectedLocId(initialLocationId);
    } else if (locations.length > 0 && (!selectedLocId || !locations.some((location) => location.id === selectedLocId))) {
      setSelectedLocId(locations[0].id);
    }
  }, [initialLocationId, locations]);

  if (!isOpen) return null;

  const crowdOptions: Array<{
    level: Exclude<CrowdLevel, 'UNKNOWN'>;
    label: string;
    description: string;
    icon: React.FC<{ className?: string }>;
    color: string;
    border: string;
  }> = [
    {
      level: 'EMPTY',
      label: 'Empty',
      description: 'Virtually no one here, tons of open space',
      icon: Sparkles,
      color: 'bg-emerald-50 text-emerald-700',
      border: 'border-emerald-300 peer-checked:border-emerald-600 peer-checked:bg-emerald-50',
    },
    {
      level: 'LOW',
      label: 'Low',
      description: 'Quiet, plenty of available seats / counters',
      icon: Smile,
      color: 'bg-emerald-50 text-emerald-800',
      border: 'border-emerald-300 peer-checked:border-emerald-600 peer-checked:bg-emerald-50',
    },
    {
      level: 'MEDIUM',
      label: 'Medium',
      description: 'Moderate buzz, few open spots, normal line',
      icon: Coffee,
      color: 'bg-amber-50 text-amber-800',
      border: 'border-amber-300 peer-checked:border-amber-600 peer-checked:bg-amber-50',
    },
    {
      level: 'HIGH',
      label: 'High',
      description: 'Busy, limited seating, noticeable queue',
      icon: Meh,
      color: 'bg-orange-50 text-orange-800',
      border: 'border-orange-300 peer-checked:border-orange-600 peer-checked:bg-orange-50',
    },
    {
      level: 'VERY_HIGH',
      label: 'Very High',
      description: 'Peak rush, long wait, packed to capacity',
      icon: Flame,
      color: 'bg-rose-50 text-rose-800',
      border: 'border-rose-300 peer-checked:border-rose-600 peer-checked:bg-rose-50',
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
      refreshData();
      window.dispatchEvent(new Event('crowd-report-submitted'));
      setIsSubmitted(true);
    } catch {
      setSubmitError('Unable to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setNote('');
    setSelectedTag('');
    setSelectedLevel('');
    setSubmitError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#5B5CE2]" />
            <h3 className="text-base font-semibold text-slate-900">Report crowd</h3>
          </div>

          <button
            onClick={handleResetAndClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {isSubmitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm animate-bounce-short">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h4 className="text-lg font-bold text-slate-900">Report submitted</h4>
            <p className="text-sm text-slate-600 max-w-xs mx-auto">
              Thank you for helping improve campus crowd information.
            </p>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Reported Status:</span>
                <span className="font-bold text-indigo-600">{selectedLevel}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetAndClose}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Location Select */}
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1.5">
                Where are you?
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedLocId}
                  onChange={(e) => setSelectedLocId(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-sm"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Crowd Level Radio Options */}
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-2">
                How crowded is this place?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {crowdOptions.map((opt) => {
                  const isChecked = selectedLevel === opt.level;
                  const Icon = opt.icon;
                  return (
                    <label
                      key={opt.level}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="crowdLevel"
                        value={opt.level}
                        checked={isChecked}
                        onChange={() => setSelectedLevel(opt.level)}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${opt.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-slate-900">{opt.label}</span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
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

            {/* Quick Tag Pills */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Quick note <span className="text-slate-400">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {quickTags.map((tag) => {
                  const isTagSelected = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTag(isTagSelected ? '' : tag)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                        isTagSelected
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Note */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Additional observation <span className="text-slate-400">(optional)</span>
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. 5 min wait at counter #2, plenty of seats near windows"
                className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-[#5B5CE2]"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#5B5CE2] hover:bg-[#4F50D5] text-white font-semibold rounded-xl transition-all"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit report'}</span>
              </button>
              {submitError && <p role="alert" className="text-sm text-red-600 text-center">{submitError}</p>}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
