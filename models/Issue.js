import mongoose from 'mongoose';

/**
 * Location Sub-Schema
 */
const LocationSchema = new mongoose.Schema(
  {
    lat: {
      type: Number,
      default: null,
    },
    lng: {
      type: Number,
      default: null,
    },
    accuracy: {
      type: Number,
      default: null,
    },
    address: {
      type: String,
      required: [true, 'Address is required for location fix'],
      trim: true,
    },
    neighborhood: {
      type: String,
      default: 'Civic Sector',
      trim: true,
    },
    manualNotes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: false }
);

/**
 * Timeline Milestone Sub-Schema
 */
const TimelineStepSchema = new mongoose.Schema(
  {
    phase: {
      type: String,
      enum: ['reported', 'dispatched', 'on_site', 'resolved'],
      default: 'reported',
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    timestamp: {
      type: String,
      default: () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    completed: {
      type: Boolean,
      default: false,
    },
    current: {
      type: Boolean,
      default: false,
    },
    actor: {
      type: String,
      default: 'Civic Dispatch Hub',
    },
  },
  { _id: false }
);

/**
 * Main Issue / Complaint Mongoose Schema
 */
const IssueSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: [true, 'Ticket number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
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
    categoryLabel: {
      type: String,
      trim: true,
    },
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
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    location: {
      type: LocationSchema,
      required: [true, 'Location details are required'],
    },
    photo: {
      type: String, // Base64 data URL or Cloud Storage CDN URL
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
    assignedWorker: {
      type: String,
      default: null,
      trim: true,
    },
    assignedCrew: {
      type: String,
      default: null,
      trim: true,
    },
    reporterName: {
      type: String,
      default: 'Anonymous Citizen',
      trim: true,
    },
    reporterContact: {
      type: String,
      default: null,
      trim: true,
    },
    notifyUpdates: {
      type: Boolean,
      default: false,
    },
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
    timestamps: true, // Automatically manages createdAt and updatedAt
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Fallback / Auto-generate ticket if missing
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

const Issue = mongoose.models.Issue || mongoose.model('Issue', IssueSchema);

export default Issue;
