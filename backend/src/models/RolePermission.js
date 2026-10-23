import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  customId: { type: String, unique: true }, // e.g. 'ROLE-101'
  name: { type: String, required: true }, // e.g. 'Sanitation Supervisor', 'Dispatcher'
  scope: { type: String, enum: ['cityadmin', 'superadmin'], required: true },
  department: { type: String, default: 'Complaint Management' },
  description: { type: String, default: '' },
  permissions: [{ type: String }], // Array of permission strings
  isSystemDefault: { type: Boolean, default: false }
}, { timestamps: true });

const staffSchema = new mongoose.Schema({
  customId: { type: String, unique: true }, // e.g. 'EMP-501'
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, default: '' },
  department: { type: String, default: 'Operations' },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
  roleName: { type: String, required: true },
  scope: { type: String, enum: ['cityadmin', 'superadmin'], required: true },
  city: { type: String, default: 'Seattle Metro' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  password: { type: String, default: 'Staff@123' }
}, { timestamps: true });

export const Role = mongoose.model('Role', roleSchema);
export const Staff = mongoose.model('Staff', staffSchema);
