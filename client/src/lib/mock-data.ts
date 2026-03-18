import type { Task, Meeting, Event, Client, UserProfile, GoalProgress } from "@/types/api";

export const MOCK_USER: UserProfile = {
  id: "rep-gordon-m",
  firstName: "Gordon",
  lastName: "Marshall",
  email: "gordon.m@company.com",
  title: "Sales Representative",
  role: "sales_rep",
  initials: "GM",
};

export type RepDetails = {
  id: string;
  firstName: string;
  lastName: string;
  initials: string;
  title: string;
  email: string;
  location: string;
  timezone: string;
};

export const REP_DETAILS: Record<string, RepDetails> = {
  "rep-gordon-m": {
    id: "rep-gordon-m",
    firstName: "Gordon",
    lastName: "Marshall",
    initials: "GM",
    title: "Sales Representative",
    email: "gordon.m@company.com",
    location: "Denver, CO",
    timezone: "Mountain Time (MT)",
  },
  "u2": {
    id: "u2",
    firstName: "Tina",
    lastName: "Smith",
    initials: "TS",
    title: "Senior Sales Representative",
    email: "tina.s@company.com",
    location: "Austin, TX",
    timezone: "Central Time (CT)",
  },
  "u3": {
    id: "u3",
    firstName: "Gordon",
    lastName: "Marshall",
    initials: "GM",
    title: "Sales Representative",
    email: "gordon.m@company.com",
    location: "Denver, CO",
    timezone: "Mountain Time (MT)",
  },
  "u4": {
    id: "u4",
    firstName: "Heath",
    lastName: "Lindsey",
    initials: "HL",
    title: "Sales Representative",
    email: "heath.l@company.com",
    location: "Chicago, IL",
    timezone: "Central Time (CT)",
  },
  "u5": {
    id: "u5",
    firstName: "Rod",
    lastName: "Stewart",
    initials: "RS",
    title: "Senior Sales Representative",
    email: "rod.s@company.com",
    location: "Atlanta, GA",
    timezone: "Eastern Time (ET)",
  },
  "u6": {
    id: "u6",
    firstName: "Pete",
    lastName: "Mitchell",
    initials: "PM",
    title: "Sales Representative",
    email: "pete.m@company.com",
    location: "Phoenix, AZ",
    timezone: "Mountain Time (MT)",
  },
  "u7": {
    id: "u7",
    firstName: "Michael",
    lastName: "Scott",
    initials: "MS",
    title: "Regional Sales Manager",
    email: "michael.s@company.com",
    location: "Scranton, PA",
    timezone: "Eastern Time (ET)",
  },
  "u8": {
    id: "u8",
    firstName: "Kim",
    lastName: "Wexler",
    initials: "KW",
    title: "Senior Sales Representative",
    email: "kim.w@company.com",
    location: "Albuquerque, NM",
    timezone: "Mountain Time (MT)",
  },
  "u9": {
    id: "u9",
    firstName: "Kristen",
    lastName: "Bell",
    initials: "KB",
    title: "Sales Representative",
    email: "kristen.b@company.com",
    location: "Los Angeles, CA",
    timezone: "Pacific Time (PT)",
  },
  "u10": {
    id: "u10",
    firstName: "Gordon",
    lastName: "Xavier",
    initials: "GX",
    title: "Sales Representative",
    email: "gordon.x@company.com",
    location: "Seattle, WA",
    timezone: "Pacific Time (PT)",
  },
};

export const MOCK_TASKS: Task[] = [
  { id: "t1", title: "Follow up with Synergy Properties", completed: false, priority: "high", dueDate: "Today" },
  { id: "t2", title: "Prepare Q2 Forecast", completed: false, priority: "medium", dueDate: "Tomorrow" },
  { id: "t3", title: "Send contract to Apex Management", completed: true, priority: "high", dueDate: "Yesterday" },
  { id: "t4", title: "Review new feature release notes", completed: false, priority: "low", dueDate: "Mar 22" },
  { id: "t5", title: "Schedule onboarding for Summit Housing", completed: false, priority: "medium", dueDate: "Mar 24" },
  { id: "t6", title: "Update CRM with recent calls", completed: false, priority: "low", dueDate: "Mar 25" },
];

export const MOCK_MEETINGS: Meeting[] = [
  { id: "m1", title: "Q1 Sales Training", type: "training", date: "2024-03-20T10:00:00" },
  { id: "m2", title: "Client Demo - Synergy Properties", type: "meeting", date: "2024-03-22T14:30:00" },
  { id: "m3", title: "Team Meeting", type: "meeting", date: "2024-03-25T09:00:00" },
  { id: "m4", title: "NAA Conference Call", type: "meeting", date: "2024-03-28T11:00:00" },
];

