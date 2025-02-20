import { Settings } from 'lucide-react';
import styles from './Layout.module.css';

interface LayoutProps {
  children: React.ReactNode;
  isSettingsOpen: boolean;
  onOpenSettings: () => void;
}

export function Layout({ children, isSettingsOpen, onOpenSettings }: LayoutProps) {
  return (
    <div className={styles.layout}>
      <button 
        className={styles.settingsButton}
        onClick={onOpenSettings}
        title="Settings"
      >
        <Settings size={20} />
      </button>
      {children}
    </div>
  );
} 