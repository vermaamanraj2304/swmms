import mongoose from 'mongoose';

const pointSettingSchema = new mongoose.Schema({
  key: { type: String, default: 'global_point_settings', unique: true },
  pointValueInr: { type: Number, default: 0.50 }, // 1 Point = ₹0.50
  pointsPerRupee: { type: Number, default: 2 },   // 2 Points = ₹1.00
  ratesPerKg: {
    Recyclable: { type: Number, default: 15 },    // 15 pts/kg
    Organic: { type: Number, default: 10 },       // 10 pts/kg
    'E-Waste': { type: Number, default: 50 },     // 50 pts/kg
    Hazardous: { type: Number, default: 30 },     // 30 pts/kg
    'General Waste': { type: Number, default: 5 } // 5 pts/kg
  },
  minRedemptionPoints: { type: Number, default: 50 },
  maxBillDiscountPercent: { type: Number, default: 50 },
  bonusMultiplier: { type: Number, default: 1.0 }, // e.g. 1.2x for festive/campaign
  updatedBy: { type: String, default: 'Municipal Admin' }
}, { timestamps: true });

export const PointSetting = mongoose.models.PointSetting || mongoose.model('PointSetting', pointSettingSchema);
export default PointSetting;
