import React from 'react';
import { useApp } from '../../context/AppContext';
import { PageRoute } from '../../types';
import { 
  LayoutDashboard, 
  Compass, 
  CalendarDays,
  PlusCircle, 
  User 
} from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const { activePage, navigateTo, openReportModal } = useApp();

  const tabs: Array<{
    id: PageRoute;
    label: string;
    icon: React.FC<{ className?: string }>;
    isAction?: boolean;
  }> = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'report', label: 'Report', icon: PlusCircle, isAction: true },
    { id: 'bookings', label: 'Bookings', icon: CalendarDays },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 py-1 shadow-lg">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = activePage === tab.id;
          const Icon = tab.icon;

          if (tab.isAction) {
            return (
              <button
                key={tab.id}
                onClick={() => openReportModal()}
                className="flex flex-col items-center justify-center p-1.5 focus:outline-none -mt-3"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white shadow-md flex items-center justify-center hover:bg-indigo-700 active:scale-95 transition">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-slate-700 mt-0.5">{tab.label}</span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => navigateTo(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition ${
                isActive
                  ? 'text-indigo-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span className="text-[10px] tracking-tight mt-1">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
