// ═══════════════════════════════════════════════════════════════
// UPLOAD TAB — State
// ═══════════════════════════════════════════════════════════════

const UPLOAD_STATE = {
  fileDataUrl: null,
  mediaType: null,
  fileName: null,
  loading: false,
  error: null,
  results: [],       // parsed items from receipt
  einkaufsDatum: null,
  geschaeft: null,
  addedIndices: new Set(),
};

// Rechnungs-Scanner State (File System Access API)
const RECHNUNG_SCAN = {
  dirHandle: null,   // FileSystemDirectoryHandle
  pdfs: [],          // [{name, handle}]
  lieferant: '',
  loading: false,
  error: null,
};

// ═══════════════════════════════════════════════════════════════
// UPLOAD TAB — File Handling
// ═══════════════════════════════════════════════════════════════

function handleFileDrop(event) {
  const file = event.dataTransfer.files[0];
  if (file) handleFileUpload(file);
}

function handleFileSelect(input) {
  const file = input.files[0];
  if (file) handleFileUpload(file);
}

function handleFileUpload(file) {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  if (!allowed.includes(file.type)) {
    UPLOAD_STATE.error = 'Bitte ein Bild (JPG, PNG, WebP) oder PDF hochladen.';
    UPLOAD_STATE.fileDataUrl = null;
    renderUploadTab();
    return;
  }
  UPLOAD_STATE.error = null;
  UPLOAD_STATE.mediaType = file.type;
  UPLOAD_STATE.fileName = file.name;
  UPLOAD_STATE.results = [];
  UPLOAD_STATE.addedIndices = new Set();
  UPLOAD_STATE.einkaufsDatum = null;
  UPLOAD_STATE.geschaeft = null;

  const reader = new FileReader();
  reader.onload = e => {
    UPLOAD_STATE.fileDataUrl = e.target.result;
    renderUploadTab();
  };
  reader.readAsDataURL(file);
}

function resetUpload() {
  UPLOAD_STATE.fileDataUrl = null;
  UPLOAD_STATE.mediaType = null;
  UPLOAD_STATE.fileName = null;
  UPLOAD_STATE.error = null;
  UPLOAD_STATE.results = [];
  UPLOAD_STATE.einkaufsDatum = null;
  UPLOAD_STATE.geschaeft = null;
  UPLOAD_STATE.addedIndices = new Set();
  renderUploadTab();
}

// ─── Rechnungs-Ordner scannen (File System Access API) ───
async function openRechnungenOrdner() {
  if (!window.showDirectoryPicker) {
    RECHNUNG_SCAN.error = 'Dein Browser unterstützt kein direktes Öffnen von Ordnern. Bitte Chrome oder Edge verwenden.';
    renderUploadTab(); return;
  }
  try {
    RECHNUNG_SCAN.loading = true;
    RECHNUNG_SCAN.error = null;
    renderUploadTab();
    const dh = await window.showDirectoryPicker({ mode: 'read' });
    RECHNUNG_SCAN.dirHandle = dh;
    // detect supplier from folder name
    const name = dh.name.toLowerCase();
    if (name.includes('um-trade') || name.includes('um_trade') || name.includes('umtrade')) {
      RECHNUNG_SCAN.lieferant = 'UM Trade';
    } else if (name.includes('metro')) {
      RECHNUNG_SCAN.lieferant = 'Metro';
    } else if (name.includes('etsan')) {
      RECHNUNG_SCAN.lieferant = 'Etsan';
    } else {
      RECHNUNG_SCAN.lieferant = dh.name;
    }
    // collect PDFs
    const pdfs = [];
    for await (const [entryName, handle] of dh.entries()) {
      if (handle.kind === 'file' && entryName.toLowerCase().endsWith('.pdf')) {
        pdfs.push({ name: entryName, handle });
      }
    }
    pdfs.sort((a, b) => b.name.localeCompare(a.name)); // neueste zuerst
    RECHNUNG_SCAN.pdfs = pdfs;
    RECHNUNG_SCAN.loading = false;
    renderUploadTab();
  } catch (e) {
    RECHNUNG_SCAN.loading = false;
    if (e.name !== 'AbortError') {
      RECHNUNG_SCAN.error = 'Ordner konnte nicht geöffnet werden: ' + e.message;
    }
    renderUploadTab();
  }
}

async function ladeRechnungPDF(idx) {
  const entry = RECHNUNG_SCAN.pdfs[idx];
  if (!entry) return;
  try {
    const fileObj = await entry.handle.getFile();
    // inject supplier as filename hint if not already in name
    handleFileUpload(fileObj);
  } catch (e) {
    UPLOAD_STATE.error = 'PDF konnte nicht gelesen werden: ' + e.message;
    renderUploadTab();
  }
}

function closeRechnungenScan() {
  RECHNUNG_SCAN.dirHandle = null;
  RECHNUNG_SCAN.pdfs = [];
  RECHNUNG_SCAN.lieferant = '';
  RECHNUNG_SCAN.error = null;
  renderUploadTab();
}

// ═══════════════════════════════════════════════════════════════
// UPLOAD TAB — Render
// ═══════════════════════════════════════════════════════════════

