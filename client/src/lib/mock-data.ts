import type { Meeting, Event, Client, UserProfile, GoalProgress, ClientStatus } from "@/types/api";

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

export type ProspectStatus = "Verbal" | "In Communication" | "Awaiting Review" | "Not Started" | "Onboarding" | "Closed";




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
