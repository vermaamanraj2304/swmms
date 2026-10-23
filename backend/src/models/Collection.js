import mongoose from 'mongoose';
import { Resident } from './Resident.js';
import { Driver } from './Driver.js';

const collectionSchema = new mongoose.Schema({
  customId: { type: String },
  residentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident' },
  residentName: { type: String, default: '' },
  date: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['Recyclable', 'Organic', 'E-Waste', 'Hazardous', 'General Waste'], 
    default: 'General Waste' 
  },
  weightKg: { type: Number, required: true }, // Exact garbage weight in KG
  pointsEarned: { type: Number, required: true }, // Points credited based on waste type rate
  status: { type: String, enum: ['Completed', 'Delayed', 'Skipped'], default: 'Completed' },
  driver: { type: String, default: '' },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  confirmedByResident: { type: Boolean, default: false }
}, { timestamps: true });

export const Collection = mongoose.model('Collection', collectionSchema);
