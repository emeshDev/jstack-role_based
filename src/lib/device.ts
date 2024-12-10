// src/lib/device.ts

export function getDeviceId() {
  if (typeof window === "undefined") return null;

  let deviceId = localStorage.getItem("device_id");
  if (!deviceId) {
    deviceId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem("device_id", deviceId);
  }
  return deviceId;
}
