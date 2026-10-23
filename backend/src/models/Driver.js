import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const driverSchema = new mongoose.Schema({
  customId: { type: String, unique: true }, // e.g. 'DRV-902'
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'driver' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  avatar: { type: String, default: '' },
  title: { type: String, default: 'Senior Fleet Operator' },

  // Driver specific fleet attributes
  assignedVehicle: { type: String, default: '' },
  activeSector: { type: String, default: '' },
  isOnDuty: { type: Boolean, default: false },
  isBroadcastingGPS: { type: Boolean, default: false },

  // Personal, Identity & Verification details
  gender: { type: String, default: 'Male' },
  aadharNumber: { type: String, default: '' },
  drivingLicence: { type: String, default: '' },
  dob: { type: String, default: '' },
  emergencyContact: { type: String, default: '' },
  emergencyPhone: { type: String, default: '' },
  bloodGroup: { type: String, default: '' },
  experienceYears: { type: Number, default: 0 },

  // Live telemetry GPS location
  liveLocation: {
    lat: { type: Number, default: 28.6139 },
    lng: { type: Number, default: 77.2090 },
    address: { type: String, default: '' },
    speedKm: { type: Number, default: 0 },
    heading: { type: String, default: 'Standby' },
    lastBroadcastTime: { type: String, default: 'Off' }
  },

  // Fixed Registered Base Depot Location (shown on resident panel when off duty)
  registeredLocation: {
    lat: { type: Number, default: 28.4848 },
    lng: { type: Number, default: 77.5135 },
    address: { type: String, default: 'Municipal Base Depot Station' }
  }
}, { timestamps: true });

driverSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

driverSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export const Driver = mongoose.models.Driver || mongoose.model('Driver', driverSchema, 'drivers');
export default Driver;
