import mongoose from 'mongoose';

const pricingPlanSchema = new mongoose.Schema({
  customId: { type: String, unique: true }, // e.g. 'plan_standard'
  name: { type: String, required: true },
  price: { type: Number, required: true }, // in Rupee (₹)
  billingCycle: { type: String, default: 'Monthly' }, // 'Monthly', 'Annual', 'Per Dispatch'
  coverage: { type: String, default: '' },
  badge: { type: String, default: 'Active' },
  color: { type: String, default: 'emerald' },
  features: [{ type: String }],
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['Active', 'Archived'], default: 'Active' }
}, { timestamps: true });

export const PricingPlan = mongoose.model('PricingPlan', pricingPlanSchema);