function renderUploadTab() {
  const hasKey = ANTHROPIC_API_KEY && ANTHROPIC_API_KEY !== 'HIER_API_KEY_EINFÜGEN';
  const panel = document.getElementById('panel-upload');

  let inner = '';

  // ─── API key hint ───
  if (!hasKey) {
    inner += `
      <div style="border:2px dashed #e3beb8;border-radius:16px;padding:20px 24px;margin-bottom:24px;background:#fff">
        <div style="display:flex;align-items:flex-start;gap:14px">
          <span class="material-symbols-outlined" style="font-size:24px;color:#5a403c;margin-top:2px">key</span>
          <div>
            <p style="font-size:14px;font-weight:700;color:#261816;margin-bottom:8px">🔑 Bitte API Key einfügen um das Auslesen zu nutzen</p>
            <p style="font-size:13px;color:#5a403c;line-height:1.7">
              Öffne <code style="background:#ffe9e6;padding:2px 7px;border-radius:6px;font-size:12px;color:#610000">pizzaria.html</code> und trage deinen Anthropic API Key ganz oben ein:<br>
              <code style="background:#ffe9e6;padding:2px 7px;border-radius:6px;font-size:12px;color:#610000">const ANTHROPIC_API_KEY = "sk-ant-...";</code>
            </p>
          </div>
        </div>
      </div>`;
  }

  // ─── Error ───
  if (UPLOAD_STATE.error) {
    inner += `
      <div style="background:#ffdad6;border:1px solid #ba1a1a33;border-radius:14px;padding:14px 18px;margin-bottom:20px;display:flex;align-items:flex-start;gap:12px">
        <span class="material-symbols-outlined" style="font-size:20px;color:#ba1a1a;flex-shrink:0;margin-top:1px">error</span>
        <div>
          <p style="font-size:13px;font-weight:700;color:#93000a">Fehler</p>
          <p style="font-size:12px;color:#93000a;margin-top:3px">${escHtml(UPLOAD_STATE.error)}</p>
        </div>
      </div>`;
  }

  // ─── Hidden file input ───
  inner += `<input id="upload-file-input" type="file" accept="image/*,.pdf" capture="environment" style="display:none" onchange="handleFileSelect(this)">`;

  // ─── Rechnung scannen Button + PDF-Liste ───
  if (!UPLOAD_STATE.fileDataUrl) {
    if (RECHNUNG_SCAN.dirHandle && RECHNUNG_SCAN.pdfs.length >= 0) {
      // Ordner ist geöffnet — zeige PDF-Liste
      inner += `
        <div style="background:#fff;border:1px solid #e3beb8;border-radius:18px;overflow:hidden;margin-bottom:18px;box-shadow:0 2px 8px rgba(0,0,0,.06)">
          <div style="padding:14px 18px;background:#f8dcd8;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e3beb844">
            <div style="display:flex;align-items:center;gap:10px">
              <span class="material-symbols-outlined" style="font-size:20px;color:#610000">folder_open</span>
              <div>
                <p style="font-size:13px;font-weight:700;color:#261816;margin:0">${escHtml(RECHNUNG_SCAN.lieferant || RECHNUNG_SCAN.dirHandle.name)}</p>
                <p style="font-size:11px;color:#5a403c;margin:2px 0 0">${RECHNUNG_SCAN.pdfs.length} PDF${RECHNUNG_SCAN.pdfs.length !== 1 ? 's' : ''} gefunden</p>
              </div>
            </div>
            <button onclick="closeRechnungenScan()" style="padding:5px 12px;border-radius:10px;border:1px solid #e3beb8;background:#fff;font-size:12px;color:#5a403c;cursor:pointer;display:flex;align-items:center;gap:4px;font-family:inherit">
              <span class="material-symbols-outlined" style="font-size:14px">close</span> Schließen
            </button>
          </div>
          ${RECHNUNG_SCAN.error ? `<div style="padding:12px 18px;background:#ffdad6;color:#93000a;font-size:12px">${escHtml(RECHNUNG_SCAN.error)}</div>` : ''}
          ${RECHNUNG_SCAN.pdfs.length === 0 ? `
            <div style="padding:28px;text-align:center;color:#8d6562">
              <span class="material-symbols-outlined" style="font-size:36px;margin-bottom:8px;display:block;color:#e3beb8">folder_off</span>
              <p style="font-size:13px">Keine PDFs in diesem Ordner gefunden.</p>
            </div>` : `
            <div style="padding:8px">
              ${RECHNUNG_SCAN.pdfs.map((pdf, i) => `
                <button onclick="ladeRechnungPDF(${i})"
                  style="width:100%;display:flex;align-items:center;gap:12px;padding:11px 14px;border:none;background:transparent;border-radius:12px;cursor:pointer;text-align:left;font-family:inherit;transition:background .15s"
                  onmouseover="this.style.background='#fff8f6'" onmouseout="this.style.background='transparent'">
                  <span class="material-symbols-outlined" style="font-size:22px;color:#610000;flex-shrink:0">picture_as_pdf</span>
                  <div style="flex:1;min-width:0">
                    <p style="font-size:13px;font-weight:600;color:#261816;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(pdf.name)}</p>
                    <p style="font-size:11px;color:#5a403c;margin:2px 0 0">Tippen zum Auslesen</p>
                  </div>
                  <span class="material-symbols-outlined" style="font-size:18px;color:#8e706b;flex-shrink:0">chevron_right</span>
                </button>`).join('')}
            </div>`}
        </div>`;
    } else {
      // Noch kein Ordner geöffnet — zeige "Rechnung scannen" Button
      inner += `
        <button onclick="openRechnungenOrdner()"
          ${RECHNUNG_SCAN.loading ? 'disabled' : ''}
          style="width:100%;display:flex;align-items:center;justify-content:center;gap:10px;padding:16px;border:2px solid #610000;border-radius:16px;background:#fff;color:#610000;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:16px;transition:all .2s"
          onmouseover="this.style.background='#fff0ee'" onmouseout="this.style.background='#fff'">
          ${RECHNUNG_SCAN.loading
            ? `<span class="material-symbols-outlined" style="font-size:22px;animation:spin 1s linear infinite">progress_activity</span> Lade Ordner...`
            : `<span class="material-symbols-outlined" style="font-size:22px">folder_open</span> 📂 Rechnung scannen`}
        </button>
        ${RECHNUNG_SCAN.error ? `<div style="background:#ffdad6;border-radius:12px;padding:11px 14px;margin-bottom:14px;font-size:12px;color:#93000a">${escHtml(RECHNUNG_SCAN.error)}</div>` : ''}
        <div style="text-align:center;color:#8d6562;font-size:12px;margin-bottom:16px;display:flex;align-items:center;gap:8px;justify-content:center">
          <div style="flex:1;height:1px;background:#e3beb8"></div>oder<div style="flex:1;height:1px;background:#e3beb8"></div>
        </div>`;
    }
  }

  if (!UPLOAD_STATE.fileDataUrl) {
    // ─── Drop zone ───
    inner += `
      <div id="upload-drop-zone"
        style="border:2px dashed #e3beb8;border-radius:20px;padding:56px 24px;text-align:center;cursor:pointer;background:#fff8f6;transition:all .2s"
        onclick="document.getElementById('upload-file-input').click()"
        ondragover="event.preventDefault();this.style.borderColor='#610000';this.style.background='#fff0ee'"
        ondragleave="this.style.borderColor='#e3beb8';this.style.background='#fff8f6'"
        ondrop="event.preventDefault();this.style.borderColor='#e3beb8';this.style.background='#fff8f6';handleFileDrop(event)">
        <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#610000,#8b0000);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;box-shadow:0 4px 16px rgba(97,0,0,.3)">
          <span class="material-symbols-outlined" style="font-size:38px;color:#fff">photo_camera</span>
        </div>
        <p style="font-size:17px;font-weight:700;color:#261816;margin-bottom:8px">Kassenbon hochladen</p>
        <p style="font-size:14px;color:#5a403c;margin-bottom:20px">Foto oder PDF hierher ziehen — oder tippen zum Auswählen</p>
        <div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-bottom:20px">
          <span style="background:#fff;border:1px solid #e3beb8;border-radius:20px;padding:5px 14px;font-size:12px;color:#5a403c;display:flex;align-items:center;gap:5px">
            <span class="material-symbols-outlined" style="font-size:14px">image</span> JPG / PNG / WebP
          </span>
          <span style="background:#fff;border:1px solid #e3beb8;border-radius:20px;padding:5px 14px;font-size:12px;color:#5a403c;display:flex;align-items:center;gap:5px">
            <span class="material-symbols-outlined" style="font-size:14px">picture_as_pdf</span> PDF
          </span>
        </div>
        <p style="font-size:12px;color:#8d6562">📱 Auf dem Handy: Foto direkt von der Kamera wählen</p>
      </div>`;
  } else {
    // ─── File loaded: preview + auslesen ───
    const isImage = UPLOAD_STATE.mediaType && UPLOAD_STATE.mediaType.startsWith('image/');

    inner += `<div style="display:flex;flex-direction:column;gap:18px">`;

    // Preview card
    inner += `
      <div style="background:#fff;border:1px solid #e3beb866;border-radius:18px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.07)">
        <div style="padding:12px 16px;border-bottom:1px solid #e3beb844;display:flex;align-items:center;justify-content:space-between;background:#f8dcd8">
          <div style="display:flex;align-items:center;gap:10px">
            <span class="material-symbols-outlined" style="font-size:18px;color:#610000">${isImage ? 'image' : 'picture_as_pdf'}</span>
            <span style="font-size:13px;font-weight:600;color:#261816;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(UPLOAD_STATE.fileName || 'Datei')}</span>
          </div>
          <button onclick="resetUpload()"
            style="padding:5px 12px;border-radius:10px;border:1px solid #e3beb8;background:#fff;font-size:12px;color:#5a403c;cursor:pointer;display:flex;align-items:center;gap:4px;font-family:inherit">
            <span class="material-symbols-outlined" style="font-size:14px">close</span> Entfernen
          </button>
        </div>
        ${isImage
          ? `<div style="background:#261816;max-height:360px;overflow:hidden;display:flex;align-items:center;justify-content:center">
               <img src="${UPLOAD_STATE.fileDataUrl}" style="max-width:100%;max-height:360px;object-fit:contain;display:block">
             </div>`
          : `<div style="padding:40px;text-align:center;background:#fff0ee">
               <span class="material-symbols-outlined" style="font-size:56px;color:#610000">picture_as_pdf</span>
               <p style="font-size:13px;color:#5a403c;margin-top:10px">PDF bereit zum Auslesen</p>
             </div>`}
      </div>`;

    // Auslesen button (only if not loading and no results yet)
    if (!UPLOAD_STATE.loading && UPLOAD_STATE.results.length === 0) {
      inner += `
        <button onclick="auslesenStart()" ${!hasKey ? 'disabled' : ''}
          style="width:100%;padding:18px;border-radius:16px;border:none;font-size:16px;font-weight:700;font-family:inherit;color:#fff;background:linear-gradient(135deg,#610000,#8b0000);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 4px 16px rgba(97,0,0,.3);${!hasKey?'opacity:.5;cursor:not-allowed':''}">
          <span class="material-symbols-outlined" style="font-size:24px">document_scanner</span>
          Kassenbon auslesen
        </button>`;
    }

    // Loading state
    if (UPLOAD_STATE.loading) {
      inner += `
        <div style="text-align:center;padding:52px 20px;background:#fff;border-radius:18px;border:1px solid #e3beb866;box-shadow:0 2px 8px rgba(0,0,0,.07)">
          <div class="spinner"></div>
          <p style="font-size:15px;font-weight:700;color:#261816;margin-bottom:6px">KI liest Kassenbon aus …</p>
          <p style="font-size:13px;color:#5a403c">Claude analysiert das Bild und erkennt alle Produkte und Preise</p>
        </div>`;
    }

    // Results table
    if (UPLOAD_STATE.results.length > 0) {
      const shopName = UPLOAD_STATE.geschaeft;
      const datum = UPLOAD_STATE.einkaufsDatum ? fmtDate(UPLOAD_STATE.einkaufsDatum) : null;
      const allAdded = UPLOAD_STATE.results.every((_, i) => UPLOAD_STATE.addedIndices.has(i));

      inner += `
        <div style="background:#fff;border:1px solid #e3beb866;border-radius:18px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.07)">
          <!-- Results header -->
          <div style="padding:16px 20px;border-bottom:1px solid #e3beb844;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;background:#f8dcd8">
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
              <span class="material-symbols-outlined filled" style="font-size:22px;color:#386a20">check_circle</span>
              <span style="font-size:15px;font-weight:700;color:#261816">${UPLOAD_STATE.results.length} Produkte erkannt</span>
              ${shopName ? `<span style="background:${shopColor(shopName)};color:#fff;font-size:12px;font-weight:700;padding:3px 12px;border-radius:20px">${escHtml(shopName)}</span>` : ''}
              ${datum ? `<span style="font-size:12px;color:#5a403c;display:flex;align-items:center;gap:4px"><span class="material-symbols-outlined" style="font-size:14px">calendar_today</span>${escHtml(datum)}</span>` : ''}
            </div>
            <button onclick="auslesenStart()"
              style="padding:6px 14px;border-radius:10px;border:1px solid #e3beb8;background:#fff;font-size:12px;color:#5a403c;cursor:pointer;display:flex;align-items:center;gap:5px;font-family:inherit">
              <span class="material-symbols-outlined" style="font-size:14px">refresh</span> Erneut auslesen
            </button>
          </div>
          <!-- Table -->
          <div style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr style="background:#fff0ee">
                  <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em;white-space:nowrap">Produkt</th>
                  <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em;white-space:nowrap">Preis</th>
                  <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em;white-space:nowrap">Menge</th>
                  <th style="padding:10px 16px;text-align:center;font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em;white-space:nowrap"></th>
                </tr>
              </thead>
              <tbody>`;

      UPLOAD_STATE.results.forEach((item, idx) => {
        const isAdded = UPLOAD_STATE.addedIndices.has(idx);
        inner += `
                <tr style="border-bottom:1px solid #e3beb833;background:${isAdded ? '#f0fdf4' : 'transparent'}">
                  <td style="padding:13px 16px">
                    <div style="font-size:14px;font-weight:600;color:#261816">${escHtml(item.name)}</div>
                    ${item.kategorie ? `<div style="font-size:11px;color:#8d6562;margin-top:2px">${escHtml(item.kategorie)}</div>` : ''}
                  </td>
                  <td style="padding:13px 12px;text-align:right;font-size:15px;font-weight:700;color:#610000;white-space:nowrap">
                    ${item.preis != null ? eur(item.preis) : '—'}
                  </td>
                  <td style="padding:13px 12px;text-align:center;font-size:13px;color:#5a403c;white-space:nowrap">
                    ${item.menge != null ? item.menge : '1'}&nbsp;${escHtml(item.einheit || 'Stk')}
                  </td>
                  <td style="padding:13px 16px;text-align:center">
                    <button
                      class="add-btn ${isAdded ? 'added' : ''}"
                      onclick="addReceiptItemToInventory(${idx}, this)"
                      ${isAdded ? 'disabled' : ''}
                      style="padding:7px 14px;border-radius:10px;border:1.5px solid ${isAdded ? '#c7c9f9' : '#c0eda6'};background:${isAdded ? '#dfe0ff' : '#c0eda6'};color:${isAdded ? '#0d2ccc' : '#0c2000'};font-size:12px;font-weight:600;font-family:inherit;cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:4px">
                      ${isAdded
                        ? '<span class="material-symbols-outlined" style="font-size:14px">check</span> Hinzugefügt'
                        : '<span class="material-symbols-outlined" style="font-size:14px">add</span> Hinzufügen'}
                    </button>
                  </td>
                </tr>`;
      });

      inner += `
              </tbody>
            </table>
          </div>
          <!-- Footer -->
          <div style="padding:14px 20px;border-top:1px solid #e3beb844;display:flex;justify-content:flex-end">
            <button onclick="addAllReceiptItems()"
              ${allAdded ? 'disabled' : ''}
              style="padding:10px 20px;border-radius:12px;border:none;background:${allAdded ? '#e3beb8' : 'linear-gradient(135deg,#610000,#8b0000)'};color:${allAdded ? '#5a403c' : '#fff'};font-size:13px;font-weight:700;font-family:inherit;cursor:${allAdded ? 'default' : 'pointer'};display:flex;align-items:center;gap:6px">
              <span class="material-symbols-outlined" style="font-size:16px">playlist_add_check</span>
              ${allAdded ? 'Alle hinzugefügt' : 'Alle hinzufügen'}
            </button>
          </div>
        </div>`;
    }

    inner += `</div>`; // end flex column
  }

  inner += renderHandlistSection();
  inner += renderPricelistSection();
  panel.innerHTML = inner;
}

