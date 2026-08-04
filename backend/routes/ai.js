const express = require('express');
const { body, validationResult } = require('express-validator');
const fetchuser = require('../middleware/fetchuser');

const router = express.Router();

function stripCodeFences(text) {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

function splitSentences(text) {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function createFallbackSummary(text) {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const sentences = splitSentences(cleaned);
  const summarySentences = sentences.slice(0, 2);
  const summary = summarySentences.join(' ').slice(0, 280) || cleaned.slice(0, 280);
  const bullets = sentences.slice(0, 4).map((sentence) => sentence.replace(/[\u2022-]\s*/g, '').trim()).filter(Boolean);

  return {
    summary: summary || 'No summary could be generated.',
    bullets: bullets.length ? bullets : [summary || 'No bullet points could be generated.'],
    provider: 'fallback',
  };
}

function normalizeStructuredResult(rawText) {
  try {
    const parsed = JSON.parse(stripCodeFences(rawText));
    const summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : '';
    const bullets = Array.isArray(parsed.bullets)
      ? parsed.bullets.map((item) => String(item).trim()).filter(Boolean)
      : [];

    if (!summary && bullets.length === 0) {
      return null;
    }

    return {
      summary: summary || bullets.join(' '),
      bullets: bullets.length ? bullets : [summary],
    };
  } catch (error) {
    return null;
  }
}

async function summarizeWithGemini(promptText) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${promptText}\n\nReturn ONLY valid JSON with keys summary and bullets.`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
      },
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const content = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
  const normalized = normalizeStructuredResult(content);
  return normalized ? { ...normalized, provider: 'gemini' } : null;
}

router.post(
  '/summarize',
  fetchuser,
  [
    body('description', 'Description must be at least 10 characters long').isLength({ min: 10 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const title = String(req.body.title || '').trim();
      const description = String(req.body.description || '').trim();
      const tag = String(req.body.tag || '').trim();

      const promptText = [
        `Title: ${title || 'Untitled note'}`,
        `Tag: ${tag || 'General'}`,
        `Note: ${description}`,
      ].join('\n');

      const geminiResult = await summarizeWithGemini(promptText);
      if (geminiResult) {
        return res.json({ success: true, ...geminiResult });
      }

      const fallback = createFallbackSummary(`${title}. ${description}`);
      return res.json({ success: true, ...fallback });
    } catch (error) {
      console.error(error.message);
      const fallback = createFallbackSummary(`${req.body.title || ''}. ${req.body.description || ''}`);
      return res.json({ success: true, ...fallback, provider: 'fallback-error' });
    }
  }
);
//function to create a note from Raw Text
function createNoteFromRawText(rawText) {
  const cleanedText = rawText.replace(/\s+/g, ' ').trim();
  const sentences = splitSentences(cleanedText);
  const title = sentences[0] || 'Untitled note';
  const description = sentences.slice(1).join(' ') || cleanedText;
  const tag = 'General';

  return { title, description, tag };
}
router.post(
  '/createNoteFromRawText',
  fetchuser,
  [
    body('rawText', 'Raw text must be at least 10 characters long').isLength({ min: 10 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const note = createNoteFromRawText(req.body.rawText);
      return res.json({ success: true, ...note });
    } catch (error) {
      console.error(error.message);
      return res.status(500).json({ error: 'Could not create note from raw text' });
    }
  }
);
module.exports = router;