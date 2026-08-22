import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Zap, 
  Shield, 
  LogOut 
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    user, 
    activePage, 
    navigateTo, 
    logout 
  } = useApp();

  return (
    <header className="sticky top-0 z-40 bg-[#fbfbfa]/95 backdrop-blur-md border-b border-slate-200/70">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateTo('dashboard')}
              className="flex items-center gap-2.5 group text-left focus:outline-none"
            >
              <div className="w-8 h-8 rounded-lg bg-[#5B5CE2] group-hover:bg-[#4F50D5] flex items-center justify-center text-white transition">
                <Zap className="w-5 h-5 fill-white" />
              </div>
              <div>
                <span className="text-base font-semibold text-slate-900 leading-none flex items-center gap-1">
                  Campus Rush
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">Find your next stop</span>
              </div>
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2.5">
            {/* Profile / Admin Trigger */}
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <button
                onClick={() => navigateTo('profile')}
                className={`flex items-center gap-2 p-1.5 rounded-xl transition ${
                  activePage === 'profile'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
                title="View Profile"
              >
                <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-xs text-slate-700">
                  {user.name.charAt(0)}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-bold text-slate-800 leading-none">{user.name}</p>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {user.accessRole === 'SUPER_ADMIN' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : `${user.reputationPoints} pts`}
                  </span>
                </div>
              </button>

              {user.role === 'admin' && (
                <button
                  onClick={() => navigateTo('admin')}
                  className={`p-2 rounded-xl text-xs font-bold border transition ${
                    activePage === 'admin'
                      ? 'bg-purple-50 text-purple-700 border-purple-300'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                  title="Admin Dashboard"
                >
                  <Shield className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
                title="Sign Out / Switch Demo"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
