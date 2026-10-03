export type IssueCategory =
  | 'overflowing_bin'
  | 'illegal_dumping'
  | 'hazardous_waste'
  | 'recycling_misplaced'
  | 'broken_bin'
  | 'litter_hotspot'
  | 'green_waste'
  | 'waterway_drain';

export type UrgencyLevel = 'routine' | 'medium' | 'urgent';

export type SeverityLevel = 'low' | 'medium' | 'critical';

export interface UploadedImage {
  id: string;
  name: string;
  size: string;
  url: string;
  isPrimary?: boolean;
}

export interface ReportLocation {
  lat: number | null;
  lng: number | null;
  accuracy?: number | null;
  address: string;
  neighborhood?: string;
  isDetecting: boolean;
  detected: boolean;
  error?: string | null;
  manualNotes?: string;
}

export interface TimelineStep {
  phase: 'reported' | 'dispatched' | 'on_site' | 'resolved';
  title: string;
  description: string;
  timestamp?: string;
  completed: boolean;
  current?: boolean;
  actor?: string;
}

export interface ComplaintComment {
  id: string;
  author: string;
  role: 'citizen' | 'official';
  text: string;
  time: string;
}

export interface WasteReport {
  id: string;
  ticketNumber: string;
  category: IssueCategory;
  categoryLabel: string;
  urgency: UrgencyLevel;
  severity: SeverityLevel;
  description: string;
  location: ReportLocation;
  images: UploadedImage[];
  reporterName?: string;
  reporterContact?: string;
  notifyUpdates: boolean;
  status: 'pending' | 'assigned' | 'in_progress' | 'resolved';
  submittedAt: string;
  assignedCrew?: string;
  resolutionEstimate?: string;
  timeline: TimelineStep[];
  upvotes: number;
  hasUpvoted?: boolean;
  comments: ComplaintComment[];
  afterPhotoUrl?: string;
}

