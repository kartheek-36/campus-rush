import React, { useState } from 'react';
import { LocationCategory } from '../../types';
import { Utensils, BookOpen, Cpu, Search, Sparkles, Plus, X, Trophy, Dumbbell, Building2, Store } from 'lucide-react';

interface DestinationSearchProps {
  selectedCategory: LocationCategory | 'ALL';
  onSelectCategory: (category: LocationCategory | 'ALL') => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSubmit?: () => void;
  collapsible?: boolean;
  className?: string;
}

export const DestinationSearch: React.FC<DestinationSearchProps> = ({
  selectedCategory,
  onSelectCategory,
  searchQuery = '',
  onSearchChange,
  onSubmit,
  collapsible = false,
  className = '',
}) => {
  const [showShortcuts, setShowShortcuts] = useState(!collapsible);
  const categories: Array<{ id: LocationCategory | 'ALL'; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'ALL', label: 'All', icon: Sparkles },
    { id: 'FOOD', label: 'Food', icon: Utensils },
    { id: 'STUDY', label: 'Library / Xerox shop', icon: BookOpen },
    { id: 'LAB', label: 'Lab', icon: Cpu },
    { id: 'SPORTS', label: 'Games', icon: Trophy },
    { id: 'FITNESS', label: 'Gym', icon: Dumbbell },
    { id: 'EVENTS', label: 'Auditorium', icon: Building2 },
    { id: 'SHOPPING', label: 'Shop', icon: Store },
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Search Input */}
      {onSearchChange && (
        <div className={`flex items-center gap-2 ${collapsible ? 'rounded-full bg-white border border-[#E5E7EB] p-1.5 shadow-[0_4px_16px_rgba(23,24,26,0.06)]' : ''}`}>
          {collapsible && (
            <button type="button" onClick={() => setShowShortcuts((visible) => !visible)} aria-label="Show category shortcuts" className="w-9 h-9 rounded-full bg-[#EEF0FF] text-[#5B5CE2] hover:bg-[#E5E6FF] flex items-center justify-center transition shrink-0">
              {showShortcuts ? <X className="w-4 h-4" /> : <Plus className="w-5 h-5" />}
            </button>
          )}
          <div className="relative flex-1 flex items-center">
            {!collapsible && <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none" />}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSubmit?.();
              }}
              placeholder="What are you looking for?"
              className={`${collapsible ? 'flex-1 min-w-0 pl-2 pr-2 py-3.5 text-[#17181A] placeholder:text-[#9CA3AF]' : 'w-full pl-12 pr-4 py-4 text-slate-900'} bg-transparent rounded-2xl border-0 text-base focus:outline-none transition`}
            />
            {collapsible && <div className="flex items-center pr-2 text-slate-300">
              <button type="button" title="Search" onClick={onSubmit} className="p-2 text-[#5B5CE2] hover:bg-[#EEF0FF] rounded-full transition"><Search className="w-4 h-4" /></button>
            </div>}
          </div>
        </div>
      )}

      {/* Category Buttons */}
      {showShortcuts && <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm whitespace-nowrap transition-all duration-150 ${
                isSelected
                  ? 'bg-[#1f2421] text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-300' : 'text-slate-400'}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>}
    </div>
  );
};
