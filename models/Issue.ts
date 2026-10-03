import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ILocation {
  lat: number | null;
  lng: number | null;
  accuracy?: number | null;
  address: string;
  neighborhood?: string;
  manualNotes?: string;
}

export interface ITimelineStep {
  phase: 'reported' | 'dispatched' | 'on_site' | 'resolved';
  title: string;
  description: string;
  timestamp?: string;
  completed: boolean;
  current?: boolean;
  actor?: string;
}

export interface IIssue extends Document {
  ticketNumber: string;
  category: string;
  categoryLabel?: string;
  severity: 'low' | 'medium' | 'critical';
  urgency: 'routine' | 'medium' | 'urgent';
  description: string;
  location: ILocation;
  photo?: string | null;
  images: Array<{
    id?: string;
    name?: string;
    size?: string;
    url: string;
    isPrimary?: boolean;
  }>;
  status: 'pending' | 'assigned' | 'in_progress' | 'resolved';
  assignedWorker?: string | null;
  assignedCrew?: string | null;
  reporterName?: string;
  reporterContact?: string;
  notifyUpdates?: boolean;
  resolutionEstimate?: string;
  timeline: ITimelineStep[];
  upvotes: number;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema<ILocation>(
  {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    accuracy: { type: Number, default: null },
    address: { type: String, required: true, trim: true },
    neighborhood: { type: String, default: 'Civic Sector', trim: true },
    manualNotes: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const TimelineStepSchema = new Schema<ITimelineStep>(
  {
    phase: {
      type: String,
      enum: ['reported', 'dispatched', 'on_site', 'resolved'],
      default: 'reported',
    },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    timestamp: {
      type: String,
      default: () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    completed: { type: Boolean, default: false },
    current: { type: Boolean, default: false },
    actor: { type: String, default: 'Civic Dispatch Hub' },
  },
  { _id: false }
);

const IssueSchema = new Schema<IIssue>(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'overflowing_bin',
        'illegal_dumping',
        'hazardous_waste',
        'recycling_misplaced',
        'broken_bin',
        'litter_hotspot',
        'green_waste',
        'waterway_drain',
      ],
      trim: true,
      index: true,
    },
    categoryLabel: { type: String, trim: true },
    severity: {
      type: String,
      enum: ['low', 'medium', 'critical'],
      default: 'low',
      index: true,
    },
    urgency: {
      type: String,
      enum: ['routine', 'medium', 'urgent'],
      default: 'routine',
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    location: {
      type: LocationSchema,
      required: true,
    },
    photo: {
      type: String,
      default: null,
    },
    images: [
      {
        id: String,
        name: String,
        size: String,
        url: String,
        isPrimary: Boolean,
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'assigned', 'in_progress', 'resolved'],
      default: 'pending',
      index: true,
    },
    assignedWorker: { type: String, default: null, trim: true },
    assignedCrew: { type: String, default: null, trim: true },
    reporterName: { type: String, default: 'Anonymous Citizen', trim: true },
    reporterContact: { type: String, default: null, trim: true },
    notifyUpdates: { type: Boolean, default: false },
    resolutionEstimate: {
      type: String,
      default: 'Standard dispatch: Target within 24 hours',
    },
    timeline: {
      type: [TimelineStepSchema],
      default: [],
    },
    upvotes: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

IssueSchema.pre('validate', function () {
  if (!this.ticketNumber) {
    const random = Math.floor(1000 + Math.random() * 9000);
    this.ticketNumber = `ECO-2026-${random}`;
  }
  if (!this.categoryLabel && this.category) {
    this.categoryLabel = this.category
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
});

export const Issue: Model<IIssue> =
  (mongoose.models.Issue as Model<IIssue>) || mongoose.model<IIssue>('Issue', IssueSchema);

export default Issue;
