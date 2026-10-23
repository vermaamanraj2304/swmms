import mongoose from 'mongoose';
import { Resident } from './Resident.js';

const complaintSchema = new mongoose.Schema({
  customId: { type: String, sparse: true }, // '#CMP-901'
  ticketId: { type: String },
  ticketNumber: { type: String },
  residentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident' },
  residentName: { type: String, default: 'Resident' },
  residentEmail: { type: String, default: '' },
  residentAddress: { type: String, default: '' },
  residentSector: { type: String, default: '' },
  residentPhone: { type: String, default: '' },
  residentCustomId: { type: String, default: '' },
  adminNotes: { type: String, default: '' },
  title: { type: String, default: 'Service Ticket' },
  complaintType: { type: String, default: 'Resident' }, // 'Resident', 'Roadside Garbage', or 'Order Complain'
  category: { type: String, default: 'General' },
  type: { type: String, default: 'Service Complaint' }, // e.g. 'Garbage Not Collected', 'Broken Bin', 'Missed Pickup', 'Reward Order Issue'
  // Linked Reward Order (if complaint is regarding an order)
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'RewardRedemption' },
  orderCustomId: { type: String, default: '' },
  orderTitle: { type: String, default: '' },
  description: { type: String, required: true },
  landmark: { type: String, default: '' },
  priority: { type: String, default: 'Medium' }, // 'Low', 'Medium', 'High', 'Critical'
  assignedDriver: { type: String, default: 'Unassigned' },
  assignedDriverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  assignedVehicle: { type: String, default: '' },
  lat: { type: Number, default: 28.6139 },
  lng: { type: Number, default: 77.2090 },
  location: {
    lat: { type: Number, default: 28.6139 },
    lng: { type: Number, default: 77.2090 },
    address: { type: String, default: '' }
  },
  status: { 
    type: String, 
    enum: ['Under Review', 'Investigating', 'In Progress', 'On the Way', 'Resolved', 'Rejected', 'Open', 'RESOLVED', 'IN_PROGRESS', 'PENDING'], 
    default: 'Under Review' 
  },
  resolvedAt: { type: Date },
  resolutionNotes: { type: String, default: '' },
  clearedWeightKg: { type: Number, default: 0 },
  driverStartedAt: { type: Date },
  emergencyCustomId: { type: String, default: '' },
  resolutionType: { type: String, enum: ['', 'REFUND', 'EXCHANGE', 'RESOLVED_GENERAL', 'REJECTED'], default: '' },
  exchangeOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'RewardRedemption' },
  exchangeOrderCustomId: { type: String, default: '' },
  refundPoints: { type: Number, default: 0 },
  date: { type: String, default: 'Today' }
}, { timestamps: true });

// Auto-fill fields if not provided
complaintSchema.pre('save', function (next) {
  if (!this.customId && !this.ticketId && !this.ticketNumber) {
    const generatedId = `#CMP-${Math.floor(1000 + Math.random() * 9000)}`;
    this.customId = generatedId;
    this.ticketId = generatedId;
    this.ticketNumber = generatedId;
  } else {
    const primaryId = this.customId || this.ticketId || this.ticketNumber;
    this.customId = primaryId;
    this.ticketId = primaryId;
    this.ticketNumber = primaryId;
  }
  if (!this.type && this.category) {
    this.type = this.category;
  }
  if (!this.category && this.type) {
    this.category = this.type;
  }
  if (!this.title) {
    this.title = this.category || 'Service Ticket';
  }
  next();
});

export const Complaint = mongoose.model('Complaint', complaintSchema);

