import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  customId: { type: String, unique: true }, // '#LOG-9001'
  event: { type: String, required: true },
  user: { type: String, required: true },
  severity: { type: String, enum: ['Info', 'Security', 'Billing', 'Update', 'Critical'], default: 'Info' },
  time: { type: String, default: 'Just now' }
}, { timestamps: true });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
