export interface EmergencyContact {
  name: string;
  phone: string;
  updatedAt: number;
}

export const EMERGENCY_CONTACT_STORAGE_KEY = 'AURA_EMERGENCY_CONTACT';

export const normalizeEmergencyPhone = (value: string): string => {
  const trimmed = value.trim();
  const hasLeadingPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  return hasLeadingPlus ? `+${digits}` : digits;
};

export const isValidEmergencyPhone = (value: string): boolean => {
  const normalized = normalizeEmergencyPhone(value);
  const digits = normalized.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15;
};

export const loadEmergencyContact = (): EmergencyContact | null => {
  try {
    const saved = localStorage.getItem(EMERGENCY_CONTACT_STORAGE_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved) as Partial<EmergencyContact>;
    if (
      typeof parsed.name !== 'string' ||
      typeof parsed.phone !== 'string' ||
      !isValidEmergencyPhone(parsed.phone)
    ) {
      return null;
    }

    return {
      name: parsed.name.trim(),
      phone: normalizeEmergencyPhone(parsed.phone),
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
    };
  } catch {
    return null;
  }
};
