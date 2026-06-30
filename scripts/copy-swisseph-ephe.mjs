import { cp, mkdir } from "node:fs/promises";
import path from "node:path";

const source = path.join(process.cwd(), "node_modules", "swisseph", "ephe");
const destination = path.join(process.cwd(), "public/ephe");

await mkdir(path.dirname(destination), { recursive: true });
await cp(source, destination, { recursive: true });

console.log(`Copied Swiss Ephemeris files to ${destination}`);