export const MOCK_EVENTS: Event[] = [
  { id: "e1", name: "Denver Trade Show", location: "Denver, CO", startDate: "2024-04-10", endDate: "2024-04-12" },
  { id: "e2", name: "NAA Apartmentalize", location: "Atlanta, GA", startDate: "2024-06-05", endDate: "2024-06-07" },
];

export const MOCK_REPS: UserProfile[] = [
  { id: "u2", firstName: "Tina", lastName: "Smith", role: "sales_rep", initials: "T" },
  { id: "u3", firstName: "Gordon", lastName: "Marshall", role: "sales_rep", initials: "GM" },
  { id: "u4", firstName: "Heath", lastName: "Lindsey", role: "sales_rep", initials: "H" },
  { id: "u5", firstName: "Rod", lastName: "Stewart", role: "sales_rep", initials: "R" },
  { id: "u6", firstName: "Pete", lastName: "Mitchell", role: "sales_rep", initials: "P" },
  { id: "u7", firstName: "Michael", lastName: "Scott", role: "sales_rep", initials: "Mi" },
  { id: "u8", firstName: "Kim", lastName: "Wexler", role: "sales_rep", initials: "Ki" },
  { id: "u9", firstName: "Kristen", lastName: "Bell", role: "sales_rep", initials: "Kr" },
  { id: "u10", firstName: "Gordon", lastName: "Xavier", role: "sales_rep", initials: "GX" },
];

const COMPANY_NAMES = [
  "Synergy Properties", "Apex Management", "Summit Housing", "Pinnacle Apartments", 
  "Nexus Group", "Vantage Properties", "Horizon Management", "Zenith Apartments", 
  "Catalyst Housing", "Vertex Group", "Momentum Properties", "Fusion Management", 
  "Keystone Apartments", "Luminary Housing", "Sterling Group", "Ovation Properties",
  "Meridian Management", "Elevate Housing", "Crest Apartments", "Nova Group"
];

const CITIES = ["Denver, CO", "Austin, TX", "Chicago, IL", "Atlanta, GA", "Phoenix, AZ", "Seattle, WA", "Miami, FL", "Nashville, TN", "Dallas, TX", "Portland, OR"];

const ALL_CLIENT_UNIT_COUNTS = [
  3200, 8500, 2150, 14200, 680, 5400, 22000, 1200, 7800, 4250,
  29500, 1550, 6300, 3900, 11200, 840, 18700, 2600, 47000, 950,
];

export const MOCK_ALL_CLIENTS: Client[] = COMPANY_NAMES.map((name, i) => {
  const rep = MOCK_REPS[i % MOCK_REPS.length];
  return {
    id: `c${i}`,
    clientId: `CLT-${1000 + i}`,
    companyName: name,
    headquarters: CITIES[i % CITIES.length],
    unitCount: ALL_CLIENT_UNIT_COUNTS[i] ?? 1000,
    firstPlacementDate: `202${i % 4}-0${(i % 9) + 1}-15`,
    lastPlacementDate: `2024-0${(i % 3) + 1}-20`,
    assignedRepId: rep.id,
    assignedRep: rep,
    createdAt: "2020-01-01T00:00:00Z"
  };
});

type ClientWithBucket = Client & {
  bucket: 1 | 2 | 3;
  totalPlacements: number;
  placementsThisYear: number;
  recoveryRate: number;
};

