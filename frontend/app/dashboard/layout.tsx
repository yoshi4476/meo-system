import { DashboardShell } from '../../components/dashboard/DashboardShell';
import { DashboardProvider } from '../../contexts/DashboardContext';

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
    </DashboardProvider>
  );
}
