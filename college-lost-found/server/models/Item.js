import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true, trim: true },
    type: { type: String, enum: ['Lost', 'Found'], required: true },
    location: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    image: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Lost', 'Found', 'Claim Requested', 'Claim Approved', 'Returned', 'Closed'],
      required: true,
    },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

export default mongoose.models.Item || mongoose.model('Item', itemSchema);