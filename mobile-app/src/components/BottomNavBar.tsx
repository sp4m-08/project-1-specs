import React from 'react';
import { LayoutGrid, Map, Bell, MoreHorizontal } from 'lucide-react';
import { mobileUx } from '../utils/haptics';
import { UserRole } from '../types/telemetry';

export type ActiveTab = 'dashboard' | 'spatial' | 'alerts' | 'settings';

interface BottomNavBarProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  role: UserRole;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onChangeTab, role }) => {
  const tabs: { id: ActiveTab; label: string; icon: React.FC<{ size: number; color?: string }> }[] = [
    { id: 'dashboard', label: role === 'caregiver' ? 'Overview' : 'Home', icon: LayoutGrid },
    { id: 'spatial', label: 'Path', icon: Map },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'settings', label: 'More', icon: MoreHorizontal },
  ];

  const handleTabClick = (tabId: ActiveTab) => {
    if (tabId !== activeTab) {
      mobileUx.triggerHaptic('light');
      mobileUx.playTone('switch');
    }
    onChangeTab(tabId);
  };

  return (
    <nav style={styles.navContainer} className="dadaist-bottom-nav" aria-label="Primary navigation">
      <div style={styles.pillTrack} className="dadaist-bottom-track">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={tab.label}
              type="button"
              className="dadaist-bottom-tab"
              data-active={isActive}
              style={{
                ...styles.tabPill,
                backgroundColor: isActive ? '#38BDF8' : 'transparent',
                color: isActive ? '#070D1E' : '#8CA2C2',
              }}
            >
              <Icon size={16} color={isActive ? '#070D1E' : '#8CA2C2'} />
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
    backgroundColor: 'rgba(11, 19, 43, 0.95)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderTop: '1px solid rgba(56, 189, 248, 0.15)',
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
    backgroundColor: '#070D1E',
    padding: '4px',
    borderRadius: '56px',
    border: '1px solid rgba(56, 189, 248, 0.2)',
    width: '100%',
    maxWidth: '520px',
    justifyContent: 'space-between',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
  },
  tabPill: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    flex: 1,
    padding: '8px clamp(4px, 1.8vw, 12px)',
    borderRadius: '56px',
    border: 'none',
    cursor: 'pointer',
    minHeight: '40px',
    touchAction: 'manipulation' as const,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  tabLabel: {
    fontSize: 'clamp(10px, 2.5vw, 12px)',
    letterSpacing: '-0.08px',
    whiteSpace: 'nowrap' as const,
  },
};
