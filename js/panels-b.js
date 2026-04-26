function renderBizReport() {
  const { y, m } = bizCurrentMonth();
  const settings = bizGetSettings();
  const kassa = bizGetKassa();
  const fix = bizGetFixkosten();
  const personal = bizGetPersonal();

  const monthStr = y+'-'+String(m).padStart(2,'0');
  const monthKassa = kassa.filter(e=>e.date.startsWith(monthStr)).sort((a,b)=>a.date.localeCompare(b.date));
  const fixSum = Object.values(fix).reduce((s,v)=>s+(+v||0),0);
  const personalMonat = personal.reduce((s,p)=>s+(+p.stunden||0)*(+p.lohn||0)*4.33,0);
  const einkaufMonth = bizGetEinkaufThisMonth();

  // Kassenbuch-Daten für diesen Monat einbeziehen
  const kbAll = (typeof kbGet === 'function') ? kbGet() : [];
  const kbMonth = kbAll.filter(e=>(e.datum||'').startsWith(monthStr));
  const kbEin = kbMonth.filter(e=>e.typ==='einnahme');
  const kbAus = kbMonth.filter(e=>e.typ==='ausgabe');
  const kbEinTotal = kbEin.reduce((s,e)=>s+parseFloat(e.brutto||0),0);
  const kbAusTotal = kbAus.reduce((s,e)=>s+parseFloat(e.brutto||0),0);

  // Personalkosten: nur gespeicherte Biz-Personal-Daten ODER Hinweis
  const maDb = JSON.parse(localStorage.getItem('pizzeria_mitarbeiter')||'[]').filter(m=>parseFloat(m.lohn)>0);
  const personalQuelle = personal.length > 0 ? 'biz' : (maDb.length > 0 ? 'db-verfuegbar' : 'leer');

  let totalBrutto=0, totalMwst10=0, totalMwst20=0, totalNetto=0;
  const rows = monthKassa.map(e => {
    const sa = e.speiseAnteil??settings.speiseAnteil;
    const speise = (e.gesamt||0)*(sa/100);
    const getraenk = (e.gesamt||0)*((100-sa)/100);
    const m10 = speise*(10/110), m20 = getraenk*(20/120);
    const netto = (e.gesamt||0)-m10-m20;
    totalBrutto+=e.gesamt||0; totalMwst10+=m10; totalMwst20+=m20; totalNetto+=netto;
    return { ...e, m10, m20, netto };
  });

  // Kassenbuch-Einnahmen dazurechnen (vermeidet Doppelzählung durch Quellkennzeichnung)
  totalBrutto += kbEinTotal;
  const kbEinNetto = kbEin.reduce((s,e)=>s+parseFloat(e.netto||0),0);
  const kbEinMwst10 = kbEin.filter(e=>e.mwst_satz==10).reduce((s,e)=>s+parseFloat(e.mwst_betrag||0),0);
  const kbEinMwst20 = kbEin.filter(e=>e.mwst_satz==20).reduce((s,e)=>s+parseFloat(e.mwst_betrag||0),0);
  totalNetto += kbEinNetto; totalMwst10 += kbEinMwst10; totalMwst20 += kbEinMwst20;

  const gewinn = totalNetto - einkaufMonth - kbAusTotal - personalMonat - fixSum;

  // Wochenweise summieren
  const weekSums = {};
  rows.forEach(r => {
    const d=new Date(r.date); const w=Math.ceil(d.getDate()/7);
    if (!weekSums[w]) weekSums[w]={brutto:0,m10:0,m20:0,netto:0};
    weekSums[w].brutto+=r.netto+r.m10+r.m20;
    weekSums[w].m10+=r.m10; weekSums[w].m20+=r.m20; weekSums[w].netto+=r.netto;
  });

  return `
<div id="biz-report-printable">
<style>
  @media print {
    body > *:not(#panel-business) { display:none!important; }
    header,nav { display:none!important; }
    #panel-business { display:block!important; padding:0; }
    .biz-section:not(#biz-report) { display:none!important; }
    .no-print { display:none!important; }
    #biz-report { padding:0; }
    table { page-break-inside:auto; }
    tr { page-break-inside:avoid; }
  }
</style>

<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px">
  <h2 style="font-family:'Plus Jakarta Sans',sans-serif;font-size:22px;font-weight:800;color:#261816;display:flex;align-items:center;gap:8px">
    <span class="material-symbols-outlined" style="color:#8B0000">summarize</span>Monatsbericht
  </h2>
  <div style="display:flex;gap:8px;flex-wrap:wrap" class="no-print">
    <button onclick="bizDownloadPDF()"
      style="padding:10px 18px;border-radius:10px;border:none;background:linear-gradient(135deg,#610000,#8b0000);color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px">
      <span class="material-symbols-outlined" style="font-size:16px">picture_as_pdf</span> PDF Download
    </button>
    <button onclick="window.print()"
      style="padding:10px 18px;border-radius:10px;border:1.5px solid #8B0000;background:#fff0ee;color:#8B0000;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px">
      <span class="material-symbols-outlined" style="font-size:16px">print</span> Drucken
    </button>
    <button onclick="bizCopyReport()"
      style="padding:10px 18px;border-radius:10px;border:1.5px solid #8B0000;background:#fff0ee;color:#8B0000;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px">
      <span class="material-symbols-outlined" style="font-size:16px">content_copy</span> Als Text kopieren
    </button>
    <button onclick="bizExportData()"
      style="padding:10px 18px;border-radius:10px;border:1.5px solid #e3beb8;background:#fff;color:#5a403c;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px">
      <span class="material-symbols-outlined" style="font-size:16px">download</span> Daten exportieren
    </button>
  </div>
</div>

<!-- Kopfzeile -->
<div style="background:#fff;border:1.5px solid #e3beb8;border-radius:14px;padding:20px 24px;margin-bottom:20px">
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
    <div>
      <div style="font-size:20px;font-weight:800;color:#8B0000;font-family:'Plus Jakarta Sans',sans-serif">Ali Shama KG</div>
      <div style="font-size:14px;color:#5a403c">Pizzeria Wien</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:16px;font-weight:700;color:#261816">${bizMonthName(m)} ${y}</div>
      <div style="font-size:12px;color:#5a403c">UID: ${settings.uid}</div>
    </div>
  </div>
</div>

<!-- KPI Übersicht -->
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px">
  <div style="background:#fff0ee;border:1px solid #e3beb8;border-radius:12px;padding:14px;text-align:center">
    <div style="font-size:10px;color:#7a6460;text-transform:uppercase;letter-spacing:.05em;font-weight:600;margin-bottom:4px">Umsatz Brutto</div>
    <div style="font-size:20px;font-weight:800;color:#8B0000">${bizEur(totalBrutto)}</div>
  </div>
  <div style="background:#fff8f6;border:1px solid #e3beb8;border-radius:12px;padding:14px;text-align:center">
    <div style="font-size:10px;color:#7a6460;text-transform:uppercase;letter-spacing:.05em;font-weight:600;margin-bottom:4px">Gesamtkosten</div>
    <div style="font-size:20px;font-weight:800;color:#5a403c">${bizEur(einkaufMonth+personalMonat+fixSum)}</div>
  </div>
  <div style="background:${gewinn>=0?'#e8f5e9':'#ffdad6'};border:1px solid ${gewinn>=0?'#a5d6a7':'#f5c2c2'};border-radius:12px;padding:14px;text-align:center">
    <div style="font-size:10px;color:#7a6460;text-transform:uppercase;letter-spacing:.05em;font-weight:600;margin-bottom:4px">Gewinn</div>
    <div style="font-size:20px;font-weight:800;color:${gewinn>=0?'#2e7d32':'#ba1a1a'}">${bizEur(gewinn)}</div>
  </div>
  <div style="background:${gewinn>=0?'#e8f5e9':'#ffdad6'};border:1px solid ${gewinn>=0?'#a5d6a7':'#f5c2c2'};border-radius:12px;padding:14px;text-align:center">
    <div style="font-size:10px;color:#7a6460;text-transform:uppercase;letter-spacing:.05em;font-weight:600;margin-bottom:4px">Marge</div>
    <div style="font-size:20px;font-weight:800;color:${gewinn>=0?'#2e7d32':'#ba1a1a'}">${totalBrutto>0?Math.round((gewinn/totalBrutto)*100):0}%</div>
  </div>
</div>

<!-- Einnahmen-Tabelle -->
<div style="background:#fff;border:1.5px solid #e3beb8;border-radius:14px;overflow:hidden;margin-bottom:20px">
  <div style="padding:14px 20px;background:#fff0ee;border-bottom:1px solid #e3beb8;font-weight:700;font-size:14px;color:#8B0000">
    EINNAHMEN — ${bizMonthName(m)} ${y}
  </div>
  <div style="overflow-x:auto">
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead><tr style="background:#fff8f6">
        <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e3beb8;color:#5a403c">Datum</th>
        <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e3beb8;color:#5a403c">Tag</th>
        <th style="padding:8px 12px;text-align:right;border-bottom:1px solid #e3beb8;color:#5a403c">Brutto</th>
        <th style="padding:8px 12px;text-align:right;border-bottom:1px solid #e3beb8;color:#5a403c">Netto</th>
        <th style="padding:8px 12px;text-align:right;border-bottom:1px solid #e3beb8;color:#5a403c">MwSt 10%</th>
        <th style="padding:8px 12px;text-align:right;border-bottom:1px solid #e3beb8;color:#5a403c">MwSt 20%</th>
      </tr></thead>
      <tbody>
        ${(rows.length===0 && kbEin.length===0) ? '<tr><td colspan="6" style="padding:20px;text-align:center;color:#8d6562">Keine Einträge — bitte im Kassabuch-Bereich Einnahmen erfassen</td></tr>' : ''}
        ${rows.map((r,i)=>{
            const showWeek = i===0 || Math.ceil(new Date(rows[i-1].date).getDate()/7) !== Math.ceil(new Date(r.date).getDate()/7);
            const wn = Math.ceil(new Date(r.date).getDate()/7);
            let out = '';
            if (showWeek && i>0) out += `<tr style="background:#fff8f6"><td colspan="2" style="padding:6px 12px;font-size:11px;font-weight:700;color:#8B0000">Woche ${wn-1} Summe</td><td style="padding:6px 12px;text-align:right;font-weight:700;font-size:11px">${bizEur(weekSums[wn-1]?.brutto||0)}</td><td style="padding:6px 12px;text-align:right;font-weight:700;font-size:11px">${bizEur(weekSums[wn-1]?.netto||0)}</td><td style="padding:6px 12px;text-align:right;font-weight:700;font-size:11px">${bizEur(weekSums[wn-1]?.m10||0)}</td><td style="padding:6px 12px;text-align:right;font-weight:700;font-size:11px">${bizEur(weekSums[wn-1]?.m20||0)}</td></tr>`;
            out += `<tr style="background:${i%2===0?'#fff':'#fffbfa'}">
              <td style="padding:7px 12px;color:#261816">${r.date.split('-').reverse().join('.')}</td>
              <td style="padding:7px 12px;color:#5a403c">${bizDayName(r.date)} <span style="font-size:10px;color:#8d6562">(Kassabuch)</span></td>
              <td style="padding:7px 12px;text-align:right;font-weight:600">${bizEur(r.gesamt||0)}</td>
              <td style="padding:7px 12px;text-align:right">${bizEur(r.netto)}</td>
              <td style="padding:7px 12px;text-align:right">${bizEur(r.m10)}</td>
              <td style="padding:7px 12px;text-align:right">${bizEur(r.m20)}</td>
            </tr>`;
            return out;
          }).join('')}
        ${kbEin.map((e,i)=>`<tr style="background:${(rows.length+i)%2===0?'#f0fff0':'#f7fff7'}">
            <td style="padding:7px 12px;color:#261816">${(e.datum||'').slice(0,10).split('-').reverse().join('.')}</td>
            <td style="padding:7px 12px;color:#1b5e20">${_esc(e.beschreibung||'')} <span style="font-size:10px;background:#e8f5e9;padding:1px 5px;border-radius:4px">Kassenbuch</span></td>
            <td style="padding:7px 12px;text-align:right;font-weight:600">${bizEur(parseFloat(e.brutto||0))}</td>
            <td style="padding:7px 12px;text-align:right">${bizEur(parseFloat(e.netto||0))}</td>
            <td style="padding:7px 12px;text-align:right">${bizEur(e.mwst_satz==10?parseFloat(e.mwst_betrag||0):0)}</td>
            <td style="padding:7px 12px;text-align:right">${bizEur(e.mwst_satz==20?parseFloat(e.mwst_betrag||0):0)}</td>
          </tr>`).join('')}
        <tr style="background:#fff0ee;font-weight:700">
          <td colspan="2" style="padding:10px 12px;color:#8B0000">GESAMT</td>
          <td style="padding:10px 12px;text-align:right;color:#8B0000">${bizEur(totalBrutto)}</td>
          <td style="padding:10px 12px;text-align:right;color:#8B0000">${bizEur(totalNetto)}</td>
          <td style="padding:10px 12px;text-align:right;color:#8B0000">${bizEur(totalMwst10)}</td>
          <td style="padding:10px 12px;text-align:right;color:#8B0000">${bizEur(totalMwst20)}</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

<!-- Ausgaben-Tabelle -->
<div style="background:#fff;border:1.5px solid #e3beb8;border-radius:14px;overflow:hidden;margin-bottom:20px">
  <div style="padding:14px 20px;background:#fff8f6;border-bottom:1px solid #e3beb8;font-weight:700;font-size:14px;color:#261816">
    AUSGABEN — ${bizMonthName(m)} ${y}
  </div>
  <table style="width:100%;border-collapse:collapse;font-size:13px">
    <tbody>
      <tr style="border-bottom:1px solid #e3beb8">
        <td style="padding:10px 16px;color:#5a403c">🛒 Wareneinkauf (Einkaufsliste)</td>
        <td style="padding:10px 16px;text-align:right;font-weight:600">${bizEur(einkaufMonth)}</td>
      </tr>
      ${kbAus.length > 0 ? kbAus.map(e=>`<tr style="border-bottom:1px solid #e3beb8">
        <td style="padding:8px 16px;color:#5a403c;font-size:12px">💸 ${_esc(e.beschreibung||'Ausgabe')} <span style="font-size:10px;color:#8d6562">(Kassenbuch ${(e.datum||'').slice(0,10).split('-').reverse().slice(0,2).join('.')})</span></td>
        <td style="padding:8px 16px;text-align:right;font-weight:600;font-size:12px">${bizEur(parseFloat(e.brutto||0))}</td>
      </tr>`).join('') : ''}
      <tr style="border-bottom:1px solid #e3beb8">
        <td style="padding:10px 16px;color:#5a403c">
          👥 Personalkosten
          ${personalQuelle==='db-verfuegbar' ? `<span style="font-size:10px;background:#fff3e0;color:#e65100;padding:2px 7px;border-radius:4px;margin-left:6px;cursor:pointer" onclick="showBizSection('biz-kosten')">⚠️ ${maDb.length} MA in DB — „Aus DB laden" klicken</span>` : `<span style="font-size:10px;color:#8d6562">(${personal.length} MA)</span>`}
        </td>
        <td style="padding:10px 16px;text-align:right;font-weight:600">${bizEur(personalMonat)}</td>
      </tr>
      <tr style="border-bottom:1px solid #e3beb8">
        <td style="padding:10px 16px;color:#5a403c">🏠 Fixkosten (Miete, Strom, etc.)</td>
        <td style="padding:10px 16px;text-align:right;font-weight:600">${bizEur(fixSum)}</td>
      </tr>
      <tr style="border-bottom:1px solid #e3beb8">
        <td style="padding:10px 16px;color:#5a403c">📄 Lieferanten-Rechnungen (E-Mail) <span id="biz-rechnung-info" style="font-size:10px;color:#8d6562"></span></td>
        <td style="padding:10px 16px;text-align:right;font-weight:600" id="biz-rechnung-total">—</td>
      </tr>
      <tr style="background:#fff0ee;font-weight:700">
        <td style="padding:10px 16px;color:#8B0000">GESAMT AUSGABEN</td>
        <td style="padding:10px 16px;text-align:right;color:#8B0000" id="biz-gesamt-aus">${bizEur(einkaufMonth+kbAusTotal+personalMonat+fixSum)}</td>
      </tr>
    </tbody>
  </table>
</div>

<!-- Zusammenfassung -->
<div style="background:#fff;border:2px solid #8B0000;border-radius:14px;padding:24px">
  <div style="font-weight:800;font-size:16px;color:#8B0000;margin-bottom:16px">ZUSAMMENFASSUNG</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px;margin-bottom:16px">
    <div style="padding:10px;background:#fff8f6;border-radius:8px">
      <div style="color:#5a403c">Umsatz Netto gesamt</div><div style="font-weight:700;font-size:16px">${bizEur(totalNetto)}</div>
    </div>
    <div style="padding:10px;background:#fff8f6;border-radius:8px">
      <div style="color:#5a403c">Umsatz Brutto gesamt</div><div style="font-weight:700;font-size:16px">${bizEur(totalBrutto)}</div>
    </div>
    <div style="padding:10px;background:#fff0ee;border-radius:8px">
      <div style="color:#5a403c">MwSt 10% (ans Finanzamt)</div><div style="font-weight:700;font-size:16px;color:#c8860a">${bizEur(totalMwst10)}</div>
    </div>
    <div style="padding:10px;background:#fff0ee;border-radius:8px">
      <div style="color:#5a403c">MwSt 20% (ans Finanzamt)</div><div style="font-weight:700;font-size:16px;color:#c8860a">${bizEur(totalMwst20)}</div>
    </div>
    <div style="padding:10px;background:#fff8f6;border-radius:8px">
      <div style="color:#5a403c">Gesamtkosten</div><div style="font-weight:700;font-size:16px" id="biz-zusammenfassung-kosten">${bizEur(einkaufMonth+kbAusTotal+personalMonat+fixSum)}</div>
    </div>
  </div>
  <div style="background:${gewinn>=0?'#e8f5e9':'#ffdad6'};border-radius:10px;padding:16px;display:flex;justify-content:space-between;align-items:center">
    <div>
      <div style="font-size:13px;color:${gewinn>=0?'#1b5e20':'#93000a'};font-weight:600">GEWINN VOR STEUER</div>
      <div style="font-size:32px;font-weight:800;color:${gewinn>=0?'#2e7d32':'#ba1a1a'}">${bizEur(gewinn)}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:13px;color:#5a403c">Gewinnmarge</div>
      <div style="font-size:24px;font-weight:800;color:${gewinn>=0?'#2e7d32':'#ba1a1a'}">${totalBrutto>0?Math.round((gewinn/totalBrutto)*100):0}%</div>
    </div>
  </div>
</div>
</div>`;
}

function bizCopyReport() {
  const { y, m } = bizCurrentMonth();
  const kassa = bizGetKassa();
  const fix = bizGetFixkosten();
  const personal = bizGetPersonal();
  const fixSum = Object.values(fix).reduce((s,v)=>s+(+v||0),0);
  const personalMonat = personal.reduce((s,p)=>s+(+p.stunden||0)*(+p.lohn||0)*4.33,0);
  const einkaufMonth = bizGetEinkaufThisMonth();
  const monthStr = y+'-'+String(m).padStart(2,'0');
  const monthKassa = kassa.filter(e=>e.date.startsWith(monthStr));
  const umsatz = monthKassa.reduce((s,e)=>s+(e.gesamt||0),0);
  const settings = bizGetSettings();
  const gewinn = umsatz - fixSum - personalMonat - einkaufMonth;

  const text = `Ali Shama KG Pizzeria Wien
Monatsbericht ${bizMonthName(m)} ${y}
UID: ${settings.uid}

EINNAHMEN:
Gesamtumsatz Brutto: ${bizEur(umsatz)}

AUSGABEN:
Wareneinkauf: ${bizEur(einkaufMonth)}
Personal: ${bizEur(personalMonat)}
Fixkosten: ${bizEur(fixSum)}
Gesamt Ausgaben: ${bizEur(einkaufMonth+personalMonat+fixSum)}

GEWINN VOR STEUER: ${bizEur(gewinn)}`;

  navigator.clipboard?.writeText(text).then(() => bizShowToast('✅ Bericht in Zwischenablage kopiert!'))
    .catch(() => { const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); bizShowToast('✅ Kopiert!'); });
}

function bizDownloadPDF() {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    if (typeof bizShowToast === 'function') bizShowToast('PDF-Modul nicht geladen');
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const { y, m } = bizCurrentMonth();
  const kassa = bizGetKassa();
  const fix = bizGetFixkosten();
  const personal = bizGetPersonal();
  const fixSum = Object.values(fix).reduce((s,v)=>s+(+v||0),0);
  const personalMonat = personal.reduce((s,p)=>s+(+p.stunden||0)*(+p.lohn||0)*4.33,0);
  const einkaufMonth = bizGetEinkaufThisMonth();
  const monthStr = y+'-'+String(m).padStart(2,'0');
  const monthKassa = kassa.filter(e => (e.date || '').startsWith(monthStr));
  const totalBrutto = monthKassa.reduce((s,e)=>s+(e.gesamt||0),0);
  const totalNetto = monthKassa.reduce((s,e)=>s+(e.netto||0),0);
  const totalMwst10 = monthKassa.reduce((s,e)=>s+(e.m10||0),0);
  const totalMwst20 = monthKassa.reduce((s,e)=>s+(e.m20||0),0);
  const gesamtKosten = einkaufMonth+personalMonat+fixSum;
  const gewinn = totalNetto - gesamtKosten;
  const settings = bizGetSettings();
  const monate = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  const dayNames = ['So','Mo','Di','Mi','Do','Fr','Sa'];

  let yPos = 20;
  const pageW = 210;
  const margin = 20;
  const colW = pageW - margin*2;

  function ensureSpace(nextRowsHeight) {
    if (yPos + nextRowsHeight > 276) {
      doc.addPage();
      yPos = 20;
    }
  }

  // Header-Balken (dunkelrot)
  doc.setFillColor(139, 0, 0);
  doc.rect(0, 0, pageW, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Pizzeria San Carino', margin, 12);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Ali Shama KG · Monatsbericht ' + monate[m-1] + ' ' + y, margin, 20);
  doc.setFontSize(9);
  doc.text('UID: ' + (settings.uid || '—'), pageW - margin, 20, { align: 'right' });

  yPos = 38;

  // KPI Karten (4 Kästchen nebeneinander)
  const kpiW = (colW - 9) / 4;
  const kpis = [
    { label: 'Umsatz Brutto', value: bizEur(totalBrutto), color: [97,0,0] },
    { label: 'Gesamtkosten', value: bizEur(gesamtKosten), color: [90,64,60] },
    { label: 'Gewinn', value: bizEur(gewinn), color: gewinn>=0?[27,94,32]:[186,26,26] },
    { label: 'Marge', value: (totalBrutto>0?Math.round((gewinn/totalBrutto)*100):0)+'%', color: gewinn>=0?[27,94,32]:[186,26,26] },
  ];
  kpis.forEach((k, i) => {
    const x = margin + i*(kpiW+3);
    doc.setFillColor(250, 245, 244);
    doc.roundedRect(x, yPos, kpiW, 22, 2, 2, 'F');
    doc.setTextColor(...k.color);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(k.value, x + kpiW/2, yPos + 11, { align: 'center' });
    doc.setTextColor(90, 64, 60);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(k.label, x + kpiW/2, yPos + 17, { align: 'center' });
  });
  yPos += 28;

  function sectionHeader(title) {
    ensureSpace(12);
    doc.setFillColor(255, 240, 238);
    doc.rect(margin, yPos, colW, 7, 'F');
    doc.setTextColor(139, 0, 0);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin+3, yPos+5);
    yPos += 10;
  }

  function tableRow(cols, widths, bg, bold) {
    ensureSpace(8);
    if (bg) {
      doc.setFillColor(...bg);
      doc.rect(margin, yPos-4, colW, 7, 'F');
    }
    doc.setTextColor(38, 24, 22);
    doc.setFontSize(8);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    let x = margin;
    cols.forEach((c, i) => {
      const align = i === 0 ? 'left' : 'right';
      const tx = align === 'right' ? x + widths[i] - 2 : x + 2;
      doc.text(String(c), tx, yPos, { align });
      x += widths[i];
    });
    yPos += 7;
  }

  // Einnahmen
  sectionHeader('EINNAHMEN — ' + monate[m-1] + ' ' + y);
  const ew = [40, 25, 35, 35, 35, colW-170];
  tableRow(['Datum','Tag','Brutto','Netto','MwSt 10%','MwSt 20%'], ew, [248,220,216], true);
  const rows = monthKassa.slice().sort((a,b)=>(a.date||'').localeCompare(b.date||''));
  if (rows.length === 0) {
    tableRow(['Keine Kassabuch-Einträge für diesen Monat','','','','',''], ew, [250,245,244], false);
  } else {
    rows.forEach((r, i) => {
      const bg = i%2===0 ? null : [250,245,244];
      const d = new Date(r.date);
      const day = Number.isNaN(d.getTime()) ? '—' : dayNames[d.getDay()];
      tableRow([
        (r.date || '').split('-').reverse().join('.'),
        day,
        bizEur(r.gesamt||0),
        bizEur(r.netto||0),
        bizEur(r.m10||0),
        bizEur(r.m20||0)
      ], ew, bg || undefined, false);
    });
  }
  tableRow(['GESAMT','',bizEur(totalBrutto),bizEur(totalNetto),bizEur(totalMwst10),bizEur(totalMwst20)], ew, [255,240,238], true);
  yPos += 3;

  // Ausgaben
  sectionHeader('AUSGABEN');
  tableRow(['Wareneinkauf', bizEur(einkaufMonth)], [colW-40, 40], null, false);
  tableRow(['Personalkosten', bizEur(personalMonat)], [colW-40, 40], null, false);
  tableRow(['Fixkosten', bizEur(fixSum)], [colW-40, 40], null, false);
  tableRow(['GESAMT AUSGABEN', bizEur(gesamtKosten)], [colW-40, 40], [255,240,238], true);
  yPos += 5;

  // Gewinn-Box
  ensureSpace(26);
  const gColor = gewinn >= 0 ? [232,245,233] : [255,218,214];
  const gText = gewinn >= 0 ? [27,94,32] : [186,26,26];
  doc.setFillColor(...gColor);
  doc.roundedRect(margin, yPos, colW, 20, 3, 3, 'F');
  doc.setTextColor(...gText);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('GEWINN VOR STEUER', margin+5, yPos+8);
  doc.setFontSize(16);
  doc.text(bizEur(gewinn), margin+colW-5, yPos+13, {align:'right'});

  // Footer auf allen Seiten
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(150, 140, 138);
    doc.setFont('helvetica', 'normal');
    doc.text('Erstellt am ' + new Date().toLocaleDateString('de-AT') + ' · Pizzeria San Carino · Ali Shama KG · Seite ' + p + '/' + pages, pageW/2, 290, {align:'center'});
  }

  doc.save('Monatsbericht-' + monate[m-1] + '-' + y + '.pdf');
  if (typeof bizShowToast === 'function') bizShowToast('PDF wird heruntergeladen...');
}

function bizExportData() {
  const data = {
    kassabuch: bizGetKassa(),
    fixkosten: bizGetFixkosten(),
    personal: bizGetPersonal(),
    pizzaCalc: bizGetPizzaCalc(),
    settings: bizGetSettings(),
    exportDatum: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=`pizzeria-export-${bizToday()}.json`; a.click();
  URL.revokeObjectURL(url);
  bizShowToast('💾 Export gestartet');
}

// ═══════════════════════════════════════════════════════════════
// EINSTELLUNGEN
// ═══════════════════════════════════════════════════════════════

function renderBizSettings() {
  const settings = bizGetSettings();
  return `
<h2 style="font-family:'Plus Jakarta Sans',sans-serif;font-size:22px;font-weight:800;color:#261816;margin-bottom:20px;display:flex;align-items:center;gap:8px">
  <span class="material-symbols-outlined" style="color:#8B0000">settings</span>Einstellungen
</h2>

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px">

  <!-- Firmen-Daten -->
  <div class="ws-card">
    <div style="font-weight:700;font-size:15px;margin-bottom:16px;display:flex;align-items:center;gap:6px">
      <span class="material-symbols-outlined" style="font-size:18px;color:#8B0000">business</span>
      Firmendaten
    </div>
    <label style="font-size:12px;font-weight:600;color:#5a403c;display:block;margin-bottom:5px">UID-Nummer</label>
    <input id="settings-uid" value="${settings.uid}" placeholder="ATU12345678"
      style="width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid #e3beb8;font-size:14px;font-family:inherit;outline:none;margin-bottom:12px;box-sizing:border-box">
    <label style="font-size:12px;font-weight:600;color:#5a403c;display:block;margin-bottom:5px">Standard Speisen-Anteil (%)</label>
    <input id="settings-speise" type="number" value="${settings.speiseAnteil}" min="0" max="100"
      style="width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid #e3beb8;font-size:14px;font-family:inherit;outline:none;margin-bottom:16px;box-sizing:border-box">
    <button onclick="bizSaveSettings_()"
      style="width:100%;padding:10px;border-radius:10px;border:none;background:#8B0000;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
      Einstellungen speichern
    </button>
  </div>

  <!-- Passwort ändern -->
  <div class="ws-card">
    <div style="font-weight:700;font-size:15px;margin-bottom:16px;display:flex;align-items:center;gap:6px">
      <span class="material-symbols-outlined" style="font-size:18px;color:#8B0000">lock</span>
      Passwort ändern
    </div>
    <label style="font-size:12px;font-weight:600;color:#5a403c;display:block;margin-bottom:5px">Aktuelles Passwort</label>
    <input type="password" id="pw-current" placeholder="••••••••"
      style="width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid #e3beb8;font-size:14px;font-family:inherit;outline:none;margin-bottom:10px;box-sizing:border-box">
    <label style="font-size:12px;font-weight:600;color:#5a403c;display:block;margin-bottom:5px">Neues Passwort</label>
    <input type="password" id="pw-new" placeholder="••••••••"
      style="width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid #e3beb8;font-size:14px;font-family:inherit;outline:none;margin-bottom:10px;box-sizing:border-box">
    <label style="font-size:12px;font-weight:600;color:#5a403c;display:block;margin-bottom:5px">Neues Passwort wiederholen</label>
    <input type="password" id="pw-confirm" placeholder="••••••••"
      style="width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid #e3beb8;font-size:14px;font-family:inherit;outline:none;margin-bottom:14px;box-sizing:border-box">
    <div id="pw-change-msg" style="font-size:12px;margin-bottom:8px;display:none"></div>
    <button onclick="bizChangePw()"
      style="width:100%;padding:10px;border-radius:10px;border:none;background:linear-gradient(135deg,#610000,#8b0000);color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
      Passwort ändern
    </button>
  </div>

  <!-- Daten-Management -->
  <div class="ws-card">
    <div style="font-weight:700;font-size:15px;margin-bottom:16px;display:flex;align-items:center;gap:6px">
      <span class="material-symbols-outlined" style="font-size:18px;color:#8B0000">storage</span>
      Daten
    </div>
    <button onclick="bizExportData()"
      style="width:100%;padding:10px;border-radius:10px;border:1.5px solid #e3beb8;background:#fff;color:#5a403c;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;margin-bottom:8px;display:flex;align-items:center;justify-content:center;gap:6px">
      <span class="material-symbols-outlined" style="font-size:16px">download</span> Alle Daten exportieren (JSON)
    </button>
    <button onclick="bizLogout()"
      style="width:100%;padding:10px;border-radius:10px;border:1.5px solid #e3beb8;background:#fff8f6;color:#8d6562;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;margin-bottom:8px;display:flex;align-items:center;justify-content:center;gap:6px">
      <span class="material-symbols-outlined" style="font-size:16px">logout</span> Ausloggen
    </button>
    <button onclick="_showConfirm('⚠️ Wirklich alle Business-Daten löschen? Dies kann nicht rückgängig gemacht werden!',function(){bizClearAll()},{okLabel:'Alles löschen'})"
      style="width:100%;padding:10px;border-radius:10px;border:1.5px solid #e3beb8;background:#ffdad6;color:#ba1a1a;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px">
      <span class="material-symbols-outlined" style="font-size:16px">delete_forever</span> Alle Daten löschen
    </button>
  </div>

</div>`;
}

function bizSaveSettings_() {
  const uid = document.getElementById('settings-uid')?.value||'';
  const speiseAnteil = parseInt(document.getElementById('settings-speise')?.value)||80;
  bizSave('settings', { uid, speiseAnteil });
  bizShowToast('✅ Einstellungen gespeichert');
}

function bizChangePw() {
  const cur = document.getElementById('pw-current')?.value||'';
  const nw  = document.getElementById('pw-new')?.value||'';
  const cnf = document.getElementById('pw-confirm')?.value||'';
  const msg = document.getElementById('pw-change-msg');
  const show=(t,ok)=>{ if(msg){msg.textContent=t;msg.style.color=ok?'#386a20':'#ba1a1a';msg.style.display='block';} };
  const _bph1 = bizGetPwHash();
  if (_bph1 && bizHash(cur) !== _bph1) { show('Aktuelles Passwort falsch', false); return; }
  if (nw.length < 4) { show('Neues Passwort muss mind. 4 Zeichen haben', false); return; }
  if (nw !== cnf) { show('Passwörter stimmen nicht überein', false); return; }
  _safeLocalSet(BIZ_PW_KEY, bizHash(nw));
  show('✅ Passwort erfolgreich geändert!', true);
  ['pw-current','pw-new','pw-confirm'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
}

function bizLogout() {
  sessionStorage.removeItem(BIZ_AUTH_KEY);
  const lockIcon = document.getElementById('biz-lock-icon');
  if (lockIcon) lockIcon.textContent = 'lock';
  const mobLockIcon = document.getElementById('mob-biz-lock');
  if (mobLockIcon) mobLockIcon.textContent = 'lock';
  switchTab('kombis');
}

function bizClearAll() {
  ['kassa','fixkosten','personal','pizzacalc','settings'].forEach(k => localStorage.removeItem('biz_'+k));
  bizShowToast('🗑️ Alle Business-Daten gelöscht');
  renderBusinessTab();
}

// ═══════════════════════════════════════════════════════════════
// ROLLEN & BERECHTIGUNGEN — Konfigurierbare Tab-Sichtbarkeit
// ═══════════════════════════════════════════════════════════════

const ROLLE_LABELS = {
  manager:   '🏢 Manager',
  employee:  '👤 Mitarbeiter',
  kitchen:   '👨‍🍳 Küche',
  fahrer:    '🚗 Fahrer',
  service:   '🍽️ Service',
  reinigung: '🧹 Reinigung',
};

const TAB_LABELS = {
  heute:'📅 Heute', dashboard:'📊 Dashboard', kombis:'🧮 Kombis',
  angebote:'🏷️ Angebote', einkaufsliste:'🛒 Einkaufsliste', suche:'🔍 Suche',
  upload:'📤 Upload', verlauf:'📋 Verlauf', mitarbeiter:'👥 Mitarbeiter',
  fehlmaterial:'⚠️ Fehlmaterial', checkliste:'✅ Checkliste', business:'💼 Business',
  speisekarte:'🍕 Speisekarte', lieferanten:'🚚 Lieferanten', dienstplan:'📆 Dienstplan',
  aufgaben:'📝 Aufgaben', schichtcheck:'🎯 Schichtcheck', bestellung:'📦 Bestellung',
  lager:'🏪 Lager', wareneinsatz:'⚖️ Wareneinsatz', preisalarm:'🔔 Preisalarm',
  standardmaterial:'📋 Standard', statistik:'📈 Statistik', tagesangebote:'⭐ Tagesangebote',
  umsatz:'💰 Umsatz', gewinn:'📊 Gewinn', buchhaltung:'🧾 Buchhaltung',
  konkurrenz:'🏆 Konkurrenz', bewertungen:'⭐ Bewertungen', haccp:'🌡️ HACCP',
  mhd:'📅 MHD', kassenschnitt:'💵 Kassenschnitt', urlaub:'🏖️ Urlaub',
  trinkgeld:'💰 Trinkgeld', produkte:'📦 Produkte', geschaefte:'🏪 Geschäfte',
};

let _bizRolleAktiv = 'manager';

function renderBizRollen() {
  const allTabs = Object.keys(TAB_LABELS);
  const rollen = Object.keys(ROLLE_LABELS);
  const perms = getRoleTabs();

  return `
<h2 style="font-family:'Plus Jakarta Sans',sans-serif;font-size:22px;font-weight:800;color:#261816;margin-bottom:8px;display:flex;align-items:center;gap:8px">
  <span class="material-symbols-outlined" style="color:#8B0000">manage_accounts</span>Rollen & Berechtigungen
</h2>
<p style="font-size:13px;color:#5a403c;margin-bottom:20px;line-height:1.5">
  Lege fest, welche Bereiche jede Rolle sehen darf. Admin sieht immer alles und kann nicht eingeschränkt werden.
</p>

<!-- Info: Admin -->
<div style="background:#fff0ee;border:1.5px solid #e3beb8;border-radius:12px;padding:14px 16px;margin-bottom:20px;display:flex;align-items:center;gap:10px">
  <span class="material-symbols-outlined" style="color:#8B0000;font-size:20px">shield</span>
  <span style="font-size:13px;color:#5a403c;font-weight:600">
    <strong style="color:#8B0000">👑 Admin</strong> sieht immer alle 36 Bereiche — nicht einschränkbar.
  </span>
</div>

<!-- Rollen-Auswahl -->
<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px">
  ${rollen.map(r => `
    <button onclick="bizRolleWechseln('${r}')" id="btn-rolle-${r}"
      style="padding:8px 16px;border-radius:10px;border:1.5px solid ${_bizRolleAktiv===r?'#8B0000':'#e3beb8'};
             background:${_bizRolleAktiv===r?'#8B0000':'#fff'};color:${_bizRolleAktiv===r?'#fff':'#5a403c'};
             font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s">
      ${ROLLE_LABELS[r]}
    </button>`).join('')}
</div>

<!-- Berechtigungs-Grid -->
<div class="ws-card" style="margin-bottom:16px">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">
    <div style="font-weight:700;font-size:15px;color:#261816;display:flex;align-items:center;gap:6px">
      <span class="material-symbols-outlined" style="font-size:18px;color:#8B0000">checklist</span>
      Sichtbare Bereiche für: <span id="rolle-name-label" style="color:#8B0000">${ROLLE_LABELS[_bizRolleAktiv]}</span>
    </div>
    <div style="display:flex;gap:6px">
      <button onclick="bizRolleAlleAn()" style="padding:6px 12px;border-radius:8px;border:1.5px solid #2e7d32;background:#e8f5e9;color:#2e7d32;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">
        Alle ✓
      </button>
      <button onclick="bizRolleAlleAus()" style="padding:6px 12px;border-radius:8px;border:1.5px solid #c62828;background:#ffdad6;color:#c62828;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">
        Alle ✗
      </button>
      <button onclick="bizRolleReset()" style="padding:6px 12px;border-radius:8px;border:1.5px solid #0277bd;background:#e1f5fe;color:#0277bd;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">
        Standard
      </button>
    </div>
  </div>
  <div id="rollen-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px">
    ${allTabs.map(tab => {
      const checked = (perms[_bizRolleAktiv]||[]).includes(tab);
      return `<label style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;border:1.5px solid ${checked?'#e3beb8':'#f0f0f0'};background:${checked?'#fff0ee':'#fafafa'};cursor:pointer;font-size:13px;font-weight:500;color:#261816;transition:all .1s;user-select:none">
        <input type="checkbox" data-tab-perm="${tab}" ${checked?'checked':''} onchange="bizPermChanged(this)"
          style="width:16px;height:16px;accent-color:#8B0000;cursor:pointer;flex-shrink:0">
        <span>${TAB_LABELS[tab]||tab}</span>
      </label>`;
    }).join('')}
  </div>
</div>

<!-- Speichern -->
<div style="display:flex;gap:10px;flex-wrap:wrap">
  <button onclick="bizSaveRolePerms()"
    style="padding:12px 28px;border-radius:12px;border:none;background:#8B0000;color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:8px">
    <span class="material-symbols-outlined" style="font-size:18px">save</span>Berechtigungen speichern
  </button>
  <button onclick="bizResetAllRolePerms()"
    style="padding:12px 20px;border-radius:12px;border:1.5px solid #c62828;background:#ffdad6;color:#c62828;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
    Alle auf Standard zurücksetzen
  </button>
</div>`;
}

function bizRolleWechseln(rolle) {
  _bizRolleAktiv = rolle;
  const section = document.getElementById('biz-rollen');
  if (section) section.innerHTML = renderBizRollen();
}

function bizPermChanged(cb) {
  const tab = cb.dataset.tabPerm;
  const label = cb.closest('label');
  if (label) {
    label.style.borderColor = cb.checked ? '#e3beb8' : '#f0f0f0';
    label.style.background  = cb.checked ? '#fff0ee' : '#fafafa';
  }
}

function bizRolleAlleAn() {
  document.querySelectorAll('#rollen-grid input[type=checkbox]').forEach(cb => {
    cb.checked = true; bizPermChanged(cb);
  });
}

function bizRolleAlleAus() {
  document.querySelectorAll('#rollen-grid input[type=checkbox]').forEach(cb => {
    cb.checked = false; bizPermChanged(cb);
  });
}

function bizRolleReset() {
  const defaults = (ROLE_TABS_DEFAULT[_bizRolleAktiv] || []);
  document.querySelectorAll('#rollen-grid input[type=checkbox]').forEach(cb => {
    cb.checked = defaults.includes(cb.dataset.tabPerm);
    bizPermChanged(cb);
  });
}

function bizSaveRolePerms() {
  // Aktuell angezeigte Checkboxen lesen
  const checked = [];
  document.querySelectorAll('#rollen-grid input[type=checkbox]').forEach(cb => {
    if (cb.checked) checked.push(cb.dataset.tabPerm);
  });

  // Aus localStorage laden (alle Rollen), diese Rolle ersetzen
  let perms = getRoleTabs();
  perms[_bizRolleAktiv] = checked;
  // Admin immer komplett
  perms.admin = ROLE_TABS_DEFAULT.admin;

  localStorage.setItem('psc_role_perms', JSON.stringify(perms));
  bizShowToast('✅ Berechtigungen für ' + (ROLLE_LABELS[_bizRolleAktiv]||_bizRolleAktiv) + ' gespeichert!');
}

function bizResetAllRolePerms() {
  localStorage.removeItem('psc_role_perms');
  bizShowToast('🔄 Alle Rollen auf Standard zurückgesetzt');
  const section = document.getElementById('biz-rollen');
  if (section) section.innerHTML = renderBizRollen();
}

// ═══════════════════════════════════════════════════════════════
// BUSINESS TOAST
// ═══════════════════════════════════════════════════════════════

function bizShowToast(msg) {
  const t = document.createElement('div');
  t.style.cssText = 'position:fixed;bottom:96px;left:50%;transform:translateX(-50%);background:#261816;color:#fff;padding:10px 20px;border-radius:12px;font-size:14px;font-weight:600;z-index:9999;white-space:nowrap;box-shadow:0 4px 16px rgba(0,0,0,.2);animation:fadeToast .3s ease';
  t.textContent = msg;
  const style = document.createElement('style');
  style.textContent = '@keyframes fadeToast{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}';
  document.head.appendChild(style);
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}


// ═══════════════════════════════════════════════════════════════
// js/tabs.js
// ═══════════════════════════════════════════════════════════════
// js/tabs.js
function calcSingleShopCombo(shop, lowProducts) {
  const items = [];
  for (const p of lowProducts) {
    const price = getPrice(shop.id, p.id);
    if (price === null) return null;
    items.push({ product: p, shop, pricePerUnit: price, quantity: p.orderQuantity, totalCost: price * p.orderQuantity });
  }
  const totalCost = items.reduce((s, i) => s + i.totalCost, 0);
  return { id: 'single-' + shop.id, shops: [shop], items, totalCost, numShops: 1, isRecommended: false };
}

function calcTwoShopCombo(shopA, shopB, lowProducts) {
  const items = [];
  for (const p of lowProducts) {
    const pA = getPrice(shopA.id, p.id);
    const pB = getPrice(shopB.id, p.id);
    if (pA === null && pB === null) return null;
    let chosenShop, chosenPrice;
    if (pA === null)      { chosenShop = shopB; chosenPrice = pB; }
    else if (pB === null) { chosenShop = shopA; chosenPrice = pA; }
    else                  { chosenShop = pA <= pB ? shopA : shopB; chosenPrice = Math.min(pA, pB); }
    items.push({ product: p, shop: chosenShop, pricePerUnit: chosenPrice, quantity: p.orderQuantity, totalCost: chosenPrice * p.orderQuantity });
  }
  // Only count shops actually used
  const usedIds = new Set(items.map(i => i.shop.id));
  if (usedIds.size < 2) return null; // degenerate – same as single shop
  const totalCost = items.reduce((s, i) => s + i.totalCost, 0);
  const shops = SHOPS.filter(s => usedIds.has(s.id));
  const bestSingle = SHOPS
    .map(s => calcSingleShopCombo(s, lowProducts))
    .filter(Boolean)
    .sort((a, b) => a.totalCost - b.totalCost)[0] || null;
  const savings = bestSingle ? Math.max(0, bestSingle.totalCost - totalCost) : 0;
  const savingsPct = bestSingle && bestSingle.totalCost > 0 ? (savings / bestSingle.totalCost) * 100 : 0;
  return { id: 'two-' + shopA.id + '-' + shopB.id, shops, items, totalCost, numShops: 2, isRecommended: false, savings, savingsPct };
}

function calculateCombinations() {
  const low = getLowStockProducts();
  if (low.length === 0) return { single: [], two: [], hasLow: false, missingPrices: [] };

  const missingSet = new Set();
  for (const p of low) {
    for (const s of SHOPS) {
      if (getPrice(s.id, p.id) === null) missingSet.add(p.name + ' @ ' + s.name);
    }
  }
  const missingPrices = Array.from(missingSet);

  // Single shop
  const single = SHOPS
    .map(s => calcSingleShopCombo(s, low))
    .filter(Boolean)
    .sort((a, b) => a.totalCost - b.totalCost)
    .slice(0, 3);
  const bestSingle = single.length > 0 ? single[0] : null;

  // Two shop
  const two = [];
  for (let i = 0; i < SHOPS.length; i++) {
    for (let j = i + 1; j < SHOPS.length; j++) {
      const c = calcTwoShopCombo(SHOPS[i], SHOPS[j], low);
      if (c) two.push(c);
    }
  }
  two.sort((a, b) => {
    if (b.savings !== a.savings) return b.savings - a.savings;
    return a.totalCost - b.totalCost;
  });
  const top3Two = two.filter(c => c.savings >= 2 && c.savingsPct >= 3).slice(0, 3);

  const all = [...top3Two, ...single].sort((a, b) => a.totalCost - b.totalCost);
  if (all.length > 0) {
    if (top3Two.length > 0) {
      const bestTwo = top3Two.slice().sort((a, b) => a.totalCost - b.totalCost)[0];
      const recommendTwo = !bestSingle || bestTwo.totalCost <= bestSingle.totalCost;
      if (recommendTwo) bestTwo.isRecommended = true;
      else if (bestSingle) bestSingle.isRecommended = true;
    } else if (bestSingle) {
      bestSingle.isRecommended = true;
    } else {
      all[0].isRecommended = true;
    }
  }

  return { single, two: top3Two, hasLow: true, missingPrices };
}

// ═══════════════════════════════════════════════════════════════
// RENDER — PRODUKTE
// ═══════════════════════════════════════════════════════════════

const CATEGORY_BG = {
  'Grundzutaten': '#e8f4fd',
  'Käse':         '#fdf5e8',
  'Belag':        '#fde8e8',
  'Gewürze':      '#e8fdf0',
};

function _isDarkTheme() {
  const t = document.documentElement.getAttribute('data-theme');
  return t === 'dark' || t === 'dark-red' || t === 'glass';
}
function _tc(lightVal, darkVal) {
  return _isDarkTheme() ? darkVal : lightVal;
}

function renderProductsTab() {
  const low = getLowStockProducts();
  const categories = [...new Set(PRODUCTS.map(p => p.category))];
  if (typeof window._produkteFilter === 'undefined') window._produkteFilter = 'alle';
  const currentFilter = window._produkteFilter;

  const dark = _isDarkTheme();
  const surf = dark ? 'var(--surface)' : '#fff0ee';
  const surfBorder = dark ? 'var(--border)' : '#e3beb8';
  const txtMain = dark ? 'var(--text)' : '#261816';
  const txtSub  = dark ? 'var(--text-3)' : '#5a403c';
  const errBg   = dark ? 'rgba(186,26,26,0.2)' : '#ffdad6';
  const errBrd  = dark ? 'rgba(186,26,26,0.35)' : '#ffdad4';
  const errTxt  = dark ? 'var(--red)' : '#93000a';
  const errSub  = dark ? 'var(--text-3)' : '#ba1a1a';
  const okBg    = dark ? 'rgba(46,125,50,0.15)' : '#f0fdf4';
  const okBrd   = dark ? 'rgba(46,125,50,0.3)' : '#bbf7d0';
  const okTxt   = dark ? '#4caf50' : '#0c2000';
  const okSub   = dark ? '#4caf50' : '#386a20';

  let html = _pageHdr('inventory_2', 'Produkte', PRODUCTS.length + ' Artikel · ' + low.length + ' niedriger Bestand', '');
  html += `
    <div style="display:flex;gap:16px;margin-bottom:20px;flex-wrap:wrap">
      <div style="flex:1;min-width:120px;background:${surf};border:1px solid ${surfBorder};border-radius:16px;padding:16px 20px">
        <div style="font-size:28px;font-weight:800;color:${txtMain}">${PRODUCTS.length}</div>
        <div style="font-size:12px;color:${txtSub};margin-top:4px">Produkte gesamt</div>
      </div>
      <div style="flex:1;min-width:120px;background:${low.length>0?errBg:okBg};border:1px solid ${low.length>0?errBrd:okBrd};border-radius:16px;padding:16px 20px">
        <div style="font-size:28px;font-weight:800;color:${low.length>0?errTxt:okTxt}">${low.length}</div>
        <div style="font-size:12px;color:${low.length>0?errSub:okSub};margin-top:4px">Niedriger Bestand</div>
      </div>
    </div>`;

  if (PRODUCTS.length === 0) {
    html += '<div class="ws-card" style="text-align:center;padding:60px 20px"><span class="material-symbols-outlined" style="font-size:48px;color:#e3beb8;display:block;margin-bottom:12px">inventory_2</span><div style="font-size:16px;font-weight:700;color:#5a403c;margin-bottom:6px">Keine Produkte vorhanden</div><div style="font-size:13px;color:#5a6472">Produkte werden über die Preisdatenbank geladen.</div></div>';
    document.getElementById('panel-produkte').innerHTML = html;
    return;
  }

  const chipCategories = ['alle', ...categories];
  const chipHtml = chipCategories.map(cat => {
    const active = currentFilter === cat;
    const label = cat === 'alle' ? 'Alle' : cat;
    const chipBg = active ? '#610000' : (dark ? 'var(--surface)' : '#fff');
    const chipBorder = active ? '#610000' : (dark ? 'var(--border)' : '#e3beb8');
    const chipColor = active ? '#fff' : (dark ? 'var(--text-2)' : '#5a403c');
    return `<button onclick="window._produkteFilter='${cat}';renderProductsTab()" style="padding:7px 12px;border-radius:999px;border:1.5px solid ${chipBorder};background:${chipBg};color:${chipColor};font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">${label}</button>`;
  }).join('');
  html += `<div style="display:flex;gap:8px;flex-wrap:wrap;margin:0 0 20px">${chipHtml}</div>`;

  const visibleCategories = currentFilter === 'alle' ? categories : categories.filter(cat => cat === currentFilter);

  for (const cat of visibleCategories) {
    const catProducts = PRODUCTS
      .filter(p => p.category === cat)
      .sort((a, b) => {
        const aLow = stockLevels[a.id] < a.minStock;
        const bLow = stockLevels[b.id] < b.minStock;
        if (aLow !== bLow) return aLow ? -1 : 1;
        return a.name.localeCompare(b.name, 'de');
      });
    const bg = dark ? 'var(--surface)' : (CATEGORY_BG[cat] || '#fff0ee');
    const catBorder = dark ? 'var(--border)' : 'transparent';
    html += `
      <div style="margin-bottom:28px">
        <h3 style="font-size:11px;font-weight:700;color:${dark?'var(--text-3)':'#5a403c'};text-transform:uppercase;letter-spacing:.1em;margin-bottom:12px">${cat}</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px">`;

    for (const p of catProducts) {
      const stock = stockLevels[p.id];
      const isLow = stock < p.minStock;
      const pct = Math.min(100, (stock / p.minStock) * 100);
      const pctText = Math.round(pct) + '% vom Minimum';
      const barColor = isLow ? '#ba1a1a' : '#386a20';
      const fifoWarn = typeof fifoCheckWarning === 'function' ? fifoCheckWarning(p.id) : null;
      const cardNameColor = dark ? 'var(--text)' : '#261816';
      const cardSubColor  = dark ? 'var(--text-3)' : '#5a403c';
      const cardBtnBg     = dark ? 'var(--surface)' : 'rgba(255,255,255,0.6)';
      const cardBorder    = isLow ? '#ba1a1a44' : (dark ? 'var(--border)' : 'transparent');
      html += `
        <div id="pcard-${p.id}"
          style="background:${bg};border:1.5px solid ${cardBorder};
            border-radius:16px;overflow:hidden;transition:box-shadow .15s"
          onmouseover="this.style.boxShadow='0 4px 16px rgba(0,0,0,.18)'"
          onmouseout="this.style.boxShadow=''">
          <div onclick="editStock('${p.id}')" style="padding:16px;cursor:pointer">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
              <span style="font-size:14px;font-weight:600;color:${cardNameColor};line-height:1.3">${p.name}</span>
              ${isLow ? '<span class="material-symbols-outlined" style="font-size:18px;color:#ba1a1a;flex-shrink:0">warning</span>' : ''}
            </div>
            <div style="height:6px;background:${dark?'rgba(255,255,255,0.12)':'#e3beb866'};border-radius:3px;margin-bottom:8px;overflow:hidden">
              <div class="progress-fill" style="height:100%;width:${pct}%;background:${barColor};border-radius:3px"></div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:${cardSubColor}">
              <span>Min: ${p.minStock} ${p.unit}</span>
              <span id="stock-${p.id}" style="font-weight:700;color:${isLow?'#ba1a1a':'#386a20'}">${stock.toLocaleString('de-DE')} ${p.unit}</span>
            </div>
            <div style="font-size:11px;font-weight:700;color:${isLow?'#ba1a1a':'#2e7d32'};margin-top:6px">${pctText}</div>
            ${isLow ? `<div style="font-size:11px;font-weight:700;color:${dark?'var(--red)':'#ba1a1a'};margin-top:4px">Bestellen: ${p.orderQuantity} ${p.unit}</div>` : ''}
            ${isLow ? `<div onclick="event.stopPropagation();switchTab('kombis')" style="font-size:11px;font-weight:700;color:${dark?'var(--red)':'#610000'};margin-top:5px;text-decoration:underline;cursor:pointer;display:inline-flex;align-items:center;gap:3px">→ Zur Einkaufs-Kombi</div>` : ''}
          </div>
          ${fifoWarn ? `
            <div style="background:${dark?'rgba(230,81,0,0.15)':'#fff8e1'};border-top:1px solid ${dark?'rgba(230,81,0,0.3)':'#ffe082'};padding:7px 14px;
              display:flex;align-items:center;gap:6px;font-size:11px;color:#e65100;font-weight:600">
              <span class="material-symbols-outlined" style="font-size:13px">schedule</span>
              ${fifoWarn}
            </div>` : ''}
          <div style="border-top:1px solid ${dark?'var(--border)':'rgba(0,0,0,0.06)'};padding:7px 10px;
            background:${cardBtnBg};display:flex;gap:6px">
            <button onclick="event.stopPropagation();fifoSetEingang('${p.id}')"
              title="Eingang-Datum setzen (FIFO)"
              style="flex:1;min-height:36px;padding:4px 6px;border-radius:7px;
                border:1px solid #e2e2e8;background:#fff;color:#6b7280;
                font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;
                display:flex;align-items:center;justify-content:center;gap:3px">
              <span class="material-symbols-outlined" style="font-size:14px">move_to_inbox</span>Eingang
            </button>
            <button onclick="event.stopPropagation();showAbfallModal('${p.id}')"
              title="Abfall erfassen"
              style="flex:1;min-height:36px;padding:4px 6px;border-radius:7px;
                border:1px solid #fecdd3;background:#fff5f5;color:#c62828;
                font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;
                display:flex;align-items:center;justify-content:center;gap:3px">
              <span class="material-symbols-outlined" style="font-size:14px">delete_sweep</span>Abfall
            </button>
          </div>
        </div>`;
    }
    html += `</div></div>`;
  }

  if (visibleCategories.length === 0) {
    html += '<div class="ws-card" style="text-align:center;padding:28px 20px;color:#6b4844;font-size:13px">Keine Produkte für diesen Filter gefunden.</div>';
  }

  if (typeof renderPortionskontrolleSection === 'function') {
    html += renderPortionskontrolleSection();
  }

  document.getElementById('panel-produkte').innerHTML = `<div style="overflow-x:hidden;max-width:100%">${html}</div>`;
}

// ═══════════════════════════════════════════════════════════════
// RENDER — GESCHÄFTE
// ═══════════════════════════════════════════════════════════════

function daysUntilMonday() {
  const day = new Date().getDay(); // 0=Sun,1=Mon,...
  return day === 0 ? 1 : day === 1 ? 7 : 8 - day;
}

function renderShopsTab() {
  const panel2 = document.getElementById('panel-geschaefte');
  const mwstOn  = panel2.dataset.mwst  === '1';
  const menge   = parseFloat(panel2.dataset.menge  || '1');
  const mwstFak = mwstOn ? 1.10 : 1.0;

  function calcPreis(v) { return v * menge * mwstFak; }

  const lowIds = new Set(getLowStockProducts().map(p => p.id));

  const mengenBtns = [1,5,10,15,20].map(m => {
    const aktiv = menge === m;
    return `<button onclick="document.getElementById('panel-geschaefte').dataset.menge='${m}';renderShopsTab()"
      style="padding:5px 14px;border-radius:8px;border:1.5px solid ${aktiv?'#610000':'#e3beb8'};background:${aktiv?'#610000':'#fff'};color:${aktiv?'#fff':'#5a403c'};font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">${m} kg</button>`;
  }).join('');

  const mwstToggle =
    `<button onclick="document.getElementById('panel-geschaefte').dataset.mwst='${mwstOn?'0':'1'}';renderShopsTab()"
      style="padding:5px 16px;border-radius:8px;border:1.5px solid ${mwstOn?'#1b5e20':'#e3beb8'};background:${mwstOn?'#e8f5e9':'#fff'};color:${mwstOn?'#1b5e20':'#5a403c'};font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
      ${mwstOn?'✓ Brutto (inkl. 10% MwSt)':'Netto (exkl. MwSt)'}
    </button>`;

  const controlBar = `
    <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:18px;padding:12px 16px;background:#fff;border-radius:12px;border:1.5px solid #e3beb8">
      <span style="font-size:12px;font-weight:700;color:#5a403c">Menge:</span>
      ${mengenBtns}
      <div style="flex:1"></div>
      ${mwstToggle}
    </div>`;

  const _shopHdr = _pageHdr('store', 'Geschäfte', SHOPS.length + ' Shops · Preisvergleich', '') + controlBar;

  // ── 1. PREISVERGLEICH TABELLE ────────────────────────────────
  // Per product: find min and max price across all shops
  const priceStats = {};
  for (const p of PRODUCTS) {
    const vals = SHOPS.map(s => getPrice(s.id, p.id)).filter(v => v !== null);
    if (vals.length) priceStats[p.id] = { min: Math.min(...vals), max: Math.max(...vals) };
  }
  const productsWithPrices = PRODUCTS.filter(p => priceStats[p.id]);

  // Einheit-Label für Header
  const einheitLabel = menge === 1 ? 'pro kg' : `für ${menge} kg`;

  if (productsWithPrices.length === 0) {
    document.getElementById('panel-geschaefte').innerHTML = _shopHdr + '<div class="ws-card" style="text-align:center;padding:60px 20px"><span class="material-symbols-outlined" style="font-size:48px;color:#e3beb8;display:block;margin-bottom:12px">store</span><div style="font-size:16px;font-weight:700;color:#5a403c;margin-bottom:6px">Noch keine Preise vorhanden</div><div style="font-size:13px;color:#5a6472">Lade Preise über den Preisserver oder trage sie manuell ein.</div></div>';
    return;
  }

  const thCols = SHOPS.map(s =>
    `<th style="padding:8px 14px;font-size:11px;font-weight:700;color:#5a403c;text-align:right;white-space:nowrap;border-bottom:2px solid #e3beb8;min-width:90px">${s.name}<br><span style="font-weight:400;color:#5a6472">${einheitLabel}</span></th>`
  ).join('');

  const tRows = productsWithPrices.map(p => {
    const { min, max } = priceStats[p.id];
    const calcMin = calcPreis(min);
    const calcMax = calcPreis(max);
    const allSame = min === max;
    const cells = SHOPS.map(s => {
      const v = getPrice(s.id, p.id);
      if (v === null) return `<td style="padding:8px 14px;text-align:right;font-size:13px;color:#c9b8b4">—</td>`;
      const cv = calcPreis(v);
      const isMin = v === min;
      const isMax = !allSame && v === max;
      const diff = calcPreis(v - min);
      const style = isMin
        ? 'padding:8px 14px;text-align:right;font-size:13px;font-weight:700;color:#16a34a;background:#f0fdf4;'
        : isMax
          ? 'padding:8px 14px;text-align:right;font-size:13px;color:#a89490;text-decoration:line-through;'
          : 'padding:8px 14px;text-align:right;font-size:13px;color:#261816;';
      const diffBadge = !isMin && diff > 0 ? `<br><span style="font-size:10px;color:#c62828;font-weight:600">+${eur(diff)}</span>` : '';
      return `<td style="${style}">${eur(cv)}${isMin ? ' <span style="font-size:10px;background:#16a34a;color:#fff;border-radius:3px;padding:1px 4px">✓</span>' : ''}${diffBadge}</td>`;
    }).join('');

    const rowBg = lowIds.has(p.id) ? 'background:#fff5f5;' : '';
    return `
      <tr style="border-bottom:1px solid #f5f0ee;${rowBg}">
        <td style="padding:8px 14px;white-space:nowrap">
          <div style="display:flex;align-items:center;gap:5px">
            ${lowIds.has(p.id) ? '<span class="material-symbols-outlined" style="font-size:12px;color:#ba1a1a;flex-shrink:0">warning</span>' : ''}
            <span style="font-size:13px;font-weight:600;color:#261816">${p.name}</span>
            <span style="font-size:10px;color:#6b4844">/${p.unit}</span>
            ${menge > 1 ? `<span style="font-size:10px;color:#777">(${eur(calcPreis(priceStats[p.id].min))} günstigst)</span>` : ''}
          </div>
        </td>
        ${cells}
      </tr>`;
  }).join('');

  const tableSection = `
    <div style="margin-bottom:24px">
      <p style="font-size:11px;font-weight:700;color:#261816;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">Preisvergleich</p>
      <div style="overflow-x:auto;border-radius:10px;border:1px solid #e3beb8;background:#fff">
        <table style="width:100%;border-collapse:collapse;min-width:480px">
          <thead><tr style="background:#fafafa">
            <th style="padding:8px 14px;font-size:11px;font-weight:700;color:#5a403c;text-align:left;border-bottom:2px solid #e3beb8;white-space:nowrap">Produkt</th>
            ${thCols}
          </tr></thead>
          <tbody>${tRows}</tbody>
        </table>
        <div style="padding:6px 14px;background:#fafafa;border-top:1px solid #f0ece8;display:flex;gap:14px;align-items:center;flex-wrap:wrap">
          <span style="font-size:10px;color:#16a34a;font-weight:700">✓ günstigster Preis</span>
          <span style="font-size:10px;color:#a89490;text-decoration:line-through">teuerster Preis</span>
          ${getLowStockProducts().length > 0 ? '<span style="font-size:10px;color:#ba1a1a;margin-left:auto">⚠ Niedriger Bestand</span>' : ''}
        </div>
      </div>
    </div>`;

  // ── 2+3. AKTIONEN ─────────────────────────────────────────────
  function dealCard(deal, badge, badgeColor) {
    const product = PRODUCTS.find(p => p.id === deal.productId);
    const shop    = SHOPS.find(s => s.id === deal.shopId);
    if (!product || !shop) return '';
    const saving  = deal.normalPrice - deal.pricePerUnit;
    const pct     = Math.round((saving / deal.normalPrice) * 100);
    return `
      <div style="background:#fff;border-radius:10px;border:1px solid #e3beb8;padding:11px 13px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px;margin-bottom:6px">
          <span style="font-size:13px;font-weight:700;color:#261816;flex:1">${product.name}</span>
          <span style="font-size:9px;font-weight:700;color:#fff;background:${badgeColor};padding:2px 6px;border-radius:3px;white-space:nowrap;flex-shrink:0">${badge}</span>
        </div>
        <div style="display:flex;align-items:baseline;gap:7px;margin-bottom:4px">
          <span style="font-size:16px;font-weight:800;color:#610000">${eur(deal.pricePerUnit)}</span>
          <span style="font-size:11px;color:#a89490;text-decoration:line-through">${eur(deal.normalPrice)}</span>
          <span style="font-size:11px;font-weight:700;color:#16a34a">−${pct}%</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:#6b4844">
          <span style="font-weight:600;color:#5a403c">${shop.name}</span>
          <span>bis ${deal.validTo}</span>
        </div>
      </div>`;
  }

  const curDeals  = DEALS.filter(d => d.week === 'current').sort((a,b) => (b.normalPrice-b.pricePerUnit)-(a.normalPrice-a.pricePerUnit));
  const nextDeals = DEALS.filter(d => d.week === 'next').sort((a,b) => (b.normalPrice-b.pricePerUnit)-(a.normalPrice-a.pricePerUnit));

  const dealsSection = (curDeals.length + nextDeals.length) === 0 ? '' : `
    ${curDeals.length > 0 ? `
    <div style="margin-bottom:20px">
      <p style="font-size:11px;font-weight:700;color:#261816;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">
        <span style="background:#ba1a1a;color:#fff;padding:2px 7px;border-radius:3px;font-size:10px;margin-right:6px">DIESE WOCHE</span>Aktuelle Angebote
      </p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(185px,1fr));gap:8px">${curDeals.map(d => dealCard(d,'DIESE WOCHE','#ba1a1a')).join('')}</div>
    </div>` : ''}
    ${nextDeals.length > 0 ? `
    <div style="margin-bottom:20px">
      <p style="font-size:11px;font-weight:700;color:#261816;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">
        <span style="background:#b06020;color:#fff;padding:2px 7px;border-radius:3px;font-size:10px;margin-right:6px">AB MONTAG</span>Nächste Woche
        <span style="font-size:11px;font-weight:400;color:#5a403c;text-transform:none;letter-spacing:0;margin-left:6px">· noch ${daysUntilMonday()} Tage warten lohnt sich!</span>
      </p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(185px,1fr));gap:8px">${nextDeals.map(d => dealCard(d,'AB MONTAG','#b06020')).join('')}</div>
    </div>` : ''}`;

  // ── 4. GESCHÄFTE ÜBERSICHT ────────────────────────────────────
  const typeMap = {
    'Großhandel': '🏭 GROSSHANDEL', 'Supermarkt': '🛒 SUPERMARKT',
    'Discounter': '🏷️ DISCOUNTER',  'Türkmarkt':  '🌙 TÜRKMARKT',
  };

  const shopCards = SHOPS.map(shop => {
    const total = PRODUCTS.reduce((s, p) => {
      const v = getPrice(shop.id, p.id); return v ? s + v * p.orderQuantity : s;
    }, 0);
    const cnt = PRODUCTS.filter(p => getPrice(shop.id, p.id) !== null).length;
    const badge = typeMap[shop.type] || ('🏪 ' + shop.type.toUpperCase());
    return `
      <div style="border-radius:10px;border:1px solid #e3beb8;overflow:hidden;background:#fff">
        <div style="background:#8B0000;padding:9px 13px;display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:14px;font-weight:700;color:#fff">${shop.name}</span>
          <span style="font-size:9px;font-weight:700;color:rgba(255,255,255,.8)">${badge}</span>
        </div>
        <div style="padding:9px 13px;display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:11px;color:#6b4844">${cnt} Produkte</span>
          <div style="text-align:right">
            <span style="font-size:9px;color:#6b4844;display:block;text-transform:uppercase;letter-spacing:.06em">Gesamteinkauf</span>
            <span style="font-size:16px;font-weight:800;color:#261816">${eur(total)}</span>
          </div>
        </div>
      </div>`;
  }).join('');

  const shopsSection = `
    <div style="margin-bottom:22px">
      <p style="font-size:11px;font-weight:700;color:#6b4844;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">Geschäfte Übersicht</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(185px,1fr));gap:8px">${shopCards}</div>
    </div>`;

  document.getElementById('panel-geschaefte').innerHTML = _shopHdr + tableSection + dealsSection + shopsSection;
}

// ═══════════════════════════════════════════════════════════════
// RENDER — KOMBIS
// ═══════════════════════════════════════════════════════════════

function renderKombisTab() {
  const low = getLowStockProducts();
  const { single, two, hasLow, missingPrices } = calculateCombinations();

  // ── Mini Dashboard ────────────────────────────────────────────
  const fmOpen = typeof FM_DATA !== 'undefined' ? FM_DATA.filter(x=>x.status==='offen').length : 0;
  const fmDringend = typeof FM_DATA !== 'undefined' ? FM_DATA.filter(x=>x.status==='offen'&&x.prioritaet==='dringend').length : 0;
  const { y, m } = typeof bizCurrentMonth === 'function' ? bizCurrentMonth() : { y: new Date().getFullYear(), m: new Date().getMonth()+1 };
  const monthStr = y + '-' + String(m).padStart(2,'0');
  const kassa = typeof bizGetKassa === 'function' ? bizGetKassa() : [];
  const monthRev = kassa.filter(e => e.date && e.date.startsWith(monthStr)).reduce((s,e)=>s+(e.gesamt||0),0);
  const monthNames = ['Jän','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];

  // Find most critical product (lowest stock ratio)
  const criticalProduct = PRODUCTS.reduce((worst, p) => {
    const ratio = stockLevels[p.id] / p.minStock;
    if (!worst || ratio < (stockLevels[worst.id] / worst.minStock)) return p;
    return worst;
  }, null);
  const critPct = criticalProduct ? Math.min(100, Math.round((stockLevels[criticalProduct.id] / criticalProduct.minStock) * 100)) : 100;
  const mozzarella = PRODUCTS.find(p => p.id === 'mozzarella');
  const mozzStock = mozzarella ? stockLevels['mozzarella'] : null;
  const mozzPct = mozzarella ? Math.min(100, Math.round((mozzStock / mozzarella.minStock) * 100)) : null;

  const dashHtml = `
    <div class="bento-grid">
      <div class="bento-hero">
        <div style="font-size:11px;font-weight:700;color:#6b4844;text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px">Kritischstes Produkt</div>
        ${criticalProduct ? `
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
            <span class="material-symbols-outlined" style="font-size:28px;color:#ba1a1a">warning</span>
            <div>
              <div style="font-size:20px;font-weight:800;color:#261816;font-family:'Plus Jakarta Sans',sans-serif">${criticalProduct.name}</div>
              <div style="font-size:12px;color:#6b4844">${stockLevels[criticalProduct.id].toLocaleString('de-DE')} / ${criticalProduct.minStock} ${criticalProduct.unit}</div>
            </div>
          </div>
          <div style="height:8px;background:#f0e8e6;border-radius:4px;overflow:hidden;margin-bottom:8px">
            <div style="height:100%;width:${critPct}%;background:${critPct < 40 ? '#dc2626' : critPct < 70 ? '#f59e0b' : '#16a34a'};border-radius:4px;transition:width .3s ease"></div>
          </div>
          <div style="font-size:12px;color:${critPct < 40 ? '#dc2626' : '#6b4844'};font-weight:600">${critPct}% vom Minimum</div>
        ` : `<div style="font-size:14px;color:#16a34a;font-weight:600">✅ Alle Bestände OK</div>`}
        <div style="margin-top:18px;padding-top:14px;border-top:1px solid #f0e8e6;display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div onclick="switchTab('fehlmaterial')" style="cursor:pointer">
            <div style="font-size:26px;font-weight:800;color:${low.length>0?'#dc2626':'#16a34a'};font-family:'Plus Jakarta Sans',sans-serif">${low.length}</div>
            <div style="font-size:11px;color:#6b4844;font-weight:500">Unter Minimum</div>
            <div style="font-size:11px;font-weight:700;color:${low.length>0?'#dc2626':'#16a34a'};margin-top:3px">${low.length>0?'🔴 Nachbestellen':'✅ Alles OK'}</div>
          </div>
          <div>
            <div style="font-size:26px;font-weight:800;color:#1565c0;font-family:'Plus Jakarta Sans',sans-serif">${PRODUCTS.length}</div>
            <div style="font-size:11px;color:#6b4844;font-weight:500">Produkte gesamt</div>
            <div style="font-size:11px;font-weight:700;color:#2e7d32;margin-top:3px">📦 ${PRODUCTS.length - low.length} im Soll</div>
          </div>
        </div>
      </div>
      <div class="bento-side">
        <div class="bento-small bento-small-yellow" onclick="switchTab('lager')" style="cursor:pointer">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span class="material-symbols-outlined" style="font-size:18px;color:#f59e0b">water_drop</span>
            <span style="font-size:12px;font-weight:700;color:#5a403c">Mozzarella Status</span>
          </div>
          ${mozzarella && mozzPct !== null ? `
            <div style="font-size:22px;font-weight:800;color:${mozzPct<50?'#dc2626':'#f59e0b'};font-family:'Plus Jakarta Sans',sans-serif">${mozzStock} kg</div>
            <div style="height:5px;background:#fef3c7;border-radius:3px;overflow:hidden;margin:8px 0 4px">
              <div style="height:100%;width:${mozzPct}%;background:#f59e0b;border-radius:3px"></div>
            </div>
            <div style="font-size:11px;color:#6b4844">${mozzPct}% vom Min (${mozzarella.minStock} kg)</div>
          ` : `<div style="font-size:13px;color:#6b4844">Nicht gefunden</div>`}
        </div>
        <div class="bento-small bento-small-red" onclick="switchTab('fehlmaterial')" style="cursor:pointer">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span class="material-symbols-outlined" style="font-size:18px;color:#dc2626">error</span>
            <span style="font-size:12px;font-weight:700;color:#5a403c">Kritische Artikel</span>
          </div>
          <div style="font-size:22px;font-weight:800;color:#dc2626;font-family:'Plus Jakarta Sans',sans-serif">${low.length}</div>
          <div style="font-size:11px;color:#6b4844;margin-top:4px">${low.length>0 ? low.slice(0,2).map(p=>p.name).join(', ')+(low.length>2?'…':'') : 'Alle im grünen Bereich'}</div>
        </div>
        <div class="bento-small" style="border-left:4px solid #2e7d32">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span class="material-symbols-outlined" style="font-size:18px;color:#2e7d32">euro</span>
            <span style="font-size:12px;font-weight:700;color:#5a403c">Umsatz ${monthNames[m-1]}</span>
          </div>
          <div style="font-size:20px;font-weight:800;color:${monthRev>0?'#2e7d32':'#9ca3af'};font-family:'Plus Jakarta Sans',sans-serif">${monthRev>0?'€ '+Math.round(monthRev).toLocaleString('de-AT'):'—'}</div>
          <div style="font-size:11px;color:#6b4844;margin-top:4px">${monthRev>0?'aus Kassabuch':'Noch keine Daten'}</div>
        </div>
      </div>
    </div>`;

  if (!hasLow) {
    document.getElementById('panel-kombis').innerHTML = dashHtml + `
      <div style="text-align:center;padding:60px 20px">
        <div style="width:64px;height:64px;border-radius:50%;background:#dcfce7;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
          <span class="material-symbols-outlined filled" style="font-size:32px;color:#16a34a">check_circle</span>
        </div>
        <h3 style="font-size:18px;font-weight:700;color:#261816;margin-bottom:6px">Alle Bestände in Ordnung</h3>
        <p style="font-size:13px;color:#5a403c;max-width:340px;margin:0 auto;line-height:1.6">
          Sobald Produkte unter ihr Minimum fallen, erscheinen hier die günstigsten Einkaufskombinationen.
        </p>
      </div>`;
    return;
  }

  // Warning banner — compact single line
  let html = dashHtml + `
    <div style="background:#ffdad6;border-left:3px solid #ba1a1a;border-radius:6px;padding:8px 12px;margin-bottom:20px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
      <span class="material-symbols-outlined" style="font-size:15px;color:#ba1a1a;flex-shrink:0">warning</span>
      <span style="font-size:12px;font-weight:700;color:#93000a;flex-shrink:0">${low.length} nachbestellen:</span>
      <span style="font-size:12px;color:#5a403c">${low.map(p => p.name).join(' · ')}</span>
    </div>`;

  if (missingPrices.length > 0) {
    html += `
      <div style="background:#fff8e1;border-left:3px solid #f59e0b;border-radius:6px;padding:8px 12px;margin:-8px 0 16px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <span class="material-symbols-outlined" style="font-size:15px;color:#f59e0b;flex-shrink:0">report</span>
        <span style="font-size:12px;font-weight:700;color:#7c5a00;flex-shrink:0">Preis-Lücken (${missingPrices.length}):</span>
        <span style="font-size:12px;color:#5a403c">${missingPrices.slice(0, 4).join(' · ')}${missingPrices.length > 4 ? ' …' : ''}</span>
      </div>`;
  }

  // Best combo = first two-shop combo, or first single-shop if none
  const bestCombo = two.length > 0 ? two[0] : (single.length > 0 ? single[0] : null);
  const altCombos = two.length > 0 ? two.slice(1) : [];
  const singleCombos = single;

  // ── Empfohlene Kombination ───────────────────────────────────
  if (bestCombo) {
    html += `
      <div style="margin-bottom:22px">
        <p style="font-size:11px;font-weight:700;color:#610000;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">★ Empfohlene Kombination</p>
        ${renderFeaturedCombo(bestCombo)}
      </div>`;
  }

  // ── Alternative Kombinationen (2-col grid, collapsible) ──────
  if (altCombos.length > 0) {
    html += `
      <div style="margin-bottom:22px">
        <p style="font-size:11px;font-weight:700;color:#6b4844;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Alternative Kombinationen (${altCombos.length})</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:8px">
          ${altCombos.map((c,i) => renderAltCombo(c, i+2)).join('')}
        </div>
      </div>`;
  }

  // ── Einzel-Geschäfte (3-col grid) ───────────────────────────
  if (singleCombos.length > 0) {
    html += `
      <div style="margin-bottom:22px">
        <p style="font-size:11px;font-weight:700;color:#6b4844;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Einzel-Geschäfte (${singleCombos.length})</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:8px">
          ${singleCombos.map((c,i) => renderSingleCombo(c, i+1)).join('')}
        </div>
      </div>`;
  }

  document.getElementById('panel-kombis').innerHTML = html;
}

// ── Empfohlene Kombi: kompakte Karte, 2-spaltige Shop-Ansicht ──
function renderFeaturedCombo(combo) {
  const byShop = {};
  for (const item of combo.items) {
    if (!byShop[item.shop.id]) byShop[item.shop.id] = { shop: item.shop, items: [], subtotal: 0 };
    byShop[item.shop.id].items.push(item);
    byShop[item.shop.id].subtotal += item.totalCost;
  }
  const shopGroups = Object.values(byShop);

  const shopSections = shopGroups.map(group => {
    const initials = group.shop.name.slice(0,2).toUpperCase();
    const rows = group.items.map(item => `
      <div class="product-row">
        <div class="product-row-check" onclick="this.classList.toggle('checked')"></div>
        <div class="product-row-name">
          <strong>${item.product.name}</strong>
          <span>${item.product.category} · ${item.quantity} ${item.product.unit}</span>
        </div>
        <div class="product-row-price">
          <span class="qty">${eur(item.pricePerUnit)}/${item.product.unit}</span>
          <span class="total">${eur(item.totalCost)}</span>
        </div>
      </div>`).join('');

    return `
      <div style="margin-bottom:16px">
        <div class="shop-header-card">
          <div class="shop-icon-circle" style="background:${group.shop.color}">${initials}</div>
          <span style="font-size:14px;font-weight:700;color:#261816">${group.shop.name}</span>
          <span class="shop-item-badge">${group.items.length} Item${group.items.length !== 1 ? 's' : ''}</span>
        </div>
        <div>${rows}</div>
        <div style="display:flex;justify-content:flex-end;padding:10px 16px;background:#fafafa;border-top:1px solid #f0e8e6">
          <span style="font-size:13px;color:#6b4844;font-weight:600;margin-right:8px">Subtotal ${group.shop.name}:</span>
          <span style="font-size:14px;font-weight:800;color:#610000">${eur(group.subtotal)}</span>
        </div>
      </div>`;
  }).join('');

  // Store combo data for floating bar
  window._featuredComboTotal = combo.totalCost;
  window._featuredComboId = combo.id;

  setTimeout(() => {
    const bar = document.getElementById('floating-checkout-bar');
    if (bar) {
      bar.classList.remove('bar-hidden');
      const totalEl = bar.querySelector('.floating-bar-total strong');
      if (totalEl) totalEl.textContent = eur(combo.totalCost);
    }
  }, 50);

  return `
    <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(139,0,0,0.08);border:1px solid #f0e8e6;position:relative">
      <span class="empfohlen-badge">★ EMPFOHLEN</span>
      <div style="padding:16px 16px 6px">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-right:110px">
          ${combo.shops.map(s => `<span style="background:${s.color};color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px">${s.name}</span>`).join('<span style="color:#c9b8b4;font-size:12px;margin:0 2px">+</span>')}
        </div>
      </div>
      <div style="padding:0 0 4px">${shopSections}</div>
      <div style="padding:14px 16px;border-top:1px solid #f0e8e6;display:flex;justify-content:space-between;align-items:center;background:#fafafa">
        <div style="display:flex;gap:8px;align-items:center">
          <button onclick="addComboToList('${combo.id}')"
            style="padding:8px 12px;border-radius:10px;border:1.5px solid #d1d5db;background:#fff;font-size:12px;font-weight:600;color:#374151;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px"
            onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='#fff'">
            <span class="material-symbols-outlined" style="font-size:15px">playlist_add</span> Zur Liste
          </button>
          <button onclick="printCombo('${combo.id}')"
            style="padding:8px 16px;border-radius:10px;border:1.5px solid #e3beb8;background:#fff;font-size:12px;font-weight:600;color:#5a403c;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px"
            onmouseover="this.style.background='#fff0ee'" onmouseout="this.style.background='#fff'">
            <span class="material-symbols-outlined" style="font-size:15px">print</span> Drucken
          </button>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end">
          ${combo.savings > 0 ? `<span style="font-size:12px;font-weight:700;color:#15803d;background:#dcfce7;border:1px solid #86efac;border-radius:999px;padding:3px 10px">💰 Spart ${eur(combo.savings)} vs. Einzel-Shop</span>` : ''}
        <div style="display:flex;align-items:baseline;gap:6px">
          <span style="font-size:13px;color:#6b4844;font-weight:600">Gesamt</span>
          <span style="font-size:26px;font-weight:800;color:#610000;font-family:'Plus Jakarta Sans',sans-serif;letter-spacing:-.02em">${eur(combo.totalCost)}</span>
        </div>
        </div>
      </div>
    </div>`;
}

// ── Alternative Kombi: kompakt, aufklappbar ────────────────────
function renderAltCombo(combo, rank) {
  const byShop = {};
  for (const item of combo.items) {
    if (!byShop[item.shop.id]) byShop[item.shop.id] = { shop: item.shop, items: [], subtotal: 0 };
    byShop[item.shop.id].items.push(item);
    byShop[item.shop.id].subtotal += item.totalCost;
  }
  const shopGroups = Object.values(byShop);
  const detailId = 'altd-' + combo.id;

  const detailRows = shopGroups.map(group => {
    const rows = group.items.map(item => `
      <div style="display:flex;justify-content:space-between;align-items:center;height:36px;border-bottom:1px solid #f5f0ee">
        <span style="font-size:12px;font-weight:600;color:#261816;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-right:8px">${item.product.name}</span>
        <div style="display:flex;gap:5px;flex-shrink:0">
          <span style="font-size:11px;color:#6b4844">${item.quantity}×</span>
          <span style="font-size:12px;font-weight:700;color:#261816">${eur(item.totalCost)}</span>
        </div>
      </div>`).join('');

    const shopHead = shopGroups.length > 1 ? `
      <div style="display:flex;justify-content:space-between;padding:5px 0 2px;border-bottom:2px solid ${group.shop.color}55">
        <span style="font-size:11px;font-weight:700;color:${group.shop.color}">${group.shop.name}</span>
        <span style="font-size:11px;font-weight:600;color:#5a403c">${eur(group.subtotal)}</span>
      </div>` : '';

    return `<div style="margin-bottom:6px">${shopHead}${rows}</div>`;
  }).join('');

  const shopBadges = combo.shops.map(s =>
    `<span style="background:${s.color};color:#fff;font-size:11px;font-weight:700;padding:1px 7px;border-radius:4px">${s.name}</span>`
  ).join('<span style="color:#6b4844;font-size:11px;margin:0 1px">+</span>');

  return `
    <div class="alt-combo-card" style="border-left:4px solid ${combo.shops[0]?.color || '#8B0000'}">
      <div style="padding:10px 14px;display:flex;align-items:center;gap:7px;cursor:pointer;user-select:none"
           onclick="(function(el){var d=document.getElementById('${detailId}');var open=d.style.display!=='none';d.style.display=open?'none':'block';el.querySelector('.chev').style.transform=open?'rotate(0deg)':'rotate(180deg)';})(this)">
        <span style="font-size:11px;color:#6b4844;font-weight:700;flex-shrink:0">#${rank}</span>
        <div style="display:flex;gap:4px;flex-wrap:wrap;flex:1;align-items:center">${shopBadges}</div>
        <button onclick="event.stopPropagation();printCombo('${combo.id}')"
          style="padding:4px 9px;border-radius:6px;border:1px solid #e3beb8;background:#fff;font-size:11px;color:#5a403c;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:3px;flex-shrink:0"
          onmouseover="this.style.background='#fff0ee'" onmouseout="this.style.background='#fff'">
          <span class="material-symbols-outlined" style="font-size:13px">print</span>
        </button>
        <span style="font-size:16px;font-weight:800;color:#261816;letter-spacing:-.01em;flex-shrink:0">${eur(combo.totalCost)}</span>
        <span class="material-symbols-outlined chev" style="font-size:16px;color:#6b4844;transition:transform .2s;flex-shrink:0">expand_more</span>
      </div>
      <div id="${detailId}" style="display:none;padding:8px 12px 12px;border-top:1px solid #e3beb8;background:#fafafa">
        ${detailRows}
      </div>
    </div>`;
}

// ── Einzel-Geschäft: sehr kompakt, 3-spaltig ──────────────────
function renderSingleCombo(combo, rank) {
  const byShop = {};
  for (const item of combo.items) {
    if (!byShop[item.shop.id]) byShop[item.shop.id] = { shop: item.shop, items: [], subtotal: 0 };
    byShop[item.shop.id].items.push(item);
    byShop[item.shop.id].subtotal += item.totalCost;
  }
  const group = Object.values(byShop)[0];
  const detailId = 'sngd-' + combo.id;

  const detailRows = group.items.map(item => `
    <div style="display:flex;justify-content:space-between;align-items:center;height:34px;border-bottom:1px solid #f5f0ee">
      <span style="font-size:12px;font-weight:600;color:#261816;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-right:6px">${item.product.name}</span>
      <div style="display:flex;gap:4px;flex-shrink:0">
        <span style="font-size:11px;color:#6b4844">${item.quantity}×</span>
        <span style="font-size:12px;font-weight:700;color:#261816">${eur(item.totalCost)}</span>
      </div>
    </div>`).join('');

  return `
    <div style="border-radius:10px;border:1px solid #e3beb8;overflow:hidden;background:#fff">
      <div style="padding:8px 10px;border-bottom:2px solid ${combo.shops[0].color};display:flex;align-items:center;gap:6px;cursor:pointer"
           onclick="(function(){var d=document.getElementById('${detailId}');d.style.display=d.style.display!=='none'?'none':'block';})()">
        <span style="font-size:13px;font-weight:700;color:${combo.shops[0].color};flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${combo.shops[0].name}</span>
        <button onclick="event.stopPropagation();printCombo('${combo.id}')"
          style="padding:3px 6px;border-radius:5px;border:1px solid #e3beb8;background:#fff;cursor:pointer;display:flex;align-items:center;flex-shrink:0"
          onmouseover="this.style.background='#fff0ee'" onmouseout="this.style.background='#fff'">
          <span class="material-symbols-outlined" style="font-size:12px;color:#5a403c">print</span>
        </button>
        <span style="font-size:15px;font-weight:800;color:#261816;flex-shrink:0">${eur(combo.totalCost)}</span>
      </div>
      <div id="${detailId}" style="display:none;padding:6px 10px 10px;background:#fafafa">
        ${detailRows}
      </div>
    </div>`;
}

// ═══════════════════════════════════════════════════════════════
// TAB SWITCHING
// ═══════════════════════════════════════════════════════════════
// ── Responsive Nav: Datenquelle & Sync ──────────────────────────
// ═══════════════════════════════════════════════════════════════

const NAV_GROUPS = [
  { id:'kombis',   icon:'shopping_cart',   label:'Kombis',    tabs:['kombis'],                                          mobile:true  },
  { id:'einkauf',  icon:'receipt_long',    label:'Einkauf',   tabs:['angebote','einkaufsliste','suche','upload','verlauf'], mobile:true  },
  { id:'lager',    icon:'inventory_2',     label:'Lager',     tabs:['lager','wareneinsatz','preisalarm','standardmaterial'], mobile:true  },
  { id:'betrieb',  icon:'checklist',       label:'Betrieb',   tabs:['heute','fehlmaterial','checkliste','bestellung','schichtcheck','haccp','mhd','kassenschnitt'], mobile:true  },
  { id:'team',     icon:'groups',          label:'Team',      tabs:['dienstplan','aufgaben','mitarbeiter','urlaub','trinkgeld'], mobile:false },
  { id:'analyse',  icon:'analytics',       label:'Analyse',   tabs:['dashboard','statistik','umsatz','gewinn','buchhaltung'], mobile:false },
  { id:'karte',    icon:'restaurant_menu', label:'Karte',     tabs:['speisekarte','tagesangebote','lieferanten','geschaefte','konkurrenz','bewertungen'], mobile:false },
];

function _syncNavActiveStates(tab) {
  // Desktop: highlight group that contains tab
  NAV_GROUPS.forEach(grp => {
    const isActive = grp.tabs.includes(tab) || grp.id === tab;
    const btn = document.querySelector(`#staff-tab-bar [data-nav-grp="${grp.id}"]`);
    if (btn) btn.classList.toggle('tab-active', isActive);
    // direct kombis button
    if (grp.id === 'kombis') {
      const direct = document.querySelector('#staff-tab-bar [data-nav-tab="kombis"]');
      if (direct) direct.classList.toggle('tab-active', tab === 'kombis');
    }
  });
  // Tablet sidebar: highlight group
  NAV_GROUPS.forEach(grp => {
    const isActive = grp.tabs.includes(tab) || grp.id === tab;
    const tsBtn = document.querySelector(`#tablet-sidebar [data-ts-grp="${grp.id}"]`);
    if (tsBtn) tsBtn.classList.toggle('ts-active', isActive);
  });
  // Tablet sidebar: business lock icon
  const tsBizBtn = document.getElementById('ts-biz-btn');
  if (tsBizBtn) tsBizBtn.classList.toggle('ts-active', tab === 'business');
  // Mobile bottom nav: highlight matching button
  document.querySelectorAll('[data-mob-nav]').forEach(el => {
    const grp = NAV_GROUPS.find(g => g.id === el.dataset.mobNav);
    const isActive = grp ? (grp.tabs.includes(tab) || grp.id === tab) : el.dataset.mobNav === tab;
    el.classList.toggle('mob-active', isActive);
  });
  // Mobile Mehr button: active if tab lives outside the 3 visible mobile groups
  const mobileDirectIds = NAV_GROUPS.filter(g => g.mobile).map(g => g.id);
  const mobileDirectTabs = NAV_GROUPS.filter(g => g.mobile).flatMap(g => g.tabs).concat(NAV_GROUPS.filter(g => g.mobile).map(g => g.id));
  const mehrBtn = document.getElementById('mob-mehr-btn');
  if (mehrBtn) mehrBtn.classList.toggle('mob-active', !mobileDirectTabs.includes(tab) && tab !== 'business');
  // Mobile bottom-nav: direkte Tab-Buttons aktiv setzen
  document.querySelectorAll('[data-bottom-nav]').forEach(el => {
    const isActive = el.dataset.bottomNav === tab;
    el.classList.toggle('mob-active', isActive);
    const lbl = el.querySelector('.mob-nav-label');
    if (lbl) lbl.style.color = isActive ? '#8B0000' : '#5a403c';
  });
  // Bottom sheet items
  document.querySelectorAll('[data-bs-tab]').forEach(el => {
    el.classList.toggle('bs-active', el.dataset.bsTab === tab);
  });
}

function tsSidebarToggle(grpId) {
  // Toggle sub-items visibility in tablet sidebar
  const grpEl = document.getElementById(`tsg-${grpId}`);
  if (!grpEl) return;
  const isOpen = grpEl.classList.contains('ts-open');
  // Alle Gruppen schliessen
  document.querySelectorAll('#tablet-sidebar .ts-group').forEach(el => el.classList.remove('ts-open'));
  // Diese Gruppe öffnen (wenn sie vorher zu war)
  if (!isOpen) grpEl.classList.add('ts-open');
}

// ═══════════════════════════════════════════════════════════════
// RENDER — HEUTE TAB
// ═══════════════════════════════════════════════════════════════

function renderHeuteTab() {
  const panel = document.getElementById('panel-heute');
  if (!panel) return;
  let dienstplan = {}; let aufgaben = []; let schichtcheck = {}; let mitarbeiter = [];
  try { dienstplan   = JSON.parse(localStorage.getItem('pizzeria_dienstplan')   || '{}'); } catch(_) {}
  try { aufgaben     = JSON.parse(localStorage.getItem('pizzeria_aufgaben')     || '[]'); } catch(_) {}
  try { schichtcheck = JSON.parse(localStorage.getItem('pizzeria_schichtcheck') || '{}'); } catch(_) {}
  try { mitarbeiter  = JSON.parse(localStorage.getItem('pizzeria_mitarbeiter')  || '[]'); } catch(_) {}
  const today = new Date();
  const weekKey = weekKeyFromDate(today);
  const dayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const DAYS = ['Mo','Di','Mi','Do','Fr','Sa','So'];
  const dayKey = DAYS[dayIndex];
  const wochentagDE = today.toLocaleDateString('de-DE', { weekday: 'long' });
  const datumDE = today.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
  const SCHICHT_ZEITEN = {
    'Früh (08-16)':  { label: 'Frühschicht',  von: '08:00', bis: '16:00', farbe: '#2e7d32', bg: '#f0fdf4', dot: '#22c55e' },
    'Spät (14-22)':  { label: 'Spätschicht',  von: '14:00', bis: '22:00', farbe: '#b45309', bg: '#fffbeb', dot: '#f59e0b' },
    'Nacht (20-04)': { label: 'Nachtschicht', von: '20:00', bis: '04:00', farbe: '#1e40af', bg: '#eff6ff', dot: '#3b82f6' },
    'Frei':          { label: 'Frei',          von: null,    bis: null,    farbe: '#6b7280', bg: '#f9fafb', dot: '#9ca3af' },
  };
  const wochenplanRaw = {};
  try { Object.assign(wochenplanRaw, JSON.parse(localStorage.getItem('pizzeria_wochenplan') || '{}')); } catch(_) {}
  const weekPlanRaw = wochenplanRaw[weekKey] || {};
  const tagPlan = (dienstplan[weekKey] || {})[dayKey] || {};
  const heutigeTeam = [];
  for (const ma of mitarbeiter) {
    const schichtName = tagPlan[ma.id];
    if (schichtName && schichtName !== 'Frei') heutigeTeam.push({ ma, schichtName, info: SCHICHT_ZEITEN[schichtName] || null });
  }
  const wochenplanTeam = [];
  for (const ma of mitarbeiter) {
    const shift = (weekPlanRaw[ma.id] || {})[dayIndex];
    if (shift && shift.von && shift.bis) wochenplanTeam.push({ ma, von: shift.von, bis: shift.bis });
  }
  const ersteSchicht = heutigeTeam[0] || null;
  const ersteWpSchicht = wochenplanTeam[0] || null;
  const offeneAufgaben = aufgaben.filter(a => !a.erledigt);
  const dringendCount = offeneAufgaben.filter(a => a.prioritaet === 'dringend' || a.dringend).length;
  const normalCount = offeneAufgaben.filter(a => !a.prioritaet || a.prioritaet === 'normal' || (!a.dringend && a.prioritaet !== 'dringend')).length;
  const top3Aufgaben = offeneAufgaben.slice(0, 3);
  const ckOeffnung = schichtcheck['oeffnung'] || {};
  const ckSchliessung = schichtcheck['schliessung'] || {};
  const ckItems = schichtcheck['items'] || { oeffnung: [], schliessung: [] };
  const defaultOeffnung = ['Kasse öffnen','Herd vorheizen','Zutaten prüfen','Teig vorbereiten','Getränke auffüllen','Sauberkeit prüfen','Beleuchtung','Öffnungszeit eintragen'];
  const defaultSchliessung = ['Kasse abrechnen','Reste einräumen','Herd ausschalten','Reinigung','Abfall entsorgen','Kühlschrank prüfen','Türen schließen','Schichtübergabe'];
  const oeffItems = (ckItems.oeffnung && ckItems.oeffnung.length) ? ckItems.oeffnung : defaultOeffnung;
  const schlItems = (ckItems.schliessung && ckItems.schliessung.length) ? ckItems.schliessung : defaultSchliessung;
  const oeffDone = oeffItems.filter((_, i) => ckOeffnung[i]).length;
  const schlDone = schlItems.filter((_, i) => ckSchliessung[i]).length;
  function _hProgressStatus(done, total) {
    if (total === 0) return { label: '—', farbe: '#4b5563', bg: '#e9ecef' };
    const p = done / total;
    if (p === 1)  return { label: '✅ Fertig',    farbe: '#16a34a', bg: '#f0fdf4' };
    if (p >= 0.5) return { label: '🟡 In Arbeit', farbe: '#d97706', bg: '#fffbeb' };
    if (p > 0)    return { label: '🟠 Begonnen',  farbe: '#ea580c', bg: '#fff7ed' };
    return              { label: '⚪ Noch nicht', farbe: '#374151', bg: '#e9ecef' };
  }
  function _hProgressBar(done, total, farbe) {
    const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
    return `<div style="height:10px;background:#e5e7eb;border-radius:5px;overflow:hidden;margin:6px 0"><div style="height:100%;width:${pct}%;background:${farbe};border-radius:5px;transition:width .3s"></div></div>`;
  }
  const oeffStatus = _hProgressStatus(oeffDone, oeffItems.length);
  const schlStatus = _hProgressStatus(schlDone, schlItems.length);
  if (typeof _renderInboxSection === 'function') {
    _renderInboxSection().then(inboxHtml => {
      const el = document.getElementById('_heute-inbox-container');
      if (el && inboxHtml) el.innerHTML = inboxHtml;
    });
  }
  let kachel1Html = '';
  if (ersteSchicht) {
    const info = ersteSchicht.info || {};
    kachel1Html = `<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px"><span style="width:14px;height:14px;border-radius:50%;background:${info.dot||'#8B0000'};display:inline-block;flex-shrink:0"></span><span style="font-size:20px;font-weight:800;color:${info.farbe||'#8B0000'}">${info.label||ersteSchicht.schichtName}</span></div>${info.von?`<p style="font-size:18px;font-weight:700;color:#261816;margin:0 0 14px">${info.von} – ${info.bis} Uhr</p>`:''}`;
  } else if (ersteWpSchicht) {
    kachel1Html = `<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px"><span style="width:14px;height:14px;border-radius:50%;background:#22c55e;display:inline-block;flex-shrink:0"></span><span style="font-size:20px;font-weight:800;color:#2e7d32">Schicht heute</span></div><p style="font-size:18px;font-weight:700;color:#261816;margin:0 0 14px">${ersteWpSchicht.von} – ${ersteWpSchicht.bis} Uhr</p>`;
  } else {
    kachel1Html = `<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px"><span style="width:14px;height:14px;border-radius:50%;background:#6b7280;display:inline-block;flex-shrink:0"></span><span style="font-size:18px;font-weight:700;color:#374151">Kein Schichtplan eingetragen</span></div><p style="font-size:14px;color:#4b5563;margin:0 0 14px">Dienstplan im Mitarbeiter-Tab pflegen</p>`;
  }
  const teamAnzeige = wochenplanTeam.length > 0 ? wochenplanTeam : heutigeTeam.map(h => ({ ma: h.ma }));
  kachel1Html += `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span style="font-size:14px;color:#5a403c;font-weight:600">Team heute:</span>${teamAnzeige.length === 0 ? '<span style="font-size:14px;color:#5a6472">Noch nicht geplant</span>' : teamAnzeige.map(t=>`<span style="background:${t.ma.farbe||'#8B0000'}22;color:${t.ma.farbe||'#8B0000'};border:1px solid ${t.ma.farbe||'#8B0000'}44;border-radius:20px;padding:4px 12px;font-size:13px;font-weight:600">${escHtml(t.ma.name)}</span>`).join('')}</div>`;
  // MHD-Warnungen berechnen
  let mhdAbgelaufenListe = [], mhdBaldListe = [];
  try {
    const mhdProdukte = JSON.parse(localStorage.getItem('psc_mhd') || '[]');
    const heuteD2 = new Date(); heuteD2.setHours(0,0,0,0);
    mhdProdukte.forEach(p => {
      const dt = new Date(p.mhd); dt.setHours(0,0,0,0);
      const diff = Math.round((dt - heuteD2) / 86400000);
      if (diff < 0) mhdAbgelaufenListe.push({ ...p, diff });
      else if (diff <= 3) mhdBaldListe.push({ ...p, diff });
    });
  } catch(_) {}
  const mhdWarnHtml = (mhdAbgelaufenListe.length > 0 || mhdBaldListe.length > 0) ? `
  <div style="background:#fff;border-radius:16px;padding:20px;box-shadow:0 2px 12px rgba(0,0,0,0.08);border:2px solid #fca5a5">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
      <span style="font-size:24px">⚠️</span>
      <h3 style="font-size:18px;font-weight:800;color:#dc2626;margin:0">MHD-Warnung</h3>
    </div>
    ${mhdAbgelaufenListe.length > 0 ? `<div style="margin-bottom:10px"><div style="font-size:13px;font-weight:700;color:#dc2626;margin-bottom:6px">🔴 Abgelaufen (${mhdAbgelaufenListe.length})</div>${mhdAbgelaufenListe.map(p=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:#fef2f2;border-radius:8px;margin-bottom:4px"><span style="font-size:14px;font-weight:600;color:#261816">${escHtml(p.name||p.produkt||'Produkt')}</span><span style="font-size:12px;font-weight:700;color:#dc2626">${Math.abs(p.diff)} Tag${Math.abs(p.diff)!==1?'e':''} überfällig</span></div>`).join('')}</div>` : ''}
    ${mhdBaldListe.length > 0 ? `<div><div style="font-size:13px;font-weight:700;color:#d97706;margin-bottom:6px">🟡 Bald fällig (${mhdBaldListe.length})</div>${mhdBaldListe.map(p=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:#fffbeb;border-radius:8px;margin-bottom:4px"><span style="font-size:14px;font-weight:600;color:#261816">${escHtml(p.name||p.produkt||'Produkt')}</span><span style="font-size:12px;font-weight:700;color:#d97706">${p.diff===0?'Heute!':p.diff+' Tag'+(p.diff!==1?'e':'')}</span></div>`).join('')}</div>` : ''}
    <button onclick="switchTab('mhd')" style="width:100%;min-height:44px;padding:10px 16px;background:#dc2626;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-top:12px" onmouseover="this.style.background='#b91c1c'" onmouseout="this.style.background='#dc2626'">→ MHD-Verwaltung öffnen</button>
  </div>` : '';
  let html = `<div id="_heute-inbox-container"></div><div style="margin-bottom:24px"><h2 style="font-size:22px;font-weight:800;color:#261816;margin:0 0 4px">Guten Tag — ${wochentagDE}, ${datumDE}</h2><p style="font-size:15px;color:#5a403c;margin:0">Übersicht für heute</p></div><div style="display:flex;flex-direction:column;gap:16px">${mhdWarnHtml}`;
  html += `<div style="background:#fff;border-radius:16px;padding:20px;box-shadow:0 2px 12px rgba(0,0,0,0.08);border:1px solid #e3beb8"><div style="display:flex;align-items:center;gap:10px;margin-bottom:16px"><span style="font-size:24px">👤</span><h3 style="font-size:20px;font-weight:800;color:#261816;margin:0">Meine Schicht heute</h3></div>${kachel1Html}</div>`;
  const aufgabenBody = offeneAufgaben.length === 0
    ? `<div style="text-align:center;padding:16px 0"><span style="font-size:32px">✅</span><p style="font-size:15px;font-weight:700;color:#16a34a;margin:8px 0 4px">Alle Aufgaben erledigt!</p></div>`
    : `<div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">${dringendCount>0?`<span style="background:#fef2f2;border:1px solid #fecaca;border-radius:20px;padding:6px 14px;font-size:14px;font-weight:700;color:#dc2626">🔴 ${dringendCount} dringend</span>`:''} ${normalCount>0?`<span style="background:#fffbeb;border:1px solid #fde68a;border-radius:20px;padding:6px 14px;font-size:14px;font-weight:700;color:#d97706">🟡 ${normalCount} normal</span>`:''}</div><ul style="margin:0 0 16px;padding:0;list-style:none">${top3Aufgaben.map(a=>{const d=a.prioritaet==='dringend'||a.dringend;return`<li style="display:flex;align-items:flex-start;gap:8px;padding:8px 0;border-bottom:1px solid #f3f4f6"><span style="flex-shrink:0">${d?'🔴':'🟡'}</span><span style="font-size:15px;color:#261816;font-weight:600">${escHtml(a.titel||a.name||'Aufgabe')}${d?' <span style="font-size:11px;font-weight:700;color:#dc2626;background:#fee2e2;padding:1px 6px;border-radius:4px">DRINGEND</span>':''}</span></li>`;}).join('')}</ul>`;
  html += `<div style="background:#fff;border-radius:16px;padding:20px;box-shadow:0 2px 12px rgba(0,0,0,0.08);border:1px solid #e3beb8"><div style="display:flex;align-items:center;gap:10px;margin-bottom:16px"><span style="font-size:24px">📋</span><h3 style="font-size:20px;font-weight:800;color:#261816;margin:0">Aufgaben</h3></div>${aufgabenBody}<button onclick="switchTab('aufgaben')" style="width:100%;min-height:48px;padding:12px 16px;background:#8B0000;color:#fff;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px" onmouseover="this.style.background='#6b0000'" onmouseout="this.style.background='#8B0000'"><span style="font-size:18px">→</span> Alle Aufgaben anzeigen</button></div>`;
  html += `<div style="background:#fff;border-radius:16px;padding:20px;box-shadow:0 2px 12px rgba(0,0,0,0.08);border:1px solid #e3beb8"><div style="display:flex;align-items:center;gap:10px;margin-bottom:16px"><span style="font-size:24px">☑️</span><h3 style="font-size:20px;font-weight:800;color:#261816;margin:0">Schicht-Checkliste</h3></div><div style="display:flex;flex-direction:column;gap:14px;margin-bottom:16px"><div style="background:${oeffStatus.bg};border-radius:12px;padding:14px 16px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><span style="font-size:16px;font-weight:700;color:#261816">Öffnung</span><span style="font-size:15px;font-weight:700;color:${oeffStatus.farbe}">${oeffStatus.label}</span></div><div style="font-size:14px;color:#5a403c;margin-bottom:6px">${oeffDone} / ${oeffItems.length} erledigt</div>${_hProgressBar(oeffDone,oeffItems.length,oeffStatus.farbe)}</div><div style="background:${schlStatus.bg};border-radius:12px;padding:14px 16px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><span style="font-size:16px;font-weight:700;color:#261816">Schließung</span><span style="font-size:15px;font-weight:700;color:${schlStatus.farbe}">${schlStatus.label}</span></div><div style="font-size:14px;color:#5a403c;margin-bottom:6px">${schlDone} / ${schlItems.length} erledigt</div>${_hProgressBar(schlDone,schlItems.length,schlStatus.farbe)}</div></div><button onclick="switchTab('schichtcheck')" style="width:100%;min-height:48px;padding:12px 16px;background:#8B0000;color:#fff;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px" onmouseover="this.style.background='#6b0000'" onmouseout="this.style.background='#8B0000'"><span style="font-size:18px">→</span> Zur Checkliste</button></div>`;
  // ── Kassenbuch Schnell-Karte ──
  let kbEin=0, kbAus=0;
  try {
    const kbAll = kbGet();
    const todayStr = new Date().toISOString().slice(0,10);
    kbAll.forEach(e => {
      if ((e.datum||'').slice(0,10)===todayStr) {
        if(e.typ==='einnahme') kbEin += parseFloat(e.brutto||0);
        else kbAus += parseFloat(e.brutto||0);
      }
    });
  } catch(_) {}
  html += `<div style="background:var(--surface);border-radius:16px;padding:20px;box-shadow:0 2px 12px rgba(0,0,0,0.06);border:1px solid var(--border)">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
      <span style="font-size:24px">💰</span>
      <h3 style="font-size:16px;font-weight:800;color:var(--text);margin:0">Kassenbuch heute</h3>
      <div style="margin-left:auto;display:flex;gap:12px">
        <span style="font-size:13px;font-weight:700;color:#2e7d32">+${kbEin.toFixed(2).replace('.',',')} €</span>
        <span style="font-size:13px;font-weight:700;color:#c62828">−${kbAus.toFixed(2).replace('.',',')} €</span>
        <span style="font-size:13px;font-weight:800;color:${kbEin-kbAus>=0?'#1b5e20':'#b71c1c'}">=&nbsp;${(kbEin-kbAus).toFixed(2).replace('.',',')} €</span>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr auto auto;gap:8px;align-items:end">
      <select id="heute-kb-typ" style="padding:10px;border-radius:10px;border:1.5px solid var(--border);font-size:13px;font-family:inherit;background:var(--surface);color:var(--text)">
        <option value="einnahme">Einnahme</option>
        <option value="ausgabe">Ausgabe</option>
      </select>
      <input id="heute-kb-desc" type="text" placeholder="Beschreibung" style="padding:10px;border-radius:10px;border:1.5px solid var(--border);font-size:13px;font-family:inherit;background:var(--surface);color:var(--text);box-sizing:border-box">
      <input id="heute-kb-betrag" type="number" step="0.01" min="0" placeholder="Brutto €" style="width:110px;padding:10px;border-radius:10px;border:1.5px solid var(--border);font-size:13px;font-family:inherit;background:var(--surface);color:var(--text);box-sizing:border-box">
      <button onclick="heuteKbQuickAdd()" style="padding:10px 16px;border-radius:10px;border:none;background:#610000;color:#fff;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap">+ Speichern</button>
    </div>
  </div>`;

  // ── Tagesabschluss + Tagesbericht ──
  html += `<div style="background:linear-gradient(135deg,#610000,#8b0000);border-radius:16px;padding:20px;box-shadow:0 4px 16px rgba(97,0,0,0.3)">
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
      <div>
        <div style="font-weight:800;font-size:16px;color:#fff;display:flex;align-items:center;gap:8px"><span style="font-size:22px">🌙</span>Tagesabschluss</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.8);margin-top:3px">Alle Zahlen sammeln, speichern & PDF erstellen</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button onclick="tagesabschlussErstellen()" style="padding:11px 22px;border-radius:10px;border:2px solid rgba(255,255,255,0.5);background:rgba(255,255,255,0.15);color:#fff;font-size:14px;font-weight:800;cursor:pointer;white-space:nowrap">🌙 Tagesabschluss erstellen</button>
        <button onclick="syncTagesberichtNotion()" style="padding:11px 18px;border-radius:10px;border:1px solid rgba(255,255,255,0.3);background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.9);font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap">📋 → Notion</button>
      </div>
    </div>
  </div>`;

  // ── Tagesabschluss-Verlauf ──
  var taVerlauf = []; try { taVerlauf = JSON.parse(localStorage.getItem('pizzeria_tagesberichte')||'[]'); } catch(_) {}
  if (taVerlauf.length > 0) {
    html += `<div style="background:var(--surface);border-radius:16px;padding:20px;border:1px solid var(--border)">
      <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:12px">📅 Letzte Tagesabschlüsse</div>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:var(--bg)">
          <th style="padding:7px 10px;text-align:left;font-size:11px;font-weight:700;color:var(--text-3)">Datum</th>
          <th style="padding:7px 10px;text-align:right;font-size:11px;font-weight:700;color:var(--text-3)">Einnahmen</th>
          <th style="padding:7px 10px;text-align:right;font-size:11px;font-weight:700;color:var(--text-3)">Ausgaben</th>
          <th style="padding:7px 10px;text-align:right;font-size:11px;font-weight:700;color:var(--text-3)">Saldo</th>
          <th style="padding:7px 10px;text-align:right;font-size:11px;font-weight:700;color:var(--text-3)">Kassendiff</th>
          <th style="padding:7px 10px;text-align:center;font-size:11px;font-weight:700;color:var(--text-3)">PDF</th>
        </tr></thead><tbody>`;
    taVerlauf.slice(0,30).forEach(function(ta) {
      var saldo = (ta.einnahmen||0) - (ta.ausgaben||0);
      var ksD = ta.kassenschnitt_differenz;
      html += `<tr style="border-bottom:1px solid var(--border)">
        <td style="padding:7px 10px;font-size:12px;color:var(--text)">${ta.datum||''}</td>
        <td style="padding:7px 10px;font-size:12px;color:#2e7d32;text-align:right;font-weight:600">+${parseFloat(ta.einnahmen||0).toFixed(2).replace('.',',')} €</td>
        <td style="padding:7px 10px;font-size:12px;color:#c62828;text-align:right">−${parseFloat(ta.ausgaben||0).toFixed(2).replace('.',',')} €</td>
        <td style="padding:7px 10px;font-size:12px;font-weight:700;color:${saldo>=0?'#1b5e20':'#b71c1c'};text-align:right">${saldo.toFixed(2).replace('.',',')} €</td>
        <td style="padding:7px 10px;font-size:12px;color:${ksD!=null?(ksD<-1?'#c62828':ksD>1?'#2e7d32':'var(--text-2)'):'var(--text-3)'};text-align:right">${ksD!=null?(ksD>=0?'+':'')+ksD.toFixed(2).replace('.',',')+'€':'—'}</td>
        <td style="padding:7px 10px;text-align:center"><button onclick="tagesabschlussPdf('${ta.datum||''}')" style="padding:3px 8px;border-radius:6px;border:1px solid var(--border);background:var(--surface);color:var(--red);font-size:11px;cursor:pointer">PDF</button></td>
      </tr>`;
    });
    html += `</tbody></table></div>`;
  }

  html += `</div>`;
  panel.innerHTML = html;
}

async function heuteKbQuickAdd() {
  const typ    = document.getElementById('heute-kb-typ')?.value || 'einnahme';
  const desc   = document.getElementById('heute-kb-desc')?.value.trim();
  const betrag = parseFloat(document.getElementById('heute-kb-betrag')?.value || 0);
  if (!desc) { _showToast('Bitte Beschreibung eingeben', 'error'); return; }
  if (betrag <= 0) { _showToast('Bitte Betrag eingeben', 'error'); return; }
  const entry = { id: Date.now().toString(36), datum: new Date().toISOString(), typ, beschreibung: desc, netto: (betrag/1.1).toFixed(2), mwst_satz: 10, mwst_betrag: (betrag-betrag/1.1).toFixed(2), brutto: betrag.toFixed(2) };
  try { await fetch('/api/kassenbuch', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(entry) }); } catch(_) {}
  await kbSync();
  _showToast((typ==='einnahme'?'Einnahme':'Ausgabe')+' '+betrag.toFixed(2)+' € gespeichert ✓', 'success');
  renderHeuteTab();
}

function tagesabschlussErstellen() {
  var datum = new Date().toISOString().slice(0,10);
  var kbAll = []; try { kbAll = kbGet(); } catch(_) {}
  var einnahmen = kbAll.filter(function(e){ return (e.datum||'').slice(0,10)===datum && e.typ==='einnahme'; }).reduce(function(s,e){ return s+parseFloat(e.brutto||0); },0);
  var ausgaben  = kbAll.filter(function(e){ return (e.datum||'').slice(0,10)===datum && e.typ==='ausgabe';  }).reduce(function(s,e){ return s+parseFloat(e.brutto||0); },0);
  var saldo = einnahmen - ausgaben;
  var ksAll = []; try { ksAll = JSON.parse(localStorage.getItem('pizzeria_kassenschnitt')||'[]'); } catch(_) {}
  var ks = ksAll.find(function(e){ return e.datum===datum; }) || {};
  var ksDiff = (ks.ist != null && ks.soll != null) ? (parseFloat(ks.ist)-parseFloat(ks.soll)) : null;
  var offeneAufgaben = 0; try { offeneAufgaben = JSON.parse(localStorage.getItem('pizzeria_aufgaben')||'[]').filter(function(e){ return !e.erledigt; }).length; } catch(_) {}
  var fehlmaterial = 0; try { fehlmaterial = JSON.parse(localStorage.getItem('pizzeria_fehlmaterial')||'[]').length; } catch(_) {}
  var eintrag = { id: Date.now().toString(36), datum: datum, einnahmen: einnahmen, ausgaben: ausgaben, saldo: saldo, kassenschnitt_differenz: ksDiff, offene_aufgaben: offeneAufgaben, fehlmaterial: fehlmaterial, erstellt: new Date().toISOString() };
  var liste = []; try { liste = JSON.parse(localStorage.getItem('pizzeria_tagesberichte')||'[]'); } catch(_) {}
  liste = liste.filter(function(e){ return e.datum!==datum; });
  liste.unshift(eintrag);
  if (liste.length > 90) liste = liste.slice(0,90);
  _safeLocalSet('pizzeria_tagesberichte', JSON.stringify(liste));
  var fmt = function(n){ return parseFloat(n||0).toFixed(2).replace('.',','); };
  var modalHtml = '<div style="position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px" id="ta-modal-bg" onclick="if(event.target===this)document.getElementById(\'ta-modal-bg\').remove()">'
    +'<div style="background:#fff;border-radius:20px;padding:28px;max-width:460px;width:100%;box-shadow:0 8px 40px rgba(0,0,0,0.18)">'
    +'<div style="text-align:center;margin-bottom:20px"><span style="font-size:40px">🌙</span><h2 style="font-size:22px;font-weight:800;color:#261816;margin:8px 0 2px">Tagesabschluss</h2><div style="font-size:13px;color:#5a403c">'+datum+'</div></div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px">'
    +'<div style="background:#f0fdf4;border-radius:12px;padding:14px;text-align:center"><div style="font-size:11px;font-weight:700;color:#16a34a;text-transform:uppercase;margin-bottom:4px">Einnahmen</div><div style="font-size:22px;font-weight:800;color:#2e7d32">+'+fmt(einnahmen)+' €</div></div>'
    +'<div style="background:#fef2f2;border-radius:12px;padding:14px;text-align:center"><div style="font-size:11px;font-weight:700;color:#dc2626;text-transform:uppercase;margin-bottom:4px">Ausgaben</div><div style="font-size:22px;font-weight:800;color:#c62828">−'+fmt(ausgaben)+' €</div></div>'
    +'<div style="background:'+(saldo>=0?'#f0fdf4':'#fef2f2')+';border-radius:12px;padding:14px;text-align:center"><div style="font-size:11px;font-weight:700;color:#374151;text-transform:uppercase;margin-bottom:4px">Saldo</div><div style="font-size:22px;font-weight:800;color:'+(saldo>=0?'#1b5e20':'#b71c1c')+'">'+fmt(saldo)+' €</div></div>'
    +'<div style="background:#f8fafc;border-radius:12px;padding:14px;text-align:center"><div style="font-size:11px;font-weight:700;color:#374151;text-transform:uppercase;margin-bottom:4px">Kassendiff</div><div style="font-size:22px;font-weight:800;color:'+(ksDiff!=null?(ksDiff<-1?'#c62828':ksDiff>1?'#2e7d32':'#374151'):'#9ca3af')+'">'+(ksDiff!=null?(ksDiff>=0?'+':'')+fmt(ksDiff)+' €':'—')+'</div></div>'
    +'</div>'
    +'<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">'
    +'<div style="background:#fffbeb;border-radius:10px;padding:10px 14px;flex:1;text-align:center"><div style="font-size:11px;font-weight:700;color:#d97706">Offene Aufgaben</div><div style="font-size:18px;font-weight:800;color:#374151">'+offeneAufgaben+'</div></div>'
    +'<div style="background:#eff6ff;border-radius:10px;padding:10px 14px;flex:1;text-align:center"><div style="font-size:11px;font-weight:700;color:#1d4ed8">Fehlmaterial</div><div style="font-size:18px;font-weight:800;color:#374151">'+fehlmaterial+'</div></div>'
    +'</div>'
    +'<div style="display:flex;gap:10px;flex-wrap:wrap">'
    +'<button onclick="tagesabschlussPdf(\''+datum+'\');document.getElementById(\'ta-modal-bg\').remove()" style="flex:1;padding:12px;border-radius:10px;border:none;background:#8B0000;color:#fff;font-size:14px;font-weight:700;cursor:pointer">📄 PDF</button>'
    +'<button onclick="syncTagesberichtNotion();document.getElementById(\'ta-modal-bg\').remove()" style="flex:1;padding:12px;border-radius:10px;border:1px solid #e3beb8;background:#fff;color:#261816;font-size:14px;font-weight:700;cursor:pointer">📋 Notion</button>'
    +'<button onclick="document.getElementById(\'ta-modal-bg\').remove()" style="flex:1;padding:12px;border-radius:10px;border:1px solid #d1d5db;background:#f9fafb;color:#374151;font-size:14px;font-weight:700;cursor:pointer">Schließen</button>'
    +'</div>'
    +'</div></div>';
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  _showToast('Tagesabschluss gespeichert ✓','success');
  renderHeuteTab();
}

function tagesabschlussPdf(datum) {
  var liste = []; try { liste = JSON.parse(localStorage.getItem('pizzeria_tagesberichte')||'[]'); } catch(_) {}
  var ta = liste.find(function(e){ return e.datum===datum; });
  if (!ta) { _showToast('Kein Tagesabschluss für '+datum+' gefunden','error'); return; }
  var doc = new window.jspdf.jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  var fmt = function(n){ return parseFloat(n||0).toFixed(2).replace('.',',')+' €'; };
  doc.setFillColor(97,0,0); doc.rect(0,0,210,60,'F');
  doc.setTextColor(255,255,255);
  doc.setFontSize(26); doc.setFont(undefined,'bold'); doc.text('Pizzeria San Carino',105,22,{align:'center'});
  doc.setFontSize(16); doc.setFont(undefined,'normal'); doc.text('Tagesabschluss',105,33,{align:'center'});
  doc.setFontSize(13); doc.text(datum,105,43,{align:'center'});
  var y = 75;
  var boxW = 85; var boxH = 28; var gap = 10;
  var boxes = [
    {label:'Einnahmen',  val:fmt(ta.einnahmen), r:0,g:200,b:83, tr:0,tg:100,tb:40},
    {label:'Ausgaben',   val:fmt(ta.ausgaben),  r:255,g:82,b:82, tr:183,tg:28,tb:28},
    {label:'Saldo',      val:fmt(ta.saldo),      r:66,g:165,b:245, tr:13,tg:71,tb:161},
    {label:'Kassendiff', val:ta.kassenschnitt_differenz!=null?fmt(ta.kassenschnitt_differenz):'—', r:255,g:167,b:38, tr:230,tg:81,tb:0},
  ];
  boxes.forEach(function(b, i) {
    var x = 15 + i*(boxW+gap)*(i<2?1:0) + (i>=2?0:0);
    if (i===0) x=15; else if(i===1) x=15+boxW+gap; else if(i===2) x=15; else x=15+boxW+gap;
    var yy = i<2?y:y+boxH+8;
    doc.setFillColor(b.r,b.g,b.b); doc.roundedRect(x,yy,boxW,boxH,4,4,'F');
    doc.setTextColor(b.tr,b.tg,b.tb); doc.setFontSize(9); doc.setFont(undefined,'bold');
    doc.text(b.label.toUpperCase(),x+boxW/2,yy+9,{align:'center'});
    doc.setFontSize(16); doc.text(b.val,x+boxW/2,yy+21,{align:'center'});
  });
  y = y + boxH*2 + 28;
  doc.setDrawColor(220,190,184); doc.setLineWidth(0.5); doc.line(15,y,195,y); y+=10;
  doc.setTextColor(38,24,22); doc.setFontSize(11); doc.setFont(undefined,'bold');
  doc.text('Details',15,y); y+=8;
  doc.setFont(undefined,'normal'); doc.setFontSize(10); doc.setTextColor(90,64,60);
  doc.text('Offene Aufgaben: '+(ta.offene_aufgaben||0),15,y); y+=7;
  doc.text('Fehlmaterial: '+(ta.fehlmaterial||0),15,y); y+=7;
  doc.text('Erstellt: '+(ta.erstellt?ta.erstellt.replace('T',' ').slice(0,16):datum),15,y); y+=18;
  doc.setDrawColor(220,190,184); doc.line(15,y,195,y); y+=14;
  doc.setFontSize(10); doc.setTextColor(90,64,60); doc.setFont(undefined,'normal');
  doc.text('Unterschrift Verantwortlicher: ___________________________',15,y); y+=14;
  doc.text('Unterschrift Leitung:          ___________________________',15,y);
  doc.save('tagesabschluss_'+datum+'.pdf');
}

// ═══════════════════════════════════════════════════════════════

function switchTab(tab) {
  localStorage.setItem('psc_last_tab', tab);
  const isBiz = tab === 'business';

  // ── panels ──
  ['produkte','geschaefte','kombis','angebote','einkaufsliste','suche','upload','verlauf','mitarbeiter','fehlmaterial','checkliste','business','dashboard','speisekarte','lieferanten','dienstplan','aufgaben','schichtcheck','bestellung','lager','wareneinsatz','preisalarm','standardmaterial','statistik','tagesangebote','umsatz','gewinn','buchhaltung','konkurrenz','bewertungen','heute','haccp','mhd','kassenschnitt','urlaub','trinkgeld'].forEach(t => {
    const p = document.getElementById('panel-'+t);
    if (p) p.style.display = t === tab ? 'block' : 'none';
  });

  // ── sync all nav active states ──
  if (typeof closeMehrDrawer === 'function') closeMehrDrawer();
  _syncNavActiveStates(tab);

  // ── business button states ──
  const bizBtn    = document.getElementById('biz-header-btn');
  const mobBizBtn = document.getElementById('mob-biz-btn');
  if (bizBtn)    bizBtn.classList.toggle('active', isBiz);
  if (mobBizBtn) mobBizBtn.classList.toggle('mob-biz-active', isBiz);

  // ── dark mode / light mode ──
  document.body.classList.toggle('biz-mode', isBiz);
  document.body.style.backgroundColor = isBiz ? '' : '#fff8f6';

  // ── stats dashboard — hidden globally (dashboard is inside Kombis panel) ──
  const statsDash = document.getElementById('stats-dashboard');
  if (statsDash) statsDash.style.display = 'none';

  // ── floating bar — only visible in kombis tab ──
  const floatBar = document.getElementById('floating-checkout-bar');
  if (floatBar) floatBar.classList.add('bar-hidden');

  // ── footer time ──
  const ft = document.getElementById('footer-time');
  if (ft) ft.textContent = new Date().toLocaleTimeString('de-AT', {hour:'2-digit',minute:'2-digit'}) + ' Uhr';

  // ── render content ──
  if (tab === 'dashboard')    renderDashboardTab();
  if (tab === 'speisekarte')  renderSpeisekarteTab();
  if (tab === 'lieferanten')  renderLieferantenTab();
  if (tab === 'produkte')    renderProductsTab();
  if (tab === 'geschaefte')  renderShopsTab();
  if (tab === 'kombis')      renderKombisTab();
  if (tab === 'angebote')       renderAngeboteTab();
  if (tab === 'einkaufsliste')  renderEinkaufslisteTab();
  if (tab === 'suche')          renderSucheTab();
  if (tab === 'upload')      renderUploadTab();
  if (tab === 'verlauf')     renderVerlaufTab();
  if (tab === 'mitarbeiter')   { _syncMitarbeiterFromDB(); renderMitarbeiterTab(); }
  if (tab === 'fehlmaterial') renderFehlmaterialTab();
  if (tab === 'checkliste')    renderChecklisteTab();
  if (tab === 'dienstplan')    renderDienstplanTab();
  if (tab === 'aufgaben')      renderAufgabenTab();
  if (tab === 'schichtcheck')  renderSchichtCheckTab();
  if (tab === 'bestellung')    renderBestellungTab();
  if (tab === 'lager')         renderLagerTab();
  if (tab === 'wareneinsatz')  renderWareneinsatzTab();
  if (tab === 'preisalarm')    renderPreisalarmTab();
  if (tab === 'standardmaterial') renderStandardmaterialTab();
  if (tab === 'statistik')     renderStatistikTab();
  if (tab === 'tagesangebote') renderTagesangeboteTab();
  if (tab === 'umsatz')        renderUmsatzTab();
  if (tab === 'gewinn')        renderGewinnTab();
  if (tab === 'buchhaltung')   renderBuchhaltungTab();
  if (tab === 'konkurrenz')    renderKonkurrenzTab();
  if (tab === 'bewertungen')   renderBewertungenTab();
  if (tab === 'heute')         { if (typeof renderHeuteTab === 'function') renderHeuteTab(); }
  if (tab === 'haccp')         renderHaccpTab();
  if (tab === 'mhd')           renderMhdTab();
  if (tab === 'kassenschnitt') renderKassenschnittTab();
  if (tab === 'urlaub')        renderUrlaubTab();
  if (tab === 'trinkgeld')     renderTrinkgeldTab();
  if (isBiz) {
    const lockIcon    = document.getElementById('biz-lock-icon');
    const mobLockIcon = document.getElementById('mob-biz-lock');
    if (!bizIsAuth()) {
      renderBizLocked();
      if (lockIcon)    lockIcon.textContent = 'lock';
      if (mobLockIcon) mobLockIcon.textContent = 'lock';
    } else {
      _syncKassaFromDB(renderBusinessTab);
      if (lockIcon)    lockIcon.textContent = 'lock_open';
      if (mobLockIcon) mobLockIcon.textContent = 'lock_open';
    }
  }
}

function renderSucheTab() {
  const hasKey = ANTHROPIC_API_KEY && ANTHROPIC_API_KEY !== 'HIER_API_KEY_EINFÜGEN';
  const panel = document.getElementById('panel-suche');

  let inner = `
    <div class="suche-sticky-header">
      <div style="display:flex;gap:10px;margin-bottom:12px">
        <div style="position:relative;flex:1">
          <span class="material-symbols-outlined" style="position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:20px;color:#5a403c;pointer-events:none">search</span>
          <input
            id="suche-input"
            type="text"
            placeholder="z.B. Cola, Mozzarella, Olivenöl …"
            value="${escHtml(SUCHE_STATE.query)}"
            ${SUCHE_STATE.loading ? 'disabled' : ''}
            onkeydown="if(event.key==='Enter') startSearch()"
            style="width:100%;padding:12px 14px 12px 44px;border:2px solid #e3beb8;border-radius:14px;font-size:14px;font-family:inherit;color:#261816;background:#fff;outline:none;transition:border-color .15s;${SUCHE_STATE.loading?'opacity:.5;cursor:not-allowed':''}"
            onfocus="this.style.borderColor='#610000'" onblur="this.style.borderColor='#e3beb8'"
          />
        </div>
        <button onclick="startSearch()" ${SUCHE_STATE.loading ? 'disabled' : ''}
          class="btn-checkout"
          style="${SUCHE_STATE.loading?'opacity:.6;cursor:not-allowed':''}">
          ${SUCHE_STATE.loading
            ? '<span class="spinner-sm"></span> Suche…'
            : '<span class="material-symbols-outlined" style="font-size:18px">search</span> Suchen'}
        </button>
      </div>
      <div class="filter-chip-row">
        ${[
          {id:'',       label:'🌐 Alle Shops'},
          {id:'hofer',  label:'🏪 Hofer'},
          {id:'billa',  label:'🛒 Billa'},
          {id:'spar',   label:'🌿 Spar'},
          {id:'lidl',   label:'🔵 Lidl'},
          {id:'metro',  label:'🏭 Metro'},
          {id:'etsan',  label:'🥩 Etsan'},
        ].map(f=>`<button class="filter-chip${SUCHE_STATE.shopFilter===f.id?' active':''}" onclick="setSucheShopFilter('${f.id}')">${f.label}</button>`).join('')}
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px">
        <span style="font-size:10px;font-weight:700;color:#7a6460;text-transform:uppercase;letter-spacing:.06em;align-self:center;flex-shrink:0">Schnell:</span>
        ${[
          'Mozzarella','Olivenöl','Mehl','Tomaten','Salami',
          'Schinken','Parmesan','Oregano','Champignons','Thunfisch'
        ].map(q => `<button onclick="quickSearch('${q}')"
          style="padding:5px 12px;border-radius:20px;border:1.5px solid #e3beb8;background:#fff;font-size:12px;font-weight:600;color:#5a403c;cursor:pointer;font-family:inherit;transition:all .12s"
          onmouseover="this.style.background='#fff0ee';this.style.borderColor='#d4a0a0'"
          onmouseout="this.style.background='#fff';this.style.borderColor='#e3beb8'">${q}</button>`).join('')}
      </div>
    </div>
    <div class="deals-scroll-row">
      <div class="deal-scroll-card">
        <div style="font-size:10px;font-weight:700;color:#8B0000;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">marktguru.at</div>
        <div style="font-size:13px;font-weight:700;color:#261816;margin-bottom:2px">Live-Angebote</div>
        <div style="font-size:11px;color:#6b4844">Österreichische Händler</div>
      </div>
      <div class="deal-scroll-card">
        <div style="font-size:10px;font-weight:700;color:#8B0000;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">aktionsfinder.at</div>
        <div style="font-size:13px;font-weight:700;color:#261816;margin-bottom:2px">Aktuelle Aktionen</div>
        <div style="font-size:11px;color:#6b4844">Diese + nächste Woche</div>
      </div>
      <div class="deal-scroll-card">
        <div style="font-size:10px;font-weight:700;color:#8B0000;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">wogibtswas.at</div>
        <div style="font-size:13px;font-weight:700;color:#261816;margin-bottom:2px">Preisvergleich</div>
        <div style="font-size:11px;color:#6b4844">Beste Preise finden</div>
      </div>
    </div>`;

  if (!hasKey) {
    inner += `
      <div style="border:2px dashed #e3beb8;border-radius:16px;padding:20px 24px;margin-bottom:24px;background:#fff">
        <div style="display:flex;align-items:flex-start;gap:14px">
          <span class="material-symbols-outlined" style="font-size:24px;color:#5a403c;margin-top:2px">key</span>
          <div>
            <p style="font-size:14px;font-weight:700;color:#261816;margin-bottom:8px">🔑 Bitte API Key einfügen um die Live-Suche zu nutzen</p>
            <p style="font-size:13px;color:#5a403c;line-height:1.7">
              Öffne <code style="background:#ffe9e6;padding:2px 7px;border-radius:6px;font-size:12px;color:#610000">pizzaria.html</code> in einem Texteditor und trage deinen Anthropic API Key ganz oben ein:<br>
              <code style="background:#ffe9e6;padding:2px 7px;border-radius:6px;font-size:12px;color:#610000">const ANTHROPIC_API_KEY = "sk-ant-...";</code><br>
              API Key erhältlich unter <code style="background:#ffe9e6;padding:2px 7px;border-radius:6px;font-size:12px;color:#610000">console.anthropic.com</code> → API Keys.
            </p>
          </div>
        </div>
      </div>`;
  }

  if (SUCHE_STATE.error) {
    inner += `
      <div style="background:#ffdad6;border:1px solid #ba1a1a33;border-radius:14px;padding:14px 18px;margin-bottom:20px;display:flex;align-items:flex-start;gap:12px">
        <span class="material-symbols-outlined" style="font-size:20px;color:#ba1a1a;flex-shrink:0;margin-top:1px">error</span>
        <div>
          <p style="font-size:13px;font-weight:700;color:#93000a">Fehler</p>
          <p style="font-size:12px;color:#93000a;margin-top:3px">${escHtml(SUCHE_STATE.error)}</p>
        </div>
      </div>`;
  }

  if (SUCHE_STATE.loading) {
    inner += `
      <div style="text-align:center;padding:64px 20px">
        <div class="spinner"></div>
        <p style="font-size:14px;color:#5a403c">Suche läuft …</p>
        <p id="loading-step-text" style="font-size:12px;color:#8d6562;margin-top:8px;font-style:italic">${escHtml(SUCHE_STATE.loadingStep)}</p>
      </div>`;
  } else if (SUCHE_STATE.results.length > 0) {
    if (SUCHE_STATE.fromCache) {
      inner += `
        <div style="display:flex;align-items:center;justify-content:space-between;background:#e8f5e9;border:1px solid #a5d6a7;border-radius:12px;padding:10px 16px;margin-bottom:16px;gap:12px">
          <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:#1b5e20">
            <span class="material-symbols-outlined" style="font-size:15px;color:#2e7d32">schedule</span>
            Live-Preise vom <strong>${SUCHE_STATE.cacheDate}</strong> &nbsp;·&nbsp; Cache noch max. 1 Std. gültig
          </div>
          <button onclick="refreshSucheSearch()" style="font-size:11px;font-weight:600;color:#1b5e20;background:#c8e6c9;border:1px solid #81c784;border-radius:8px;padding:4px 12px;cursor:pointer;display:flex;align-items:center;gap:4px;font-family:inherit">
            <span class="material-symbols-outlined" style="font-size:13px">refresh</span>
            Aktualisieren
          </button>
        </div>`;
    } else if (SUCHE_STATE.results.length > 0) {
      inner += `
        <div style="display:flex;align-items:center;gap:8px;background:#e8f5e9;border:1px solid #a5d6a7;border-radius:12px;padding:10px 16px;margin-bottom:16px;font-size:12px;color:#1b5e20">
          <span class="material-symbols-outlined" style="font-size:15px;color:#2e7d32">travel_explore</span>
          <strong>Live</strong> — Preise direkt von Supermarkt-Websites
        </div>`;
    }
    inner += renderSearchResults();
  } else if (SUCHE_STATE.query && !SUCHE_STATE.error) {
    inner += `
      <div style="text-align:center;padding:64px 20px">
        <div style="width:64px;height:64px;border-radius:50%;background:#ffe9e6;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
          <span class="material-symbols-outlined" style="font-size:30px;color:#5a403c">search_off</span>
        </div>
        <h3 style="font-size:18px;font-weight:700;color:#261816;margin-bottom:8px">Keine Ergebnisse gefunden</h3>
        <p style="font-size:13px;color:#5a403c;max-width:360px;margin:0 auto 20px;line-height:1.6">
          Für <strong>"${escHtml(SUCHE_STATE.query)}"</strong> keine Preise gefunden. Möglicherweise liegt ein Verbindungsproblem vor.
        </p>
        <button onclick="clearAllSucheCache();startSearch()" style="padding:10px 20px;background:#610000;color:#fff;border:none;border-radius:10px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:700;display:inline-flex;align-items:center;gap:6px">
          <span class="material-symbols-outlined" style="font-size:16px">refresh</span>Erneut suchen (Cache geleert)
        </button>
      </div>`;
  } else if (!hasKey) {
    // hint already shown above
  } else {
    inner += `
      <div style="text-align:center;padding:64px 20px">
        <div style="width:64px;height:64px;border-radius:50%;background:#ffe9e6;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
          <span class="material-symbols-outlined" style="font-size:30px;color:#5a403c">shopping_cart</span>
        </div>
        <h3 style="font-size:18px;font-weight:700;color:#261816;margin-bottom:8px">Live-Preise suchen</h3>
        <p style="font-size:13px;color:#5a403c;max-width:360px;margin:0 auto;line-height:1.6">
          Gib ein Produkt ein und klicke auf <strong>Suchen</strong>.<br>
          Claude durchsucht marktguru.at, aktionsfinder.at und wogibtswas.at nach aktuellen und kommenden Angeboten bei österreichischen Händlern.
        </p>
      </div>`;
  }

  inner += renderSucheVerlauf();

  panel.innerHTML = inner;

  if (!SUCHE_STATE.loading) {
    const inp = document.getElementById('suche-input');
    if (inp) inp.focus();
  }
}

function setSucheShopFilter(shopId) {
  SUCHE_STATE.shopFilter = shopId;
  renderSucheTab();
}

function quickSearch(term) {
  const inp = document.getElementById('suche-input');
  if (inp) inp.value = term;
  SUCHE_STATE.query = term;
  startSearch();
}

function renderSearchResults() {
  const { results, query, shopFilter } = SUCHE_STATE;
  const filtered = shopFilter
    ? results.filter(r => (r.shop||'').toLowerCase() === shopFilter)
    : results;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let html = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
      <span style="font-size:14px;color:#5a403c">
        <span style="font-weight:700;color:#261816">${filtered.length} Angebot${filtered.length !== 1 ? 'e' : ''}</span>
        für „${escHtml(query)}"${shopFilter ? ` · <span style="color:#610000">${shopFilter}</span>` : ''}
      </span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:14px">`;

  filtered.forEach((r, idx) => {
    const color = shopColor(r.shop);
    const savings = (r.originalPrice && r.price && r.originalPrice > r.price)
      ? Math.round((1 - r.price / r.originalPrice) * 100)
      : null;

    // Preisvergleich mit gespeichertem Preis
    const storedProduct = PRODUCTS.find(p =>
      p.name.toLowerCase().includes(r.name.toLowerCase().split(' ')[0]) ||
      r.name.toLowerCase().includes(p.name.toLowerCase().split(' ')[0])
    );
    const storedPrice = storedProduct ? getLatestPrice(storedProduct.id) : null;
    const priceDiff = (storedPrice && r.price) ? Math.round(((r.price - storedPrice) / storedPrice) * 100) : null;

    let validHtml = '';
    if (r.validUntil) {
      const until = new Date(r.validUntil);
      const diffDays = Math.round((until - today) / 86400000);
      let textColor = '#5a403c', label = '';
      if (diffDays < 0) {
        textColor = '#ba1a1a'; label = `Abgelaufen (${fmtDate(r.validUntil)})`;
      } else if (diffDays === 0) {
        textColor = '#e67e22'; label = 'Heute letzter Tag';
      } else if (diffDays <= 3) {
        textColor = '#e67e22'; label = `Noch ${diffDays} Tag${diffDays !== 1 ? 'e' : ''} (bis ${fmtDate(r.validUntil)})`;
      } else {
        label = `Gültig bis ${fmtDate(r.validUntil)}`;
      }
      if (r.validFrom && r.validFrom > new Date().toISOString().slice(0, 10)) {
        label = `Ab ${fmtDate(r.validFrom)} bis ${fmtDate(r.validUntil)}`;
        textColor = '#5a403c';
      }
      validHtml = `<div style="display:flex;align-items:center;gap:4px;font-size:12px;color:${textColor}">
        <span class="material-symbols-outlined" style="font-size:13px">calendar_today</span>
        ${escHtml(label)}
      </div>`;
    }

    const isAdded = SUCHE_STATE.addedIds.includes(idx);

    html += `
      <div class="result-card-new">
        <div class="result-card-top">
          <div class="result-card-img">🛒</div>
          <div style="flex:1;min-width:0">
            <span class="result-shop-badge" style="background:${color}">${escHtml(r.shop)}</span>
            <p style="font-size:14px;font-weight:700;color:#261816;margin:0 0 2px;line-height:1.3">${escHtml(r.name)}</p>
            ${r.brand ? `<p style="font-size:11px;color:#6b4844;margin:0 0 6px">${escHtml(r.brand)}</p>` : ''}
            <div style="display:flex;align-items:baseline;gap:7px;flex-wrap:wrap">
              <span style="font-size:22px;font-weight:800;color:#610000;font-family:'Plus Jakarta Sans',sans-serif">${r.price != null ? eur(r.price) : '—'}</span>
              ${r.originalPrice && r.originalPrice > r.price ? `<span style="font-size:12px;color:#8d6562;text-decoration:line-through">${eur(r.originalPrice)}</span>` : ''}
              ${savings ? `<span style="font-size:11px;font-weight:700;background:#ffdad6;color:#610000;padding:2px 8px;border-radius:10px">−${savings}%</span>` : ''}
            </div>
            ${r.unit ? `<p style="font-size:11px;color:#6b4844;margin:2px 0 0">pro ${escHtml(r.unit)}</p>` : ''}
            ${priceDiff !== null
              ? `<div style="display:inline-flex;align-items:center;gap:4px;margin-top:4px;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;background:${priceDiff<=0?'#e8f5e9':'#ffdad6'};color:${priceDiff<=0?'#1b5e20':'#93000a'}">
                  <span class="material-symbols-outlined" style="font-size:12px">${priceDiff<=0?'trending_down':'trending_up'}</span>
                  ${priceDiff<=0?Math.abs(priceDiff)+'% günstiger als gespeichert':priceDiff+'% teurer als gespeichert'}
                </div>`
              : ''}
            ${r.source ? `<p style="font-size:10px;color:#8d6562;margin:4px 0 0">via ${escHtml(r.source)}</p>` : ''}
            ${validHtml}
          </div>
        </div>
        <div style="border-top:1px solid #f0e8e6;padding:12px 16px;display:flex;gap:8px">
          <button
            onclick="addResultToList(${idx})"
            style="flex:1;padding:9px;border-radius:12px;border:1.5px solid #610000;background:#610000;color:#fff;font-size:12px;font-weight:700;font-family:inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;transition:opacity .15s"
            onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
            <span class="material-symbols-outlined" style="font-size:15px">shopping_cart</span>Zur Liste
          </button>
          <button
            class="add-btn ${isAdded ? 'added' : ''}"
            onclick="addResultToInventory(${idx}, this)"
            ${isAdded ? 'disabled' : ''}
            style="flex:1;padding:9px;border-radius:12px;border:1.5px solid ${isAdded?'#c7c9f9':'#c0eda6'};background:${isAdded?'#dfe0ff':'#c0eda6'};color:${isAdded?'#0d2ccc':'#0c2000'};font-size:12px;font-weight:700;font-family:inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;transition:background .15s">
            ${isAdded
              ? '<span class="material-symbols-outlined" style="font-size:15px">check</span>Gespeichert'
              : '<span class="material-symbols-outlined" style="font-size:15px">inventory_2</span>Bestand'}
          </button>
        </div>
      </div>`;
  });

  html += '</div>';
  return html;
}

function addResultToInventory(idx, btn) {
  const r = SUCHE_STATE.results[idx];
  if (!r) return;

  // Generate a stable id from the name
  const id = 'search-' + r.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30) + '-' + idx;

  // Check if already in PRODUCTS
  const existing = PRODUCTS.find(p => p.id === id);
  if (!existing) {
    const newProduct = {
      id,
      name: r.name + (r.brand ? ` (${r.brand})` : ''),
      category: 'Suche',
      unit: r.unit || 'Stk',
      currentStock: 0,
      minStock: 1,
      orderQuantity: 1,
    };
    PRODUCTS.push(newProduct);
    stockLevels[id] = 0;
    updateHeaderBadge();
  }

  addHistoryEntry({
    produktName: r.name + (r.brand ? ` (${r.brand})` : ''),
    produktId:   id,
    menge:       1,
    einheit:     r.unit  || 'Stk',
    preis:       r.price || null,
    shopName:    r.shop  || null,
    shopId:      null,
    quelle:      'suche',
  });

  SUCHE_STATE.addedIds.push(idx);

  // Update button in-place without full re-render
  btn.classList.add('added', 'adding');
  btn.disabled = true;
  btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:15px">check</span> Hinzugefügt';
  btn.classList.remove('adding');
}

function addResultToList(idx) {
  const r = SUCHE_STATE.results[idx];
  if (!r) return;
  const name = r.name + (r.brand ? ' ' + r.brand : '');
  const list = getEinkaufsliste();
  const existing = list.find(e => (e.name || '').toLowerCase() === name.toLowerCase());
  if (existing) {
    _showToast('Bereits in der Einkaufsliste', 'info');
    return;
  }
  list.push({
    id: 'el_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
    name: name,
    menge: 1,
    einheit: r.unit || 'Stk',
    shop: r.shop || '',
    shopId: '',
    shopColor: '#8d6562',
    preis: r.price || null,
    done: false,
    source: 'suche',
    addedAt: new Date().toISOString().slice(0,10),
    note: r.price ? 'Gefunden: ' + eur(r.price) + (r.shop ? ' bei ' + r.shop : '') : ''
  });
  saveEinkaufsliste(list);
  _showToast(name + ' zur Einkaufsliste hinzugefügt', 'success');
}

// ═══════════════════════════════════════════════════════════════
// SUCHE TAB — Claude API Search
// ═══════════════════════════════════════════════════════════════

function updateLoadingStep(text) {
  SUCHE_STATE.loadingStep = text;
  const el = document.getElementById('loading-step-text');
  if (el) el.textContent = text;
}

// Server-Status Badge aktualisieren
function _updateServerBadge(online) {
  const badge = document.getElementById('server-status-badge');
  const dot   = document.getElementById('srv-dot');
  const label = document.getElementById('srv-label');
  if (!badge) return;
  if (online) {
    badge.style.background = '#e8f5e9'; badge.style.color = '#2e7d32'; badge.style.borderColor = '#a5d6a7';
    if (dot) dot.style.background = '#2e7d32';
    if (label) label.textContent = 'Online';
  } else {
    badge.style.background = '#fff8e1'; badge.style.color = '#e65100'; badge.style.borderColor = '#ffcc80';
    if (dot) dot.style.background = '#e65100';
    if (label) label.textContent = 'Offline';
  }
}

// Server-Verfügbarkeit: einmal pro 5 Minuten prüfen
let _serverCheck = { available: null, at: 0 };
async function isLocalServerAvailable() {
  if (Date.now() - _serverCheck.at < 5 * 60 * 1000 && _serverCheck.available !== null) {
    return _serverCheck.available;
  }
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2000);
    const r = await fetch('/api/health', { signal: ctrl.signal });
    clearTimeout(t);
    const ok = r.ok;
    _serverCheck = { available: ok, at: Date.now() };
    _updateServerBadge(ok);
    return ok;
  } catch (_) {
    _serverCheck = { available: false, at: Date.now() };
    _updateServerBadge(false);
    return false;
  }
}

// Badge-Check beim Start + alle 30 Sekunden
function _startServerStatusLoop() {
  _serverCheck.at = 0;
  isLocalServerAvailable();
  setInterval(() => { _serverCheck.at = 0; isLocalServerAvailable(); }, 30000);
}

// Lokalen Preisserver abfragen
async function searchViaLocalServer(query) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const resp = await fetch(
      `/api/search?q=${encodeURIComponent(query)}`,
      { signal: controller.signal }
    );
    if (!resp.ok) throw new Error('Server Fehler ' + resp.status);
    const data = await resp.json();
    if (Array.isArray(data)) return { items: data, notice: null };
    if (data && Array.isArray(data.items)) return data;
    throw new Error('Ungültige Antwort');
  } finally {
    clearTimeout(timer);
  }
}

async function startSearch() {
  const input = document.getElementById('suche-input');
  const query = (input ? input.value : '').trim();
  if (!query) return;

  // Cache überspringen wenn lokaler Server läuft (damit nie alte Claude-Daten gezeigt werden)
  const serverRunning = await isLocalServerAvailable();
  const cached = serverRunning ? null : getSucheCache(query);
  if (cached) {
    SUCHE_STATE.loading = false;
    SUCHE_STATE.error = null;
    SUCHE_STATE.results = cached.results;
    SUCHE_STATE.query = cached.query;
    SUCHE_STATE.addedIds = [];
    SUCHE_STATE.fromCache = true;
    SUCHE_STATE.cacheDate = cached.date;
    SUCHE_STATE.loadingStep = '';
    renderSucheTab();
    return;
  }

  SUCHE_STATE.loading = true;
  SUCHE_STATE.error = null;
  SUCHE_STATE.results = [];
  SUCHE_STATE.query = query;
  SUCHE_STATE.addedIds = [];
  SUCHE_STATE.fromCache = false;
  SUCHE_STATE.cacheDate = null;
  SUCHE_STATE.loadingStep = 'Verbinde mit Supermärkten …';
  renderSucheTab();

  try {
    let results = [];

    // ── Schritt 1: Lokaler Preisserver (echte Live-Preise) ──
    try {
      updateLoadingStep('Suche bei Spar, Billa, Hofer, Lidl … ');
      const serverResp = await searchViaLocalServer(query);
      results = serverResp.items || [];
      if (serverResp.notice) {
        // Billa/Hofer/Lidl noch nicht geladen — Info merken
        SUCHE_STATE._serverNotice = serverResp.notice;
      } else {
        SUCHE_STATE._serverNotice = null;
      }
      console.log('✅ Lokaler Server:', results.length, 'Ergebnisse');
    } catch (localErr) {
      // Server nicht gestartet → Claude als Fallback
      SUCHE_STATE._serverNotice = null;
      console.log('ℹ️ Lokaler Server nicht verfügbar, verwende Claude AI …');
      const hasKey = ANTHROPIC_API_KEY && ANTHROPIC_API_KEY !== 'HIER_API_KEY_EINFÜGEN';
      if (!hasKey) throw new Error('Kein API Key und kein lokaler Server. Bitte start-preisserver.bat starten.');
      updateLoadingStep('Suche via AI (start-preisserver.bat für echte Preise starten) …');
      results = await searchViaClaudeAPI(query);
    }

    SUCHE_STATE.results = results;
    SUCHE_STATE.error = null;
    if (results.length > 0) setSucheCache(query, results);
  } catch (err) {
    SUCHE_STATE.error = err.message || String(err);
    SUCHE_STATE.results = [];
  } finally {
    SUCHE_STATE.loading = false;
    SUCHE_STATE.loadingStep = '';
    renderSucheTab();
  }
}

async function searchViaClaudeAPI(query) {
  const now   = new Date();
  const today = now.toISOString().slice(0, 10);

  // ── Schritt 1: Live-Suche mit erzwungenem web_search Tool ──
  updateLoadingStep('Suche auf aktionsfinder.at & marktguru.at …');

  // Suchquery-Stil statt URL-Navigation (web_search kann keine dynamischen SPAs lesen)
  const webPrompt =
    `Suche nach dem aktuellen Preis von "${query}" bei österreichischen Supermärkten und Discountern. ` +
    `Verwende aktionsfinder.at, marktguru.at und wogibtswas.at als Quellen. ` +
    `Datum heute: ${today}. ` +
    `Wichtig: Gib NUR Preise zurück, die du tatsächlich in den Suchergebnissen gefunden hast. ` +
    `KEINE Schätzungen, KEINE Preise aus deinem Training. ` +
    `Wenn du für einen Shop keinen echten Preis findest, lass ihn weg. ` +
    `Antworte AUSSCHLIESSLICH mit JSON-Array (kein Text davor/danach):\n` +
    `[{"name":"${query} 250ml 4er Pack","brand":"Red Bull","shop":"Penny","price":0.95,` +
    `"originalPrice":1.29,"unit":"Pack","validFrom":"${today}","validUntil":"","source":"aktionsfinder.at"}]`;

  let resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'web-search-2025-03-05',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8192,
      tool_choice: { type: 'any' },
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      system: 'Du bist ein Preisvergleichs-Assistent für österreichische Supermärkte. ' +
              'Du MUSST immer zuerst das web_search Tool verwenden, bevor du antwortest. ' +
              'Antworte am Ende NUR mit einem JSON-Array — kein Text, kein Markdown. ' +
              'Wenn du keine echten Preise findest: gib [] zurück.',
      messages: [{ role: 'user', content: webPrompt }],
    }),
  });

  // ── Schritt 2: Fallback ohne tool_choice (bei 400/529) ──
  if (!resp.ok) {
    updateLoadingStep('Alternative Suche läuft …');
    resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 8192,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: 'Antworte NUR mit JSON-Array. Kein Text, kein Markdown. Nur echte gesuchte Preise.',
        messages: [{ role: 'user', content: webPrompt }],
      }),
    });
  }

  if (!resp.ok) {
    let errMsg = 'HTTP ' + resp.status;
    try { const e = await resp.json(); errMsg = e?.error?.message || errMsg; } catch (_) {}
    if (resp.status === 401) throw new Error('Ungültiger API Key (401). Bitte API Key prüfen.');
    if (resp.status === 429) throw new Error('Rate Limit erreicht (429). Kurz warten und erneut versuchen.');
    throw new Error(errMsg);
  }

  const data = await resp.json();
  updateLoadingStep('Preise werden verarbeitet …');

  // ── Schritt 3: JSON aus allen Text-Blöcken extrahieren ──
  const textBlocks = (data.content || []).filter(function(b) { return b.type === 'text'; });
  // Von hinten suchen — letzter Text-Block hat das finale JSON
  for (let i = textBlocks.length - 1; i >= 0; i--) {
    const parsed = parseResultsJSON(textBlocks[i].text);
    if (parsed.length > 0) return parsed;
  }

  // ── Fallback: Kein JSON gefunden — zeige Debug-Info ──
  console.warn('Suche: Kein JSON in Response. stop_reason:', data.stop_reason,
    '| Blöcke:', (data.content||[]).map(function(b){ return b.type; }));
  return [];
}

function parseResultsJSON(text) {
  if (!text || !text.trim()) return [];

  // Try direct parse
  try { return JSON.parse(text.trim()); } catch (_) {}

  // Strip markdown code fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch (_) {}
  }

  // Find first JSON array
  const arrMatch = text.match(/\[[\s\S]*\]/);
  if (arrMatch) {
    try { return JSON.parse(arrMatch[0]); } catch (_) {}
  }

  // Empty result if nothing parseable
  return [];
}

// ═══════════════════════════════════════════════════════════════
// SUCHE CACHE
// ═══════════════════════════════════════════════════════════════

function getSucheCache(query) {
  try {
    const all = JSON.parse(localStorage.getItem('pizzeria_suche_cache') || '{}');
    const key = query.toLowerCase().trim();
    const entry = all[key];
    if (!entry) return null;
    // Live-Preise: Cache nur 1 Stunde gültig (für aktuelle Angebote)
    const ageHours = (Date.now() - entry.timestamp) / (1000 * 60 * 60);
    if (ageHours > 1) {
      delete all[key];
      localStorage.setItem('pizzeria_suche_cache', JSON.stringify(all));
      return null;
    }
    return entry;
  } catch (_) { return null; }
}

function setSucheCache(query, results) {
  try {
    const all = JSON.parse(localStorage.getItem('pizzeria_suche_cache') || '{}');
    const now = new Date();
    all[query.toLowerCase().trim()] = {
      query,
      results,
      timestamp: Date.now(),
      date: now.toLocaleDateString('de-AT', { day:'2-digit', month:'2-digit', year:'numeric' }) +
            ' ' + now.toLocaleTimeString('de-AT', { hour:'2-digit', minute:'2-digit' }) + ' Uhr',
    };
    localStorage.setItem('pizzeria_suche_cache', JSON.stringify(all));
  } catch (_) {}
}

function deleteSucheCache(query) {
  try {
    const all = JSON.parse(localStorage.getItem('pizzeria_suche_cache') || '{}');
    delete all[query.toLowerCase().trim()];
    localStorage.setItem('pizzeria_suche_cache', JSON.stringify(all));
    if (SUCHE_STATE.fromCache && SUCHE_STATE.query.toLowerCase() === query.toLowerCase()) {
      SUCHE_STATE.results = [];
      SUCHE_STATE.query = '';
      SUCHE_STATE.fromCache = false;
    }
    renderSucheTab();
  } catch (_) {}
}

function clearAllSucheCache() {
  try { localStorage.removeItem('pizzeria_suche_cache'); } catch (_) {}
  SUCHE_STATE.results = [];
  SUCHE_STATE.query = '';
  SUCHE_STATE.fromCache = false;
  renderSucheTab();
}

function loadFromSucheCache(query) {
  const cached = getSucheCache(query);
  if (!cached) return;
  SUCHE_STATE.loading = false;
  SUCHE_STATE.error = null;
  SUCHE_STATE.results = cached.results;
  SUCHE_STATE.query = cached.query;
  SUCHE_STATE.addedIds = [];
  SUCHE_STATE.fromCache = true;
  SUCHE_STATE.cacheDate = cached.date;
  renderSucheTab();
}

function refreshSucheSearch() {
  const query = SUCHE_STATE.query;
  if (!query) return;
  deleteSucheCache(query);
  const input = document.getElementById('suche-input');
  if (input) input.value = query;
  startSearch();
}

function renderSucheVerlauf() {
  let all = {};
  try { all = JSON.parse(localStorage.getItem('pizzeria_suche_cache') || '{}'); } catch (_) {}
  const entries = Object.values(all).sort((a, b) => b.timestamp - a.timestamp);
  if (entries.length === 0) return '';

  let html = `
    <div style="margin-top:36px;padding-top:24px;border-top:1px solid #e3beb8">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <h3 style="font-size:15px;font-weight:700;color:#261816;display:flex;align-items:center;gap:8px;margin:0">
          <span class="material-symbols-outlined" style="font-size:18px;color:#610000">history</span>
          Gespeicherter Verlauf
          <span style="background:#610000;color:#fff;border-radius:20px;padding:2px 8px;font-size:11px;font-weight:700">${entries.length}</span>
        </h3>
        <button onclick="clearAllSucheCache()" style="font-size:11px;color:#5a403c;background:none;border:1px solid #e3beb8;cursor:pointer;display:flex;align-items:center;gap:4px;padding:5px 10px;border-radius:8px">
          <span class="material-symbols-outlined" style="font-size:13px">delete_sweep</span>
          Alle löschen
        </button>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">`;

  for (const e of entries) {
    const ageDays = Math.floor((Date.now() - e.timestamp) / (1000 * 60 * 60 * 24));
    const ageText = ageDays === 0 ? 'Heute' : ageDays === 1 ? 'Gestern' : `vor ${ageDays} Tagen`;
    const isActive = SUCHE_STATE.fromCache && SUCHE_STATE.query.toLowerCase() === e.query.toLowerCase();
    const safeQ = e.query.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

    html += `
      <div onclick="loadFromSucheCache('${safeQ}')"
           style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:${isActive ? '#fff0ee' : '#fff'};border:1px solid ${isActive ? '#b52619' : '#e3beb8'};border-radius:12px;cursor:pointer;transition:background .15s"
           onmouseover="if(!${isActive})this.style.background='#fff8f6'" onmouseout="if(!${isActive})this.style.background='#fff'">
        <span class="material-symbols-outlined" style="font-size:18px;color:${isActive ? '#610000' : '#8d6562'};flex-shrink:0">search</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:14px;font-weight:600;color:#261816;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(e.query)}</div>
          <div style="font-size:11px;color:#8d6562;margin-top:2px">${e.results.length} Ergebnisse · ${ageText} · ${e.date}</div>
        </div>
        ${isActive ? '<span style="font-size:10px;font-weight:700;color:#610000;background:#ffdad6;padding:2px 8px;border-radius:20px;white-space:nowrap;border:1px solid #b52619">Aktiv</span>' : ''}
        <button onclick="event.stopPropagation();deleteSucheCache('${safeQ}')"
                style="background:none;border:none;cursor:pointer;padding:4px;color:#8d6562;flex-shrink:0;border-radius:6px;line-height:0"
                title="Löschen">
          <span class="material-symbols-outlined" style="font-size:16px">close</span>
        </button>
      </div>`;
  }

  html += `</div></div>`;
  return html;
}

// ═══════════════════════════════════════════════════════════════
// PRINT COMBO
// ═══════════════════════════════════════════════════════════════

function printCombo(comboId) {
  const { single, two } = calculateCombinations();
  const combo = [...two, ...single].find(c => c.id === comboId);
  if (!combo) return;

  const now = new Date();
  const dateStr = now.toLocaleDateString('de-DE', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  const byShop = {};
  for (const item of combo.items) {
    if (!byShop[item.shop.id]) byShop[item.shop.id] = { shop: item.shop, items: [], subtotal: 0 };
    byShop[item.shop.id].items.push(item);
    byShop[item.shop.id].subtotal += item.totalCost;
  }

  let shopTables = '';
  for (const group of Object.values(byShop)) {
    const rows = group.items.map((item, ri) => {
      const isLow = stockLevels[item.product.id] < item.product.minStock;
      return `<tr style="background:${isLow ? '#ffdad6' : ri%2===0 ? '#fff' : '#fafafa'}">
        <td style="padding:9px 10px;text-align:center;font-size:18px">☐</td>
        <td style="padding:9px 12px;font-weight:${isLow?'700':'500'};color:${isLow?'#cc0000':'#1a1a1a'}">${item.product.name}${isLow?' ⚠️':''}</td>
        <td style="padding:9px 10px;text-align:center;font-size:13px">${(stockLevels[item.product.id]||0)} ${item.product.unit}</td>
        <td style="padding:9px 10px;text-align:center;font-size:14px;font-weight:700">${item.quantity} ${item.product.unit}</td>
        <td style="padding:9px 10px;text-align:right;font-size:13px">${eur(item.pricePerUnit)}/${item.product.unit}</td>
        <td style="padding:9px 10px;text-align:right;font-size:14px;font-weight:700">${eur(item.totalCost)}</td>
      </tr>`;
    }).join('');

    shopTables += `
      <div style="margin-bottom:28px;page-break-inside:avoid">
        <div style="background:${group.shop.color};color:white;padding:10px 16px;border-radius:8px 8px 0 0;display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:17px;font-weight:700">${group.shop.name}</span>
          <span style="font-size:12px;opacity:.85">${group.shop.type}</span>
        </div>
        <table style="width:100%;border-collapse:collapse;border:1px solid #ddd;border-top:none;border-radius:0 0 8px 8px;overflow:hidden">
          <thead>
            <tr style="background:#f5f5f5;font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#666">
              <th style="padding:7px 10px;width:36px">✓</th>
              <th style="padding:7px 12px;text-align:left">Produkt</th>
              <th style="padding:7px 10px">Bestand</th>
              <th style="padding:7px 10px">Kaufen</th>
              <th style="padding:7px 10px;text-align:right">Preis/E</th>
              <th style="padding:7px 10px;text-align:right">Gesamt</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr style="background:#f0f0f0;font-weight:700;border-top:2px solid #ddd">
              <td colspan="5" style="padding:9px 12px;text-align:right;font-size:13px">Summe ${group.shop.name}:</td>
              <td style="padding:9px 10px;text-align:right;font-size:15px">${eur(group.subtotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>`;
  }

  const html = `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8">
<title>Einkaufsliste ${dateStr}</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; max-width: 800px; margin: 0 auto; padding: 24px; color:#1a1a1a; }
  @media print { body{padding:0;max-width:100%} button{display:none!important} @page{margin:12mm} }
  table { page-break-inside: auto; } tr { page-break-inside: avoid; }
</style></head><body>
  <div style="display:flex;align-items:center;gap:20px;margin-bottom:24px;padding-bottom:16px;border-bottom:3px solid #610000">
    <span style="font-size:42px">🍕</span>
    <div style="flex:1">
      <h1 style="font-size:22px;font-weight:700;color:#610000;margin:0 0 4px">Pizzeria Einkaufsliste</h1>
      <p style="color:#666;margin:0;font-size:13px">${dateStr}</p>
    </div>
    <div style="text-align:right">
      <div style="font-size:26px;font-weight:700;color:#610000">${eur(combo.totalCost)}</div>
      <div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:.08em">Gesamt</div>
    </div>
  </div>
  ${shopTables}
  <div style="border-top:2px solid #610000;padding-top:16px;margin-top:16px;display:flex;justify-content:space-between;align-items:flex-end">
    <div style="font-size:11px;color:#888;line-height:1.6">
      ⚠️ Metro / Transgourmet: Gewerbeschein mitbringen!<br>
      Erstellt: ${now.toLocaleString('de-DE')}
    </div>
    <div style="font-size:20px;font-weight:700">Gesamt: ${eur(combo.totalCost)}</div>
  </div>
  <div style="margin-top:24px;text-align:center">
    <button onclick="window.print()" style="padding:12px 36px;background:#610000;color:white;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer">🖨️ Drucken</button>
  </div>
</body></html>`;

  const win = window.open('', '_blank', 'width=860,height=700');
  if (!win) { _showToast('Popup blockiert! Bitte Popup-Blocker deaktivieren.', 'warning'); return; }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 600);
}

// ═══════════════════════════════════════════════════════════════
// VERLAUF — Helpers
// ═══════════════════════════════════════════════════════════════

function calcWeeklyConsumption() {
  if (HISTORY.length === 0) return [];
  const now = new Date();
  const fourWeeksAgo = new Date(now - 28 * 86400000);
  const twoWeeksAgo  = new Date(now - 14 * 86400000);
  const recent = HISTORY.filter(e => e.menge != null && new Date(e.datum + 'T00:00:00') >= fourWeeksAgo);

  const byProduct = {};
  recent.forEach(e => {
    if (!byProduct[e.produktName]) byProduct[e.produktName] = { name: e.produktName, einheit: e.einheit, entries: [] };
    byProduct[e.produktName].entries.push(e);
  });

  return Object.values(byProduct).map(p => {
    const total = p.entries.reduce((s, e) => s + (e.menge || 0), 0);
    const perWeek = Math.round((total / 4) * 10) / 10;

    const recent2 = p.entries.filter(e => new Date(e.datum + 'T00:00:00') >= twoWeeksAgo);
    const older2  = p.entries.filter(e => new Date(e.datum + 'T00:00:00') <  twoWeeksAgo);
    const rSum = recent2.reduce((s, e) => s + (e.menge || 0), 0) / 2;
    const oSum = older2.reduce( (s, e) => s + (e.menge || 0), 0) / 2;
    let trend = '→';
    if (oSum > 0) { const r = rSum / oSum; if (r > 1.15) trend = '↑'; else if (r < 0.85) trend = '↓'; }

    let prognose = null;
    const prod = PRODUCTS.find(p2 => p2.name === p.name || p2.id === p.entries[0]?.produktId);
    if (prod && perWeek > 0) {
      const daysLeft = (stockLevels[prod.id] || 0) / (perWeek / 7);
      prognose = Math.round(daysLeft);
    }

    return { name: p.name, einheit: p.einheit, perWeek, trend, prognose };
  }).filter(w => w.perWeek > 0).sort((a, b) => b.perWeek - a.perWeek);
}

function calcPriceTrends() {
  const now = new Date();
  const tM = now.getMonth() + 1, tY = now.getFullYear();
  const pM = tM === 1 ? 12 : tM - 1, pY = tM === 1 ? tY - 1 : tY;
  const tKey = `${tY}-${String(tM).padStart(2,'0')}`;
  const pKey = `${pY}-${String(pM).padStart(2,'0')}`;

  const byProduct = {};
  HISTORY.filter(e => e.preis != null && e.preis > 0).forEach(e => {
    if (!byProduct[e.produktName]) byProduct[e.produktName] = { name: e.produktName, all: [], thisM: [], prevM: [] };
    byProduct[e.produktName].all.push(e.preis);
    if (e.datum.startsWith(tKey)) byProduct[e.produktName].thisM.push(e.preis);
    if (e.datum.startsWith(pKey)) byProduct[e.produktName].prevM.push(e.preis);
  });

  const avg = arr => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null;

  return Object.values(byProduct)
    .map(p => ({
      name:       p.name,
      currentAvg: avg(p.thisM),
      lastAvg:    avg(p.prevM),
      minEver:    Math.min(...p.all),
      diff:       (avg(p.thisM) != null && avg(p.prevM) != null) ? avg(p.thisM) - avg(p.prevM) : null,
    }))
    .filter(p => p.currentAvg != null || p.lastAvg != null)
    .sort((a, b) => (b.currentAvg || 0) - (a.currentAvg || 0));
}

function exportMonthAsText() {
  const now = new Date();
  const mKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const monthName = now.toLocaleString('de-DE', { month: 'long', year: 'numeric' });
  const entries = HISTORY.filter(e => e.datum.startsWith(mKey));
  const total = entries.reduce((s, e) => s + (e.preis != null && e.menge != null ? e.preis * e.menge : 0), 0);

  let text = `🍕 Pizzeria Einkauf — ${monthName}\n`;
  text += `${'═'.repeat(34)}\n`;
  text += `Gesamt: ${total.toLocaleString('de-DE', {style:'currency',currency:'EUR'})}\n\n`;

  const byShop = {};
  entries.forEach(e => {
    const key = e.shopName || 'Kein Geschäft';
    if (!byShop[key]) byShop[key] = [];
    byShop[key].push(e);
  });

  Object.entries(byShop).forEach(([shop, es]) => {
    const shopTotal = es.reduce((s, e) => s + (e.preis != null && e.menge != null ? e.preis * e.menge : 0), 0);
    text += `📦 ${shop}: ${shopTotal.toLocaleString('de-DE',{style:'currency',currency:'EUR'})}\n`;
    es.forEach(e => {
      text += `  • ${e.produktName}: ${e.menge != null ? e.menge : ''}${e.einheit || ''} × ${e.preis != null ? e.preis.toLocaleString('de-DE',{style:'currency',currency:'EUR'}) : '—'}\n`;
    });
    text += '\n';
  });

  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => _showToast('Monatsbericht in Zwischenablage kopiert!', 'success')).catch(() => prompt('Text kopieren:', text));
  } else {
    prompt('Text kopieren:', text);
  }
}

// ═══════════════════════════════════════════════════════════════
// VERLAUF TAB — Render
// ═══════════════════════════════════════════════════════════════

function importUMTradeRechnung93722() {
  const items = [
    { n:'Pizzablock EXPORT 5kg',                  m:14.885, e:'kg',    p:4.99  },
    { n:'Salami geschnitten 65cm ca. 1kg',         m:4.100,  e:'kg',    p:6.19  },
    { n:'Gastro Bacon Hochreiter geschnitten 1kg', m:2.994,  e:'kg',    p:8.99  },
    { n:'Goldsteig Mozzarella Stange 45% FIT 1kg', m:2,      e:'Pkg',   p:6.99  },
    { n:'SARAY Cheddar Scheiben 1000g',            m:1,      e:'Pkg',   p:8.99  },
    { n:'BL Kartoffelsalat 10kg Wienerart',        m:1,      e:'Kübel', p:30.59 },
    { n:'Debic Vanillesauce 2L',                   m:1,      e:'Fl.',   p:8.19  },
    { n:'Brajlovic Cevapcici 800g TK',             m:3,      e:'Pkg',   p:9.99  },
    { n:'Döner Kebap Geschnitten 1kg',             m:3,      e:'Pkg',   p:8.99  },
    { n:'Hühnerbrustfilet ca. 1kg TK',            m:10,     e:'kg',    p:6.09  },
    { n:'Giant XL Hamburger Brot 16 Stk TK',       m:2,      e:'Ktn',   p:8.99  },
    { n:'OBA Kombi Böreklik Weiß 40% 4kg',         m:1,      e:'Ktn',   p:17.99 },
    { n:'Aviko Potato Wedges Gewürzt 2,5kg TK',    m:4,      e:'Pkg',   p:4.985 },
    { n:'Aviko Pommes Kebab 9,5mm 2,5kg TK',       m:4,      e:'Pkg',   p:4.735 },
    { n:'Ardo Karfiol/Blumenkohl 2,5kg TK',        m:1,      e:'Pkg',   p:4.24  },
    { n:'Ardo Markerbsen 2,5kg TK',                m:1,      e:'Pkg',   p:4.74  },
    { n:'Develey Hamburger Sauce 875ml',            m:3,      e:'Fl.',   p:4.69  },
    { n:'Adria Artischocken Herzen 2650ml',         m:1,      e:'Dosen', p:8.79  },
    { n:'Mahmood Basmatie Reis 4,5kg',             m:1,      e:'Stk',   p:14.90 },
    { n:'Senna Sauce Tartare Port. 80x25g',        m:1,      e:'Ktn',   p:10.99 },
    { n:'Senna Ketchup Sauce Port. 100x20g',       m:1,      e:'Ktn',   p:8.99  },
    { n:'Senna Mayonnaise 50% Port. 100x15g',      m:1,      e:'Ktn',   p:8.99  },
    { n:'Fuzetea Zitrone 12x0,5L Pet',             m:1,      e:'Tray',  p:6.65  },
    { n:'Fuzetea Pfirsich 12x0,5L Pet',            m:1,      e:'Tray',  p:6.65  },
    { n:'Campino Pizza Sauce 5/1',                 m:3,      e:'Dosen', p:6.49  },
    { n:'Adria Thunfisch in Öl 1705g',             m:6,      e:'Dosen', p:8.59  },
    { n:'Piacelli Gnocchi 1000g',                  m:6,      e:'Pkg',   p:2.49  },
    { n:'Barilla Spaghetti 5kg No.5',              m:3,      e:'Pkg',   p:7.59  },
    { n:'Manner Eierbiskotten 2,4kg Gastro',       m:1,      e:'Ktn',   p:19.99 },
    { n:'Champignon mittel 3kg Frisch',            m:1,      e:'kiste', p:9.19  },
  ];
  for (const it of items) {
    addHistoryEntry({ datum:'2026-03-25', produktName:it.n, menge:it.m, einheit:it.e, preis:it.p, shopName:'UM Trade', shopId:'umtrade', quelle:'rechnung' });
  }
  try { HISTORY = JSON.parse(localStorage.getItem('pizzeria_history') || '[]'); } catch(e) { HISTORY = []; }
  renderVerlaufTab();
}

function renderVerlaufTab() {
  const panel = document.getElementById('panel-verlauf');
  const now = new Date();
  const todayYM = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  if (!VERLAUF_FILTER.monat) VERLAUF_FILTER.monat = todayYM;
  const _verlHdr = _pageHdr('history', 'Verlauf', HISTORY.length + ' Einkäufe gesamt', '');

  if (HISTORY.length === 0) {
    panel.innerHTML = _verlHdr + `
      <div style="text-align:center;padding:60px 20px">
        <span class="material-symbols-outlined" style="font-size:64px;color:#e3beb8;display:block;margin-bottom:16px">bar_chart</span>
        <h3 style="font-size:20px;font-weight:700;color:#261816;margin-bottom:8px">Noch keine Einkaufshistorie</h3>
        <p style="font-size:14px;color:#5a403c;max-width:340px;margin:0 auto;line-height:1.7">
          Sobald du Produkte über Kassenbon, Handliste oder Suche hinzufügst, erscheint hier deine Einkaufshistorie.
        </p>
        <div style="margin-top:28px">
          <button onclick="importUMTradeRechnung93722()"
            style="padding:14px 28px;background:linear-gradient(135deg,#610000,#8b0000);color:#fff;border:none;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:10px">
            <span class="material-symbols-outlined" style="font-size:20px">upload_file</span>
            UM Trade Rechnung 93722 importieren
          </button>
          <p style="font-size:12px;color:#8d6562;margin-top:10px">Rechnung vom 25.03.2026 · € 676,27 · 30 Positionen</p>
        </div>
      </div>`;
    return;
  }

  // ── Filtered entries ──
  const filtered = HISTORY.filter(e => {
    if (VERLAUF_FILTER.shop    && e.shopName !== VERLAUF_FILTER.shop)                                          return false;
    if (VERLAUF_FILTER.produkt && !e.produktName.toLowerCase().includes(VERLAUF_FILTER.produkt.toLowerCase())) return false;
    if (VERLAUF_FILTER.monat   && !e.datum.startsWith(VERLAUF_FILTER.monat))                                  return false;
    return true;
  });

  // ── Monthly totals ──
  const [mY, mM] = (VERLAUF_FILTER.monat || todayYM).split('-').map(Number);
  const pM = mM === 1 ? 12 : mM - 1, pY = mM === 1 ? mY - 1 : mY;
  const mKey  = `${mY}-${String(mM).padStart(2,'0')}`;
  const pKey  = `${pY}-${String(pM).padStart(2,'0')}`;

  const thisMonthAll = HISTORY.filter(e => e.datum.startsWith(mKey));
  const prevMonthAll = HISTORY.filter(e => e.datum.startsWith(pKey));
  const calcTotal = es => es.reduce((s, e) => s + (e.preis != null && e.menge != null ? e.preis * e.menge : 0), 0);
  const thisTotal = calcTotal(thisMonthAll);
  const prevTotal = calcTotal(prevMonthAll);

  // By-shop bar chart data
  const byShopMap = {};
  thisMonthAll.forEach(e => {
    if (!e.shopName) return;
    if (!byShopMap[e.shopName]) byShopMap[e.shopName] = { name: e.shopName, shopId: e.shopId, total: 0 };
    byShopMap[e.shopName].total += (e.preis != null && e.menge != null ? e.preis * e.menge : 0);
  });
  const shopBars = Object.values(byShopMap).sort((a, b) => b.total - a.total);
  const maxBar = shopBars.length ? shopBars[0].total : 1;

  // Top 3 expensive
  const top3Exp = [...thisMonthAll]
    .filter(e => e.preis != null && e.menge != null)
    .sort((a, b) => (b.preis * b.menge) - (a.preis * a.menge))
    .slice(0, 3);

  // Top 3 deals (below personal average price for that product)
  const avgByProduct = {};
  HISTORY.filter(e => e.preis != null).forEach(e => {
    if (!avgByProduct[e.produktName]) avgByProduct[e.produktName] = [];
    avgByProduct[e.produktName].push(e.preis);
  });
  const top3Deals = [...thisMonthAll]
    .filter(e => e.preis != null && (avgByProduct[e.produktName] || []).length > 1)
    .map(e => {
      const arr = avgByProduct[e.produktName];
      const avg = arr.reduce((s, v) => s + v, 0) / arr.length;
      return { ...e, saving: avg - e.preis };
    })
    .filter(e => e.saving > 0.005)
    .sort((a, b) => b.saving - a.saving)
    .slice(0, 3);

  // For filter dropdowns
  const allShops  = [...new Set(HISTORY.map(e => e.shopName).filter(Boolean))];
  const allMonths = [...new Set(HISTORY.map(e => e.datum.slice(0,7)))].sort().reverse();

  // ── 6-Monats-Chart Daten ──
  const last6 = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const label = d.toLocaleDateString('de-DE', { month:'short', year:'2-digit' });
    const total = HISTORY.filter(e => (e.datum||'').startsWith(key))
      .reduce((s, e) => s + (e.preis != null && e.menge != null ? e.preis * e.menge : 0), 0);
    last6.push({ key, label, total });
  }

  let html = '';

  // ─── 6-MONATS-CHART ───
  html += `
    <div style="background:#fff;border:1px solid #e3beb866;border-radius:18px;overflow:hidden;margin-bottom:24px;box-shadow:0 2px 8px rgba(0,0,0,.06)">
      <div style="padding:14px 20px;border-bottom:1px solid #e3beb844;background:#f8dcd8;display:flex;align-items:center;gap:10px">
        <span class="material-symbols-outlined" style="font-size:20px;color:#610000">bar_chart</span>
        <span style="font-size:15px;font-weight:700;color:#261816">Ausgaben letzte 6 Monate</span>
      </div>
      <div style="padding:16px 20px">
        <canvas id="verlauf-chart-6m" height="120"></canvas>
      </div>
    </div>`;

  // ─── FILTER ROW ───
  html += `
    <div style="display:flex;gap:10px;margin-bottom:24px;flex-wrap:wrap;align-items:center">
      <select onchange="VERLAUF_FILTER.monat=this.value;renderVerlaufTab()"
        style="padding:9px 14px;border:1.5px solid #e3beb8;border-radius:12px;font-size:13px;font-family:inherit;background:#fff;color:#261816;cursor:pointer;flex:1;min-width:150px">
        ${allMonths.map(m => {
          const [y,mo] = m.split('-');
          const label = new Date(parseInt(y), parseInt(mo)-1).toLocaleDateString('de-DE', {month:'long', year:'numeric'});
          return `<option value="${m}" ${VERLAUF_FILTER.monat===m?'selected':''}>${label}</option>`;
        }).join('')}
        <option value="" ${!VERLAUF_FILTER.monat?'selected':''}>Alle Monate</option>
      </select>
      <select onchange="VERLAUF_FILTER.shop=this.value;renderVerlaufTab()"
        style="padding:9px 14px;border:1.5px solid #e3beb8;border-radius:12px;font-size:13px;font-family:inherit;background:#fff;color:#261816;cursor:pointer;flex:1;min-width:130px">
        <option value="">Alle Geschäfte</option>
        ${allShops.map(s => `<option value="${s}" ${VERLAUF_FILTER.shop===s?'selected':''}>${escHtml(s)}</option>`).join('')}
      </select>
      <input type="text" placeholder="Produkt suchen…" value="${escHtml(VERLAUF_FILTER.produkt)}"
        oninput="VERLAUF_FILTER.produkt=this.value;renderVerlaufTab()"
        style="padding:9px 14px;border:1.5px solid #e3beb8;border-radius:12px;font-size:13px;font-family:inherit;flex:1;min-width:130px;color:#261816">
      <span style="font-size:12px;color:#8d6562;white-space:nowrap">${filtered.length} Einträge</span>
    </div>`;

  // ─── MONATSAUSWERTUNG ───
  html += `
    <div style="background:#fff;border:1px solid #e3beb866;border-radius:18px;overflow:hidden;margin-bottom:24px;box-shadow:0 2px 8px rgba(0,0,0,.06)">
      <div style="padding:14px 20px;border-bottom:1px solid #e3beb844;background:#f8dcd8;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
        <div style="display:flex;align-items:center;gap:10px">
          <span class="material-symbols-outlined" style="font-size:22px;color:#610000">calendar_month</span>
          <span style="font-size:16px;font-weight:700;color:#261816">Monatsauswertung</span>
        </div>
        <button onclick="exportMonthAsText()"
          style="padding:8px 16px;border-radius:10px;border:1px solid #e3beb8;background:#fff;font-size:13px;color:#610000;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px;font-weight:600">
          <span class="material-symbols-outlined" style="font-size:16px">content_copy</span> Als Text kopieren
        </button>
      </div>
      <div style="padding:18px 20px">
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:14px;margin-bottom:${shopBars.length?'20px':'0'}">
          <div style="background:#fff8f6;border:1px solid #e3beb8;border-radius:14px;padding:14px 16px">
            <div style="font-size:26px;font-weight:800;color:#610000">${eur(thisTotal)}</div>
            <div style="font-size:12px;color:#5a403c;margin-top:3px">Dieser Monat</div>
          </div>
          ${prevTotal > 0 ? `
          <div style="background:#fff0ee;border:1px solid #e3beb8;border-radius:14px;padding:14px 16px">
            <div style="font-size:26px;font-weight:800;color:#5a403c">${eur(prevTotal)}</div>
            <div style="font-size:12px;color:#8d6562;margin-top:3px">Vormonat</div>
          </div>
          <div style="background:${thisTotal > prevTotal ? '#ffdad6' : '#c0eda6'};border:1px solid ${thisTotal > prevTotal ? '#ba1a1a33' : '#386a2033'};border-radius:14px;padding:14px 16px">
            <div style="font-size:22px;font-weight:800;color:${thisTotal > prevTotal ? '#93000a' : '#0c2000'}">${thisTotal > prevTotal ? '+' : ''}${eur(thisTotal - prevTotal)}</div>
            <div style="font-size:12px;color:${thisTotal > prevTotal ? '#ba1a1a' : '#386a20'};margin-top:3px">${thisTotal > prevTotal ? '↑ mehr als Vormonat' : '↓ weniger als Vormonat'}</div>
          </div>` : ''}
        </div>`;

  if (shopBars.length > 0) {
    html += `
        <p style="font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em;margin-bottom:12px">Ausgaben nach Geschäft</p>
        <div style="display:flex;flex-direction:column;gap:10px">`;
    shopBars.forEach(bar => {
      const shopObj = allImportShops().find(s => s.name === bar.name || s.id === bar.shopId);
      const color = shopObj ? shopObj.color : '#610000';
      const pct = maxBar > 0 ? (bar.total / maxBar * 100) : 0;
      html += `
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
              <span style="font-size:13px;font-weight:600;color:#261816">${escHtml(bar.name)}</span>
              <span style="font-size:13px;font-weight:700;color:#610000">${eur(bar.total)}</span>
            </div>
            <div style="height:11px;background:#e3beb855;border-radius:6px;overflow:hidden">
              <div style="height:100%;width:${pct.toFixed(1)}%;background:${color};border-radius:6px"></div>
            </div>
          </div>`;
    });
    html += `</div>`;
  }

  if (top3Exp.length > 0 || top3Deals.length > 0) {
    html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:20px">`;
    if (top3Exp.length > 0) {
      html += `<div>
        <p style="font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px">💸 Teuerste Produkte</p>
        ${top3Exp.map((e, i) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #e3beb833">
            <div style="display:flex;align-items:center;gap:8px;overflow:hidden">
              <span style="width:20px;height:20px;border-radius:50%;background:#f8dcd8;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#610000;flex-shrink:0">${i+1}</span>
              <span style="font-size:13px;color:#261816;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(e.produktName)}</span>
            </div>
            <span style="font-size:13px;font-weight:700;color:#610000;white-space:nowrap;margin-left:8px">${eur(e.preis * e.menge)}</span>
          </div>`).join('')}
      </div>`;
    }
    if (top3Deals.length > 0) {
      html += `<div>
        <p style="font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px">🎯 Beste Deals</p>
        ${top3Deals.map(e => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #e3beb833">
            <span style="font-size:13px;color:#261816;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(e.produktName)}</span>
            <span style="font-size:12px;color:#386a20;font-weight:700;white-space:nowrap;margin-left:8px">−${eur(e.saving)}</span>
          </div>`).join('')}
      </div>`;
    }
    html += `</div>`;
  }

  html += `</div></div>`;

  // ─── WOCHENVERBRAUCH ───
  const weeklyStats = calcWeeklyConsumption();
  if (weeklyStats.length > 0) {
    html += `
      <div style="background:#fff;border:1px solid #e3beb866;border-radius:18px;overflow:hidden;margin-bottom:24px;box-shadow:0 2px 8px rgba(0,0,0,.06)">
        <div style="padding:14px 20px;border-bottom:1px solid #e3beb844;background:#f0fdf4;display:flex;align-items:center;gap:10px">
          <span class="material-symbols-outlined" style="font-size:20px;color:#386a20">trending_up</span>
          <span style="font-size:15px;font-weight:700;color:#261816">Verbrauch pro Woche</span>
          <span style="font-size:11px;color:#5a403c">(letzte 4 Wochen)</span>
        </div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;min-width:380px">
            <thead>
              <tr style="background:#f0fdf4">
                <th style="padding:9px 16px;text-align:left;font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em">Produkt</th>
                <th style="padding:9px 14px;text-align:center;font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em;white-space:nowrap">Ø / Woche</th>
                <th style="padding:9px 12px;text-align:center;font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em">Trend</th>
                <th style="padding:9px 16px;text-align:left;font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em">Prognose</th>
              </tr>
            </thead>
            <tbody>
              ${weeklyStats.map((w, i) => `
                <tr style="border-bottom:1px solid #e3beb833;background:${i%2===0?'#fff':'#f8fffe'}">
                  <td style="padding:11px 16px;font-size:14px;font-weight:600;color:#261816">${escHtml(w.name)}</td>
                  <td style="padding:11px 14px;text-align:center;font-size:14px;font-weight:700;color:#386a20">${w.perWeek} ${escHtml(w.einheit||'Stk')}</td>
                  <td style="padding:11px 12px;text-align:center;font-size:20px;color:${w.trend==='↑'?'#ba1a1a':w.trend==='↓'?'#386a20':'#5a403c'}" title="${w.trend==='↑'?'steigend':w.trend==='↓'?'sinkend':'stabil'}">${w.trend}</td>
                  <td style="padding:11px 16px;font-size:13px;color:${w.prognose!=null&&w.prognose<=3?'#ba1a1a':w.prognose!=null&&w.prognose<=7?'#ca8a04':'#5a403c'}">
                    ${w.prognose != null ? `Noch ${w.prognose} Tag${w.prognose!==1?'e':''}` : '—'}
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  // ─── PREISVERLAUF ───
  const priceTrends = calcPriceTrends();
  if (priceTrends.length > 0) {
    html += `
      <div style="background:#fff;border:1px solid #e3beb866;border-radius:18px;overflow:hidden;margin-bottom:24px;box-shadow:0 2px 8px rgba(0,0,0,.06)">
        <div style="padding:14px 20px;border-bottom:1px solid #e3beb844;background:#fff8f6">
          <span style="font-size:15px;font-weight:700;color:#261816">Preisvergleich</span>
        </div>
        <div style="padding:12px 18px;display:flex;flex-direction:column;gap:10px">
          ${priceTrends.map(pt => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:11px 14px;border-radius:12px;background:#fff8f6;border:1px solid #e3beb855;gap:12px">
              <div style="flex:1;min-width:0">
                <div style="font-size:14px;font-weight:600;color:#261816">${escHtml(pt.name)}</div>
                ${pt.diff != null ? `
                  <div style="font-size:12px;margin-top:3px;color:${pt.diff>0.005?'#ba1a1a':pt.diff<-0.005?'#386a20':'#5a403c'}">
                    ${pt.diff > 0.005 ? `↑ ${eur(pt.diff)} teurer als Vormonat` : pt.diff < -0.005 ? `↓ ${eur(Math.abs(pt.diff))} günstiger als Vormonat` : '→ gleich wie Vormonat'}
                  </div>` : ''}
                <div style="font-size:11px;color:#8d6562;margin-top:2px">Günstigster jemals: ${eur(pt.minEver)}</div>
              </div>
              <div style="text-align:right;flex-shrink:0">
                ${pt.currentAvg != null ? `<div style="font-size:16px;font-weight:700;color:#261816">${eur(pt.currentAvg)}</div>` : ''}
                ${pt.currentAvg != null && Math.abs(pt.currentAvg - pt.minEver) < 0.01 ? `<div style="font-size:11px;color:#386a20;font-weight:700">⭐ Bester Preis!</div>` : ''}
              </div>
            </div>`).join('')}
        </div>
      </div>`;
  }

  // ─── HISTORY LIST ───
  html += `
    <div style="background:#fff;border:1px solid #e3beb866;border-radius:18px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06)">
      <div style="padding:14px 20px;border-bottom:1px solid #e3beb844;background:#f8dcd8;display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:15px;font-weight:700;color:#261816">Alle Einkäufe</span>
        <button onclick="_showConfirm('Gesamte Einkaufshistorie löschen?',function(){HISTORY=[];saveHistory();renderVerlaufTab()},{okLabel:'Leeren'})"
          style="padding:5px 12px;border-radius:8px;border:1px solid #e3beb8;background:#fff;font-size:11px;color:#8d6562;cursor:pointer;font-family:inherit">
          Löschen
        </button>
      </div>`;

  if (filtered.length === 0) {
    html += `<div style="padding:32px;text-align:center;color:#8d6562;font-size:13px">Keine Einträge für diesen Filter</div>`;
  } else {
    const shown = filtered.slice(0, 100);
    html += `
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;min-width:380px">
          <thead>
            <tr style="background:#fff8f6">
              <th style="padding:9px 16px;text-align:left;font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em;white-space:nowrap">Datum</th>
              <th style="padding:9px 16px;text-align:left;font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em">Produkt</th>
              <th style="padding:9px 12px;text-align:center;font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em;white-space:nowrap">Menge</th>
              <th style="padding:9px 16px;text-align:left;font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em">Geschäft</th>
              <th style="padding:9px 16px;text-align:right;font-size:11px;font-weight:700;color:#5a403c;text-transform:uppercase;letter-spacing:.07em">Preis</th>
            </tr>
          </thead>
          <tbody>
            ${shown.map((e, i) => `
              <tr style="border-bottom:1px solid #e3beb833;background:${i%2===0?'#fff':'#fff8f6'}">
                <td style="padding:10px 16px;font-size:12px;color:#8d6562;white-space:nowrap">${fmtDate(e.datum)}</td>
                <td style="padding:10px 16px;font-size:13px;font-weight:600;color:#261816">${escHtml(e.produktName)}</td>
                <td style="padding:10px 12px;text-align:center;font-size:13px;color:#5a403c;white-space:nowrap">${e.menge != null ? e.menge : '—'} ${escHtml(e.einheit||'')}</td>
                <td style="padding:10px 16px;font-size:13px;color:#5a403c">${e.shopName ? escHtml(e.shopName) : '—'}</td>
                <td style="padding:10px 16px;text-align:right;font-size:13px;font-weight:600;color:#610000;white-space:nowrap">${e.preis != null ? eur(e.preis) : '—'}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      ${filtered.length > 100 ? `<div style="padding:12px 20px;text-align:center;font-size:12px;color:#8d6562;border-top:1px solid #e3beb833">Zeige 100 von ${filtered.length} Einträgen</div>` : ''}`;
  }

  html += `</div>`;
  panel.innerHTML = _verlHdr + html;

  // ── Chart.js 6-Monats-Balkendiagramm ──
  requestAnimationFrame(() => {
    const canvas = document.getElementById('verlauf-chart-6m');
    if (!canvas || !window.Chart) return;
    if (canvas._chartInstance) canvas._chartInstance.destroy();
    const maxVal = Math.max(...last6.map(d => d.total), 1);
    canvas._chartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: last6.map(d => d.label),
        datasets: [{
          data: last6.map(d => d.total),
          backgroundColor: last6.map(d =>
            d.key === mKey ? '#8B0000' : '#e3beb8'
          ),
          borderRadius: 8,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => eur(ctx.parsed.y)
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
          y: {
            beginAtZero: true,
            grid: { color: '#f0e8e6' },
            ticks: {
              font: { size: 10 },
              callback: v => v === 0 ? '€0' : (v >= 1000 ? (v/1000).toFixed(1)+'k' : v)
            }
          }
        }
      }
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// MITARBEITER — Daten & Helpers
// ═══════════════════════════════════════════════════════════════

const MA_STATE = { view: 'plan', weekKey: null };
const MA_FARBEN = ['#b52619','#1565c0','#2e7d32','#6a1b9a','#00838f','#e65100','#4a148c','#37474f','#c62828','#0277bd'];

function getMitarbeiter() {
  try { return JSON.parse(localStorage.getItem('pizzeria_mitarbeiter') || '[]'); } catch(_) { return []; }
}
function saveMitarbeiterList(list) {
  dbSave('pizzeria_mitarbeiter', list);
}
function _syncMitarbeiterFromDB() {
  fetch('/api/mitarbeiter').then(r => r.ok ? r.json() : Promise.reject()).then(data => {
    if (Array.isArray(data) && data.length > 0) {
      localStorage.setItem('pizzeria_mitarbeiter', JSON.stringify(data));
    }
    renderMitarbeiterTab();
  }).catch(() => { renderMitarbeiterTab(); });
}
function getWochenplan() {
  try { return JSON.parse(localStorage.getItem('pizzeria_wochenplan') || '{}'); } catch(_) { return {}; }
}
function saveWochenplan(plan) {
  try { localStorage.setItem('pizzeria_wochenplan', JSON.stringify(plan)); } catch(_) {}
}

function weekMonday(date) {
  const d = new Date(date);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}
function _localDateStr(d) {
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
function weekKeyFromDate(date) {
  return _localDateStr(weekMonday(date));
}
function prevWeekKey(key) {
  const [y,m,d] = key.split('-').map(Number);
  return _localDateStr(new Date(y, m-1, d-7));
}
function nextWeekKey(key) {
  const [y,m,d] = key.split('-').map(Number);
  return _localDateStr(new Date(y, m-1, d+7));
}
function isoWeekNum(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dn = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dn);
  const ys = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - ys) / 86400000 + 1) / 7);
}
function shiftHours(von, bis) {
  if (!von || !bis) return 0;
  const [h1, m1] = von.split(':').map(Number);
  const [h2, m2] = bis.split(':').map(Number);
  const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
  return diff > 0 ? diff / 60 : 0;
}

function maHinzufuegen() {
  const nameEl   = document.getElementById('ma-name-inp');
  const rolleEl  = document.getElementById('ma-rolle-inp');
  const stundenEl = document.getElementById('ma-stunden-inp');
  const lohnEl   = document.getElementById('ma-lohn-inp');
  const name = nameEl ? nameEl.value.trim() : '';
  if (!name) { _markField('ma-name-inp', true); _showToast('Bitte Namen eingeben', 'error'); return; }
  const rolle   = rolleEl  ? rolleEl.value  : 'Küche';
  const stunden = stundenEl ? parseFloat(stundenEl.value) || 0 : 0;
  const lohn    = lohnEl   ? parseFloat(lohnEl.value)    || 0 : 0;
  const list = getMitarbeiter();
  const newMa = { id: 'ma_' + Date.now(), name, rolle, stunden, lohn, farbe: MA_FARBEN[list.length % MA_FARBEN.length] };
  list.push(newMa);
  saveMitarbeiterList(list);
  _showToast('Mitarbeiter gespeichert ✓', 'success');
  fetch('/api/mitarbeiter', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(newMa) })
    .catch(() => {});
  renderMitarbeiterTab();
}

function maLoeschen(id) {
  _showConfirm('Mitarbeiter wirklich löschen?', function() {
    saveMitarbeiterList(getMitarbeiter().filter(m => m.id !== id));
    fetch('/api/mitarbeiter/' + id, { method:'DELETE' }).catch(()=>{});
    renderMitarbeiterTab();
  });
}

function maBearbeiten(id) {
  const list = getMitarbeiter();
  const ma = list.find(m => m.id === id);
  if (!ma) return;
  const modal = document.createElement('div');
  modal.id = 'ma-edit-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
  modal.innerHTML = `
    <div style="background:#fff;border-radius:20px;padding:28px;max-width:400px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.25)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <div style="font-size:18px;font-weight:800;color:#261816;display:flex;align-items:center;gap:8px">
          <span class="material-symbols-outlined" style="color:#610000">edit</span>Mitarbeiter bearbeiten
        </div>
        <button onclick="document.getElementById('ma-edit-modal').remove()" style="background:none;border:none;cursor:pointer;padding:4px;line-height:0">
          <span class="material-symbols-outlined" style="font-size:22px;color:#8d6562">close</span>
        </button>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px">
        <div>
          <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Name</label>
          <input id="mae-name" type="text" value="${escHtml(ma.name)}"
            style="width:100%;padding:12px 14px;border:1.5px solid #e3beb8;border-radius:12px;font-size:15px;font-family:inherit;outline:none;box-sizing:border-box"
            onfocus="this.style.borderColor='#610000'" onblur="this.style.borderColor='#e3beb8'"/>
        </div>
        <div>
          <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Rolle / Abteilung</label>
          <select id="mae-rolle" style="width:100%;padding:12px 14px;border:1.5px solid #e3beb8;border-radius:12px;font-size:15px;font-family:inherit;outline:none;box-sizing:border-box">
            ${['Küche','Service','Lieferung','Theke','Reinigung','Sonstiges'].map(r => `<option${r===ma.rolle?' selected':''}>${r}</option>`).join('')}
          </select>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div>
            <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">€ / Stunde</label>
            <input id="mae-lohn" type="number" min="0" step="0.5" value="${ma.lohn||0}"
              style="width:100%;padding:12px 14px;border:1.5px solid #e3beb8;border-radius:12px;font-size:15px;font-family:inherit;outline:none;box-sizing:border-box"
              onfocus="this.style.borderColor='#610000'" onblur="this.style.borderColor='#e3beb8'"/>
          </div>
          <div>
            <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Std / Woche</label>
            <input id="mae-stunden" type="number" min="0" max="60" step="0.5" value="${ma.stunden||0}"
              style="width:100%;padding:12px 14px;border:1.5px solid #e3beb8;border-radius:12px;font-size:15px;font-family:inherit;outline:none;box-sizing:border-box"
              onfocus="this.style.borderColor='#610000'" onblur="this.style.borderColor='#e3beb8'"/>
          </div>
        </div>
        <div>
          <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:8px">Farbe</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${['#8B0000','#c62828','#ad1457','#6a1b9a','#283593','#1565c0','#00695c','#2e7d32','#e65100','#4e342e'].map(c =>
              `<button onclick="document.querySelectorAll('.mae-farbe-btn').forEach(b=>b.style.outline='none');this.style.outline='3px solid #333';document.getElementById('mae-farbe-val').value='${c}'"
                class="mae-farbe-btn"
                style="width:32px;height:32px;border-radius:50%;background:${c};border:none;cursor:pointer;outline:${ma.farbe===c?'3px solid #333':'none'}"></button>`
            ).join('')}
          </div>
          <input type="hidden" id="mae-farbe-val" value="${ma.farbe||'#8B0000'}"/>
        </div>
        <button onclick="maSpeichern('${id}')"
          style="width:100%;padding:14px;background:linear-gradient(135deg,#610000,#8b0000);color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;margin-top:4px">
          Speichern
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

function maSpeichern(id) {
  const name    = document.getElementById('mae-name')?.value.trim();
  const rolle   = document.getElementById('mae-rolle')?.value;
  const lohn    = parseFloat(document.getElementById('mae-lohn')?.value) || 0;
  const stunden = parseFloat(document.getElementById('mae-stunden')?.value) || 0;
  const farbe   = document.getElementById('mae-farbe-val')?.value || '#8B0000';
  if (!name) { _showToast('Bitte Namen eingeben', 'error'); return; }
  const list = getMitarbeiter();
  const idx = list.findIndex(m => m.id === id);
  if (idx < 0) return;
  list[idx] = { ...list[idx], name, rolle, lohn, stunden, farbe };
  saveMitarbeiterList(list);
  fetch('/api/mitarbeiter', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(list[idx]) }).catch(()=>{});
  document.getElementById('ma-edit-modal')?.remove();
  _showToast(name + ' gespeichert ✓', 'success');
  renderMitarbeiterTab();
}

function maSetShift(weekKey, maId, day, field, value) {
  const plan = getWochenplan();
  if (!plan[weekKey]) plan[weekKey] = {};
  if (!plan[weekKey][maId]) plan[weekKey][maId] = {};
  if (!plan[weekKey][maId][day]) plan[weekKey][maId][day] = {};
  plan[weekKey][maId][day][field] = value;
  saveWochenplan(plan);
  // Update only the hours display without full re-render (keeps focus)
  const von = plan[weekKey][maId][day].von;
  const bis = plan[weekKey][maId][day].bis;
  const hrs = shiftHours(von, bis);
  const hrsEl = document.getElementById(`hrs_${weekKey.replace(/-/g,'')}_${maId}_${day}`);
  if (hrsEl) {
    hrsEl.style.display = hrs > 0 ? 'block' : 'none';
    hrsEl.textContent = hrs.toFixed(1) + ' Std.';
  }
  // Update summary
  maSummaryUpdate(weekKey);
}

function maClearShift(weekKey, maId, day) {
  const plan = getWochenplan();
  if (plan[weekKey] && plan[weekKey][maId]) delete plan[weekKey][maId][day];
  saveWochenplan(plan);
  renderMitarbeiterTab();
}

function maSummaryUpdate(weekKey) {
  const mitarbeiter = getMitarbeiter();
  const plan = getWochenplan();
  const weekPlan = plan[weekKey] || {};
  for (const ma of mitarbeiter) {
    let total = 0;
    for (let d = 0; d < 7; d++) {
      const s = (weekPlan[ma.id] || {})[d];
      if (s) total += shiftHours(s.von, s.bis);
    }
    const el = document.getElementById(`sum_${ma.id}`);
    if (el) el.textContent = total.toFixed(1) + ' Std.';
  }
}

// ═══════════════════════════════════════════════════════════════
// MITARBEITER TAB — Render
// ═══════════════════════════════════════════════════════════════

function renderMitarbeiterTab() {
  const panel = document.getElementById('panel-mitarbeiter');
  if (!panel) return;

  if (!MA_STATE.weekKey) MA_STATE.weekKey = weekKeyFromDate(new Date());
  const mitarbeiter = getMitarbeiter();
  const weekKey = MA_STATE.weekKey;

  let html = `
    ${_pageHdr('badge', 'Personal', mitarbeiter.length + ' Mitarbeiter · Wochenplan')}

    <div style="display:flex;gap:0;margin-bottom:24px;border-bottom:2px solid #e3beb8">
      <button onclick="MA_STATE.view='plan';renderMitarbeiterTab()"
        style="padding:10px 20px;border:none;background:none;cursor:pointer;font-size:14px;font-weight:600;
               color:${MA_STATE.view==='plan'?'#610000':'#5a403c'};
               border-bottom:${MA_STATE.view==='plan'?'3px solid #610000':'3px solid transparent'};
               margin-bottom:-2px;font-family:inherit;display:flex;align-items:center;gap:6px">
        <span class="material-symbols-outlined" style="font-size:16px">calendar_month</span>Wochenplan
      </button>
      <button onclick="MA_STATE.view='list';renderMitarbeiterTab()"
        style="padding:10px 20px;border:none;background:none;cursor:pointer;font-size:14px;font-weight:600;
               color:${MA_STATE.view==='list'?'#610000':'#5a403c'};
               border-bottom:${MA_STATE.view==='list'?'3px solid #610000':'3px solid transparent'};
               margin-bottom:-2px;font-family:inherit;display:flex;align-items:center;gap:6px">
        <span class="material-symbols-outlined" style="font-size:16px">group</span>Mitarbeiter
        <span style="background:${MA_STATE.view==='list'?'#610000':'#e3beb8'};color:${MA_STATE.view==='list'?'#fff':'#5a403c'};border-radius:20px;padding:1px 7px;font-size:11px">${mitarbeiter.length}</span>
      </button>
      <button onclick="MA_STATE.view='lohn';renderMitarbeiterTab()"
        style="padding:10px 20px;border:none;background:none;cursor:pointer;font-size:14px;font-weight:600;
               color:${MA_STATE.view==='lohn'?'#610000':'#5a403c'};
               border-bottom:${MA_STATE.view==='lohn'?'3px solid #610000':'3px solid transparent'};
               margin-bottom:-2px;font-family:inherit;display:flex;align-items:center;gap:6px">
        <span class="material-symbols-outlined" style="font-size:16px">receipt_long</span>Lohnzettel
      </button>
    </div>`;

  if (MA_STATE.view === 'list') {
    html += renderMAListe(mitarbeiter);
  } else if (MA_STATE.view === 'lohn') {
    html += `<div id="ma-lohn-container"><div style="text-align:center;padding:48px;color:#8d6562"><span class="material-symbols-outlined" style="font-size:40px;display:block;margin-bottom:8px">sync</span>Lohndaten werden geladen…</div></div>`;
  } else {
    html += renderMAWochenplan(mitarbeiter, weekKey);
  }

  panel.innerHTML = html;
  if (MA_STATE.view === 'lohn') { _loadMALohnzettel(); }
}

function renderMAListe(mitarbeiter) {
  let html = `
    <div style="background:#fff;border:1.5px solid #e3beb8;border-radius:18px;padding:24px;margin-bottom:24px">
      <h3 style="font-size:16px;font-weight:800;color:#261816;margin:0 0 18px;display:flex;align-items:center;gap:8px">
        <span class="material-symbols-outlined" style="font-size:20px;color:#610000">person_add</span>
        Neuer Mitarbeiter
      </h3>
      <div style="display:flex;flex-direction:column;gap:12px">
        <div>
          <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Name</label>
          <input id="ma-name-inp" type="text" placeholder="z.B. Ali Shama"
            onkeydown="if(event.key==='Enter')maHinzufuegen()"
            style="width:100%;padding:13px 16px;border:1.5px solid #e3beb8;border-radius:12px;font-size:15px;font-family:inherit;color:#261816;background:#fff;outline:none;box-sizing:border-box"
            onfocus="this.style.borderColor='#610000'" onblur="this.style.borderColor='#e3beb8'"/>
        </div>
        <div>
          <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Rolle / Abteilung</label>
          <select id="ma-rolle-inp"
            style="width:100%;padding:13px 16px;border:1.5px solid #e3beb8;border-radius:12px;font-size:15px;font-family:inherit;color:#261816;background:#fff;outline:none;box-sizing:border-box">
            <option>Küche</option>
            <option>Service</option>
            <option>Lieferung</option>
            <option>Theke</option>
            <option>Reinigung</option>
            <option>Sonstiges</option>
          </select>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div>
            <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Stundenlohn (€/Std)</label>
            <input id="ma-lohn-inp" type="number" min="0" step="0.5" placeholder="z.B. 12.50"
              style="width:100%;padding:13px 16px;border:1.5px solid #e3beb8;border-radius:12px;font-size:15px;font-family:inherit;color:#261816;background:#fff;outline:none;box-sizing:border-box"
              onfocus="this.style.borderColor='#610000'" onblur="this.style.borderColor='#e3beb8'"/>
          </div>
          <div>
            <label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Soll-Std pro Woche</label>
            <input id="ma-stunden-inp" type="number" min="0" max="60" step="0.5" placeholder="z.B. 40"
              style="width:100%;padding:13px 16px;border:1.5px solid #e3beb8;border-radius:12px;font-size:15px;font-family:inherit;color:#261816;background:#fff;outline:none;box-sizing:border-box"
              onfocus="this.style.borderColor='#610000'" onblur="this.style.borderColor='#e3beb8'"/>
          </div>
        </div>
        <button onclick="maHinzufuegen()"
          style="width:100%;padding:14px;background:linear-gradient(135deg,#610000,#8b0000);color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:4px">
          <span class="material-symbols-outlined" style="font-size:20px">person_add</span>Hinzufügen
        </button>
      </div>
    </div>`;

  if (mitarbeiter.length === 0) {
    return html + `
      <div style="text-align:center;padding:48px 20px;background:#fff8f6;border-radius:16px;border:1.5px dashed #e3beb8">
        <span class="material-symbols-outlined" style="font-size:52px;color:#e3beb8">group</span>
        <p style="color:#8d6562;margin-top:12px;font-size:14px">Noch keine Mitarbeiter angelegt</p>
      </div>`;
  }

  // Lohnzettel-Daten laden
  let lohnMap = {};
  try {
    const lohnData = JSON.parse(localStorage.getItem('psc_lohnabrechnungen') || '{}');
    for (const a of (lohnData.abrechnungen || [])) {
      if (!lohnMap[a.name] || a.monat > lohnMap[a.name].monat) lohnMap[a.name] = a;
    }
  } catch(_) {}

  // AG-Kostensätze Österreich
  const AG_SV = 0.2113, DB_S = 0.039, DZ_S = 0.0044, KOMM = 0.03;
  function agGesamt(a) {
    return a.brutto * (1 + AG_SV + DB_S + DZ_S + KOMM) + (a.bv_beitrag || 0);
  }

  let gesamtBrutto = 0, gesamtAG = 0, gesamtNetto = 0;
  for (const ma of mitarbeiter) {
    const lz = lohnMap[ma.name];
    if (lz) { gesamtBrutto += lz.brutto; gesamtAG += agGesamt(lz); gesamtNetto += lz.netto; }
    else { const w = (ma.lohn||0)*(ma.stunden||0)*4.33; gesamtBrutto += w; gesamtAG += w*1.30; }
  }

  html += `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
      <div style="background:linear-gradient(135deg,#610000,#8b0000);border-radius:16px;padding:18px 20px;color:#fff">
        <div style="font-size:11px;font-weight:700;opacity:.8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Brutto Lohn / Monat</div>
        <div style="font-size:26px;font-weight:800">${eur(gesamtBrutto)}</div>
        <div style="font-size:11px;opacity:.7;margin-top:4px">${mitarbeiter.length} Mitarbeiter · Netto AN: ${eur(gesamtNetto)}</div>
      </div>
      <div style="background:#7b0000;border-radius:16px;padding:18px 20px;color:#fff">
        <div style="font-size:11px;font-weight:700;opacity:.8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">AG-Gesamtkosten / Monat</div>
        <div style="font-size:26px;font-weight:800">${eur(gesamtAG)}</div>
        <div style="font-size:11px;opacity:.7;margin-top:4px">inkl. SV-AG, DB, DZ, KommSt, BV</div>
      </div>
    </div>`;

  html += `<div style="display:flex;flex-direction:column;gap:14px">`;
  for (const ma of mitarbeiter) {
    const lz = lohnMap[ma.name];
    const brutto   = lz ? lz.brutto : (ma.lohn||0)*(ma.stunden||0)*4.33;
    const netto    = lz ? lz.netto  : null;
    const agKosten = lz ? agGesamt(lz) : brutto * 1.30;
    const agPlus   = agKosten - brutto;
    const quelle   = lz ? `<span style="color:#2e7d32;font-weight:700">Lohnzettel ${lz.monat}</span>` : `<span style="color:#e65100">geschätzt</span>`;
    html += `
      <div style="background:#fff;border:1.5px solid #e3beb8;border-radius:18px;overflow:hidden">
        <div style="display:flex;align-items:center;gap:16px;padding:18px 20px">
          <div style="width:52px;height:52px;border-radius:50%;background:${ma.farbe};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:22px;font-weight:800;color:#fff">
            ${escHtml(ma.name.charAt(0).toUpperCase())}
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-size:17px;font-weight:800;color:#261816">${escHtml(ma.name)}</div>
            <div style="font-size:13px;color:#8d6562;margin-top:3px;display:flex;align-items:center;gap:6px">
              <span style="width:8px;height:8px;border-radius:50%;background:${ma.farbe};display:inline-block"></span>
              ${escHtml(ma.rolle)} · ${quelle}
            </div>
          </div>
          <div style="display:flex;gap:6px">
            <button onclick="maBearbeiten('${ma.id}')"
              style="background:none;border:1.5px solid #e3beb8;border-radius:10px;cursor:pointer;padding:8px 10px;color:#5a403c;display:flex;align-items:center;line-height:0">
              <span class="material-symbols-outlined" style="font-size:20px">edit</span>
            </button>
            <button onclick="maLoeschen('${ma.id}')"
              style="background:none;border:1.5px solid #e3beb8;border-radius:10px;cursor:pointer;padding:8px 10px;color:#8d6562;display:flex;align-items:center;line-height:0">
              <span class="material-symbols-outlined" style="font-size:20px">delete</span>
            </button>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;border-top:1.5px solid #f0e8e6;background:#fdf8f7">
          <div style="padding:14px 16px;text-align:center;border-right:1px solid #f0e8e6">
            <div style="font-size:11px;color:#8d6562;font-weight:600;margin-bottom:4px">Brutto / Monat</div>
            <div style="font-size:18px;font-weight:800;color:#261816">${eur(brutto)}</div>
          </div>
          <div style="padding:14px 16px;text-align:center;border-right:1px solid #f0e8e6">
            <div style="font-size:11px;color:#8d6562;font-weight:600;margin-bottom:4px">Netto AN</div>
            <div style="font-size:18px;font-weight:800;color:#2e7d32">${netto != null ? eur(netto) : '—'}</div>
          </div>
          <div style="padding:14px 16px;text-align:center;background:#fff8f6">
            <div style="font-size:11px;color:#8d6562;font-weight:600;margin-bottom:4px">AG-Gesamtkosten</div>
            <div style="font-size:18px;font-weight:800;color:#610000">${eur(agKosten)}</div>
            <div style="font-size:10px;color:#8d6562">+${eur(agPlus)} Abgaben</div>
          </div>
        </div>
      </div>`;
  }
  return html + `</div>`;
}

// ── Lohnzettel-Tab: lädt /api/mitarbeiter/abgleich und zeigt Gehälter ─────
async function _loadMALohnzettel() {
  const container = document.getElementById('ma-lohn-container');
  if (!container) return;
  try {
    const r = await fetch('/api/mitarbeiter/abgleich');
    const data = await r.json();
    container.innerHTML = _renderMALohnzettelHTML(data);
  } catch(e) {
    container.innerHTML = '<div style="padding:32px;text-align:center;color:#c62828">Fehler beim Laden: ' + _esc(e.message||'Unbekannt') + '</div>';
  }
}

function _renderMALohnzettelHTML(data) {
  const { dbCount, pdfCount, monat, pdfMitarbeiter, fehlende } = data;
  const monatLabels = ['','Jän','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
  const monatLabel = monat ? (monatLabels[parseInt(monat.split('-')[1])] + ' ' + monat.split('-')[0]) : '';
  let html = '';

  // Warnbanner wenn Anzahl nicht übereinstimmt
  if (fehlende && fehlende.length > 0) {
    html += `<div style="background:#fff3cd;border:1.5px solid #ffc107;border-radius:14px;padding:16px 18px;margin-bottom:16px;display:flex;align-items:flex-start;gap:12px">
      <span class="material-symbols-outlined" style="font-size:24px;color:#e65100;flex-shrink:0;margin-top:2px">warning</span>
      <div style="flex:1">
        <div style="font-size:14px;font-weight:800;color:#7b4b00;margin-bottom:4px">⚠️ ${fehlende.length} Mitarbeiter fehlen in der Datenbank</div>
        <div style="font-size:12px;color:#5a4000">Lohnzettel ${monatLabel}: ${pdfCount} Personen — Datenbank: ${dbCount} Personen.</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
          <button onclick="_maAlleFehlendHinzufuegen()" style="padding:9px 18px;background:#e65100;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px">
            <span class="material-symbols-outlined" style="font-size:16px">person_add</span>Alle ${fehlende.length} fehlenden hinzufügen
          </button>
          <button onclick="buchSyncLohnzettel()" style="padding:9px 18px;background:#1565c0;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px">
            <span class="material-symbols-outlined" style="font-size:16px">sync</span>Stunden + Gehalt übernehmen
          </button>
        </div>
      </div>
    </div>`;
  } else if (pdfMitarbeiter && pdfMitarbeiter.length > 0) {
    html += `<div style="background:#e8f5e9;border:1.5px solid #81c784;border-radius:14px;padding:14px 18px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
      <div style="display:flex;align-items:center;gap:10px">
        <span class="material-symbols-outlined" style="font-size:22px;color:#2e7d32">check_circle</span>
        <div style="font-size:13px;font-weight:700;color:#1b5e20">Alle ${pdfCount} Mitarbeiter aus Lohnzettel ${monatLabel} vorhanden</div>
      </div>
      <button onclick="buchSyncLohnzettel()" style="padding:8px 16px;background:#1565c0;color:#fff;border:none;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px">
        <span class="material-symbols-outlined" style="font-size:15px">sync</span>Stunden + Gehalt übernehmen
      </button>
    </div>`;
  }

  if (!pdfMitarbeiter || pdfMitarbeiter.length === 0) {
    return html + `<div style="text-align:center;padding:48px;background:#fff8f6;border-radius:16px;border:1.5px dashed #e3beb8">
      <span class="material-symbols-outlined" style="font-size:52px;color:#e3beb8;display:block">receipt_long</span>
      <p style="color:#8d6562;margin-top:14px;font-size:14px">Noch keine Lohnabrechnungen importiert.<br>Gehe zu <strong>Buchhaltung → PDF hochladen</strong>.</p>
    </div>`;
  }

  // Lohnzettel-Header mit Gesamtübersicht
  const gesamtBrutto = pdfMitarbeiter.reduce((s, m) => s + (m.brutto||0), 0);
  const gesamtNetto  = pdfMitarbeiter.reduce((s, m) => s + (m.netto||0), 0);
  const gesamtAusz   = pdfMitarbeiter.reduce((s, m) => s + (m.auszahlung||0), 0);

  html += `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px">
    <div style="background:linear-gradient(135deg,#610000,#8b0000);border-radius:14px;padding:14px 16px;color:#fff;text-align:center">
      <div style="font-size:11px;font-weight:700;opacity:.8;margin-bottom:4px">BRUTTO GESAMT</div>
      <div style="font-size:20px;font-weight:800">€ ${gesamtBrutto.toLocaleString('de-AT',{minimumFractionDigits:2})}</div>
    </div>
    <div style="background:#fff;border:1.5px solid #e3beb8;border-radius:14px;padding:14px 16px;text-align:center">
      <div style="font-size:11px;font-weight:700;color:#5a403c;margin-bottom:4px">NETTO GESAMT</div>
      <div style="font-size:20px;font-weight:800;color:#261816">€ ${gesamtNetto.toLocaleString('de-AT',{minimumFractionDigits:2})}</div>
    </div>
    <div style="background:#e8f5e9;border:1.5px solid #81c784;border-radius:14px;padding:14px 16px;text-align:center">
      <div style="font-size:11px;font-weight:700;color:#2e7d32;margin-bottom:4px">AUSZAHLUNG</div>
      <div style="font-size:20px;font-weight:800;color:#1b5e20">€ ${gesamtAusz.toLocaleString('de-AT',{minimumFractionDigits:2})}</div>
    </div>
  </div>`;

  // Mitarbeiter-Karten
  html += `<div style="display:flex;flex-direction:column;gap:12px">`;
  const MA_FARBEN_LIST = ['#8B0000','#c62828','#ad1457','#6a1b9a','#283593','#1565c0','#00695c','#2e7d32','#e65100','#4e342e'];
  pdfMitarbeiter.forEach(function(ma, idx) {
    const matched = !!ma.dbMatch;
    const sv = Math.abs(ma.sv_lfd||0) + Math.abs(ma.sv_sz||0) + Math.abs(ma.lst_lfd||0);
    const farbe = MA_FARBEN_LIST[idx % MA_FARBEN_LIST.length];
    html += `<div style="background:#fff;border:1.5px solid ${matched?'#e3beb8':'#ffc107'};border-radius:18px;overflow:hidden">
      <div style="display:flex;align-items:center;gap:14px;padding:16px 18px">
        <div style="width:46px;height:46px;border-radius:50%;background:${farbe};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:18px;font-weight:800;color:#fff">${(ma.name||'?').charAt(0)}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:15px;font-weight:800;color:#261816">${ma.name}</div>
          <div style="font-size:12px;color:#8d6562;margin-top:2px">${ma.beruf||'—'}</div>
        </div>
        ${matched
          ? `<span style="background:#e8f5e9;color:#2e7d32;border-radius:20px;padding:4px 12px;font-size:11px;font-weight:700;display:flex;align-items:center;gap:4px"><span class="material-symbols-outlined" style="font-size:13px">check_circle</span>In DB</span>`
          : `<div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
               <span style="background:#fff3cd;color:#7b4b00;border-radius:20px;padding:4px 12px;font-size:11px;font-weight:700;display:flex;align-items:center;gap:4px"><span class="material-symbols-outlined" style="font-size:13px">warning</span>Fehlt</span>
               <button onclick="_maFehlendHinzufuegen('${ma.name.replace(/'/g,"\\'")}','${(ma.beruf||'').replace(/'/g,"\\'")}',${ma.auszahlung||0})" style="padding:6px 12px;background:#e65100;color:#fff;border:none;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">+ Hinzufügen</button>
             </div>`
        }
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;border-top:1px solid #f0e8e6;background:#fdf8f7">
        <div style="padding:12px 14px;text-align:center;border-right:1px solid #f0e8e6">
          <div style="font-size:10px;color:#8d6562;font-weight:600;margin-bottom:3px">Brutto</div>
          <div style="font-size:15px;font-weight:800;color:#261816">€ ${(ma.brutto||0).toFixed(2).replace('.',',')}</div>
        </div>
        <div style="padding:12px 14px;text-align:center;border-right:1px solid #f0e8e6">
          <div style="font-size:10px;color:#8d6562;font-weight:600;margin-bottom:3px">SV + LSt</div>
          <div style="font-size:15px;font-weight:800;color:#c62828">- € ${sv.toFixed(2).replace('.',',')}</div>
        </div>
        <div style="padding:12px 14px;text-align:center;border-right:1px solid #f0e8e6">
          <div style="font-size:10px;color:#8d6562;font-weight:600;margin-bottom:3px">Netto</div>
          <div style="font-size:15px;font-weight:800;color:#261816">€ ${(ma.netto||0).toFixed(2).replace('.',',')}</div>
        </div>
        <div style="padding:12px 14px;text-align:center">
          <div style="font-size:10px;color:#2e7d32;font-weight:600;margin-bottom:3px">Auszahlung</div>
          <div style="font-size:15px;font-weight:800;color:#2e7d32">€ ${(ma.auszahlung||0).toFixed(2).replace('.',',')}</div>
        </div>
      </div>
    </div>`;
  });
  html += `</div>`;
  return html;
}

async function _maFehlendHinzufuegen(name, beruf, auszahlung) {
  const list = getMitarbeiter();
  const newMa = { id: 'ma_' + Date.now(), name, rolle: 'Küche', stunden: 40, lohn: +(auszahlung/4.33/40).toFixed(2), farbe: '#8B0000' };
  list.push(newMa);
  saveMitarbeiterList(list);
  await fetch('/api/mitarbeiter', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(newMa) }).catch(()=>{});
  _showToast(name + ' hinzugefügt ✓', 'success');
  _loadMALohnzettel();
}

async function _maAlleFehlendHinzufuegen() {
  try {
    const r = await fetch('/api/mitarbeiter/abgleich');
    const data = await r.json();
    if (!data.fehlende || data.fehlende.length === 0) { _showToast('Alle bereits vorhanden', 'info'); return; }
    for (const ma of data.fehlende) {
      await _maFehlendHinzufuegen(ma.name, ma.beruf, ma.auszahlung||0);
      await new Promise(res => setTimeout(res, 50));
    }
    _showToast(data.fehlende.length + ' Mitarbeiter hinzugefügt ✓', 'success');
    _loadMALohnzettel();
  } catch(e) { _showToast('Fehler: ' + e.message, 'error'); }
}

function renderMAWochenplan(mitarbeiter, weekKey) {
  const [_wy,_wm,_wd] = weekKey.split('-').map(Number);
  const weekStart = new Date(_wy, _wm-1, _wd);
  const weekEnd   = new Date(_wy, _wm-1, _wd+6);
  const plan      = getWochenplan();
  const weekPlan  = plan[weekKey] || {};
  const kw        = isoWeekNum(weekStart);
  const DAYS_SHORT = ['Mo','Di','Mi','Do','Fr','Sa','So'];
  const today     = new Date().toDateString();

  // Week nav
  let html = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;background:#fff;border:1.5px solid #e3beb8;border-radius:16px;padding:14px 18px">
      <button onclick="MA_STATE.weekKey='${prevWeekKey(weekKey)}';renderMitarbeiterTab()"
        style="padding:8px 12px;background:#f9f4f3;border:1px solid #e3beb8;border-radius:10px;cursor:pointer;line-height:0">
        <span class="material-symbols-outlined" style="font-size:22px;color:#5a403c">chevron_left</span>
      </button>
      <div style="text-align:center">
        <div style="font-size:18px;font-weight:800;color:#261816">KW ${kw}</div>
        <div style="font-size:13px;color:#8d6562">${weekStart.toLocaleDateString('de-AT',{day:'numeric',month:'long'})} – ${weekEnd.toLocaleDateString('de-AT',{day:'numeric',month:'long',year:'numeric'})}</div>
      </div>
      <button onclick="MA_STATE.weekKey='${nextWeekKey(weekKey)}';renderMitarbeiterTab()"
        style="padding:8px 12px;background:#f9f4f3;border:1px solid #e3beb8;border-radius:10px;cursor:pointer;line-height:0">
        <span class="material-symbols-outlined" style="font-size:22px;color:#5a403c">chevron_right</span>
      </button>
    </div>`;

  if (mitarbeiter.length === 0) {
    return html + `
      <div style="text-align:center;padding:56px 20px;background:#fff8f6;border-radius:16px;border:1.5px dashed #e3beb8">
        <span class="material-symbols-outlined" style="font-size:56px;color:#e3beb8">calendar_month</span>
        <p style="color:#8d6562;margin-top:16px;font-size:15px">Zuerst Mitarbeiter anlegen</p>
        <button onclick="MA_STATE.view='list';renderMitarbeiterTab()"
          style="margin-top:14px;padding:12px 24px;background:#610000;color:#fff;border:none;border-radius:12px;cursor:pointer;font-family:inherit;font-size:14px;font-weight:700">
          Mitarbeiter anlegen
        </button>
      </div>`;
  }

  // Table: rows = employees, cols = days
  html += `<div style="overflow-x:auto;border-radius:18px;border:1.5px solid #e3beb8;background:#fff">
    <table style="width:100%;border-collapse:collapse;min-width:700px">
      <thead>
        <tr style="background:#f9f4f3">
          <th style="padding:14px 18px;text-align:left;font-size:13px;font-weight:700;color:#5a403c;border-bottom:1.5px solid #e3beb8;min-width:130px">Mitarbeiter</th>`;

  for (let d = 0; d < 7; d++) {
    const dayDate  = new Date(weekStart); dayDate.setDate(weekStart.getDate() + d);
    const isToday  = dayDate.toDateString() === today;
    const dayNum   = dayDate.toLocaleDateString('de-AT', { day:'numeric', month:'numeric' });
    html += `
          <th style="padding:12px 8px;text-align:center;font-size:12px;font-weight:700;border-bottom:1.5px solid #e3beb8;border-left:1px solid #f0e8e6;min-width:110px;background:${isToday?'#fff0ee':''}">
            <div style="color:${isToday?'#610000':'#261816'};font-size:13px;font-weight:800">${DAYS_SHORT[d]}</div>
            <div style="color:${isToday?'#b52619':'#8d6562'};font-size:11px;font-weight:500">${dayNum}</div>
            ${isToday?'<div style="width:6px;height:6px;border-radius:50%;background:#610000;margin:4px auto 0"></div>':''}
          </th>`;
  }

  html += `
          <th style="padding:12px 10px;text-align:center;font-size:12px;font-weight:700;color:#5a403c;border-bottom:1.5px solid #e3beb8;border-left:2px solid #e3beb8;min-width:80px">Gesamt</th>
        </tr>
      </thead>
      <tbody>`;

  let gesamtLohn = 0;

  for (const ma of mitarbeiter) {
    let totalHrs = 0;
    for (let d = 0; d < 7; d++) {
      const s = (weekPlan[ma.id] || {})[d];
      if (s) totalHrs += shiftHours(s.von, s.bis);
    }
    const lohnWoche = (ma.lohn || 0) * totalHrs;
    gesamtLohn += lohnWoche;
    const wk = weekKey.replace(/-/g,'');

    html += `
        <tr style="border-bottom:1px solid #f0e8e6">
          <td style="padding:14px 18px;border-right:1px solid #f0e8e6">
            <div style="display:flex;align-items:center;gap:10px">
              <div style="width:36px;height:36px;border-radius:50%;background:${ma.farbe};display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800;color:#fff;flex-shrink:0">
                ${escHtml(ma.name.charAt(0).toUpperCase())}
              </div>
              <div>
                <div style="font-size:14px;font-weight:700;color:#261816;white-space:nowrap">${escHtml(ma.name)}</div>
                <div style="font-size:11px;color:#8d6562">${escHtml(ma.rolle)}</div>
              </div>
            </div>
          </td>`;

    for (let d = 0; d < 7; d++) {
      const dayDate = new Date(weekStart); dayDate.setDate(weekStart.getDate() + d);
      const isToday = dayDate.toDateString() === today;
      const shift   = (weekPlan[ma.id] || {})[d] || {};
      const hasShift = !!(shift.von && shift.bis);
      const hrs     = shiftHours(shift.von, shift.bis);
      const safeId  = `${wk}_${ma.id}_${d}`;

      html += `
          <td style="padding:8px 6px;text-align:center;border-left:1px solid #f0e8e6;background:${isToday?'#fffaf9':''}${hasShift?';background:'+ma.farbe+'0a':''}">
            <div style="display:flex;flex-direction:column;align-items:center;gap:3px">
              <input type="time" value="${shift.von || ''}"
                onchange="maSetShift('${weekKey}','${ma.id}',${d},'von',this.value)"
                style="width:90px;padding:5px 6px;border:1px solid ${hasShift?ma.farbe:'#e3beb8'};border-radius:7px;font-size:12px;font-family:inherit;background:#fff;color:#261816;text-align:center"/>
              <input type="time" value="${shift.bis || ''}"
                onchange="maSetShift('${weekKey}','${ma.id}',${d},'bis',this.value)"
                style="width:90px;padding:5px 6px;border:1px solid ${hasShift?ma.farbe:'#e3beb8'};border-radius:7px;font-size:12px;font-family:inherit;background:#fff;color:#261816;text-align:center"/>
              <div id="hrs_${safeId}" style="font-size:11px;font-weight:700;color:${ma.farbe};display:${hrs>0?'block':'none'}">${hrs.toFixed(1)} Std</div>
              ${hasShift?`<button onclick="maClearShift('${weekKey}','${ma.id}',${d})" style="background:none;border:none;cursor:pointer;padding:0;color:#8a6a66;line-height:0;font-size:10px" title="Löschen"><span class="material-symbols-outlined" style="font-size:13px">close</span></button>`:''}
            </div>
          </td>`;
    }

    html += `
          <td style="padding:14px 10px;text-align:center;border-left:2px solid #e3beb8;background:#fdf8f7">
            <div id="sum_${ma.id}" style="font-size:16px;font-weight:800;color:${totalHrs>0?ma.farbe:'#9c7874'}">${totalHrs.toFixed(1)}</div>
            <div style="font-size:10px;color:#8d6562">Std</div>
            ${lohnWoche>0?`<div style="font-size:11px;font-weight:700;color:#610000;margin-top:2px">${eur(lohnWoche)}</div>`:''}
          </td>
        </tr>`;
  }

  html += `</tbody></table></div>`;

  // Summary bar
  if (gesamtLohn > 0) {
    html += `
      <div style="margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div style="background:linear-gradient(135deg,#610000,#8b0000);border-radius:14px;padding:16px 20px;color:#fff;text-align:center">
          <div style="font-size:11px;font-weight:700;opacity:.8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">Lohnkosten KW ${kw}</div>
          <div style="font-size:24px;font-weight:800">${eur(gesamtLohn)}</div>
        </div>
        <div style="background:#fff;border:1.5px solid #e3beb8;border-radius:14px;padding:16px 20px;text-align:center">
          <div style="font-size:11px;font-weight:700;color:#8d6562;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">Hochgerechnet / Monat</div>
          <div style="font-size:24px;font-weight:800;color:#261816">${eur(gesamtLohn * 4.33)}</div>
        </div>
      </div>`;
  }

  return html;
}




// ═══════════════════════════════════════════════════════════════
// js/angebote.js
// ═══════════════════════════════════════════════════════════════
// js/angebote.js — Aktionsfinder-Style Prospekte System
// ═══════════════════════════════════════════════════════════════

// ═══ STATE ═══════════════════════════════════════════════════════
const ANGEBOTE_STATE = {
  view: 'prospekte',      // 'prospekte' | 'detail' | 'suche' | 'neu' | 'live'
  selectedProspektId: null,
  searchQuery: '',
  filterStore: '',
  filterCategory: '',
  filterBundesland: '',
  liveStoreId: null,
  liveLoading: false,
  liveError: null,
  liveFilterCat: '',
};

// ═══ LIVE STORES ═════════════════════════════════════════════════
const LIVE_STORES = [
  { id:'lidl',  name:'Lidl',  gradient:'linear-gradient(135deg,#0050AA,#003d8f)', color:'#0050AA', emoji:'🛒' },
  { id:'hofer', name:'Hofer', gradient:'linear-gradient(135deg,#F7941D,#e07a08)', color:'#F7941D', emoji:'🏷️' },
  { id:'billa', name:'Billa', gradient:'linear-gradient(135deg,#ed1c24,#b5121b)', color:'#ed1c24', emoji:'🛍️' },
  { id:'spar',  name:'Spar',  gradient:'linear-gradient(135deg,#007f3e,#005a2c)', color:'#007f3e', emoji:'🌿' },
  { id:'metro', name:'Metro', gradient:'linear-gradient(135deg,#003DA5,#00297a)', color:'#003DA5', emoji:'🏪' },
  { id:'penny', name:'Penny', gradient:'linear-gradient(135deg,#cc0000,#990000)', color:'#cc0000', emoji:'💰' },
  { id:'etsan', name:'Etsan', gradient:'linear-gradient(135deg,#ff6b00,#cc5500)', color:'#ff6b00', emoji:'🥩' },
];

// ═══ PROSPEKTE DATA ══════════════════════════════════════════════
// KW16 = 14.04.–20.04.2026  |  KW17 = 21.04.–27.04.2026
const PROSPEKTE = [

  // ── KW16: Diese Woche (14.04. – 20.04.2026) ──────────────────
  {
    id: 'lidl-kw16',
    store: 'Lidl',
    storeId: 'lidl',
    color: '#0050AA',
    gradient: 'linear-gradient(135deg,#0050AA 0%,#003d8f 100%)',
    emoji: '🛒',
    title: 'Lidl Frische-Woche KW16',
    subtitle: 'Gültig: 14.04. – 20.04.',
    valid_from: '2026-04-14',
    valid_to: '2026-04-20',
    category: 'Lebensmittel',
    bundesland: 'all',
    sponsored: false,
    deals: [
      { id:'ld16a', name:'Mozzarella di Bufala 250g',   price:2.79,  normalPrice:3.99,  unit:'Stk',     category:'Käse',         discount:30 },
      { id:'ld16b', name:'Pizzamehl Tipo 00 1kg',        price:0.55,  normalPrice:0.79,  unit:'kg',      category:'Grundzutaten', discount:30 },
      { id:'ld16c', name:'Tomatensauce passiert 500ml',  price:0.65,  normalPrice:0.99,  unit:'Dose',    category:'Grundzutaten', discount:34 },
      { id:'ld16d', name:'Frische Hefe',                 price:0.25,  normalPrice:0.39,  unit:'Päck.',   category:'Grundzutaten', discount:36 },
      { id:'ld16e', name:'Salami Milano 200g',           price:5.99,  normalPrice:7.99,  unit:'kg',      category:'Belag',        discount:25 },
      { id:'ld16f', name:'Parmesan gerieben 100g',       price:1.39,  normalPrice:1.99,  unit:'Stk',     category:'Käse',         discount:30 },
      { id:'ld16g', name:'Olivenöl nativ extra 500ml',   price:3.29,  normalPrice:4.99,  unit:'Flasche', category:'Grundzutaten', discount:34 },
      { id:'ld16h', name:'Cherry-Tomaten 500g',          price:1.29,  normalPrice:1.79,  unit:'Stk',     category:'Gemüse',       discount:28 },
    ]
  },
  {
    id: 'billa-kw16',
    store: 'Billa',
    storeId: 'billa',
    color: '#ed1c24',
    gradient: 'linear-gradient(135deg,#ed1c24 0%,#b5121b 100%)',
    emoji: '🛍️',
    title: 'Billa Wochenangebote KW16',
    subtitle: 'Gültig: 14.04. – 20.04.',
    valid_from: '2026-04-14',
    valid_to: '2026-04-20',
    category: 'Lebensmittel',
    bundesland: 'all',
    sponsored: false,
    deals: [
      { id:'bi16a', name:'Burrata 200g',                price:2.79,  normalPrice:3.99,  unit:'Stk',     category:'Käse',         discount:30 },
      { id:'bi16b', name:'Rucola 100g',                 price:0.89,  normalPrice:1.29,  unit:'Bund',    category:'Gemüse',       discount:31 },
      { id:'bi16c', name:'Prosciutto Crudo 100g',       price:1.79,  normalPrice:2.49,  unit:'Stk',     category:'Belag',        discount:28 },
      { id:'bi16d', name:'Mortadella 150g',             price:1.19,  normalPrice:1.79,  unit:'Stk',     category:'Belag',        discount:34 },
      { id:'bi16e', name:'Ricotta 250g',                price:0.99,  normalPrice:1.59,  unit:'Stk',     category:'Käse',         discount:38 },
      { id:'bi16f', name:'Weizenbier 6er-Pack',         price:5.49,  normalPrice:7.99,  unit:'Pack',    category:'Getränke',     discount:31 },
      { id:'bi16g', name:'Frischer Basilikum',          price:0.69,  normalPrice:0.99,  unit:'Bund',    category:'Gewürze',      discount:30 },
    ]
  },
  {
    id: 'metro-kw16',
    store: 'Metro',
    storeId: 'metro',
    color: '#003DA5',
    gradient: 'linear-gradient(135deg,#003DA5 0%,#00297a 100%)',
    emoji: '🏪',
    title: 'Metro Gastro-Deals April',
    subtitle: 'Gültig: 08.04. – 21.04.',
    valid_from: '2026-04-08',
    valid_to: '2026-04-21',
    category: 'Gastronomie',
    bundesland: 'all',
    sponsored: true,
    deals: [
      { id:'me16a', name:'Olivenöl Extra Vergine 3L',    price:3.99,  normalPrice:5.49,  unit:'Liter',   category:'Grundzutaten', discount:27 },
      { id:'me16b', name:'Parmigiano Reggiano 1kg',      price:6.99,  normalPrice:8.99,  unit:'kg',      category:'Käse',         discount:22 },
      { id:'me16c', name:'San Marzano Tomaten 2,5kg',    price:2.99,  normalPrice:4.49,  unit:'Dose',    category:'Grundzutaten', discount:33 },
      { id:'me16d', name:'Pizzamehl Tipo 00 25kg',       price:16.90, normalPrice:24.90, unit:'Sack',    category:'Grundzutaten', discount:32 },
      { id:'me16e', name:'Mozzarella Fior di Latte 1kg', price:4.49,  normalPrice:6.49,  unit:'kg',      category:'Käse',         discount:31 },
      { id:'me16f', name:'Prosciutto Crudo 1kg',         price:13.90, normalPrice:18.90, unit:'kg',      category:'Belag',        discount:26 },
      { id:'me16g', name:'Pizzakarton 33cm 100er',       price:7.90,  normalPrice:11.90, unit:'Pack',    category:'Verpackung',   discount:34 },
      { id:'me16h', name:'Einweghandschuhe L 100er',     price:3.99,  normalPrice:5.99,  unit:'Pack',    category:'Haushalt',     discount:33 },
      { id:'me16i', name:'Basilikum Pesto 500g',         price:3.49,  normalPrice:5.49,  unit:'Glas',    category:'Saucen',       discount:36 },
      { id:'me16j', name:'Frischhaltefolie 300m',        price:11.90, normalPrice:16.90, unit:'Rolle',   category:'Haushalt',     discount:30 },
    ]
  },
  {
    id: 'hofer-kw16',
    store: 'Hofer',
    storeId: 'hofer',
    color: '#F7941D',
    gradient: 'linear-gradient(135deg,#F7941D 0%,#e07a08 100%)',
    emoji: '🏷️',
    title: 'Hofer Aktionswoche KW16',
    subtitle: 'Gültig: 14.04. – 20.04.',
    valid_from: '2026-04-14',
    valid_to: '2026-04-20',
    category: 'Lebensmittel',
    bundesland: 'all',
    sponsored: false,
    deals: [
      { id:'ho16a', name:'Mozzarella 125g',             price:1.79,  normalPrice:2.49,  unit:'Stk',     category:'Käse',         discount:28 },
      { id:'ho16b', name:'Weizenmehl 1kg',              price:0.59,  normalPrice:0.89,  unit:'kg',      category:'Grundzutaten', discount:34 },
      { id:'ho16c', name:'Passierte Tomaten 500g',      price:0.69,  normalPrice:0.99,  unit:'Stk',     category:'Grundzutaten', discount:30 },
      { id:'ho16d', name:'Kochsalami 400g',             price:2.49,  normalPrice:3.99,  unit:'Stk',     category:'Belag',        discount:38 },
      { id:'ho16e', name:'Sonnenblumenöl 1L',           price:1.09,  normalPrice:1.79,  unit:'Flasche', category:'Grundzutaten', discount:39 },
      { id:'ho16f', name:'Knoblauch Knolle',            price:0.49,  normalPrice:0.89,  unit:'Stk',     category:'Gewürze',      discount:45 },
    ]
  },
  {
    id: 'spar-kw16',
    store: 'Spar',
    storeId: 'spar',
    color: '#007f3e',
    gradient: 'linear-gradient(135deg,#007f3e 0%,#005a2c 100%)',
    emoji: '🌿',
    title: 'Spar Genuss-Woche KW16',
    subtitle: 'Gültig: 10.04. – 23.04.',
    valid_from: '2026-04-10',
    valid_to: '2026-04-23',
    category: 'Lebensmittel',
    bundesland: 'all',
    sponsored: false,
    deals: [
      { id:'sp16a', name:'Parmigiano Reggiano 100g',    price:2.29,  normalPrice:3.29,  unit:'Stk',     category:'Käse',         discount:30 },
      { id:'sp16b', name:'Olivenöl nativ extra 750ml',  price:4.49,  normalPrice:6.49,  unit:'Flasche', category:'Grundzutaten', discount:31 },
      { id:'sp16c', name:'Burrata 200g',                price:2.69,  normalPrice:3.99,  unit:'Stk',     category:'Käse',         discount:33 },
      { id:'sp16d', name:'Antipasti Mix 200g',          price:2.99,  normalPrice:4.99,  unit:'Glas',    category:'Belag',        discount:40 },
      { id:'sp16e', name:'Focaccia-Brot',               price:1.79,  normalPrice:2.49,  unit:'Stk',     category:'Bäckerei',     discount:28 },
      { id:'sp16f', name:'Pinienkerne 100g',            price:1.99,  normalPrice:2.99,  unit:'Tüte',    category:'Sonstiges',    discount:33 },
      { id:'sp16g', name:'San Pellegrino 6×0,75L',      price:3.99,  normalPrice:5.99,  unit:'Pack',    category:'Getränke',     discount:33 },
    ]
  },
  {
    id: 'penny-kw16',
    store: 'Penny',
    storeId: 'penny',
    color: '#cc0000',
    gradient: 'linear-gradient(135deg,#cc0000 0%,#990000 100%)',
    emoji: '💰',
    title: 'Penny Wochenangebote KW16',
    subtitle: 'Gültig: 14.04. – 20.04.',
    valid_from: '2026-04-14',
    valid_to: '2026-04-20',
    category: 'Lebensmittel',
    bundesland: 'all',
    sponsored: false,
    deals: [
      { id:'pe16a', name:'Salami Milano 300g',          price:4.99,  normalPrice:7.49,  unit:'Stk',     category:'Belag',        discount:33 },
      { id:'pe16b', name:'Frische Hefe',                price:0.29,  normalPrice:0.45,  unit:'Päck.',   category:'Grundzutaten', discount:36 },
      { id:'pe16c', name:'Gouda jung 400g',             price:1.99,  normalPrice:3.19,  unit:'Stk',     category:'Käse',         discount:38 },
      { id:'pe16d', name:'Oregano getrocknet 20g',      price:0.49,  normalPrice:0.89,  unit:'Päck.',   category:'Gewürze',      discount:45 },
      { id:'pe16e', name:'Tomatenpüree 200g',           price:0.39,  normalPrice:0.59,  unit:'Dose',    category:'Grundzutaten', discount:34 },
    ]
  },

  // ── KW17: Nächste Woche (21.04. – 27.04.2026) ────────────────
  {
    id: 'lidl-kw17',
    store: 'Lidl',
    storeId: 'lidl',
    color: '#0050AA',
    gradient: 'linear-gradient(135deg,#0050AA 0%,#003d8f 100%)',
    emoji: '🛒',
    title: 'Lidl Vorschau KW17',
    subtitle: 'Ab Montag 21.04.',
    valid_from: '2026-04-21',
    valid_to: '2026-04-27',
    category: 'Lebensmittel',
    bundesland: 'all',
    sponsored: false,
    deals: [
      { id:'ld17a', name:'Grana Padano 200g',           price:2.99,  normalPrice:4.49,  unit:'Stk',     category:'Käse',         discount:33 },
      { id:'ld17b', name:'Passata di Pomodoro 700ml',   price:0.99,  normalPrice:1.49,  unit:'Flasche', category:'Grundzutaten', discount:34 },
      { id:'ld17c', name:'Pepperoni eingelegt 330g',    price:1.49,  normalPrice:2.29,  unit:'Glas',    category:'Belag',        discount:35 },
      { id:'ld17d', name:'Rucola 100g',                 price:0.79,  normalPrice:1.29,  unit:'Bund',    category:'Gemüse',       discount:39 },
      { id:'ld17e', name:'Oliven schwarz 185g',         price:0.89,  normalPrice:1.49,  unit:'Dose',    category:'Belag',        discount:40 },
    ]
  },
  {
    id: 'billa-kw17',
    store: 'Billa',
    storeId: 'billa',
    color: '#ed1c24',
    gradient: 'linear-gradient(135deg,#ed1c24 0%,#b5121b 100%)',
    emoji: '🛍️',
    title: 'Billa Vorschau KW17',
    subtitle: 'Ab Montag 21.04.',
    valid_from: '2026-04-21',
    valid_to: '2026-04-27',
    category: 'Lebensmittel',
    bundesland: 'all',
    sponsored: false,
    deals: [
      { id:'bi17a', name:'Scamorza affumicata 200g',   price:2.49,  normalPrice:3.49,  unit:'Stk',     category:'Käse',         discount:29 },
      { id:'bi17b', name:'Speck Alto Adige 100g',      price:2.29,  normalPrice:3.29,  unit:'Stk',     category:'Belag',        discount:30 },
      { id:'bi17c', name:'Kapern in Essig 100g',       price:0.69,  normalPrice:0.99,  unit:'Glas',    category:'Belag',        discount:30 },
      { id:'bi17d', name:'Basilikum Topf',             price:0.99,  normalPrice:1.49,  unit:'Stk',     category:'Gewürze',      discount:34 },
    ]
  },

  // ── Abgelaufen (für Archiv) ───────────────────────────────────
  {
    id: 'metro-april-alt',
    store: 'Metro',
    storeId: 'metro',
    color: '#003DA5',
    gradient: 'linear-gradient(135deg,#003DA5 0%,#00297a 100%)',
    emoji: '🏪',
    title: 'Metro März-Aktion',
    subtitle: 'Gültig: 20.03. – 02.04.',
    valid_from: '2026-03-20',
    valid_to: '2026-04-02',
    category: 'Gastronomie',
    bundesland: 'all',
    sponsored: false,
    deals: [
      { id:'me_alt1', name:'Pizzamehl Tipo 00 25kg',    price:18.90, normalPrice:24.90, unit:'Sack',    category:'Grundzutaten', discount:24 },
      { id:'me_alt2', name:'Pizzakarton 33cm 100er',    price:8.90,  normalPrice:11.90, unit:'Pack',    category:'Verpackung',   discount:25 },
    ]
  },
];

// ═══ API SIMULATION ══════════════════════════════════════════════

function apiGetProspekte(filters) {
  filters = filters || {};
  let result = [...PROSPEKTE];
  if (filters.store)      result = result.filter(p => p.storeId === filters.store || p.store.toLowerCase() === filters.store.toLowerCase());
  if (filters.category)   result = result.filter(p => p.category === filters.category || p.deals.some(d => d.category === filters.category));
  if (filters.bundesland && filters.bundesland !== 'all') result = result.filter(p => p.bundesland === 'all' || p.bundesland === filters.bundesland);
  return result;
}

function apiSearchDeals(q) {
  if (!q || !q.trim()) return [];
  const query = q.toLowerCase().trim();
  const results = [];
  for (const p of PROSPEKTE) {
    for (const d of p.deals) {
      if (
        d.name.toLowerCase().includes(query) ||
        p.store.toLowerCase().includes(query) ||
        d.category.toLowerCase().includes(query)
      ) {
        results.push({ ...d, prospektId: p.id, store: p.store, storeId: p.storeId, storeColor: p.color, valid_from: p.valid_from, valid_to: p.valid_to });
      }
    }
  }
  return results;
}

// ═══ LEGACY DATA FUNCTIONS (Kompatibilität) ══════════════════════

function getAllDeals() {
  const today = new Date(); today.setHours(0,0,0,0);
  const mon = weekMonday(today);
  const configDeals = DEALS.map((d, i) => {
    const product = PRODUCTS.find(p => p.id === d.productId);
    const shop    = SHOPS.find(s => s.id === d.shopId);
    let validFrom, validTo;
    if (d.validFrom && d.validTo) { validFrom = d.validFrom; validTo = d.validTo; }
    else if (d.week === 'current') {
      validFrom = mon.toISOString().slice(0,10);
      const sun = new Date(mon); sun.setDate(mon.getDate()+6); validTo = sun.toISOString().slice(0,10);
    } else {
      const nm = new Date(mon); nm.setDate(mon.getDate()+7); validFrom = nm.toISOString().slice(0,10);
      const ns = new Date(nm); ns.setDate(nm.getDate()+6); validTo = ns.toISOString().slice(0,10);
    }
    const discount = d.normalPrice ? Math.round((1 - d.pricePerUnit / d.normalPrice) * 100) : 0;
    return { id:'cfg_'+i, shopId:d.shopId, shopName:shop?shop.name:d.shopId, shopColor:shop?shop.color:'#555',
      productId:d.productId, productName:product?product.name:d.productId, category:product?product.category:'Sonstiges',
      price:d.pricePerUnit, normalPrice:d.normalPrice||null, unit:product?product.unit:'Stk', discount, validFrom, validTo, source:'config' };
  });
  let custom = [];
  try { custom = JSON.parse(localStorage.getItem('pizzeria_custom_deals') || '[]'); } catch(_) {}
  return [...configDeals, ...custom];
}

// ═══ MAIN RENDER ════════════════════════════════════════════════

function renderAngeboteTab() {
  const panel = document.getElementById('panel-angebote');
  if (!panel) { console.error('panel-angebote nicht gefunden!'); return; }
  try {
    _renderAngeboteMain(panel);
  } catch(err) {
    console.error('Angebote Fehler:', err);
    panel.innerHTML = '<div style="padding:20px;background:#ffdad6;border-radius:12px;color:#93000a;font-size:13px"><strong>Fehler:</strong> ' + _esc(err.message) + '</div>';
  }
}

function _renderAngeboteMain(panel) {
  const v = ANGEBOTE_STATE.view;
  if      (v === 'prospekte') panel.innerHTML = _buildProspekteView();
  else if (v === 'live')      panel.innerHTML = _buildLiveView();
  else if (v === 'detail')    panel.innerHTML = _buildDetailView();
  else if (v === 'suche')     panel.innerHTML = _buildSucheView();
  else if (v === 'neu')       panel.innerHTML = _buildNeuView();
  else                         panel.innerHTML = _buildProspekteView();
}

// ═══ VIEW: PROSPEKTE GRID + SIDEBAR ══════════════════════════════

function _buildProspekteView() {
  const today = new Date(); today.setHours(0,0,0,0);
  const allP = PROSPEKTE;

  // Sidebar data
  const storeMap = {};
  for (const p of allP) {
    if (!storeMap[p.storeId]) storeMap[p.storeId] = { name: p.store, color: p.color, count: 0 };
    storeMap[p.storeId].count++;
  }
  const catMap = {};
  for (const p of allP) {
    for (const d of p.deals) {
      catMap[d.category] = (catMap[d.category] || 0) + 1;
    }
  }
  const bundeslaender = ['Wien','Niederösterreich','Oberösterreich','Steiermark','Tirol','Salzburg','Kärnten','Vorarlberg','Burgenland'];

  // Filter
  const filters = {};
  if (ANGEBOTE_STATE.filterStore)     filters.store     = ANGEBOTE_STATE.filterStore;
  if (ANGEBOTE_STATE.filterCategory)  filters.category  = ANGEBOTE_STATE.filterCategory;
  if (ANGEBOTE_STATE.filterBundesland) filters.bundesland = ANGEBOTE_STATE.filterBundesland;
  const filtered = apiGetProspekte(filters);

  // Split current / next / past
  const currentP = [], nextP = [], pastP = [];
  for (const p of filtered) {
    const from = new Date(p.valid_from); from.setHours(0,0,0,0);
    const to   = new Date(p.valid_to);   to.setHours(23,59,59,999);
    if (to < today)        pastP.push(p);
    else if (from > today) nextP.push(p);
    else                   currentP.push(p);
  }

  const totalDeals = filtered.reduce((s, p) => s + p.deals.length, 0);
  const totalSaving = filtered.reduce((s, p) => {
    return s + p.deals.reduce((ds, d) => ds + (d.normalPrice && d.price ? d.normalPrice - d.price : 0), 0);
  }, 0);

  // ── LIVE STORE BUTTONS ──
  let html = '<div style="margin-bottom:24px">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">';
  html += '<h2 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-size:13px;font-weight:800;color:#261816;margin:0;text-transform:uppercase;letter-spacing:.07em;display:flex;align-items:center;gap:7px">';
  html += '<span style="display:inline-block;width:8px;height:8px;background:#2e7d32;border-radius:50%"></span>Live-Prospekte</h2>';
  html += '<span style="font-size:11px;color:#8d6562">Klicken → Wochenangebote laden</span></div>';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px">';
  for (var lsi = 0; lsi < LIVE_STORES.length; lsi++) {
    var ls = LIVE_STORES[lsi];
    var cached = _getLiveProspektCache(ls.id);
    var dealCount = (cached && cached.deals) ? cached.deals.length : 0;
    var cacheMin  = cached ? Math.round((Date.now() - cached.timestamp) / 60000) : 0;
    html += '<button onclick="loadLiveProspekt(\'' + ls.id + '\')" ';
    html += 'style="background:#fff;border:2px solid #e8e8ed;border-radius:14px;padding:0;overflow:hidden;cursor:pointer;transition:transform .15s,box-shadow .15s,border-color .15s;text-align:left" ';
    html += 'onmouseenter="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 6px 20px rgba(0,0,0,.12)\';this.style.borderColor=\'' + ls.color + '\'" ';
    html += 'onmouseleave="this.style.transform=\'\';this.style.boxShadow=\'\';this.style.borderColor=\'#e8e8ed\'">';
    html += '<div style="background:' + ls.gradient + ';padding:10px 10px 8px;position:relative">';
    html += '<div style="font-size:20px;line-height:1;margin-bottom:3px">' + ls.emoji + '</div>';
    html += '<div style="font-size:12px;font-weight:900;color:#fff">' + ls.name + '</div>';
    if (cached) html += '<div style="position:absolute;top:5px;right:5px;background:rgba(255,255,255,.9);border-radius:20px;padding:1px 5px;font-size:9px;font-weight:800;color:#2e7d32">✓ Live</div>';
    html += '</div>';
    html += '<div style="padding:7px 10px">';
    if (cached) {
      html += '<div style="font-size:10px;font-weight:700;color:#2e7d32">' + dealCount + ' Angebote</div>';
      html += '<div style="font-size:9px;color:#8d6562">' + (cacheMin < 60 ? 'vor ' + cacheMin + ' Min.' : 'vor ' + Math.round(cacheMin/60) + ' Std.') + '</div>';
    } else {
      html += '<div style="font-size:10px;font-weight:600;color:#8d6562">Jetzt laden</div>';
      html += '<div style="font-size:9px;color:#c0b8b6">Live-Preise</div>';
    }
    html += '</div></button>';
  }
  html += '</div></div>';

  // ── HEADER ──
  html += '<div style="margin-bottom:28px">';
  html += '<h1 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-size:26px;font-weight:800;color:#261816;margin:0 0 6px">Angebote in deiner Nähe</h1>';
  html += '<p style="font-size:14px;color:#5a403c;margin:0">' + filtered.length + ' Prospekte · ' + totalDeals + ' Angebote';
  if (totalSaving > 0.01) html += ' · bis zu <strong style="color:#2e7d32">−' + eur(totalSaving) + '</strong> Ersparnis';
  html += '</p></div>';

  // ── SEARCH BAR ──
  const searchVal = escHtml(ANGEBOTE_STATE.searchQuery);
  html += '<div style="position:relative;margin-bottom:24px">';
  html += '<span class="material-symbols-outlined" style="position:absolute;left:16px;top:50%;transform:translateY(-50%);font-size:22px;color:#8d6562;pointer-events:none">search</span>';
  html += '<input id="ang-search" type="text" placeholder="Produkt, Geschäft oder Kategorie suchen …" value="' + searchVal + '"';
  html += ' oninput="ANGEBOTE_STATE.searchQuery=this.value;if(this.value){ANGEBOTE_STATE.view=\'suche\';}else{ANGEBOTE_STATE.view=\'prospekte\';}renderAngeboteTab()"';
  html += ' style="width:100%;padding:16px 50px 16px 52px;border:2px solid #e3beb8;border-radius:16px;font-size:15px;font-family:inherit;color:#261816;background:#fff;outline:none;box-sizing:border-box;box-shadow:0 2px 8px rgba(0,0,0,.06)"';
  html += ' onfocus="this.style.borderColor=\'#610000\'" onblur="this.style.borderColor=\'#e3beb8\'" />';
  if (ANGEBOTE_STATE.searchQuery) {
    html += '<button onclick="ANGEBOTE_STATE.searchQuery=\'\';ANGEBOTE_STATE.view=\'prospekte\';renderAngeboteTab()" style="position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;padding:4px;line-height:0"><span class="material-symbols-outlined" style="font-size:20px;color:#8d6562">close</span></button>';
  }
  html += '</div>';

  // ── LAYOUT: GRID + SIDEBAR ──
  html += '<div style="display:flex;gap:24px;align-items:start">';

  // ── MAIN GRID ──
  html += '<div style="flex:1;min-width:0">';

  // Active filter chips
  if (ANGEBOTE_STATE.filterStore || ANGEBOTE_STATE.filterCategory || ANGEBOTE_STATE.filterBundesland) {
    html += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">';
    if (ANGEBOTE_STATE.filterStore) {
      html += '<span style="display:inline-flex;align-items:center;gap:5px;background:#610000;color:#fff;border-radius:20px;padding:4px 12px;font-size:12px;font-weight:700">';
      html += escHtml(ANGEBOTE_STATE.filterStore);
      html += '<button onclick="ANGEBOTE_STATE.filterStore=\'\';renderAngeboteTab()" style="background:none;border:none;cursor:pointer;color:#fff;padding:0;margin:0;line-height:0"><span class="material-symbols-outlined" style="font-size:14px">close</span></button></span>';
    }
    if (ANGEBOTE_STATE.filterCategory) {
      html += '<span style="display:inline-flex;align-items:center;gap:5px;background:#610000;color:#fff;border-radius:20px;padding:4px 12px;font-size:12px;font-weight:700">';
      html += escHtml(ANGEBOTE_STATE.filterCategory);
      html += '<button onclick="ANGEBOTE_STATE.filterCategory=\'\';renderAngeboteTab()" style="background:none;border:none;cursor:pointer;color:#fff;padding:0;margin:0;line-height:0"><span class="material-symbols-outlined" style="font-size:14px">close</span></button></span>';
    }
    if (ANGEBOTE_STATE.filterBundesland) {
      html += '<span style="display:inline-flex;align-items:center;gap:5px;background:#610000;color:#fff;border-radius:20px;padding:4px 12px;font-size:12px;font-weight:700">';
      html += escHtml(ANGEBOTE_STATE.filterBundesland);
      html += '<button onclick="ANGEBOTE_STATE.filterBundesland=\'\';renderAngeboteTab()" style="background:none;border:none;cursor:pointer;color:#fff;padding:0;margin:0;line-height:0"><span class="material-symbols-outlined" style="font-size:14px">close</span></button></span>';
    }
    html += '<button onclick="ANGEBOTE_STATE.filterStore=\'\';ANGEBOTE_STATE.filterCategory=\'\';ANGEBOTE_STATE.filterBundesland=\'\';renderAngeboteTab()" style="background:none;border:1px solid #e3beb8;color:#8d6562;border-radius:20px;padding:4px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit">Alle zurücksetzen</button>';
    html += '</div>';
  }

  // ── SECTION: Aktuelle Prospekte ──
  if (currentP.length) {
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">';
    html += '<h2 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-size:17px;font-weight:800;color:#261816;margin:0;display:flex;align-items:center;gap:8px"><span style="display:inline-block;width:10px;height:10px;background:#2e7d32;border-radius:50%"></span>Diese Woche</h2>';
    html += '<span style="font-size:12px;color:#8d6562;font-weight:600">' + currentP.length + ' Prospekte</span>';
    html += '</div>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:16px;margin-bottom:32px">';
    html += currentP.map(p => renderProspektCard(p, today)).join('');
    html += '</div>';
  }

  // ── SECTION: Nächste Woche ──
  if (nextP.length) {
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">';
    html += '<h2 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-size:17px;font-weight:800;color:#261816;margin:0;display:flex;align-items:center;gap:8px"><span style="display:inline-block;width:10px;height:10px;background:#1565c0;border-radius:50%"></span>Nächste Woche</h2>';
    html += '<span style="font-size:12px;color:#8d6562;font-weight:600">' + nextP.length + ' Prospekte</span>';
    html += '</div>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:16px;margin-bottom:32px">';
    html += nextP.map(p => renderProspektCard(p, today)).join('');
    html += '</div>';
  }

  // ── SECTION: Abgelaufen ──
  if (pastP.length) {
    html += '<div style="margin-bottom:14px"><h2 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-size:15px;font-weight:700;color:#8d6562;margin:0">Abgelaufen</h2></div>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:16px;margin-bottom:32px;opacity:.55">';
    html += pastP.map(p => renderProspektCard(p, today)).join('');
    html += '</div>';
  }

  if (!filtered.length) {
    html += '<div style="text-align:center;padding:60px 20px;background:#fff;border-radius:20px;border:2px dashed #e3beb8">';
    html += '<span class="material-symbols-outlined" style="font-size:64px;color:#e3beb8">search_off</span>';
    html += '<p style="color:#8d6562;margin-top:16px;font-size:16px;font-weight:600">Keine Prospekte gefunden</p>';
    html += '<button onclick="ANGEBOTE_STATE.filterStore=\'\';ANGEBOTE_STATE.filterCategory=\'\';ANGEBOTE_STATE.filterBundesland=\'\';renderAngeboteTab()" style="margin-top:16px;padding:12px 24px;background:#610000;color:#fff;border:none;border-radius:12px;cursor:pointer;font-family:inherit;font-size:14px;font-weight:700">Filter zurücksetzen</button>';
    html += '</div>';
  }

  // ── "+ Angebot eintragen" button ──
  html += '<div style="margin-top:8px;padding:20px;background:linear-gradient(135deg,#fff0ee,#fff8f6);border-radius:16px;border:1.5px dashed #e3beb8;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px">';
  html += '<div><p style="font-size:14px;font-weight:700;color:#261816;margin:0">Angebot nicht dabei?</p><p style="font-size:12px;color:#8d6562;margin:4px 0 0">Eigenes Angebot eintragen und mit allen teilen</p></div>';
  html += '<button onclick="ANGEBOTE_STATE.view=\'neu\';renderAngeboteTab()" style="padding:11px 22px;background:#610000;color:#fff;border:none;border-radius:12px;cursor:pointer;font-family:inherit;font-size:14px;font-weight:700;display:flex;align-items:center;gap:7px;white-space:nowrap"><span class="material-symbols-outlined" style="font-size:18px">add_circle</span>Angebot melden</button>';
  html += '</div>';

  html += '</div>'; // end main grid

  // ── SIDEBAR ──
  html += _buildSidebar(storeMap, catMap, bundeslaender);

  html += '</div>'; // end flex layout
  return html;
}

// ═══ SIDEBAR ════════════════════════════════════════════════════

function _buildSidebar(storeMap, catMap, bundeslaender) {
  let html = '<div style="width:240px;flex-shrink:0;display:flex;flex-direction:column;gap:16px;position:sticky;top:80px">';

  // ── Händler ──
  html += '<div style="background:#fff;border-radius:16px;border:1px solid #e8e8ed;box-shadow:0 2px 8px rgba(0,0,0,.06);padding:18px">';
  html += '<h3 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-size:13px;font-weight:800;color:#261816;margin:0 0 12px;text-transform:uppercase;letter-spacing:.06em">Händler</h3>';
  // "Alle" option
  const storeAllBg = !ANGEBOTE_STATE.filterStore ? '#610000' : 'transparent';
  const storeAllColor = !ANGEBOTE_STATE.filterStore ? '#fff' : '#261816';
  html += '<button onclick="ANGEBOTE_STATE.filterStore=\'\';renderAngeboteTab()" style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:' + storeAllBg + ';color:' + storeAllColor + ';border:none;border-radius:8px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:600;margin-bottom:4px">';
  html += '<span>Alle Händler</span><span style="font-size:11px;opacity:.7">' + PROSPEKTE.length + '</span></button>';
  for (const [sid, sdata] of Object.entries(storeMap)) {
    const isActive = ANGEBOTE_STATE.filterStore === sdata.name;
    const bg = isActive ? '#610000' : 'transparent';
    const col = isActive ? '#fff' : '#261816';
    const dotBg = isActive ? 'rgba(255,255,255,.7)' : sdata.color;
    html += '<button onclick="ANGEBOTE_STATE.filterStore=\'' + escHtml(sdata.name) + '\';renderAngeboteTab()" style="width:100%;display:flex;align-items:center;gap:8px;padding:8px 10px;background:' + bg + ';color:' + col + ';border:none;border-radius:8px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:600;margin-bottom:2px;text-align:left">';
    html += '<span style="width:8px;height:8px;border-radius:50%;background:' + dotBg + ';flex-shrink:0;display:inline-block"></span>';
    html += '<span style="flex:1">' + escHtml(sdata.name) + '</span>';
    html += '<span style="font-size:11px;opacity:.7">' + sdata.count + '</span></button>';
  }
  html += '</div>';

  // ── Kategorien ──
  html += '<div style="background:#fff;border-radius:16px;border:1px solid #e8e8ed;box-shadow:0 2px 8px rgba(0,0,0,.06);padding:18px">';
  html += '<h3 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-size:13px;font-weight:800;color:#261816;margin:0 0 12px;text-transform:uppercase;letter-spacing:.06em">Kategorien</h3>';
  const catAllBg = !ANGEBOTE_STATE.filterCategory ? '#610000' : 'transparent';
  const catAllColor = !ANGEBOTE_STATE.filterCategory ? '#fff' : '#261816';
  html += '<button onclick="ANGEBOTE_STATE.filterCategory=\'\';renderAngeboteTab()" style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:7px 10px;background:' + catAllBg + ';color:' + catAllColor + ';border:none;border-radius:8px;cursor:pointer;font-family:inherit;font-size:12px;font-weight:600;margin-bottom:4px">Alle</button>';
  const sortedCats = Object.entries(catMap).sort((a,b) => b[1]-a[1]);
  for (const [cat, cnt] of sortedCats) {
    const isActive = ANGEBOTE_STATE.filterCategory === cat;
    const bg2 = isActive ? '#610000' : 'transparent';
    const col2 = isActive ? '#fff' : '#261816';
    html += '<button onclick="ANGEBOTE_STATE.filterCategory=\'' + escHtml(cat) + '\';renderAngeboteTab()" style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:7px 10px;background:' + bg2 + ';color:' + col2 + ';border:none;border-radius:8px;cursor:pointer;font-family:inherit;font-size:12px;font-weight:600;margin-bottom:2px;text-align:left">';
    html += '<span>' + escHtml(cat) + '</span><span style="font-size:11px;opacity:.7">' + cnt + '</span></button>';
  }
  html += '</div>';

  // ── Bundesland ──
  html += '<div style="background:#fff;border-radius:16px;border:1px solid #e8e8ed;box-shadow:0 2px 8px rgba(0,0,0,.06);padding:18px">';
  html += '<h3 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-size:13px;font-weight:800;color:#261816;margin:0 0 12px;text-transform:uppercase;letter-spacing:.06em">Bundesland</h3>';
  const blAllBg = !ANGEBOTE_STATE.filterBundesland ? '#610000' : 'transparent';
  const blAllCol = !ANGEBOTE_STATE.filterBundesland ? '#fff' : '#261816';
  html += '<button onclick="ANGEBOTE_STATE.filterBundesland=\'\';renderAngeboteTab()" style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:7px 10px;background:' + blAllBg + ';color:' + blAllCol + ';border:none;border-radius:8px;cursor:pointer;font-family:inherit;font-size:12px;font-weight:600;margin-bottom:4px">Österreich gesamt</button>';
  for (const bl of bundeslaender) {
    const isActive = ANGEBOTE_STATE.filterBundesland === bl;
    const blBg = isActive ? '#610000' : 'transparent';
    const blCol = isActive ? '#fff' : '#261816';
    html += '<button onclick="ANGEBOTE_STATE.filterBundesland=\'' + escHtml(bl) + '\';renderAngeboteTab()" style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:7px 10px;background:' + blBg + ';color:' + blCol + ';border:none;border-radius:8px;cursor:pointer;font-family:inherit;font-size:12px;font-weight:600;margin-bottom:2px;text-align:left">';
    html += '<span>' + escHtml(bl) + '</span></button>';
  }
  html += '</div>';

  html += '</div>'; // end sidebar
  return html;
}

// ═══ PROSPEKT CARD ═══════════════════════════════════════════════

function renderProspektCard(p, today) {
  today = today || (function(){ const d=new Date(); d.setHours(0,0,0,0); return d; })();
  const from = new Date(p.valid_from); from.setHours(0,0,0,0);
  const to   = new Date(p.valid_to);   to.setHours(23,59,59,999);
  const isExpired = to < today;
  const isNext    = from > today;

  const fromStr = from.toLocaleDateString('de-AT', { day:'2-digit', month:'2-digit' });
  const toStr   = to.toLocaleDateString('de-AT',   { day:'2-digit', month:'2-digit' });

  const daysLeft = Math.ceil((to - today) / 86400000);
  const urgentColor = (!isExpired && !isNext && daysLeft <= 2) ? '#e65100' : '';

  const topDiscount = p.deals.reduce((max, d) => d.discount > max ? d.discount : max, 0);
  const totalSave   = p.deals.reduce((s, d) => s + (d.normalPrice && d.price ? d.normalPrice - d.price : 0), 0);

  let html = '<div onclick="openProspekt(\'' + p.id + '\')" style="background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 3px 16px rgba(0,0,0,.09);border:1px solid #e8e8ed;cursor:pointer;transition:transform .15s,box-shadow .15s" onmouseenter="this.style.transform=\'translateY(-3px)\';this.style.boxShadow=\'0 8px 28px rgba(0,0,0,.14)\'" onmouseleave="this.style.transform=\'\';this.style.boxShadow=\'0 3px 16px rgba(0,0,0,.09)\'">';

  // ── Card Cover ──
  html += '<div style="background:' + p.gradient + ';height:130px;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:16px">';

  // Badges top-left/right
  if (p.sponsored) {
    html += '<span style="position:absolute;top:10px;left:10px;background:rgba(255,255,255,.22);color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;backdrop-filter:blur(4px)">Gesponsert</span>';
  }
  if (topDiscount > 0) {
    html += '<span style="position:absolute;top:10px;right:10px;background:#fff;color:#2e7d32;font-size:12px;font-weight:800;padding:3px 10px;border-radius:20px;box-shadow:0 2px 8px rgba(0,0,0,.15)">−' + topDiscount + '%</span>';
  }
  if (!isExpired && !isNext && daysLeft <= 2) {
    html += '<span style="position:absolute;bottom:10px;left:10px;background:#e65100;color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px">Nur noch ' + daysLeft + ' Tag' + (daysLeft===1?'':'e') + '!</span>';
  }
  if (isNext) {
    html += '<span style="position:absolute;bottom:10px;left:10px;background:rgba(255,255,255,.2);color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px">Bald verfügbar</span>';
  }

  // Store emoji + name
  html += '<span style="font-size:32px;line-height:1">' + p.emoji + '</span>';
  html += '<span style="font-size:18px;font-weight:900;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,.25);letter-spacing:-.02em">' + escHtml(p.store) + '</span>';

  html += '</div>';

  // ── Card Body ──
  html += '<div style="padding:14px 16px">';
  html += '<p style="font-size:13px;font-weight:700;color:#261816;margin:0 0 4px;line-height:1.3">' + escHtml(p.title) + '</p>';

  // Validity
  const validColor = urgentColor || '#8d6562';
  html += '<p style="font-size:11px;color:' + validColor + ';margin:0 0 10px;display:flex;align-items:center;gap:4px">';
  html += '<span class="material-symbols-outlined" style="font-size:12px">calendar_today</span>';
  html += fromStr + ' – ' + toStr + '</p>';

  // Deal count + savings
  html += '<div style="display:flex;align-items:center;justify-content:space-between">';
  html += '<span style="font-size:12px;background:#f0f0f5;color:#5a403c;border-radius:20px;padding:3px 10px;font-weight:600">' + p.deals.length + ' Angebote</span>';
  if (totalSave > 0.01) {
    html += '<span style="font-size:12px;color:#2e7d32;font-weight:700">bis −' + eur(totalSave) + '</span>';
  }
  html += '</div>';
  html += '</div>';

  html += '</div>';
  return html;
}

// ═══ VIEW: PROSPEKT DETAIL ════════════════════════════════════════

function openProspekt(id) {
  ANGEBOTE_STATE.selectedProspektId = id;
  ANGEBOTE_STATE.view = 'detail';
  renderAngeboteTab();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function backToProspekte() {
  ANGEBOTE_STATE.view = 'prospekte';
  ANGEBOTE_STATE.selectedProspektId = null;
  renderAngeboteTab();
}

function _buildDetailView() {
  const p = PROSPEKTE.find(pr => pr.id === ANGEBOTE_STATE.selectedProspektId);
  if (!p) return '<div style="padding:20px"><button onclick="backToProspekte()">← Zurück</button></div>';

  const today = new Date(); today.setHours(0,0,0,0);
  const from = new Date(p.valid_from); from.setHours(0,0,0,0);
  const to   = new Date(p.valid_to);   to.setHours(23,59,59,999);
  const fromStr = from.toLocaleDateString('de-AT', { day:'2-digit', month:'2-digit', year:'numeric' });
  const toStr   = to.toLocaleDateString('de-AT',   { day:'2-digit', month:'2-digit', year:'numeric' });
  const isExpired = to < today;

  const filterCat = ANGEBOTE_STATE.filterCategory;
  const allCats   = [...new Set(p.deals.map(d => d.category))].sort();
  const displayed = filterCat ? p.deals.filter(d => d.category === filterCat) : p.deals;
  const sorted    = [...displayed].sort((a,b) => (b.discount||0) - (a.discount||0));
  const totalSave = displayed.reduce((s,d) => s + (d.normalPrice&&d.price ? d.normalPrice-d.price : 0), 0);

  let html = '';

  // ── Hero Header ──
  html += '<div style="background:' + p.gradient + ';border-radius:20px;padding:28px 28px 24px;margin-bottom:24px;position:relative;overflow:hidden">';

  // Back button
  html += '<button onclick="backToProspekte()" style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.2);color:#fff;border:1px solid rgba(255,255,255,.3);border-radius:10px;padding:7px 14px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:700;margin-bottom:20px;backdrop-filter:blur(4px)">';
  html += '<span class="material-symbols-outlined" style="font-size:16px">arrow_back</span>Zurück zu Prospekten</button>';

  // Decorative bg element
  html += '<div style="position:absolute;right:-30px;top:-30px;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,.08)"></div>';

  html += '<div style="display:flex;align-items:center;gap:16px;position:relative">';
  html += '<div style="width:64px;height:64px;border-radius:16px;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:32px;backdrop-filter:blur(4px)">' + p.emoji + '</div>';
  html += '<div>';
  html += '<h1 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-size:24px;font-weight:900;color:#fff;margin:0 0 4px;text-shadow:0 1px 4px rgba(0,0,0,.2)">' + escHtml(p.title) + '</h1>';
  html += '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">';
  html += '<span style="font-size:13px;color:rgba(255,255,255,.85);display:flex;align-items:center;gap:5px"><span class="material-symbols-outlined" style="font-size:15px">calendar_today</span>' + fromStr + ' – ' + toStr + '</span>';
  html += '<span style="font-size:13px;color:rgba(255,255,255,.85);display:flex;align-items:center;gap:5px"><span class="material-symbols-outlined" style="font-size:15px">local_offer</span>' + p.deals.length + ' Angebote</span>';
  if (isExpired) html += '<span style="background:rgba(0,0,0,.3);color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px">Abgelaufen</span>';
  if (p.sponsored) html += '<span style="background:rgba(255,255,255,.25);color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px">Gesponsert</span>';
  html += '</div>';
  html += '</div>';
  html += '</div>';
  html += '</div>';

  // ── Savings Banner ──
  if (totalSave > 0.01) {
    html += '<div style="background:linear-gradient(135deg,#2e7d32,#43a047);border-radius:14px;padding:14px 22px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between">';
    html += '<div><div style="font-size:12px;color:rgba(255,255,255,.85);font-weight:600;margin-bottom:2px">' + displayed.length + ' Angebote — mögliche Gesamtersparnis</div>';
    html += '<div style="font-size:28px;font-weight:900;color:#fff">−' + eur(totalSave) + '</div></div>';
    html += '<span class="material-symbols-outlined" style="font-size:48px;color:rgba(255,255,255,.2)">savings</span>';
    html += '</div>';
  }

  // ── Category Filter ──
  html += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px">';
  const catAllBg = !filterCat ? '#610000' : '#f0f0f5';
  const catAllCol = !filterCat ? '#fff' : '#261816';
  html += '<button onclick="ANGEBOTE_STATE.filterCategory=\'\';renderAngeboteTab()" style="padding:7px 16px;background:' + catAllBg + ';color:' + catAllCol + ';border:none;border-radius:20px;cursor:pointer;font-family:inherit;font-size:12px;font-weight:700">Alle</button>';
  for (const cat of allCats) {
    const isAct = filterCat === cat;
    const cbg = isAct ? '#610000' : '#f0f0f5';
    const ccol = isAct ? '#fff' : '#261816';
    html += '<button onclick="ANGEBOTE_STATE.filterCategory=\'' + escHtml(cat) + '\';renderAngeboteTab()" style="padding:7px 16px;background:' + cbg + ';color:' + ccol + ';border:none;border-radius:20px;cursor:pointer;font-family:inherit;font-size:12px;font-weight:700">' + escHtml(cat) + '</button>';
  }
  html += '</div>';

  // ── Deals Grid ──
  if (!sorted.length) {
    html += '<div style="text-align:center;padding:40px;color:#8d6562">Keine Angebote in dieser Kategorie.</div>';
  } else {
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px">';
    html += sorted.map(d => _renderDetailDealCard(d, p)).join('');
    html += '</div>';
  }

  return html;
}

function _renderDetailDealCard(d, p) {
  const discount = d.discount || 0;
  const savings  = (d.normalPrice && d.price) ? d.normalPrice - d.price : 0;
  const safeName = escHtml(d.name);
  const safeId   = escHtml(d.id);
  const safePStore = escHtml(p.store).replace(/'/g,"\\'");
  const safePStoreId = escHtml(p.storeId);
  const safeUnit = escHtml(d.unit);

  let html = '<div style="background:#fff;border-radius:14px;border:1px solid #e8e8ed;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06)">';

  // Color top bar
  html += '<div style="height:6px;background:' + p.gradient + '"></div>';

  html += '<div style="padding:16px">';
  // Badges row
  if (discount > 0 || d.category) {
    html += '<div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap">';
    if (discount > 0) html += '<span style="background:#dcfce7;color:#166534;font-size:11px;font-weight:800;padding:3px 9px;border-radius:20px">−' + discount + '%</span>';
    if (d.category)   html += '<span style="background:#f0f0f5;color:#5a403c;font-size:11px;font-weight:600;padding:3px 9px;border-radius:20px">' + escHtml(d.category) + '</span>';
    html += '</div>';
  }

  html += '<p style="font-size:14px;font-weight:700;color:#261816;margin:0 0 12px;line-height:1.35">' + safeName + '</p>';

  // Price
  html += '<div style="display:flex;align-items:flex-end;gap:10px;margin-bottom:12px">';
  html += '<div style="font-size:28px;font-weight:900;color:#610000;line-height:1">' + eur(d.price) + '</div>';
  if (d.normalPrice) {
    html += '<div style="padding-bottom:2px">';
    html += '<div style="font-size:12px;text-decoration:line-through;color:#8d6562">' + eur(d.normalPrice) + '</div>';
    if (savings > 0.01) html += '<div style="font-size:11px;font-weight:700;color:#2e7d32">−' + eur(savings) + '</div>';
    html += '</div>';
  }
  html += '</div>';

  // Unit
  html += '<div style="font-size:11px;color:#8d6562;margin-bottom:12px">pro ' + safeUnit + '</div>';

  // Merken button
  html += '<button onclick="angebotMerken(\'' + safeId + '\',\'' + safeName.replace(/'/g,"\\'") + '\',' + d.price + ',\'' + safePStore + '\',\'' + safePStoreId + '\',\'' + safeUnit + '\',1)"';
  html += ' style="width:100%;padding:9px;background:#fff0ee;color:#610000;border:1.5px solid #e3beb8;border-radius:10px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:6px">';
  html += '<span class="material-symbols-outlined" style="font-size:15px">bookmark_add</span>Merken</button>';

  html += '</div>';
  html += '</div>';
  return html;
}

// ═══ VIEW: SUCHE ═════════════════════════════════════════════════

function _buildSucheView() {
  const q = ANGEBOTE_STATE.searchQuery;
  const results = apiSearchDeals(q);

  let html = '';

  // Header + search bar
  html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">';
  html += '<button onclick="ANGEBOTE_STATE.view=\'prospekte\';ANGEBOTE_STATE.searchQuery=\'\';renderAngeboteTab()" style="display:flex;align-items:center;gap:6px;background:#f0f0f5;color:#261816;border:none;border-radius:10px;padding:8px 14px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:700"><span class="material-symbols-outlined" style="font-size:16px">arrow_back</span>Zurück</button>';
  html += '<div style="flex:1;position:relative">';
  html += '<span class="material-symbols-outlined" style="position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:20px;color:#8d6562;pointer-events:none">search</span>';
  html += '<input id="ang-search" type="text" value="' + escHtml(q) + '" placeholder="Produkt, Geschäft oder Kategorie …"';
  html += ' oninput="ANGEBOTE_STATE.searchQuery=this.value;if(!this.value){ANGEBOTE_STATE.view=\'prospekte\';}renderAngeboteTab()"';
  html += ' style="width:100%;padding:12px 42px 12px 46px;border:2px solid #610000;border-radius:14px;font-size:14px;font-family:inherit;color:#261816;background:#fff;outline:none;box-sizing:border-box"';
  html += ' autofocus />';
  if (q) {
    html += '<button onclick="ANGEBOTE_STATE.searchQuery=\'\';ANGEBOTE_STATE.view=\'prospekte\';renderAngeboteTab()" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;padding:4px;line-height:0"><span class="material-symbols-outlined" style="font-size:18px;color:#8d6562">close</span></button>';
  }
  html += '</div></div>';

  if (!results.length) {
    html += '<div style="text-align:center;padding:60px 20px;background:#fff;border-radius:20px;border:2px dashed #e3beb8">';
    html += '<span class="material-symbols-outlined" style="font-size:64px;color:#e3beb8">search_off</span>';
    html += '<p style="color:#8d6562;margin-top:16px;font-size:16px;font-weight:600">Kein Angebot für <em>"' + escHtml(q) + '"</em></p>';
    html += '<p style="color:#8d6562;font-size:13px;margin-top:6px">Tipp: Eigenes Angebot eintragen</p>';
    html += '<button onclick="ANGEBOTE_STATE.view=\'neu\';ANGEBOTE_STATE.searchQuery=\'\';renderAngeboteTab()" style="margin-top:16px;padding:11px 22px;background:#610000;color:#fff;border:none;border-radius:12px;cursor:pointer;font-family:inherit;font-size:14px;font-weight:700;display:inline-flex;align-items:center;gap:6px"><span class="material-symbols-outlined" style="font-size:16px">add</span>Angebot melden</button>';
    html += '</div>';
    return html;
  }

  // Sort by discount desc
  const sorted = [...results].sort((a,b) => (b.discount||0)-(a.discount||0));

  // Group by store
  const byStore = {};
  for (const d of sorted) {
    if (!byStore[d.store]) byStore[d.store] = [];
    byStore[d.store].push(d);
  }

  html += '<p style="font-size:13px;color:#8d6562;margin-bottom:18px"><strong>' + results.length + '</strong> Angebote für <em>"' + escHtml(q) + '"</em></p>';

  for (const [store, deals] of Object.entries(byStore)) {
    const storeData = PROSPEKTE.find(p => p.store === store);
    const storeColor = storeData ? storeData.color : '#610000';
    const storeGrad  = storeData ? storeData.gradient : 'linear-gradient(135deg,#610000,#8b0000)';

    html += '<div style="margin-bottom:24px">';
    html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;padding:10px 16px;background:' + storeGrad + ';border-radius:12px">';
    html += '<span style="font-size:14px;font-weight:800;color:#fff">' + escHtml(store) + '</span>';
    html += '<span style="font-size:12px;color:rgba(255,255,255,.8);margin-left:4px">' + deals.length + ' Treffer</span>';
    html += '</div>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">';
    for (const d of deals) {
      // Find parent prospekt for this deal
      const parentP = PROSPEKTE.find(pr => pr.storeId === d.storeId && pr.id === d.prospektId);
      if (parentP) {
        html += _renderDetailDealCard(d, parentP);
      } else {
        // Fallback: render with store color
        const mockP = { store: d.store, storeId: d.storeId, color: storeColor, gradient: storeGrad };
        html += _renderDetailDealCard(d, mockP);
      }
    }
    html += '</div></div>';
  }

  return html;
}

// ═══ VIEW: NEU EINTRAGEN ═════════════════════════════════════════

function _buildNeuView() {
  const today = new Date().toISOString().slice(0,10);
  const nextSun = new Date(); nextSun.setDate(nextSun.getDate() + (7 - nextSun.getDay() || 7));
  const nextSunStr = nextSun.toISOString().slice(0,10);

  let customs = [];
  try { customs = JSON.parse(localStorage.getItem('pizzeria_custom_deals') || '[]'); } catch(_) {}

  let html = '<div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">';
  html += '<button onclick="ANGEBOTE_STATE.view=\'prospekte\';renderAngeboteTab()" style="display:flex;align-items:center;gap:6px;background:#f0f0f5;color:#261816;border:none;border-radius:10px;padding:8px 14px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:700"><span class="material-symbols-outlined" style="font-size:16px">arrow_back</span>Zurück</button>';
  html += '<h2 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-size:18px;font-weight:800;color:#261816;margin:0">Angebot melden</h2>';
  html += '</div>';

  const gridCols = customs.length ? '1fr 1fr' : '1fr';
  html += '<div style="display:grid;grid-template-columns:' + gridCols + ';gap:20px;align-items:start">';

  // ── Form ──
  html += '<div style="background:#fff;border:1.5px solid #e3beb8;border-radius:18px;padding:28px">';
  html += '<h3 style="font-size:16px;font-weight:800;color:#261816;margin:0 0 20px;display:flex;align-items:center;gap:8px"><span class="material-symbols-outlined" style="font-size:20px;color:#610000">add_circle</span>Neues Angebot eintragen</h3>';
  html += '<div style="display:flex;flex-direction:column;gap:14px">';

  html += '<div><label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Produkt *</label>';
  html += '<input id="nd-produkt" type="text" placeholder="z.B. Mozzarella 250g" style="width:100%;padding:12px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;outline:none;box-sizing:border-box" onfocus="this.style.borderColor=\'#610000\'" onblur="this.style.borderColor=\'#e3beb8\'"/></div>';

  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">';
  html += '<div><label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Angebotspreis (€) *</label>';
  html += '<input id="nd-preis" type="number" min="0" step="0.01" placeholder="2.99" style="width:100%;padding:12px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;outline:none;box-sizing:border-box" onfocus="this.style.borderColor=\'#610000\'" onblur="this.style.borderColor=\'#e3beb8\'"/></div>';
  html += '<div><label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Normalpreis (€)</label>';
  html += '<input id="nd-normal" type="number" min="0" step="0.01" placeholder="3.99" style="width:100%;padding:12px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;outline:none;box-sizing:border-box" onfocus="this.style.borderColor=\'#610000\'" onblur="this.style.borderColor=\'#e3beb8\'"/></div>';
  html += '</div>';

  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">';
  html += '<div><label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Gültig von</label>';
  html += '<input id="nd-von" type="date" value="' + today + '" style="width:100%;padding:12px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;outline:none;box-sizing:border-box"/></div>';
  html += '<div><label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Gültig bis</label>';
  html += '<input id="nd-bis" type="date" value="' + nextSunStr + '" style="width:100%;padding:12px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;outline:none;box-sizing:border-box"/></div>';
  html += '</div>';

  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">';
  html += '<div><label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Geschäft</label>';
  html += '<select id="nd-shop" style="width:100%;padding:12px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;outline:none">';
  html += SHOPS.map(s => '<option value="' + s.id + '">' + s.name + '</option>').join('');
  html += '<option value="sonstiges">Sonstiges</option></select></div>';
  html += '<div><label style="font-size:12px;font-weight:700;color:#5a403c;display:block;margin-bottom:5px">Kategorie</label>';
  html += '<select id="nd-kat" style="width:100%;padding:12px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;outline:none">';
  html += '<option>Grundzutaten</option><option>Käse</option><option>Belag</option><option>Gewürze</option><option>Tiefkühl</option><option>Getränke</option><option>Sonstiges</option>';
  html += '</select></div>';
  html += '</div>';

  html += '<button onclick="angebotSpeichern()" style="width:100%;padding:14px;background:linear-gradient(135deg,#610000,#8b0000);color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:4px"><span class="material-symbols-outlined" style="font-size:20px">save</span>Angebot speichern</button>';

  html += '</div></div>'; // end form inner + card

  // ── Saved customs ──
  if (customs.length) {
    html += '<div>';
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">';
    html += '<h4 style="font-size:14px;font-weight:700;color:#261816;margin:0">Eigene Deals (' + customs.length + ')</h4>';
    html += '<button onclick="_showConfirm(\'Alle eigenen Deals löschen?\',function(){localStorage.removeItem(\'pizzeria_custom_deals\');renderAngeboteTab()},{okLabel:\'Löschen\'})" style="font-size:11px;color:#8d6562;background:none;border:1px solid #e3beb8;border-radius:8px;padding:4px 10px;cursor:pointer;font-family:inherit">Alle löschen</button>';
    html += '</div>';
    html += '<div style="display:flex;flex-direction:column;gap:8px">';
    for (const d of customs) {
      html += '<div style="background:#fff;border:1px solid #e3beb8;border-radius:12px;padding:12px 14px;display:flex;align-items:center;gap:10px">';
      html += '<div style="width:8px;height:8px;border-radius:50%;background:' + (d.shopColor||'#610000') + ';flex-shrink:0"></div>';
      html += '<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:700;color:#261816;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escHtml(d.productName) + '</div>';
      html += '<div style="font-size:11px;color:#8d6562">' + escHtml(d.shopName) + ' · ' + eur(d.price) + (d.normalPrice ? ' statt ' + eur(d.normalPrice) : '') + '</div></div>';
      html += '<button onclick="angebotLoeschen(\'' + d.id + '\')" style="background:none;border:none;cursor:pointer;padding:4px;color:#8d6562;line-height:0;flex-shrink:0"><span class="material-symbols-outlined" style="font-size:16px">delete</span></button>';
      html += '</div>';
    }
    html += '</div></div>';
  }

  html += '</div>'; // end outer grid
  return html;
}

// ═══ ACTIONS ════════════════════════════════════════════════════

function angebotMerken(id, name, preis, shopName, shopId, einheit, menge) {
  addHistoryEntry({ produktName: name, preis, shopName, shopId, einheit, menge, quelle: 'angebot' });
  try { HISTORY = JSON.parse(localStorage.getItem('pizzeria_history') || '[]'); } catch(e) { HISTORY = []; }
  // Auch zur Einkaufsliste hinzufügen
  if (typeof elAddItem === 'function') {
    const shopObj = SHOPS.find(s => s.id === shopId);
    elAddItem({
      name, menge: menge || 1, einheit, preis,
      shop: shopName, shopId,
      shopColor: shopObj ? shopObj.color : '#8d6562',
      source: 'angebot',
    });
    if (typeof elUpdateBadge === 'function') elUpdateBadge();
  }
  const btns = document.querySelectorAll('button[onclick*="' + id + '"]');
  btns.forEach(b => {
    b.innerHTML = '<span class="material-symbols-outlined" style="font-size:14px">check</span> Gemerkt!';
    b.style.color = '#2e7d32';
    b.style.background = '#f0fdf4';
    b.style.borderColor = '#bbf7d0';
    b.disabled = true;
  });
}

function angebotSpeichern() {
  const produkt = document.getElementById('nd-produkt')?.value.trim();
  const preis   = parseFloat(document.getElementById('nd-preis')?.value);
  const normal  = parseFloat(document.getElementById('nd-normal')?.value) || null;
  const von     = document.getElementById('nd-von')?.value;
  const bis     = document.getElementById('nd-bis')?.value;
  const shopId  = document.getElementById('nd-shop')?.value;
  const kat     = document.getElementById('nd-kat')?.value;

  if (!produkt || isNaN(preis) || preis <= 0) { _showToast('Bitte Produktname und Preis eingeben.', 'error'); return; }
  const shopObj  = SHOPS.find(s => s.id === shopId);
  const discount = normal ? Math.round((1 - preis/normal)*100) : 0;
  const deal = {
    id: 'custom_' + Date.now(), shopId, shopName: shopObj ? shopObj.name : 'Sonstiges',
    shopColor: shopObj ? shopObj.color : '#555', productName: produkt, category: kat,
    price: preis, normalPrice: normal, unit: 'Stk', discount, validFrom: von||null, validTo: bis||null, source: 'custom',
  };
  let customs = [];
  try { customs = JSON.parse(localStorage.getItem('pizzeria_custom_deals') || '[]'); } catch(_) {}
  customs.unshift(deal);
  _safeLocalSet('pizzeria_custom_deals', customs);
  ANGEBOTE_STATE.view = 'prospekte';
  renderAngeboteTab();
}

function angebotLoeschen(id) {
  let customs = [];
  try { customs = JSON.parse(localStorage.getItem('pizzeria_custom_deals') || '[]'); } catch(_) {}
  customs = customs.filter(d => d.id !== id);
  _safeLocalSet('pizzeria_custom_deals', customs);
  renderAngeboteTab();
}

// Legacy renderDealCard (kept for any remaining external calls)
function renderDealCard(deal, isRecommended) {
  isRecommended = isRecommended || false;
  const p = PROSPEKTE.find(pr => pr.storeId === (deal.shopId||''));
  if (p) return _renderDetailDealCard(deal, p);
  const mockP = { store: deal.shopName||'', storeId: deal.shopId||'', color: deal.shopColor||'#610000', gradient: 'linear-gradient(135deg,' + (deal.shopColor||'#610000') + ',' + (deal.shopColor||'#610000') + ')' };
  return _renderDetailDealCard(deal, mockP);
}

// ═══════════════════════════════════════════════════════════════
// LIVE PROSPEKT — Cache
// ═══════════════════════════════════════════════════════════════

function _getLiveProspektCache(storeId) {
  try {
    var entry = JSON.parse(localStorage.getItem('pizzeria_live_' + storeId) || 'null');
    if (!entry) return null;
    // 12 Stunden Cache
    if ((Date.now() - entry.timestamp) > 12 * 60 * 60 * 1000) {
      localStorage.removeItem('pizzeria_live_' + storeId);
      return null;
    }
    return entry;
  } catch(_) { return null; }
}

function _setLiveProspektCache(storeId, data) {
  try {
    data.timestamp = Date.now();
    localStorage.setItem('pizzeria_live_' + storeId, JSON.stringify(data));
  } catch(_) {}
}

function clearLiveProspektCache(storeId) {
  localStorage.removeItem('pizzeria_live_' + storeId);
}

// ═══════════════════════════════════════════════════════════════
// LIVE PROSPEKT — Laden via Claude Web Search
// ═══════════════════════════════════════════════════════════════

async function loadLiveProspekt(storeId) {
  var store = LIVE_STORES.find(function(s){ return s.id === storeId; });
  if (!store) return;

  // Cache prüfen
  var cached = _getLiveProspektCache(storeId);
  if (cached) {
    ANGEBOTE_STATE.liveStoreId   = storeId;
    ANGEBOTE_STATE.liveLoading   = false;
    ANGEBOTE_STATE.liveError     = null;
    ANGEBOTE_STATE.liveFilterCat = '';
    ANGEBOTE_STATE.view = 'live';
    renderAngeboteTab();
    return;
  }

  // Laden starten
  ANGEBOTE_STATE.liveStoreId   = storeId;
  ANGEBOTE_STATE.liveLoading   = true;
  ANGEBOTE_STATE.liveError     = null;
  ANGEBOTE_STATE.liveFilterCat = '';
  ANGEBOTE_STATE.view = 'live';
  renderAngeboteTab();

  try {
    var hasKey = typeof ANTHROPIC_API_KEY !== 'undefined' && ANTHROPIC_API_KEY && ANTHROPIC_API_KEY !== 'HIER_API_KEY_EINFÜGEN';
    if (!hasKey) throw new Error('Kein API Key konfiguriert.');

    var today = new Date().toISOString().slice(0,10);
    var storeSlug = store.name.toLowerCase().replace(/\s+/g, '-');
    var prompt =
      'Öffne https://www.aktionsfinder.at/haendler/' + storeSlug + ' ' +
      'und https://www.marktguru.at/de-at/search?q=' + encodeURIComponent(store.name) + ' ' +
      'und lese den aktuellen Wochenprospekt von ' + store.name + ' Österreich (Stand: ' + today + ') aus. ' +
      'Gib NUR die Preise und Angebote zurück, die du auf diesen Websites DIREKT siehst — KEINE Schätzungen. ' +
      'Liste alle Produkte aus dem aktuellen Prospekt auf, mit Angebotspreis, Normalpreis und Kategorie. ' +
      'Antworte NUR mit diesem JSON-Objekt ohne Markdown oder Erklärungen:\n' +
      '{"validFrom":"' + today + '","validTo":"","deals":[' +
      '{"name":"Produktname mit Menge","price":0.99,"normalPrice":1.49,"unit":"Stk","category":"Grundzutaten","discount":34}' +
      ']}\n' +
      'Gib alle Angebote aus dem aktuellen Prospekt zurück, mindestens 8, maximal 40.';

    var resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 8192,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: 'Antworte IMMER nur mit einem JSON-Objekt. Kein Text davor oder danach, kein Markdown.',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    // Fallback ohne Web Search
    if (!resp.ok) {
      resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 4096,
          system: 'Antworte IMMER nur mit einem JSON-Objekt. Kein Text davor oder danach.',
          messages: [{ role: 'user', content: prompt }],
        }),
      });
    }

    if (!resp.ok) {
      var e = {}; try { e = await resp.json(); } catch(_) {}
      throw new Error(e.error ? e.error.message : 'HTTP ' + resp.status);
    }

    var data = await resp.json();
    var textBlocks = (data.content || []).filter(function(b){ return b.type === 'text'; });

    var prospektData = null;
    for (var ti = textBlocks.length - 1; ti >= 0; ti--) {
      prospektData = _parseProspektJSON(textBlocks[ti].text);
      if (prospektData && prospektData.deals && prospektData.deals.length > 0) break;
    }

    if (!prospektData || !prospektData.deals || !prospektData.deals.length) {
      throw new Error('Kein Prospekt gefunden. Bitte erneut versuchen.');
    }

    // Deals mit IDs und discount versehen
    prospektData.deals = prospektData.deals.map(function(d, i) {
      d.id = storeId + '_live_' + i;
      if (!d.discount && d.normalPrice && d.price) {
        d.discount = Math.round((1 - d.price / d.normalPrice) * 100);
      }
      return d;
    });

    _setLiveProspektCache(storeId, prospektData);
    ANGEBOTE_STATE.liveLoading = false;

  } catch(err) {
    ANGEBOTE_STATE.liveLoading = false;
    ANGEBOTE_STATE.liveError = err.message || String(err);
  }

  renderAngeboteTab();
}

function _parseProspektJSON(text) {
  if (!text || !text.trim()) return null;
  // Direkt parsen
  try { var r = JSON.parse(text.trim()); if (r && r.deals) return r; } catch(_) {}
  // Code fence
  var fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) { try { var r2 = JSON.parse(fence[1].trim()); if (r2 && r2.deals) return r2; } catch(_) {} }
  // JSON-Objekt extrahieren
  var obj = text.match(/\{[\s\S]*"deals"[\s\S]*\}/);
  if (obj) { try { var r3 = JSON.parse(obj[0]); if (r3 && r3.deals) return r3; } catch(_) {} }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// LIVE PROSPEKT — View
// ═══════════════════════════════════════════════════════════════

function _buildLiveView() {
  var storeId = ANGEBOTE_STATE.liveStoreId;
  var store   = LIVE_STORES.find(function(s){ return s.id === storeId; }) || { name: storeId, gradient: 'linear-gradient(135deg,#610000,#8b0000)', color:'#610000', emoji:'🏪' };
  var cached  = _getLiveProspektCache(storeId);
  var loading = ANGEBOTE_STATE.liveLoading;
  var error   = ANGEBOTE_STATE.liveError;

  var html = '';

  // ── Hero Header ──
  html += '<div style="background:' + store.gradient + ';border-radius:20px;padding:24px 28px;margin-bottom:20px;position:relative;overflow:hidden">';
  html += '<div style="position:absolute;right:-20px;top:-20px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,.07)"></div>';

  // Zurück Button
  html += '<button onclick="ANGEBOTE_STATE.view=\'prospekte\';renderAngeboteTab()" style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.2);color:#fff;border:1px solid rgba(255,255,255,.3);border-radius:10px;padding:7px 14px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:700;margin-bottom:18px;backdrop-filter:blur(4px)">';
  html += '<span class="material-symbols-outlined" style="font-size:16px">arrow_back</span>Zurück</button>';

  html += '<div style="display:flex;align-items:center;gap:16px;position:relative">';
  html += '<div style="font-size:40px;line-height:1;width:60px;height:60px;background:rgba(255,255,255,.18);border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0">' + store.emoji + '</div>';
  html += '<div>';
  html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">';
  html += '<span style="font-family:\'Plus Jakarta Sans\',sans-serif;font-size:26px;font-weight:900;color:#fff">' + store.name + '</span>';
  html += '<span style="background:rgba(255,255,255,.25);color:#fff;font-size:11px;font-weight:800;padding:3px 10px;border-radius:20px">Live-Prospekt</span>';
  html += '</div>';

  if (loading) {
    html += '<div style="font-size:13px;color:rgba(255,255,255,.8);display:flex;align-items:center;gap:8px">';
    html += '<span class="spinner-sm"></span>Suche auf aktionsfinder.at &amp; marktguru.at nach ' + store.name + '-Angeboten …</div>';
  } else if (cached) {
    var loadedAt = cached.timestamp ? new Date(cached.timestamp).toLocaleString('de-AT', {day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : '';
    var validStr = '';
    if (cached.validFrom && cached.validTo) {
      var vf = new Date(cached.validFrom).toLocaleDateString('de-AT',{day:'2-digit',month:'2-digit'});
      var vt = new Date(cached.validTo).toLocaleDateString('de-AT',{day:'2-digit',month:'2-digit'});
      validStr = vf + ' – ' + vt;
    }
    html += '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">';
    if (validStr) html += '<span style="font-size:13px;color:rgba(255,255,255,.85);display:flex;align-items:center;gap:5px"><span class="material-symbols-outlined" style="font-size:14px">calendar_today</span>Gültig: ' + validStr + '</span>';
    html += '<span style="font-size:13px;color:rgba(255,255,255,.85);display:flex;align-items:center;gap:5px"><span class="material-symbols-outlined" style="font-size:14px">local_offer</span>' + cached.deals.length + ' Angebote</span>';
    html += '</div>';
    html += '<div style="font-size:11px;color:rgba(255,255,255,.6);margin-top:4px">Geladen: ' + loadedAt + ' &nbsp;·&nbsp; Cache 12 Std.</div>';
  } else if (error) {
    html += '<div style="font-size:13px;color:rgba(255,200,200,.9)">' + escHtml(error) + '</div>';
  }

  html += '</div></div>';

  // Refresh + Cache leeren Button
  if (!loading) {
    html += '<div style="position:absolute;top:16px;right:16px;display:flex;gap:8px">';
    html += '<button onclick="clearLiveProspektCache(\'' + storeId + '\');loadLiveProspekt(\'' + storeId + '\')" ';
    html += 'style="background:rgba(255,255,255,.2);color:#fff;border:1px solid rgba(255,255,255,.3);border-radius:8px;padding:6px 12px;cursor:pointer;font-family:inherit;font-size:11px;font-weight:700;display:flex;align-items:center;gap:4px;backdrop-filter:blur(4px)">';
    html += '<span class="material-symbols-outlined" style="font-size:14px">refresh</span>Aktualisieren</button>';
    html += '</div>';
  }

  html += '</div>';

  // ── Loading State ──
  if (loading) {
    html += '<div style="text-align:center;padding:60px 20px;background:#fff;border-radius:20px;border:2px solid ' + store.color + '22">';
    html += '<div class="spinner"></div>';
    html += '<p style="font-size:15px;font-weight:700;color:#261816;margin:0 0 6px">Prospekt wird geladen …</p>';
    html += '<p style="font-size:13px;color:#8d6562;margin:0">Claude durchsucht ' + store.name.toLowerCase() + '.at nach den Wochenangeboten</p>';
    html += '</div>';
    return html;
  }

  // ── Error State ──
  if (error && !cached) {
    html += '<div style="text-align:center;padding:48px 20px;background:#fff3cd;border-radius:16px;border:1.5px solid #ffc107">';
    html += '<span class="material-symbols-outlined" style="font-size:48px;color:#e65100">error_outline</span>';
    html += '<p style="font-size:15px;font-weight:700;color:#261816;margin:12px 0 6px">Prospekt konnte nicht geladen werden</p>';
    html += '<p style="font-size:13px;color:#5a403c;margin:0 0 16px">' + escHtml(error) + '</p>';
    html += '<button onclick="loadLiveProspekt(\'' + storeId + '\')" style="padding:10px 22px;background:' + store.color + ';color:#fff;border:none;border-radius:10px;cursor:pointer;font-family:inherit;font-size:14px;font-weight:700">Erneut versuchen</button>';
    html += '</div>';
    return html;
  }

  if (!cached) return html;

  var deals = cached.deals;

  // ── Savings Banner ──
  var totalSave = deals.reduce(function(s,d){ return s + (d.normalPrice&&d.price ? d.normalPrice-d.price : 0); }, 0);
  if (totalSave > 0.01) {
    html += '<div style="background:linear-gradient(135deg,#2e7d32,#43a047);border-radius:14px;padding:14px 22px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between">';
    html += '<div><div style="font-size:12px;color:rgba(255,255,255,.85);font-weight:600;margin-bottom:2px">' + deals.length + ' Angebote — Mögliche Gesamtersparnis</div>';
    html += '<div style="font-size:28px;font-weight:900;color:#fff">−' + eur(totalSave) + '</div></div>';
    html += '<span class="material-symbols-outlined" style="font-size:48px;color:rgba(255,255,255,.2)">savings</span>';
    html += '</div>';
  }

  // ── Kategorie Filter ──
  var allCats = [];
  var catSeen = {};
  for (var ci = 0; ci < deals.length; ci++) {
    if (deals[ci].category && !catSeen[deals[ci].category]) {
      allCats.push(deals[ci].category);
      catSeen[deals[ci].category] = true;
    }
  }
  var fcat = ANGEBOTE_STATE.liveFilterCat;
  html += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px">';
  var allBg = !fcat ? store.color : '#f0f0f5';
  var allCol = !fcat ? '#fff' : '#261816';
  html += '<button onclick="ANGEBOTE_STATE.liveFilterCat=\'\';renderAngeboteTab()" style="padding:7px 16px;background:' + allBg + ';color:' + allCol + ';border:none;border-radius:20px;cursor:pointer;font-family:inherit;font-size:12px;font-weight:700">Alle (' + deals.length + ')</button>';
  for (var cfi = 0; cfi < allCats.length; cfi++) {
    var cat = allCats[cfi];
    var catDeals = deals.filter(function(d){ return d.category === cat; }).length;
    var isAct = fcat === cat;
    var cbg = isAct ? store.color : '#f0f0f5';
    var ccol = isAct ? '#fff' : '#261816';
    html += '<button onclick="ANGEBOTE_STATE.liveFilterCat=\'' + escHtml(cat) + '\';renderAngeboteTab()" style="padding:7px 16px;background:' + cbg + ';color:' + ccol + ';border:none;border-radius:20px;cursor:pointer;font-family:inherit;font-size:12px;font-weight:700">' + escHtml(cat) + ' (' + catDeals + ')</button>';
  }
  html += '</div>';

  // ── Deal Grid ──
  var displayed = fcat ? deals.filter(function(d){ return d.category === fcat; }) : deals;
  var sorted = displayed.slice().sort(function(a,b){ return (b.discount||0)-(a.discount||0); });

  var mockP = { store: store.name, storeId: storeId, color: store.color, gradient: store.gradient };
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px">';
  for (var di = 0; di < sorted.length; di++) {
    html += _renderDetailDealCard(sorted[di], mockP);
  }
  html += '</div>';

  // Alle zur Einkaufsliste Button
  if (displayed.length > 0) {
    html += '<div style="margin-top:20px;text-align:center">';
    html += '<button onclick="(function(){';
    html += 'var deals=_getLiveProspektCache(\'' + storeId + '\');';
    html += 'if(!deals||!deals.deals)return;';
    html += 'var d=deals.deals.filter(function(x){return !ANGEBOTE_STATE.liveFilterCat||x.category===ANGEBOTE_STATE.liveFilterCat;});';
    html += 'd.forEach(function(x){if(typeof elAddItem===\'function\')elAddItem({name:x.name,menge:1,einheit:x.unit||\'Stk\',preis:x.price,shop:\'' + store.name + '\',shopId:\'' + storeId + '\',shopColor:\'' + store.color + '\',source:\'angebot\'});});';
    html += 'if(typeof elUpdateBadge===\'function\')elUpdateBadge();';
    html += '_showToast(d.length+\' Artikel zur Einkaufsliste hinzugefügt!\',\'success\');';
    html += '})()" style="padding:12px 28px;background:' + store.color + ';color:#fff;border:none;border-radius:12px;cursor:pointer;font-family:inherit;font-size:14px;font-weight:700;display:inline-flex;align-items:center;gap:8px">';
    html += '<span class="material-symbols-outlined" style="font-size:18px">add_shopping_cart</span>Alle zur Einkaufsliste</button>';
    html += '</div>';
  }

  return html;
}


// ═══════════════════════════════════════════════════════════════
// js/einkaufsliste.js
// ═══════════════════════════════════════════════════════════════
// js/einkaufsliste.js — Einkaufsliste
// ═══════════════════════════════════════════════════════════════

const EL_KEY = 'pizzeria_einkaufsliste';

// ═══ STORAGE ═════════════════════════════════════════════════════

function getEinkaufsliste() {
  try { return JSON.parse(localStorage.getItem(EL_KEY) || '[]'); } catch(_) { return []; }
}

function saveEinkaufsliste(list) {
  try { localStorage.setItem(EL_KEY, JSON.stringify(list)); } catch(_) {}
}

// ═══ ACTIONS ═════════════════════════════════════════════════════

function elAddItem(item) {
  const list = getEinkaufsliste();
  // Prevent duplicates by name + shop
  const exists = list.find(i => !i.done && i.name.toLowerCase() === (item.name||'').toLowerCase() && i.shopId === (item.shopId||''));
  if (exists) {
    exists.menge = (parseFloat(exists.menge)||0) + (parseFloat(item.menge)||1);
    saveEinkaufsliste(list);
    return exists.id;
  }
  const newItem = {
    id: 'el_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
    name:      item.name      || '',
    menge:     item.menge     || 1,
    einheit:   item.einheit   || 'Stk',
    preis:     item.preis     || null,
    shop:      item.shop      || '',
    shopId:    item.shopId    || '',
    shopColor: item.shopColor || '#8d6562',
    done:      false,
    source:    item.source    || 'manuell',
    addedAt:   new Date().toISOString().slice(0,10),
  };
  list.push(newItem);
  saveEinkaufsliste(list);
  return newItem.id;
}

function elToggleDone(id) {
  const list = getEinkaufsliste();
  const item = list.find(i => i.id === id);
  if (item) item.done = !item.done;
  saveEinkaufsliste(list);
  renderEinkaufslisteTab();
}

function elDeleteItem(id) {
  saveEinkaufsliste(getEinkaufsliste().filter(i => i.id !== id));
  renderEinkaufslisteTab();
}

function elClearDone() {
  saveEinkaufsliste(getEinkaufsliste().filter(i => !i.done));
  renderEinkaufslisteTab();
}

function elClearAll() {
  _showConfirm('Einkaufsliste komplett leeren?', function() {
    saveEinkaufsliste([]);
    renderEinkaufslisteTab();
  }, { okLabel: 'Leeren' });
}

function elQuickAdd() {
  const nameEl   = document.getElementById('el-name');
  const mengeEl  = document.getElementById('el-menge');
  const einEl    = document.getElementById('el-einheit');
  const preisEl  = document.getElementById('el-preis');
  const katEl    = document.getElementById('el-kat');
  const shopEl   = document.getElementById('el-shop');

  const name  = nameEl?.value.trim();
  const menge = parseFloat(mengeEl?.value) || 1;
  const einheit = einEl?.value || 'Stk';
  const preis   = parseFloat(preisEl?.value) || null;
  const kategorie = katEl?.value || '';
  const shopId  = shopEl?.value || '';

  if (!name) { _markField('el-name', true); _showToast('Bitte Artikelname eingeben', 'error'); return; }

  const shopObj = SHOPS.find(s => s.id === shopId);
  elAddItem({
    name, menge, einheit, preis, kategorie,
    shop:      shopObj ? shopObj.name : '',
    shopId:    shopObj ? shopObj.id   : '',
    shopColor: shopObj ? shopObj.color : '#8d6562',
    source: 'manuell',
  });

  // Reset form
  if (nameEl)  { nameEl.value = '';  nameEl.focus(); }
  if (mengeEl) mengeEl.value = '1';
  if (preisEl) preisEl.value = '';

  renderEinkaufslisteTab();
}

// Called from Fehlmaterial tab
function elVonFehlmaterial(name, menge, einheit) {
  elAddItem({ name, menge, einheit, source: 'fehlmaterial' });
  const el = event && event.target ? event.target.closest('button') : null;
  if (el) {
    el.innerHTML = '<span class="material-symbols-outlined" style="font-size:14px">check</span> Hinzugefügt';
    el.style.background = '#f0fdf4';
    el.style.color = '#2e7d32';
    el.style.borderColor = '#bbf7d0';
    el.disabled = true;
  }
}

// ═══ RENDER ══════════════════════════════════════════════════════

function renderEinkaufslisteTab() {
  const panel = document.getElementById('panel-einkaufsliste');
  if (!panel) return;
  try {
    panel.innerHTML = _buildEinkaufslisteHTML();
  } catch(err) {
    console.error('Einkaufsliste Fehler:', err);
    panel.innerHTML = '<div style="padding:20px;background:#ffdad6;border-radius:12px;color:#93000a">' + _esc(err.message) + '</div>';
  }
}

function _buildEinkaufslisteHTML() {
  const list      = getEinkaufsliste();
  const doneCount = list.filter(i => i.done).length;
  const total     = list.length;
  const undone    = list.filter(i => !i.done);
  const totalCost = undone.reduce(function(s,i){ return s + (i.preis && i.menge ? i.preis * i.menge : 0); }, 0);
  const pct       = total > 0 ? Math.round(doneCount / total * 100) : 0;

  var html = '';

  // ── Header ──
  var subText = total > 0
    ? doneCount + ' von ' + total + ' erledigt' + (totalCost > 0.01 ? ' · geschätzt <strong style="color:var(--red)">' + eur(totalCost) + '</strong>' : '')
    : 'Noch keine Artikel';
  const elGrpMode = localStorage.getItem('psc_el_grp') || 'shop'; // 'shop' | 'kategorie'
  var actionBtns = '';
  actionBtns += `<button onclick="localStorage.setItem('psc_el_grp','${elGrpMode==='shop'?'kategorie':'shop'}');renderEinkaufslisteTab()" class="ws-btn ws-btn-ghost ws-btn-sm"><span class="material-symbols-outlined">${elGrpMode==='shop'?'category':'store'}</span>${elGrpMode==='shop'?'Nach Kategorie':'Nach Geschäft'}</button>`;
  if (doneCount > 0) actionBtns += '<button onclick="elClearDone()" class="ws-btn ws-btn-ghost ws-btn-sm"><span class="material-symbols-outlined">playlist_remove</span>Erledigte löschen</button>';
  if (total > 0) {
    actionBtns += '<button onclick="printEinkaufsliste()" class="ws-btn ws-btn-ghost ws-btn-sm"><span class="material-symbols-outlined">print</span>Drucken</button>';
    actionBtns += '<button onclick="elClearAll()" class="ws-btn ws-btn-sm" style="background:#fef2f2;color:#dc2626;border:none"><span class="material-symbols-outlined">delete_sweep</span>Leeren</button>';
  }
  html += _pageHdr('shopping_cart', 'Einkaufsliste', subText, '<div style="display:flex;gap:6px;flex-wrap:wrap">' + actionBtns + '</div>');

  // ── Progress Bar ──
  if (total > 0) {
    var barColor = pct === 100 ? 'linear-gradient(90deg,#2e7d32,#43a047)' : 'linear-gradient(90deg,#610000,#8b0000)';
    html += '<div style="height:8px;background:#f0e8e6;border-radius:8px;margin-bottom:24px;overflow:hidden">';
    html += '<div style="height:100%;width:' + pct + '%;background:' + barColor + ';border-radius:8px;transition:width .4s ease"></div>';
    html += '</div>';
  }

  // ── Quick-Add Form ──
  html += '<div style="background:#fff;border-radius:16px;border:1.5px solid #e3beb8;padding:20px;margin-bottom:24px;box-shadow:0 2px 8px rgba(0,0,0,.05)">';
  html += '<h3 style="font-size:14px;font-weight:800;color:#261816;margin:0 0 14px;display:flex;align-items:center;gap:7px">';
  html += '<span class="material-symbols-outlined" style="font-size:18px;color:#610000">add_shopping_cart</span>Artikel hinzufügen</h3>';
  html += '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:stretch">';

  // Name
  html += '<input id="el-name" type="text" placeholder="Produktname …" autocomplete="off"';
  html += ' onkeydown="if(event.key===\'Enter\')elQuickAdd()"';
  html += ' style="flex:2;min-width:150px;padding:11px 14px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;outline:none;box-sizing:border-box"';
  html += ' onfocus="this.style.borderColor=\'#610000\'" onblur="this.style.borderColor=\'#e3beb8\'">';

  // Menge
  html += '<input id="el-menge" type="number" value="1" min="0.1" step="0.1" placeholder="Menge"';
  html += ' style="width:80px;padding:11px 10px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;outline:none;box-sizing:border-box"';
  html += ' onfocus="this.style.borderColor=\'#610000\'" onblur="this.style.borderColor=\'#e3beb8\'">';

  // Einheit
  html += '<select id="el-einheit" style="width:80px;padding:11px 8px;border:1.5px solid #e3beb8;border-radius:10px;font-size:13px;font-family:inherit;color:#261816;background:#fff;outline:none">';
  html += '<option>Stk</option><option>kg</option><option>Liter</option><option>Dose</option><option>Bund</option><option>Päck.</option><option>Pack</option><option>Sack</option></select>';

  // Preis
  html += '<input id="el-preis" type="number" min="0" step="0.01" placeholder="€ Preis"';
  html += ' style="width:100px;padding:11px 10px;border:1.5px solid #e3beb8;border-radius:10px;font-size:14px;font-family:inherit;color:#261816;background:#fff;outline:none;box-sizing:border-box"';
  html += ' onfocus="this.style.borderColor=\'#610000\'" onblur="this.style.borderColor=\'#e3beb8\'">';

  // Kategorie
  html += '<select id="el-kat" style="width:110px;padding:11px 8px;border:1.5px solid #e3beb8;border-radius:10px;font-size:13px;font-family:inherit;color:#261816;background:#fff;outline:none">';
  html += '<option value="">Kategorie</option>';
  html += '<option>Lebensmittel</option><option>Gemüse &amp; Obst</option><option>Fleisch &amp; Wurst</option><option>Milchprodukte</option><option>Getränke</option><option>Tiefkühl</option><option>Trockenwaren</option><option>Reinigung</option><option>Büro</option><option>Sonstiges</option>';
  html += '</select>';

  // Shop
  html += '<select id="el-shop" style="flex:1;min-width:110px;padding:11px 10px;border:1.5px solid #e3beb8;border-radius:10px;font-size:13px;font-family:inherit;color:#261816;background:#fff;outline:none">';
  html += '<option value="">Kein Geschäft</option>';
  html += SHOPS.map(function(s){ return '<option value="' + s.id + '">' + s.name + '</option>'; }).join('');
  html += '<option value="hofer">Hofer</option>';
  html += '<option value="penny">Penny</option>';
  html += '</select>';

  // Button
  html += '<button onclick="elQuickAdd()" style="padding:11px 20px;background:linear-gradient(135deg,#610000,#8b0000);color:#fff;border:none;border-radius:10px;cursor:pointer;font-family:inherit;font-size:14px;font-weight:700;display:flex;align-items:center;gap:6px;white-space:nowrap">';
  html += '<span class="material-symbols-outlined" style="font-size:18px">add</span>Hinzufügen</button>';

  html += '</div>';
  html += '</div>';

  // ── Empty State ──
  if (total === 0) {
    html += '<div style="text-align:center;padding:60px 20px;background:#fff;border-radius:20px;border:2px dashed #e3beb8">';
    html += '<div style="font-size:72px;line-height:1;margin-bottom:16px">🛒</div>';
    html += '<h2 style="font-family:\'Plus Jakarta Sans\',sans-serif;font-size:18px;font-weight:700;color:#8d6562;margin:0 0 8px">Liste ist leer</h2>';
    html += '<p style="font-size:14px;color:#8d6562;margin:0 0 24px">Artikel oben hinzufügen oder Angebote merken</p>';
    html += '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">';
    html += '<button onclick="switchTab(\'angebote\')" style="padding:11px 22px;background:#610000;color:#fff;border:none;border-radius:12px;cursor:pointer;font-family:inherit;font-size:14px;font-weight:700;display:inline-flex;align-items:center;gap:7px">';
    html += '<span class="material-symbols-outlined" style="font-size:18px">local_offer</span>Angebote ansehen</button>';
    html += '<button onclick="switchTab(\'fehlmaterial\')" style="padding:11px 22px;background:#fff;color:#261816;border:1.5px solid #e3beb8;border-radius:12px;cursor:pointer;font-family:inherit;font-size:14px;font-weight:700;display:inline-flex;align-items:center;gap:7px">';
    html += '<span class="material-symbols-outlined" style="font-size:18px">assignment_late</span>Fehlmaterial</button>';
    html += '</div>';
    html += '</div>';
    return html;
  }

  // ── Alle erledigt Banner ──
  if (doneCount === total && total > 0) {
    html += '<div style="background:linear-gradient(135deg,#2e7d32,#43a047);border-radius:16px;padding:20px 24px;margin-bottom:20px;display:flex;align-items:center;gap:16px">';
    html += '<span style="font-size:40px">🎉</span>';
    html += '<div><p style="font-size:18px;font-weight:800;color:#fff;margin:0">Alles erledigt!</p>';
    html += '<p style="font-size:13px;color:rgba(255,255,255,.8);margin:4px 0 0">Einkauf abgeschlossen</p></div>';
    html += '</div>';
  }

  // ── Gruppierung nach Geschäft oder Kategorie ──
  var groups = {};
  var groupOrder = [];
  if (elGrpMode === 'kategorie') {
    for (var gi = 0; gi < list.length; gi++) {
      var it = list[gi];
      var gkey = it.kategorie || 'Sonstiges';
      if (!groups[gkey]) {
        groups[gkey] = { name: gkey, color: '#8B0000', items: [], isKat: true };
        groupOrder.push(gkey);
      }
      groups[gkey].items.push(it);
    }
    // Sortierung: Sonstiges ans Ende
    groupOrder.sort(function(a,b){ if(a==='Sonstiges')return 1; if(b==='Sonstiges')return -1; return a.localeCompare(b,'de'); });
  } else {
    for (var gi = 0; gi < list.length; gi++) {
      var it = list[gi];
      var gkey = it.shopId || '__none__';
      if (!groups[gkey]) {
        groups[gkey] = { name: it.shop || '', color: it.shopColor || '#8d6562', items: [] };
        groupOrder.push(gkey);
      }
      groups[gkey].items.push(it);
    }
  }

  for (var oi = 0; oi < groupOrder.length; oi++) {
    var gk    = groupOrder[oi];
    var group = groups[gk];
    var undoneInGroup = group.items.filter(function(i){ return !i.done; }).length;
    var doneInGroup   = group.items.filter(function(i){ return i.done;  }).length;
    var groupCost     = group.items.filter(function(i){ return !i.done; })
                              .reduce(function(s,i){ return s + (i.preis&&i.menge ? i.preis*i.menge : 0); }, 0);
    var allDone       = undoneInGroup === 0 && doneInGroup > 0;

    html += '<div style="background:#fff;border-radius:16px;border:1px solid #e8e8ed;box-shadow:0 2px 8px rgba(0,0,0,.06);margin-bottom:14px;overflow:hidden">';

    // Group Header
    html += '<div style="padding:14px 20px;background:' + (allDone ? '#f0fdf4' : '#fafafa') + ';border-bottom:1px solid #e8e8ed;display:flex;align-items:center;justify-content:space-between">';
    html += '<div style="display:flex;align-items:center;gap:10px">';
    if (group.name) {
      html += '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:' + group.color + ';flex-shrink:0"></span>';
      html += '<span style="font-size:15px;font-weight:800;color:' + (allDone ? '#2e7d32' : '#261816') + ';font-family:\'Plus Jakarta Sans\',sans-serif">' + escHtml(group.name) + '</span>';
    } else {
      html += '<span class="material-symbols-outlined" style="font-size:16px;color:#8d6562">shopping_bag</span>';
      html += '<span style="font-size:15px;font-weight:800;color:#261816;font-family:\'Plus Jakarta Sans\',sans-serif">Kein Geschäft</span>';
    }
    if (allDone) {
      html += '<span style="font-size:12px;font-weight:700;color:#2e7d32;background:#dcfce7;padding:2px 10px;border-radius:20px">✓ Fertig</span>';
    } else if (undoneInGroup > 0) {
      html += '<span style="font-size:12px;color:#8d6562;font-weight:600">' + undoneInGroup + ' verbleibend</span>';
    }
    html += '</div>';
    if (groupCost > 0.01) {
      html += '<span style="font-size:14px;font-weight:800;color:#610000">ca. ' + eur(groupCost) + '</span>';
    }
    html += '</div>';

    // Items
    html += '<div>';
    for (var ii = 0; ii < group.items.length; ii++) {
      var item    = group.items[ii];
      var safeId  = item.id.replace(/['"\\]/g,'');
      var isDone  = item.done;
      var itemCost = (item.preis && item.menge) ? item.preis * item.menge : 0;
      var isLast  = ii === group.items.length - 1;

      html += '<div style="display:flex;align-items:center;gap:12px;padding:13px 20px;' + (isLast ? '' : 'border-bottom:1px solid #f5f5f5;') + (isDone ? 'opacity:.55;' : '') + '">';

      // Checkbox
      html += '<button onclick="elToggleDone(\'' + safeId + '\')" ';
      html += 'style="width:26px;height:26px;border-radius:8px;border:2px solid ' + (isDone ? '#2e7d32' : '#d0c8c6') + ';';
      html += 'background:' + (isDone ? '#2e7d32' : '#fff') + ';cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;padding:0;transition:all .15s">';
      if (isDone) html += '<span class="material-symbols-outlined" style="font-size:15px;color:#fff">check</span>';
      html += '</button>';

      // Info
      html += '<div style="flex:1;min-width:0">';
      html += '<div style="font-size:14px;font-weight:' + (isDone ? '500' : '700') + ';color:#261816;' + (isDone ? 'text-decoration:line-through;' : '') + 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escHtml(item.name) + '</div>';
      html += '<div style="font-size:12px;color:#8d6562;margin-top:2px;display:flex;align-items:center;gap:6px;flex-wrap:wrap">';
      html += '<span>' + item.menge + ' ' + escHtml(item.einheit) + '</span>';
      if (item.preis) html += '<span>·</span><span>' + eur(item.preis) + '/' + escHtml(item.einheit) + '</span>';
      if (item.source === 'angebot') {
        html += '<span style="background:#dcfce7;color:#166534;font-size:10px;font-weight:700;padding:1px 7px;border-radius:10px">Angebot</span>';
      } else if (item.source === 'fehlmaterial') {
        html += '<span style="background:#fff3e0;color:#e65100;font-size:10px;font-weight:700;padding:1px 7px;border-radius:10px">Fehlmaterial</span>';
      }
      html += '</div>';
      html += '</div>';

      // Preis gesamt
      if (itemCost > 0.01 && !isDone) {
        html += '<div style="font-size:14px;font-weight:800;color:#610000;flex-shrink:0">' + eur(itemCost) + '</div>';
      }

      // Delete
      html += '<button onclick="elDeleteItem(\'' + safeId + '\')" ';
      html += 'style="background:none;border:none;cursor:pointer;padding:5px;color:#d0b8b4;flex-shrink:0;line-height:0;border-radius:6px;transition:all .1s" ';
      html += 'onmouseenter="this.style.color=\'#93000a\';this.style.background=\'#fff0ee\'" ';
      html += 'onmouseleave="this.style.color=\'#d0b8b4\';this.style.background=\'none\'">';
      html += '<span class="material-symbols-outlined" style="font-size:18px">delete</span></button>';

      html += '</div>';
    }
    html += '</div>';
    html += '</div>';
  }

  // ── Kosten-Zusammenfassung ──
  if (totalCost > 0.01) {
    html += '<div style="background:linear-gradient(135deg,#610000,#8b0000);border-radius:16px;padding:18px 24px;margin-top:8px;display:flex;align-items:center;justify-content:space-between">';
    html += '<div>';
    html += '<div style="font-size:12px;color:rgba(255,255,255,.8);font-weight:600;margin-bottom:4px">Geschätzte Gesamtkosten (' + undone.length + ' Artikel)</div>';
    html += '<div style="font-size:32px;font-weight:900;color:#fff;line-height:1">' + eur(totalCost) + '</div>';
    html += '</div>';
    html += '<span class="material-symbols-outlined" style="font-size:56px;color:rgba(255,255,255,.12)">shopping_cart</span>';
    html += '</div>';
  }

  return html;
}

// ═══ PRINT ═══════════════════════════════════════════════════════

function printEinkaufsliste() {
  var list   = getEinkaufsliste().filter(function(i){ return !i.done; });
  var total  = list.reduce(function(s,i){ return s + (i.preis&&i.menge ? i.preis*i.menge : 0); }, 0);
  var date   = new Date().toLocaleDateString('de-AT', { day:'2-digit', month:'2-digit', year:'numeric' });

  // Group by shop
  var groups = {}, order = [];
  for (var i = 0; i < list.length; i++) {
    var it = list[i];
    var k  = it.shop || 'Sonstiges';
    if (!groups[k]) { groups[k] = []; order.push(k); }
    groups[k].push(it);
  }

  var html = '<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>Einkaufsliste</title>';
  html += '<style>';
  html += '*{box-sizing:border-box;margin:0;padding:0}';
  html += 'body{font-family:Arial,sans-serif;padding:24px;max-width:640px;margin:0 auto;color:#1e1e2e}';
  html += 'header{border-bottom:3px solid #610000;padding-bottom:12px;margin-bottom:20px}';
  html += 'h1{font-size:22px;font-weight:bold;color:#610000}';
  html += '.date{font-size:12px;color:#666;margin-top:4px}';
  html += '.shop-header{font-size:14px;font-weight:bold;background:#f0f0f0;padding:8px 12px;border-radius:6px;margin:18px 0 8px;display:flex;align-items:center;gap:8px}';
  html += '.item{display:flex;align-items:center;gap:12px;padding:9px 4px;border-bottom:1px solid #eee}';
  html += '.cb{width:20px;height:20px;border:2px solid #aaa;border-radius:5px;flex-shrink:0}';
  html += '.item-name{flex:1;font-size:14px}';
  html += '.item-qty{font-size:13px;color:#555;white-space:nowrap}';
  html += '.item-price{font-size:14px;font-weight:bold;color:#610000;white-space:nowrap}';
  html += '.total-box{margin-top:24px;padding:14px 16px;background:#fff0ee;border-radius:8px;border-left:4px solid #610000;display:flex;justify-content:space-between;align-items:center}';
  html += '.total-label{font-size:13px;color:#5a403c}';
  html += '.total-amt{font-size:20px;font-weight:bold;color:#610000}';
  html += 'footer{margin-top:28px;font-size:11px;color:#777;text-align:center}';
  html += '@media print{body{padding:12px}button{display:none}}';
  html += '</style></head><body>';

  html += '<header>';
  html += '<h1>🍕 Einkaufsliste</h1>';
  html += '<div class="date">Pizzeria Ali Shama KG &nbsp;·&nbsp; Erstellt am ' + date + '</div>';
  html += '</header>';

  for (var oi = 0; oi < order.length; oi++) {
    var shopName  = order[oi];
    var shopItems = groups[shopName];
    html += '<div class="shop-header">📍 ' + escHtml(shopName) + ' <span style="font-weight:normal;color:#666;font-size:12px">(' + shopItems.length + ' Artikel)</span></div>';
    for (var si = 0; si < shopItems.length; si++) {
      var it2 = shopItems[si];
      html += '<div class="item">';
      html += '<div class="cb"></div>';
      html += '<div class="item-name">' + escHtml(it2.name||'') + '</div>';
      html += '<div class="item-qty">' + it2.menge + ' ' + (it2.einheit||'Stk') + '</div>';
      if (it2.preis) html += '<div class="item-price">' + eur(it2.preis) + '</div>';
      html += '</div>';
    }
  }

  if (total > 0.01) {
    html += '<div class="total-box"><div class="total-label">Geschätzte Gesamtkosten (' + list.length + ' Artikel)</div><div class="total-amt">' + eur(total) + '</div></div>';
  }

  html += '<footer>Gedruckt: ' + date + ' &nbsp;·&nbsp; Pizzeria Ali Shama KG &nbsp;·&nbsp; Internes Einkaufssystem</footer>';
  html += '</body></html>';

  var win = window.open('', '_blank', 'width=700,height=900');
  win.document.write(html);
  win.document.close();
  setTimeout(function(){ win.print(); }, 400);
}

// ═══ BADGE ═══════════════════════════════════════════════════════

function elUpdateBadge() {
  var count = getEinkaufsliste().filter(function(i){ return !i.done; }).length;
  var badges = ['el-tab-badge', 'el-mob-badge'];
  for (var i = 0; i < badges.length; i++) {
    var el = document.getElementById(badges[i]);
    if (!el) continue;
    if (count > 0) {
      el.textContent = count;
      el.style.display = 'flex';
    } else {
      el.style.display = 'none';
    }
  }
}

function aufgUpdateBadge() {
  const el = document.getElementById('aufg-mob-badge');
  if (!el) return;
  let count = 0;
  try {
    const alle = JSON.parse(localStorage.getItem('pizzeria_aufgaben')||'[]');
    count = alle.filter(a => a.status !== 'erledigt' && !a.erledigt).length;
  } catch(_) {}
  if (count > 0) { el.textContent = count > 9 ? '9+' : String(count); el.style.display = ''; }
  else { el.style.display = 'none'; }
}


