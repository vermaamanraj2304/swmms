import mongoose from 'mongoose';

const pointsTransactionSchema = new mongoose.Schema({
  customId: { type: String, unique: true },
  residentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident', required: true },
  residentName: { type: String, default: 'Resident' },
  type: {
    type: String,
    enum: ['EARNED', 'REFUNDED', 'REDEEMED', 'BILL_REBATE', 'BONUS', 'ADJUSTMENT'],
    required: true
  },
  points: { type: Number, required: true }, // positive for credits, negative for debits
  direction: { type: String, enum: ['CREDIT', 'DEBIT'], default: 'CREDIT' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, default: 'General' }, // 'Waste Pickup', 'Order Refund', 'Gift Claim', 'Bill Discount'
  referenceId: { type: String, default: '' }, // e.g. RED-7229, #CMP-2572, #INV-1024
  balanceAfter: { type: Number },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

pointsTransactionSchema.pre('save', function (next) {
  if (!this.customId) {
    this.customId = `#TXN-${Math.floor(100000 + Math.random() * 900000)}`;
  }
  if (!this.direction) {
    this.direction = this.points >= 0 ? 'CREDIT' : 'DEBIT';
  }
  next();
});

export const PointsTransaction = mongoose.model('PointsTransaction', pointsTransactionSchema);
