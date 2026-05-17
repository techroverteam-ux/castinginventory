import * as XLSX from 'xlsx'

interface ExportOptions {
  title: string
  clientName?: string
  clientLogo?: string
  columns: { header: string; key: string; width?: number }[]
  data: Record<string, any>[]
  fileName: string
}

export function exportToExcel({ title, clientName, columns, data, fileName }: ExportOptions) {
  const ws = XLSX.utils.aoa_to_sheet([])

  // Header rows
  XLSX.utils.sheet_add_aoa(ws, [[clientName || 'Casting Inventory']], { origin: 'A1' })
  XLSX.utils.sheet_add_aoa(ws, [[title]], { origin: 'A2' })
  XLSX.utils.sheet_add_aoa(ws, [[`Generated: ${new Date().toLocaleString('en-IN')}`]], { origin: 'A3' })
  XLSX.utils.sheet_add_aoa(ws, [['']], { origin: 'A4' })

  // Column headers
  const headers = columns.map(c => c.header)
  XLSX.utils.sheet_add_aoa(ws, [headers], { origin: 'A5' })

  // Data rows
  const rows = data.map(row => columns.map(c => row[c.key] ?? ''))
  XLSX.utils.sheet_add_aoa(ws, rows, { origin: 'A6' })

  // Column widths
  ws['!cols'] = columns.map(c => ({ wch: c.width || 15 }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Report')
  XLSX.writeFile(wb, `${fileName}.xlsx`)
}

export async function exportToPDF({ title, clientName, clientLogo, columns, data, fileName }: ExportOptions) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: data.length > 5 ? 'landscape' : 'portrait' })

  let startY = 15

  // Client logo
  if (clientLogo) {
    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject()
        img.src = clientLogo
      })
      doc.addImage(img, 'PNG', 14, 10, 25, 25)
      startY = 20
    } catch {}
  }

  // Title
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(clientName || 'Casting Inventory', clientLogo ? 45 : 14, startY)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(title, clientLogo ? 45 : 14, startY + 6)
  doc.setFontSize(8)
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, clientLogo ? 45 : 14, startY + 11)

  // Table
  autoTable(doc, {
    startY: clientLogo ? 40 : startY + 18,
    head: [columns.map(c => c.header)],
    body: data.map(row => columns.map(c => String(row[c.key] ?? ''))),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 249, 250] },
  })

  doc.save(`${fileName}.pdf`)
}
