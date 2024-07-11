import { LocationObjectCoords } from "expo-location";

const DISTANCE_LENIENCY = 0.1;

/**
 * Return a openstreetmaps 'lookup' API url
 * See https://nominatim.org/release-docs/latest/api/Lookup/ for more info
 */
const wait = async (time: number) => {
  setTimeout(() => {}, time);
};

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
    console.log("max", max);
    return { distance: 0, newLatitude: 0, newLongitude: 0 };
  }

  // earth radius in km
  const EARTH_RADIUS = 6371;

  // 1° latitude in meters
  const DEGREE = ((EARTH_RADIUS * 2 * Math.PI) / 360) * 1000;

  const randomNumber = Math.random();
  console.log(randomNumber);
  // random distance within [min-max] in m in a non-uniform way

  const r = (max - min) * randomNumber ** 0.5 + min;
  console.log(
    "Generated distance",
    r,
    `from (${max} - ${min}) * ${randomNumber} ** 0.5 + ${min}`,
  );

  const dy = r * Math.sin(theta);
  const dx = r * Math.cos(theta);

  let newLatitude = latitude + dy / DEGREE;
  let newLongitude = longitude + dx / (DEGREE * Math.cos(deg2rad(latitude)));

  console.log("generated coordinates:", newLatitude, newLongitude);
  try {
    await wait(1000);
    const OSMInfoResponse = await fetch(
      getOSMTypeAndIdAPI(newLatitude, newLongitude),
    );

    const OSMInfo = await OSMInfoResponse.json();
    const lookupResponse = await fetch(
      lookupApi(OSMInfo.osm_type[0].toUpperCase(), OSMInfo.osm_id),
    );
    const lookupInfo = await lookupResponse.json();
    console.log("lookupInfo", lookupInfo);
    console.log(newLatitude, "is now", lookupInfo[0].lat);
    console.log(newLongitude, "is now", lookupInfo[0].lon);

    newLatitude = parseFloat(lookupInfo[0].lat);
    newLongitude = parseFloat(lookupInfo[0].lon);
    const distance = getDistanceFromLatLonInKm(
      latitude,
      longitude,
      newLatitude,
      newLongitude,
    );
    return {
      newLatitude,
      newLongitude,
      distance,
    };
  } catch (e) {
    console.log(e);
    return { distance: 0, newLatitude: 0, newLongitude: 0 };
  }
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
  console.log(
    `distance between ${lat1},${lon1} and ${lat2},${lon2} is ${d} km`,
  );
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

/**
 * Returns a set of coordinates based on input. If resulting coordinates are farther than maximum_distance or nearer than minimum_distance, coordinates get rolled again
 */
async function getLocationCoordinates(
  latitude: number,
  longitude: number,
  maximum_distance: number,
  theta: number,
  distance_tier: number,
  minimum_distance = 0,
) {
  console.log(`${maximum_distance} / 10 * ${distance_tier}`);
  let maxDist = (maximum_distance / 10) * distance_tier;
  if (maxDist < minimum_distance)
    maxDist = minimum_distance * (1 + DISTANCE_LENIENCY);
  let res = await generateLocation(
    latitude,
    longitude,
    maxDist,
    theta,
    minimum_distance,
  );
  if (
    res.distance * 1000 * 1 + DISTANCE_LENIENCY <= minimum_distance ||
    res.distance * 1000 * 1 - DISTANCE_LENIENCY >= maximum_distance
  ) {
    console.log(
      "error generating, expected values between",
      minimum_distance,
      maximum_distance,
      "got:",
      res.distance * 1000,
    );
    res = await getLocationCoordinates(
      latitude,
      longitude,
      maximum_distance,
      theta,
      distance_tier,
      minimum_distance,
    );
  }
  return res;
}

export default async function getLocations(
  initialCords: LocationObjectCoords,
  maximum_distance: number,
  minimum_distance: number,
  speed_requirement: number,
  trip: {
    distance_tier: number;
    key_needed: number;
    speed_tier: number;
  },
) {
  const coordinates = await getLocationCoordinates(
    initialCords.latitude,
    initialCords.longitude,
    maximum_distance,
    Math.random() * 2 * Math.PI,
    trip.distance_tier,
    minimum_distance,
  );
  return { lat: coordinates.newLatitude, lon: coordinates.newLongitude };
}
