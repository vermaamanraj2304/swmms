import mongoose from 'mongoose';
import { Resident } from './Resident.js';

const rewardRedemptionSchema = new mongoose.Schema({
  customId: { type: String, required: true },
  residentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident', required: true },
  residentName: { type: String, default: 'Resident' },
  residentEmail: { type: String, default: '' },
  residentPhone: { type: String, default: '' },
  deliveryAddress: { type: String, default: '' },
  rewardId: { type: mongoose.Schema.Types.ObjectId, ref: 'RewardGift' },
  rewardTitle: { type: String, required: true },
  category: { type: String, default: 'Eco Product' },
  size: { type: String, default: 'Standard' },
  pointsRedeemed: { type: Number, required: true },
  redemptionCode: { type: String, required: true },
  deliveryStatus: { 
    type: String, 
    enum: [
      'ORDER PLACED', 
      'ACCEPTED', 
      'PACKED', 
      'OUT FOR DELIVERY', 
      'DELIVERED', 
      'CANCELLED',
      'PROCESSING', 
      'DISPATCHED', 
      'COMPLETED',
      'REFUNDED'
    ], 
    default: 'ORDER PLACED' 
  },
  status: { type: String, enum: ['ACTIVE', 'USED', 'EXPIRED', 'COMPLETED', 'DELIVERED', 'REFUNDED'], default: 'ACTIVE' },
  // Driver Assignment for Sector/Area Delivery
  assignedDriverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  assignedDriverName: { type: String, default: '' },
  assignedDriverPhone: { type: String, default: '' },
  assignedVehicle: { type: String, default: '' },
  sector: { type: String, default: '' },
  // QR Delivery Verification Code
  qrCode: { type: String, default: '' },
  // Timestamps
  packedAt: { type: Date },
  pickedUpAt: { type: Date },
  deliveredAt: { type: Date },
  deliveryProof: { type: String, default: '' },
  // Order Complaint, Refund & Exchange Linkage
  isExchange: { type: Boolean, default: false },
  originalOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'RewardRedemption' },
  originalOrderCustomId: { type: String, default: '' },
  hasComplaint: { type: Boolean, default: false },
  complaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
  complaintText: { type: String, default: '' },
  complaintStatus: { type: String, default: '' },
  complaintDate: { type: Date },
  // Refund Details
  isRefunded: { type: Boolean, default: false },
  refundedPoints: { type: Number, default: 0 },
  refundedAmountInr: { type: Number, default: 0 },
  refundedAt: { type: Date },
  refundNotes: { type: String, default: '' },
  refundTransactionId: { type: String, default: '' },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

export const RewardRedemption = mongoose.model('RewardRedemption', rewardRedemptionSchema);