// Today: March 17 2026. 90% have lastPlacementDate after Mar 17 2025. 2 of 15 are stale (my-6, my-8).
export const MOCK_MY_CLIENTS: ClientWithBucket[] = [
  { id: "my-1",  clientId: "CLT-1001", companyName: "Synergy Properties",   headquarters: "Denver CO",    unitCount: 3200,  firstPlacementDate: "2021-03-15", lastPlacementDate: "2025-11-15", assignedRepId: MOCK_USER.id, assignedRep: MOCK_USER, createdAt: "2021-03-15T00:00:00Z", bucket: 2, totalPlacements: 4500,  placementsThisYear: 210,  recoveryRate: 8.2  },
  { id: "my-2",  clientId: "CLT-1002", companyName: "Apex Management",       headquarters: "Austin TX",    unitCount: 8500,  firstPlacementDate: "2020-08-20", lastPlacementDate: "2026-01-20", assignedRepId: MOCK_USER.id, assignedRep: MOCK_USER, createdAt: "2020-08-20T00:00:00Z", bucket: 3, totalPlacements: 9200,  placementsThisYear: 380,  recoveryRate: 15.7 },
  { id: "my-3",  clientId: "CLT-1003", companyName: "Summit Housing",        headquarters: "Denver CO",    unitCount: 2150,  firstPlacementDate: "2022-01-10", lastPlacementDate: "2025-08-12", assignedRepId: MOCK_USER.id, assignedRep: MOCK_USER, createdAt: "2022-01-10T00:00:00Z", bucket: 2, totalPlacements: 2100,  placementsThisYear: 95,   recoveryRate: 6.4  },
  { id: "my-4",  clientId: "CLT-1004", companyName: "Pinnacle Apartments",   headquarters: "Chicago IL",   unitCount: 14200, firstPlacementDate: "2021-06-01", lastPlacementDate: "2025-05-30", assignedRepId: MOCK_USER.id, assignedRep: MOCK_USER, createdAt: "2021-06-01T00:00:00Z", bucket: 3, totalPlacements: 7800,  placementsThisYear: 430,  recoveryRate: 21.3 },
  { id: "my-5",  clientId: "CLT-1005", companyName: "Nexus Group",           headquarters: "Phoenix AZ",   unitCount: 680,   firstPlacementDate: "2023-02-14", lastPlacementDate: "2026-02-14", assignedRepId: MOCK_USER.id, assignedRep: MOCK_USER, createdAt: "2023-02-14T00:00:00Z", bucket: 1, totalPlacements: 310,   placementsThisYear: 45,   recoveryRate: 3.1  },
  { id: "my-6",  clientId: "CLT-1006", companyName: "Vantage Properties",    headquarters: "Seattle WA",   unitCount: 5400,  firstPlacementDate: "2020-11-08", lastPlacementDate: "2022-12-15", assignedRepId: MOCK_USER.id, assignedRep: MOCK_USER, createdAt: "2020-11-08T00:00:00Z", bucket: 2, totalPlacements: 6200,  placementsThisYear: 0,    recoveryRate: 12.8 },
  { id: "my-7",  clientId: "CLT-1007", companyName: "Horizon Management",    headquarters: "Miami FL",     unitCount: 22000, firstPlacementDate: "2021-09-22", lastPlacementDate: "2025-09-08", assignedRepId: MOCK_USER.id, assignedRep: MOCK_USER, createdAt: "2021-09-22T00:00:00Z", bucket: 3, totalPlacements: 8900,  placementsThisYear: 520,  recoveryRate: 18.5 },
  { id: "my-8",  clientId: "CLT-1008", companyName: "Zenith Apartments",     headquarters: "Nashville TN", unitCount: 1200,  firstPlacementDate: "2022-04-30", lastPlacementDate: "2022-09-10", assignedRepId: MOCK_USER.id, assignedRep: MOCK_USER, createdAt: "2022-04-30T00:00:00Z", bucket: 1, totalPlacements: 1200,  placementsThisYear: 0,    recoveryRate: 4.6  },
  { id: "my-9",  clientId: "CLT-1009", companyName: "Catalyst Housing",      headquarters: "Dallas TX",    unitCount: 7800,  firstPlacementDate: "2021-12-05", lastPlacementDate: "2025-07-22", assignedRepId: MOCK_USER.id, assignedRep: MOCK_USER, createdAt: "2021-12-05T00:00:00Z", bucket: 2, totalPlacements: 5600,  placementsThisYear: 275,  recoveryRate: 11.2 },
  { id: "my-10", clientId: "CLT-1010", companyName: "Vertex Group",          headquarters: "Portland OR",  unitCount: 4250,  firstPlacementDate: "2022-07-18", lastPlacementDate: "2026-01-05", assignedRepId: MOCK_USER.id, assignedRep: MOCK_USER, createdAt: "2022-07-18T00:00:00Z", bucket: 2, totalPlacements: 3400,  placementsThisYear: 180,  recoveryRate: 7.9  },
  { id: "my-11", clientId: "CLT-1011", companyName: "Momentum Properties",   headquarters: "Atlanta GA",   unitCount: 29500, firstPlacementDate: "2020-05-14", lastPlacementDate: "2025-12-18", assignedRepId: MOCK_USER.id, assignedRep: MOCK_USER, createdAt: "2020-05-14T00:00:00Z", bucket: 3, totalPlacements: 7100,  placementsThisYear: 390,  recoveryRate: 24.1 },
  { id: "my-12", clientId: "CLT-1012", companyName: "Fusion Management",     headquarters: "Denver CO",    unitCount: 1550,  firstPlacementDate: "2023-06-08", lastPlacementDate: "2025-04-10", assignedRepId: MOCK_USER.id, assignedRep: MOCK_USER, createdAt: "2023-06-08T00:00:00Z", bucket: 1, totalPlacements: 850,   placementsThisYear: 60,   recoveryRate: 2.3  },
  { id: "my-13", clientId: "CLT-1013", companyName: "Keystone Apartments",   headquarters: "Austin TX",    unitCount: 6300,  firstPlacementDate: "2021-10-25", lastPlacementDate: "2025-06-28", assignedRepId: MOCK_USER.id, assignedRep: MOCK_USER, createdAt: "2021-10-25T00:00:00Z", bucket: 2, totalPlacements: 4200,  placementsThisYear: 220,  recoveryRate: 9.7  },
  { id: "my-14", clientId: "CLT-1014", companyName: "Luminary Housing",      headquarters: "Chicago IL",   unitCount: 3900,  firstPlacementDate: "2022-09-12", lastPlacementDate: "2026-02-25", assignedRepId: MOCK_USER.id, assignedRep: MOCK_USER, createdAt: "2022-09-12T00:00:00Z", bucket: 1, totalPlacements: 1650,  placementsThisYear: 130,  recoveryRate: 5.8  },
  { id: "my-15", clientId: "CLT-1015", companyName: "Sterling Group",        headquarters: "Phoenix AZ",   unitCount: 11200, firstPlacementDate: "2020-03-20", lastPlacementDate: "2025-10-14", assignedRepId: MOCK_USER.id, assignedRep: MOCK_USER, createdAt: "2020-03-20T00:00:00Z", bucket: 3, totalPlacements: 9800,  placementsThisYear: 610,  recoveryRate: 19.4 },
];