// ═══════════════════════════════════════════════════════════════
// UPLOAD TAB — Claude API (Receipt Scanning)
// ═══════════════════════════════════════════════════════════════

async function auslesenStart() {
  if (!UPLOAD_STATE.fileDataUrl) return;
  const hasKey = ANTHROPIC_API_KEY && ANTHROPIC_API_KEY !== 'HIER_API_KEY_EINFÜGEN';
  if (!hasKey) {
    UPLOAD_STATE.error = 'Kein API Key konfiguriert. Bitte ANTHROPIC_API_KEY am Anfang der Datei eintragen.';
    renderUploadTab();
    return;
  }
  UPLOAD_STATE.loading = true;
  UPLOAD_STATE.error = null;
  UPLOAD_STATE.results = [];
  UPLOAD_STATE.addedIndices = new Set();
  renderUploadTab();

  try {
    const parsed = await scanReceiptViaClaudeAPI();
    UPLOAD_STATE.results = parsed.items || [];
    UPLOAD_STATE.einkaufsDatum = parsed.datum || null;
    UPLOAD_STATE.geschaeft = parsed.geschaeft || null;
    UPLOAD_STATE.error = null;
  } catch (err) {
    UPLOAD_STATE.error = err.message || String(err);
    UPLOAD_STATE.results = [];
  } finally {
    UPLOAD_STATE.loading = false;
    renderUploadTab();
  }
}

async function scanReceiptViaClaudeAPI() {
  const base64 = UPLOAD_STATE.fileDataUrl.split(',')[1];
  const mediaType = UPLOAD_STATE.mediaType;
  const isPdf = mediaType === 'application/pdf';

  const prompt =
    `Lies diesen Kassenbon / diese Rechnung aus und gib mir alle Produkte als JSON zurück.\n\n` +
    `Antworte NUR mit diesem JSON-Format, ohne Erklärungen, ohne Markdown-Codeblock:\n` +
    `{\n` +
    `  "geschaeft": "Geschäftsname (z.B. Metro, Hofer, Billa, Spar, Lidl, Rewe) oder null",\n` +
    `  "datum": "YYYY-MM-DD oder null",\n` +
    `  "items": [\n` +
    `    {\n` +
    `      "name": "Produktname",\n` +
    `      "preis": 1.99,\n` +
    `      "menge": 1,\n` +
    `      "einheit": "Stk / kg / L / Pack / etc.",\n` +
    `      "kategorie": "Grundzutaten / Käse / Belag / Gewürze / Getränke / Sonstiges"\n` +
    `    }\n` +
    `  ]\n` +
    `}\n\n` +
    `Nur die eigentlichen Produkte/Waren auflisten — keine Summen, Rabatte, Steuern oder Zahlungsinfos.\n` +
    `Falls kein Kassenbon erkennbar oder das Bild unlesbar ist, antworte mit: {"fehler": "Kurze Beschreibung"}`;

  const contentBlock = isPdf
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
    : { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } };

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: [contentBlock, { type: 'text', text: prompt }] }],
    }),
  });

  if (!resp.ok) {
    let errMsg = `HTTP ${resp.status}`;
    try { const e = await resp.json(); errMsg = e?.error?.message || errMsg; } catch (_) {}
    if (resp.status === 401) throw new Error('Ungültiger API Key (401). Bitte API Key prüfen.');
    if (resp.status === 429) throw new Error('Rate Limit erreicht (429). Kurz warten und erneut versuchen.');
    throw new Error(errMsg);
  }

  const data = await resp.json();
  const textBlock = data.content.find(b => b.type === 'text');
  if (!textBlock) throw new Error('Keine Antwort von Claude erhalten.');
  return parseReceiptJSON(textBlock.text);
}

function parseReceiptJSON(text) {
  if (!text || !text.trim()) throw new Error('Leere Antwort von Claude.');
  let parsed;
  try { parsed = JSON.parse(text.trim()); } catch (_) {
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) { try { parsed = JSON.parse(fenceMatch[1].trim()); } catch (_2) {} }
    if (!parsed) {
      const objMatch = text.match(/\{[\s\S]*\}/);
      if (objMatch) { try { parsed = JSON.parse(objMatch[0]); } catch (_3) {} }
    }
  }
  if (!parsed) throw new Error('Antwort konnte nicht verarbeitet werden. Bitte ein deutlicheres Foto machen.');
  if (parsed.fehler) throw new Error(parsed.fehler);
  if (!Array.isArray(parsed.items)) throw new Error('Keine Produkte erkannt. Bitte ein deutlicheres Foto machen.');
  return parsed;
}

// ═══════════════════════════════════════════════════════════════
// UPLOAD TAB — Add to Inventory / Price DB
// ═══════════════════════════════════════════════════════════════

function addReceiptItemToInventory(idx, btn) {
  const item = UPLOAD_STATE.results[idx];
  if (!item) return;

  // Resolve shop ID from detected shop name
  let foundShopId = null;
  if (UPLOAD_STATE.geschaeft) {
    const key = UPLOAD_STATE.geschaeft.toLowerCase();
    for (const s of SHOPS) {
      if (key.includes(s.id) || s.name.toLowerCase().includes(key) || key.includes(s.name.toLowerCase())) {
        foundShopId = s.id;
        break;
      }
    }
  }

  // Try to match an existing product by name
  const nameLower = item.name.toLowerCase();
  const matched = PRODUCTS.find(p =>
    p.name.toLowerCase() === nameLower ||
    p.name.toLowerCase().includes(nameLower.split(' ')[0]) ||
    nameLower.includes(p.name.toLowerCase().split(' ')[0])
  );

  if (matched) {
    // Update price in PRICE_MAP
    if (foundShopId && item.preis != null) {
      if (!PRICE_MAP[foundShopId]) PRICE_MAP[foundShopId] = {};
      PRICE_MAP[foundShopId][matched.id] = item.preis;
    }
  } else {
    // Add new product to PRODUCTS
    const id = 'receipt-' + item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30) + '-' + idx;
    PRODUCTS.push({
      id,
      name: item.name,
      category: item.kategorie || 'Sonstiges',
      unit: item.einheit || 'Stk',
      currentStock: typeof item.menge === 'number' ? item.menge : 0,
      minStock: 1,
      orderQuantity: typeof item.menge === 'number' ? Math.max(1, item.menge) : 1,
    });
    stockLevels[id] = typeof item.menge === 'number' ? item.menge : 0;
    if (foundShopId && item.preis != null) {
      if (!PRICE_MAP[foundShopId]) PRICE_MAP[foundShopId] = {};
      PRICE_MAP[foundShopId][id] = item.preis;
    }
    updateHeaderBadge();
  }

  addHistoryEntry({
    produktName: item.name,
    produktId:   matched ? matched.id : ('receipt-' + item.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,30) + '-' + idx),
    menge:       item.menge  ?? null,
    einheit:     item.einheit || 'Stk',
    preis:       item.preis   ?? null,
    shopName:    UPLOAD_STATE.geschaeft || null,
    shopId:      foundShopId  || null,
    quelle:      'kassenbon',
    datum:       UPLOAD_STATE.einkaufsDatum || null,
  });

  UPLOAD_STATE.addedIndices.add(idx);
  btn.classList.add('added');
  btn.disabled = true;
  btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:14px">check</span> Hinzugefügt';
  btn.style.background = '#dfe0ff';
  btn.style.color = '#0d2ccc';
  btn.style.borderColor = '#c7c9f9';
  btn.style.cursor = 'default';
}

function addAllReceiptItems() {
  UPLOAD_STATE.results.forEach((_, idx) => {
    if (!UPLOAD_STATE.addedIndices.has(idx)) {
      const btn = document.querySelector(`#panel-upload .add-btn[onclick="addReceiptItemToInventory(${idx}, this)"]`);
      if (btn && !btn.disabled) addReceiptItemToInventory(idx, btn);
    }
  });
  // Re-render to update "Alle hinzufügen" button state
  renderUploadTab();
}

// ═══════════════════════════════════════════════════════════════
// PRICELIST — Extra shops (beyond built-in SHOPS array)
// ═══════════════════════════════════════════════════════════════

