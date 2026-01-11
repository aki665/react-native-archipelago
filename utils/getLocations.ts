import { LocationObjectCoords } from "expo-location";
import { locationInfo } from "../components/LocationInfoPopup";

const DISTANCE_LENIENCY = 0.1;

/**
 * Wait provided amount of time (in milliseconds)
 */
const wait = async (time: number) => {
  setTimeout(() => {
    return;
  }, time);
};

/**
 * Return a openstreetmaps 'lookup' API url
 * See https://nominatim.org/release-docs/latest/api/Lookup/ for more info
 */
const lookupApi = (type: string, id: number) => {
  return `https://nominatim.openstreetmap.org/lookup?osm_ids=${type}${id}&extratags=1&format=json`;
};

/**
 * Return a openstreetmaps reverse geocoding API url
 * See https://nominatim.org/release-docs/latest/api/Reverse/ for more info
 */
const getOSMTypeAndIdAPI = (
  latitude: number,
  longitude: number,
  zoom: number,
) => {
  return `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&zoom=${zoom}&addressdetails=1&extratags=1&format=json`;
};

const fetchOverpassInfo = async (
  latitude: number,
  longitude: number,
  bannedLocationString: string,
) => {
  console.log("getting overpass info from lat lon:", latitude, longitude);
  const query = `[out:json];
  way(around:200, ${latitude},${longitude})->.a;
  (
    way.a["tracktype"="grade1"];
    way.a["tracktype"="grade2"];
    way.a["tracktype"="grade3"];
    way.a["highway"="residential"];
    way.a["highway"="living_street"];
    way.a["highway"="pedestrian"];
    way.a["highway"="track"];
    way.a["highway"="footway"];
    way.a["highway"="bridleway"];
    way.a["highway"="steps"];
    way.a["highway"="cycleway"];
    way.a["highway"="service"];
    way.a["highway"="secondary"]["maxspeed:type"~":urban"];
    way.a["highway"="tertiary"]["maxspeed:type"~":urban"];
    way.a["highway"="secondary"]["maxspeed"~"^[0-5][0-9]?$"];
    way.a["highway"="tertiary"]["maxspeed"~"^[0-5][0-9]?$"];
    way.a["highway"="secondary"]["maxspeed"~"^[0-3][0-9]? mph$"];
    way.a["highway"="tertiary"]["maxspeed"~"^[0-3][0-9]? mph$"];
    ${bannedLocationString}
  );
  >;
  out skel;`;
  const data = await fetch("https://overpass.private.coffee/api/interpreter", {
    method: "POST",
    body: "data=" + encodeURIComponent(query),
    referrer: "com.aki665.archipelago",
    headers: { "user-agent": "archipela-go/0.7.0" },
  });
  const res: {
    elements: [{ type: string; id: number; lat: number; lon: number }];
  } = await data.json();
  return res.elements;
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
async function generateLocationOverpass(
  latitude: number,
  longitude: number,
  max: number,
  theta: number,
  zoom: number,
  bannedLocationString: string,
  min = 0,
) {
  if (min > max) {
    console.log("max", max);
    return { distance: 0, newLatitude: 0, newLongitude: 0, osmID: "0" };
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
    await wait(125);
    const res = await fetchOverpassInfo(
      newLatitude,
      newLongitude,
      bannedLocationString,
    );

    const coords = res[0];
    if (coords == null)
      return { distance: 0, newLatitude: 0, newLongitude: 0, osmID: "0" };

    console.log("coords", coords);
    console.log(newLatitude, "is now", coords.lat);
    console.log(newLongitude, "is now", coords.lon);

    newLatitude = coords.lat;
    newLongitude = coords.lon;
    const osmID = coords.type[0].toUpperCase() + coords.id;
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
      osmID,
    };
  } catch (e) {
    console.log(e);
    return { distance: 0, newLatitude: 0, newLongitude: 0, osmID: "0" };
  }
}