export type { ClientWithBucket };

export type ProspectStatus = "Verbal" | "In Communication" | "Awaiting Review" | "Pending";

export type Prospect = {
  id: string;
  companyName: string;
  location: string;
  unitCount: number;
  status: ProspectStatus;
};

export const MOCK_PROSPECTS: Prospect[] = [
  { id: "p1",  companyName: "Bridgewater Flats",       location: "Charlotte, NC",   unitCount: 4200,  status: "In Communication" },
  { id: "p2",  companyName: "Ironwood Residential",     location: "Columbus, OH",    unitCount: 1850,  status: "Verbal"           },
  { id: "p3",  companyName: "Crestline Communities",    location: "San Antonio, TX", unitCount: 9400,  status: "Awaiting Review"  },
  { id: "p4",  companyName: "Tidewater Properties",     location: "Virginia Beach, VA", unitCount: 3100, status: "Pending"        },
  { id: "p5",  companyName: "Blue Ridge Management",    location: "Asheville, NC",   unitCount: 720,   status: "Verbal"           },
  { id: "p6",  companyName: "Lakefront Holdings",       location: "Minneapolis, MN", unitCount: 5600,  status: "In Communication" },
  { id: "p7",  companyName: "Harborview Apartments",    location: "Baltimore, MD",   unitCount: 12300, status: "Awaiting Review"  },
  { id: "p8",  companyName: "Copperfield Group",        location: "Scottsdale, AZ",  unitCount: 2450,  status: "Pending"          },
  { id: "p9",  companyName: "Ridgeline Properties",     location: "Salt Lake City, UT", unitCount: 3800, status: "In Communication" },
  { id: "p10", companyName: "Northgate Residential",    location: "Kansas City, MO", unitCount: 6700,  status: "Verbal"           },
  { id: "p11", companyName: "Palomar Communities",      location: "San Diego, CA",   unitCount: 8200,  status: "Awaiting Review"  },
  { id: "p12", companyName: "Elmwood Living",           location: "Louisville, KY",  unitCount: 1100,  status: "Pending"          },
];

export type PrimaryContact = {
  name: string;
  title: string;
  phone: string;
  email: string;
  linkedin: string;
};

export type ClientExtra = {
  website: string;
  linkedin: string;
  primaryContact: PrimaryContact;
};

