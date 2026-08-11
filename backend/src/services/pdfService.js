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

const A4_HEIGHT_MM = 297;
const MM_TO_PX = 96 / 25.4; // Chromium/Puppeteer печатает при 96dpi

// Измеряет реальную высоту отрисованного `.page` (в мм) — точный ответ «влезет/не влезет
// в один лист», без догадок по числу позиций (см. generateProposalPdf — там же обоснование,
// почему число позиций само по себе оказалось ненадёжным сигналом: реальная высота зависит
// ещё и от «Условий», длины реквизитов компании, длины названий позиций).
async function measurePageHeightMm(page) {
  const heightPx = await page.evaluate(() => {
    const el = document.querySelector('.page');
    return el ? el.getBoundingClientRect().height : 0;
  });
  return heightPx / MM_TO_PX;
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

    // Поля страницы задаются один раз — CSS-отступом `.page` в самом HTML (см.
    // generateProposalHtml), не здесь. Раньше Puppeteer накладывал свои 10mm margin поверх
    // отступа `.page`, из-за чего реальные поля документа (30мм+ сверху/снизу) не совпадали с
    // тем, что задано в CSS — задвоение полей. Margin здесь всегда нулевой намеренно.
    const pdfOptions = {
      format: options.format || 'A4',
      margin: options.margin || { top: 0, right: 0, bottom: 0, left: 0 },
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

function formatDateLong(value) {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return esc(value);
  // ru-RU's long month format already appends "г." (e.g. "15 июля 2026 г.") — don't add it again.
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
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

// Same input shapes as renderTextBlock, but rendered as a bulleted list (used for "Условия").
function renderBulletList(value) {
  if (!value) return '';
  const lines = Array.isArray(value) ? value : String(value).split('\n');
  const items = lines.map((line) => String(line).trim()).filter(Boolean);
  if (!items.length) return '';
  return `<ul class="terms-list">${items.map((line) => `<li>${esc(line)}</li>`).join('')}</ul>`;
}

function renderCompanyHeader(company, number, date) {
  if (!company || !company.name) return '';

  const logo = company.logo
    ? `<img class="company-logo" src="${esc(company.logo)}" alt="">`
    : '';

  const requisiteParts = [
    company.address ? esc(company.address) : '',
  ].filter(Boolean);

  const regParts = [
    company.inn ? `ИНН ${esc(company.inn)}` : '',
    company.kpp ? `КПП ${esc(company.kpp)}` : '',
    company.ogrn ? `ОГРН ${esc(company.ogrn)}` : '',
  ].filter(Boolean);

  const contactParts = [
    company.phone ? esc(company.phone) : '',
    company.email ? esc(company.email) : '',
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

  const docRef = number
    ? `<div class="doc-header-kp">Исх. № ${esc(number)}${date ? `<br>от ${formatDateLong(date)}` : ''}</div>`
    : '';

  return `
  <div class="doc-header">
    <header class="doc-header-row">
      <div class="doc-header-main">
        ${logo}
        <div class="company-block">
          <div class="company-name">${esc(company.name)}</div>
          ${requisiteParts.length ? `<div class="company-requisites">${requisiteParts.join(', ')}</div>` : ''}
          ${regParts.length ? `<div class="company-requisites">${regParts.join(' · ')}</div>` : ''}
          ${contactParts.length ? `<div class="company-requisites">${contactParts.join(' · ')}</div>` : ''}
        </div>
      </div>
      ${docRef}
    </header>
    ${bankParts.length ? `
    <div class="company-extra">
      <span>${bankParts.join(', ')}</span>
    </div>` : ''}
  </div>`;
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
  if (!Array.isArray(items) || items.length === 0) return { html: '', grandTotal: 0, rowCount: 0 };

  const hasSections = items.some((item) => item.section);
  let grandTotal = 0;
  // Число реально отрисовываемых строк таблицы (позиции + заголовки разделов + строки
  // подытогов) — используется для выбора обычной/сжатой вёрстки, см. generateProposalHtml.
  let renderedRowCount = 0;

  // Каждый раздел — отдельный <tbody class="section-group"> (заголовок раздела + позиции +
  // подытог): на группе стоит break-inside: avoid, чтобы при переносе страницы раздел уходил
  // на новую страницу целиком, а не оставлял «оторванный» подытог после повторённой шапки.
  // Разделы длиннее KEEP_TOGETHER_MAX_ROWS позиций в страницу заведомо не помещаются —
  // им break-inside: avoid не ставим (иначе Chromium выталкивает начало таблицы на новую
  // страницу, оставляя предыдущую полупустой, и всё равно разрывает).
  const KEEP_TOGETHER_MAX_ROWS = 14;
  let bodies = '';
  let rows = '';
  let sectionTotal = 0;
  let sectionRowCount = 0;
  let currentSection = undefined;
  let index = 0;

  const closeSection = () => {
    if (currentSection !== undefined) {
      rows += `
          <tr class="section-subtotal-row">
            <td colspan="5">Подытог по разделу</td>
            <td class="col-money">${money(sectionTotal)}</td>
          </tr>`;
      renderedRowCount += 1;
    }
    if (rows) {
      // Без разделов вся таблица — одна группа: ей запрет разрыва тоже не ставим.
      const keepTogether = hasSections && sectionRowCount <= KEEP_TOGETHER_MAX_ROWS;
      bodies += `
    <tbody${keepTogether ? ' class="section-group"' : ''}>${rows}
    </tbody>`;
    }
    rows = '';
    sectionTotal = 0;
    sectionRowCount = 0;
  };

  items.forEach((item, itemIndex) => {
    const quantity = Number(item.quantity) || 1;
    const price = Number(item.price) || 0;
    const lineTotal = quantity * price;
    grandTotal += lineTotal;
    sectionTotal += lineTotal;

    if (hasSections && item.section && item.section !== currentSection) {
      closeSection();
      currentSection = item.section;
      rows += `
          <tr class="section-row">
            <td colspan="6">${esc(currentSection)}</td>
          </tr>`;
      renderedRowCount += 1;
      index = 0;
      sectionTotal = lineTotal;
    }
    index += 1;
    sectionRowCount += 1;
    renderedRowCount += 1;

    // Последняя строка таблицы целиком помечается — вместе с break-before на .total-box и
    // .signature-block (см. CSS) не даёт печати/подписи оторваться в одиночестве на новую
    // страницу: если перенос неизбежен, он утягивает с собой хотя бы последнюю позицию и итог.
    const isLastRow = itemIndex === items.length - 1;

    rows += `
          <tr${isLastRow ? ' class="last-row"' : ''}>
            <td class="col-num">${index}</td>
            <td>${esc(item.name)}</td>
            <td class="col-unit">${esc(item.unit || '')}</td>
            <td class="col-num">${quantity}</td>
            <td class="col-money">${money(price)}</td>
            <td class="col-money">${money(lineTotal)}</td>
          </tr>`;
  });
  closeSection();

  const html = `
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
    </thead>${bodies}
  </table>`;

  return { html, grandTotal, rowCount: renderedRowCount };
}

function renderTotalBox(grandTotal, vatNote) {
  const label = vatNote ? `Итого (${esc(vatNote)})` : 'Итого';
  return `
  <div class="total-box">
    <span>${label}</span>
    <span class="col-money">${money(grandTotal)} ₽</span>
  </div>`;
}

function renderSignature(signer, company, includeSignature, includeStamp) {
  if (!signer || (!signer.fullName && !signer.position)) return '';

  const label = [signer.position, company?.name].filter(Boolean).join(' ');

  const signatureImage = (signer.signatureImage && includeSignature)
    ? `<img class="signature-image" src="${esc(signer.signatureImage)}" alt="">`
    : '';
  const stamp = !includeStamp
    ? ''
    : signer.stampImage
      ? `<img class="stamp-image" src="${esc(signer.stampImage)}" alt="">`
      : '<div class="stamp-placeholder">м.п. / скан печати</div>';

  return `
  <div class="signature-block">
    <div class="signature-main">
      ${label ? `<div class="signature-label">${esc(label)}</div>` : ''}
      <div class="signature-visual-row">${signatureImage}</div>
      <div class="signature-rule"></div>
      <div class="signature-fio">${esc(signer.fullName || '')}</div>
    </div>
    <div class="signature-stamp">${stamp}</div>
  </div>`;
}

/**
 * Generate HTML for proposal
 * @param {Object} proposal - Proposal data
 * @param {Object} template - Template data
 * @param {{forceLayout?: 'normal'|'compact'}} [options] - какую вёрстку использовать. По
 *   умолчанию 'normal' — решение «влезет ли сжатая на одну страницу» принимает
 *   generateProposalPdf путём реального измерения после рендера (число позиций само по себе
 *   ненадёжный сигнал — см. её комментарий), не эта функция.
 * @returns {string} - Generated HTML
 */
function generateProposalHtml(proposal, template, options = {}) {
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

  const itemsTable = renderItemsTable(displayItems);

  const useCompact = options.forceLayout === 'compact';

  // Значения только для «воздуха» между блоками — размер шрифта самого текста не трогаем,
  // чтобы сжатие не било по читаемости.
  const v = (normal, compact) => (useCompact ? compact : normal);

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
      /* Принятые в деловом документообороте поля под подшивку: лево 30мм, право 15мм,
         верх/низ 20мм (top right bottom left). Единственный источник полей документа —
         см. комментарий у margin в generatePdfFromHtml. */
      padding: 20mm 15mm 20mm 30mm;
    }

    /* ── header ── */
    .doc-header {
      padding-bottom: ${v('4mm', '3mm')};
      border-bottom: 1px solid var(--line);
    }
    .doc-header-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8mm;
    }
    .doc-header-main { display: flex; align-items: center; gap: 5mm; }
    .company-logo { max-height: 28mm; max-width: 45mm; object-fit: contain; }
    .company-name { font-size: 11pt; font-weight: 700; color: var(--ink); }
    .company-requisites { font-size: 8pt; color: var(--muted); margin-top: 1mm; }
    .doc-header-kp { font-size: 9pt; color: var(--muted); white-space: nowrap; text-align: right; line-height: 1.4; }
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
      margin-top: ${v('8mm', '5mm')};
      font-size: 9.5pt;
      color: var(--text);
      text-align: right;
    }
    .doc-title {
      margin-top: ${v('8mm', '5mm')};
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
      margin-top: ${v('8mm', '5mm')};
      font-size: 9.5pt;
    }
    .items-table th {
      text-align: left;
      font-weight: 700;
      color: var(--muted);
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      padding: ${v('2.5mm 3mm', '2mm 3mm')};
      border-bottom: 1px solid var(--ink);
    }
    .items-table td {
      padding: ${v('2.5mm 3mm', '2mm 3mm')};
      border-bottom: 1px solid var(--line);
      vertical-align: top;
    }
    .items-table .col-num { width: 8mm; text-align: center; color: var(--muted); }
    .items-table .col-unit { width: 16mm; text-align: center; }
    .items-table .col-money { width: 30mm; text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .items-table tr { break-inside: avoid; }
    .items-table tbody.section-group { break-inside: avoid; }
    /* Не начинать новую страницу сразу после последней позиции — тянет её вместе с итогом/
       подписью, если перенос неизбежен (см. заявку про «печать/подпись в одиночестве»). */
    .items-table tr.last-row { break-after: avoid; }
    .items-table .section-row td {
      padding-top: ${v('5mm', '3mm')};
      font-weight: 700;
      color: var(--accent);
      border-bottom: none;
    }
    .items-table .section-subtotal-row td {
      border-bottom: none;
      font-style: italic;
      color: var(--muted);
      padding-top: 1.5mm;
      padding-bottom: ${v('4mm', '2.5mm')};
    }
    .total-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: ${v('5mm', '3mm')};
      padding: ${v('3.5mm 4mm', '2.5mm 4mm')};
      background: var(--accent-soft);
      border-radius: 2mm;
      font-weight: 700;
      color: var(--ink);
      font-size: 10.5pt;
      break-inside: avoid;
      break-before: avoid;
    }
    .total-box .col-money { font-variant-numeric: tabular-nums; }

    /* ── terms ── */
    .terms-list { margin: 0; padding-left: 4mm; }
    .terms-list li { margin-top: 1.5mm; color: var(--text); }
    .section { margin-top: ${v('8mm', '5mm')}; }
    .section-title {
      font-size: 9.5pt;
      font-weight: 700;
      color: var(--ink);
      margin-bottom: 2mm;
    }

    /* ── signature ── */
    /* Известное ограничение orphan-guard (проверено эмпирически, 2026-08-11): break-before
       здесь избавляет от ГОЛОЙ подписи на отдельной странице (гарантированно рядом будет хотя бы
       хвост предыдущего блока), но гарантия «обязательно позиция+итог+подпись вместе» держится,
       только пока раздел «Условия» между total-box и signature-block короткий/отсутствует — при
       длинных «Условиях» (проверено на 15 пунктах) их конец окажется на одной странице с
       подписью, а не последняя позиция и итог, так как «Условия» намеренно разрываются свободно
       (не хотим склеивать длинный список условий целиком с подписью). Если понадобится жёстче —
       нужно отдельно решать, что делать с длинными «Условиями» рядом с этим блоком. */
    .signature-block {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 10mm;
      margin-top: ${v('14mm', '8mm')};
      break-inside: avoid;
      break-before: avoid;
    }
    .signature-main { flex: 1; max-width: 100mm; }
    .signature-label { font-size: 9.5pt; color: var(--text); margin-bottom: 2mm; }
    .signature-visual-row { min-height: 12mm; display: flex; align-items: flex-end; }
    .signature-image { max-height: 14mm; max-width: 55mm; object-fit: contain; }
    .signature-rule { border-bottom: 1px solid var(--ink); }
    .signature-fio { font-size: 9.5pt; color: var(--text); margin-top: 1.5mm; }
    .signature-stamp { flex-shrink: 0; }
    .stamp-image { max-height: 24mm; max-width: 24mm; object-fit: contain; opacity: 0.85; }
    .stamp-placeholder {
      width: 22mm;
      height: 22mm;
      border-radius: 50%;
      border: 1px dashed var(--line);
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      font-size: 6.5pt;
      color: var(--muted);
      padding: 2mm;
    }

  </style>
</head>
<body>
  <div class="page">
    ${renderCompanyHeader(templateData.company, proposalData.number, proposalData.date)}
    ${renderRecipient(proposalData.recipient)}

    <h1 class="doc-title">Коммерческое предложение</h1>
    <!-- Мета-строка (дата · срок действия) убрана по запросу заказчика 2026-07-23: дата уже есть
         в шапке («от …»), срок действия — в «Условиях». Если попросят вернуть:
         <div class="doc-meta">${'$'}{formatDate(proposalData.date)} · действительно N дн.</div> -->

    ${proposalData.description ? `<div class="section">${renderTextBlock(proposalData.description)}</div>` : ''}

    ${itemsTable.html}
    ${itemsTable.html ? renderTotalBox(itemsTable.grandTotal, proposalData.vatNote) : ''}

    ${templateData.terms ? `
    <div class="section">
      <div class="section-title">Условия</div>
      ${renderBulletList(templateData.terms)}
    </div>` : ''}

    ${renderSignature(templateData.signer, templateData.company, proposalData.includeSignature !== false, proposalData.includeStamp !== false)}
  </div>
</body>
</html>
  `;

  return html;
}

/**
 * Генерирует готовый PDF предложения, сам выбирая обычную или сжатую вёрстку.
 *
 * Раньше выбор пытались делать по числу позиций (порог, откалиброванный на одном примере) —
 * оказалось ненадёжно: реальная высота документа зависит ещё и от того, есть ли раздел
 * «Условия», сколько реквизитов в шапке компании, насколько длинные названия позиций — то же
 * число позиций на разных шаблонах даёт разную высоту. Поэтому решение принимается по факту:
 * рендерим обычную вёрстку, измеряем реальную высоту `.page` в браузере, и только если она не
 * влезает в лист A4 — пробуем сжатую. Если не влезает и она — остаёмся на обычной, многостраничный
 * документ неизбежен, а «сиротскую» подпись на второй странице не даёт CSS orphan-guard (см.
 * .last-row/.total-box/.signature-block в generateProposalHtml).
 *
 * @param {Object} proposal - Proposal data
 * @param {Object} template - Template data
 * @param {Object} [pdfOptions] - те же опции, что и generatePdfFromHtml (format/margin/printBackground)
 * @returns {Promise<Buffer>}
 */
// Открывает свежую страницу под один HTML, выполняет на ней действие, закрывает страницу.
// Намеренно не переиспользует одну страницу под несколько setContent() подряд — на практике
// повторный setContent() на уже использованной странице иногда подвешивает networkidle0
// (воспроизводилось и здесь, и в замерах при калибровке) — отдельная страница на попытку дороже,
// но надёжно.
async function withRenderedPage(browserInstance, html, action) {
  const page = await browserInstance.newPage();
  try {
    await page.setViewport({
      width: Math.round(210 * MM_TO_PX),
      height: Math.round(A4_HEIGHT_MM * MM_TO_PX),
    });
    await page.emulateMediaType('print');
    await page.setContent(html, { waitUntil: 'networkidle0' });
    return await action(page);
  } finally {
    await page.close();
  }
}

async function generateProposalPdf(proposal, template, pdfOptions = {}) {
  const browserInstance = await initBrowser();

  const htmlNormal = generateProposalHtml(proposal, template, { forceLayout: 'normal' });
  let finalHtml = htmlNormal;

  const normalHeightMm = await withRenderedPage(browserInstance, htmlNormal, measurePageHeightMm);
  if (normalHeightMm > A4_HEIGHT_MM) {
    const htmlCompact = generateProposalHtml(proposal, template, { forceLayout: 'compact' });
    const compactHeightMm = await withRenderedPage(browserInstance, htmlCompact, measurePageHeightMm);
    if (compactHeightMm <= A4_HEIGHT_MM) {
      finalHtml = htmlCompact;
    }
    // Иначе ни один вариант не влезает — остаёмся на htmlNormal (уже так, ничего не меняем),
    // многостраничный документ неизбежен, дальше работает CSS orphan-guard.
  }

  const finalOptions = {
    format: pdfOptions.format || 'A4',
    margin: pdfOptions.margin || { top: 0, right: 0, bottom: 0, left: 0 },
    printBackground: pdfOptions.printBackground !== false,
  };
  return withRenderedPage(browserInstance, finalHtml, (page) => page.pdf(finalOptions).then(Buffer.from));
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
  generateProposalPdf,
  closeBrowser,
};