const IMPORT_SHOPS_EXTRA = [
  { id: 'transgourmet', name: 'Transgourmet', type: 'Großhandel', color: '#00529B' },
  { id: 'hofer',        name: 'Hofer',        type: 'Discounter', color: '#e63946' },
  { id: 'billa',        name: 'Billa',        type: 'Supermarkt', color: '#ed1c24' },
  { id: 'spar',         name: 'Spar',         type: 'Supermarkt', color: '#007f3e' },
  { id: 'etsan',        name: 'Etsan',        type: 'Großhandel', color: '#ff6b00' },
  { id: 'penny',        name: 'Penny',        type: 'Discounter', color: '#cc0000' },
];

function allImportShops() {
  return [...SHOPS, ...IMPORT_SHOPS_EXTRA].filter((s, i, a) => a.findIndex(x => x.id === s.id) === i);
}

// ═══════════════════════════════════════════════════════════════
// HANDLIST — State
// ═══════════════════════════════════════════════════════════════

const HANDLIST_STATE = {
  fileDataUrl: null,
  mediaType: null,
  fileName: null,
  loading: false,
  error: null,
  items: [],  // [{name, menge, einheit, status, suggestion, matchedProductId}]
  appliedIndices: new Set(),
};

// ═══════════════════════════════════════════════════════════════
// HANDLIST — File Handling
// ═══════════════════════════════════════════════════════════════

function handleHandlistDrop(event) {
  const file = event.dataTransfer.files[0];
  if (file) handleHandlistFile(file);
}

function handleHandlistSelect(input) {
  const file = input.files[0];
  if (file) handleHandlistFile(file);
}

function handleHandlistFile(file) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.type)) {
    HANDLIST_STATE.error = 'Bitte ein Bild (JPG, PNG, WebP) hochladen.';
    HANDLIST_STATE.fileDataUrl = null;
    renderUploadTab();
    return;
  }
  HANDLIST_STATE.error = null;
  HANDLIST_STATE.mediaType = file.type;
  HANDLIST_STATE.fileName = file.name;
  HANDLIST_STATE.items = [];
  HANDLIST_STATE.appliedIndices = new Set();

  const reader = new FileReader();
  reader.onload = e => { HANDLIST_STATE.fileDataUrl = e.target.result; renderUploadTab(); };
  reader.readAsDataURL(file);
}

function resetHandlist() {
  HANDLIST_STATE.fileDataUrl = null;
  HANDLIST_STATE.mediaType = null;
  HANDLIST_STATE.fileName = null;
  HANDLIST_STATE.error = null;
  HANDLIST_STATE.items = [];
  HANDLIST_STATE.appliedIndices = new Set();
  renderUploadTab();
}

// ═══════════════════════════════════════════════════════════════
// HANDLIST — Classify items against PRODUCTS
// ═══════════════════════════════════════════════════════════════

function classifyHandlistItem(name) {
  const n = name.toLowerCase().trim();
  // 1. Exact match → high confidence
  const exact = PRODUCTS.find(p => p.name.toLowerCase() === n);
  if (exact) return { status: 'matched', matchedProductId: exact.id, suggestion: exact.name };

  // 2. Containment match → high confidence
  const contain = PRODUCTS.find(p => {
    const pn = p.name.toLowerCase();
    return pn.includes(n) || n.includes(pn);
  });
  if (contain) return { status: 'matched', matchedProductId: contain.id, suggestion: contain.name };

  // 3. Word overlap → medium confidence (similar / suggestion)
  const words = n.split(/\s+/).filter(w => w.length > 3);
  if (words.length > 0) {
    for (const p of PRODUCTS) {
      const pWords = p.name.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const overlap = words.filter(w => pWords.some(pw => pw.includes(w) || w.includes(pw)));
      if (overlap.length >= Math.ceil(Math.min(words.length, pWords.length) * 0.5)) {
        return { status: 'similar', matchedProductId: p.id, suggestion: p.name };
      }
    }
  }

  return { status: 'new', matchedProductId: null, suggestion: null };
}

function enrichHandlistItems(rawItems) {
  return rawItems.map(item => ({ ...item, ...classifyHandlistItem(item.name || '') }));
}

// ═══════════════════════════════════════════════════════════════
// HANDLIST — Apply to Inventory
// ═══════════════════════════════════════════════════════════════

function applyHandlistItem(idx, btn) {
  const item = HANDLIST_STATE.items[idx];
  if (!item) return;

  if (item.matchedProductId) {
    const prod = PRODUCTS.find(p => p.id === item.matchedProductId);
    if (prod && item.menge != null) prod.orderQuantity = Number(item.menge) || prod.orderQuantity;
  } else {
    const id = 'hand-' + item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30) + '-' + idx;
    if (!PRODUCTS.find(p => p.id === id)) {
      PRODUCTS.push({
        id, name: item.name, category: 'Sonstiges',
        unit: item.einheit || 'Stk', currentStock: 0,
        minStock: Number(item.menge) || 1, orderQuantity: Number(item.menge) || 1,
      });
      stockLevels[id] = 0;
    }
    item.matchedProductId = id;
    item.status = 'matched';
  }

  addHistoryEntry({
    produktName: item.name,
    produktId:   item.matchedProductId,
    menge:       item.menge   ?? null,
    einheit:     item.einheit || 'Stk',
    preis:       null,
    shopName:    null,
    shopId:      null,
    quelle:      'handliste',
  });

  HANDLIST_STATE.appliedIndices.add(idx);
  updateHeaderBadge();

  if (btn) {
    btn.disabled = true;
    btn.style.background = '#dfe0ff';
    btn.style.borderColor = '#c7c9f9';
    btn.style.color = '#0d2ccc';
    btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:14px">check</span> Übernommen';
    const row = btn.closest('tr');
    if (row) row.style.background = '#f0fdf4';
  }
}

function applyAllHandlistItems() {
  HANDLIST_STATE.items.forEach((_, idx) => {
    if (!HANDLIST_STATE.appliedIndices.has(idx)) applyHandlistItem(idx, null);
  });
  updateHeaderBadge();
  renderUploadTab();
}

function applySelectedHandlistItems() {
  const table = document.getElementById('handlist-results-table');
  if (!table) return;
  let anyApplied = false;
  table.querySelectorAll('input[type="checkbox"][data-idx]').forEach(cb => {
    if (cb.checked) {
      const idx = parseInt(cb.dataset.idx);
      if (!HANDLIST_STATE.appliedIndices.has(idx)) { applyHandlistItem(idx, null); anyApplied = true; }
    }
  });
  if (anyApplied) { updateHeaderBadge(); renderUploadTab(); }
}

function discardHandlist() { resetHandlist(); }

// ═══════════════════════════════════════════════════════════════
// HANDLIST — Edit item in-place
// ═══════════════════════════════════════════════════════════════

function startEditHandlistItem(idx) {
  const item = HANDLIST_STATE.items[idx];
  const nameCell = document.getElementById('handlist-name-' + idx);
  if (!item || !nameCell) return;
  nameCell.innerHTML = `
    <div style="display:flex;gap:4px;align-items:center" onclick="event.stopPropagation()">
      <input id="hl-edit-${idx}" value="${escHtml(item.name)}"
        style="padding:4px 8px;border:1.5px solid #a16207;border-radius:8px;font-size:13px;font-family:inherit;color:#261816;min-width:120px;flex:1"
        onkeydown="if(event.key==='Enter')commitEditHandlistItem(${idx});if(event.key==='Escape')renderUploadTab()" />
      <button onclick="commitEditHandlistItem(${idx})"
        style="padding:4px 10px;border-radius:8px;border:none;background:#a16207;color:#fff;font-size:12px;font-family:inherit;cursor:pointer">✓</button>
      <button onclick="renderUploadTab()"
        style="padding:4px 8px;border-radius:8px;border:1px solid #e3beb8;background:#fff;font-size:12px;font-family:inherit;cursor:pointer;color:#5a403c">✗</button>
    </div>`;
  const inp = document.getElementById('hl-edit-' + idx);
  if (inp) { inp.focus(); inp.select(); }
}

function commitEditHandlistItem(idx) {
  const inp = document.getElementById('hl-edit-' + idx);
  if (!inp) return;
  const newName = inp.value.trim();
  if (!newName) return;
  const item = HANDLIST_STATE.items[idx];
  if (!item) return;
  item.name = newName;
  const cls = classifyHandlistItem(newName);
  item.status = cls.status; item.matchedProductId = cls.matchedProductId; item.suggestion = cls.suggestion;
  renderUploadTab();
}

// ═══════════════════════════════════════════════════════════════
// HANDLIST — Claude API
// ═══════════════════════════════════════════════════════════════

async function erkennungStart() {
  if (!HANDLIST_STATE.fileDataUrl) return;
  const hasKey = ANTHROPIC_API_KEY && ANTHROPIC_API_KEY !== 'HIER_API_KEY_EINFÜGEN';
  if (!hasKey) {
    HANDLIST_STATE.error = 'Kein API Key konfiguriert. Bitte ANTHROPIC_API_KEY am Anfang der Datei eintragen.';
    renderUploadTab(); return;
  }
  HANDLIST_STATE.loading = true;
  HANDLIST_STATE.error = null;
  HANDLIST_STATE.items = [];
  HANDLIST_STATE.appliedIndices = new Set();
  renderUploadTab();

  try {
    const rawItems = await scanHandlistViaClaudeAPI();
    if (!rawItems.length) throw new Error('Keine Produkte erkannt. Bitte ein deutlicheres Foto machen.');
    HANDLIST_STATE.items = enrichHandlistItems(rawItems);
    HANDLIST_STATE.error = null;
  } catch (err) {
    HANDLIST_STATE.error = err.message || String(err);
    HANDLIST_STATE.items = [];
  } finally {
    HANDLIST_STATE.loading = false;
    renderUploadTab();
  }
}

