import mongoose from 'mongoose';
import { Driver } from './Driver.js';

const serviceAreaSchema = new mongoose.Schema({
  customId: { type: String, unique: true }, // e.g. 'AREA-001'
  name: { type: String, required: true }, // e.g. 'Sector Alpha'
  displayName: { type: String, required: true }, // e.g. 'Sector Alpha (Zone 1 - North Greenfield)'
  zone: { type: String, default: 'Zone 1' },
  description: { type: String, default: '' },
  coverageType: { 
    type: String, 
    enum: ['Residential', 'Commercial', 'Industrial', 'Mixed Use', 'High-Density Residential'], 
    default: 'Residential' 
  },
  centerLat: { type: Number, required: true, default: 28.6139 },
  centerLng: { type: Number, required: true, default: 77.2090 },
  radiusKm: { type: Number, default: 5.0 },
  coverageShape: { type: String, default: 'polygon' },
  polygonCoordinates: [
    {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    }
  ],
  perimeterKm: { type: Number, default: 0 },
  squareWidthKm: { type: Number, default: 4.0 },
  squareHeightKm: { type: Number, default: 4.0 },
  areaSqKm: { type: Number, default: 16.0 },
  bounds: {
    north: { type: Number },
    south: { type: Number },
    east: { type: Number },
    west: { type: Number }
  },
  collectionFrequency: { type: String, default: 'Daily Morning (07:00 AM - 11:00 AM)' },
  targetHouseholds: { type: Number, default: 250 },
  assignedVehicle: { type: String, default: 'Unassigned' },
  assignedDriverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
  assignedDriverName: { type: String, default: 'Unassigned' },
  status: { type: String, enum: ['Active', 'Under Maintenance', 'Inactive'], default: 'Active' },
  stopsCount: { type: Number, default: 4 }
}, { timestamps: true });

export const ServiceArea = mongoose.model('ServiceArea', serviceAreaSchema);
