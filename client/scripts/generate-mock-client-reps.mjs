import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FIRST_NAMES = [
  "Tina",
  "Gordon",
  "Gordon",
  "Rod",
  "Heath",
  "Kim",
  "Kristen",
  "Pete",
  "Michael",
  "Chris",
];

const LAST_NAMES = [
  "Mashburn",
  "Marshall",
  "Payn",
  "Herper",
  "Lindsey",
  "Schott",
  "Muse",
  "Mann",
  "Kucera",
  "Hilton",
];

const CITIES = [
  { city: "Denver", state: "Colorado", timezone: "Mountain" },
  { city: "Austin", state: "Texas", timezone: "Central" },
  { city: "Seattle", state: "Washington", timezone: "Pacific" },
  { city: "Atlanta", state: "Georgia", timezone: "Eastern" },
  { city: "Phoenix", state: "Arizona", timezone: "Mountain" },
  { city: "Chicago", state: "Illinois", timezone: "Central" },
  { city: "Los Angeles", state: "California", timezone: "Pacific" },
  { city: "Nashville", state: "Tennessee", timezone: "Central" },
  { city: "Miami", state: "Florida", timezone: "Eastern" },
  { city: "Portland", state: "Oregon", timezone: "Pacific" },
];

const TITLES = [
  "Sales Representative",
  "Senior Sales Representative",
  "Account Executive",
  "Regional Sales Manager",
  "Client Success Manager",
];

const TERRITORIES = [
  ["Colorado", "Utah", "Wyoming"],
  ["Texas", "Oklahoma", "New Mexico"],
  ["Washington", "Oregon", "Idaho"],
  ["Georgia", "Alabama", "South Carolina"],
  ["Arizona", "Nevada", "New Mexico"],
  ["Illinois", "Indiana", "Wisconsin"],
  ["California", "Nevada", "Arizona"],
  ["Tennessee", "Kentucky", "Arkansas"],
  ["Florida", "Georgia", "South Carolina"],
  ["Oregon", "Washington", "California"],
];



function parseCount(rawValue) {
  const value = Number.parseInt(rawValue ?? "", 10);

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error("Provide a positive integer count. Example: npm run generate:mock-client-reps -- 10");
  }

  return value;
}

function buildRep(index) {
  const nameIndex = index % FIRST_NAMES.length;
  const location = CITIES[index % CITIES.length];
  const startYear = 2017 + (index % 7);
  const startMonth = ((index % 12) + 1).toString().padStart(2, "0");
  const startDay = ((index % 27) + 1).toString().padStart(2, "0");

  return {
    id: `client-rep-${String(index + 1).padStart(3, "0")}`,
    firstName: FIRST_NAMES[nameIndex],
    lastName: LAST_NAMES[nameIndex],
    companyStartDate: `${startYear}-${startMonth}-${startDay}`,
    city: location.city,
    state: location.state,
    title: TITLES[index % TITLES.length],
    role:"sales_rep",
    timezone: location.timezone,
    territoryStates: TERRITORIES[index % TERRITORIES.length],
  };
}

function renderFile(reps) {
  return `import type { ClientRep } from "@/types/api";

export const MOCK_CLIENT_REPS: ClientRep[] = ${JSON.stringify(reps, null, 2)};
`;
}

const count = parseCount(process.argv[2]);
const reps = Array.from({ length: count }, (_, index) => buildRep(index));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputPath = path.resolve(__dirname, "../src/data/mock_client_reps.ts");

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, renderFile(reps), "utf8");

console.log(`Wrote ${reps.length} mock client reps to ${outputPath}`);
