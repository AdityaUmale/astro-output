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
  timeAccuracy: "exact" | "approximate" | "unknown";
  uncertaintyMinutes: number | null;
  timeSource: string;
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

type Dignity =
  | "Exalted"
  | "Debilitated"
  | "Own Sign"
  | "Moolatrikona"
  | "Friendly"
  | "Enemy"
  | "Neutral";
type FunctionalNature = "benefic" | "malefic" | "mixed" | "neutral" | "yogakaraka";
type BalaadiAvastha = "Bala" | "Kumara" | "Yuva" | "Vriddha" | "Mrita";
type StrengthLevel = "strong" | "medium" | "weak";

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
  rulesHouses: number[];
  functionalNature: FunctionalNature;
  state: {
    retrograde: boolean;
    combust: boolean;
    exalted: boolean;
    debilitated: boolean;
    ownSign: boolean;
    moolatrikona: boolean;
    neechaBhanga: boolean;
    neechaBhangaConditions: string[];
    balaadiAvastha: BalaadiAvastha;
  };
  strength: {
    model: "dignity_state_v0";
    level: StrengthLevel;
    score: number;
    factors: string[];
  };
};

type PlanetBaseSignal = Omit<
  PlanetSignal,
  "rulesHouses" | "functionalNature" | "state" | "strength"
>;

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

// BPHS combustion limits in degrees; retrograde limits differ where specified.
const COMBUSTION_LIMITS: Partial<
  Record<PlanetName, { direct: number; retrograde: number }>
> = {
  Moon: { direct: 12, retrograde: 12 },
  Mars: { direct: 17, retrograde: 8 },
  Mercury: { direct: 14, retrograde: 12 },
  Jupiter: { direct: 11, retrograde: 11 },
  Venus: { direct: 10, retrograde: 8 },
  Saturn: { direct: 16, retrograde: 16 }
};

const KENDRA_HOUSES = [1, 4, 7, 10];
const YOGAKARAKA_KENDRAS = [4, 7, 10];
const TRIKONA_HOUSES = [1, 5, 9];
const DUSTHANA_HOUSES = [3, 6, 11];

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
  const timeAccuracyParam = searchParams.get("timeAccuracy") ?? "unknown";
  const uncertaintyParam = searchParams.get("uncertaintyMinutes");
  const timeSource = searchParams.get("timeSource") ?? "";

  if (!(["exact", "approximate", "unknown"] as string[]).includes(timeAccuracyParam)) {
    throw new Error("timeAccuracy must be exact, approximate, or unknown.");
  }

  const timeAccuracy = timeAccuracyParam as BirthInput["timeAccuracy"];
  const uncertaintyMinutes = uncertaintyParam === null ? null : Number(uncertaintyParam);

  if (
    uncertaintyMinutes !== null &&
    (!Number.isFinite(uncertaintyMinutes) || uncertaintyMinutes < 0)
  ) {
    throw new Error("uncertaintyMinutes must be a non-negative number.");
  }

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
      lng,
      timeAccuracy,
      uncertaintyMinutes,
      timeSource
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
    lng,
    timeAccuracy,
    uncertaintyMinutes,
    timeSource
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

function getBalaadiAvastha(sign: SignName, degree: number): BalaadiAvastha {
  const stages: BalaadiAvastha[] = ["Bala", "Kumara", "Yuva", "Vriddha", "Mrita"];
  const segment = Math.min(Math.floor(degree / 6), 4);
  const isOddSign = SIGNS.indexOf(sign) % 2 === 0;

  return stages[isOddSign ? segment : 4 - segment];
}

function getRulesHouses(planet: PlanetName, ascendantSign: SignName) {
  if (planet === "Rahu" || planet === "Ketu") {
    return [];
  }

  const ascendantIndex = SIGNS.indexOf(ascendantSign);

  return SIGNS.map((sign, index) => ({
    house: ((index - ascendantIndex + 12) % 12) + 1,
    lord: SIGN_LORDS[sign]
  }))
    .filter(({ lord }) => lord === planet)
    .map(({ house }) => house)
    .sort((left, right) => left - right);
}

