import WhatsappConfig from '@/models/WhatsappConfig'
import dbConnect from '@/lib/mongodb'

function normalizeIndiaMobile(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '')
  if (!digits) throw new Error('Phone number is empty')
  if (digits.startsWith('91') && digits.length === 12) return digits
  if (digits.length === 10) return `91${digits}`
  if (digits.startsWith('0') && digits.length === 11) return `91${digits.slice(1)}`
  return `91${digits}`
}

interface SendTextOptions {
  clientId: string
  phone: string
  message: string
}

interface SendResult {
  success: boolean
  messageId?: string
  error?: string
}

export async function sendWhatsAppText({ clientId, phone, message }: SendTextOptions): Promise<SendResult> {
  try {
    await dbConnect()
    const config = await WhatsappConfig.findOne({ clientId })

    if (!config || !config.enabled) {
      return { success: false, error: 'WhatsApp not enabled for this client' }
    }
    if (!config.accessToken || !config.phoneNumberId) {
      return { success: false, error: 'WhatsApp credentials not configured' }
    }

    const to = normalizeIndiaMobile(phone)
    const graphVersion = config.graphVersion || 'v25.0'

    // If template is configured, use template message
    if (config.templateName) {
      return await sendWithTemplate(config, to, message)
    }

    // Otherwise send plain text
    const res = await fetch(
      `https://graph.facebook.com/${graphVersion}/${config.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { preview_url: false, body: message },
        }),
      }
    )

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      console.error('WhatsApp send failed:', JSON.stringify(data))
      return { success: false, error: data?.error?.message || `HTTP ${res.status}` }
    }

    return { success: true, messageId: data?.messages?.[0]?.id }
  } catch (error: any) {
    console.error('WhatsApp error:', error)
    return { success: false, error: error.message }
  }
}

async function sendWithTemplate(config: any, to: string, message: string): Promise<SendResult> {
  const graphVersion = config.graphVersion || 'v25.0'
  const languages = [config.templateLanguage || 'en', 'en_US', 'en']

  for (const langCode of languages) {
    const templatePayload = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: config.templateName,
        language: { code: langCode },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: message }
            ]
          }
        ]
      }
    }

    const res = await fetch(
      `https://graph.facebook.com/${graphVersion}/${config.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templatePayload),
      }
    )

    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      return { success: true, messageId: data?.messages?.[0]?.id }
    }

    console.error(`Template ${langCode} failed:`, JSON.stringify(data))
  }

  // Template failed, fallback to plain text
  const res = await fetch(
    `https://graph.facebook.com/${graphVersion}/${config.phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { preview_url: false, body: message },
      }),
    }
  )

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: data?.error?.message || 'Template and text both failed' }
  }
  return { success: true, messageId: data?.messages?.[0]?.id }
}

export function formatEntryNotification(entry: {
  recNo: number
  date: string
  paymentMode: string
  partyName: string
  productName: string
  pcs: number
  rate: number
  amount: number
  remarks?: string
  netBalance: number
  netBalanceType: string
  businessName: string
}): string {
  return `*NEW ENTRY*
REC No.   : ${entry.recNo}
DATE      : ${entry.date}
MODE      : ${entry.paymentMode}
PARTY     : ${entry.partyName}
PRODUCT   : ${entry.productName}
PCS       : ${entry.pcs}
RATE      : ${entry.rate.toFixed(2)}
AMOUNT    : ${entry.amount.toFixed(2)}
${entry.remarks ? `REMARK    : ${entry.remarks}\n` : ''}
NET BALANCE : ${entry.netBalance.toFixed(2)} ${entry.netBalanceType}
FROM : ${entry.businessName}`
}
