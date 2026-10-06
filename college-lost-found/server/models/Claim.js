import mongoose from 'mongoose';

const claimSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    claimant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    proofDescription: { type: String, required: true, trim: true, maxlength: 5000 },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  },
  { timestamps: true },
);

claimSchema.index({ item: 1, claimant: 1 }, { unique: true });

export default mongoose.models.Claim || mongoose.model('Claim', claimSchema);