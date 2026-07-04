import { NextResponse } from "next/server";
import path from "node:path";
import swisseph from "swisseph";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IST_OFFSET_HOURS = 5.5;
const IST_OFFSET_MS = IST_OFFSET_HOURS * 60 * 60 * 1000;
const VIMSHOTTARI_YEAR_DAYS = 365.2425;
const DAY_MS = 24 * 60 * 60 * 1000;

type BirthInput = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  date: string;
  time: string;
  timezone: "Asia/Kolkata";
  city: string;
  country: string;
  lat: number;
  lng: number;
};

type UtcDateTime = {
  year: number;
  month: number;
  day: number;
  hour: number;
};

type BodyConfig = {
  key: PlanetKey;
  planet: PlanetName;
  id: number;
};

type PlanetKey =
  | "sun"
  | "moon"
  | "mercury"
  | "venus"
  | "mars"
  | "jupiter"
  | "saturn"
  | "rahu"
  | "ketu";

type PlanetName =
  | "Sun"
  | "Moon"
  | "Mercury"
  | "Venus"
  | "Mars"
  | "Jupiter"
  | "Saturn"
  | "Rahu"
  | "Ketu";

type SignName =
  | "Aries"
  | "Taurus"
  | "Gemini"
  | "Cancer"
  | "Leo"
  | "Virgo"
  | "Libra"
  | "Scorpio"
  | "Sagittarius"
  | "Capricorn"
  | "Aquarius"
  | "Pisces";

type ElementName = "fire" | "earth" | "air" | "water";
type ModalityName = "cardinal" | "fixed" | "mutable";
type Dignity =
  | "Exalted"
  | "Debilitated"
  | "Own Sign"
  | "Moolatrikona"
  | "Friendly"
  | "Enemy"
  | "Neutral";

type SwissPlanetResult = {
  longitude: number;
  latitude: number;
  distance: number;
  longitudeSpeed: number;
  latitudeSpeed: number;
  distanceSpeed: number;
  rflag: number;
};

type RawPlanet = {
  key: PlanetKey;
  planet: PlanetName;
  longitude: number;
  latitude: number;
  speed: number;
  retrograde: boolean;
  rawSwissResult?: SwissPlanetResult;
};

type PlanetSignal = {
  planet: PlanetName;
  sign: SignName;
  degree: number;
  longitude: number;
  house: number;
  nakshatra: string;
  pada: number;
  retrograde: boolean;
  dignity: Dignity;
  houseLord: PlanetName;
};

const SIGNS: SignName[] = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces"
];

const SIGN_LORDS: Record<SignName, PlanetName> = {
  Aries: "Mars",
  Taurus: "Venus",
  Gemini: "Mercury",
  Cancer: "Moon",
  Leo: "Sun",
  Virgo: "Mercury",
  Libra: "Venus",
  Scorpio: "Mars",
  Sagittarius: "Jupiter",
  Capricorn: "Saturn",
  Aquarius: "Saturn",
  Pisces: "Jupiter"
};

const ELEMENTS: Record<SignName, ElementName> = {
  Aries: "fire",
  Leo: "fire",
  Sagittarius: "fire",
  Taurus: "earth",
  Virgo: "earth",
  Capricorn: "earth",
  Gemini: "air",
  Libra: "air",
  Aquarius: "air",
  Cancer: "water",
  Scorpio: "water",
  Pisces: "water"
};

const MODALITIES: Record<SignName, ModalityName> = {
  Aries: "cardinal",
  Cancer: "cardinal",
  Libra: "cardinal",
  Capricorn: "cardinal",
  Taurus: "fixed",
  Leo: "fixed",
  Scorpio: "fixed",
  Aquarius: "fixed",
  Gemini: "mutable",
  Virgo: "mutable",
  Sagittarius: "mutable",
  Pisces: "mutable"
};

