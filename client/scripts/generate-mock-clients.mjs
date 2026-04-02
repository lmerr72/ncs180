import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const COMPANY_PREFIXES = [
  "Summit",
  "Synergy",
  "Catalyst",
  "Pinnacle",
  "Vertex",
  "Horizon",
  "Luminary",
  "Sterling",
  "Keystone",
  "Summit",'Peak','Pinnacle','Range','Crest','Magnitude','Polar','Hoist',
  "Meridian",
  "Elevate",
  "Bridgewater",
  "Apex",
  "Monarch",
  "Anarchy",
  "Growth","Whirlpool","Sonar","Radar","Cyclone","Spiral",
  "Innovation",
  "Miracle",
  "Sunshine",
  "Edgewater",
  "Castle",
  "Quest",
  "Median",
  "Anchor",
  "Imagine",
  "Imagination",
  "Splendor","Sunbeam","Rainbow","Glow","Radiance","Brilliance","Daybreak","Dawn","Sunset","Sunrise","Meteor","Comet","Vortex","Hypnotic","Splendor","Blaze","Cornucopia","Luminescence"
];

const COMPANY_SUFFIXES = [
  "Residential",
  "Properties",
  "Housing",
  "Group",
  "Management",
  "Communities",
  "Living",
  "Partners","Partnership","Inc.","LLC"
];

const PROSPECT_NON_CLOSED = ["verbal", "not_started", "in_communication", "awaiting_review"];
const STREET_NAMES = [
  "Main",
  "Market",
  "Broadway",
  "Oak",
  "Pine",
  "Maple",
  "Cedar",
  "Lake",
  "Sunset",
  "Ridge",
  "Park",
  "River",
];
const STREET_TYPES = ["St", "Ave", "Blvd", "Dr", "Ln", "Way", "Ct", "Pl"];
const CONTACT_FIRST_NAMES = [
  "Alex",
  "Jordan",
  "Taylor",
  "Morgan",
  "Casey",
  "Riley",
  "Cameron",
  "Avery",
  "Parker",
  "Quinn",
  "Skyler",
  "Drew",
];
const CONTACT_LAST_NAMES = [
  "Bennett",
  "Hayes",
  "Parker",
  "Collins",
  "Morgan",
  "Reed",
  "Turner",
  "Brooks",
  "Sullivan",
  "Foster",
  "Bailey",
  "Jenkins",
];
const CONTACT_TITLES = [
  "Regional Property Manager",
  "Director of Operations",
  "VP of Property Management",
  "Portfolio Director",
  "Director of Facilities",
  "Operations Manager",
  "Senior Property Manager",
  "Regional Vice President",
];

function parseCount(rawValue) {
  const value = Number.parseInt(rawValue ?? "", 10);

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error("Provide a positive integer count. Example: npm run generate:mock-clients --workspace client -- 25");
  }

  return value;
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function sampleTerritoryState(rep) {
  if (Array.isArray(rep.territoryStates) && rep.territoryStates.length > 0) {
    return randomItem(rep.territoryStates);
  }

  return rep.state;
}

function loadMockClientReps(repsPath) {
  const source = fs.readFileSync(repsPath, "utf8");
  const match = source.match(/MOCK_CLIENT_REPS:\s*ClientRep\[\]\s*=\s*(\[[\s\S]*\]);\s*$/);

  if (!match) {
    throw new Error(`Unable to parse MOCK_CLIENT_REPS from ${repsPath}`);
  }

  return Function(`"use strict"; return (${match[1]});`)();
}

function buildCompanyName(index) {
  const prefix = COMPANY_PREFIXES[index % COMPANY_PREFIXES.length];
  const suffix = COMPANY_SUFFIXES[index % COMPANY_SUFFIXES.length];
  return `${prefix} ${suffix}`;
}