async function scanHandlistViaClaudeAPI() {
  const base64 = HANDLIST_STATE.fileDataUrl.split(',')[1];
  const mediaType = HANDLIST_STATE.mediaType;

  const prompt =
    `Das ist eine handgeschriebene Einkaufsliste einer Pizzeria in Wien.\n` +
    `Erkenne alle Produkte und Mengen. Antworte NUR mit einem JSON-Array, ohne Markdown:\n` +
    `[{"name": "Produktname", "menge": 2, "einheit": "kg"}]\n\n` +
    `Typische Produkte: Mehl, Mozzarella, Tomaten, Salami, Öl, Gewürze, Hefe, Oregano,\n` +
    `Basilikum, Oliven, Kapern, Prosciutto, Rucola, Thunfisch, Sardellen, Parmesan, Ricotta.\n\n` +
    `Regeln:\n` +
    `- Mengen als Zahlen (z.B. 2, nicht "zwei")\n` +
    `- Einheit: kg / g / L / ml / Stk / Pkg / Dose / Flasche\n` +
    `- Falls Schrift unleserlich: {"fehler": "Unleserlich — bitte deutlicheres Foto"}\n` +
    `- Falls kein Text erkennbar: {"fehler": "Kein Text im Bild erkannt"}`;

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
        { type: 'text', text: prompt },
      ]}],
    }),
  });

  if (!resp.ok) {
    let errMsg = `HTTP ${resp.status}`;
    try { const e = await resp.json(); errMsg = e?.error?.message || errMsg; } catch (_) {}
    if (resp.status === 401) throw new Error('Ungültiger API Key (401). Bitte API Key prüfen.');
    if (resp.status === 429) throw new Error('Rate Limit erreicht (429). Kurz warten und erneut versuchen.');
    throw new Error(errMsg);
  }

  const data = await resp.json();
  const textBlock = data.content.find(b => b.type === 'text');
  if (!textBlock) throw new Error('Keine Antwort von Claude erhalten.');
  return parseHandlistJSON(textBlock.text);
}

function parseHandlistJSON(text) {
  if (!text || !text.trim()) throw new Error('Leere Antwort von Claude.');
  let parsed;
  try { parsed = JSON.parse(text.trim()); } catch (_) {
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) { try { parsed = JSON.parse(fenceMatch[1].trim()); } catch (_2) {} }
    if (!parsed) {
      const arrMatch = text.match(/\[[\s\S]*\]/);
      if (arrMatch) { try { parsed = JSON.parse(arrMatch[0]); } catch (_3) {} }
      if (!parsed) {
        const objMatch = text.match(/\{[\s\S]*\}/);
        if (objMatch) { try { parsed = JSON.parse(objMatch[0]); } catch (_4) {} }
      }
    }
  }
  if (!parsed) throw new Error('Antwort konnte nicht verarbeitet werden. Bitte erneut versuchen.');
  if (!Array.isArray(parsed) && parsed.fehler) throw new Error(parsed.fehler);
  if (!Array.isArray(parsed)) throw new Error('Unerwartetes Format. Bitte erneut versuchen.');
  return parsed.filter(item => item && item.name);
}

// ═══════════════════════════════════════════════════════════════
// HANDLIST — Render Section
// ═══════════════════════════════════════════════════════════════

