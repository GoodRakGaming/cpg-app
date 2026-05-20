/**
 * PDF Generation Routes
 * Endpoints for PDF generation and management
 * POST /api/pdf/generate/:proposalId - Generate PDF from proposal
 * GET /api/pdf/:proposalId - Download generated PDF
 * POST /api/pdf/export/:proposalId - Export proposal as PDF
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;

const { authenticateToken } = require('../middleware/auth');
const { Proposal, Template, User } = require('../models');
const pdfService = require('../services/pdfService');

/**
 * POST /api/pdf/generate/:proposalId
 * Generate PDF from proposal data
 * Returns: PDF file stream
 */
router.post('/generate/:proposalId', authenticateToken, async (req, res) => {
  try {
    const { proposalId } = req.params;
    const userId = req.userId;

    // Find proposal
    const proposal = await Proposal.findByPk(proposalId, {
      include: [
        { association: 'template' },
        { association: 'currentVersion' },
      ],
    });

    if (!proposal) {
      return res.status(404).json({
        success: false,
        error: 'Proposal not found',
      });
    }

    // Verify access (user owns proposal)
    if (proposal.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Check if proposal is not active (soft deleted)
    if (!proposal.is_active) {
      return res.status(410).json({
        success: false,
        error: 'Proposal has been deleted',
      });
    }

    // Generate HTML from template
    const htmlContent = pdfService.generateProposalHtml(proposal, proposal.template);

    // Generate PDF
    const pdfBuffer = await pdfService.generatePdfFromHtml(htmlContent);

    // Calculate hash for caching
    const pdfHash = pdfService.calculatePdfHash(pdfBuffer);

    // Update proposal with PDF hash if different
    if (proposal.pdf_hash !== pdfHash) {
      await proposal.update({ pdf_hash: pdfHash });
    }

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${proposal.title}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=3600');

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate PDF',
    });
  }
});

/**
 * GET /api/pdf/:proposalId
 * Download previously generated PDF
 * Returns: PDF file stream
 */
router.get('/:proposalId', authenticateToken, async (req, res) => {
  try {
    const { proposalId } = req.params;
    const userId = req.userId;

    // Find proposal
    const proposal = await Proposal.findByPk(proposalId, {
      include: [
        { association: 'template' },
      ],
    });

    if (!proposal) {
      return res.status(404).json({
        success: false,
        error: 'Proposal not found',
      });
    }

    // Verify access
    if (proposal.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Check if active
    if (!proposal.is_active) {
      return res.status(410).json({
        success: false,
        error: 'Proposal has been deleted',
      });
    }

    // Generate PDF
    const htmlContent = pdfService.generateProposalHtml(proposal, proposal.template);
    const pdfBuffer = await pdfService.generatePdfFromHtml(htmlContent);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${proposal.title}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF download error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to download PDF',
    });
  }
});

/**
 * POST /api/pdf/export/:proposalId
 * Export proposal as PDF with formatting options
 * Body: { format?, margin?, printBackground? }
 * Returns: PDF file stream
 */
router.post('/export/:proposalId', authenticateToken, async (req, res) => {
  try {
    const { proposalId } = req.params;
    const userId = req.userId;
    const { format, margin, printBackground } = req.body;

    // Find proposal
    const proposal = await Proposal.findByPk(proposalId, {
      include: [
        { association: 'template' },
      ],
    });

    if (!proposal) {
      return res.status(404).json({
        success: false,
        error: 'Proposal not found',
      });
    }

    // Verify access
    if (proposal.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Check if active
    if (!proposal.is_active) {
      return res.status(410).json({
        success: false,
        error: 'Proposal has been deleted',
      });
    }

    // Generate HTML
    const htmlContent = pdfService.generateProposalHtml(proposal, proposal.template);

    // PDF options
    const pdfOptions = {
      format: format || 'A4',
      margin: margin || {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm',
      },
      printBackground: printBackground !== false,
    };

    // Generate PDF with options
    const pdfBuffer = await pdfService.generatePdfFromHtml(htmlContent, pdfOptions);

    // Calculate hash
    const pdfHash = pdfService.calculatePdfHash(pdfBuffer);

    // Update proposal
    await proposal.update({ pdf_hash: pdfHash });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${proposal.title}_exported.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export PDF',
    });
  }
});

/**
 * GET /api/pdf/status/:proposalId
 * Get PDF generation status and hash
 */
router.get('/status/:proposalId', authenticateToken, async (req, res) => {
  try {
    const { proposalId } = req.params;
    const userId = req.userId;

    // Find proposal
    const proposal = await Proposal.findByPk(proposalId);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        error: 'Proposal not found',
      });
    }

    // Verify access
    if (proposal.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

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
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get PDF status',
    });
  }
});

module.exports = router;