function buildSlug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function buildStatusPair(index) {
  const statusCycle = ["active", "inactive", "onboarding","prospecting"];
  const status = statusCycle[index % statusCycle.length];

  if (status === "active") {
    return { status, prospectStatus: "closed" };
  }

  if (status === "prospecting") {
    return { status, prospectStatus: randomItem(PROSPECT_NON_CLOSED) };
  }

  const inactiveOptions = ["inactive", "awaiting_review", "closed"];
  return { status, prospectStatus: randomItem(inactiveOptions) };
}

function buildClient(index, rep) {
  const { status, prospectStatus } = buildStatusPair(index);
  const createdDate = new Date(Date.UTC(2021 + (index % 4), index % 12, (index % 28) + 1));
  const clientCloseDate = new Date(createdDate);
  clientCloseDate.setUTCDate(clientCloseDate.getUTCDate() + 30 + (index % 45));

  const archiveDate = new Date(clientCloseDate);
  archiveDate.setUTCMonth(archiveDate.getUTCMonth() + 18);

  const firstPlacementDate = status === "prospecting"
    ? null
    : clientCloseDate.toISOString().slice(0, 10);

  const lastPlacementDate = status === "prospecting"
    ? null
    : new Date(Date.UTC(
      clientCloseDate.getUTCFullYear(),
      clientCloseDate.getUTCMonth() + ((index % 6) + 1),
      Math.min(clientCloseDate.getUTCDate(), 28),
    )).toISOString().slice(0, 10);
  const hasFirstFilePlacementDate = index % 4 !== 0;
  const firstFilePlacementDateValue = hasFirstFilePlacementDate
    ? new Date(createdDate)
    : null;

  if (firstFilePlacementDateValue) {
    firstFilePlacementDateValue.setUTCDate(firstFilePlacementDateValue.getUTCDate() + 14 + (index % 75));
  }

  const hasMostRecentFilePlacementDate = firstFilePlacementDateValue !== null && index % 3 !== 0;
  const mostRecentFilePlacementDateValue = hasMostRecentFilePlacementDate
    ? new Date(firstFilePlacementDateValue)
    : null;

  if (mostRecentFilePlacementDateValue) {
    mostRecentFilePlacementDateValue.setUTCDate(mostRecentFilePlacementDateValue.getUTCDate() + 21 + (index % 120));
  }

  const companyName = buildCompanyName(index);
  const addressState = sampleTerritoryState(rep);
  const streetNumber = 100 + ((index * 37) % 9800);
  const streetName = STREET_NAMES[index % STREET_NAMES.length];
  const streetType = STREET_TYPES[index % STREET_TYPES.length];
  const zipCode = String(10000 + ((index * 613) % 89999)).padStart(5, "0");
  const websiteSlug = buildSlug(companyName);

  return {
    id: `client-${String(index + 1).padStart(4, "0")}`,
    clientId: `CLT-${String(1000 + index).padStart(4, "0")}`,
    companyName,
    headquarters_id: `hq-${String(index + 1).padStart(4, "0")}`,
    unitCount: 250 + ((index * 1375) % 48000),
    firstPlacementDate,
    lastPlacementDate,
    firstFilePlacementDate: firstFilePlacementDateValue?.toISOString() ?? null,
    mostRecentFilePlacementDate: mostRecentFilePlacementDateValue?.toISOString() ?? null,
    assignedRepId: rep.id,
    createdDate: createdDate.toISOString(),
    archiveDate: archiveDate.toISOString(),
    clientCloseDate: clientCloseDate.toISOString(),
    status,
    prospectStatus,
    isCorporate: index % 4 === 0,
    website: `https://www.${websiteSlug}.com`,
    address: {
      address1: `${streetNumber} ${streetName} ${streetType}`,
      address2: index % 5 === 0 ? `Suite ${200 + index}` : "",
      city: rep.city,
      state: addressState,
      zipCode,
    },
    linkedIn: `https://www.linkedin.com/company/${websiteSlug}`,
    contactIds: [`contact-${String(index + 1).padStart(4, "0")}`],
  };
}

