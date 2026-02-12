import { DashboardShell } from '../../components/dashboard/DashboardShell';
import { DashboardProvider } from '../../contexts/DashboardContext';
import WelcomeModal from '../../components/onboarding/WelcomeModal';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardProvider>
      <DashboardShell>
        {children}
      </DashboardShell>
      <WelcomeModal />
    </DashboardProvider>
  );
}
