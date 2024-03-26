import { LocationObjectCoords } from "expo-location";

/**
 * Return a google nearest road api url
 * See https://developers.google.com/maps/documentation/roads/nearest for more info
 */
const roadApi = (latitude: number, longitude: number) => {
  return `https://roads.googleapis.com/v1/nearestRoads?points=${latitude},${longitude}&key=${process.env.EXPO_GOOGLE_API_KEY} `;
};

/**
 * Calculates a random latitude and longitude a certain distance away from given coordinates
 * Taken from https://gis.stackexchange.com/questions/334297/generate-coordinates-with-minimum-maximum-distance-from-given-coordinates
 * @param latitude starting latitude
 * @param longitude starting longitude
 * @param max maximum distance (in KM)
 * @param min minimum distance (in KM)
 * @returns Object with new cordinates and distance in KM
 */
function generateLocation(
  latitude: number,
  longitude: number,
  max: number,
  min = 0,
) {
  if (min > max) {
    throw new Error(`min(${min}) cannot be greater than max(${max})`);
  }

  // earth radius in km
  const EARTH_RADIUS = 6371;

  // 1° latitude in meters
  const DEGREE = ((EARTH_RADIUS * 2 * Math.PI) / 360) * 1000;

  // random distance within [min-max] in km in a non-uniform way
  const maxKm = max * 1000;
  const minKm = min * 1000;
  const r = (maxKm - minKm + 1) * Math.random() ** 0.5 + minKm;

  // random angle
  const theta = Math.random() * 2 * Math.PI;

  const dy = r * Math.sin(theta);
  const dx = r * Math.cos(theta);

  const newLatitude = latitude + dy / DEGREE;
  const newLongitude = longitude + dx / (DEGREE * Math.cos(deg2rad(latitude)));

  const distance = getDistanceFromLatLonInKm(
    latitude,
    longitude,
    newLatitude,
    newLongitude,
  );

  return {
    newLatitude,
    newLongitude,
    distance: Math.round(distance),
  };
}

// See https://stackoverflow.com/a/27943/10975709
function getDistanceFromLatLonInKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1); // deg2rad below
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km

  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export default function getLocations(
  initialCords: LocationObjectCoords,
  maxDistance: number,
) {}
