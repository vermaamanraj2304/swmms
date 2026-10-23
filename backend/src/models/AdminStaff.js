import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const adminStaffSchema = new mongoose.Schema({
  customId: { type: String, unique: true }, // e.g. 'ADM-001', 'HQ-SUP-001', 'EMP-101'
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'superadmin', 'cityadmin', 'staff'], 
    default: 'admin' 
  },
  scope: { 
    type: String, 
    enum: ['cityadmin', 'superadmin'], 
    default: 'cityadmin' 
  },
  phone: { type: String, default: '' },
  department: { type: String, default: 'Operations' },
  title: { type: String, default: 'Municipal Coordinator' },
  roleName: { type: String, default: 'Sanitation Operations Supervisor' },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
  permissions: [{ type: String }],
  avatar: { type: String, default: '' },
  city: { type: String, default: 'Central Municipal Ward' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  officeLocation: { type: String, default: 'Civic Centre, 4th Floor, Command Suite 402' },
  emergencyPhone: { type: String, default: '+91 120 234 5678' }
}, { timestamps: true });

adminStaffSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

adminStaffSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export const AdminStaff = mongoose.models.AdminStaff || mongoose.model('AdminStaff', adminStaffSchema, 'admin_staff');
export const Admin = AdminStaff;
export default AdminStaff;
