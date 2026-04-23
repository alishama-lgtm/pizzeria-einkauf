/**
 * email-sync.js — Eigenständiger E-Mail-Leser (getrennt vom Hauptserver)
 * Läuft als separater PM2-Prozess: pm2 start email-sync.js --name email-sync
 * Prüft alle 10 Minuten Hotmail auf neue Rechnungen/Abrechnungen.
 */

import 'dotenv/config';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Konfiguration aus .env ────────────────────────────────────────────
const EMAIL_USER     = process.env.EMAIL_USER;
const EMAIL_PASS     = process.env.EMAIL_APP_PASS;  // App-Passwort, NICHT echtes Passwort
const SERVER_URL     = process.env.EMAIL_SERVER_URL || 'http://localhost:3000';
const CHECK_INTERVAL = parseInt(process.env.EMAIL_CHECK_INTERVAL_MIN || '10') * 60 * 1000;

// Ordner wo verarbeitete E-Mails hin verschoben werden
const PROCESSED_FOLDER = 'Pizzeria-Verarbeitet';

// Keywords die eine E-Mail als relevant markieren
const RELEVANT_KEYWORDS = [
  'rechnung', 'invoice', 'abrechnung', 'lohnzettel', 'lohn',
  'meldebestätigung', 'meldung', 'sozialversicherung', 'ogk',
  'finanzamt', 'steuer', 'buchhaltung', 'lieferschein',
  'zahlungsjournal', 'gehalt', 'personal', 'dienstvertrag',
  'metro', 'billa', 'lidl', 'spar', 'etsan', 'um trade'
];

// Welche Dokument-Typen erkannt werden (für DB-Kategorie)
function erkenneDokumentTyp(betreff, absender) {
  const text = (betreff + ' ' + absender).toLowerCase();
  if (text.includes('lohn') || text.includes('gehalt') || text.includes('abrechnung')) return 'lohnzettel';
  if (text.includes('ogk') || text.includes('sozialversicherung') || text.includes('sv')) return 'ogk';
  if (text.includes('finanzamt') || text.includes('steuer') || text.includes('uva')) return 'finanzamt';
  if (text.includes('meldebestätigung') || text.includes('meldung')) return 'sonstige';
  if (text.includes('rechnung') || text.includes('invoice')) return 'rechnung';
  return 'sonstige';
}

// Aktuellen Monat im Format YYYY-MM
function aktuellerMonat() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

// Log mit Timestamp
function log(msg) {
  const zeit = new Date().toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  console.log(`[${zeit}] ${msg}`);
}

// PDF an den lokalen Server-API schicken
async function sendePdfAnServer(dateiname, pdfBuffer, typ, monat) {
  const base64 = 'data:application/pdf;base64,' + pdfBuffer.toString('base64');
  const id = 'email_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  const payload = JSON.stringify({ id, name: dateiname, data: base64, typ, monat });

  return new Promise((resolve, reject) => {
    const url = new URL('/api/pdf/upload', SERVER_URL);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;
    const req = lib.request({
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch(_) { resolve({ ok: false, error: body }); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// Prüft ob eine E-Mail relevant ist (Betreff + Anhang)
function istRelevant(mail) {
  const betreff = (mail.subject || '').toLowerCase();
  const absender = (mail.from?.text || '').toLowerCase();
  const hatPdfAnhang = mail.attachments?.some(a =>
    a.contentType === 'application/pdf' || (a.filename || '').endsWith('.pdf')
  );
  if (!hatPdfAnhang) return false;
  const kombText = betreff + ' ' + absender;
  return RELEVANT_KEYWORDS.some(k => kombText.includes(k));
}

// Hauptfunktion: einmal E-Mails prüfen
async function pruefeEmails() {
  if (!EMAIL_USER || !EMAIL_PASS) {
    log('⚠️  EMAIL_USER oder EMAIL_APP_PASS fehlt in .env — überspringe');
    return;
  }

  const client = new ImapFlow({
    host: 'imap-mail.outlook.com',
    port: 993,
    secure: true,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    logger: false,
    tls: { rejectUnauthorized: false }
  });

  let verarbeitet = 0;
  let uebersprungen = 0;

  try {
    await client.connect();
    log('📬 Verbunden mit ' + EMAIL_USER);

    // Verarbeitungs-Ordner anlegen falls nicht vorhanden
    try {
      const ordnerListe = await client.list();
      const existiert = ordnerListe.some(f => f.name === PROCESSED_FOLDER || f.path === PROCESSED_FOLDER);
      if (!existiert) {
        await client.mailboxCreate(PROCESSED_FOLDER);
        log('📁 Ordner "' + PROCESSED_FOLDER + '" erstellt');
      }
    } catch(_) {}

    // Posteingang öffnen
    await client.mailboxOpen('INBOX');

    // Ungelesene E-Mails suchen
    const uids = await client.search({ unseen: true });
    log(`📩 ${uids.length} ungelesene E-Mails gefunden`);

    for (const uid of uids) {
      try {
        const msg = await client.fetchOne(uid, { source: true }, { uid: true });
        const mail = await simpleParser(msg.source);

        if (!istRelevant(mail)) {
          uebersprungen++;
          continue;
        }

        const betreff = mail.subject || 'Kein Betreff';
        const absender = mail.from?.text || '';
        const typ = erkenneDokumentTyp(betreff, absender);
        const monat = aktuellerMonat();

        log(`📄 Relevant: "${betreff}" von ${absender}`);

        // Alle PDF-Anhänge verarbeiten
        for (const anhang of mail.attachments || []) {
          if (anhang.contentType !== 'application/pdf' && !(anhang.filename || '').endsWith('.pdf')) continue;
          const dateiname = anhang.filename || 'email_anhang_' + Date.now() + '.pdf';
          try {
            const ergebnis = await sendePdfAnServer(dateiname, anhang.content, typ, monat);
            if (ergebnis.ok) {
              log(`  ✅ Gespeichert: ${dateiname} (${typ})`);
              verarbeitet++;
            } else {
              log(`  ❌ Fehler beim Speichern: ${ergebnis.error}`);
            }
          } catch(e) {
            log(`  ❌ Server nicht erreichbar: ${e.message}`);
          }
        }

        // E-Mail als gelesen markieren und in Verarbeitungsordner verschieben
        await client.messageFlagsAdd({ uid }, ['\\Seen']);
        try {
          await client.messageMove({ uid }, PROCESSED_FOLDER, { uid: true });
        } catch(_) { /* Verschieben optional */ }

      } catch(e) {
        log(`⚠️  Fehler bei E-Mail ${uid}: ${e.message}`);
      }
    }

    await client.logout();
    log(`✅ Fertig: ${verarbeitet} gespeichert, ${uebersprungen} übersprungen (kein PDF/kein Keyword)`);

  } catch(e) {
    log(`❌ IMAP-Fehler: ${e.message}`);
    try { await client.logout(); } catch(_) {}
  }
}

// ── Hauptschleife ─────────────────────────────────────────────────────
log('🚀 Email-Sync gestartet (Hotmail IMAP)');
log(`   Konto: ${EMAIL_USER || '(nicht konfiguriert)'}`);
log(`   Intervall: ${CHECK_INTERVAL / 60000} Minuten`);
log(`   Server: ${SERVER_URL}`);

// Sofort einmal prüfen, dann alle X Minuten
pruefeEmails();
setInterval(pruefeEmails, CHECK_INTERVAL);
