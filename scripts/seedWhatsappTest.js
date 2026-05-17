/**
 * Run: node scripts/seedWhatsappTest.js
 * 
 * This seeds WhatsApp config for testing.
 * Use the Shree Braj Laser Soldering client's ID from your DB.
 * 
 * Steps:
 * 1. Login as superadmin
 * 2. Create a client "Shree Braj Laser Soldering" from /dashboard/clients
 * 3. Go to /dashboard/settings (as that client's admin) and fill business details
 * 4. Then as superadmin, go to /dashboard/whatsapp-requests and configure:
 *    - WABA ID: (from Meta Business Manager)
 *    - Phone Number ID: 1116347494891239
 *    - Access Token: (the token below)
 *    - Graph Version: v25.0
 *    - Template Name: (your approved template or leave empty for text messages)
 *    - Enable toggle: ON
 * 
 * OR run this script with the client ID to auto-configure:
 */

const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')

// Load env
const envPath = path.resolve(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length) {
        process.env[key.trim()] = valueParts.join('=').trim()
      }
    }
  })
}

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) { console.error('MONGODB_URI not set'); process.exit(1) }

const WhatsappConfigSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, unique: true },
  businessName: String,
  businessPhone: String,
  businessEmail: String,
  gstNumber: String,
  businessAddress: String,
  businessCategory: String,
  wabaId: String,
  phoneNumberId: String,
  accessToken: String,
  graphVersion: String,
  templateName: String,
  templateLanguage: String,
  enabled: Boolean,
  createdBy: mongoose.Schema.Types.ObjectId,
  updatedBy: mongoose.Schema.Types.ObjectId,
}, { timestamps: true })

const ClientSchema = new mongoose.Schema({ name: String, slug: String }, { timestamps: true })

async function main() {
  await mongoose.connect(MONGODB_URI)
  console.log('Connected to MongoDB')

  const Client = mongoose.model('Client', ClientSchema, 'cast_clients')
  const WhatsappConfig = mongoose.model('WhatsappConfig', WhatsappConfigSchema, 'cast_whatsapp_configs')

  // Find the client
  const client = await Client.findOne({ name: { $regex: /braj/i } })
  if (!client) {
    console.log('❌ Client "Shree Braj Laser Soldering" not found.')
    console.log('   Create it first from /dashboard/clients')
    const allClients = await Client.find({})
    console.log('   Available clients:', allClients.map(c => `${c.name} (${c._id})`))
    await mongoose.disconnect()
    return
  }

  console.log(`✅ Found client: ${client.name} (${client._id})`)

  // Upsert WhatsApp config
  await WhatsappConfig.findOneAndUpdate(
    { clientId: client._id },
    {
      clientId: client._id,
      businessName: 'SHREE BRAJ LASER SOLDERING',
      businessPhone: '9828584748',
      businessCategory: 'jewellery',
      businessAddress: 'Jaipur, Rajasthan',
      phoneNumberId: '1116347494891239',
      accessToken: 'EAAZBY3ls5NWEBRTkFROOpK3DQ6qqMOHavXPpZBBhFmfT6i5u4cqB9lvIM8WDgfY0p3eEtGQtBosehhXWv5F9dhP2nSe7Uk7yJDEjzTr8A5XxWgIItVa4GKla61wA6vVpRqQwxQ3k85mAZBtzvya0gqyWXbWGh2HrwmOTnpG8Yv2WfymAWQDZBmfWBRO0EgZDZD',
      graphVersion: 'v25.0',
      templateName: '',
      templateLanguage: 'en',
      enabled: true,
    },
    { upsert: true, new: true }
  )

  console.log('✅ WhatsApp config saved for', client.name)
  console.log('   Phone Number ID: 1116347494891239')
  console.log('   Enabled: true')
  console.log('')
  console.log('Now create a party with a phone number and make an entry.')
  console.log('The party will receive a WhatsApp notification automatically!')

  await mongoose.disconnect()
}

main().catch(console.error)
