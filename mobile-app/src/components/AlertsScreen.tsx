import React from 'react';
import { AlertTriangle, Bell, CheckCircle2, Clock3, ShieldCheck } from 'lucide-react';
import { SafetyAlert, UserRole } from '../types/telemetry';

interface AlertsScreenProps {
  alerts: SafetyAlert[];
  role: UserRole;
  onAcknowledge?: (alertId: string) => void;
}

const formatTime = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const AlertsScreen: React.FC<AlertsScreenProps> = ({ alerts, role, onAcknowledge }) => {
  return (
    <main className="page-shell tab-transition-view collage-alerts" aria-labelledby="alerts-title">
      <header className="page-header collage-alerts__header">
        <div>
          <p className="eyebrow-label">{role === 'caregiver' ? 'CARE WORKFLOW' : 'YOUR SAFETY'}</p>
          <h1 id="alerts-title">Alerts and updates</h1>
          <p>Important changes from the AURA wearable system stay here so they are easy to review.</p>
        </div>
        <div className="page-header__status collage-alerts__count"><Bell size={16} /> {alerts.length} updates</div>
      </header>

      {alerts.length === 0 ? (
          <section className="empty-state collage-alerts__empty" aria-live="polite">
          <span className="empty-state__icon"><ShieldCheck size={30} /></span>
          <h2>No alerts right now</h2>
          <p>AURA Assist will show safety and health updates here when they arrive.</p>
        </section>
      ) : (
        <section className="alert-list collage-alerts__list" aria-label="Safety alerts">
          {alerts.map((alert) => {
            const isCritical = alert.level === 'critical';
            const isWarning = alert.level === 'warning';
            return (
              <article key={alert.id} className={`alert-list__item alert-list__item--${alert.level} collage-alerts__item`}>
                <span className="alert-list__icon" aria-hidden="true">
                  {isCritical || isWarning ? <AlertTriangle size={21} /> : <CheckCircle2 size={21} />}
                </span>
                <div className="alert-list__content">
                  <div className="alert-list__heading">
                    <h2>{alert.title}</h2>
                    <span>{formatTime(alert.timestamp)}</span>
                  </div>
                  <p>{alert.message}</p>
                  <div className="alert-list__meta">
                    <span><Clock3 size={13} /> {alert.source === 'fall' ? 'Fall protection' : alert.source === 'health' ? 'Health snapshot' : 'System update'}</span>
                    {alert.acknowledged && <span><CheckCircle2 size={13} /> Acknowledged</span>}
                  </div>
                </div>
                {role === 'caregiver' && !alert.acknowledged && onAcknowledge && (
                  <button className="button button--secondary alert-list__action" type="button" onClick={() => onAcknowledge(alert.id)}>
                    Acknowledge
                  </button>
                )}
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
};
