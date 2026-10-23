import mongoose from 'mongoose';
import { Driver } from './Driver.js';

const routeStopSchema = new mongoose.Schema({
  customId: { type: String }, // '01'
  residentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident' },
  residentName: { type: String, required: true },
  residentPhone: { type: String, default: '' },
  address: { type: String, required: true },
  location: { type: String, default: '' },
  type: { type: String, default: 'Residential' },
  time: { type: String, default: '08:00 AM' },
  binType: { type: String, default: 'Garbage Bin' },
  status: { type: String, enum: ['PENDING', 'PICKED', 'SKIPPED'], default: 'PENDING' },
  distance: { type: String, default: '100m away' },
  isNearby: { type: Boolean, default: false },
  proofImage: { type: String, default: null },
  notes: { type: String, default: '' },
  lat: { type: Number, default: 28.6139 },
  lng: { type: Number, default: 77.2090 }
});

const routeSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. 'Sector Alpha (North Greenfield)'
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  stopsCount: { type: Number, default: 0 },
  distance: { type: String, default: '14.2 km' },
  estTime: { type: String, default: '3h 15m' },
  stops: [routeStopSchema]
}, { timestamps: true });

export const Route = mongoose.model('Route', routeSchema);