function renderHandlistSection() {
  const STATUS_CFG = {
    matched: { bg: '#f0fdf4', border: '#86efac', text: '#166534', dot: '#16a34a', label: 'Im System ✓' },
    similar: { bg: '#fefce8', border: '#fde047', text: '#854d0e', dot: '#ca8a04', label: 'Ähnlich gefunden' },
    new:     { bg: '#fff7ed', border: '#fed7aa', text: '#9a3412', dot: '#ea580c', label: 'Neu anlegen'     },
  };

  let html = `
    <div style="margin:40px 0 32px;display:flex;align-items:center;gap:14px">
      <div style="flex:1;height:1px;background:#e3beb8"></div>
      <span style="font-size:11px;font-weight:700;color:#8d6562;text-transform:uppercase;letter-spacing:.1em;white-space:nowrap">oder</span>
      <div style="flex:1;height:1px;background:#e3beb8"></div>
    </div>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
      <div style="width:44px;height:44px;border-radius:14px;background:#fef9c3;display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <span class="material-symbols-outlined" style="font-size:24px;color:#854d0e">edit_note</span>
      </div>
      <div>
        <h2 style="font-size:16px;font-weight:700;color:#261816;margin-bottom:2px">✍️ Handliste erkennen</h2>
        <p style="font-size:12px;color:#5a403c">Foto einer handgeschriebenen Einkaufsliste → digitale Einkaufsliste</p>
      </div>
    </div>`;

  if (HANDLIST_STATE.error) {
    html += `
      <div style="background:#ffdad6;border:1px solid #ba1a1a33;border-radius:14px;padding:14px 18px;margin-bottom:18px;display:flex;align-items:flex-start;gap:12px">
        <span class="material-symbols-outlined" style="font-size:20px;color:#ba1a1a;flex-shrink:0;margin-top:1px">error</span>
        <div>
          <p style="font-size:13px;font-weight:700;color:#93000a">Fehler</p>
          <p style="font-size:12px;color:#93000a;margin-top:3px">${escHtml(HANDLIST_STATE.error)}</p>
          <p style="font-size:11px;color:#93000a;margin-top:6px">Tipp: Besseres Licht, Liste flach hinlegen, ganzes Blatt im Bild.</p>
        </div>
      </div>`;
  }

  html += `<input id="handlist-file-input" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" style="display:none" onchange="handleHandlistSelect(this)">`;

  if (!HANDLIST_STATE.fileDataUrl) {
    // ─── Drop zone ───
    html += `
      <div id="handlist-drop-zone"
        style="border:2px dashed #fde047;border-radius:20px;padding:52px 24px;text-align:center;cursor:pointer;background:#fefce8;transition:all .2s"
        onclick="document.getElementById('handlist-file-input').click()"
        ondragover="event.preventDefault();this.style.borderColor='#854d0e';this.style.background='#fef08a55'"
        ondragleave="this.style.borderColor='#fde047';this.style.background='#fefce8'"
        ondrop="event.preventDefault();this.style.borderColor='#fde047';this.style.background='#fefce8';handleHandlistDrop(event)">
        <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#854d0e,#a16207);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;box-shadow:0 4px 16px rgba(133,77,14,.3)">
          <span class="material-symbols-outlined" style="font-size:38px;color:#fff">edit_note</span>
        </div>
        <p style="font-size:17px;font-weight:700;color:#261816;margin-bottom:8px">Handliste fotografieren</p>
        <p style="font-size:14px;color:#5a403c;margin-bottom:20px">Foto hierher ziehen — oder tippen um Kamera zu öffnen</p>
        <div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap">
          <span style="background:#fff;border:1px solid #fde047;border-radius:20px;padding:5px 14px;font-size:12px;color:#854d0e;display:flex;align-items:center;gap:5px">
            <span class="material-symbols-outlined" style="font-size:14px">image</span> JPG / PNG / WebP
          </span>
        </div>
        <p style="font-size:12px;color:#8d6562;margin-top:16px">📱 Auf dem Handy öffnet direkt die Kamera</p>
      </div>

      <div style="margin-top:14px;background:#fff;border:1px solid #fde04755;border-radius:14px;padding:14px 18px">
        <p style="font-size:12px;font-weight:700;color:#854d0e;margin-bottom:10px;display:flex;align-items:center;gap:6px">
          <span class="material-symbols-outlined" style="font-size:16px">lightbulb</span> Tipps für ein gutes Foto
        </p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          ${[['wb_sunny','Gutes Licht verwenden'],['straighten','Liste flach hinlegen'],
             ['draw','Deutlich schreiben hilft'],['crop_free','Ganzes Blatt im Bild']].map(([ic,tip]) =>
            `<div style="display:flex;align-items:center;gap:7px;font-size:12px;color:#5a403c">
               <span class="material-symbols-outlined" style="font-size:15px;color:#a16207">${ic}</span>${tip}
             </div>`).join('')}
        </div>
      </div>`;

  } else if (HANDLIST_STATE.loading) {
    html += `
      <div style="text-align:center;padding:52px 20px;background:#fefce8;border-radius:18px;border:2px dashed #fde047">
        <div class="spinner" style="border-color:#fde04744;border-top-color:#854d0e"></div>
        <p style="font-size:15px;font-weight:700;color:#261816;margin-bottom:6px">Lese Handschrift …</p>
        <p style="font-size:13px;color:#5a403c">Claude analysiert deine handgeschriebene Liste</p>
      </div>`;

  } else if (HANDLIST_STATE.items.length === 0) {
    // ─── Image preview + Erkennen button ───
    html += `
      <div style="background:#fff;border:1px solid #fde04766;border-radius:18px;overflow:hidden;box-shadow:0 2px 8px rgba(133,77,14,.1)">
        <div style="padding:12px 16px;border-bottom:1px solid #fde04744;display:flex;align-items:center;justify-content:space-between;background:#fef9c3">
          <div style="display:flex;align-items:center;gap:10px">
            <span class="material-symbols-outlined" style="font-size:18px;color:#854d0e">image</span>
            <span style="font-size:13px;font-weight:600;color:#261816;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(HANDLIST_STATE.fileName || 'Foto')}</span>
          </div>
          <button onclick="resetHandlist()"
            style="padding:5px 12px;border-radius:10px;border:1px solid #fde047;background:#fff;font-size:12px;color:#854d0e;cursor:pointer;display:flex;align-items:center;gap:4px;font-family:inherit">
            <span class="material-symbols-outlined" style="font-size:14px">close</span> Entfernen
          </button>
        </div>
        <div style="background:#1c1200;max-height:380px;overflow:hidden;display:flex;align-items:center;justify-content:center">
          <img src="${HANDLIST_STATE.fileDataUrl}" style="max-width:100%;max-height:380px;object-fit:contain;display:block">
        </div>
      </div>
      <button onclick="erkennungStart()"
        style="width:100%;margin-top:16px;padding:18px;border-radius:16px;border:none;font-size:16px;font-weight:700;font-family:inherit;color:#fff;background:linear-gradient(135deg,#854d0e,#a16207);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 4px 16px rgba(133,77,14,.35)">
        <span class="material-symbols-outlined" style="font-size:24px">manage_search</span>
        Handschrift erkennen
      </button>`;

  } else {
    // ─── Results table ───
    const allApplied = HANDLIST_STATE.items.every((_, i) => HANDLIST_STATE.appliedIndices.has(i));
    const counts = { matched: 0, similar: 0, new: 0 };
    HANDLIST_STATE.items.forEach(it => { if (counts[it.status] !== undefined) counts[it.status]++; });

    html += `
      <div style="background:#fff;border:1px solid #fde04766;border-radius:18px;overflow:hidden;box-shadow:0 2px 8px rgba(133,77,14,.1)">

        <!-- Header bar -->
        <div style="padding:16px 20px;border-bottom:1px solid #fde04744;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;background:#fef9c3">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span class="material-symbols-outlined" style="font-size:22px;color:#854d0e">edit_note</span>
            <span style="font-size:15px;font-weight:700;color:#261816">${HANDLIST_STATE.items.length} Produkte erkannt</span>
            ${counts.matched > 0 ? `<span style="background:#dcfce7;color:#166534;font-size:11px;font-weight:700;padding:2px 10px;border-radius:20px;border:1px solid #86efac">${counts.matched} im System</span>` : ''}
            ${counts.similar > 0 ? `<span style="background:#fefce8;color:#854d0e;font-size:11px;font-weight:700;padding:2px 10px;border-radius:20px;border:1px solid #fde047">${counts.similar} ähnlich</span>` : ''}
            ${counts.new     > 0 ? `<span style="background:#fff7ed;color:#9a3412;font-size:11px;font-weight:700;padding:2px 10px;border-radius:20px;border:1px solid #fed7aa">${counts.new} neu</span>` : ''}
          </div>
          <button onclick="erkennungStart()"
            style="padding:6px 14px;border-radius:10px;border:1px solid #fde047;background:#fff;font-size:12px;color:#854d0e;cursor:pointer;display:flex;align-items:center;gap:5px;font-family:inherit">
            <span class="material-symbols-outlined" style="font-size:14px">refresh</span> Neu erkennen
          </button>
        </div>

        <!-- Legend -->
        <div style="padding:9px 20px;border-bottom:1px solid #fde04733;background:#fffdf0;display:flex;gap:18px;flex-wrap:wrap">
          ${Object.values(STATUS_CFG).map(c => `
            <div style="display:flex;align-items:center;gap:5px;font-size:11px;color:${c.text}">
              <span style="width:8px;height:8px;border-radius:50%;background:${c.dot};flex-shrink:0;display:inline-block"></span>${c.label}
            </div>`).join('')}
        </div>

        <!-- Table -->
        <div style="overflow-x:auto">
          <table id="handlist-results-table" style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:#fffdf0">
                <th style="padding:9px 14px;width:36px">
                  <input type="checkbox" id="handlist-check-all"
                    onchange="document.querySelectorAll('#handlist-results-table input[data-idx]').forEach(cb=>cb.checked=this.checked)"
                    style="cursor:pointer;accent-color:#854d0e;width:15px;height:15px">
                </th>
                <th style="padding:9px 16px;text-align:left;font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em">Produkt</th>
                <th style="padding:9px 14px;text-align:center;font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em;white-space:nowrap">Menge</th>
                <th style="padding:9px 14px;text-align:left;font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em">Einheit</th>
                <th style="padding:9px 16px;text-align:center;font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em">Aktion</th>
              </tr>
            </thead>
            <tbody>`;

    HANDLIST_STATE.items.forEach((item, idx) => {
      const isApplied = HANDLIST_STATE.appliedIndices.has(idx);
      const sc = STATUS_CFG[item.status] || STATUS_CFG.new;
      const rowBg = isApplied ? '#f0fdf4' : sc.bg;
      html += `
              <tr style="border-bottom:1px solid #fde04722;background:${rowBg}">
                <td style="padding:11px 14px;text-align:center">
                  <input type="checkbox" data-idx="${idx}" style="cursor:pointer;accent-color:#854d0e;width:15px;height:15px" ${isApplied ? 'checked disabled' : ''}>
                </td>
                <td style="padding:11px 16px">
                  <div style="display:flex;align-items:flex-start;gap:8px">
                    <span style="width:9px;height:9px;border-radius:50%;background:${sc.dot};flex-shrink:0;margin-top:4px;display:inline-block"></span>
                    <div style="flex:1;min-width:0">
                      <div id="handlist-name-${idx}" style="font-size:14px;font-weight:600;color:#261816">${escHtml(item.name)}</div>
                      ${item.status === 'similar' && item.suggestion
                        ? `<div style="font-size:11px;color:#854d0e;margin-top:3px;display:flex;align-items:center;gap:4px">
                             <span class="material-symbols-outlined" style="font-size:12px">help</span>
                             Meinst du: <strong style="margin-left:2px">${escHtml(item.suggestion)}</strong>?
                           </div>`
                        : item.status === 'matched' && item.suggestion && item.suggestion !== item.name
                        ? `<div style="font-size:11px;color:#16a34a;margin-top:2px">→ ${escHtml(item.suggestion)}</div>`
                        : item.status === 'new'
                        ? `<div style="font-size:11px;color:#ea580c;margin-top:2px">Wird neu angelegt</div>`
                        : ''}
                    </div>
                    ${!isApplied ? `<button onclick="startEditHandlistItem(${idx})" title="Name bearbeiten"
                      style="padding:3px 4px;border:none;background:transparent;cursor:pointer;color:#8d6562;flex-shrink:0">
                      <span class="material-symbols-outlined" style="font-size:16px">edit</span>
                    </button>` : ''}
                  </div>
                </td>
                <td style="padding:11px 14px;text-align:center;font-size:14px;font-weight:700;color:#261816;white-space:nowrap">
                  ${item.menge != null ? item.menge : '—'}
                </td>
                <td style="padding:11px 14px;font-size:13px;color:#5a403c;white-space:nowrap">
                  ${escHtml(item.einheit || 'Stk')}
                </td>
                <td style="padding:11px 16px;text-align:center">
                  <button onclick="applyHandlistItem(${idx}, this)" ${isApplied ? 'disabled' : ''}
                    style="padding:7px 14px;border-radius:10px;border:1.5px solid ${isApplied ? '#c7c9f9' : sc.border};background:${isApplied ? '#dfe0ff' : sc.bg};color:${isApplied ? '#0d2ccc' : sc.text};font-size:12px;font-weight:600;font-family:inherit;cursor:${isApplied ? 'default' : 'pointer'};white-space:nowrap;display:inline-flex;align-items:center;gap:4px">
                    ${isApplied
                      ? '<span class="material-symbols-outlined" style="font-size:14px">check</span> Übernommen'
                      : '<span class="material-symbols-outlined" style="font-size:14px">add</span> Übernehmen'}
                  </button>
                </td>
              </tr>`;
    });

    html += `
            </tbody>
          </table>
        </div>

        <!-- Footer actions -->
        <div style="padding:14px 20px;border-top:1px solid #fde04744;display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end;background:#fffdf0">
          <button onclick="discardHandlist()"
            style="padding:10px 18px;border-radius:12px;border:1px solid #e3beb8;background:#fff;font-size:13px;color:#5a403c;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px">
            <span class="material-symbols-outlined" style="font-size:16px">delete</span> Verwerfen
          </button>
          <button onclick="applySelectedHandlistItems()"
            style="padding:10px 18px;border-radius:12px;border:1.5px solid #fde047;background:#fefce8;font-size:13px;font-weight:600;color:#854d0e;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px">
            <span class="material-symbols-outlined" style="font-size:16px">checklist</span> Auswahl übernehmen
          </button>
          <button onclick="applyAllHandlistItems()" ${allApplied ? 'disabled' : ''}
            style="padding:10px 20px;border-radius:12px;border:none;font-size:13px;font-weight:700;font-family:inherit;cursor:${allApplied ? 'default' : 'pointer'};display:flex;align-items:center;gap:6px;background:${allApplied ? '#e3beb8' : 'linear-gradient(135deg,#854d0e,#a16207)'};color:${allApplied ? '#5a403c' : '#fff'}">
            <span class="material-symbols-outlined" style="font-size:16px">playlist_add_check</span>
            ${allApplied ? 'Alle übernommen' : '✓ Alle übernehmen'}
          </button>
        </div>
      </div>`;
  }

  return html;
}

// ═══════════════════════════════════════════════════════════════
// PRICELIST — State
// ═══════════════════════════════════════════════════════════════

const PRICELIST_STATE = {
  rawData: null,       // Array<Array> — first row = headers
  headers: [],
  fileName: null,
  colName: null,       // column index for product name
  colPreis: null,      // column index for price
  colEinheit: null,    // column index for unit (optional)
  selectedShop: '',
  selectedShopName: '',
  importResult: null,  // { imported, newProducts, unmatched, unknownNames }
  importDate: null,
  error: null,
};

// ═══════════════════════════════════════════════════════════════
// PRICELIST — File Handling
// ═══════════════════════════════════════════════════════════════

function handlePricelistDrop(event) {
  const file = event.dataTransfer.files[0];
  if (file) handlePricelistFile(file);
}

function handlePricelistSelect(input) {
  const file = input.files[0];
  if (file) handlePricelistFile(file);
}