const NAKSHATRAS: Array<{ name: string; lord: PlanetName }> = [
  { name: "Ashwini", lord: "Ketu" },
  { name: "Bharani", lord: "Venus" },
  { name: "Krittika", lord: "Sun" },
  { name: "Rohini", lord: "Moon" },
  { name: "Mrigashira", lord: "Mars" },
  { name: "Ardra", lord: "Rahu" },
  { name: "Punarvasu", lord: "Jupiter" },
  { name: "Pushya", lord: "Saturn" },
  { name: "Ashlesha", lord: "Mercury" },
  { name: "Magha", lord: "Ketu" },
  { name: "Purva Phalguni", lord: "Venus" },
  { name: "Uttara Phalguni", lord: "Sun" },
  { name: "Hasta", lord: "Moon" },
  { name: "Chitra", lord: "Mars" },
  { name: "Swati", lord: "Rahu" },
  { name: "Vishakha", lord: "Jupiter" },
  { name: "Anuradha", lord: "Saturn" },
  { name: "Jyeshtha", lord: "Mercury" },
  { name: "Mula", lord: "Ketu" },
  { name: "Purva Ashadha", lord: "Venus" },
  { name: "Uttara Ashadha", lord: "Sun" },
  { name: "Shravana", lord: "Moon" },
  { name: "Dhanishta", lord: "Mars" },
  { name: "Shatabhisha", lord: "Rahu" },
  { name: "Purva Bhadrapada", lord: "Jupiter" },
  { name: "Uttara Bhadrapada", lord: "Saturn" },
  { name: "Revati", lord: "Mercury" }
];

const DASHA_ORDER: PlanetName[] = [
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury"
];

const DASHA_YEARS: Record<PlanetName, number> = {
  Ketu: 7,
  Venus: 20,
  Sun: 6,
  Moon: 10,
  Mars: 7,
  Rahu: 18,
  Jupiter: 16,
  Saturn: 19,
  Mercury: 17
};

const CORE_BODIES: BodyConfig[] = [
  { key: "sun", planet: "Sun", id: swisseph.SE_SUN },
  { key: "moon", planet: "Moon", id: swisseph.SE_MOON },
  { key: "mercury", planet: "Mercury", id: swisseph.SE_MERCURY },
  { key: "venus", planet: "Venus", id: swisseph.SE_VENUS },
  { key: "mars", planet: "Mars", id: swisseph.SE_MARS },
  { key: "jupiter", planet: "Jupiter", id: swisseph.SE_JUPITER },
  { key: "saturn", planet: "Saturn", id: swisseph.SE_SATURN },
  { key: "rahu", planet: "Rahu", id: swisseph.SE_MEAN_NODE }
];

const EXALTATION_SIGNS: Partial<Record<PlanetName, SignName>> = {
  Sun: "Aries",
  Moon: "Taurus",
  Mars: "Capricorn",
  Mercury: "Virgo",
  Jupiter: "Cancer",
  Venus: "Pisces",
  Saturn: "Libra"
};

const DEBILITATION_SIGNS: Partial<Record<PlanetName, SignName>> = {
  Sun: "Libra",
  Moon: "Scorpio",
  Mars: "Cancer",
  Mercury: "Pisces",
  Jupiter: "Capricorn",
  Venus: "Virgo",
  Saturn: "Aries"
};

const OWN_SIGNS: Partial<Record<PlanetName, SignName[]>> = {
  Sun: ["Leo"],
  Moon: ["Cancer"],
  Mars: ["Aries", "Scorpio"],
  Mercury: ["Gemini", "Virgo"],
  Jupiter: ["Sagittarius", "Pisces"],
  Venus: ["Taurus", "Libra"],
  Saturn: ["Capricorn", "Aquarius"]
};

const MOOLATRIKONA_RANGES: Partial<
  Record<PlanetName, { sign: SignName; min: number; max: number }>
> = {
  Sun: { sign: "Leo", min: 0, max: 20 },
  Moon: { sign: "Taurus", min: 4, max: 30 },
  Mars: { sign: "Aries", min: 0, max: 12 },
  Mercury: { sign: "Virgo", min: 16, max: 20 },
  Jupiter: { sign: "Sagittarius", min: 0, max: 10 },
  Venus: { sign: "Libra", min: 0, max: 15 },
  Saturn: { sign: "Aquarius", min: 0, max: 20 }
};

const NATURAL_RELATIONSHIPS: Partial<
  Record<PlanetName, { friendly: PlanetName[]; enemy: PlanetName[] }>
