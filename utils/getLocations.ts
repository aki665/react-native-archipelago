import { LocationObjectCoords } from "expo-location";

/**
 * Return a google 'nearest road' API url
 * See https://developers.google.com/maps/documentation/roads/nearest for more info
 */
const roadApi = (latitude: number, longitude: number) => {
  return `https://roads.googleapis.com/v1/nearestRoads?points=${latitude}%2C${longitude}&key=${process.env.EXPO_PUBLIC_GOOGLE_API_KEY}`;
};

/**
 * Calculates a random latitude and longitude a certain distance away from given coordinates
 * Taken from https://gis.stackexchange.com/questions/334297/generate-coordinates-with-minimum-maximum-distance-from-given-coordinates
 * @param latitude starting latitude
 * @param longitude starting longitude
 * @param max maximum distance (in M)
 * @param min minimum distance (in M)
 * @returns Object with new cordinates and distance in KM
 */
async function generateLocation(
  latitude: number,
  longitude: number,
  max: number,
  theta: number,
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
  const r = (max - min + 1) * Math.random() ** 0.5 + min;

  const dy = r * Math.sin(theta);
  const dx = r * Math.cos(theta);

  let newLatitude = latitude + dy / DEGREE;
  let newLongitude = longitude + dx / (DEGREE * Math.cos(deg2rad(latitude)));

  console.log(newLatitude, newLongitude);
  const response = await fetch(roadApi(newLatitude, newLongitude));

  const roadSnappedCoords = await response.json();
  console.log(response.json());
  newLatitude = roadSnappedCoords.snappedPoints[0].location.latitude;
  newLongitude = roadSnappedCoords.snappedPoints[0].location.longitude;
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

async function getLocationCoordinates(
  latitude: number,
  longitude: number,
  maximum_distance: number,
  theta: number,
  minimum_distance = 0,
) {
  let res = await generateLocation(
    latitude,
    longitude,
    maximum_distance,
    theta,
    minimum_distance,
  );
  if (
    res.distance * 1000 < minimum_distance ||
    res.distance * 1000 > maximum_distance
  )
    console.log(res.distance);
  res = await getLocationCoordinates(
    latitude,
    longitude,
    maximum_distance,
    theta,
    minimum_distance,
  );
  return res;
}

export default async function getLocations(
  initialCords: LocationObjectCoords,
  maximum_distance: number,
  minimum_distance: number,
  speed_requirement: number,
  trip: {
    amount: number;
    distance_tier: number;
    key_needed: number;
    speed_tier: number;
  },
) {
  // random angle
  const theta = Math.random() * 2 * Math.PI;
  const res = [];
  for (let i = 0; i < trip.amount; i++) {
    const coordinates = await getLocationCoordinates(
      initialCords.latitude,
      initialCords.longitude,
      maximum_distance,
      theta,
      minimum_distance,
    );
    res.push({ lat: coordinates.newLatitude, lon: coordinates.newLongitude });
  }
  return res;
}
