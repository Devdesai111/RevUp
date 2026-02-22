'use strict';

// ─── Task 67: PDF Monthly Report Generator ────────────────────────────────────

const AlignmentMetric = require('../../models/AlignmentMetric');
const JournalEntry    = require('../../models/JournalEntry');
const IdentityProfile = require('../../models/IdentityProfile');

/**
 * Generate a monthly identity report PDF and pipe it to the Express response.
 *
 * @param {string} userId
 * @param {number} year   — e.g. 2025
 * @param {number} month  — 1-12
 * @param {import('http').ServerResponse} res — Express response (piped directly)
 */
const generateMonthlyPDF = async (userId, year, month, res) => {
  const PDFDocument = require('pdfkit');

  const monthStart = new Date(year, month - 1, 1);
  const monthEnd   = new Date(year, month, 0, 23, 59, 59);

  const [metrics, entries, identity] = await Promise.all([
    AlignmentMetric.find({ userId, date: { $gte: monthStart, $lte: monthEnd } }).sort({ date: 1 }),
    JournalEntry.find({ userId, date: { $gte: monthStart, $lte: monthEnd } }).sort({ date: 1 }),
    IdentityProfile.findOne({ userId }),
  ]);

  const avgScore = metrics.length
    ? (metrics.reduce((s, m) => s + m.alignmentScore, 0) / metrics.length).toFixed(1)
    : 0;

  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  // Set response headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="revup-${year}-${String(month).padStart(2, '0')}.pdf"`,
  );
  doc.pipe(res);

  // ── Cover ─────────────────────────────────────────────────────────────────
  doc.fontSize(28).font('Helvetica-Bold').text('RevUp Identity Report', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(14).font('Helvetica').text(
    `${monthStart.toLocaleString('en-US', { month: 'long' })} ${year}`,
    { align: 'center' },
  );
  doc.moveDown(1);

  // ── Identity Declaration ──────────────────────────────────────────────────
  if (identity?.futureIdentity?.declarationSentence) {
    doc.fontSize(12).font('Helvetica-Bold').text('Identity Declaration');
    doc.fontSize(11).font('Helvetica-Oblique')
      .text(`"${identity.futureIdentity.declarationSentence}"`);
    doc.moveDown(1);
  }

  // ── Monthly Summary ───────────────────────────────────────────────────────
  doc.fontSize(14).font('Helvetica-Bold').text('Monthly Summary');
  doc.moveDown(0.3);
  doc.fontSize(11).font('Helvetica');
  doc.text(`Average Alignment Score: ${avgScore}/100`);
  doc.text(`Days Tracked: ${metrics.length}`);
  doc.text(`Reflections Written: ${entries.length}`);

  if (metrics.length > 0) {
    const best  = metrics.reduce((b, m) => m.alignmentScore > b.alignmentScore ? m : b);
    const worst = metrics.reduce((w, m) => m.alignmentScore < w.alignmentScore ? m : w);
    doc.text(`Best Day: ${best.alignmentScore} on ${best.date.toDateString()}`);
    doc.text(`Lowest Day: ${worst.alignmentScore} on ${worst.date.toDateString()}`);
  }
  doc.moveDown(1);

  // ── Pattern Flags ─────────────────────────────────────────────────────────
  const allFlags = [...new Set(metrics.flatMap((m) => m.patternFlags))];
  if (allFlags.length > 0) {
    doc.fontSize(14).font('Helvetica-Bold').text('Behavioral Patterns Detected');
    doc.moveDown(0.3);
    allFlags.forEach((f) => doc.fontSize(11).font('Helvetica').text(`• ${f}`));
    doc.moveDown(1);
  }

  // ── Journal Excerpts (last 5) ─────────────────────────────────────────────
  if (entries.length > 0) {
    doc.fontSize(14).font('Helvetica-Bold').text('Recent Reflections');
    doc.moveDown(0.3);
    entries.slice(-5).forEach((e) => {
      doc.fontSize(10).font('Helvetica-Bold').text(e.date.toDateString());
      const snippet = e.reflectionText?.substring(0, 300) + (e.reflectionText?.length > 300 ? '...' : '');
      doc.fontSize(10).font('Helvetica').text(snippet);
      doc.moveDown(0.5);
    });
  }

  doc.end();
};

module.exports = { generateMonthlyPDF };
