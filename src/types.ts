export interface Resume {
  id: string;
  title: string;
  updatedAt: string;
  description: string;
  isDefault: boolean;
}

export interface JobPreference {
  expectedPosition: string;
  expectedLocations: string[];
  salaryRange: {
    min: string;
    max: string;
  };
  blacklistKeywords: string[];
}

export interface AutomationTask {
  id: string;
  title: string;
  platforms: string[];
  status: 'running' | 'paused' | 'completed';
  progress: number;
  appliedCount: number;
  totalCount: number;
}

export interface Interview {
  id: string;
  company: string;
  position: string;
  date: string;
  time: string;
  location: string;
  type: 'video' | 'offline';
}

export interface ApplicationLog {
  id: string;
  position: string;
  company: string;
  location: string;
  platform: string;
  time: string;
  status: 'success' | 'read' | 'mismatch';
  details: string;
}

export interface JobOpportunity {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  matchRate: number;
  tags: string[];
  logoUrl: string;
}
