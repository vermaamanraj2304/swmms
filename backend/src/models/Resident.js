import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const residentSchema = new mongoose.Schema({
  customId: { type: String, unique: true }, // e.g. '2931-RT', 'RES-101'
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'resident' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  avatar: { type: String, default: '' },
  city: { type: String, default: 'Greenfield City' },

  // Permanent House Location & Live GPS
  houseLocation: {
    address: { type: String, default: '' },
    lat: { type: Number, default: 28.6139 },
    lng: { type: Number, default: 77.2090 },
    sector: { type: String, default: 'Sector Alpha' }
  },
  liveLocation: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    address: { type: String, default: '' }
  },

  // Garbage Points & Sustainability Metrics
  garbagePoints: { type: Number, default: 0 },
  ecoScore: { type: Number, default: 0 },
  divertedWasteKg: { type: Number, default: 0 },
  recycledPercent: { type: Number, default: 0 },
  co2SavedKg: { type: Number, default: 0 },
  billing: {
    plan: { type: String, default: 'Standard Pro (120 Gallons)' },
    price: { type: Number, default: 29 },
    nextRenewal: { type: String, default: '' },
    status: { type: String, default: 'Active' },
    cardLast4: { type: String, default: '4242' }
  },

  // Assigned Sector Driver Details
  assignedDriverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
  assignedDriverName: { type: String, default: '' },
  assignedDriverPhone: { type: String, default: '' },
  assignedVehicle: { type: String, default: '' }
}, { timestamps: true });

residentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

residentSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export const Resident = mongoose.models.Resident || mongoose.model('Resident', residentSchema, 'residents');
export default Resident;