function handlePricelistFile(file) {
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
    PRICELIST_STATE.error = 'Bitte eine Excel (.xlsx, .xls) oder CSV (.csv) Datei hochladen.';
    renderUploadTab();
    return;
  }
  PRICELIST_STATE.error = null;
  PRICELIST_STATE.fileName = file.name;
  PRICELIST_STATE.rawData = null;
  PRICELIST_STATE.importResult = null;
  PRICELIST_STATE.colName = null;
  PRICELIST_STATE.colPreis = null;
  PRICELIST_STATE.colEinheit = null;

  const reader = new FileReader();
  reader.onload = e => {
    try {
      if (typeof XLSX === 'undefined') throw new Error('SheetJS nicht geladen. Bitte Seite neu laden.');
      const data = new Uint8Array(e.target.result);
      const wb = XLSX.read(data, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      if (!rows || rows.length < 2) {
        PRICELIST_STATE.error = 'Datei enthält keine Daten oder ist leer.';
        renderUploadTab();
        return;
      }
      const headerRow = rows[0].map(h => String(h ?? '').trim());
      PRICELIST_STATE.headers = headerRow;
      PRICELIST_STATE.rawData = rows;
      const det = autoDetectColumns(headerRow);
      PRICELIST_STATE.colName   = det.colName;
      PRICELIST_STATE.colPreis  = det.colPreis;
      PRICELIST_STATE.colEinheit = det.colEinheit;
    } catch (err) {
      PRICELIST_STATE.error = 'Datei konnte nicht gelesen werden: ' + (err.message || String(err));
    }
    renderUploadTab();
  };
  reader.onerror = () => { PRICELIST_STATE.error = 'Fehler beim Lesen der Datei.'; renderUploadTab(); };
  reader.readAsArrayBuffer(file);
}

function autoDetectColumns(headers) {
  const nameKw  = ['name','bezeichnung','artikel','produkt','description','item','ware','text','title'];
  const priceKw = ['preis','price','ek','netto','brutto','betrag','eur','€','cost','vk','einkauf'];
  const unitKw  = ['einheit','unit','mengeneinheit','me','vpe','gebinde'];
  let colName = null, colPreis = null, colEinheit = null;
  headers.forEach((h, i) => {
    const hl = h.toLowerCase();
    if (colName    === null && nameKw.some(k  => hl.includes(k)))  colName    = i;
    if (colPreis   === null && priceKw.some(k => hl.includes(k)))  colPreis   = i;
    if (colEinheit === null && unitKw.some(k  => hl.includes(k)))  colEinheit = i;
  });
  if (colName  === null) colName  = 0;
  if (colPreis === null) colPreis = Math.min(1, headers.length - 1);
  return { colName, colPreis, colEinheit };
}

function resetPricelist() {
  Object.assign(PRICELIST_STATE, {
    rawData: null, headers: [], fileName: null,
    colName: null, colPreis: null, colEinheit: null,
    selectedShop: '', selectedShopName: '',
    importResult: null, importDate: null, error: null,
  });
  renderUploadTab();
}

// ═══════════════════════════════════════════════════════════════
// PRICELIST — Product Name Matching
// ═══════════════════════════════════════════════════════════════

