/**
 * EcoClean Civic Pulse - Full-Stack Express & Mongoose Server
 * Single-file standalone server with MongoDB Atlas, Mongoose models (User, Issue),
 * and RESTful API endpoints.
 */

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

// 1. Middleware configuration
app.use(cors());
app.use(express.json({ limit: '15mb' })); // Support base64 image uploads
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// -------------------------------------------------------------
// 2. MONGOOSE SCHEMAS & MODELS (User & Issue)
// -------------------------------------------------------------

/**
 * User Mongoose Schema (Citizen, Sanitation Staff, Admin)
 */
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['citizen', 'staff', 'admin'],
      default: 'citizen',
      index: true,
    },
    department: {
      type: String,
      default: 'District Resident',
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const User = mongoose.models.User || mongoose.model('User', UserSchema);

/**
 * LoginLog Mongoose Schema for User Audit / Login Tracking
 */
const LoginLogSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: ['citizen', 'staff', 'admin'],
      index: true,
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    action: {
      type: String,
      enum: ['login', 'role_switch', 'register'],
      default: 'login',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const LoginLog =
  mongoose.models.LoginLog || mongoose.model('LoginLog', LoginLogSchema);

/**
 * Location Sub-Schema for Geo-Tagging
 */
const LocationSchema = new mongoose.Schema(
  {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    accuracy: { type: Number, default: null },
    address: { type: String, required: [true, 'Address is required'], trim: true },
    neighborhood: { type: String, default: 'Civic Sector', trim: true },
    manualNotes: { type: String, default: '', trim: true },
  },
  { _id: false }
);

/**
 * Milestone Sub-Schema for Audit Trail
 */
const TimelineStepSchema = new mongoose.Schema(
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

/**
 * Issue / Complaint Mongoose Schema
 */
const IssueSchema = new mongoose.Schema(
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
      required: [true, 'Description is required'],
      maxlength: 1000,
      trim: true,
    },
    location: {
      type: LocationSchema,
      required: true,
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
      transform: (_doc, ret) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

IssueSchema.pre('validate', function () {
  if (!this.ticketNumber) {
    this.ticketNumber = `ECO-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  if (!this.categoryLabel && this.category) {
    this.categoryLabel = this.category
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
});

export const Issue = mongoose.models.Issue || mongoose.model('Issue', IssueSchema);

// -------------------------------------------------------------
// 3. MONGODB ATLAS CONNECTION SETUP
// -------------------------------------------------------------
let isMongoConnected = false;

const connectDB = async () => {
  if (!MONGODB_URI) {
    console.warn(
      '[EcoClean DB Notice] MONGODB_URI not found in environment.\n' +
      'Running in-memory buffer mode for instant testing.\n' +
      'To connect to MongoDB Atlas, add MONGODB_URI="mongodb+srv://..." to your .env file.'
    );
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isMongoConnected = true;
    console.log('[EcoClean DB] Connected to MongoDB Atlas successfully.');

    // Ready. Do not auto-seed fake issues so new users start at 0
    const issueCount = await Issue.countDocuments();
    console.log(`[EcoClean DB] Connected. Current complaints in MongoDB: ${issueCount}`);
  } catch (err) {
    console.warn('[EcoClean DB Warning] MongoDB Atlas connection deferred:', err.message);
  }
};

connectDB();

// -------------------------------------------------------------
// 4. IN-MEMORY STORE FALLBACK (Instant Local Testing)
// -------------------------------------------------------------
const initialSeedIssues = [];

let inMemoryIssues = [];

const generateTicket = () => `ECO-2026-${Math.floor(1000 + Math.random() * 9000)}`;

const initialSeedLogs = [
  {
    id: 'log-001',
    email: 'director.vance@cityops.gov',
    role: 'admin',
    name: 'Director Marcus Vance',
    action: 'login',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    ipAddress: '192.168.1.104',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  },
  {
    id: 'log-002',
    email: 'dave.miller@sanitation.gov',
    role: 'staff',
    name: 'Officer Dave Miller',
    action: 'role_switch',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    ipAddress: '192.168.1.112',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4)',
  },
  {
    id: 'log-003',
    email: 'elena.citizen@civicpulse.org',
    role: 'citizen',
    name: 'Elena Rostova',
    action: 'login',
    timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    ipAddress: '10.0.0.45',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  },
  {
    id: 'log-004',
    email: 'sarah.field@sanitation.gov',
    role: 'staff',
    name: 'Crew Lead Sarah Jenkins',
    action: 'login',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    ipAddress: '10.0.0.78',
    userAgent: 'Mozilla/5.0 (Android 14; Mobile)',
  },
];

let loginLogsStore = [...initialSeedLogs];

const defaultSystemUsers = [
  {
    name: 'Director Marcus Vance',
    email: 'director.vance@cityops.gov',
    password: 'password123',
    role: 'admin',
    department: 'Municipal Operations Command',
  },
  {
    name: 'Officer Dave Miller',
    email: 'dave.miller@sanitation.gov',
    password: 'password123',
    role: 'staff',
    department: 'Zone 2 Rapid Clean Unit',
  },
  {
    name: 'Elena Rostova',
    email: 'elena.citizen@civicpulse.org',
    password: 'password123',
    role: 'citizen',
    department: 'District 4 Resident',
  },
];

let inMemoryUsers = [...defaultSystemUsers.map((u, idx) => ({ ...u, id: `usr-00${idx + 1}` }))];

// -------------------------------------------------------------
// 5. REST API ROUTES
// -------------------------------------------------------------

/**
 * Health & Connection Status Check
 * GET /api/health
 */
app.get('/api/health', async (_req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const issueCount = isMongoConnected
    ? await Issue.countDocuments()
    : inMemoryIssues.length;

  res.json({
    status: 'ok',
    database: dbStatus,
    mongoConnected: isMongoConnected,
    totalIssues: issueCount,
    timestamp: new Date().toISOString(),
  });
});

/**
 * 1. GET /api/issues
 * Returns all reported complaints using Issue.find()
 * Supports filters: status, severity, category, search
 */
app.get('/api/issues', async (req, res) => {
  try {
    const { status, severity, category, search } = req.query;

    if (isMongoConnected) {
      const filter = {};
      if (status && status !== 'all') filter.status = status;
      if (severity && severity !== 'all') filter.severity = severity;
      if (category && category !== 'all') filter.category = category;
      if (search) {
        const q = String(search).trim();
        filter.$or = [
          { ticketNumber: { $regex: q, $options: 'i' } },
          { categoryLabel: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { 'location.address': { $regex: q, $options: 'i' } },
        ];
      }

      // Real Mongoose database query
      const issues = await Issue.find(filter).sort({ createdAt: -1 }).lean();
      return res.status(200).json({
        success: true,
        count: issues.length,
        source: 'mongodb',
        data: issues.map((doc) => ({
          ...doc,
          id: doc._id.toString(),
        })),
      });
    }

    // In-memory fallback
    let filtered = [...inMemoryIssues];
    if (status && status !== 'all') filtered = filtered.filter((i) => i.status === status);
    if (severity && severity !== 'all') filtered = filtered.filter((i) => i.severity === severity);
    if (category && category !== 'all') filtered = filtered.filter((i) => i.category === category);
    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.ticketNumber.toLowerCase().includes(q) ||
          i.categoryLabel?.toLowerCase().includes(q) ||
          i.location?.address?.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.status(200).json({
      success: true,
      count: filtered.length,
      source: 'in_memory_fallback',
      data: filtered,
    });
  } catch (error) {
    console.error('GET /api/issues error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/issues/clear
 * Clears all reported complaints to zero
 */
app.delete('/api/issues/clear', async (_req, res) => {
  try {
    if (isMongoConnected) {
      await Issue.deleteMany({});
    }
    inMemoryIssues = [];
    return res.status(200).json({
      success: true,
      message: 'All issues successfully cleared. Complaints data is now 0.',
      count: 0,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 2. POST /api/issues
 * Creates and persists a new issue report using new Issue().save()
 */
app.post('/api/issues', async (req, res) => {
  try {
    const {
      category,
      categoryLabel,
      location,
      photo,
      images,
      description,
      severity,
      urgency,
      reporterName,
      reporterContact,
      notifyUpdates,
    } = req.body;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'category is required',
      });
    }

    if (!location || (!location.address && location.lat == null)) {
      return res.status(400).json({
        success: false,
        message: 'location (address or coordinates) is required',
      });
    }

    const reportImages = Array.isArray(images) ? [...images] : [];
    if (photo && reportImages.length === 0) {
      reportImages.push({
        id: `img-${Date.now()}`,
        name: 'report_photo.jpg',
        size: '1.2 MB',
        url: photo,
        isPrimary: true,
      });
    }

    const calculatedSeverity =
      severity || (urgency === 'urgent' ? 'critical' : urgency === 'medium' ? 'medium' : 'low');

    const issuePayload = {
      ticketNumber: generateTicket(),
      category,
      categoryLabel:
        categoryLabel ||
        category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      severity: calculatedSeverity,
      urgency: urgency || 'routine',
      description: (description || '').trim() || 'Visual report filed by citizen.',
      location: {
        lat: location.lat != null ? Number(location.lat) : null,
        lng: location.lng != null ? Number(location.lng) : null,
        accuracy: location.accuracy != null ? Number(location.accuracy) : null,
        address: location.address || `${location.lat}°, ${location.lng}°`,
        neighborhood: location.neighborhood || 'Civic Sector',
        manualNotes: location.manualNotes || '',
      },
      photo: photo || (reportImages.length > 0 ? reportImages[0].url : null),
      images: reportImages,
      reporterName: reporterName?.trim() || 'Anonymous Citizen',
      reporterContact: reporterContact?.trim() || undefined,
      notifyUpdates: Boolean(notifyUpdates),
      status: 'pending',
      assignedWorker: null,
      assignedCrew: null,
      resolutionEstimate:
        calculatedSeverity === 'critical'
          ? 'Emergency triage: Target within 3 hours'
          : 'Standard dispatch: Target within 24 hours',
    };

    if (isMongoConnected) {
      // Real Mongoose new Issue().save()
      const newDoc = new Issue(issuePayload);
      const saved = await newDoc.save();
      return res.status(201).json({
        success: true,
        message: 'Issue report successfully created in MongoDB.',
        data: saved,
      });
    }

    // In-memory fallback
    const now = new Date().toISOString();
    const fallback = {
      ...issuePayload,
      id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };
    inMemoryIssues.unshift(fallback);

    return res.status(201).json({
      success: true,
      message: 'Issue report created in local buffer.',
      data: fallback,
    });
  } catch (error) {
    console.error('POST /api/issues error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 3. PATCH /api/issues/:id
 * Updates report status and crew assignment using Issue.findByIdAndUpdate()
 */
app.patch('/api/issues/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedWorker, assignedCrew, resolutionEstimate, severity } = req.body;

    const allowedStatuses = ['pending', 'assigned', 'in_progress', 'resolved'];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status '${status}'. Allowed values: ${allowedStatuses.join(', ')}`,
      });
    }

    const nextWorker =
      assignedWorker !== undefined
        ? assignedWorker
        : assignedCrew !== undefined
        ? assignedCrew
        : undefined;

    const updateFields = {};
    if (status) updateFields.status = status;
    if (nextWorker !== undefined) {
      const workerVal = nextWorker === 'Unassigned' ? null : nextWorker;
      updateFields.assignedWorker = workerVal;
      updateFields.assignedCrew = workerVal;
      if (!status && workerVal) updateFields.status = 'assigned';
    }
    if (severity) updateFields.severity = severity;
    if (resolutionEstimate) {
      updateFields.resolutionEstimate = resolutionEstimate;
    } else if (status === 'resolved') {
      updateFields.resolutionEstimate = 'Completed and site released';
    }

    if (isMongoConnected) {
      let updatedDoc;
      if (mongoose.Types.ObjectId.isValid(id)) {
        // Mongoose Issue.findByIdAndUpdate()
        updatedDoc = await Issue.findByIdAndUpdate(
          id,
          { $set: updateFields },
          { new: true, runValidators: true }
        );
      }

      if (!updatedDoc) {
        // Search by ticketNumber
        updatedDoc = await Issue.findOneAndUpdate(
          { ticketNumber: id },
          { $set: updateFields },
          { new: true, runValidators: true }
        );
      }

      if (!updatedDoc) {
        return res.status(404).json({
          success: false,
          message: `Issue '${id}' not found in MongoDB`,
        });
      }

      return res.status(200).json({
        success: true,
        message: `Issue ${updatedDoc.ticketNumber} updated in MongoDB.`,
        data: updatedDoc,
      });
    }

    // In-memory fallback
    const index = inMemoryIssues.findIndex((i) => i.id === id || i.ticketNumber === id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: `Issue '${id}' not found`,
      });
    }

    const updated = {
      ...inMemoryIssues[index],
      ...updateFields,
      updatedAt: new Date().toISOString(),
    };
    inMemoryIssues[index] = updated;

    return res.status(200).json({
      success: true,
      message: `Issue ${updated.ticketNumber} updated in memory.`,
      data: updated,
    });
  } catch (error) {
    console.error('PATCH /api/issues/:id error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 4. Authentication Endpoints
 * POST /api/auth/login
 * POST /api/auth/register
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const userProfile = {
      id: `usr-${Date.now()}`,
      name: email.split('@')[0],
      email,
      role: role || 'citizen',
      department:
        role === 'admin'
          ? 'Municipal Operations HQ'
          : role === 'staff'
          ? 'Zone 2 Rapid Clean Unit'
          : 'Verified Resident',
    };

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userProfile,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, role, department } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const userProfile = {
      id: `usr-${Date.now()}`,
      name,
      email,
      role: role || 'citizen',
      department: department || 'Verified Resident',
    };

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: userProfile,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * User Audit / Login Tracking Endpoints
 * POST /api/audit/login
 * GET /api/audit/login-logs
 */
app.post('/api/audit/login', async (req, res) => {
  try {
    const { email, role, name, action } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const rawUserAgent = req.headers['user-agent'] || 'Web Browser';
    const userAgent = typeof rawUserAgent === 'string' ? rawUserAgent.substring(0, 150) : 'Web Client';
    const now = new Date();

    const logEntry = {
      email: email.trim().toLowerCase(),
      role: role || 'citizen',
      name: name?.trim() || email.split('@')[0],
      action: action || 'login',
      timestamp: now,
      ipAddress: clientIp,
      userAgent,
    };

    if (isMongoConnected) {
      const doc = new LoginLog(logEntry);
      const saved = await doc.save();
      return res.status(201).json({
        success: true,
        message: 'Login log saved to MongoDB',
        data: saved,
      });
    }

    // In-memory fallback
    const fallback = {
      ...logEntry,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: now.toISOString(),
    };
    loginLogsStore.unshift(fallback);

    return res.status(201).json({
      success: true,
      message: 'Login log recorded in local store',
      data: fallback,
    });
  } catch (err) {
    console.error('Audit login log error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/audit/login-logs', async (_req, res) => {
  try {
    if (isMongoConnected) {
      const logs = await LoginLog.find().sort({ timestamp: -1 }).limit(100).lean();
      return res.status(200).json({
        success: true,
        count: logs.length,
        source: 'mongodb',
        data: logs.map((doc) => ({
          ...doc,
          id: doc._id.toString(),
        })),
      });
    }

    return res.status(200).json({
      success: true,
      count: loginLogsStore.length,
      source: 'in_memory_fallback',
      data: loginLogsStore,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * -------------------------------------------------------------
 * 6. USER AUTHENTICATION ENDPOINTS
 * -------------------------------------------------------------
 */

/**
 * POST /api/auth/register
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required for registration.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ success: false, message: 'Password must be at least 4 characters long.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (isMongoConnected) {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists. Please sign in instead.',
        });
      }

      const newUser = new User({
        name: name.trim(),
        email: normalizedEmail,
        password: password.trim(),
        role: role || 'citizen',
        department: department || (role === 'admin' ? 'Civic Operations HQ' : role === 'staff' ? 'Municipal Sanitation Crew' : 'Verified Resident'),
      });

      const savedUser = await newUser.save();
      return res.status(201).json({
        success: true,
        message: 'Account registered successfully! Welcome to EcoClean.',
        user: savedUser.toJSON(),
      });
    }

    // In-memory fallback
    const existsInMemory = inMemoryUsers.some((u) => u.email.toLowerCase() === normalizedEmail);
    if (existsInMemory) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists. Please sign in instead.',
      });
    }

    const inMemoryUser = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      password: password.trim(),
      role: role || 'citizen',
      department: department || (role === 'admin' ? 'Civic Operations HQ' : role === 'staff' ? 'Municipal Sanitation Crew' : 'Verified Resident'),
      createdAt: new Date().toISOString(),
    };

    inMemoryUsers.push(inMemoryUser);

    const { password: _p, ...cleanUser } = inMemoryUser;
    return res.status(201).json({
      success: true,
      message: 'Account registered successfully! Welcome to EcoClean.',
      user: cleanUser,
    });
  } catch (error) {
    console.error('POST /api/auth/register error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal registration error.' });
  }
});

/**
 * POST /api/auth/login
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }
    if (!password || !password.trim()) {
      return res.status(400).json({ success: false, message: 'Password is required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (isMongoConnected) {
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        return res.status(404).json({
          success: false,
          notRegistered: true,
          message: 'No account found with this email. Please register first!',
        });
      }

      if (user.password !== password.trim()) {
        return res.status(401).json({
          success: false,
          message: 'Incorrect password. Please verify and try again.',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Login successful.',
        user: user.toJSON(),
      });
    }

    // In-memory fallback
    const memoryUser = inMemoryUsers.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!memoryUser) {
      return res.status(404).json({
        success: false,
        notRegistered: true,
        message: 'No account found with this email. Please register first!',
      });
    }

    if (memoryUser.password !== password.trim()) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please verify and try again.',
      });
    }

    const { password: _p, ...cleanUser } = memoryUser;
    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      user: cleanUser,
    });
  } catch (error) {
    console.error('POST /api/auth/login error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal login error.' });
  }
});

// Standalone runner
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[EcoClean Standalone Server] Listening on http://0.0.0.0:${PORT}`);
  });
}

export default app;
