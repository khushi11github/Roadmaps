const mongoose = require('mongoose')

const SkillSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  proficiency: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true }
}, { _id: false })

const GapSchema = new mongoose.Schema({
  name: { type: String, required: true },
  currentProficiency: { type: String, default: 'None' },
  requiredProficiency: { type: String, required: true },
  category: { type: String, enum: ['Known', 'Improvement', 'Missing'], required: true },
  priority: { type: String, enum: ['High', 'Medium', 'Low'], required: true },
  resources: [{ type: String, default: [] }]
}, { _id: false })

const SkillAssessmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  career: { type: String, required: true, trim: true },
  existingSkills: { type: [SkillSchema], default: [] },
  requiredSkills: { type: [SkillSchema], default: [] },
  gaps: { type: [GapSchema], default: [] },
  summary: { type: String, default: '' },
  provider: { type: String, enum: ['ai', 'catalog'], default: 'catalog' },
  createdAt: { type: Date, default: Date.now }
})

SkillAssessmentSchema.index({ user: 1, createdAt: -1 })

module.exports = mongoose.models.SkillAssessment || mongoose.model('SkillAssessment', SkillAssessmentSchema)