export const CLIENT_EXTRA_DETAILS: Record<string, ClientExtra> = {
  // MOCK_ALL_CLIENTS (c0–c19)
  "c0": {
    website: "https://www.synergyproperties.com",
    linkedin: "https://www.linkedin.com/company/synergy-properties",
    primaryContact: { name: "Jennifer Walsh", title: "Director of Properties", phone: "720-555-0142", email: "j.walsh@synergyproperties.com", linkedin: "https://www.linkedin.com/in/jenniferwalsh" },
  },
  "c1": {
    website: "https://www.apexmgmt.com",
    linkedin: "https://www.linkedin.com/company/apex-management",
    primaryContact: { name: "Marcus Torres", title: "VP of Operations", phone: "512-555-0287", email: "m.torres@apexmgmt.com", linkedin: "https://www.linkedin.com/in/marcustorresatx" },
  },
  "c2": {
    website: "https://www.summithousing.co",
    linkedin: "https://www.linkedin.com/company/summit-housing",
    primaryContact: { name: "Rachel Kim", title: "Director of Facilities", phone: "720-555-0391", email: "r.kim@summithousing.co", linkedin: "https://www.linkedin.com/in/rachelkimco" },
  },
  "c3": {
    website: "https://www.pinnacleapts.com",
    linkedin: "https://www.linkedin.com/company/pinnacle-apartments",
    primaryContact: { name: "David Okafor", title: "Regional Property Manager", phone: "312-555-0174", email: "d.okafor@pinnacleapts.com", linkedin: "https://www.linkedin.com/in/davidokafor" },
  },
  "c4": {
    website: "https://www.nexusgroup-re.com",
    linkedin: "https://www.linkedin.com/company/nexus-group-re",
    primaryContact: { name: "Ashley Ruiz", title: "Operations Manager", phone: "602-555-0238", email: "a.ruiz@nexusgroup-re.com", linkedin: "https://www.linkedin.com/in/ashleyruizaz" },
  },
  "c5": {
    website: "https://www.vantageproperties.net",
    linkedin: "https://www.linkedin.com/company/vantage-properties",
    primaryContact: { name: "Ethan Brooks", title: "Portfolio Director", phone: "206-555-0315", email: "e.brooks@vantageproperties.net", linkedin: "https://www.linkedin.com/in/ethanbrookswa" },
  },
  "c6": {
    website: "https://www.horizonmgmt.com",
    linkedin: "https://www.linkedin.com/company/horizon-management",
    primaryContact: { name: "Sandra Lee", title: "VP of Property Operations", phone: "305-555-0462", email: "s.lee@horizonmgmt.com", linkedin: "https://www.linkedin.com/in/sandraleefl" },
  },
  "c7": {
    website: "https://www.zenithapartments.com",
    linkedin: "https://www.linkedin.com/company/zenith-apartments",
    primaryContact: { name: "Tom Nguyen", title: "Property Manager", phone: "615-555-0198", email: "t.nguyen@zenithapts.com", linkedin: "https://www.linkedin.com/in/tomnguyentn" },
  },
  "c8": {
    website: "https://www.catalysthousing.com",
    linkedin: "https://www.linkedin.com/company/catalyst-housing",
    primaryContact: { name: "Lisa Patel", title: "Director of Leasing", phone: "214-555-0523", email: "l.patel@catalysthousing.com", linkedin: "https://www.linkedin.com/in/lisapateltx" },
  },
  "c9": {
    website: "https://www.vertexgroupre.com",
    linkedin: "https://www.linkedin.com/company/vertex-group-re",
    primaryContact: { name: "James Carver", title: "Senior Operations Lead", phone: "503-555-0277", email: "j.carver@vertexgroupre.com", linkedin: "https://www.linkedin.com/in/jamescarveror" },
  },
  "c10": {
    website: "https://www.momentumproperties.com",
    linkedin: "https://www.linkedin.com/company/momentum-properties",
    primaryContact: { name: "Nicole Harris", title: "Regional VP", phone: "404-555-0389", email: "n.harris@momentumproperties.com", linkedin: "https://www.linkedin.com/in/nicoleharrisga" },
  },
  "c11": {
    website: "https://www.fusionmgmt.co",
    linkedin: "https://www.linkedin.com/company/fusion-management",
    primaryContact: { name: "Brian Cho", title: "Property Operations Manager", phone: "720-555-0441", email: "b.cho@fusionmgmt.co", linkedin: "https://www.linkedin.com/in/briancho" },
  },
  "c12": {
    website: "https://www.keystoneapts.com",
    linkedin: "https://www.linkedin.com/company/keystone-apartments",
    primaryContact: { name: "Maria Gonzalez", title: "Leasing Director", phone: "512-555-0612", email: "m.gonzalez@keystoneapts.com", linkedin: "https://www.linkedin.com/in/mariagonzaleztx" },
  },
  "c13": {
    website: "https://www.luminaryhousing.com",
    linkedin: "https://www.linkedin.com/company/luminary-housing",
    primaryContact: { name: "Kevin Park", title: "Account Manager", phone: "312-555-0755", email: "k.park@luminaryhousing.com", linkedin: "https://www.linkedin.com/in/kevinparkil" },
  },
  "c14": {
    website: "https://www.sterlinggroup-re.com",
    linkedin: "https://www.linkedin.com/company/sterling-group-re",
    primaryContact: { name: "Christine Moore", title: "VP of Acquisitions", phone: "602-555-0844", email: "c.moore@sterlinggroup-re.com", linkedin: "https://www.linkedin.com/in/christinemooreaz" },
  },
  "c15": {
    website: "https://www.ovationproperties.com",
    linkedin: "https://www.linkedin.com/company/ovation-properties",
    primaryContact: { name: "Daniel Wright", title: "Operations Director", phone: "404-555-0193", email: "d.wright@ovationproperties.com", linkedin: "https://www.linkedin.com/in/danielwrightga" },
  },
  "c16": {
    website: "https://www.meridianmgmt.com",
    linkedin: "https://www.linkedin.com/company/meridian-management",
    primaryContact: { name: "Laura Simmons", title: "Regional Manager", phone: "214-555-0367", email: "l.simmons@meridianmgmt.com", linkedin: "https://www.linkedin.com/in/laurasimmons" },
  },
  "c17": {
    website: "https://www.elevatehousing.com",
    linkedin: "https://www.linkedin.com/company/elevate-housing",
    primaryContact: { name: "Ryan Edwards", title: "Property Manager", phone: "206-555-0512", email: "r.edwards@elevatehousing.com", linkedin: "https://www.linkedin.com/in/ryanedwards" },
  },
  "c18": {
    website: "https://www.crestapartments.com",
    linkedin: "https://www.linkedin.com/company/crest-apartments",
    primaryContact: { name: "Angela Foster", title: "Portfolio Manager", phone: "303-555-0634", email: "a.foster@crestapartments.com", linkedin: "https://www.linkedin.com/in/angelafoster" },
  },
  "c19": {
    website: "https://www.novagroup-re.com",
    linkedin: "https://www.linkedin.com/company/nova-group-re",
    primaryContact: { name: "William Chang", title: "Director of Operations", phone: "415-555-0781", email: "w.chang@novagroup-re.com", linkedin: "https://www.linkedin.com/in/williamchangca" },
  },
  // MOCK_MY_CLIENTS (my-1 through my-15) — same companies but extended records
  "my-1": {
    website: "https://www.synergyproperties.com",
    linkedin: "https://www.linkedin.com/company/synergy-properties",
    primaryContact: { name: "Jennifer Walsh", title: "Director of Properties", phone: "720-555-0142", email: "j.walsh@synergyproperties.com", linkedin: "https://www.linkedin.com/in/jenniferwalsh" },
  },
  "my-2": {
    website: "https://www.apexmgmt.com",
    linkedin: "https://www.linkedin.com/company/apex-management",
    primaryContact: { name: "Marcus Torres", title: "VP of Operations", phone: "512-555-0287", email: "m.torres@apexmgmt.com", linkedin: "https://www.linkedin.com/in/marcustorresatx" },
  },
  "my-3": {
    website: "https://www.summithousing.co",
    linkedin: "https://www.linkedin.com/company/summit-housing",
    primaryContact: { name: "Rachel Kim", title: "Director of Facilities", phone: "720-555-0391", email: "r.kim@summithousing.co", linkedin: "https://www.linkedin.com/in/rachelkimco" },
  },
  "my-4": {
    website: "https://www.pinnacleapts.com",
    linkedin: "https://www.linkedin.com/company/pinnacle-apartments",
    primaryContact: { name: "David Okafor", title: "Regional Property Manager", phone: "312-555-0174", email: "d.okafor@pinnacleapts.com", linkedin: "https://www.linkedin.com/in/davidokafor" },
  },
  "my-5": {
    website: "https://www.nexusgroup-re.com",
    linkedin: "https://www.linkedin.com/company/nexus-group-re",
    primaryContact: { name: "Ashley Ruiz", title: "Operations Manager", phone: "602-555-0238", email: "a.ruiz@nexusgroup-re.com", linkedin: "https://www.linkedin.com/in/ashleyruizaz" },
  },
  "my-6": {
    website: "https://www.vantageproperties.net",
    linkedin: "https://www.linkedin.com/company/vantage-properties",
    primaryContact: { name: "Ethan Brooks", title: "Portfolio Director", phone: "206-555-0315", email: "e.brooks@vantageproperties.net", linkedin: "https://www.linkedin.com/in/ethanbrookswa" },
  },
  "my-7": {
    website: "https://www.horizonmgmt.com",
    linkedin: "https://www.linkedin.com/company/horizon-management",
    primaryContact: { name: "Sandra Lee", title: "VP of Property Operations", phone: "305-555-0462", email: "s.lee@horizonmgmt.com", linkedin: "https://www.linkedin.com/in/sandraleefl" },
  },
  "my-8": {
    website: "https://www.zenithapartments.com",
    linkedin: "https://www.linkedin.com/company/zenith-apartments",
    primaryContact: { name: "Tom Nguyen", title: "Property Manager", phone: "615-555-0198", email: "t.nguyen@zenithapts.com", linkedin: "https://www.linkedin.com/in/tomnguyentn" },
  },
  "my-9": {
    website: "https://www.catalysthousing.com",
    linkedin: "https://www.linkedin.com/company/catalyst-housing",
    primaryContact: { name: "Lisa Patel", title: "Director of Leasing", phone: "214-555-0523", email: "l.patel@catalysthousing.com", linkedin: "https://www.linkedin.com/in/lisapateltx" },
  },
  "my-10": {
    website: "https://www.vertexgroupre.com",
    linkedin: "https://www.linkedin.com/company/vertex-group-re",
    primaryContact: { name: "James Carver", title: "Senior Operations Lead", phone: "503-555-0277", email: "j.carver@vertexgroupre.com", linkedin: "https://www.linkedin.com/in/jamescarveror" },
  },
  "my-11": {
    website: "https://www.momentumproperties.com",
    linkedin: "https://www.linkedin.com/company/momentum-properties",
    primaryContact: { name: "Nicole Harris", title: "Regional VP", phone: "404-555-0389", email: "n.harris@momentumproperties.com", linkedin: "https://www.linkedin.com/in/nicoleharrisga" },
  },
  "my-12": {
    website: "https://www.fusionmgmt.co",
    linkedin: "https://www.linkedin.com/company/fusion-management",
    primaryContact: { name: "Brian Cho", title: "Property Operations Manager", phone: "720-555-0441", email: "b.cho@fusionmgmt.co", linkedin: "https://www.linkedin.com/in/briancho" },
  },
  "my-13": {
    website: "https://www.keystoneapts.com",
    linkedin: "https://www.linkedin.com/company/keystone-apartments",
    primaryContact: { name: "Maria Gonzalez", title: "Leasing Director", phone: "512-555-0612", email: "m.gonzalez@keystoneapts.com", linkedin: "https://www.linkedin.com/in/mariagonzaleztx" },
  },
  "my-14": {
    website: "https://www.luminaryhousing.com",
    linkedin: "https://www.linkedin.com/company/luminary-housing",
    primaryContact: { name: "Kevin Park", title: "Account Manager", phone: "312-555-0755", email: "k.park@luminaryhousing.com", linkedin: "https://www.linkedin.com/in/kevinparkil" },
  },
  "my-15": {
    website: "https://www.sterlinggroup-re.com",
    linkedin: "https://www.linkedin.com/company/sterling-group-re",
    primaryContact: { name: "Christine Moore", title: "VP of Acquisitions", phone: "602-555-0844", email: "c.moore@sterlinggroup-re.com", linkedin: "https://www.linkedin.com/in/christinemooreaz" },
  },
};

