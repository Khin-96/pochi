// lib/receipt.ts
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function generateReceiptPDF(transactionId: string): Promise<Buffer> {
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Draw receipt header
    page.drawText('POCHI YANGU RECEIPT', {
      x: 50,
      y: height - 50,
      size: 20,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText(`Receipt #: ${transactionId}`, {
      x: 50,
      y: height - 80,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    page.drawText(`Date: ${new Date().toLocaleDateString()}`, {
      x: 50,
      y: height - 100,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    // Draw a line separator
    page.drawLine({
      start: { x: 50, y: height - 120 },
      end: { x: width - 50, y: height - 120 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    
    // Draw transaction details (you would fetch these from your database)
    page.drawText('Transaction Details:', {
      x: 50,
      y: height - 150,
      size: 14,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText(`Transaction ID: ${transactionId}`, {
      x: 50,
      y: height - 180,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('Status: Completed', {
      x: 50,
      y: height - 200,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('Amount: 0.00 KES', {
      x: 50,
      y: height - 220,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    // Draw footer
    page.drawLine({
      start: { x: 50, y: height - 280 },
      end: { x: width - 50, y: height - 280 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('Thank you for using Pochi Yangu!', {
      x: 50,
      y: height - 300,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('Contact: support@pochi-yangu.com', {
      x: 50,
      y: height - 320,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    // Serialize the PDFDocument to bytes
    const pdfBytes = await pdfDoc.save();
    
    // Convert to Buffer
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error('Error generating receipt PDF:', error);
    throw new Error('Failed to generate receipt');
  }
}

// Alternative: Generate HTML receipt (if you prefer HTML to PDF)
export function generateReceiptHTML(transactionId: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Pochi Yangu Receipt</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .details { margin: 20px 0; }
        .footer { margin-top: 40px; text-align: center; color: #666; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>POCHI YANGU RECEIPT</h1>
        <p>Receipt #: ${transactionId}</p>
        <p>Date: ${new Date().toLocaleDateString()}</p>
      </div>
      
      <div class="details">
        <h2>Transaction Details</h2>
        <table>
          <tr><th>Transaction ID:</th><td>${transactionId}</td></tr>
          <tr><th>Status:</th><td>Completed</td></tr>
          <tr><th>Amount:</th><td>0.00 KES</td></tr>
        </table>
      </div>
      
      <div class="footer">
        <p>Thank you for using Pochi Yangu!</p>
        <p>Contact: support@pochi-yangu.com</p>
      </div>
    </body>
    </html>
  `;
}