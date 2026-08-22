import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { authService } from '../services/authService';
import { ApiError } from '../services/api';
import { 
  Zap, 
  ShieldCheck, 
  ArrowRight, 
  GraduationCap, 
  Lock, 
  Mail 
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { navigateTo, addToast } = useApp();
  const [studentId, setStudentId] = useState<string>('25B91A4744@srkrec.ac.in');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [roleMode, setRoleMode] = useState<'student' | 'admin'>('student');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = await authService.login(studentId, password);
      addToast({
        title: 'Welcome back',
        message: 'Signed in successfully. Ready to explore campus.',
        type: 'success',
      });
      navigateTo(user.role === 'admin' ? 'admin' : 'dashboard');
    } catch (error) {
      setErrorMessage(error instanceof ApiError && error.status === 401 ? 'Invalid email or password.' : 'Unable to connect to Campus Rush services.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickStudentLogin = () => {
    authService.loginAsStudent();
    addToast({
      title: 'Welcome Alex Rivera 👋',
      message: 'Logged in with demo Student Account.',
      type: 'info',
    });
    navigateTo('dashboard');
  };

  const handleQuickAdminLogin = () => {
    authService.loginAsAdmin();
    addToast({
      title: 'Admin Access Granted 🛡️',
      message: 'Logged in as Prof. Sarah Jenkins (Campus Admin).',
      type: 'info',
    });
    navigateTo('admin');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Icon */}
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mx-auto shadow-md mb-3">
          <Zap className="w-8 h-8 fill-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Campus Rush
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
          Real-time crowd intelligence and facility booking for campus life.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-8 rounded-3xl border border-slate-200/90 shadow-elevation">
          {/* Role Mode Selector */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setRoleMode('student');
                setStudentId('');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition ${
                roleMode === 'student'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRoleMode('admin');
                setStudentId('');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition ${
                roleMode === 'admin'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Faculty / Admin</span>
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.99]"
            >
              <span>{isLoading ? 'Signing in...' : 'Sign In to Campus Rush'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
          {errorMessage && <p className="mt-3 text-sm text-red-600" role="alert">{errorMessage}</p>}

          {roleMode === 'student' && <>
            <button type="button" onClick={() => navigateTo('signup')} className="w-full mt-4 text-sm text-indigo-600 hover:text-indigo-700">
              Create a student account
            </button>

            <div className="mt-6 pt-6 border-t border-slate-100 space-y-2.5">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">
                Quick 1-Click Demo Profiles
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleQuickStudentLogin}
                  className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Alex (Student)</span>
                </button>

                <button
                  type="button"
                  onClick={handleQuickAdminLogin}
                  className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  <span>Prof. Sarah (Admin)</span>
                </button>
              </div>
            </div>
          </>}
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Campus Rush • Real-Time Campus Intelligence Platform
        </p>
      </div>
    </div>
  );
};