function getFunctionalNature(planet: PlanetName, rulesHouses: number[]): FunctionalNature {
  if (planet === "Rahu" || planet === "Ketu") {
    return "neutral";
  }

  const ownsKendra = rulesHouses.some((house) => YOGAKARAKA_KENDRAS.includes(house));
  const ownsTrikona = rulesHouses.some((house) => [5, 9].includes(house));

  if (ownsKendra && ownsTrikona) {
    return "yogakaraka";
  }

  const ownsBeneficHouse = rulesHouses.some((house) => TRIKONA_HOUSES.includes(house));
  const ownsMaleficHouse = rulesHouses.some((house) => DUSTHANA_HOUSES.includes(house));

  if (ownsBeneficHouse && ownsMaleficHouse) {
    return "mixed";
  }

  if (ownsBeneficHouse) {
    return "benefic";
  }

  if (ownsMaleficHouse) {
    return "malefic";
  }

  return "neutral";
}

function isCombust(planet: PlanetBaseSignal, sunLongitude: number) {
  const limits = COMBUSTION_LIMITS[planet.planet];

  if (!limits) {
    return false;
  }

  const limit = planet.retrograde ? limits.retrograde : limits.direct;
  return angularDistance(planet.longitude, sunLongitude) <= limit;
}

function getNeechaBhangaConditions(
  planet: PlanetBaseSignal,
  planets: PlanetBaseSignal[],
  ascendantSign: SignName,
  moonSign: SignName
) {
  if (planet.dignity !== "Debilitated") {
    return [];
  }

  const exaltationSign = EXALTATION_SIGNS[planet.planet];

  if (!exaltationSign) {
    return [];
  }

  const cancellationLords = [
    { role: "debilitation_sign_lord", planet: SIGN_LORDS[planet.sign] },
    { role: "exaltation_sign_lord", planet: SIGN_LORDS[exaltationSign] }
  ];
  const conditions: string[] = [];

  for (const cancellationLord of cancellationLords) {
    const placement = planets.find((item) => item.planet === cancellationLord.planet);

    if (!placement) {
      continue;
    }

    if (KENDRA_HOUSES.includes(getWholeSignHouse(placement.sign, ascendantSign))) {
      conditions.push(`${cancellationLord.role}_in_kendra_from_ascendant`);
    }

    if (KENDRA_HOUSES.includes(getWholeSignHouse(placement.sign, moonSign))) {
      conditions.push(`${cancellationLord.role}_in_kendra_from_moon`);
    }
  }

  return [...new Set(conditions)];
}

