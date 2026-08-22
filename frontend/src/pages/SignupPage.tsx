import React, { useState } from 'react';
import { ArrowLeft, Lock, Mail, UserPlus, UserRound } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { authService } from '../services/authService';
import { ApiError } from '../services/api';

export const SignupPage: React.FC = () => {
  const { navigateTo, addToast } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await authService.signup(name, email, password);
      addToast({ title: 'Account created successfully', message: 'You can now sign in to Campus Rush.', type: 'success' });
      navigateTo('login');
    } catch (error) {
      setErrorMessage(error instanceof ApiError && error.status === 409 ? 'An account with this email already exists.' : error instanceof ApiError ? error.message : 'Unable to connect to Campus Rush services.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-8 rounded-3xl border border-slate-200/90 shadow-elevation">
          <button type="button" onClick={() => navigateTo('login')} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 mb-6"><ArrowLeft className="w-4 h-4" /> Back to sign in</button>
          <div className="flex items-center gap-3 mb-6"><UserPlus className="w-6 h-6 text-indigo-600" /><div><h1 className="text-2xl font-extrabold text-slate-900">Create account</h1><p className="text-sm text-slate-500">Join Campus Rush as a student.</p></div></div>
          <form onSubmit={handleSignup} className="space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Name<div className="relative mt-1"><UserRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" /><input required value={name} onChange={(event) => setName(event.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm" /></div></label>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Email<div className="relative mt-1"><Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm" /></div></label>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Password<div className="relative mt-1"><Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" /><input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm" /></div></label>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Confirm password<div className="relative mt-1"><Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" /><input required minLength={8} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm" /></div></label>
            <button disabled={isLoading} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl"><span>{isLoading ? 'Creating account...' : 'Create account'}</span></button>
          </form>
          {errorMessage && <p className="mt-3 text-sm text-red-600" role="alert">{errorMessage}</p>}
        </div>
      </div>
    </div>
  );
};