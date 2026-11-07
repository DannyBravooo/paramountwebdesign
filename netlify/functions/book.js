/**
 * Netlify Function: book.js
 * Receives booking/consult submissions from the website (form + chatbot)
 * and emails them via the Resend API.
 *
 * Required environment variables (set in Netlify: Site settings → Environment variables):
 *   RESEND_API_KEY  – your Resend API key
 *   CONTACT_EMAIL   – where submissions are delivered (default: paramountwebdesign@outlook.com)
 *   FROM_EMAIL      – verified Resend sender, e.g. "Paramount Web Design <bookings@paramountwebdesign.com>"
 *                     (falls back to Resend's test sender if unset)
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function clean(s, max) {
  return String(s == null ? '' : s).trim().slice(0, max || 500);
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ ok: false, error: 'Method not allowed' }) };
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid JSON' }) };
  }

  // Honeypot: silently accept so bots think they succeeded
  if (clean(data.hp)) {
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  }

  const name = clean(data.name, 200);
  const email = clean(data.email, 200);
  const phone = clean(data.phone, 50);
  const notes = clean(data.notes, 3000);
  const source = clean(data.source, 50) || 'website';
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!name || !emailOk) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Name and a valid email are required' }) };
  }

  const rows = [
    ['Name', name],
    ['Email', email],
    ['Phone', phone || '—'],
    ['Notes', notes || '—'],
    ['Submitted from', source]
  ];

  const text = 'New consult request from the Paramount website:\n\n' +
    rows.map(([k, v]) => k + ': ' + v).join('\n');

  const html = '<h2 style="font-family:sans-serif">New consult request</h2>' +
    '<p style="font-family:sans-serif">From the Paramount Web Design website (' + esc(source) + '):</p>' +
    '<table style="font-family:sans-serif;border-collapse:collapse">' +
    rows.map(([k, v]) =>
      '<tr><td style="padding:6px 12px 6px 0;font-weight:bold;vertical-align:top">' + esc(k) + '</td>' +
      '<td style="padding:6px 0;vertical-align:top">' + esc(v).replace(/\n/g, '<br>') + '</td></tr>'
    ).join('') + '</table>';

  const payload = {
    from: process.env.FROM_EMAIL || 'Paramount Web Design <onboarding@resend.dev>',
    to: [process.env.CONTACT_EMAIL || 'paramountwebdesign@outlook.com'],
    reply_to: email,
    subject: 'Consult request — ' + name + ' (' + source + ')',
    text: text,
    html: html
  };

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + (process.env.RESEND_API_KEY || ''),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('Resend error', res.status, detail);
      return { statusCode: 502, body: JSON.stringify({ ok: false, error: 'Email service error' }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    console.error('Send failed', e);
    return { statusCode: 502, body: JSON.stringify({ ok: false, error: 'Email service unavailable' }) };
  }
};
