import SunCalc from 'suncalc';
import { sunPosition } from './main';

const latitude = 19.0760;
const longitude = 72.8777;

export function updateSunPosition(light) {
  const dateInput = document.getElementById('dateInput').value;
  const timeInput = document.getElementById('timeInput').value;

  if (!dateInput || !timeInput) {
    alert('Please enter both date and time.');
    return null;
  }

  const date = new Date(`${dateInput}T${timeInput}`);
  const sunPos = SunCalc.getPosition(date, latitude, longitude);

  const radius = 1500; 
  const x = radius * Math.cos(sunPos.azimuth) * Math.cos(sunPos.altitude);
  const y = radius * Math.sin(sunPos.altitude);
  const z = radius * Math.sin(sunPos.azimuth) * Math.cos(sunPos.altitude);

  light.position.set(x, y, z);
  light.target.position.set(0, 0, 0);

  if (sunPos.altitude < 0) {
    light.intensity = 0; 
  } else {
    light.intensity = 5; 
  }

  sunPosition.azimuth = sunPos.azimuth;
  sunPosition.altitude = sunPos.altitude;

  return {x, y, z};
}