import mongoose from 'mongoose';
import { Resident } from './Resident.js';

const paymentSchema = new mongoose.Schema({
  customId: { type: String, unique: true }, // e.g. '#INV-4921'
  residentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident' },
  residentName: { type: String, required: true },
  residentEmail: { type: String, default: '' },
  residentPhone: { type: String, default: '' },
  address: { type: String, required: true },
  plan: { type: String, default: 'Standard Municipal' },
  serviceType: { 
    type: String, 
    enum: ['Monthly Subscription', 'Emergency SOS Pickup', 'Commercial Bulk Waste', 'Special Clearance Surcharge'],
    default: 'Monthly Subscription' 
  },
  amount: { type: Number, required: true },
  originalAmount: { type: Number },
  pointsDiscount: { type: Number, default: 0 },
  pointsRedeemed: { type: Number, default: 0 },
  netAmountPaid: { type: Number },
  currency: { type: String, default: 'INR' },
  status: { 
    type: String, 
    enum: ['PAID', 'PENDING', 'OVERDUE', 'REFUNDED'], 
    default: 'PAID' 
  },
  paymentMethod: { 
    type: String, 
    enum: ['Credit Card (•••• 4242)', 'Direct Debit', 'UPI / NetBanking', 'Cash on Collection', 'Bank Wire'],
    default: 'Credit Card (•••• 4242)' 
  },
  transactionDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
  dueDate: { type: String, default: () => new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0] },
  billingPeriod: { type: String, default: 'October 2026' },
  notes: { type: String, default: '' }
}, { timestamps: true });

paymentSchema.pre('save', function (next) {
  if (!this.customId) {
    this.customId = `#INV-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  next();
});

export const Payment = mongoose.model('Payment', paymentSchema);
