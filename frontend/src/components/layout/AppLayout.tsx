import React, { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { BottomNavigation } from './BottomNavigation';
import { ToastContainer } from '../common/ToastContainer';
import { ReportCrowdModal } from '../report/ReportCrowdModal';
import { useApp } from '../../context/AppContext';

export const AppLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isReportModalOpen, closeReportModal, selectedLocationId } = useApp();

  return (
    <div className="min-h-screen bg-[#fbfbfa] flex flex-col antialiased">
      <Navbar />

      <div className="flex-1 max-w-[1440px] w-full mx-auto flex">
        <Sidebar />
        <main className="flex-1 px-5 py-8 sm:px-8 lg:px-16 lg:py-12 pb-24 md:pb-12 max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>

      <BottomNavigation />
      <ToastContainer />
      <ReportCrowdModal
        isOpen={isReportModalOpen}
        onClose={closeReportModal}
        initialLocationId={selectedLocationId}
      />
    </div>
  );
};
