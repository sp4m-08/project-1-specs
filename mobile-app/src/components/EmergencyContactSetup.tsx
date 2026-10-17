import React, { useState } from 'react';
import { CheckCircle2, Phone, Save, ShieldAlert, UserRound } from 'lucide-react';
import {
  EmergencyContact,
  isValidEmergencyPhone,
  normalizeEmergencyPhone,
} from '../types/emergency';

interface EmergencyContactSetupProps {
  initialContact?: EmergencyContact | null;
  required?: boolean;
  onSave: (contact: EmergencyContact) => Promise<void> | void;
  onCancel?: () => void;
}

export const EmergencyContactSetup: React.FC<EmergencyContactSetupProps> = ({
  initialContact,
  required = false,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState(initialContact?.name ?? '');
  const [phone, setPhone] = useState(initialContact?.phone ?? '');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanPhone = normalizeEmergencyPhone(phone);

    if (cleanName.length < 2) {
      setError('Enter the emergency contact’s name.');
      return;
    }

    if (!isValidEmergencyPhone(cleanPhone)) {
      setError('Enter a valid phone number with 8–15 digits.');
      return;
    }

    setError('');
    setIsSaving(true);
    try {
      await onSave({ name: cleanName, phone: cleanPhone, updatedAt: Date.now() });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save this contact.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="emergency-contact-setup" aria-labelledby="emergency-contact-title">
      <section className="emergency-contact-setup__card">
        <div className="emergency-contact-setup__stamp" aria-hidden="true">
          <ShieldAlert size={26} />
          <span>SAFETY FILE / CONTACT 01</span>
        </div>

        <div className="emergency-contact-setup__heading">
          <div className="emergency-contact-setup__icon" aria-hidden="true">
            <Phone size={27} />
          </div>
          <div>
            <p className="eyebrow-label">EMERGENCY CONTACT</p>
            <h1 id="emergency-contact-title">
              {required ? 'Set up the person we call' : 'Update emergency contact'}
            </h1>
          </div>
        </div>

        <p className="emergency-contact-setup__intro">
          {required
            ? 'If a possible fall is not silenced before the response window ends, the Android app will use this contact for a native SMS and phone call.'
            : 'This contact stays on this device. AURA Assist does not upload it to AURA Bridge or a third-party service.'}
        </p>

        <form onSubmit={handleSubmit} className="emergency-contact-setup__form">
          <label>
            <span><UserRound size={15} /> CONTACT NAME</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Priya Sharma"
              autoComplete="name"
              autoFocus={required}
              required
            />
          </label>

          <label>
            <span><Phone size={15} /> MOBILE NUMBER</span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="e.g. +91 98765 43210"
              inputMode="tel"
              autoComplete="tel"
              required
            />
          </label>

          {error && <p className="emergency-contact-setup__error" role="alert">{error}</p>}

          <div className="emergency-contact-setup__actions">
            {onCancel && (
              <button type="button" className="pill-btn-ghost" onClick={onCancel} disabled={isSaving}>
                Cancel
              </button>
            )}
            <button type="submit" className="pill-btn-primary" disabled={isSaving}>
              {isSaving ? <><CheckCircle2 size={17} /> Saving…</> : <><Save size={17} /> Save contact</>}
            </button>
          </div>
        </form>

        <p className="emergency-contact-setup__note">
          Android call and SMS permissions are requested when you save. The call and message use the device’s native phone and messaging system.
        </p>
      </section>
    </main>
  );
};
