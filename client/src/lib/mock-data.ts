import type { Task, Meeting, Event, Client, UserProfile, GoalProgress, ClientStatus, Contact, TaskType } from "@/types/api";
export type { TaskType } from "@/types/api";

export const MOCK_USER: UserProfile = {
  id: "rep-gordon-m",
  firstName: "Gordon",
  lastName: "Marshall",
  email: "gordon.m@company.com",
  title: "Sales Representative",
  role: "sales_rep",
  initials: "GM",
  timezone: "Mountain Time (MT)",
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


type ClientWithBucket = Client & {
  bucket: 1 | 2 | 3;
  totalPlacements: number;
  placementsThisYear: number;
  recoveryRate: number;
};



export type { ClientWithBucket };

function getClientStatus(lastPlacementDate: string | null): ClientStatus {
  if (!lastPlacementDate) return "prospecting";

  const lastPlacement = new Date(lastPlacementDate);
  const inactiveThreshold = new Date("2025-03-17T00:00:00Z");

  return lastPlacement >= inactiveThreshold ? "active" : "inactive";
}

export type ProspectStatus = "Verbal" | "In Communication" | "Awaiting Review" | "Not Started" | "Closed";




export type ClientExtra = {
  website: string;
  linkedIn: string;
  primaryContact: Contact;
};

export const CLIENT_EXTRA_DETAILS: Record<string, ClientExtra> = {
  // MOCK_ALL_CLIENTS (c0–c19)
  "c0": {
    website: "https://www.synergyproperties.com",
    linkedIn: "https://www.linkedin.com/company/synergy-properties",
    primaryContact: { name: "Jennifer Walsh", title: "Director of Properties", phone: "720-555-0142", email: "j.walsh@synergyproperties.com", linkedIn: "https://www.linkedin.com/in/jenniferwalsh",is_primary:true },
  },
  "c1": {
    website: "https://www.apexmgmt.com",
    linkedIn: "https://www.linkedin.com/company/apex-management",
    primaryContact: { name: "Marcus Torres", title: "VP of Operations", phone: "512-555-0287", email: "m.torres@apexmgmt.com", linkedIn: "https://www.linkedin.com/in/marcustorresatx",is_primary:true },
  },
  "c2": {
    website: "https://www.summithousing.co",
    linkedIn: "https://www.linkedin.com/company/summit-housing",
    primaryContact: { name: "Rachel Kim", title: "Director of Facilities", phone: "720-555-0391", email: "r.kim@summithousing.co", linkedIn: "https://www.linkedin.com/in/rachelkimco",is_primary:true },
  },
  "c3": {
    website: "https://www.pinnacleapts.com",
    linkedIn: "https://www.linkedin.com/company/pinnacle-apartments",
    primaryContact: { name: "David Okafor", title: "Regional Property Manager", phone: "312-555-0174", email: "d.okafor@pinnacleapts.com", linkedIn: "https://www.linkedin.com/in/davidokafor",is_primary:true },
  },
  "c4": {
    website: "https://www.nexusgroup-re.com",
    linkedIn: "https://www.linkedin.com/company/nexus-group-re",
    primaryContact: { name: "Ashley Ruiz", title: "Operations Manager", phone: "602-555-0238", email: "a.ruiz@nexusgroup-re.com", linkedIn: "https://www.linkedin.com/in/ashleyruizaz",is_primary:true },
  },
  "c5": {
    website: "https://www.vantageproperties.net",
    linkedIn: "https://www.linkedin.com/company/vantage-properties",
    primaryContact: { name: "Ethan Brooks", title: "Portfolio Director", phone: "206-555-0315", email: "e.brooks@vantageproperties.net", linkedIn: "https://www.linkedin.com/in/ethanbrookswa",is_primary:true },
  },
  "c6": {
    website: "https://www.horizonmgmt.com",
    linkedIn: "https://www.linkedin.com/company/horizon-management",
    primaryContact: { name: "Sandra Lee", title: "VP of Property Operations", phone: "305-555-0462", email: "s.lee@horizonmgmt.com", linkedIn: "https://www.linkedin.com/in/sandraleefl",is_primary:true },
  },
  "c7": {
    website: "https://www.zenithapartments.com",
    linkedIn: "https://www.linkedin.com/company/zenith-apartments",
    primaryContact: { name: "Tom Nguyen", title: "Property Manager", phone: "615-555-0198", email: "t.nguyen@zenithapts.com", linkedIn: "https://www.linkedin.com/in/tomnguyentn",is_primary:true },
  },
  "c8": {
    website: "https://www.catalysthousing.com",
    linkedIn: "https://www.linkedin.com/company/catalyst-housing",
    primaryContact: { name: "Lisa Patel", title: "Director of Leasing", phone: "214-555-0523", email: "l.patel@catalysthousing.com", linkedIn: "https://www.linkedin.com/in/lisapateltx" ,is_primary:true},
  },
  "c9": {
    website: "https://www.vertexgroupre.com",
    linkedIn: "https://www.linkedin.com/company/vertex-group-re",
    primaryContact: { name: "James Carver", title: "Senior Operations Lead", phone: "503-555-0277", email: "j.carver@vertexgroupre.com", linkedIn: "https://www.linkedin.com/in/jamescarveror" ,is_primary:true},
  },
  "c10": {
    website: "https://www.momentumproperties.com",
    linkedIn: "https://www.linkedin.com/company/momentum-properties",
    primaryContact: { name: "Nicole Harris", title: "Regional VP", phone: "404-555-0389", email: "n.harris@momentumproperties.com", linkedIn: "https://www.linkedin.com/in/nicoleharrisga",is_primary:true },
  },
  "c11": {
    website: "https://www.fusionmgmt.co",
    linkedIn: "https://www.linkedin.com/company/fusion-management",
    primaryContact: { name: "Brian Cho", title: "Property Operations Manager", phone: "720-555-0441", email: "b.cho@fusionmgmt.co", linkedIn: "https://www.linkedin.com/in/briancho",is_primary:true },
  },
  "c12": {
    website: "https://www.keystoneapts.com",
    linkedIn: "https://www.linkedin.com/company/keystone-apartments",
    primaryContact: { name: "Maria Gonzalez", title: "Leasing Director", phone: "512-555-0612", email: "m.gonzalez@keystoneapts.com", linkedIn: "https://www.linkedin.com/in/mariagonzaleztx",is_primary:true },
  },
  "c13": {
    website: "https://www.luminaryhousing.com",
    linkedIn: "https://www.linkedin.com/company/luminary-housing",
    primaryContact: { name: "Kevin Park", title: "Account Manager", phone: "312-555-0755", email: "k.park@luminaryhousing.com", linkedIn: "https://www.linkedin.com/in/kevinparkil" ,is_primary:true},
  },
  "c14": {
    website: "https://www.sterlinggroup-re.com",
    linkedIn: "https://www.linkedin.com/company/sterling-group-re",
    primaryContact: { name: "Christine Moore", title: "VP of Acquisitions", phone: "602-555-0844", email: "c.moore@sterlinggroup-re.com", linkedIn: "https://www.linkedin.com/in/christinemooreaz" ,is_primary:true},
  },
  "c15": {
    website: "https://www.ovationproperties.com",
    linkedIn: "https://www.linkedin.com/company/ovation-properties",
    primaryContact: { name: "Daniel Wright", title: "Operations Director", phone: "404-555-0193", email: "d.wright@ovationproperties.com", linkedIn: "https://www.linkedin.com/in/danielwrightga",is_primary:true },
  },
  "c16": {
    website: "https://www.meridianmgmt.com",
    linkedIn: "https://www.linkedin.com/company/meridian-management",
    primaryContact: { name: "Laura Simmons", title: "Regional Manager", phone: "214-555-0367", email: "l.simmons@meridianmgmt.com", linkedIn: "https://www.linkedin.com/in/laurasimmons" ,is_primary:true},
  },
  "c17": {
    website: "https://www.elevatehousing.com",
    linkedIn: "https://www.linkedin.com/company/elevate-housing",
    primaryContact: { name: "Ryan Edwards", title: "Property Manager", phone: "206-555-0512", email: "r.edwards@elevatehousing.com", linkedIn: "https://www.linkedin.com/in/ryanedwards",is_primary:true },
  },
  "c18": {
    website: "https://www.crestapartments.com",
    linkedIn: "https://www.linkedin.com/company/crest-apartments",
    primaryContact: { name: "Angela Foster", title: "Portfolio Manager", phone: "303-555-0634", email: "a.foster@crestapartments.com", linkedIn: "https://www.linkedin.com/in/angelafoster",is_primary:true },
  },
  "c19": {
    website: "https://www.novagroup-re.com",
    linkedIn: "https://www.linkedin.com/company/nova-group-re",
    primaryContact: { name: "William Chang", title: "Director of Operations", phone: "415-555-0781", email: "w.chang@novagroup-re.com", linkedIn: "https://www.linkedin.com/in/williamchangca" ,is_primary:true},
  },
  // MOCK_MY_CLIENTS (my-1 through my-15) — same companies but extended records
  "my-1": {
    website: "https://www.synergyproperties.com",
    linkedIn: "https://www.linkedin.com/company/synergy-properties",
    primaryContact: { name: "Jennifer Walsh", title: "Director of Properties", phone: "720-555-0142", email: "j.walsh@synergyproperties.com", linkedIn: "https://www.linkedin.com/in/jenniferwalsh",is_primary:true },
  },
  "my-2": {
    website: "https://www.apexmgmt.com",
    linkedIn: "https://www.linkedin.com/company/apex-management",
    primaryContact: { name: "Marcus Torres", title: "VP of Operations", phone: "512-555-0287", email: "m.torres@apexmgmt.com", linkedIn: "https://www.linkedin.com/in/marcustorresatx",is_primary:true },
  },
  "my-3": {
    website: "https://www.summithousing.co",
    linkedIn: "https://www.linkedin.com/company/summit-housing",
    primaryContact: { name: "Rachel Kim", title: "Director of Facilities", phone: "720-555-0391", email: "r.kim@summithousing.co", linkedIn: "https://www.linkedin.com/in/rachelkimco",is_primary:true },
  },
  "my-4": {
    website: "https://www.pinnacleapts.com",
    linkedIn: "https://www.linkedin.com/company/pinnacle-apartments",
    primaryContact: { name: "David Okafor", title: "Regional Property Manager", phone: "312-555-0174", email: "d.okafor@pinnacleapts.com", linkedIn: "https://www.linkedin.com/in/davidokafor" ,is_primary:true},
  },
  "my-5": {
    website: "https://www.nexusgroup-re.com",
    linkedIn: "https://www.linkedin.com/company/nexus-group-re",
    primaryContact: { name: "Ashley Ruiz", title: "Operations Manager", phone: "602-555-0238", email: "a.ruiz@nexusgroup-re.com", linkedIn: "https://www.linkedin.com/in/ashleyruizaz",is_primary:true },
  },
  "my-6": {
    website: "https://www.vantageproperties.net",
    linkedIn: "https://www.linkedin.com/company/vantage-properties",
    primaryContact: { name: "Ethan Brooks", title: "Portfolio Director", phone: "206-555-0315", email: "e.brooks@vantageproperties.net", linkedIn: "https://www.linkedin.com/in/ethanbrookswa" ,is_primary:true},
  },
  "my-7": {
    website: "https://www.horizonmgmt.com",
    linkedIn: "https://www.linkedin.com/company/horizon-management",
    primaryContact: { name: "Sandra Lee", title: "VP of Property Operations", phone: "305-555-0462", email: "s.lee@horizonmgmt.com", linkedIn: "https://www.linkedin.com/in/sandraleefl" ,is_primary:true},
  },
  "my-8": {
    website: "https://www.zenithapartments.com",
    linkedIn: "https://www.linkedin.com/company/zenith-apartments",
    primaryContact: { name: "Tom Nguyen", title: "Property Manager", phone: "615-555-0198", email: "t.nguyen@zenithapts.com", linkedIn: "https://www.linkedin.com/in/tomnguyentn" ,is_primary:true},
  },
  "my-9": {
    website: "https://www.catalysthousing.com",
    linkedIn: "https://www.linkedin.com/company/catalyst-housing",
    primaryContact: { name: "Lisa Patel", title: "Director of Leasing", phone: "214-555-0523", email: "l.patel@catalysthousing.com", linkedIn: "https://www.linkedin.com/in/lisapateltx" ,is_primary:true},
  },
  "my-10": {
    website: "https://www.vertexgroupre.com",
    linkedIn: "https://www.linkedin.com/company/vertex-group-re",
    primaryContact: { name: "James Carver", title: "Senior Operations Lead", phone: "503-555-0277", email: "j.carver@vertexgroupre.com", linkedIn: "https://www.linkedin.com/in/jamescarveror" ,is_primary:true},
  },
  "my-11": {
    website: "https://www.momentumproperties.com",
    linkedIn: "https://www.linkedin.com/company/momentum-properties",
    primaryContact: { name: "Nicole Harris", title: "Regional VP", phone: "404-555-0389", email: "n.harris@momentumproperties.com", linkedIn: "https://www.linkedin.com/in/nicoleharrisga",is_primary:true },
  },
  "my-12": {
    website: "https://www.fusionmgmt.co",
    linkedIn: "https://www.linkedin.com/company/fusion-management",
    primaryContact: { name: "Brian Cho", title: "Property Operations Manager", phone: "720-555-0441", email: "b.cho@fusionmgmt.co", linkedIn: "https://www.linkedin.com/in/briancho",is_primary:true },
  },
  "my-13": {
    website: "https://www.keystoneapts.com",
    linkedIn: "https://www.linkedin.com/company/keystone-apartments",
    primaryContact: { name: "Maria Gonzalez", title: "Leasing Director", phone: "512-555-0612", email: "m.gonzalez@keystoneapts.com", linkedIn: "https://www.linkedin.com/in/mariagonzaleztx",is_primary:true },
  },
  "my-14": {
    website: "https://www.luminaryhousing.com",
    linkedIn: "https://www.linkedin.com/company/luminary-housing",
    primaryContact: { name: "Kevin Park", title: "Account Manager", phone: "312-555-0755", email: "k.park@luminaryhousing.com", linkedIn: "https://www.linkedin.com/in/kevinparkil",is_primary:true },
  },
  "all-4": {
    website: "https://www.luminaryhousing.com",
    linkedIn: "https://www.linkedin.com/company/luminary-housing",
    primaryContact: { name: "Kevin Park", title: "Account Manager", phone: "312-555-0755", email: "k.park@luminaryhousing.com", linkedIn: "https://www.linkedin.com/in/kevinparkil",is_primary:true },
  },
  "my-15": {
    website: "https://www.sterlinggroup-re.com",
    linkedIn: "https://www.linkedin.com/company/sterling-group-re",
    primaryContact: { name: "Christine Moore", title: "VP of Acquisitions", phone: "602-555-0844", email: "c.moore@sterlinggroup-re.com", linkedIn: "https://www.linkedin.com/in/christinemooreaz",is_primary:true },
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




export type CommType = "email" | "phone" | null;
export type Importance = "high" | "medium" | "low";
export type TaskCompanyOrigin = "all-clients" | "my-clients" | "pipeline";

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
  associatedCompanyOrigin?: TaskCompanyOrigin;
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
    associatedCompanyOrigin: "all-clients",
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
    associatedCompanyOrigin: "all-clients",
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
    associatedCompanyOrigin: "all-clients",
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
    associatedCompanyOrigin: "all-clients",
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
    associatedCompanyOrigin: "all-clients",
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
    associatedCompanyOrigin: "all-clients",
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
    associatedCompanyOrigin: "all-clients",
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
    associatedCompanyOrigin: "all-clients",
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
    associatedCompanyOrigin: "all-clients",
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
    associatedCompanyOrigin: "all-clients",
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

// hippo replace with rep references in rep data type
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
