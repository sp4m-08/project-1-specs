import React from 'react';
import { LayoutGrid, Layers, ShieldCheck, Settings } from 'lucide-react';

export type ActiveTab = 'dashboard' | 'spatial' | 'security' | 'settings';

interface BottomNavBarProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onChangeTab }) => {
  return (
    <div style={styles.container}>
      <button
        onClick={() => onChangeTab('dashboard')}
        style={{
          ...styles.tabBtn,
          color: activeTab === 'dashboard' ? '#00F2FE' : '#64748B'
        }}
      >
        <LayoutGrid size={20} />
        <span style={styles.tabLabel}>Dashboard</span>
      </button>

      <button
        onClick={() => onChangeTab('spatial')}
        style={{
          ...styles.tabBtn,
          color: activeTab === 'spatial' ? '#00F2FE' : '#64748B'
        }}
      >
        <Layers size={20} />
        <span style={styles.tabLabel}>3D Radar</span>
      </button>

      <button
        onClick={() => onChangeTab('security')}
        style={{
          ...styles.tabBtn,
          color: activeTab === 'security' ? '#00F2FE' : '#64748B'
        }}
      >
        <ShieldCheck size={20} />
        <span style={styles.tabLabel}>AES-GCM Log</span>
      </button>

      <button
        onClick={() => onChangeTab('settings')}
        style={{
          ...styles.tabBtn,
          color: activeTab === 'settings' ? '#00F2FE' : '#64748B'
        }}
      >
        <Settings size={20} />
        <span style={styles.tabLabel}>Caregiver</span>
      </button>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(19, 27, 42, 0.95)',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(16px)',
    padding: '10px 0',
    position: 'sticky' as const,
    bottom: 0,
    zIndex: 100,
  },
  tabBtn: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '3px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    transition: 'color 0.2s ease',
  },
  tabLabel: {
    fontSize: '11px',
    fontWeight: '600',
  },
};
