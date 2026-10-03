import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'citizen' | 'staff' | 'admin';
  department?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
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
      minlength: [4, 'Password must be at least 4 characters'],
    },
    role: {
      type: String,
      enum: ['citizen', 'staff', 'admin'],
      default: 'citizen',
    },
    department: {
      type: String,
      default: 'Verified Resident',
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        delete ret.password; // Never expose password in JSON
        return ret;
      },
    },
  }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