// See https://stackoverflow.com/a/27943/10975709
export function getDistanceFromLatLonInKm(
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

/**Calculates theta and handles max radians being smaller that min radians
 * Also has to fix the crimes committed by the circular slider component.
 */
function calculateTheta(minRadian: number, maxRadian: number) {
  console.log(
    "calculating theta from minRadian",
    minRadian,
    "and maxRadian",
    maxRadian,
  );
  /** 
  Transform the radians start at the correct angle (0 rads) instead of 90 degrees (PI/2 rads)
  and make the circle go in the right direction (counter clockwise instead of clockwise).
  Also known as "fixing the crimes committed by the circular slider component"
  */
  const fixedMax = Math.abs(minRadian - Math.PI * 2) + Math.PI / 2;
  const fixedMin = Math.abs(maxRadian - Math.PI * 2) + Math.PI / 2;
  console.log("fixedMin", fixedMin);
  console.log("fixedMax", fixedMax);

  if (fixedMin < fixedMax) {
    const theta = Math.random() * (fixedMax - fixedMin) + fixedMin;
    console.log("generated theta", theta);
    return theta;
  } else {
    console.log("minRadian is higher than maxRadian.");
    const maxCircleRads = 2 * Math.PI;
    const highRandom = Math.random() * (maxCircleRads - fixedMin) + fixedMin;
    const lowRandom = Math.random() * fixedMax;
    const isLow = Math.random() < 0.5;
    console.log(
      "generated two thetas.",
      lowRandom,
      highRandom,
      "\nReturning",
      isLow ? lowRandom : highRandom,
    );
    return isLow ? lowRandom : highRandom;
  }
}

/**
 * Returns a set of coordinates based on input. If resulting coordinates are farther than maximum_distance or nearer than minimum_distance, coordinates get rolled again
 */
async function getLocationCoordinates(
  latitude: number,
  longitude: number,
  maximum_distance: number,
  distance_tier: number,
  useNearZoom: boolean,
  minRadian: number,
  maxRadian: number,
  bannedLocationString: string,
  minimum_distance = 0,
  correction = 0,
  loop_count = 0,
): Promise<{
  newLatitude: number;
  newLongitude: number;
  distance: number;
  osmID: string;
}> {
  console.log(`${maximum_distance} / 10 * ${distance_tier}`);
  let maxDist = (maximum_distance / 10) * distance_tier;
  let minDist = minimum_distance;
  if (correction > 0) maxDist = maxDist - correction;
  else if (correction < 0) minDist = minDist - correction;
  if (maxDist < minimum_distance)
    maxDist = minimum_distance * (1 + DISTANCE_LENIENCY);
  if (minDist > maximum_distance)
    minDist = maximum_distance * (1 - DISTANCE_LENIENCY);
  const zoom = loop_count > 1 || useNearZoom ? 18 : 17;

  const theta = calculateTheta(minRadian, maxRadian);
  let res = await generateLocationOverpass(
    latitude,
    longitude,
    maxDist,
    theta,
    zoom,
    bannedLocationString,
    minDist,
  );
  if (res.osmID === "0") {
    res = await getLocationCoordinates(
      latitude,
      longitude,
      maximum_distance,
      distance_tier,
      useNearZoom,
      minRadian,
      maxRadian,
      bannedLocationString,
      minimum_distance,
      correction,
      loop_count,
    );
  }
  const calculatedResult = Math.round(
    res.distance * 1000 * 1 + DISTANCE_LENIENCY,
  );
  if (
    (calculatedResult < minimum_distance ||
      calculatedResult > maximum_distance) &&
    loop_count > 5
  ) {
    console.log(
      "error generating, expected values between",
      minimum_distance,
      maximum_distance,
      "got:",
      res.distance * 1000,
    );
    let cor = correction;
    if (calculatedResult <= minimum_distance) {
      cor += minimum_distance - calculatedResult;
    } else if (calculatedResult >= maximum_distance) {
      cor += maximum_distance - calculatedResult;
    }
    console.log("correction", cor);
    res = await getLocationCoordinates(
      latitude,
      longitude,
      maximum_distance,
      distance_tier,
      useNearZoom,
      minRadian,
      maxRadian,
      bannedLocationString,
      minimum_distance,
      cor,
      loop_count + 1,
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
  useNearZoom: boolean,
  maxRadian: number,
  minRadian: number,
  bannedLocationString: string,
) {
  const coordinates = await getLocationCoordinates(
    initialCords.latitude,
    initialCords.longitude,
    maximum_distance,
    trip.distance_tier,
    useNearZoom,
    minRadian,
    maxRadian,
    bannedLocationString,
    minimum_distance,
  );
  return {
    lat: coordinates.newLatitude,
    lon: coordinates.newLongitude,
    osmID: coordinates.osmID,
    duplicate: false,
  };
}
