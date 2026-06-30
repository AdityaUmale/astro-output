import { NextResponse } from "next/server";
import path from "node:path";
import swisseph from "swisseph";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type QueryValues = {
  year: number;
  month: number;
  day: number;
  hour: number;
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
  name: string;
  id: number;
};

type PlanetPosition = {
  name: string;
  longitude: number;
  latitude: number;
  speed: number;
  isRetrograde: boolean;
  rawSwissResult: {
    longitude: number;
    latitude: number;
    distance: number;
    longitudeSpeed: number;
    latitudeSpeed: number;
    distanceSpeed: number;
    rflag: number;
  };
};

const CORE_BODIES: BodyConfig[] = [
  { name: "Sun", id: swisseph.SE_SUN },
  { name: "Moon", id: swisseph.SE_MOON },
  { name: "Mercury", id: swisseph.SE_MERCURY },
  { name: "Venus", id: swisseph.SE_VENUS },
  { name: "Mars", id: swisseph.SE_MARS },
  { name: "Jupiter", id: swisseph.SE_JUPITER },
  { name: "Saturn", id: swisseph.SE_SATURN },
  { name: "Rahu / Mean Node", id: swisseph.SE_MEAN_NODE }
];

const REQUIRED_PARAMS: Array<keyof QueryValues> = [
  "year",
  "month",
  "day",
  "hour",
  "lat",
  "lng"
];

function parseQuery(searchParams: URLSearchParams): QueryValues {
  const values = Object.fromEntries(
    REQUIRED_PARAMS.map((param) => [param, Number(searchParams.get(param))])
  ) as QueryValues;

  const invalidParam = REQUIRED_PARAMS.find((param) => {
    const rawValue = searchParams.get(param);
    return rawValue === null || rawValue.trim() === "" || !Number.isFinite(values[param]);
  });

  if (invalidParam) {
    throw new Error(`Missing or invalid query parameter: ${invalidParam}`);
  }

  if (values.month < 1 || values.month > 12) {
    throw new Error("Month must be between 1 and 12.");
  }

  if (values.day < 1 || values.day > 31) {
    throw new Error("Day must be between 1 and 31.");
  }

  if (values.hour < 0 || values.hour >= 24) {
    throw new Error("Hour must be an IST decimal hour from 0 up to, but not including, 24.");
  }

  if (values.lat < -90 || values.lat > 90) {
    throw new Error("Latitude must be between -90 and 90.");
  }

  if (values.lng < -180 || values.lng > 180) {
    throw new Error("Longitude must be between -180 and 180.");
  }

  return values;
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

function convertIstToUtc({ year, month, day, hour }: QueryValues): UtcDateTime {
  if (!isValidCalendarDate(year, month, day)) {
    throw new Error("Birth date must be a valid calendar date.");
  }

  const istMidnight = new Date(0);
  istMidnight.setUTCHours(0, 0, 0, 0);
  istMidnight.setUTCFullYear(year, month - 1, day);

  const utcTimestamp = istMidnight.getTime() + (hour - 5.5) * 60 * 60 * 1000;
  const utcDate = new Date(utcTimestamp);
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

function calculateBody(julianDay: number, body: BodyConfig): Promise<PlanetPosition> {
  const flags = swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED;

  return new Promise<PlanetPosition>((resolve, reject) => {
    swisseph.swe_calc_ut(julianDay, body.id, flags, (result) => {
      if ("error" in result) {
        reject(new Error(`${body.name}: ${result.error}`));
        return;
      }

      if (
        !("longitude" in result) ||
        !("latitude" in result) ||
        !("longitudeSpeed" in result)
      ) {
        reject(new Error(`${body.name}: Swiss Ephemeris returned an incomplete result.`));
        return;
      }

      resolve({
        name: body.name,
        longitude: result.longitude,
        latitude: result.latitude,
        speed: result.longitudeSpeed,
        isRetrograde: result.longitudeSpeed < 0,
        rawSwissResult: result
      });
    });
  });
}

export async function GET(request: Request) {
  try {
    const birthDetails = parseQuery(new URL(request.url).searchParams);
    const utcBirthDetails = convertIstToUtc(birthDetails);
    const ephemerisPath = path.join(process.cwd(), "public/ephe");

    swisseph.swe_set_ephe_path(ephemerisPath);

    const julianDay = swisseph.swe_julday(
      utcBirthDetails.year,
      utcBirthDetails.month,
      utcBirthDetails.day,
      utcBirthDetails.hour,
      swisseph.SE_GREG_CAL
    );

    const planets = await Promise.all(
      CORE_BODIES.map((body) => calculateBody(julianDay, body))
    );

    return NextResponse.json({
      metadata: {
        julianDay,
        ephemerisPath,
        inputTimeZone: "IST (UTC+05:30)",
        calculationTimeZone: "UTC",
        input: birthDetails,
        utcInputUsedForSwissEphemeris: utcBirthDetails
      },
      planets
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to calculate planetary data.",
        requiredParams: REQUIRED_PARAMS
      },
      { status: 400 }
    );
  }
}
