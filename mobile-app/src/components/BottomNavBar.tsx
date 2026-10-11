import React from 'react';
import { LayoutGrid, Layers, ShieldCheck, Settings } from 'lucide-react';

export type ActiveTab = 'dashboard' | 'spatial' | 'security' | 'settings';

interface BottomNavBarProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onChangeTab }) => {
  const tabs: { id: ActiveTab; label: string; icon: React.FC<{ size: number; color?: string }> }[] = [
    { id: 'dashboard', label: 'Console', icon: LayoutGrid },
    { id: 'spatial', label: '3D Radar', icon: Layers },
    { id: 'security', label: 'AES Pipeline', icon: ShieldCheck },
    { id: 'settings', label: 'Config', icon: Settings },
  ];

  return (
    <nav style={styles.navContainer}>
      <div style={styles.pillTrack}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              style={{
                ...styles.tabPill,
                backgroundColor: isActive ? '#3DDC91' : 'transparent',
                color: isActive ? '#132322' : '#828786',
              }}
            >
              <Icon size={16} color={isActive ? '#132322' : '#828786'} />
              <span style={{
                ...styles.tabLabel,
                fontWeight: isActive ? '600' : '400',
              }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

const styles = {
  navContainer: {
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 200,
    backgroundColor: 'rgba(19, 35, 34, 0.95)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    /* SAFE AREA FIX: Ensure bottom navigation clears device native gesture indicator bar */
    paddingTop: '8px',
    paddingBottom: 'calc(max(env(safe-area-inset-bottom, 0px), 18px) + 6px)',
    paddingLeft: 'max(env(safe-area-inset-left, 0px), 16px)',
    paddingRight: 'max(env(safe-area-inset-right, 0px), 16px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillTrack: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#0E1A19',
    padding: '4px',
    borderRadius: '56px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    width: '100%',
    maxWidth: '520px',
    justifyContent: 'space-between',
  },
  tabPill: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    flex: 1,
    padding: '8px 12px',
    borderRadius: '56px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  tabLabel: {
    fontSize: '12px',
    letterSpacing: '-0.08px',
  },
};
