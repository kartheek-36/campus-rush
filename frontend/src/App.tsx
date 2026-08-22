import React from 'react';
import { useApp } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExplorePage } from './pages/ExplorePage';
import { LocationDetailsPage } from './pages/LocationDetailsPage';
import { ReportCrowdPage } from './pages/ReportCrowdPage';
import { BookingsPage } from './pages/BookingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { SignupPage } from './pages/SignupPage';

export const AppContent: React.FC = () => {
  const { activePage, authLoading, isAuthenticated } = useApp();

  if (authLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500">Loading Campus Rush...</div>;
  }

  if (activePage === 'login') {
    return <LoginPage />;
  }
  if (activePage === 'signup') return <SignupPage />;
  if (!isAuthenticated) return <LoginPage />;

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'explore':
        return <ExplorePage />;
      case 'details':
        return <LocationDetailsPage />;
      case 'report':
        return <ReportCrowdPage />;
      case 'bookings':
        return <BookingsPage />;
      case 'profile':
        return <ProfilePage />;
      case 'admin':
        return <AdminDashboardPage />;
      default:
        return <DashboardPage />;
    }
  };

  return <AppLayout>{renderPage()}</AppLayout>;
};

export default AppContent;
