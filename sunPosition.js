import SunCalc from 'suncalc';

const latitude = 19.0760;
const longitude = 72.8777;

export function updateSunPosition(light) {
    const dateInput = document.getElementById('dateInput').value;
    const timeInput = document.getElementById('timeInput').value;
  
    if (!dateInput || !timeInput) {
      alert('Please enter both date and time.');
      return;
    }
  
    const date = new Date(`${dateInput}T${timeInput}`);
    const sunPosition = SunCalc.getPosition(date, latitude, longitude);
    
    const radius = 1500; 
    const x = radius * Math.cos(sunPosition.azimuth) * Math.cos(sunPosition.altitude);
    const y = radius * Math.sin(sunPosition.altitude);
    const z = radius * Math.sin(sunPosition.azimuth) * Math.cos(sunPosition.altitude);
  
    light.position.set(x, y, z);
    light.target.position.set(0, 0, 0);
  
    if (sunPosition.altitude < 0) {
      light.intensity = 0; 
    } else {
      light.intensity = 5; 
    }
  }