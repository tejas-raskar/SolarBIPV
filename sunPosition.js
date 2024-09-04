import SunCalc from 'suncalc';
import { sunPosition } from './main';

const latitude = 19.0760;
const longitude = 72.8777;

export function getTotalDaytime(date) {
  const times = SunCalc.getTimes(date, latitude, longitude);
  const sunrise = times.sunrise;
  const sunset = times.sunset;

  const totalDaytime = (sunset - sunrise) / (1000 * 60 * 60); 
  return totalDaytime;
}

export function updateSunPosition(light) {
  const dateInput = document.getElementById('dateInput').value;
  const timeSlider = document.getElementById('timeSlider').value;

  if (!dateInput) {
    alert('Please enter a date.');
    return null;
  }

  const hours = Math.floor(timeSlider / 60);
  const minutes = timeSlider % 60;
  const timeInput = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

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

