import mongoose from 'mongoose';
import { Resident } from './Resident.js';
import { Driver } from './Driver.js';

const emergencyRequestSchema = new mongoose.Schema({
  customId: { type: String, sparse: true }, // '#REQ-8291' or '#EMR-202'
  reqId: { type: String },
  residentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident' },
  residentName: { type: String, required: true },
  address: { type: String, required: true },
  reason: { type: String, required: true },
  type: { type: String, default: 'Garbage' },
  garbageType: { type: String, default: 'General Organic' },
  estimatedQuantityKg: { type: Number, default: 10 },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'High' },
  date: { type: String, default: 'Today' },
  status: { 
    type: String, 
    enum: ['NEW', 'PENDING_DISPATCH', 'DISPATCHED', 'ON THE WAY', 'PICKED_UP', 'RESOLVED', 'CANCELLED'], 
    default: 'PENDING_DISPATCH' 
  },
  assignedDriverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
  assignedDriverName: { type: String, default: 'Unassigned' },
  assignedDriverPhone: { type: String, default: '' },
  assignedDriverVehicle: { type: String, default: '' },
  driverLiveLocation: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    speedKm: { type: Number, default: 0 },
    heading: { type: String, default: 'En Route' },
    lastUpdated: { type: String, default: '' }
  },
  routeCoordinates: [
    {
      lat: { type: Number },
      lng: { type: Number }
    }
  ],
  etaMinutes: { type: Number, default: 8 },
  proofImage: { type: String, default: '' },
  lat: { type: Number, default: 0 },
  lng: { type: Number, default: 0 },
  destinationLat: { type: Number, default: 0 },
  destinationLng: { type: Number, default: 0 },
  pickedUpAt: { type: Date }
}, { timestamps: true });

emergencyRequestSchema.pre('save', function (next) {
  if (!this.customId) {
    this.customId = this.reqId || `#REQ-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  if (!this.reqId) {
    this.reqId = this.customId;
  }
  next();
});

export const EmergencyRequest = mongoose.model('EmergencyRequest', emergencyRequestSchema);


