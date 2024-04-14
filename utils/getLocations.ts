import { LocationObjectCoords } from "expo-location";

/**
 * Return a openstreetmaps 'lookup' API url
 * See https://nominatim.org/release-docs/latest/api/Lookup/ for more info
 */
const lookupApi = (type: string, id: number) => {
  return `https://nominatim.openstreetmap.org/lookup?osm_ids=${type}${id}&format=json`;
};

/**
 * Return a openstreetmaps reverse geicidubg API url
 * See https://nominatim.org/release-docs/latest/api/Reverse/ for more info
 */
const getOSMTypeAndIdAPI = (latitude: number, longitude: number) => {
  return `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
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

  // random distance within [min-max] in m in a non-uniform way
  const r = (max - min + 1) * Math.random() ** 0.5 + min;

  const dy = r * Math.sin(theta);
  const dx = r * Math.cos(theta);

  let newLatitude = latitude + dy / DEGREE;
  let newLongitude = longitude + dx / (DEGREE * Math.cos(deg2rad(latitude)));

  const OSMInfoResponse = await fetch(
    getOSMTypeAndIdAPI(newLatitude, newLongitude),
  );

  const OSMInfo = await OSMInfoResponse.json();
  const lookupResponse = await fetch(
    lookupApi(OSMInfo.osm_type[0].toUpperCase(), OSMInfo.osm_id),
  );
  const lookupInfo = await lookupResponse.json();
  newLatitude = lookupInfo[0].lat;
  newLongitude = lookupInfo[0].lon;
  const distance = getDistanceFromLatLonInKm(
    latitude,
    longitude,
    newLatitude,
    newLongitude,
  );
  console.log("generated location that is ", distance, "km away");
  return {
    newLatitude,
    newLongitude,
    distance,
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
  distance_tier: number,
  minimum_distance = 0,
  loop = 0,
) {
  let res = await generateLocation(
    latitude,
    longitude,
    (maximum_distance / 10) * distance_tier - 5 * loop,
    theta,
    minimum_distance,
  );
  if (
    res.distance * 1000 <= minimum_distance ||
    res.distance * 1000 >= maximum_distance
  ) {
    res = await getLocationCoordinates(
      latitude,
      longitude,
      maximum_distance - 5,
      theta,
      minimum_distance,
      loop + 1,
    );
  }
  console.log(res);
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
      trip.distance_tier,
    );
    res.push({ lat: coordinates.newLatitude, lon: coordinates.newLongitude });
  }
  return res;
}