export type RepKey = "gordon" | "tina" | "pete" | "heath" | "rod" | "michael" | "kim" | "kristen" | "gxavier" | "open";

export const REP_KEY_TO_ID: Record<string, string> = {
  gordon:  "rep-gordon-m",
  tina:    "u2",
  pete:    "u6",
  heath:   "u4",
  rod:     "u5",
  michael: "u7",
  kim:     "u8",
  kristen: "u9",
  gxavier: "u10",
};

export const STATE_TERRITORIES: Record<string, RepKey> = {
  "Washington": "gordon", "Oregon": "gordon", "Colorado": "gordon",
  "Arizona": "tina",
  "Florida": "pete",
  "California": "open", "Wyoming": "open", "Nevada": "open", "Montana": "open",
  "Idaho": "heath", "Utah": "heath", "Kansas": "heath", "Nebraska": "heath",
  "North Dakota": "heath", "South Dakota": "heath", "Alaska": "heath",
  "Texas": "rod", "Oklahoma": "rod", "New Mexico": "rod", "Louisiana": "rod",
  "Mississippi": "rod", "Arkansas": "rod", "Missouri": "rod",
  "New York": "michael", "New Jersey": "michael", "Connecticut": "michael",
  "Massachusetts": "michael", "Rhode Island": "michael", "Vermont": "michael",
  "New Hampshire": "michael", "Maine": "michael",
  "Georgia": "kim", "Alabama": "kim", "Tennessee": "kim", "Kentucky": "kim",
  "North Carolina": "kim", "South Carolina": "kim", "West Virginia": "kim",
  "Minnesota": "kristen", "Wisconsin": "kristen", "Michigan": "kristen",
  "Illinois": "kristen", "Indiana": "kristen", "Iowa": "kristen", "Ohio": "kristen",
  "Hawaii": "gxavier", "Pennsylvania": "gxavier", "Maryland": "gxavier",
  "Delaware": "gxavier", "Virginia": "gxavier",
};

