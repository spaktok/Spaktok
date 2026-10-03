import * as LocalAuthentication from 'expo-local-authentication';
import { secureStorage } from './secureStorage';

export interface BiometricInfo {
  available: boolean;
  enrolled: boolean;
  compatible: boolean;
  types: string[];
}

class BiometricManager {
  private static instance: BiometricManager;

  private constructor() {}

  static getInstance(): BiometricManager {
    if (!BiometricManager.instance) {
      BiometricManager.instance = new BiometricManager();
    }
    return BiometricManager.instance;
  }

  async getAvailableBiometrics(): Promise<BiometricInfo> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

      return {
        available: compatible && enrolled,
        enrolled,
        compatible,
        types: this.mapAuthTypes(types),
      };
    } catch (error) {
      console.error('Error getting biometric info:', error);
      return {
        available: false,
        enrolled: false,
        compatible: false,
        types: [],
      };
    }
  }

  async authenticate(reason: string = 'Authenticate to access Spaktok'): Promise<boolean> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) return false;

      const result = await LocalAuthentication.authenticateAsync({
        disableDeviceFallback: false,
        reason,
      });

      return result.success;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  }

  async enableBiometric(): Promise<boolean> {
    const authenticated = await this.authenticate('Enable biometric authentication');
    if (authenticated) {
      await secureStorage.setItem('BIOMETRIC_ENABLED', 'true');
      return true;
    }
    return false;
  }

  async disableBiometric(): Promise<void> {
    await secureStorage.removeItem('BIOMETRIC_ENABLED');
  }

  async isBiometricEnabled(): Promise<boolean> {
    const enabled = await secureStorage.getItem('BIOMETRIC_ENABLED');
    return enabled === 'true';
  }

  private mapAuthTypes(types: LocalAuthentication.AuthenticationType[]): string[] {
    return types.map((type) => {
      switch (type) {
        case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
          return 'Face ID';
        case LocalAuthentication.AuthenticationType.FINGERPRINT:
          return 'Fingerprint';
        case LocalAuthentication.AuthenticationType.IRIS:
          return 'Iris';
        default:
          return 'Unknown';
      }
    });
  }
}

export const biometricManager = BiometricManager.getInstance();
