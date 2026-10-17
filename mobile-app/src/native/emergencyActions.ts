import { Capacitor, registerPlugin } from '@capacitor/core';

export interface EmergencyAlertOptions {
  phone: string;
  message: string;
}

interface EmergencyActionsPlugin {
  requestPermissions(): Promise<void>;
  sendEmergencyAlert(options: EmergencyAlertOptions): Promise<void>;
}

const EmergencyActions = registerPlugin<EmergencyActionsPlugin>('EmergencyActions');

export const emergencyActions = {
  async requestPermissions(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    await EmergencyActions.requestPermissions();
  },

  async sendEmergencyAlert(options: EmergencyAlertOptions): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      throw new Error('Native emergency actions are available in the Android app only.');
    }
    await EmergencyActions.sendEmergencyAlert(options);
  },
};