export type TaskType = "Prospecting" | "Follow-Up" | "Training" | "Other";
export type CommType = "email" | "phone" | null;
export type Importance = "high" | "medium" | "low";

export type ExtendedTask = {
  id: string;
  title: string;
  description: string;
  taskType: TaskType;
  importance: Importance;
  dueDate: string;
  completed: boolean;
  commType: CommType;
  associatedCompanyName?: string;
  associatedCompanyId?: string;
};

export const MOCK_EXTENDED_TASKS: ExtendedTask[] = [
  {
    id: "et1",
    title: "Follow up on Q2 renewal",
    description: "Send updated renewal contract to the facilities director and confirm signature timeline.",
    taskType: "Follow-Up",
    importance: "high",
    dueDate: "Today",
    completed: false,
    commType: "email",
    associatedCompanyName: "Synergy Properties",
    associatedCompanyId: "c0",
  },
  {
    id: "et2",
    title: "Budget review call",
    description: "Discuss Q3 budget availability and procurement process with the operations lead.",
    taskType: "Prospecting",
    importance: "high",
    dueDate: "Tomorrow",
    completed: false,
    commType: "phone",
    associatedCompanyName: "Apex Management",
    associatedCompanyId: "c1",
  },
  {
    id: "et3",
    title: "Prepare Q2 forecast deck",
    description: "Compile Q1 actuals, build YoY comparison, and draft Q2 projection slides for leadership review.",
    taskType: "Other",
    importance: "medium",
    dueDate: "Mar 20",
    completed: false,
    commType: null,
  },
  {
    id: "et4",
    title: "New admin onboarding session",
    description: "Walk the Summit Housing admin team through reporting features, dashboard setup, and user roles.",
    taskType: "Training",
    importance: "medium",
    dueDate: "Mar 24",
    completed: false,
    commType: null,
    associatedCompanyName: "Summit Housing",
    associatedCompanyId: "c2",
  },
  {
    id: "et5",
    title: "Schedule intro demo",
    description: "Coordinate a platform demo for their Denver portfolio manager — confirm attendees and send calendar invite.",
    taskType: "Prospecting",
    importance: "high",
    dueDate: "Mar 22",
    completed: false,
    commType: "email",
    associatedCompanyName: "Pinnacle Apartments",
    associatedCompanyId: "c3",
  },
  {
    id: "et6",
    title: "Update call log",
    description: "Log last week's check-in notes, update primary contact info, and flag open action items.",
    taskType: "Follow-Up",
    importance: "low",
    dueDate: "Mar 25",
    completed: false,
    commType: "phone",
    associatedCompanyName: "Nexus Group",
    associatedCompanyId: "c4",
  },
  {
    id: "et7",
    title: "MSA redlines review",
    description: "Review the MSA redlines submitted by their legal team and flag items requiring escalation.",
    taskType: "Follow-Up",
    importance: "high",
    dueDate: "Mar 21",
    completed: false,
    commType: "email",
    associatedCompanyName: "Vantage Properties",
    associatedCompanyId: "c5",
  },
  {
    id: "et8",
    title: "Quarterly platform training",
    description: "Cover new reporting features, dashboard changes, and the updated placement workflow with the team.",
    taskType: "Training",
    importance: "low",
    dueDate: "Mar 28",
    completed: true,
    commType: null,
  },
  {
    id: "et9",
    title: "Renewal terms call",
    description: "Discuss multi-year renewal pricing, volume discounts, and updated SLA terms.",
    taskType: "Follow-Up",
    importance: "medium",
    dueDate: "Mar 23",
    completed: false,
    commType: "phone",
    associatedCompanyName: "Horizon Management",
    associatedCompanyId: "c6",
  },
  {
    id: "et10",
    title: "Initial outreach email",
    description: "Send intro email to the property manager introducing our services and requesting a discovery call.",
    taskType: "Prospecting",
    importance: "medium",
    dueDate: "Mar 26",
    completed: false,
    commType: "email",
    associatedCompanyName: "Zenith Apartments",
    associatedCompanyId: "c7",
  },
  {
    id: "et11",
    title: "Placement volume check-in",
    description: "Review YTD placement count against contract minimums and identify any at-risk thresholds.",
    taskType: "Follow-Up",
    importance: "medium",
    dueDate: "Mar 27",
    completed: false,
    commType: "phone",
    associatedCompanyName: "Catalyst Housing",
    associatedCompanyId: "c8",
  },
  {
    id: "et12",
    title: "Send pricing proposal",
    description: "Draft and send a tiered pricing proposal based on their 10,000-unit portfolio across three markets.",
    taskType: "Prospecting",
    importance: "high",
    dueDate: "Mar 29",
    completed: false,
    commType: "email",
    associatedCompanyName: "Momentum Properties",
    associatedCompanyId: "c10",
  },
];

export const MOCK_GOALS: GoalProgress = {
  quarterlyGoal: 100,
  currentValue: 67,
  percentComplete: 67,
  onTrack: true,
  trend: "on_track",
  monthlyData: [
    { month: "Jan", actual: 45, target: 40 },
    { month: "Feb", actual: 52, target: 55 },
    { month: "Mar", actual: 38, target: 60 },
  ]
};
