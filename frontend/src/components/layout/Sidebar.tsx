import React from 'react';
import { useApp } from '../../context/AppContext';
import { PageRoute } from '../../types';
import { 
  LayoutDashboard, 
  Compass, 
  CalendarDays,
  PlusCircle, 
  User, 
  ShieldCheck
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activePage, navigateTo, user, openReportModal } = useApp();

  const navItems: Array<{
    id: PageRoute;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: string;
    adminOnly?: boolean;
  }> = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'bookings', label: 'Bookings', icon: CalendarDays },
    { id: 'report', label: 'Reports', icon: PlusCircle },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'admin', label: user.accessRole === 'SUPER_ADMIN' ? 'Super Admin' : user.adminFacilityId ? 'Facility Admin' : 'Admin', icon: ShieldCheck, adminOnly: true },
  ];

  return (
    <aside className="w-[216px] min-h-[calc(100vh-4rem)] px-5 py-10 hidden md:flex shrink-0">
      <div className="w-full">
        {/* Nav list */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-medium text-slate-400 mb-3">Campus Rush</p>
          {navItems
            .filter((item) => !item.adminOnly || user.role === 'admin')
            .map((item) => {
              const isActive = activePage === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'report') {
                      openReportModal();
                    } else {
                      navigateTo(item.id);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all ${
                    isActive
                      ? 'bg-[#EEF0FF] text-[#17181A] font-semibold'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#5B5CE2]' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] text-slate-400">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
        </div>

      </div>

    </aside>
  );
};