function getSimplifiedStrength(
  dignity: Dignity,
  combust: boolean,
  neechaBhanga: boolean
): PlanetSignal["strength"] {
  const factors: string[] = [];
  let score = 0;

  if (dignity === "Exalted") {
    score += 2;
    factors.push("exalted");
  } else if (dignity === "Moolatrikona" || dignity === "Own Sign") {
    score += 1;
    factors.push(dignity === "Moolatrikona" ? "moolatrikona" : "own_sign");
  } else if (dignity === "Debilitated") {
    score -= 2;
    factors.push("debilitated");
  } else if (dignity === "Friendly") {
    score += 1;
    factors.push("friendly_sign");
  } else if (dignity === "Enemy") {
    score -= 1;
    factors.push("enemy_sign");
  }

  if (combust) {
    score -= 1;
    factors.push("combust");
  }

  if (neechaBhanga) {
    score += 1;
    factors.push("neecha_bhanga");
  }

  return {
    model: "dignity_state_v0",
    level: score > 0 ? "strong" : score < 0 ? "weak" : "medium",
    score,
    factors
  };
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
            mahadasha: {
              planet,
              started: formatDate(periodStart),
              ends: formatDate(periodEnd)
            },
            antardasha: {
              planet: antardasha.planet,
              started: formatDate(antardasha.start),
              ends: formatDate(antardasha.end)
            },
            pratyantar: {
              planet: pratyantar.planet,
              started: formatDate(pratyantar.start),
              ends: formatDate(pratyantar.end)
            }
          },
          next: {
            mahadasha: {
              planet: nextPlanet,
              started: formatDate(periodEnd),
              ends: formatDate(addYears(periodEnd, DASHA_YEARS[nextPlanet]))
            },
            starts: formatDate(periodEnd)
          }
        };
      }

      periodStart = periodEnd;
    }
  }

  return {
    current: {
      mahadasha: null,
      antardasha: null,
      pratyantar: null
    },
    next: {
      mahadasha: null,
      starts: null
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
  const basePlanets = rawPlanets.map<PlanetBaseSignal>((planet) => {
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
  const sun = basePlanets.find((planet) => planet.planet === "Sun");
  const moon = basePlanets.find((planet) => planet.planet === "Moon");

  if (!sun || !moon) {
    throw new Error("Sun and Moon calculations are required for planet states.");
  }

  return basePlanets.map<PlanetSignal>((planet) => {
    const rulesHouses = getRulesHouses(planet.planet, ascendantSign);
    const combust = isCombust(planet, sun.longitude);
    const neechaBhangaConditions = getNeechaBhangaConditions(
      planet,
      basePlanets,
      ascendantSign,
      moon.sign
    );
    const neechaBhanga = neechaBhangaConditions.length > 0;

    return {
      ...planet,
      rulesHouses,
      functionalNature: getFunctionalNature(planet.planet, rulesHouses),
      state: {
        retrograde: planet.retrograde,
        combust,
        exalted: planet.dignity === "Exalted",
        debilitated: planet.dignity === "Debilitated",
        ownSign: planet.dignity === "Own Sign",
        moolatrikona: planet.dignity === "Moolatrikona",
        neechaBhanga,
        neechaBhangaConditions,
        balaadiAvastha: getBalaadiAvastha(planet.sign, planet.degree)
      },
      strength: getSimplifiedStrength(planet.dignity, combust, neechaBhanga)
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
      lord_in_house:
        planetSignals.find((planet) => planet.planet === SIGN_LORDS[sign])?.house ?? null,
      occupants: planetSignals
        .filter((planet) => planet.house === house)
        .map((planet) => planet.planet)
    };
  });
}

function buildRelationships(planetSignals: PlanetSignal[]) {
  const conjunctions: Array<{ between: [PlanetName, PlanetName]; orb: number }> = [];
  const oppositions: Array<{ between: [PlanetName, PlanetName]; orb: number }> = [];

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

  return {
    conjunctions,
    oppositions,
    grahaDrishti
  };
}

function buildPlanetRelationshipGraph(
  planetSignals: PlanetSignal[],
  relationships: ReturnType<typeof buildRelationships>
) {
  const graph: Array<{
    between: [PlanetName, PlanetName];
    type: "mutual_support" | "supportive" | "tension" | "mixed" | "structural_interaction";
    signals: string[];
  }> = [];

  for (let leftIndex = 0; leftIndex < planetSignals.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < planetSignals.length; rightIndex += 1) {
      const left = planetSignals[leftIndex];
      const right = planetSignals[rightIndex];
      const signals: string[] = [];
      const leftAspectsRight = relationships.grahaDrishti.some(
        (aspect) => aspect.from === left.planet && aspect.to === right.planet
      );
      const rightAspectsLeft = relationships.grahaDrishti.some(
        (aspect) => aspect.from === right.planet && aspect.to === left.planet
      );
      const conjunct = relationships.conjunctions.some(
        ({ between }) => between.includes(left.planet) && between.includes(right.planet)
      );
      const opposed = relationships.oppositions.some(
        ({ between }) => between.includes(left.planet) && between.includes(right.planet)
      );

      if (leftAspectsRight) signals.push(`${left.planet} aspects ${right.planet}`);
      if (rightAspectsLeft) signals.push(`${right.planet} aspects ${left.planet}`);
      if (left.planet === right.houseLord) signals.push(`${left.planet} rules ${right.planet} sign`);
      if (right.planet === left.houseLord) signals.push(`${right.planet} rules ${left.planet} sign`);
      if (conjunct) signals.push("Planets are conjunct by Whole Sign and close orb");
      if (opposed) signals.push("Planets are in close opposition");

      const supportiveNatures = ["benefic", "yogakaraka"];
      const bothSupportive =
        supportiveNatures.includes(left.functionalNature) &&
        supportiveNatures.includes(right.functionalNature);
      const hasMalefic =
        left.functionalNature === "malefic" || right.functionalNature === "malefic";

      if (bothSupportive && signals.length > 0) {
        signals.push("Both planets are functional benefics");
      }

      if (signals.length === 0) {
        continue;
      }

      let type: (typeof graph)[number]["type"] = "structural_interaction";

      if (opposed && bothSupportive) type = "mixed";
      else if (opposed) type = "tension";
      else if (bothSupportive && (leftAspectsRight || rightAspectsLeft) && signals.length >= 3) {
        type = "mutual_support";
      } else if (bothSupportive) type = "supportive";
      else if (hasMalefic && conjunct) type = "mixed";

      graph.push({ between: [left.planet, right.planet], type, signals });
    }
  }

  return graph;
}

function buildHouseStrengths(
  houses: ReturnType<typeof buildHouses>,
  planetSignals: PlanetSignal[]
) {
  return houses.map((house) => {
    const lord = planetSignals.find((planet) => planet.planet === house.lord);
    const drivers: string[] = [];
    let score = 0;

    if (lord) {
      score += lord.strength.score;
      drivers.push(`lord ${lord.planet} strength ${lord.strength.score >= 0 ? "+" : ""}${lord.strength.score}`);

      if (KENDRA_HOUSES.includes(lord.house) || [5, 9].includes(lord.house)) {
        score += 1;
        drivers.push(`lord ${lord.planet} in kendra or trikona`);
      }

      if ([6, 8, 12].includes(lord.house)) {
        score -= 1;
        drivers.push(`lord ${lord.planet} in dusthana`);
      }
    }

    for (const occupantName of house.occupants) {
      const occupant = planetSignals.find((planet) => planet.planet === occupantName);

      if (!occupant) continue;
      if (["benefic", "yogakaraka"].includes(occupant.functionalNature)) {
        score += 1;
        drivers.push(`${occupant.planet} functional benefic occupant`);
      } else if (occupant.functionalNature === "malefic") {
        score -= 1;
        drivers.push(`${occupant.planet} functional malefic occupant`);
      }
    }

    const incomingPlanets = planetSignals
      .filter((planet) =>
        (GRAHA_DRISHTI[planet.planet] ?? []).some(
          (aspect) => ((planet.house + aspect - 2) % 12) + 1 === house.house
        )
      )
      .map((planet) => planet.planet);

    for (const incomingPlanet of incomingPlanets) {
      const aspectingPlanet = planetSignals.find((planet) => planet.planet === incomingPlanet);

      if (!aspectingPlanet) continue;
      if (["benefic", "yogakaraka"].includes(aspectingPlanet.functionalNature)) {
        score += 1;
        drivers.push(`${incomingPlanet} functional benefic aspect`);
      } else if (aspectingPlanet.functionalNature === "malefic") {
        score -= 1;
        drivers.push(`${incomingPlanet} functional malefic aspect`);
      }
    }

    return {
      ...house,
      strength: {
        model: "house_strength_v0" as const,
        score,
        level: score >= 2 ? "strong" : score <= -2 ? "weak" : "medium",
        drivers
      }
    };
  });
}

function buildDerivedRelationships(
  planetSignals: PlanetSignal[],
  houses: ReturnType<typeof buildHouses>
) {
  return {
    planet_lordships: planetSignals.map((planet) => ({
      planet: planet.planet,
      rules_houses: planet.rulesHouses
    })),
    house_lord_positions: houses.map((house) => ({
      house: house.house,
      lord: house.lord,
      located_in_house: house.lord_in_house
    })),
    functional_natures: planetSignals.map((planet) => ({
      planet: planet.planet,
      nature: planet.functionalNature,
      rules_houses: planet.rulesHouses
    }))
  };
}

function buildYogas(
  planetSignals: PlanetSignal[],
  houses: ReturnType<typeof buildHouses>,
  relationships: ReturnType<typeof buildRelationships>
) {
  const yogas: Array<{
    name: string;
    present: boolean;
    participants: PlanetName[];
    strength: "low" | "medium" | "high" | null;
    evidence: string[];
    failedConditions: string[];
  }> = [];
  const addYoga = (
    name: string,
    participants: PlanetName[],
    evidence: string[],
    failedConditions: string[]
  ) => {
    const present = failedConditions.length === 0;
    const participantSignals = participants
      .map((planet) => planetSignals.find((item) => item.planet === planet))
      .filter((planet): planet is PlanetSignal => Boolean(planet));
    let strength: (typeof yogas)[number]["strength"] = null;

    if (present) {
      strength = "medium";

      if (participantSignals.some((planet) => planet.strength.level === "weak")) {
        strength = "low";
      } else if (
        participantSignals.length > 0 &&
        participantSignals.every((planet) => planet.strength.level === "strong")
      ) {
        strength = "high";
      }
    }

    yogas.push({ name, present, participants, strength, evidence, failedConditions });
  };
  const house9Lord = houses[8].lord;
  const house10Lord = houses[9].lord;
  const house9LordPlacement = planetSignals.find((planet) => planet.planet === house9Lord);
  const house10LordPlacement = planetSignals.find((planet) => planet.planet === house10Lord);
  const dharmaEvidence: string[] = [];

  if (house9Lord === house10Lord) {
    dharmaEvidence.push("same_planet_rules_houses_9_and_10");
  } else if (house9LordPlacement && house10LordPlacement) {
    if (house9LordPlacement.house === house10LordPlacement.house) {
      dharmaEvidence.push("ninth_and_tenth_lords_share_whole_sign_house");
    }
    if (house9LordPlacement.house === 10 && house10LordPlacement.house === 9) {
      dharmaEvidence.push("ninth_and_tenth_lords_in_mutual_exchange");
    }
    const mutualDrishti =
      relationships.grahaDrishti.some(
        (aspect) => aspect.from === house9Lord && aspect.to === house10Lord
      ) &&
      relationships.grahaDrishti.some(
        (aspect) => aspect.from === house10Lord && aspect.to === house9Lord
      );
    if (mutualDrishti) dharmaEvidence.push("ninth_and_tenth_lords_in_mutual_graha_drishti");
  }

  addYoga(
    "Dharma Karmadhipati Yoga",
    [...new Set([house9Lord, house10Lord])],
    dharmaEvidence,
    dharmaEvidence.length > 0 ? [] : ["ninth_and_tenth_lords_are_not_associated"]
  );

  const sun = planetSignals.find((planet) => planet.planet === "Sun");
  const mercury = planetSignals.find((planet) => planet.planet === "Mercury");
  const budhaAdityaPresent = Boolean(sun && mercury && sun.house === mercury.house);
  addYoga(
    "Budha-Aditya Yoga",
    ["Sun", "Mercury"],
    budhaAdityaPresent ? ["sun_and_mercury_share_whole_sign_house"] : [],
    budhaAdityaPresent ? [] : ["sun_and_mercury_do_not_share_whole_sign_house"]
  );

  const moon = planetSignals.find((planet) => planet.planet === "Moon");
  const jupiter = planetSignals.find((planet) => planet.planet === "Jupiter");
  const gajaEvidence: string[] = [];
  const gajaFailures: string[] = [];

  if (moon && jupiter) {
    const fromMoon = getWholeSignHouse(jupiter.sign, moon.sign);
    if (KENDRA_HOUSES.includes(jupiter.house) || KENDRA_HOUSES.includes(fromMoon)) {
      gajaEvidence.push(`jupiter_in_kendra_from_${KENDRA_HOUSES.includes(jupiter.house) ? "ascendant" : "moon"}`);
    } else gajaFailures.push("jupiter_not_in_kendra_from_ascendant_or_moon");

    const associatedBenefic = planetSignals.some(
      (planet) =>
        planet.planet !== "Jupiter" &&
        ["benefic", "yogakaraka"].includes(planet.functionalNature) &&
        (planet.house === jupiter.house ||
          relationships.grahaDrishti.some(
            (aspect) => aspect.from === planet.planet && aspect.to === "Jupiter"
          ))
    );
    if (associatedBenefic) gajaEvidence.push("jupiter_conjoined_or_aspected_by_functional_benefic");
    else gajaFailures.push("jupiter_not_conjoined_or_aspected_by_functional_benefic");

    if (["Debilitated", "Enemy"].includes(jupiter.dignity) || jupiter.state.combust) {
      gajaFailures.push("jupiter_is_debilitated_combust_or_in_enemy_sign");
    } else gajaEvidence.push("jupiter_avoids_debilitation_combustion_and_enemy_sign");
  }
  addYoga("Gajakesari Yoga", ["Moon", "Jupiter"], gajaEvidence, gajaFailures);

  const classicalPlanets = planetSignals.filter(
    (planet) => !["Sun", "Moon", "Rahu", "Ketu"].includes(planet.planet)
  );
  const planetsInRelativeHouse = (reference: PlanetSignal, house: number) =>
    classicalPlanets.filter(
      (planet) => getWholeSignHouse(planet.sign, reference.sign) === house
    );

  if (moon) {
    const second = planetsInRelativeHouse(moon, 2);
    const twelfth = planetsInRelativeHouse(moon, 12);
    const kendraCompanions = classicalPlanets.filter((planet) =>
      KENDRA_HOUSES.includes(getWholeSignHouse(planet.sign, moon.sign))
    );
    addYoga("Sunapha Yoga", second.map((planet) => planet.planet), second.length ? ["classical_planet_in_second_from_moon"] : [], second.length ? [] : ["no_classical_planet_in_second_from_moon"]);
    addYoga("Anapha Yoga", twelfth.map((planet) => planet.planet), twelfth.length ? ["classical_planet_in_twelfth_from_moon"] : [], twelfth.length ? [] : ["no_classical_planet_in_twelfth_from_moon"]);
    addYoga("Durudhara Yoga", [...second, ...twelfth].map((planet) => planet.planet), second.length && twelfth.length ? ["classical_planets_on_both_sides_of_moon"] : [], [
      ...(second.length ? [] : ["no_classical_planet_in_second_from_moon"]),
      ...(twelfth.length ? [] : ["no_classical_planet_in_twelfth_from_moon"])
    ]);
    const kemadrumaPresent = second.length === 0 && twelfth.length === 0 && kendraCompanions.length === 0;
    addYoga("Kemadruma Yoga", ["Moon"], kemadrumaPresent ? ["moon_has_no_adjacent_or_kendra_classical_planets"] : [], kemadrumaPresent ? [] : ["kemadruma_cancellation_present"]);
  }

  if (sun) {
    const second = planetsInRelativeHouse(sun, 2);
    const twelfth = planetsInRelativeHouse(sun, 12);
    addYoga("Vesi Yoga", second.map((planet) => planet.planet), second.length ? ["classical_planet_in_second_from_sun"] : [], second.length ? [] : ["no_classical_planet_in_second_from_sun"]);
    addYoga("Vosi Yoga", twelfth.map((planet) => planet.planet), twelfth.length ? ["classical_planet_in_twelfth_from_sun"] : [], twelfth.length ? [] : ["no_classical_planet_in_twelfth_from_sun"]);
    addYoga("Ubhayachari Yoga", [...second, ...twelfth].map((planet) => planet.planet), second.length && twelfth.length ? ["classical_planets_on_both_sides_of_sun"] : [], [
      ...(second.length ? [] : ["no_classical_planet_in_second_from_sun"]),
      ...(twelfth.length ? [] : ["no_classical_planet_in_twelfth_from_sun"])
    ]);
  }

  const mahapurusha: Array<{ planet: PlanetName; name: string }> = [
    { planet: "Mars", name: "Ruchaka Mahapurusha Yoga" },
    { planet: "Mercury", name: "Bhadra Mahapurusha Yoga" },
    { planet: "Jupiter", name: "Hamsa Mahapurusha Yoga" },
    { planet: "Venus", name: "Malavya Mahapurusha Yoga" },
    { planet: "Saturn", name: "Sasa Mahapurusha Yoga" }
  ];

  for (const definition of mahapurusha) {
    const planet = planetSignals.find((item) => item.planet === definition.planet);
    const evidence: string[] = [];
    const failedConditions: string[] = [];
    if (planet && KENDRA_HOUSES.includes(planet.house)) evidence.push("planet_in_kendra_from_ascendant");
    else failedConditions.push("planet_not_in_kendra_from_ascendant");
    if (planet && ["Exalted", "Own Sign", "Moolatrikona"].includes(planet.dignity)) evidence.push("planet_in_own_moolatrikona_or_exaltation_sign");
    else failedConditions.push("planet_not_in_own_moolatrikona_or_exaltation_sign");
    addYoga(definition.name, [definition.planet], evidence, failedConditions);
  }

  const cancelledPlanets = planetSignals.filter((planet) => planet.state.neechaBhanga);
  addYoga(
    "Neecha Bhanga",
    cancelledPlanets.map((planet) => planet.planet),
    cancelledPlanets.flatMap((planet) => planet.state.neechaBhangaConditions),
    cancelledPlanets.length ? [] : ["no_debilitated_planet_meets_v0_cancellation_conditions"]
  );

  return yogas;
}

function buildDerived(
  planetSignals: PlanetSignal[],
  houses: ReturnType<typeof buildHouseStrengths>
) {
  const signCounts = countValues(
    planetSignals.map((planet) => planet.sign),
    Object.fromEntries(SIGNS.map((sign) => [sign, 0])) as Record<SignName, number>
  );
  const houseCounts = Object.fromEntries(
    houses.map((house) => [house.house, house.occupants.length])
  ) as Record<number, number>;
  const ascendantLord = houses[0].lord;

  const dominantHouses = houses
    .map((house) => ({
      house: house.house,
      score: house.strength.score + house.occupants.length,
      drivers: [
        ...house.strength.drivers,
        ...(house.occupants.length ? [`${house.occupants.length} occupant(s)`] : [])
      ]
    }))
    .sort((left, right) => right.score - left.score || left.house - right.house);
  const dominantSigns = dominantKeys(signCounts);
  const stelliums = houses
    .filter((house) => house.occupants.length >= 3)
    .map((house) => ({ house: house.house, planets: house.occupants }));

  const dominantPlanetScores = planetSignals
    .filter((planet) => !["Rahu", "Ketu"].includes(planet.planet))
    .map((planet) => {
    const drivers = [`dignity-state strength ${planet.strength.score >= 0 ? "+" : ""}${planet.strength.score * 2}`];
    const angularBonus = [1, 4, 7, 10].includes(planet.house) ? 2 : 0;
    const ascendantLordBonus = planet.planet === ascendantLord ? 3 : 0;
    const clusterBonus = signCounts[planet.sign] >= 3 || houseCounts[planet.house] >= 3 ? 1 : 0;
    let functionalBonus = 0;

    if (planet.functionalNature === "yogakaraka") functionalBonus = 2;
    else if (planet.functionalNature === "benefic") functionalBonus = 1;
    else if (planet.functionalNature === "malefic") functionalBonus = -1;

    if (angularBonus) drivers.push("angular house +2");
    if (ascendantLordBonus) drivers.push("ascendant lord +3");
    if (clusterBonus) drivers.push("planet cluster +1");
    if (functionalBonus) drivers.push(`functional nature ${functionalBonus > 0 ? "+" : ""}${functionalBonus}`);

    return {
      planet: planet.planet,
      score: planet.strength.score * 2 + angularBonus + ascendantLordBonus + clusterBonus + functionalBonus,
      drivers
    };
  }).sort((left, right) => right.score - left.score || left.planet.localeCompare(right.planet));

  return {
    dominantPlanets: dominantPlanetScores,
    dominantHouses,
    dominantSigns,
    stelliums,
    clusters: houses
      .filter((house) => house.occupants.length >= 2)
      .map((house) => ({ house: house.house, sign: house.sign, planets: house.occupants })),
    emptyHouses: houses.filter((house) => house.occupants.length === 0).map((house) => house.house)
  };
}

function buildBirthQuality(birthInput: BirthInput) {
  const uncertaintyMinutes =
    birthInput.uncertaintyMinutes ?? (birthInput.timeAccuracy === "exact" ? 0 : null);
  let houseConfidence: "high" | "medium" | "low" = "low";

  if (
    birthInput.timeAccuracy === "exact" ||
    (birthInput.timeAccuracy === "approximate" &&
      uncertaintyMinutes !== null &&
      uncertaintyMinutes <= 10)
  ) {
    houseConfidence = "high";
  } else if (
    birthInput.timeAccuracy === "approximate" &&
    uncertaintyMinutes !== null &&
    uncertaintyMinutes <= 30
  ) {
    houseConfidence = "medium";
  }

  return {
    timeAccuracy: birthInput.timeAccuracy,
    timeSource: birthInput.timeSource || null,
    uncertaintyMinutes,
    houseConfidence
  };
}

function buildStructuralPatterns(planetSignals: PlanetSignal[]) {
  const classicalPlanets = planetSignals.filter(
    (planet) => !["Rahu", "Ketu"].includes(planet.planet)
  );
  const countIn = (houses: number[]) =>
    classicalPlanets.filter((planet) => houses.includes(planet.house)).length;
  const kendraCount = countIn(KENDRA_HOUSES);
  const trikonaCount = countIn(TRIKONA_HOUSES);
  const dusthanaCount = countIn([6, 8, 12]);

  return {
    kendraEmphasis: { present: kendraCount >= 3, planetCount: kendraCount },
    trikonaEmphasis: { present: trikonaCount >= 3, planetCount: trikonaCount },
    dusthanaEmphasis: { present: dusthanaCount >= 3, planetCount: dusthanaCount }
  };
}

function buildAudit(
  planetSignals: PlanetSignal[],
  houses: ReturnType<typeof buildHouseStrengths>,
  derived: ReturnType<typeof buildDerived>,
  yogas: ReturnType<typeof buildYogas>
) {
  return {
    models: {
      planetStrength: "dignity_state_v0",
      houseStrength: "house_strength_v0",
      dominance: "dominance_v1",
      relationshipGraph: "relationship_graph_v1",
      functionalNature: "house_lordship_v0",
      yogas: "curated_v1"
    },
    correspondence: [
      ...planetSignals.map((planet) => ({
        field: `planetStrength:${planet.planet}`,
        rule: "dignity_state_v0",
        signals: planet.strength.factors
      })),
      ...houses.map((house) => ({
        field: `houseStrength:${house.house}`,
        rule: "house_strength_v0",
        signals: house.strength.drivers
      })),
      ...derived.dominantPlanets.map((planet) => ({
        field: `dominance:${planet.planet}`,
        rule: "dominance_v1",
        signals: planet.drivers
      })),
      ...yogas.map((yoga) => ({
        field: `yoga:${yoga.name}`,
        rule: "curated_v1",
        signals: yoga.present ? yoga.evidence : yoga.failedConditions
      }))
    ]
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
  const baseHouses = buildHouses(planets, ascendantSignDegree.sign);
  const relationships = buildRelationships(planets);
  const planetRelationships = buildPlanetRelationshipGraph(planets, relationships);
  const houses = buildHouseStrengths(baseHouses, planets);
  const yogas = buildYogas(planets, baseHouses, relationships);
  const derived = buildDerived(planets, houses);
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
      version: "1.2",
      zodiac: "sidereal",
      ayanamsha: "lahiri",
      houseSystem: "whole_sign",
      nodeType: "mean",
      dashaSystem: "vimshottari",
      tradition: "classical_parashari_v0",
      ruleConventions: {
        combustion: "BPHS_planet_specific_orbs",
        functionalNature: "house_lordship_v0",
        neechaBhanga: "kendra_from_ascendant_or_moon_v0",
        strength: "dignity_state_v0",
        houseStrength: "house_strength_v0",
        dominance: "dominance_v1",
        relationshipGraph: "relationship_graph_v1",
        yogas: "curated_v1"
      },
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
    birthQuality: buildBirthQuality(birthInput),
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
    relationships: {
      ...relationships,
      planetRelationships
    },
    derived_relationships: buildDerivedRelationships(planets, baseHouses),
    derived: {
      ...derived,
      yogas,
      derivedPatterns: buildStructuralPatterns(planets)
    },
    timing,
    audit: buildAudit(planets, houses, derived, yogas)
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
