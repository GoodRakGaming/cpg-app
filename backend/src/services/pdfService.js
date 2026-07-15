/**
 * PDF Generation Service
 * Handles PDF generation using Puppeteer
 * Supports HTML to PDF conversion with caching
 */

const puppeteer = require('puppeteer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;

// Cache for browsers
let browser = null;

/**
 * Initialize Puppeteer browser instance
 */
async function initBrowser() {
  if (!browser) {
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
        ],
      });
      console.log('✅ Puppeteer browser initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Puppeteer:', error.message);
      throw new Error('PDF service initialization failed');
    }
  }
  return browser;
}

/**
 * Generate PDF from HTML string
 * @param {string} htmlContent - HTML content to convert
 * @param {Object} options - PDF generation options
 * @returns {Promise<Buffer>} - PDF file as buffer
 */
async function generatePdfFromHtml(htmlContent, options = {}) {
  try {
    const browserInstance = await initBrowser();
    const page = await browserInstance.newPage();

    // Set default options
    const pdfOptions = {
      format: options.format || 'A4',
      margin: options.margin || {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm',
      },
      printBackground: options.printBackground !== false,
      ...options,
    };

    // Set HTML content and wait for resources
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
    });

    // Generate PDF (Puppeteer v24+ returns Uint8Array, not Buffer)
    const pdfBuffer = Buffer.from(await page.pdf(pdfOptions));

    // Close page
    await page.close();

    return pdfBuffer;
  } catch (error) {
    console.error('PDF generation error:', error.message);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
}

/**
 * Generate PDF and save to storage
 * @param {string} htmlContent - HTML content
 * @param {string} filename - Output filename
 * @param {Object} options - PDF options
 * @returns {Promise<string>} - Path to saved PDF
 */
async function generateAndSavePdf(htmlContent, filename, options = {}) {
  try {
    const pdfBuffer = await generatePdfFromHtml(htmlContent, options);

    // Create storage directory if it doesn't exist
    const storagePath = path.join(__dirname, '../../storage/pdfs');
    await fs.mkdir(storagePath, { recursive: true });

    // Save PDF file
    const filePath = path.join(storagePath, filename);
    await fs.writeFile(filePath, pdfBuffer);

    return filePath;
  } catch (error) {
    console.error('Save PDF error:', error.message);
    throw error;
  }
}

/**
 * Calculate PDF hash for caching
 * @param {Buffer} pdfBuffer - PDF buffer
 * @returns {string} - SHA256 hash
 */
function calculatePdfHash(pdfBuffer) {
  return crypto
    .createHash('sha256')
    .update(pdfBuffer)
    .digest('hex');
}

/**
 * Generate HTML for proposal
 * @param {Object} proposal - Proposal data
 * @param {Object} template - Template data
 * @returns {string} - Generated HTML
 */
function generateProposalHtml(proposal, template) {
  // Parse template data if it's a string
  const templateData = typeof template.data === 'string'
    ? JSON.parse(template.data)
    : template.data || {};

  // Parse proposal data — prefer currentVersion.data (loaded via association), fallback to proposal.data
  const rawProposalData = proposal.currentVersion?.data ?? proposal.data;
  const proposalData = typeof rawProposalData === 'string'
    ? JSON.parse(rawProposalData)
    : rawProposalData || {};

  // Build HTML content
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${proposal.title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #fff;
    }
    
    .container {
      max-width: 210mm;
      margin: 0 auto;
      padding: 20mm;
      background: white;
    }
    
    .header {
      border-bottom: 3px solid #2c3e50;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .header h1 {
      color: #2c3e50;
      font-size: 28px;
      margin-bottom: 10px;
    }
    
    .header .subtitle {
      color: #7f8c8d;
      font-size: 14px;
    }
    
    .status-badge {
      display: inline-block;
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      margin-top: 10px;
    }
    
    .status-draft {
      background-color: #f39c12;
      color: white;
    }
    
    .status-final {
      background-color: #27ae60;
      color: white;
    }
    
    .status-archived {
      background-color: #95a5a6;
      color: white;
    }
    
    .section {
      margin-bottom: 30px;
    }
    
    .section h2 {
      color: #2c3e50;
      font-size: 16px;
      border-bottom: 2px solid #ecf0f1;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    
    .section-content {
      color: #555;
      line-height: 1.8;
    }
    
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    
    .detail-item {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 4px;
    }
    
    .detail-label {
      font-weight: bold;
      color: #2c3e50;
      font-size: 12px;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    
    .detail-value {
      color: #555;
      font-size: 14px;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    
    .items-table th {
      background-color: #2c3e50;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: bold;
    }
    
    .items-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #ecf0f1;
    }
    
    .items-table tr:nth-child(even) {
      background-color: #f8f9fa;
    }
    
    .total-row {
      background-color: #ecf0f1;
      font-weight: bold;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ecf0f1;
      color: #7f8c8d;
      font-size: 12px;
      text-align: center;
    }
    
    .template-content {
      margin: 20px 0;
      padding: 15px;
      background: #f8f9fa;
      border-left: 4px solid #2c3e50;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${proposal.title}</h1>
      <p class="subtitle">${template.name || 'Commercial Proposal'}</p>
      <span class="status-badge status-${proposal.status}">
        ${proposal.status.toUpperCase()}
      </span>
    </div>
    
    ${proposalData.description ? `
    <div class="section">
      <h2>Description</h2>
      <div class="section-content">
        ${proposalData.description}
      </div>
    </div>
    ` : ''}
    
    ${(() => {
      const displayItems = (Array.isArray(proposalData.items) && proposalData.items.length > 0)
        ? proposalData.items
        : (Array.isArray(templateData.items) ? templateData.items : []);
      if (displayItems.length === 0) return '';
      return `
    <div class="section">
      <h2>Items</h2>
      <table class="items-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Description</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${displayItems.map(item => `
            <tr>
              <td>${item.name || ''}</td>
              <td>${item.description || ''}</td>
              <td>${item.quantity || 1}</td>
              <td>${(item.price || 0).toLocaleString('ru-RU')} руб.</td>
              <td>${((item.quantity || 1) * (item.price || 0)).toLocaleString('ru-RU')} руб.</td>
            </tr>
          `).join('')}
          <tr class="total-row">
            <td colspan="4">ИТОГО</td>
            <td>${displayItems.reduce((sum, item) => {
              return sum + ((item.quantity || 1) * (item.price || 0));
            }, 0).toLocaleString('ru-RU')} руб.</td>
          </tr>
        </tbody>
      </table>
    </div>`;
    })()}
    
    ${templateData.terms ? `
    <div class="section">
      <h2>Terms & Conditions</h2>
      <div class="section-content">
        ${templateData.terms}
      </div>
    </div>
    ` : ''}
    
    ${templateData.footer ? `
    <div class="footer">
      <p>${templateData.footer}</p>
    </div>
    ` : `
    <div class="footer">
      <p>${new Date().toLocaleDateString('ru-RU')}</p>
    </div>
    `}
  </div>
</body>
</html>
  `;

  return html;
}

/**
 * Gracefully close browser instance
 */
async function closeBrowser() {
  if (browser) {
    try {
      await browser.close();
      browser = null;
      console.log('✅ Puppeteer browser closed');
    } catch (error) {
      console.error('Error closing browser:', error.message);
    }
  }
}

module.exports = {
  initBrowser,
  generatePdfFromHtml,
  generateAndSavePdf,
  calculatePdfHash,
  generateProposalHtml,
  closeBrowser,
};