function matchProductByName(name) {
  const n = name.toLowerCase().trim();
  let p = PRODUCTS.find(p => p.name.toLowerCase() === n);
  if (p) return p;
  p = PRODUCTS.find(p => n.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(n));
  if (p) return p;
  const words = n.split(/[\s,\-\/]+/).filter(w => w.length > 3);
  for (const word of words) {
    p = PRODUCTS.find(pr => pr.name.toLowerCase().includes(word) || pr.id.includes(word));
    if (p) return p;
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// PRICELIST — Import
// ═══════════════════════════════════════════════════════════════

function importPrices() {
  if (!PRICELIST_STATE.rawData) return;

  // Read current DOM values before validation (user may not have triggered onchange)
  const nameEl    = document.getElementById('pl-col-name');
  const preisEl   = document.getElementById('pl-col-preis');
  const einheitEl = document.getElementById('pl-col-einheit');
  const shopEl    = document.getElementById('pl-shop');
  if (nameEl)    PRICELIST_STATE.colName    = nameEl.value    === '0' ? null : parseInt(nameEl.value)    - 1;
  if (preisEl)   PRICELIST_STATE.colPreis   = preisEl.value   === '0' ? null : parseInt(preisEl.value)   - 1;
  if (einheitEl) PRICELIST_STATE.colEinheit = einheitEl.value === '0' ? null : parseInt(einheitEl.value) - 1;
  if (shopEl)    PRICELIST_STATE.selectedShop = shopEl.value;

  if (PRICELIST_STATE.colName  === null) { PRICELIST_STATE.error = 'Bitte die Produktname-Spalte zuordnen.'; renderUploadTab(); return; }
  if (PRICELIST_STATE.colPreis === null) { PRICELIST_STATE.error = 'Bitte die Preis-Spalte zuordnen.';       renderUploadTab(); return; }
  if (!PRICELIST_STATE.selectedShop)    { PRICELIST_STATE.error = 'Bitte einen Händler auswählen.';          renderUploadTab(); return; }

  const shopId = PRICELIST_STATE.selectedShop;

  // Add shop to SHOPS if new (makes it visible in Geschäfte + Kombis tabs)
  if (!SHOPS.find(s => s.id === shopId)) {
    const extra = IMPORT_SHOPS_EXTRA.find(s => s.id === shopId);
    if (extra) SHOPS.push({ ...extra });
  }
  if (!PRICE_MAP[shopId]) PRICE_MAP[shopId] = {};

  const rows = PRICELIST_STATE.rawData.slice(1);
  let imported = 0, newProducts = 0;
  const unknownNames = [];

  for (const row of rows) {
    const rawName  = row[PRICELIST_STATE.colName];
    const rawPreis = row[PRICELIST_STATE.colPreis];
    const rawUnit  = PRICELIST_STATE.colEinheit !== null ? row[PRICELIST_STATE.colEinheit] : null;

    if (rawName == null || String(rawName).trim() === '') continue;
    const name = String(rawName).trim();
    const preis = parseFloat(String(rawPreis ?? '').replace(/[^\d,.-]/g, '').replace(',', '.'));
    if (!name || isNaN(preis) || preis <= 0) continue;

    const matched = matchProductByName(name);
    if (matched) {
      PRICE_MAP[shopId][matched.id] = preis;
      imported++;
    } else {
      // Create new product entry
      const existing = PRODUCTS.find(p => p.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        PRICE_MAP[shopId][existing.id] = preis;
        imported++;
      } else {
        const id = 'import-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 28) + '-' + (Date.now() % 10000);
        PRODUCTS.push({
          id, name,
          category: 'Sonstiges',
          unit: rawUnit ? String(rawUnit).trim() : 'Stk',
          currentStock: 0, minStock: 1, orderQuantity: 1,
        });
        stockLevels[id] = 0;
        PRICE_MAP[shopId][id] = preis;
        imported++;
        newProducts++;
        unknownNames.push(name);
      }
    }
  }

  const shopObj = allImportShops().find(s => s.id === shopId);
  PRICELIST_STATE.selectedShopName = shopObj ? shopObj.name : shopId;
  PRICELIST_STATE.importResult = { imported, newProducts, unmatched: unknownNames.length, unknownNames };
  PRICELIST_STATE.importDate = new Date().toISOString().slice(0, 10);
  PRICELIST_STATE.error = null;
  updateHeaderBadge();
  renderUploadTab();
}

// ═══════════════════════════════════════════════════════════════
// PRICELIST — Render Section
// ═══════════════════════════════════════════════════════════════

function renderPricelistSection() {
  const shops = allImportShops();
  let html = `
    <div style="margin:40px 0 32px;display:flex;align-items:center;gap:14px">
      <div style="flex:1;height:1px;background:#e3beb8"></div>
      <span style="font-size:11px;font-weight:700;color:#8d6562;text-transform:uppercase;letter-spacing:.1em;white-space:nowrap">oder</span>
      <div style="flex:1;height:1px;background:#e3beb8"></div>
    </div>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
      <div style="width:44px;height:44px;border-radius:14px;background:#e8f4fd;display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <span class="material-symbols-outlined" style="font-size:24px;color:#003DA5">table_chart</span>
      </div>
      <div>
        <h2 style="font-size:16px;font-weight:700;color:#261816;margin-bottom:2px">📊 Preisliste importieren</h2>
        <p style="font-size:12px;color:#5a403c">Excel oder CSV vom Großhändler direkt in die Preisdatenbank laden</p>
      </div>
    </div>`;

  if (PRICELIST_STATE.error) {
    html += `
      <div style="background:#ffdad6;border:1px solid #ba1a1a33;border-radius:14px;padding:14px 18px;margin-bottom:18px;display:flex;align-items:flex-start;gap:12px">
        <span class="material-symbols-outlined" style="font-size:20px;color:#ba1a1a;flex-shrink:0;margin-top:1px">error</span>
        <div>
          <p style="font-size:13px;font-weight:700;color:#93000a">Fehler</p>
          <p style="font-size:12px;color:#93000a;margin-top:3px">${escHtml(PRICELIST_STATE.error)}</p>
        </div>
      </div>`;
  }

  html += `<input id="pricelist-file-input" type="file" accept=".xlsx,.xls,.csv" style="display:none" onchange="handlePricelistSelect(this)">`;

  if (!PRICELIST_STATE.rawData) {
    html += `
      <div id="pricelist-drop-zone"
        style="border:2px dashed #bee3f8;border-radius:18px;padding:44px 24px;text-align:center;cursor:pointer;background:#f0f7ff;transition:all .2s"
        onclick="document.getElementById('pricelist-file-input').click()"
        ondragover="event.preventDefault();this.style.borderColor='#003DA5';this.style.background='#e8f4fd'"
        ondragleave="this.style.borderColor='#bee3f8';this.style.background='#f0f7ff'"
        ondrop="event.preventDefault();this.style.borderColor='#bee3f8';this.style.background='#f0f7ff';handlePricelistDrop(event)">
        <div style="width:72px;height:72px;border-radius:50%;background:#e8f4fd;display:flex;align-items:center;justify-content:center;margin:0 auto 18px;border:2px solid #bee3f8">
          <span class="material-symbols-outlined" style="font-size:34px;color:#003DA5">upload_file</span>
        </div>
        <p style="font-size:15px;font-weight:700;color:#261816;margin-bottom:8px">Excel oder CSV hochladen</p>
        <p style="font-size:13px;color:#5a403c;margin-bottom:18px">Preisliste vom Großhändler hierher ziehen oder klicken</p>
        <div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap">
          <span style="background:#fff;border:1px solid #bee3f8;border-radius:20px;padding:5px 14px;font-size:12px;color:#003DA5;display:flex;align-items:center;gap:5px">
            <span class="material-symbols-outlined" style="font-size:13px">table_chart</span> .xlsx / .xls
          </span>
          <span style="background:#fff;border:1px solid #bee3f8;border-radius:20px;padding:5px 14px;font-size:12px;color:#003DA5;display:flex;align-items:center;gap:5px">
            <span class="material-symbols-outlined" style="font-size:13px">description</span> .csv
          </span>
        </div>
      </div>`;

  } else if (PRICELIST_STATE.importResult) {
    const r = PRICELIST_STATE.importResult;
    html += `
      <div style="background:#c0eda6;border:1px solid #386a2033;border-radius:16px;padding:18px 20px;margin-bottom:16px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
          <span class="material-symbols-outlined filled" style="font-size:26px;color:#386a20">check_circle</span>
          <span style="font-size:16px;font-weight:700;color:#0c2000">Import erfolgreich!</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;margin-bottom:14px">
          <div style="background:#fff;border-radius:12px;padding:12px 14px">
            <div style="font-size:26px;font-weight:800;color:#386a20">${r.imported}</div>
            <div style="font-size:11px;color:#5a403c;margin-top:2px">Preise importiert</div>
          </div>
          <div style="background:#fff;border-radius:12px;padding:12px 14px">
            <div style="font-size:26px;font-weight:800;color:${r.newProducts > 0 ? '#610000' : '#386a20'}">${r.newProducts}</div>
            <div style="font-size:11px;color:#5a403c;margin-top:2px">Neue Produkte</div>
          </div>
          <div style="background:#fff;border-radius:12px;padding:12px 14px">
            <div style="font-size:26px;font-weight:800;color:#5a403c">${r.unmatched}</div>
            <div style="font-size:11px;color:#5a403c;margin-top:2px">Nicht zugeordnet</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#0c2000;flex-wrap:wrap">
          <span class="material-symbols-outlined" style="font-size:15px">schedule</span>
          Zuletzt importiert:&nbsp;<strong>${PRICELIST_STATE.importDate ? fmtDate(PRICELIST_STATE.importDate) : 'heute'}</strong>
          &nbsp;·&nbsp; Händler:&nbsp;<strong>${escHtml(PRICELIST_STATE.selectedShopName)}</strong>
          &nbsp;·&nbsp;
          <span style="color:#386a20">Preise ab sofort im Kombis Tab sichtbar ✓</span>
        </div>
      </div>`;

    if (r.unknownNames && r.unknownNames.length > 0) {
      const shown = r.unknownNames.slice(0, 20);
      html += `
        <div style="background:#fff;border:1px solid #e3beb8;border-radius:14px;padding:14px 18px;margin-bottom:16px">
          <p style="font-size:13px;font-weight:600;color:#261816;margin-bottom:10px;display:flex;align-items:center;gap:6px">
            <span class="material-symbols-outlined" style="font-size:16px;color:#5a403c">help_outline</span>
            Als neue Produkte angelegt (${r.unknownNames.length}):
          </p>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            ${shown.map(n => `<span style="background:#f8dcd8;border:1px solid #e3beb8;border-radius:8px;padding:3px 10px;font-size:12px;color:#5a403c">${escHtml(n)}</span>`).join('')}
            ${r.unknownNames.length > 20 ? `<span style="font-size:12px;color:#8d6562;align-self:center">+${r.unknownNames.length - 20} weitere</span>` : ''}
          </div>
        </div>`;
    }

    html += `
      <button onclick="resetPricelist()"
        style="padding:10px 20px;border-radius:12px;border:1px solid #bee3f8;background:#fff;font-size:13px;color:#003DA5;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:6px">
        <span class="material-symbols-outlined" style="font-size:16px">upload_file</span> Neue Datei importieren
      </button>`;

  } else {
    // ── Column mapping + shop selection ──
    const headers   = PRICELIST_STATE.headers;
    const preview   = PRICELIST_STATE.rawData.slice(1, 6);
    const dataCount = PRICELIST_STATE.rawData.length - 1;
    const opts      = ['(nicht verwenden)', ...headers.map((h, i) => `Sp. ${i+1}${h ? ': '+h : ''}`)];
    const nameIdx   = PRICELIST_STATE.colName    !== null ? PRICELIST_STATE.colName    + 1 : 0;
    const preisIdx  = PRICELIST_STATE.colPreis   !== null ? PRICELIST_STATE.colPreis   + 1 : 0;
    const unitIdx   = PRICELIST_STATE.colEinheit !== null ? PRICELIST_STATE.colEinheit + 1 : 0;

    html += `
      <div style="background:#fff;border:1px solid #bee3f866;border-radius:18px;overflow:hidden;box-shadow:0 2px 8px rgba(0,61,165,.08)">

        <!-- File bar -->
        <div style="padding:12px 18px;border-bottom:1px solid #bee3f844;display:flex;align-items:center;justify-content:space-between;background:#e8f4fd">
          <div style="display:flex;align-items:center;gap:10px">
            <span class="material-symbols-outlined" style="font-size:18px;color:#003DA5">table_chart</span>
            <span style="font-size:13px;font-weight:600;color:#261816;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(PRICELIST_STATE.fileName || '')}</span>
            <span style="font-size:11px;color:#003DA5;background:rgba(0,61,165,.1);padding:2px 9px;border-radius:10px;white-space:nowrap">${dataCount} Zeilen</span>
          </div>
          <button onclick="resetPricelist()"
            style="padding:5px 12px;border-radius:10px;border:1px solid #bee3f8;background:#fff;font-size:12px;color:#003DA5;cursor:pointer;display:flex;align-items:center;gap:4px;font-family:inherit">
            <span class="material-symbols-outlined" style="font-size:14px">close</span> Entfernen
          </button>
        </div>

        <!-- Preview table -->
        <div style="padding:16px 18px;border-bottom:1px solid #e3beb844">
          <p style="font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px">
            Vorschau — erste ${Math.min(5, preview.length)} Datenzeilen
          </p>
          <div style="overflow-x:auto;border-radius:10px;border:1px solid #bee3f8">
            <table style="width:100%;border-collapse:collapse;min-width:300px">
              <thead>
                <tr style="background:#e8f4fd">
                  ${headers.map(h => `<th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:#003DA5;white-space:nowrap;border-right:1px solid #bee3f844;max-width:150px;overflow:hidden;text-overflow:ellipsis">${escHtml(String(h||''))}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${preview.map((row, ri) => `
                  <tr style="border-top:1px solid #e3beb833;background:${ri%2===0?'#fff':'#f8fbff'}">
                    ${headers.map((_,ci) => `<td style="padding:7px 12px;font-size:12px;color:#261816;border-right:1px solid #e3beb822;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(String(row[ci]??''))}</td>`).join('')}
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Column mapping -->
        <div style="padding:16px 18px;border-bottom:1px solid #e3beb844;background:#f8fbff">
          <p style="font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em;margin-bottom:14px">Spalten zuordnen</p>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(185px,1fr));gap:12px">
            <div>
              <label style="font-size:12px;font-weight:600;color:#261816;display:block;margin-bottom:5px">
                Produktname <span style="color:#ba1a1a">*</span>
              </label>
              <select id="pl-col-name" onchange="PRICELIST_STATE.colName=this.value==='0'?null:parseInt(this.value)-1"
                style="width:100%;padding:9px 12px;border:1.5px solid #bee3f8;border-radius:10px;font-size:13px;font-family:inherit;background:#fff;color:#261816;cursor:pointer">
                ${opts.map((o,i) => `<option value="${i}" ${i===nameIdx?'selected':''}>${escHtml(o)}</option>`).join('')}
              </select>
            </div>
            <div>
              <label style="font-size:12px;font-weight:600;color:#261816;display:block;margin-bottom:5px">
                Preis (€) <span style="color:#ba1a1a">*</span>
              </label>
              <select id="pl-col-preis" onchange="PRICELIST_STATE.colPreis=this.value==='0'?null:parseInt(this.value)-1"
                style="width:100%;padding:9px 12px;border:1.5px solid #bee3f8;border-radius:10px;font-size:13px;font-family:inherit;background:#fff;color:#261816;cursor:pointer">
                ${opts.map((o,i) => `<option value="${i}" ${i===preisIdx?'selected':''}>${escHtml(o)}</option>`).join('')}
              </select>
            </div>
            <div>
              <label style="font-size:12px;font-weight:600;color:#261816;display:block;margin-bottom:5px">Einheit (optional)</label>
              <select id="pl-col-einheit" onchange="PRICELIST_STATE.colEinheit=this.value==='0'?null:parseInt(this.value)-1"
                style="width:100%;padding:9px 12px;border:1.5px solid #bee3f8;border-radius:10px;font-size:13px;font-family:inherit;background:#fff;color:#261816;cursor:pointer">
                ${opts.map((o,i) => `<option value="${i}" ${i===unitIdx?'selected':''}>${escHtml(o)}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>

        <!-- Shop selection -->
        <div style="padding:16px 18px;border-bottom:1px solid #e3beb844">
          <p style="font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px">
            Händler <span style="color:#ba1a1a">*</span>
          </p>
          <select id="pl-shop" onchange="PRICELIST_STATE.selectedShop=this.value"
            style="width:100%;max-width:340px;padding:11px 14px;border:1.5px solid #e3beb8;border-radius:12px;font-size:14px;font-family:inherit;background:#fff;color:#261816;cursor:pointer">
            <option value="">— Händler auswählen —</option>
            ${shops.map(s => `<option value="${s.id}" ${PRICELIST_STATE.selectedShop===s.id?'selected':''}>${escHtml(s.name)}</option>`).join('')}
          </select>
        </div>

        <!-- Import button -->
        <div style="padding:18px">
          <button onclick="importPrices()"
            style="width:100%;padding:16px;border-radius:14px;border:none;font-size:15px;font-weight:700;font-family:inherit;color:#fff;background:linear-gradient(135deg,#003DA5,#0050AA);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 4px 12px rgba(0,61,165,.3)">
            <span class="material-symbols-outlined" style="font-size:22px">download_done</span>
            Preise importieren
          </button>
        </div>
      </div>`;
  }

  return html;
}
