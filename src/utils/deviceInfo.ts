import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { secureStorage } from './secureStorage';

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  osName: string;
  osVersion: string;
  appVersion: string;
  buildNumber: string;
  manufacturer: string;
  model: string;
  isPhysical: boolean;
}

class DeviceInfoManager {
  private static instance: DeviceInfoManager;
  private deviceInfo: DeviceInfo | null = null;

  private constructor() {}

  static getInstance(): DeviceInfoManager {
    if (!DeviceInfoManager.instance) {
      DeviceInfoManager.instance = new DeviceInfoManager();
    }
    return DeviceInfoManager.instance;
  }

  async getDeviceInfo(): Promise<DeviceInfo> {
    if (this.deviceInfo) {
      return this.deviceInfo;
    }

    let deviceId = await secureStorage.getItem('DEVICE_ID');
    if (!deviceId) {
      deviceId = this.generateDeviceId();
      await secureStorage.setItem('DEVICE_ID', deviceId);
    }

    this.deviceInfo = {
      deviceId,
      deviceName: Device.deviceName || 'Unknown Device',
      deviceType: Device.deviceType || 'Unknown',
      osName: Platform.OS,
      osVersion: Platform.Version?.toString() || 'Unknown',
      appVersion: Application.nativeApplicationVersion || '1.0.0',
      buildNumber: Application.nativeBuildVersion || '1',
      manufacturer: Device.manufacturer || 'Unknown',
      model: Device.modelName || 'Unknown',
      isPhysical: Device.isDevice || false,
    };

    return this.deviceInfo;
  }

  private generateDeviceId(): string {
    // Generate a unique device ID based on device info
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `${timestamp}${random}`;
  }

  getDeviceIdSync(): string | null {
    if (!this.deviceInfo) return null;
    return this.deviceInfo.deviceId;
  }
}

export const deviceInfoManager = DeviceInfoManager.getInstance();