> = {
  Sun: { friendly: ["Moon", "Mars", "Jupiter"], enemy: ["Venus", "Saturn"] },
  Moon: { friendly: ["Sun", "Mercury"], enemy: [] },
  Mars: { friendly: ["Sun", "Moon", "Jupiter"], enemy: ["Mercury"] },
  Mercury: { friendly: ["Sun", "Venus"], enemy: ["Moon"] },
  Jupiter: { friendly: ["Sun", "Moon", "Mars"], enemy: ["Mercury", "Venus"] },
  Venus: { friendly: ["Mercury", "Saturn"], enemy: ["Sun", "Moon"] },
  Saturn: { friendly: ["Mercury", "Venus"], enemy: ["Sun", "Moon", "Mars"] }
};

const GRAHA_DRISHTI: Partial<Record<PlanetName, number[]>> = {
  Sun: [7],
  Moon: [7],
  Mercury: [7],
  Venus: [7],
  Mars: [4, 7, 8],
  Jupiter: [5, 7, 9],
  Saturn: [3, 7, 10]
};

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function normalizeLongitude(longitude: number) {
  return ((longitude % 360) + 360) % 360;
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function parseDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    throw new Error("date must use YYYY-MM-DD format.");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!isValidCalendarDate(year, month, day)) {
    throw new Error("Birth date must be a valid calendar date.");
  }

  return { year, month, day };
}

function parseTime(value: string) {
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value);

  if (!match) {
    throw new Error("time must use HH:mm format.");
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const second = match[3] ? Number(match[3]) : 0;

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) {
    throw new Error("time must be a valid 24-hour IST time.");
  }

  return { hour, minute, second };
}

function parseLegacyDecimalHour(value: number) {
  if (value < 0 || value >= 24) {
    throw new Error("hour must be an IST decimal hour from 0 up to, but not including, 24.");
  }

  const hour = Math.floor(value);
  const minute = Math.round((value - hour) * 60);

  return minute === 60 ? { hour: hour + 1, minute: 0, second: 0 } : { hour, minute, second: 0 };
}

