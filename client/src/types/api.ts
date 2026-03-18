export type UserRole = 'sales_rep' | 'client';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  initials: string;
  email?: string;
  title?: string;
}

export interface Client {
  id: string;
  clientId: string;
  companyName: string;
  headquarters: string;
  unitCount: number;
  firstPlacementDate: string | null;
  lastPlacementDate: string | null;
  assignedRepId: string;
  assignedRep: UserProfile;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
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
