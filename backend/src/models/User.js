import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Resident } from './Resident.js';
import { Driver } from './Driver.js';
import { AdminStaff, Admin } from './AdminStaff.js';

export { Resident, Driver, AdminStaff, Admin };

const userSchema = new mongoose.Schema({
  customId: { type: String, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['resident', 'driver', 'admin', 'superadmin', 'staff', 'cityadmin'], 
    required: true 
  },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  avatar: { type: String, default: '' },
  title: { type: String, default: '' },
  department: { type: String, default: 'Operations' },
  officeLocation: { type: String, default: 'Civic Centre, 4th Floor, Command Suite 402' },
  
  // Driver specific fields
  assignedVehicle: { type: String, default: '' },
  activeSector: { type: String, default: '' },
  isOnDuty: { type: Boolean, default: false },
  isBroadcastingGPS: { type: Boolean, default: false },
  gender: { type: String, default: 'Male' },
  aadharNumber: { type: String, default: '' },
  drivingLicence: { type: String, default: '' },
  dob: { type: String, default: '' },
  emergencyContact: { type: String, default: '' },
  emergencyPhone: { type: String, default: '' },
  bloodGroup: { type: String, default: '' },
  experienceYears: { type: Number, default: 0 },
  
  // Location Fields
  houseLocation: {
    address: { type: String, default: '' },
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    sector: { type: String, default: '' }
  },
  liveLocation: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    address: { type: String, default: '' },
    speedKm: { type: Number, default: 0 },
    heading: { type: String, default: 'N/A' },
    lastBroadcastTime: { type: String, default: 'Off' }
  },

  // Fixed Registered Location (for driver off duty standby location)
  registeredLocation: {
    lat: { type: Number, default: 28.4848 },
    lng: { type: Number, default: 77.5135 },
    address: { type: String, default: 'Municipal Base Depot Station' }
  },
  
  // Resident specific fields & Garbage Points System
  garbagePoints: { type: Number, default: 0 },
  ecoScore: { type: Number, default: 0 },
  divertedWasteKg: { type: Number, default: 0 },
  recycledPercent: { type: Number, default: 0 },
  co2SavedKg: { type: Number, default: 0 },
  billing: {
    plan: { type: String, default: '' },
    price: { type: Number, default: 0 },
    nextRenewal: { type: String, default: '' },
    status: { type: String, default: 'Inactive' },
    cardLast4: { type: String, default: '' }
  },

  // Assigned Sector Driver Details (for resident role)
  assignedDriverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
  assignedDriverName: { type: String, default: '' },
  assignedDriverPhone: { type: String, default: '' },

  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
