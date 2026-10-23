import mongoose from 'mongoose';

const citySchema = new mongoose.Schema({
  customId: { type: String, unique: true }, // 'CITY-001'
  name: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, default: 'India' },
  adminName: { type: String, required: true },
  adminEmail: { type: String, required: true },
  phone: { type: String, default: '' },
  status: { type: String, enum: ['Active', 'Pending Setup', 'Suspended'], default: 'Active' },
  fleetSize: { type: Number, default: 0 },
  residentsCount: { type: Number, default: 0 },
  monthlyRevenue: { type: Number, default: 0 },
  contractTier: { type: String, default: 'Standard Municipal' },
  joinedDate: { type: String, default: 'Just Now' }
}, { timestamps: true });

export const City = mongoose.model('City', citySchema);