function buildPrimaryContact(client, index) {
  const firstName = CONTACT_FIRST_NAMES[index % CONTACT_FIRST_NAMES.length];
  const lastName = CONTACT_LAST_NAMES[(index * 3) % CONTACT_LAST_NAMES.length];
  const fullName = `${firstName} ${lastName}`;
  const companyDomain = buildSlug(client.companyName);
  const personSlug = buildSlug(fullName);
  const phone = `(${200 + ((index * 7) % 700)}) 555-${String(1000 + ((index * 173) % 9000)).padStart(4, "0")}`;

  return {
    id: client.contactIds[0],
    name: fullName,
    title: CONTACT_TITLES[index % CONTACT_TITLES.length],
    phone,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${companyDomain}.com`,
    linkedIn: `https://www.linkedin.com/in/${personSlug}`,
    is_primary: true,
    clientIds: [client.id],
  };
}

function renderClient(client) {
  return `  {
    id: ${JSON.stringify(client.id)},
    clientId: ${JSON.stringify(client.clientId)},
    companyName: ${JSON.stringify(client.companyName)},
    headquarters_id: ${JSON.stringify(client.headquarters_id)},
    unitCount: ${client.unitCount},
    firstFilePlacementDate: ${client.firstFilePlacementDate === null ? "null" : JSON.stringify(client.firstFilePlacementDate)},
    mostRecentFilePlacementDate: ${client.mostRecentFilePlacementDate === null ? "null" : JSON.stringify(client.mostRecentFilePlacementDate)},
    assignedRepId: ${JSON.stringify(client.assignedRepId)},
    createdDate: ${JSON.stringify(client.createdDate)},
    archiveDate: ${JSON.stringify(client.archiveDate)},
    clientCloseDate: ${JSON.stringify(client.clientCloseDate)},
    status: ${JSON.stringify(client.status)},
    prospectStatus: ${JSON.stringify(client.prospectStatus)},
    contactIds: ${JSON.stringify(client.contactIds)},
    isCorporate: ${client.isCorporate},
    website: ${JSON.stringify(client.website)},
    address: ${JSON.stringify(client.address, null, 4).replace(/\n/g, "\n    ")},
    linkedIn: ${JSON.stringify(client.linkedIn)},
  }`;
}

function renderContact(contact) {
  return `  {
    id: ${JSON.stringify(contact.id)},
    name: ${JSON.stringify(contact.name)},
    title: ${JSON.stringify(contact.title)},
    phone: ${JSON.stringify(contact.phone)},
    email: ${JSON.stringify(contact.email)},
    linkedIn: ${JSON.stringify(contact.linkedIn)},
    is_primary: ${contact.is_primary},
    clientIds: ${JSON.stringify(contact.clientIds)}
  }`;
}

function renderClientsFile(clients) {
  return `import type { Client } from "@/types/api";

export const MOCK_CLIENTS: Client[] = [
${clients.map(renderClient).join(",\n")}
];
`;
}

function renderContactsFile(contacts) {
  return `import type { Contact } from "@/types/api";

export const MOCK_CONTACTS: Contact[] = [
${contacts.map(renderContact).join(",\n")}
];
`;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repsPath = path.resolve(__dirname, "../src/data/mock_client_reps.ts");
const clientsOutputPath = path.resolve(__dirname, "../src/data/mock_clients.ts");
const contactsOutputPath = path.resolve(__dirname, "../src/data/mock_contacts.ts");

const count = parseCount(process.argv[2]);
const reps = loadMockClientReps(repsPath);

if (reps.length === 0) {
  throw new Error("mock_client_reps.ts is empty. Generate reps before generating clients.");
}

const clients = Array.from({ length: count }, (_, index) => {
  const rep = randomItem(reps);
  return buildClient(index, rep);
});
const contacts = clients.map(buildPrimaryContact);

fs.mkdirSync(path.dirname(clientsOutputPath), { recursive: true });
fs.writeFileSync(clientsOutputPath, renderClientsFile(clients), "utf8");
fs.writeFileSync(contactsOutputPath, renderContactsFile(contacts), "utf8");

console.log(`Wrote ${clients.length} mock clients to ${clientsOutputPath}`);
console.log(`Wrote ${contacts.length} mock contacts to ${contactsOutputPath}`);
