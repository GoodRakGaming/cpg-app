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

// ─── HTML escaping / formatting helpers ────────────────────────────────────

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function money(n) {
  return (Number(n) || 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(value) {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return esc(value);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Multi-line free text (terms/footer/description) may arrive as a string or an
// array of lines/paragraphs — render either shape as a list of paragraphs.
function renderTextBlock(value) {
  if (!value) return '';
  const lines = Array.isArray(value) ? value : String(value).split('\n');
  return lines
    .map((line) => String(line).trim())
    .filter(Boolean)
    .map((line) => `<p class="text-block-line">${esc(line)}</p>`)
    .join('');
}

function renderCompanyHeader(company, kpNumber) {
  if (!company || !company.name) return '';

  const logo = company.logo
    ? `<img class="company-logo" src="${esc(company.logo)}" alt="">`
    : '';

  const requisiteParts = [
    company.address ? esc(company.address) : '',
    company.inn ? `ИНН ${esc(company.inn)}` : '',
  ].filter(Boolean);

  const contactParts = [
    company.phone ? esc(company.phone) : '',
    company.email ? esc(company.email) : '',
  ].filter(Boolean);

  const extraFields = [
    company.ogrn ? `ОГРН ${esc(company.ogrn)}` : '',
    company.kpp ? `КПП ${esc(company.kpp)}` : '',
  ].filter(Boolean);

  const bank = company.bank || {};
  const hasBank = bank.account || bank.bankName || bank.bik || bank.corrAccount;
  const bankParts = hasBank
    ? [
        bank.bankName ? esc(bank.bankName) : '',
        bank.account ? `р/с ${esc(bank.account)}` : '',
        bank.bik ? `БИК ${esc(bank.bik)}` : '',
        bank.corrAccount ? `к/с ${esc(bank.corrAccount)}` : '',
      ].filter(Boolean)
    : [];

  return `
  <header class="doc-header">
    <div class="doc-header-main">
      ${logo}
      <div class="company-block">
        <div class="company-name">${esc(company.name)}</div>
        ${requisiteParts.length ? `<div class="company-requisites">${requisiteParts.join(', ')}</div>` : ''}
        ${contactParts.length ? `<div class="company-requisites">${contactParts.join(' · ')}</div>` : ''}
      </div>
    </div>
    ${kpNumber ? `<div class="doc-header-kp">${esc(kpNumber)}</div>` : ''}
  </header>
  ${(extraFields.length || bankParts.length) ? `
  <div class="company-extra">
    ${extraFields.length ? `<span>${extraFields.join(', ')}</span>` : ''}
    ${bankParts.length ? `<span>${bankParts.join(', ')}</span>` : ''}
  </div>` : ''}`;
}

function renderRecipient(recipient) {
  if (!recipient || (!recipient.org && !recipient.fullName)) return '';
  const lines = [
    recipient.position ? esc(recipient.position) : '',
    recipient.org ? esc(recipient.org) : '',
    recipient.fullName ? esc(recipient.fullName) : '',
  ].filter(Boolean);
  if (!lines.length) return '';
  return `
  <div class="recipient-block">
    ${lines.map((l) => `<div>${l}</div>`).join('')}
  </div>`;
}

function renderItemsTable(items) {
  if (!Array.isArray(items) || items.length === 0) return '';

  const hasSections = items.some((item) => item.section);
  let rows = '';
  let grandTotal = 0;
  let currentSection = undefined;
  let index = 0;

  for (const item of items) {
    const quantity = Number(item.quantity) || 1;
    const price = Number(item.price) || 0;
    const lineTotal = quantity * price;
    grandTotal += lineTotal;

    if (hasSections && item.section && item.section !== currentSection) {
      currentSection = item.section;
      rows += `
          <tr class="section-row">
            <td colspan="6">${esc(currentSection)}</td>
          </tr>`;
      index = 0;
    }
    index += 1;

    rows += `
          <tr>
            <td class="col-num">${index}</td>
            <td>${esc(item.name)}</td>
            <td class="col-unit">${esc(item.unit || '')}</td>
            <td class="col-num">${quantity}</td>
            <td class="col-money">${money(price)}</td>
            <td class="col-money">${money(lineTotal)}</td>
          </tr>`;
  }

  return `
  <table class="items-table">
    <thead>
      <tr>
        <th class="col-num">№</th>
        <th>Наименование</th>
        <th class="col-unit">Ед.</th>
        <th class="col-num">Кол-во</th>
        <th class="col-money">Цена</th>
        <th class="col-money">Сумма</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="total-row">
        <td colspan="5">Итого</td>
        <td class="col-money">${money(grandTotal)} ₽</td>
      </tr>
    </tbody>
  </table>`;
}

function renderSignature(signer) {
  if (!signer || (!signer.fullName && !signer.position)) return '';

  const signatureImage = signer.signatureImage
    ? `<img class="signature-image" src="${esc(signer.signatureImage)}" alt="">`
    : '';
  const stampImage = signer.stampImage
    ? `<img class="stamp-image" src="${esc(signer.stampImage)}" alt="">`
    : (!signer.signatureImage ? '<span class="stamp-placeholder">м.п.</span>' : '');

  return `
  <div class="signature-block">
    <div class="signature-line">
      <span class="signature-position">${esc(signer.position || '')}</span>
      <span class="signature-visual">${signatureImage}${stampImage}</span>
      <span class="signature-name">${esc(signer.fullName || '')}</span>
    </div>
  </div>`;
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

  const displayItems = (Array.isArray(proposalData.items) && proposalData.items.length > 0)
    ? proposalData.items
    : (Array.isArray(templateData.items) ? templateData.items : []);

  const kpNumber = proposalData.number ? `КП № ${proposalData.number}` : '';
  const kpDate = formatDate(proposalData.date);

  const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>${esc(proposal.title)}</title>
  <style>
    :root {
      --ink: oklch(20% 0.02 260);
      --text: oklch(30% 0.015 260);
      --muted: oklch(55% 0.01 260);
      --line: oklch(90% 0.005 260);
      --accent: oklch(45% 0.12 250);
      --accent-soft: oklch(95% 0.02 250);
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', 'DejaVu Sans', Arial, Helvetica, sans-serif;
      font-size: 10.5pt;
      line-height: 1.5;
      color: var(--text);
      background: #fff;
    }

    .page {
      width: 210mm;
      padding: 20mm 18mm;
    }

    /* ── header ── */
    .doc-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8mm;
      padding-bottom: 4mm;
      border-bottom: 1px solid var(--line);
    }
    .doc-header-main { display: flex; align-items: center; gap: 5mm; }
    .company-logo { max-height: 28mm; max-width: 45mm; object-fit: contain; }
    .company-name { font-size: 11pt; font-weight: 700; color: var(--ink); }
    .company-requisites { font-size: 8pt; color: var(--muted); margin-top: 1mm; }
    .doc-header-kp { font-size: 9pt; color: var(--muted); white-space: nowrap; }
    .company-extra {
      display: flex;
      gap: 6mm;
      font-size: 7.5pt;
      color: var(--muted);
      margin-top: 2mm;
      flex-wrap: wrap;
    }

    /* ── recipient / title ── */
    .recipient-block {
      margin-top: 8mm;
      font-size: 9.5pt;
      color: var(--text);
      text-align: right;
    }
    .doc-title {
      margin-top: 8mm;
      font-size: 15pt;
      font-weight: 700;
      color: var(--ink);
    }
    .doc-meta { font-size: 8.5pt; color: var(--muted); margin-top: 1mm; }
    .text-block-line { margin-top: 3mm; color: var(--text); }

    /* ── items table ── */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8mm;
      font-size: 9.5pt;
    }
    .items-table th {
      text-align: left;
      font-weight: 700;
      color: var(--muted);
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      padding: 2.5mm 3mm;
      border-bottom: 1px solid var(--ink);
    }
    .items-table td {
      padding: 2.5mm 3mm;
      border-bottom: 1px solid var(--line);
      vertical-align: top;
    }
    .items-table .col-num { width: 8mm; text-align: center; color: var(--muted); }
    .items-table .col-unit { width: 16mm; text-align: center; }
    .items-table .col-money { width: 30mm; text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .items-table .section-row td {
      padding-top: 5mm;
      font-weight: 700;
      color: var(--accent);
      border-bottom: none;
    }
    .items-table .total-row td {
      border-bottom: none;
      border-top: 1px solid var(--ink);
      font-weight: 700;
      color: var(--ink);
      padding-top: 3.5mm;
    }

    /* ── terms ── */
    .section { margin-top: 8mm; }
    .section-title {
      font-size: 9.5pt;
      font-weight: 700;
      color: var(--ink);
      margin-bottom: 2mm;
    }

    /* ── signature ── */
    .signature-block { margin-top: 14mm; }
    .signature-line {
      display: flex;
      align-items: flex-end;
      gap: 4mm;
      border-bottom: 1px solid var(--ink);
      padding-bottom: 1.5mm;
    }
    .signature-position { font-size: 9.5pt; color: var(--text); white-space: nowrap; }
    .signature-visual {
      flex: 1;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      min-height: 12mm;
    }
    .signature-image { max-height: 14mm; max-width: 45mm; object-fit: contain; }
    .stamp-image { max-height: 22mm; max-width: 22mm; object-fit: contain; opacity: 0.85; }
    .stamp-placeholder { font-size: 8pt; color: var(--muted); }
    .signature-name { font-size: 9.5pt; color: var(--text); white-space: nowrap; }

    /* ── footer ── */
    .doc-footer {
      margin-top: 10mm;
      padding-top: 3mm;
      border-top: 1px solid var(--line);
      font-size: 7.5pt;
      color: var(--muted);
    }
  </style>
</head>
<body>
  <div class="page">
    ${renderCompanyHeader(templateData.company, kpNumber)}
    ${renderRecipient(proposalData.recipient)}

    <h1 class="doc-title">${esc(proposal.title)}</h1>
    <div class="doc-meta">${kpDate}${proposalData.validDays ? ` · действительно ${esc(proposalData.validDays)} дн.` : ''}</div>

    ${proposalData.description ? `<div class="section">${renderTextBlock(proposalData.description)}</div>` : ''}

    ${renderItemsTable(displayItems)}

    ${proposalData.vatNote ? `<div class="doc-meta" style="margin-top:2mm;">${esc(proposalData.vatNote)}</div>` : ''}

    ${templateData.terms ? `
    <div class="section">
      <div class="section-title">Условия</div>
      ${renderTextBlock(templateData.terms)}
    </div>` : ''}

    ${renderSignature(templateData.signer)}

    <div class="doc-footer">${templateData.footer ? esc(templateData.footer) : `Документ сформирован ${formatDate()}`}</div>
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
