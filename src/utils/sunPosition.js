import { useControls } from 'leva';
import SunCalc from 'suncalc';
import { Vector3 } from 'three';

export const latitude = 40.705310;
export const longitude = -74.010605;

// Centralize date and timezone adjustment
export function getAdjustedDateTime(date, time) {
    const hours = Math.floor(time / 60);
    const minutes = time % 60;
    const timeInput = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    const localDateTime = new Date(`${date}T${timeInput}Z`);
    const tzOffset = localDateTime.getTimezoneOffset();
    return new Date(localDateTime.getTime() - tzOffset * 60 * 1000);
}

// Calculate sun position and direction
export function getSunPosition(date, time) {
    const adjustedDateTime = getAdjustedDateTime(date, time);
    const sunPos = SunCalc.getPosition(adjustedDateTime, latitude, longitude);

    // Calculate the direction vector
    const x = Math.cos(sunPos.altitude) * Math.sin(sunPos.azimuth);
    const y = Math.sin(sunPos.altitude);
    const z = Math.cos(sunPos.azimuth) * Math.cos(sunPos.altitude);
    const direction = new Vector3(x, y, z).normalize();

    return {
        altitude: sunPos.altitude,
        azimuth: sunPos.azimuth,
        direction: direction
    };
}

// Update light position and intensity
export function updateLightPosition(light, date, time) {
    const { altitude, azimuth, direction } = getSunPosition(date, time);
    const radius = 1500;

    // Calculate light position
    const x = radius * Math.cos(altitude) * Math.sin(azimuth);
    const y = radius * Math.sin(altitude);
    const z = radius * Math.cos(azimuth) * Math.cos(altitude);

    light.position.set(x, y, z);
    light.target.position.set(0, 0, 0);

    // Set intensity based on altitude
    if (altitude < -0.02) {
        light.intensity = 0;
    } else {
        const intensityFactor = Math.max(0.3, Math.sin(altitude));
        light.intensity = 5 * intensityFactor;
    }

    return {
        position: { x, y, z },
        azimuth: azimuth,
        altitude: altitude,
        direction: direction
    };
}

// Controls for date and time
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