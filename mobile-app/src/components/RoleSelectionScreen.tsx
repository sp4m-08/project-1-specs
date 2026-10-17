import React from 'react';
import { HeartHandshake, UserRound, UsersRound, ArrowRight } from 'lucide-react';
import { UserRole } from '../types/telemetry';

interface RoleSelectionScreenProps {
  onSelectRole: (role: UserRole) => void;
}

export const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({ onSelectRole }) => {
  return (
    <main className="role-selection" aria-labelledby="role-selection-title">
      <div className="role-selection__glow" aria-hidden="true" />
      <section className="role-selection__content">
        <div className="brand-mark" aria-hidden="true">
          <HeartHandshake size={28} strokeWidth={2.2} />
        </div>
        <p className="eyebrow-label">AURA ASSIST</p>
        <h1 id="role-selection-title" className="role-selection__title">Who is using AURA Assist?</h1>
        <p className="role-selection__intro">
          Choose the view that fits you. You can change this demo role later in More.
        </p>

        <div className="role-selection__options">
          <button className="role-card" onClick={() => onSelectRole('wearer')} type="button">
            <span className="role-card__icon" aria-hidden="true"><UserRound size={25} /></span>
            <span className="role-card__copy">
              <strong>I wear the devices</strong>
              <span>Large safety actions, path awareness, spoken assistance, and simple status.</span>
            </span>
            <ArrowRight className="role-card__arrow" size={20} aria-hidden="true" />
          </button>

          <button className="role-card" onClick={() => onSelectRole('caregiver')} type="button">
            <span className="role-card__icon" aria-hidden="true"><UsersRound size={25} /></span>
            <span className="role-card__copy">
              <strong>I support someone</strong>
              <span>Wearable freshness, health snapshots, alerts, and caregiver workflows.</span>
            </span>
            <ArrowRight className="role-card__arrow" size={20} aria-hidden="true" />
          </button>
        </div>

        <p className="role-selection__note">
          Demo role only — this choice is stored on this device and is not an account or permission boundary.
        </p>
      </section>
    </main>
  );
};
