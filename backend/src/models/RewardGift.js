import mongoose from 'mongoose';

const rewardGiftSchema = new mongoose.Schema({
  customId: { type: String, unique: true }, // e.g. 'GIFT-101'
  title: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Garbage Bags', 'Trash Bins', 'Eco Tools & Accessories', 'Bill Discount & Vouchers'], 
    required: true 
  },
  size: { type: String, default: 'Standard' }, // e.g. 'Small (10L)', 'Medium (30L)', 'Large (60L)', 'Extra-Large (120L)', '240L Backyard Composter'
  pointsRequired: { type: Number, required: true },
  stock: { type: Number, default: 100 },
  description: { type: String, default: '' },
  badge: { type: String, default: '' }, // 'Popular', 'Eco Essential', 'Best Value'
  iconName: { type: String, default: 'Package' },
  color: { type: String, default: 'emerald' },
  status: { type: String, enum: ['Active', 'Out of Stock', 'Discontinued'], default: 'Active' }
}, { timestamps: true });

rewardGiftSchema.pre('save', function (next) {
  if (!this.customId) {
    this.customId = `GIFT-${Math.floor(100 + Math.random() * 900)}`;
  }
  next();
});

export const RewardGift = mongoose.model('RewardGift', rewardGiftSchema);
