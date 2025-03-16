import { useControls } from 'leva';
import SunCalc from 'suncalc';

const latitude = 40.705310;
const longitude = -74.010605;

export function useSunControls() {
    return useControls({
        date: {
            value: new Date().toISOString().split('T')[0],
            label: 'Date'
        },
        time: {
            value: 720,
            min: 0,
            max: 1439,
            step: 1,
            label: 'Time'
        }
    });
}

export function updateLightPosition(light, date, time) {
    const hours = Math.floor(time / 60);
    const minutes = time % 60;
    const timeInput = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    const localDateTime = new Date(`${date}T${timeInput}Z`);
    const tzOffset = localDateTime.getTimezoneOffset();
    const adjustedDateTime = new Date(localDateTime.getTime() - tzOffset * 60 * 1000);

    const sunPos = SunCalc.getPosition(adjustedDateTime, latitude, longitude);
    const radius = 1500;

    //  x = R * cos(ϕ) * sin(θ) y = R * cos(ϕ) * cos(θ) z = R * sin(ϕ)
    // theta = azimuth, phi = altitude 
    const x = radius * Math.cos(sunPos.altitude) * Math.sin(sunPos.azimuth)
    const y = radius * Math.sin(sunPos.altitude);
    const z = radius * Math.cos(sunPos.azimuth) * Math.cos(sunPos.altitude);


    light.position.set(x, y, z);
    light.target.position.set(0, 0, 0);

    if (sunPos.altitude < -0.02) {
        light.intensity = 0;
    } else {
        const intensityFactor = Math.max(0.3, Math.sin(sunPos.altitude));
        light.intensity = 5 * intensityFactor;
    }

    return {
        position: { x, y, z },
        azimuth: sunPos.azimuth,
        altitude: sunPos.altitude
    };
}