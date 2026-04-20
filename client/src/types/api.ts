export type UserRole = 'sales_rep' | 'client' | 'admin' | 'super_admin';

export type Contact = {
  id?: string;
  name: string;
  title: string;
  phone: string;
  email: string;
  linkedIn: string;
  linkedin?: string;
  is_primary: boolean;
  clientIds?:Array<string>;
};

export type USState = 
    "Alabama"|"Alaska"|"Arizona"|"Arkansas"|"California"|"Colorado"|"Connecticut"|
    "Delaware"|"Florida"|"Georgia"|"Hawaii"|"Idaho"|"Illinois"|"Indiana"|"Iowa"|
    "Kansas"|"Kentucky"|"Louisiana"|"Maine"|"Maryland"|"Massachusetts"|"Michigan"|
    "Minnesota"|"Mississippi"|"Missouri"|"Montana"|"Nebraska"|"Nevada"|"New Hampshire"|
    "New Jersey"|"New Mexico"|"New York"|"North Carolina"|"North Dakota"|"Ohio"|
    "Oklahoma"|"Oregon"|"Pennsylvania"|"Rhode Island"|"South Carolina"|"South Dakota"|
    "Tennessee"|"Texas"|"Utah"|"Vermont"|"Virginia"|"Washington"|"West Virginia"|
    "Wisconsin"|"Wyoming"
  

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  email?: string;
  title?: string;
  timezone?: Timezone;
  initials?: string;
  password?: string;
  repId?:string;
}

export type Importance = 'HIGH' | 'MEDIUM' | 'LOW'

// add a client profile here too

export type Timezone  =
  | "Eastern"
  | "Mountain"
  | "Central"
  | "Pacific"
  | "Eastern Time (ET)"
  | "Mountain Time (MT)"
  | "Central Time (CT)"
  | "Pacific Time (PT)"
  | "Alaska Time (AKT)"
  | "Hawaii Time (HT)";
export type ClientStatus = 'active' | 'inactive' | 'prospecting' | 'onboarding';
export type ProspectStatus = 'verbal' | 'not_started' | 'in_communication' | 'awaiting_review'  | 'closed' | 'inactive';
export type Note = { id: string; text: string; author: string; timestamp: string };
export type AuditEntry = {
  id: string;
  clientId: string;
  action: string;
  author: string;
  repId: string;
  timestamp: string;
  type: "info" | "note" | "create" | "update" | "delete";
};

export interface OnboardingChecklist {
  agreement_signed:    boolean;
  property_list_created: boolean;
  ach:                boolean;
  integration_setup:     boolean;
  first_file_placed:     boolean;
}

export interface ClientMetadata {
  prelegal: boolean;
  settled_in_full: number;
  integration: string;
  tax_campaign: boolean;
}

export interface ClientRep {
  id: string;
  firstName:string;
  lastName:string;
  companyStartDate:string;
  city:string;
  state:string;
  title:string;
  role?: UserRole;
  timezone: Timezone;
  territoryStates: Array<USState>;
}

export interface Address {
  address1?:string;
  address2?:string;
  city:string;
  state:string;
  zipCode?:string;
}

export type TaskType = "Prospecting" | "Follow-Up" | "Training" | "Other";

export interface Prospect {
  id: string;
  companyName: string;
  dbas?: Array<string>;
  unitCount: number;
  assignedRepId: string | null;
  assignedRep?: UserProfile;
  createdDate?: string;
  createdAt?: string;
  clientStatus: ClientStatus;
  prospectStatus?: ProspectStatus;
  isCorporate?: boolean;
  website?:string;
  linkedIn?:string;
  address?: Address;
  contactIds?:Array<string>;
}

export interface Client extends Prospect{
  clientId: string;
  headquarters_id?: string; // this is an id link to another client related to the headquarters
  headquarters?: string;
  firstFilePlacementDate?: string | null;
  mostRecentFilePlacementDate?: string | null;
  firstPlacementDate?: string | null;
  lastPlacementDate?: string | null;
  archiveDate?:string | null;
  clientCloseDate?:string | null; // when they move from prospect to client
  totalPlacements?: number;
  placementsThisYear?: number;
  recoveryRate?: number;
  bucket?: 1 | 2 | 3;
  onboardingChecklist?: OnboardingChecklist | null;
  metadata: ClientMetadata;
}

export interface History {
  clientId:string;repId:string;
}

export interface Task {
  id: string;
  clientId?: string; // client it's associated with 
  repId?: string; // rep assigned to the task
  title: string;
  completed: boolean;
  priority: Importance;
  dueDate: string;
  notes?:string;
}

export interface Meeting {
  id: string;
  title: string;
  type: string;
  date: string;
}

export interface Event {
  id: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
}

export interface GoalProgress {
  quarterlyGoal: number;
  currentValue: number;
  percentComplete: number;
  onTrack: boolean;
  trend: string;
  monthlyData: Array<{
    month: string;
    actual: number;
    target: number;
  }>;
}
