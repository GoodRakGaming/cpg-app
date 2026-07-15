/**
 * PDF Generation Routes
 * IMPORTANT: specific routes (/status, /preview, /generate, /export) must come
 * before the generic /:proposalId route to avoid Express swallowing them.
 */

const express = require('express');
const router = express.Router();
const path = require('path');

const { authenticateToken } = require('../middleware/auth');
const { Proposal } = require('../models');
const pdfService = require('../services/pdfService');

// ─── helpers ────────────────────────────────────────────────────────────────

async function findProposal(proposalId, userId, includeVersion = false) {
  const include = [{ association: 'template' }];
  if (includeVersion) include.push({ association: 'currentVersion' });

  const proposal = await Proposal.findByPk(proposalId, { include });
  if (!proposal) return { error: 404, message: 'Предложение не найдено' };
  if (proposal.user_id !== userId) return { error: 403, message: 'Нет доступа' };
  if (!proposal.is_active) return { error: 410, message: 'Предложение удалено' };
  return { proposal };
}

// ─── GET /api/pdf/status/:proposalId ────────────────────────────────────────

router.get('/status/:proposalId', authenticateToken, async (req, res) => {
  try {
    const proposal = await Proposal.findByPk(req.params.proposalId);
    if (!proposal) return res.status(404).json({ success: false, error: 'Proposal not found' });
    if (proposal.user_id !== req.userId) return res.status(403).json({ success: false, error: 'Access denied' });

    res.json({
      success: true,
      data: {
        proposal_id: proposal.id,
        title: proposal.title,
        pdf_hash: proposal.pdf_hash,
        is_cached: !!proposal.pdf_hash,
        status: proposal.status,
      },
    });
  } catch (error) {
    console.error('PDF status error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── GET /api/pdf/preview/:proposalId ───────────────────────────────────────
// Returns HTML — no Puppeteer, instant preview in iframe

router.get('/preview/:proposalId', authenticateToken, async (req, res) => {
  try {
    const { error, message, proposal } = await findProposal(req.params.proposalId, req.userId, true);
    if (error) return res.status(error).json({ success: false, error: message });

    const html = pdfService.generateProposalHtml(proposal, proposal.template);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('PDF preview error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── POST /api/pdf/generate/:proposalId ─────────────────────────────────────

router.post('/generate/:proposalId', authenticateToken, async (req, res) => {
  try {
    const { error, message, proposal } = await findProposal(req.params.proposalId, req.userId, true);
    if (error) return res.status(error).json({ success: false, error: message });

    const html = pdfService.generateProposalHtml(proposal, proposal.template);
    const pdfBuffer = await pdfService.generatePdfFromHtml(html);
    const pdfHash = pdfService.calculatePdfHash(pdfBuffer);

    if (proposal.pdf_hash !== pdfHash) {
      await proposal.update({ pdf_hash: pdfHash });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${proposal.title}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── POST /api/pdf/export/:proposalId ───────────────────────────────────────

router.post('/export/:proposalId', authenticateToken, async (req, res) => {
  try {
    const { error, message, proposal } = await findProposal(req.params.proposalId, req.userId, true);
    if (error) return res.status(error).json({ success: false, error: message });

    const { format, margin, printBackground } = req.body;
    const pdfOptions = {
      format: format || 'A4',
      margin: margin || { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
      printBackground: printBackground !== false,
    };

    const html = pdfService.generateProposalHtml(proposal, proposal.template);
    const pdfBuffer = await pdfService.generatePdfFromHtml(html, pdfOptions);
    const pdfHash = pdfService.calculatePdfHash(pdfBuffer);
    await proposal.update({ pdf_hash: pdfHash });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${proposal.title}_exported.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── GET /api/pdf/:proposalId ────────────────────────────────────────────────
// Must be last — generic route would swallow /status, /preview, etc.

router.get('/:proposalId', authenticateToken, async (req, res) => {
  try {
    const { error, message, proposal } = await findProposal(req.params.proposalId, req.userId, true);
    if (error) return res.status(error).json({ success: false, error: message });

    const html = pdfService.generateProposalHtml(proposal, proposal.template);
    const pdfBuffer = await pdfService.generatePdfFromHtml(html);

    console.log(`📄 PDF generated for "${proposal.title}": ${pdfBuffer.length} bytes, starts with: ${pdfBuffer.slice(0, 5).toString('ascii')}`);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${proposal.title}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF download error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
