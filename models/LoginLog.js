import mongoose from 'mongoose';

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
export default LoginLog;
