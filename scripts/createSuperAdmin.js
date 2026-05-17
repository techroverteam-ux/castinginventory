const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const fs = require('fs')
const path = require('path')

// Load .env.local
const envPath = path.resolve(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length) {
        let value = valueParts.join('=').trim()
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1)
        }
        process.env[key.trim()] = value
      }
    }
  })
}

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not set. Create a .env.local file.')
  process.exit(1)
}

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'admin', 'manager', 'viewer'], default: 'viewer' },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  phone: String,
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true })

const User = mongoose.models.User || mongoose.model('User', UserSchema, 'cast_users')

async function createSuperAdmin() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    const existing = await User.findOne({ role: 'superadmin' })
    if (existing) {
      console.log('ℹ️  Super admin already exists.')
      console.log('📧 Email:', existing.email)
      return
    }

    const hashedPassword = await bcrypt.hash('admin123', 12)

    await User.create({
      name: 'Super Admin',
      email: 'admin@castinginventory.com',
      password: hashedPassword,
      role: 'superadmin',
      phone: '+91-9876543210',
      status: 'active',
    })

    console.log('✅ Super Admin created successfully!')
    console.log('📧 Email: admin@castinginventory.com')
    console.log('🔑 Password: admin123')
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await mongoose.disconnect()
  }
}

createSuperAdmin()
