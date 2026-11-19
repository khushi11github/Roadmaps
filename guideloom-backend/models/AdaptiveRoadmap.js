const mongoose = require('mongoose')

const ResourceSchema = new mongoose.Schema({
  type: { type: String, default: 'doc' },
  label: { type: String, required: true },
  url: { type: String, required: true }
}, { _id: false })

const TopicSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  prerequisites: { type: [String], default: [] },
  estimatedHours: { type: Number, default: 2, min: 0 },
  assignments: { type: [String], default: [] },
  resources: { type: [ResourceSchema], default: [] },
  status: { type: String, enum: ['Locked', 'Available', 'Completed'], default: 'Locked' },
  struggling: { type: Boolean, default: false },
  assessment: { type: String, enum: ['Not set', 'Easy', 'Good', 'Challenging', 'Struggled'], default: 'Not set' },
  completedAt: { type: Date, default: null }
}, { _id: false })

const MilestoneSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  topicIds: { type: [String], default: [] },
  status: { type: String, enum: ['Locked', 'Available', 'Completed'], default: 'Locked' }
}, { _id: false })

const HistorySchema = new mongoose.Schema({
  topicId: { type: String, required: true },
  action: { type: String, enum: ['completed', 'struggled', 'assessed', 'unlocked'], required: true },
  assessment: { type: String, default: '' },
  note: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
}, { _id: false })

const AdaptiveRoadmapSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  assessment: { type: mongoose.Schema.Types.ObjectId, ref: 'SkillAssessment', default: null },
  career: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  phases: [{
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    topicIds: { type: [String], default: [] }
  }],
  topics: { type: [TopicSchema], default: [] },
  milestones: { type: [MilestoneSchema], default: [] },
  history: { type: [HistorySchema], default: [] },
  recommendations: { type: [String], default: [] },
  completionPercent: { type: Number, default: 0, min: 0, max: 100 },
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
})

AdaptiveRoadmapSchema.index({ user: 1, career: 1 }, { unique: true })

module.exports = mongoose.models.AdaptiveRoadmap || mongoose.model('AdaptiveRoadmap', AdaptiveRoadmapSchema)
