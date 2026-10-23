import mongoose from 'mongoose';
import { Driver } from './Driver.js';

const fuelEntrySchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  quantity: { type: Number, required: true }, // Liters / Kg / kWh
  unit: { type: String, default: 'Kg' },
  cost: { type: Number, required: true }, // in ₹
  station: { type: String, default: 'Municipal Depot Pump' },
  odometerKm: { type: Number, default: 0 },
  loggedBy: { type: String, default: 'Fleet Manager' }
}, { timestamps: true });

const serviceEntrySchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  serviceType: { type: String, default: 'Routine Inspection & Oil' },
  cost: { type: Number, default: 0 }, // in ₹
  workshop: { type: String, default: 'Municipal Central Workshop' },
  odometerKm: { type: Number, default: 0 },
  nextDue: { type: Date },
  notes: { type: String, default: '' },
  technician: { type: String, default: 'Chief Mechanic' }
}, { timestamps: true });

const vehicleIssueSchema = new mongoose.Schema({
  customId: { type: String }, // e.g. "TKT-301"
  driverName: { type: String, default: 'Fleet Driver' },
  driverPhone: { type: String, default: '' },
  category: { 
    type: String, 
    default: 'Hydraulics'
  },
  severity: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Critical'], 
    default: 'Medium' 
  },
  description: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Reported', 'Under Inspection', 'In Repair', 'Resolved'], 
    default: 'Reported' 
  },
  reportedDate: { type: Date, default: Date.now },
  resolvedDate: { type: Date },
  resolutionNotes: { type: String, default: '' }
}, { timestamps: true });

const vehicleSchema = new mongoose.Schema({
  vehicleNumber: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  }, // e.g. "Truck #GFT-22", "DL-01-EA-4921"
  vehicleType: { 
    type: String, 
    default: 'Compactor Truck'
  },
  model: { 
    type: String, 
    default: 'Tata 407 LPT' 
  },
  capacityKg: { 
    type: Number, 
    default: 2500 
  },
  fuelType: { 
    type: String, 
    default: 'CNG'
  },
  status: { 
    type: String, 
    default: 'Operational',
    enum: ['Operational', 'In-Transit', 'Under Maintenance', 'Decommissioned']
  },
  assignedDriverId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Driver', 
    default: null 
  },
  assignedDriverName: { 
    type: String, 
    default: 'Unassigned' 
  },
  assignedSector: { 
    type: String, 
    default: 'Unassigned' 
  },
  odometerKm: { 
    type: Number, 
    default: 12450 
  },
  lastServiceDate: { 
    type: Date, 
    default: Date.now 
  },
  nextServiceDue: { 
    type: Date, 
    default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) 
  },
  gpsUnitId: { 
    type: String, 
    default: '' 
  },
  remarks: { 
    type: String, 
    default: '' 
  },

  // Operational logs & complaints
  fuelLogs: [fuelEntrySchema],
  serviceLogs: [serviceEntrySchema],
  issues: [vehicleIssueSchema]
}, { timestamps: true });

export const Vehicle = mongoose.model('Vehicle', vehicleSchema);
export default Vehicle;
