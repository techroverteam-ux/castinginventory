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
  const wb = XLSX.utils.book_new()

  // Build rows
  const rows: any[][] = []

  // Header info
  rows.push([clientName || 'Casting Inventory'])
  rows.push([title])
  rows.push([`Generated: ${new Date().toLocaleString('en-IN')}`])
  rows.push([]) // empty row

  // Column headers
  rows.push(columns.map(c => c.header))

  // Data rows
  data.forEach(row => {
    rows.push(columns.map(c => row[c.key] ?? ''))
  })

  const ws = XLSX.utils.aoa_to_sheet(rows)

  // Column widths
  ws['!cols'] = columns.map(c => ({ wch: c.width || 15 }))

  // Merge title cells across all columns
  const colCount = columns.length
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: colCount - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: colCount - 1 } },
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Report')
  XLSX.writeFile(wb, `${fileName}.xlsx`)
}

export async function exportToPDF({ title, clientName, clientLogo, columns, data, fileName }: ExportOptions) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: columns.length > 7 ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' })

  let startY = 12

  // Try to add client logo
  if (clientLogo) {
    try {
      const response = await fetch(clientLogo)
      const blob = await response.blob()
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })
      doc.addImage(base64, 'PNG', 14, 8, 20, 20)
      startY = 14
    } catch {
      // Logo failed, continue without it
    }
  }

  // Title section
  const titleX = clientLogo ? 38 : 14
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(clientName || 'Casting Inventory', titleX, startY)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(title, titleX, startY + 7)

  doc.setFontSize(8)
  doc.setTextColor(100)
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, titleX, startY + 12)
  doc.setTextColor(0)

  // Table
  autoTable(doc, {
    startY: clientLogo ? 34 : startY + 18,
    head: [columns.map(c => c.header)],
    body: data.map(row => columns.map(c => String(row[c.key] ?? ''))),
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    bodyStyles: {
      textColor: [30, 30, 30],
    },
    alternateRowStyles: {
      fillColor: [248, 249, 252],
    },
    columnStyles: columns.reduce((acc, col, i) => {
      if (col.key === 'amount' || col.key === 'rate' || col.key === 'pcs') {
        acc[i] = { halign: 'right' }
      }
      return acc
    }, {} as Record<number, any>),
    margin: { left: 14, right: 14 },
    tableLineColor: [200, 200, 200],
    tableLineWidth: 0.1,
  })

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(150)
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - 25, doc.internal.pageSize.getHeight() - 8)
    doc.text(clientName || 'Casting Inventory', 14, doc.internal.pageSize.getHeight() - 8)
  }

  doc.save(`${fileName}.pdf`)
}
