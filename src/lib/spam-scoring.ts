/**
 * Spam scoring for form submissions.
 * Returns a score 0-100 (higher = more likely spam).
 */

export function calculateSpamScore(data: Record<string, unknown>, submissionTimeMs: number): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // Honeypot field filled (bot trap)
  if (data.website) { score += 90; reasons.push('honeypot_filled'); }

  // Submission too fast (< 3 seconds = bot)
  if (submissionTimeMs < 3000) { score += 40; reasons.push('too_fast'); }
  else if (submissionTimeMs < 5000) { score += 15; reasons.push('fast_submission'); }

  // Suspicious patterns in message/name
  const message = String(data.message || '');
  const name = String(data.name || data.studentName || '');

  // URL spam in message
  const urlCount = (message.match(/https?:\/\//g) || []).length;
  if (urlCount > 2) { score += 30; reasons.push('many_urls'); }
  else if (urlCount > 0) { score += 10; reasons.push('contains_url'); }

  // All caps
  if (name.length > 3 && name === name.toUpperCase()) { score += 15; reasons.push('all_caps_name'); }

  // Suspicious keywords
  const spamKeywords = /\b(viagra|casino|crypto|bitcoin|lottery|winner|click here|free money|earn \$)\b/i;
  if (spamKeywords.test(message)) { score += 50; reasons.push('spam_keywords'); }

  // Very short or empty required fields
  if (name.length < 2) { score += 20; reasons.push('short_name'); }

  // Email patterns
  const email = String(data.email || '');
  if (email && /\+.*@/.test(email)) { score += 5; reasons.push('plus_email'); }
  if (email && /^[a-z]{20,}@/.test(email)) { score += 15; reasons.push('random_email'); }

  // Phone patterns (invalid format)
  const phone = String(data.phone || '');
  if (phone && phone.replace(/\D/g, '').length < 10) { score += 10; reasons.push('short_phone'); }

  return { score: Math.min(score, 100), reasons };
}

/** Determine if a submission should be auto-rejected */
export function isSpam(score: number): boolean {
  return score >= 70;
}

/** Determine if a submission needs manual review */
export function needsReview(score: number): boolean {
  return score >= 30 && score < 70;
}
