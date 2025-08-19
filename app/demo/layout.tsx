import { UIStateProvider } from '@/components/layout/UIStateContext';

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UIStateProvider>
      {children}
    </UIStateProvider>
  );
}
