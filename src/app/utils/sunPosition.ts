import SunCalc from 'suncalc';
import * as THREE from 'three';

// Constants
const LATITUDE = 19.0760;
const LONGITUDE = 72.8777;

export interface SunPosition {
  azimuth: number;
  altitude: number;
}

// Global sunPosition state that can be imported by other modules
export const sunPosition: SunPosition = {
  azimuth: 0,
  altitude: 0,
};

/**
 * Calculate the total daytime hours for a given date
 */
export function getTotalDaytime(date: Date): number {
  const times = SunCalc.getTimes(date, LATITUDE, LONGITUDE);
  const sunrise = times.sunrise;
  const sunset = times.sunset;

  const totalDaytime = (sunset.getTime() - sunrise.getTime()) / (1000 * 60 * 60); 
  return totalDaytime;
}

/**
 * Update the sun position based on date and time inputs
 */
export function updateSunPosition(light: THREE.DirectionalLight): { x: number, y: number, z: number } | null {
  // DOM elements must be checked for null since this is run in the browser
  const dateInput = document.getElementById('dateInput') as HTMLInputElement;
  const timeSlider = document.getElementById('timeSlider') as HTMLInputElement;

  if (!dateInput || !dateInput.value) {
    alert('Please enter a date.');
    return null;
  }

  const hours = Math.floor(parseInt(timeSlider.value) / 60);
  const minutes = parseInt(timeSlider.value) % 60;
  const timeInput = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  const date = new Date(`${dateInput.value}T${timeInput}`);
  const sunPos = SunCalc.getPosition(date, LATITUDE, LONGITUDE);

  const radius = 1500; 
  const x = radius * Math.cos(sunPos.azimuth) * Math.cos(sunPos.altitude);
  const y = radius * Math.sin(sunPos.altitude);
  const z = radius * Math.sin(sunPos.azimuth) * Math.cos(sunPos.altitude);

  light.position.set(x, y, z);
  
  // Check if light.target exists since this might be undefined in TypeScript
  if (light.target) {
    light.target.position.set(0, 0, 0);
  }

  if (sunPos.altitude < 0) {
    light.intensity = 0; 
  } else {
    light.intensity = 5; 
  }

  // Update the global sunPosition
  sunPosition.azimuth = sunPos.azimuth;
  sunPosition.altitude = sunPos.altitude;

  return { x, y, z };
} 