function parseBirthInput(searchParams: URLSearchParams): BirthInput {
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new Error("Missing or invalid query parameter: lat");
  }

  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    throw new Error("Missing or invalid query parameter: lng");
  }

  const city = searchParams.get("city") ?? "";
  const country = searchParams.get("country") ?? "";
  const timezone = (searchParams.get("timezone") ?? "Asia/Kolkata") as string;

  if (timezone !== "Asia/Kolkata") {
    throw new Error("Only timezone=Asia/Kolkata is supported for this V0 endpoint.");
  }

  const dateParam = searchParams.get("date");
  const timeParam = searchParams.get("time");

  if (dateParam && timeParam) {
    const date = parseDate(dateParam);
    const time = parseTime(timeParam);

    return {
      ...date,
      ...time,
      date: dateParam,
      time: formatTime(time.hour, time.minute),
      timezone,
      city,
      country,
      lat,
      lng
    };
  }

  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month"));
  const day = Number(searchParams.get("day"));
  const hourDecimal = Number(searchParams.get("hour"));

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hourDecimal)
  ) {
    throw new Error("Use date=YYYY-MM-DD&time=HH:mm&lat=...&lng=...");
  }

  if (!isValidCalendarDate(year, month, day)) {
    throw new Error("Birth date must be a valid calendar date.");
  }

  const time = parseLegacyDecimalHour(hourDecimal);
  const date = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(
    day
  ).padStart(2, "0")}`;

  return {
    year,
    month,
    day,
    ...time,
    date,
    time: formatTime(time.hour, time.minute),
    timezone,
    city,
    country,
    lat,
    lng
  };
}

function isValidCalendarDate(year: number, month: number, day: number) {
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function convertIstToUtc({ year, month, day, hour, minute, second }: BirthInput): UtcDateTime {
  const localTimestamp = Date.UTC(year, month - 1, day, hour, minute, second, 0);
  const utcDate = new Date(localTimestamp - IST_OFFSET_MS);
  const utcHour =
    utcDate.getUTCHours() +
    utcDate.getUTCMinutes() / 60 +
    utcDate.getUTCSeconds() / 3600 +
    utcDate.getUTCMilliseconds() / 3600000;

  return {
    year: utcDate.getUTCFullYear(),
    month: utcDate.getUTCMonth() + 1,
    day: utcDate.getUTCDate(),
    hour: utcHour
  };
}

function utcDateFromParts(parts: UtcDateTime) {
  const hour = Math.floor(parts.hour);
  const minute = Math.round((parts.hour - hour) * 60);

  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, hour, minute, 0, 0));
}

function longitudeToSignDegree(longitude: number) {
  const normalized = normalizeLongitude(longitude);
  const signIndex = Math.floor(normalized / 30);

  return {
    sign: SIGNS[signIndex],
    degree: round(normalized - signIndex * 30)
  };
}

function getNakshatra(longitude: number) {
  const normalized = normalizeLongitude(longitude);
  const nakshatraSpan = 360 / 27;
  const padaSpan = nakshatraSpan / 4;
  const index = Math.min(Math.floor(normalized / nakshatraSpan), NAKSHATRAS.length - 1);
  const degreeInNakshatra = normalized - index * nakshatraSpan;

  return {
    nakshatra: NAKSHATRAS[index].name,
    lord: NAKSHATRAS[index].lord,
    pada: Math.floor(degreeInNakshatra / padaSpan) + 1,
    degreeInNakshatra
  };
}

function getWholeSignHouse(planetSign: SignName, ascendantSign: SignName) {
  const ascendantIndex = SIGNS.indexOf(ascendantSign);
  const planetIndex = SIGNS.indexOf(planetSign);

  return ((planetIndex - ascendantIndex + 12) % 12) + 1;
}

function getDignity(planet: PlanetName, sign: SignName, degree: number): Dignity {
  if (planet === "Rahu" || planet === "Ketu") {
    return "Neutral";
  }

  if (EXALTATION_SIGNS[planet] === sign) {
    return "Exalted";
  }

  if (DEBILITATION_SIGNS[planet] === sign) {
    return "Debilitated";
  }

  const moolatrikona = MOOLATRIKONA_RANGES[planet];

  if (
    moolatrikona &&
    moolatrikona.sign === sign &&
    degree >= moolatrikona.min &&
    degree < moolatrikona.max
  ) {
    return "Moolatrikona";
  }

  if (OWN_SIGNS[planet]?.includes(sign)) {
    return "Own Sign";
  }

  const signLord = SIGN_LORDS[sign];
  const relationships = NATURAL_RELATIONSHIPS[planet];

  if (relationships?.friendly.includes(signLord)) {
    return "Friendly";
  }

  if (relationships?.enemy.includes(signLord)) {
    return "Enemy";
  }

  return "Neutral";
}

function angularDistance(longitudeA: number, longitudeB: number) {
  const diff = Math.abs(normalizeLongitude(longitudeA) - normalizeLongitude(longitudeB));
  return diff > 180 ? 360 - diff : diff;
}

function getMinimalAngularAspect(longitudeA: number, longitudeB: number) {
  const angle = round(angularDistance(longitudeA, longitudeB));
  const conjunctionOrb = Math.abs(angle);
  const oppositionOrb = Math.abs(angle - 180);
  const trineOrb = Math.abs(angle - 120);

  if (conjunctionOrb <= 8) {
    return { aspect: "conjunction", angle, orb: round(conjunctionOrb) };
  }

  if (oppositionOrb <= 8) {
    return { aspect: "opposition", angle, orb: round(oppositionOrb) };
  }

  if (trineOrb <= 8) {
    return { aspect: "trine", angle, orb: round(trineOrb) };
  }

  return { aspect: "none", angle, orb: null };
}

function findRawPlanet(planets: RawPlanet[], planet: PlanetName) {
  const match = planets.find((item) => item.planet === planet);

  if (!match) {
    throw new Error(`Missing ${planet} calculation.`);
  }

  return match;
}

function countValues<T extends string>(values: T[], initial: Record<T, number>) {
  return values.reduce<Record<T, number>>(
    (counts, value) => ({
      ...counts,
      [value]: counts[value] + 1
    }),
    initial
  );
}

function dominantKeys<T extends string>(counts: Record<T, number>) {
  const maxCount = Math.max(...(Object.values(counts) as number[]));

  if (maxCount <= 0) {
    return [];
  }

  return Object.entries(counts)
    .filter(([, count]) => count === maxCount)
    .map(([key]) => key as T);
}

function addYears(date: Date, years: number) {
  return new Date(date.getTime() + years * VIMSHOTTARI_YEAR_DAYS * DAY_MS);
}

function getDashaSequenceFrom(startPlanet: PlanetName) {
  const startIndex = DASHA_ORDER.indexOf(startPlanet);

  return [...DASHA_ORDER.slice(startIndex), ...DASHA_ORDER.slice(0, startIndex)];
}

function findPeriod(
  start: Date,
  durationYears: number,
  sequenceStart: PlanetName,
  asOfDate: Date
) {
  let periodStart = start;

  for (const planet of getDashaSequenceFrom(sequenceStart)) {
    const periodYears = (durationYears * DASHA_YEARS[planet]) / 120;
    const periodEnd = addYears(periodStart, periodYears);

    if (asOfDate >= periodStart && asOfDate < periodEnd) {
      return { planet, start: periodStart, end: periodEnd, durationYears: periodYears };
    }

    periodStart = periodEnd;
  }

  const fallbackPlanet = getDashaSequenceFrom(sequenceStart).at(-1) ?? sequenceStart;

  return {
    planet: fallbackPlanet,
    start: periodStart,
    end: periodStart,
    durationYears: 0
  };
}

function calculateVimshottari(
  birthUtcDate: Date,
  moonLongitude: number,
  asOfDate: Date
) {
  const nakshatra = getNakshatra(moonLongitude);
  const firstPlanet = nakshatra.lord;
  const nakshatraSpan = 360 / 27;
  const elapsedRatio = nakshatra.degreeInNakshatra / nakshatraSpan;
  const firstDurationYears = DASHA_YEARS[firstPlanet];
  const mahaStart = addYears(birthUtcDate, -firstDurationYears * elapsedRatio);
  const mahaSequence = getDashaSequenceFrom(firstPlanet);
  let periodStart = mahaStart;

  for (let cycle = 0; cycle < 3; cycle += 1) {
    for (let index = 0; index < mahaSequence.length; index += 1) {
      const planet = mahaSequence[index];
      const periodEnd = addYears(periodStart, DASHA_YEARS[planet]);

      if (asOfDate >= periodStart && asOfDate < periodEnd) {
        const antardasha = findPeriod(periodStart, DASHA_YEARS[planet], planet, asOfDate);
        const pratyantar = findPeriod(
          antardasha.start,
          antardasha.durationYears,
          antardasha.planet,
          asOfDate
        );
        const nextPlanet = mahaSequence[(index + 1) % mahaSequence.length];

        return {
          current: {
            mahadasha: planet,
            antardasha: antardasha.planet,
            pratyantar: pratyantar.planet
          },
          next: {
            mahadasha: nextPlanet,
            starts: formatDate(periodEnd)
          }
        };
      }

      periodStart = periodEnd;
    }
  }

  return {
    current: {
      mahadasha: "",
      antardasha: "",
      pratyantar: ""
    },
    next: {
      mahadasha: "",
      starts: ""
    }
  };
}

function calculateBody(julianDay: number, body: BodyConfig): Promise<RawPlanet> {
  const flags = swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED | swisseph.SEFLG_SIDEREAL;

  return new Promise<RawPlanet>((resolve, reject) => {
    swisseph.swe_calc_ut(julianDay, body.id, flags, (result) => {
      if ("error" in result) {
        reject(new Error(`${body.planet}: ${result.error}`));
        return;
      }

      if (
        !("longitude" in result) ||
        !("latitude" in result) ||
        !("longitudeSpeed" in result) ||
        !("distance" in result) ||
        !("latitudeSpeed" in result) ||
        !("distanceSpeed" in result) ||
        !("rflag" in result)
      ) {
        reject(new Error(`${body.planet}: Swiss Ephemeris returned an incomplete result.`));
        return;
      }

      resolve({
        key: body.key,
        planet: body.planet,
        longitude: normalizeLongitude(result.longitude),
        latitude: result.latitude,
        speed: result.longitudeSpeed,
        retrograde: result.longitudeSpeed < 0,
        rawSwissResult: result
      });
    });
  });
}

function calculateAscendant(julianDay: number, lat: number, lng: number) {
  return new Promise<number>((resolve, reject) => {
    swisseph.swe_houses_ex(
      julianDay,
      swisseph.SEFLG_SIDEREAL,
      lat,
      lng,
      "W",
      (result) => {
        if ("error" in result) {
          reject(new Error(`Ascendant: ${result.error}`));
          return;
        }

        resolve(normalizeLongitude(result.ascendant));
      }
    );
  });
}

function buildKetu(rahu: RawPlanet): RawPlanet {
  return {
    key: "ketu",
    planet: "Ketu",
    longitude: normalizeLongitude(rahu.longitude + 180),
    latitude: 0,
    speed: rahu.speed,
    retrograde: rahu.retrograde
  };
}

function buildPlanetSignals(rawPlanets: RawPlanet[], ascendantSign: SignName) {
  return rawPlanets.map<PlanetSignal>((planet) => {
    const signDegree = longitudeToSignDegree(planet.longitude);
    const nakshatra = getNakshatra(planet.longitude);

    return {
      planet: planet.planet,
      sign: signDegree.sign,
      degree: signDegree.degree,
      longitude: planet.longitude,
      house: getWholeSignHouse(signDegree.sign, ascendantSign),
      nakshatra: nakshatra.nakshatra,
      pada: nakshatra.pada,
      retrograde: planet.retrograde,
      dignity: getDignity(planet.planet, signDegree.sign, signDegree.degree),
      houseLord: SIGN_LORDS[signDegree.sign]
    };
  });
}

function buildHouses(planetSignals: PlanetSignal[], ascendantSign: SignName) {
  const ascendantIndex = SIGNS.indexOf(ascendantSign);

  return Array.from({ length: 12 }, (_, index) => {
    const house = index + 1;
    const sign = SIGNS[(ascendantIndex + index) % 12];

    return {
      house,
      sign,
      lord: SIGN_LORDS[sign],
      occupants: planetSignals
        .filter((planet) => planet.house === house)
        .map((planet) => planet.planet)
    };
  });
}

function buildRelationships(planetSignals: PlanetSignal[], ascendantLongitude: number) {
  const conjunctions: Array<{ between: [PlanetName, PlanetName]; orb: number }> = [];
  const oppositions: Array<{ between: [PlanetName, PlanetName]; orb: number }> = [];
  const psychologicalAngles: Array<{
    between: [string, string];
    angle: number;
    aspect: string;
    orb: number | null;
  }> = [];

  for (let leftIndex = 0; leftIndex < planetSignals.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < planetSignals.length; rightIndex += 1) {
      const left = planetSignals[leftIndex];
      const right = planetSignals[rightIndex];
      const angle = angularDistance(left.longitude, right.longitude);
      const isNodeAxis =
        (left.planet === "Rahu" && right.planet === "Ketu") ||
        (left.planet === "Ketu" && right.planet === "Rahu");

      if (left.sign === right.sign && angle <= 8) {
        conjunctions.push({ between: [left.planet, right.planet], orb: round(angle) });
      }

      if (!isNodeAxis && Math.abs(angle - 180) <= 8) {
        oppositions.push({
          between: [left.planet, right.planet],
          orb: round(Math.abs(angle - 180))
        });
      }
    }
  }

  const grahaDrishti = planetSignals.flatMap((fromPlanet) => {
    const aspects = GRAHA_DRISHTI[fromPlanet.planet] ?? [];

    return aspects.flatMap((aspect) => {
      const targetHouse = ((fromPlanet.house + aspect - 2) % 12) + 1;

      return planetSignals
        .filter((toPlanet) => toPlanet.house === targetHouse && toPlanet.planet !== fromPlanet.planet)
        .map((toPlanet) => ({
          from: fromPlanet.planet,
          to: toPlanet.planet,
          aspect
        }));
    });
  });

  const sun = planetSignals.find((planet) => planet.planet === "Sun");
  const moon = planetSignals.find((planet) => planet.planet === "Moon");

  if (sun && moon) {
    psychologicalAngles.push({
      between: ["Sun", "Moon"],
      ...getMinimalAngularAspect(sun.longitude, moon.longitude)
    });
  }

  if (sun) {
    psychologicalAngles.push({
      between: ["Sun", "Ascendant"],
      ...getMinimalAngularAspect(sun.longitude, ascendantLongitude)
    });
  }

  if (moon) {
    psychologicalAngles.push({
      between: ["Moon", "Ascendant"],
      ...getMinimalAngularAspect(moon.longitude, ascendantLongitude)
    });
  }

  return {
    conjunctions,
    oppositions,
    grahaDrishti,
    psychologicalAngles
  };
}

function buildDistribution(planetSignals: PlanetSignal[]) {
  const distributionPlanets = planetSignals.filter(
    (planet) => planet.planet !== "Rahu" && planet.planet !== "Ketu"
  );

  return {
    elements: countValues(
      distributionPlanets.map((planet) => ELEMENTS[planet.sign]),
      { fire: 0, earth: 0, air: 0, water: 0 }
    ),
    modalities: countValues(
      distributionPlanets.map((planet) => MODALITIES[planet.sign]),
      { cardinal: 0, fixed: 0, mutable: 0 }
    )
  };
}

function buildDerived(planetSignals: PlanetSignal[], houses: ReturnType<typeof buildHouses>) {
  const signCounts = countValues(
    planetSignals.map((planet) => planet.sign),
    Object.fromEntries(SIGNS.map((sign) => [sign, 0])) as Record<SignName, number>
  );
  const houseCounts = Object.fromEntries(
    houses.map((house) => [house.house, house.occupants.length])
  ) as Record<number, number>;
  const distribution = buildDistribution(planetSignals);
  const ascendantLord = houses[0].lord;

  const dominantHouses = houses
    .filter((house) => house.occupants.length > 0)
    .filter((house) => house.occupants.length === Math.max(...Object.values(houseCounts)))
    .map((house) => house.house);
  const dominantSigns = dominantKeys(signCounts);
  const dominantElements = dominantKeys(distribution.elements);
  const dominantModalities = dominantKeys(distribution.modalities);
  const stelliums = houses
    .filter((house) => house.occupants.length >= 3)
    .map((house) => ({ house: house.house, planets: house.occupants }));

  const dignityScore: Record<Dignity, number> = {
    Exalted: 4,
    Moolatrikona: 3,
    "Own Sign": 3,
    Friendly: 1,
    Neutral: 0,
    Enemy: -1,
    Debilitated: -3
  };
  const dominantPlanetScores = planetSignals.map((planet) => {
    const angularBonus = [1, 4, 7, 10].includes(planet.house) ? 2 : 0;
    const ascendantLordBonus = planet.planet === ascendantLord ? 3 : 0;
    const clusterBonus = signCounts[planet.sign] >= 3 || houseCounts[planet.house] >= 3 ? 1 : 0;

    return {
      planet: planet.planet,
      score: dignityScore[planet.dignity] + angularBonus + ascendantLordBonus + clusterBonus
    };
  });
  const maxPlanetScore = Math.max(...dominantPlanetScores.map((item) => item.score));

  return {
    dominantPlanets: dominantPlanetScores
      .filter((item) => item.score === maxPlanetScore && item.score > 0)
      .map((item) => item.planet),
    dominantHouses,
    dominantSigns,
    dominantElements,
    dominantModalities,
    stelliums,
    emptyHouses: houses.filter((house) => house.occupants.length === 0).map((house) => house.house)
  };
}

function buildInterpreterPayload({
  birthInput,
  utcBirthDetails,
  julianDay,
  ascendantLongitude,
  rawPlanets,
  asOfDate
}: {
  birthInput: BirthInput;
  utcBirthDetails: UtcDateTime;
  julianDay: number;
  ascendantLongitude: number;
  rawPlanets: RawPlanet[];
  asOfDate: Date;
}) {
  const ascendantSignDegree = longitudeToSignDegree(ascendantLongitude);
  const ascendantNakshatra = getNakshatra(ascendantLongitude);
  const planets = buildPlanetSignals(rawPlanets, ascendantSignDegree.sign);
  const houses = buildHouses(planets, ascendantSignDegree.sign);
  const sun = planets.find((planet) => planet.planet === "Sun");
  const moon = planets.find((planet) => planet.planet === "Moon");

  if (!sun || !moon) {
    throw new Error("Sun and Moon calculations are required for identity and dasha.");
  }

  const timing = calculateVimshottari(
    utcDateFromParts(utcBirthDetails),
    findRawPlanet(rawPlanets, "Moon").longitude,
    asOfDate
  );

  return {
    metadata: {
      version: "1.0",
      zodiac: "sidereal",
      ayanamsha: "lahiri",
      houseSystem: "whole_sign",
      nodeType: "mean",
      dashaSystem: "vimshottari",
      julianDay,
      asOfDate: formatDate(asOfDate)
    },
    birth: {
      date: birthInput.date,
      time: birthInput.time,
      timezone: birthInput.timezone,
      location: {
        city: birthInput.city,
        country: birthInput.country,
        latitude: birthInput.lat,
        longitude: birthInput.lng
      }
    },
    identity: {
      ascendant: {
        sign: ascendantSignDegree.sign,
        degree: ascendantSignDegree.degree,
        nakshatra: ascendantNakshatra.nakshatra,
        pada: ascendantNakshatra.pada,
        lord: SIGN_LORDS[ascendantSignDegree.sign]
      },
      sun: {
        sign: sun.sign,
        degree: sun.degree,
        house: sun.house,
        nakshatra: sun.nakshatra,
        pada: sun.pada
      },
      moon: {
        sign: moon.sign,
        degree: moon.degree,
        house: moon.house,
        nakshatra: moon.nakshatra,
        pada: moon.pada
      }
    },
    planets: planets.map(({ longitude, ...planet }) => planet),
    houses,
    relationships: buildRelationships(planets, ascendantLongitude),
    distribution: buildDistribution(planets),
    derived: buildDerived(planets, houses),
    timing
  };
}

function parseAsOfDate(searchParams: URLSearchParams) {
  const asOfDateParam = searchParams.get("asOfDate");

  if (!asOfDateParam) {
    return new Date();
  }

  const date = parseDate(asOfDateParam);

  return new Date(Date.UTC(date.year, date.month - 1, date.day, 0, 0, 0, 0));
}

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const birthInput = parseBirthInput(searchParams);
    const utcBirthDetails = convertIstToUtc(birthInput);
    const asOfDate = parseAsOfDate(searchParams);
    const ephemerisPath = path.join(process.cwd(), "public/ephe");

    swisseph.swe_set_ephe_path(ephemerisPath);
    swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);

    const julianDay = swisseph.swe_julday(
      utcBirthDetails.year,
      utcBirthDetails.month,
      utcBirthDetails.day,
      utcBirthDetails.hour,
      swisseph.SE_GREG_CAL
    );

    const calculatedPlanets = await Promise.all(
      CORE_BODIES.map((body) => calculateBody(julianDay, body))
    );
    const rahu = findRawPlanet(calculatedPlanets, "Rahu");
    const rawPlanets = [...calculatedPlanets, buildKetu(rahu)];
    const ascendantLongitude = await calculateAscendant(julianDay, birthInput.lat, birthInput.lng);
    const payload = buildInterpreterPayload({
      birthInput,
      utcBirthDetails,
      julianDay,
      ascendantLongitude,
      rawPlanets,
      asOfDate
    });

    if (searchParams.get("includeRaw") === "true") {
      return NextResponse.json({
        ...payload,
        debug: {
          ephemerisPath,
          inputTimeZone: "IST (UTC+05:30)",
          calculationTimeZone: "UTC",
          utcInputUsedForSwissEphemeris: utcBirthDetails,
          rawPlanets
        }
      });
    }

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to calculate chart signals.",
        requiredParams: ["date", "time", "lat", "lng"]
      },
      { status: 400 }
    );
  }
}
