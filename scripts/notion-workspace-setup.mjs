#!/usr/bin/env node

/**
 * Notion Workspace Organizer (safe-by-default)
 *
 * Features:
 * - Dry-run analysis report first (default)
 * - No delete operations
 * - Moves pages only after explicit --apply
 * - Reuses existing top-level sections if found
 * - Prevents duplicate moves
 */

const NOTION_VERSION = '2022-06-28';
const NOTION_API_BASE = 'https://api.notion.com/v1';

const REQUIRED_SECTIONS = [
  'Ali Shama Dashboard',
  'Pizzeria',
  'Arbeit und Karriere',
  'Privat und Familie',
  'Dokumente und Vorlagen',
  'Archiv',
  'Inbox',
];

const args = parseArgs(process.argv.slice(2));

if (!args.token || !args.rootPageId) {
  printUsageAndExit(
    'Fehlende Parameter. Bitte --token und --root-page-id angeben.'
  );
}

const ctx = {
  token: args.token,
  rootPageId: normalizePageId(args.rootPageId),
  apply: args.apply,
  moveUnclearToArchive: args.moveUnclearToArchive,
};

main(ctx).catch((error) => {
  console.error('\n❌ Fehler:', error.message);
  process.exit(1);
});

async function main(ctx) {
  console.log('🔍 Starte Analyse...');
  const topLevelChildren = await listAllBlockChildren(ctx, ctx.rootPageId);
  const topLevelPages = topLevelChildren
    .filter(isPageLikeBlock)
    .map(toBlockSummary)
    .filter(Boolean);

  if (!topLevelPages.length) {
    console.log('⚠️ Keine Seiten unter der Root-Seite gefunden.');
    return;
  }

  const pageMetaById = new Map();
  for (const page of topLevelPages) {
    const pageObject = await getPage(ctx, page.id);
    pageMetaById.set(page.id, {
      ...page,
      title: getPageTitle(pageObject) || page.title || 'Unbenannte Seite',
      object: pageObject,
    });
  }

  const existingSections = findExistingSections(Array.from(pageMetaById.values()));

  const missingSections = REQUIRED_SECTIONS.filter(
    (name) => !existingSections.has(name)
  );

  const actions = [];

  for (const page of pageMetaById.values()) {
    if (REQUIRED_SECTIONS.includes(page.title)) {
      actions.push({
        type: 'keep',
        pageId: page.id,
        pageTitle: page.title,
        destination: 'auf Hauptfläche behalten',
        reason: 'Ist eine definierte Hauptstruktur-Seite.',
      });
      continue;
    }

    const assignment = classifyPage(page.title);

    let destination = assignment.destination;
    if (destination === 'unklar' && ctx.moveUnclearToArchive) {
      destination = 'Archiv';
    }

    if (destination === 'auf Hauptfläche behalten' || destination === 'unklar') {
      actions.push({
        type: 'keep',
        pageId: page.id,
        pageTitle: page.title,
        destination,
        reason: assignment.reason,
      });
      continue;
    }

    const destinationPageId = existingSections.get(destination);

    if (!destinationPageId) {
      actions.push({
        type: 'skip',
        pageId: page.id,
        pageTitle: page.title,
        destination,
        reason: `Zielbereich \"${destination}\" existiert noch nicht.`,
      });
      continue;
    }

    actions.push({
      type: 'move',
      pageId: page.id,
      pageTitle: page.title,
      destination,
      destinationPageId,
      reason: assignment.reason,
    });
  }

  printReport({
    actions,
    missingSections,
    apply: ctx.apply,
  });

  if (!ctx.apply) {
    console.log('\n🛑 Dry-Run beendet. Keine Änderungen durchgeführt.');
    console.log('   Für Ausführung: --apply hinzufügen.');
    return;
  }

  if (missingSections.length) {
    console.log(
      '\n⚠️ Abbruch: Es fehlen Hauptbereiche. Bitte zuerst manuell anlegen oder Script erweitern.'
    );
    return;
  }

  const plannedMoves = dedupeMoves(actions.filter((a) => a.type === 'move'));
  if (!plannedMoves.length) {
    console.log('\nℹ️ Keine Verschiebungen notwendig.');
    return;
  }

  console.log(`\n🚚 Führe ${plannedMoves.length} Verschiebungen aus...`);

  for (const move of plannedMoves) {
    await patchBlockParent(ctx, move.pageId, move.destinationPageId);
    console.log(`✅ ${move.pageTitle} → ${move.destination}`);
  }

  console.log('\n🎉 Fertig. Verschiebungen abgeschlossen.');
}

function parseArgs(argv) {
  const args = {
    apply: false,
    moveUnclearToArchive: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--apply') {
      args.apply = true;
      continue;
    }
    if (arg === '--move-unclear-to-archive') {
      args.moveUnclearToArchive = true;
      continue;
    }
    if (arg.startsWith('--token=')) {
      args.token = arg.split('=')[1];
      continue;
    }
    if (arg === '--token') {
      args.token = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith('--root-page-id=')) {
      args.rootPageId = arg.split('=')[1];
      continue;
    }
    if (arg === '--root-page-id') {
      args.rootPageId = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      printUsageAndExit();
    }
  }

  return args;
}

function printUsageAndExit(message) {
  if (message) console.error(`\n${message}\n`);
  console.log(`
Verwendung:
  node scripts/notion-workspace-setup.mjs --token <NOTION_TOKEN> --root-page-id <PAGE_ID> [--apply] [--move-unclear-to-archive]

Beispiele:
  # Nur Bericht (empfohlen zuerst)
  node scripts/notion-workspace-setup.mjs --token $NOTION_TOKEN --root-page-id <PAGE_ID>

  # Bericht + Ausführung der Verschiebungen
  node scripts/notion-workspace-setup.mjs --token $NOTION_TOKEN --root-page-id <PAGE_ID> --apply
`);
  process.exit(message ? 1 : 0);
}

function normalizePageId(raw) {
  return raw.replace(/-/g, '');
}

function isPageLikeBlock(block) {
  return block?.type === 'child_page' || block?.type === 'child_database';
}

function toBlockSummary(block) {
  if (!block?.id) return null;
  if (block.type === 'child_page') {
    return {
      id: block.id,
      title: block.child_page?.title || 'Unbenannte Seite',
      kind: 'page',
    };
  }
  if (block.type === 'child_database') {
    return {
      id: block.id,
      title: block.child_database?.title || 'Unbenannte Datenbank',
      kind: 'database',
    };
  }
  return null;
}

function findExistingSections(topPages) {
  const result = new Map();
  for (const page of topPages) {
    if (REQUIRED_SECTIONS.includes(page.title)) {
      result.set(page.title, page.id);
    }
  }
  return result;
}

function classifyPage(title) {
  const t = title.toLowerCase();

  if (
    hasAny(t, [
      'einkauf',
      'fehlmaterial',
      'kalkulation',
      'personal',
      'lieferant',
      'wareneinsatz',
      'speisekarte',
      'inventur',
      'pizzeria',
    ])
  ) {
    return {
      destination: 'Pizzeria',
      reason: 'Betriebs-/Einkaufsbezug zur Pizzeria erkannt.',
    };
  }

  if (
    hasAny(t, [
      'arbeit',
      'karriere',
      'bewerbung',
      'cv',
      'lebenslauf',
      'interview',
      'job',
      'projekt',
      'meeting',
    ])
  ) {
    return {
      destination: 'Arbeit und Karriere',
      reason: 'Beruflicher Kontext erkannt.',
    };
  }

  if (
    hasAny(t, [
      'privat',
      'familie',
      'urlaub',
      'gesundheit',
      'haushalt',
      'geburtstag',
      'kinder',
      'freunde',
    ])
  ) {
    return {
      destination: 'Privat und Familie',
      reason: 'Privater/Familien-Kontext erkannt.',
    };
  }

  if (
    hasAny(t, [
      'monatsbericht',
      'vertrag',
      'texte',
      'dokument',
      'vorlage',
      'template',
      'angebot',
      'rechnung',
      'pdf',
    ])
  ) {
    return {
      destination: 'Dokumente und Vorlagen',
      reason: 'Dokument-/Vorlagencharakter erkannt.',
    };
  }

  if (
    hasAny(t, [
      'demo',
      'test',
      'old',
      'backup',
      'archiv',
      'alt',
      'legacy',
    ])
  ) {
    return {
      destination: 'Archiv',
      reason: 'Selten genutzte/Test-/Altdaten erkannt.',
    };
  }

  if (hasAny(t, ['inbox', 'notiz', 'quick note', 'schnellnotiz'])) {
    return {
      destination: 'Inbox',
      reason: 'Eingang/Notiz-Kontext erkannt.',
    };
  }

  return {
    destination: 'unklar',
    reason: 'Keine sichere Zuordnung möglich; manuelle Prüfung empfohlen.',
  };
}

function hasAny(text, needles) {
  return needles.some((needle) => text.includes(needle));
}

function dedupeMoves(moves) {
  const seen = new Set();
  return moves.filter((move) => {
    const key = `${move.pageId}:${move.destinationPageId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function printReport({ actions, missingSections, apply }) {
  console.log('\n=== Vorab-Bericht ===');
  console.log(`Modus: ${apply ? 'AUSFÜHRUNG (--apply)' : 'ANALYSE (dry-run)'}`);

  if (missingSections.length) {
    console.log('\nFehlende Hauptbereiche:');
    for (const section of missingSections) {
      console.log(`- ${section}`);
    }
  }

  const rows = actions.map((a, index) => ({
    '#': index + 1,
    Seite: a.pageTitle,
    Ziel: a.destination,
    Aktion: a.type,
    Warum: a.reason,
  }));

  console.table(rows);

  const summary = {
    keep: actions.filter((a) => a.type === 'keep').length,
    move: actions.filter((a) => a.type === 'move').length,
    skip: actions.filter((a) => a.type === 'skip').length,
  };

  console.log('Zusammenfassung:', summary);
}

async function notionRequest(ctx, path, { method = 'GET', body } = {}) {
  const response = await fetch(`${NOTION_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${ctx.token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let details = '';
    try {
      const data = await response.json();
      details = data.message || JSON.stringify(data);
    } catch {
      details = await response.text();
    }
    throw new Error(`${method} ${path} fehlgeschlagen (${response.status}): ${details}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

async function listAllBlockChildren(ctx, blockId) {
  let cursor;
  const results = [];

  do {
    const query = new URLSearchParams();
    query.set('page_size', '100');
    if (cursor) query.set('start_cursor', cursor);

    const data = await notionRequest(
      ctx,
      `/blocks/${normalizePageId(blockId)}/children?${query.toString()}`
    );

    if (Array.isArray(data.results)) results.push(...data.results);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  return results;
}

async function getPage(ctx, pageId) {
  return notionRequest(ctx, `/pages/${normalizePageId(pageId)}`);
}

function getPageTitle(page) {
  const titleProp = Object.values(page.properties || {}).find(
    (p) => p?.type === 'title'
  );
  const fragments = titleProp?.title || [];
  if (!fragments.length) return '';
  return fragments.map((f) => f.plain_text).join('').trim();
}

async function patchBlockParent(ctx, blockId, newParentPageId) {
  return notionRequest(ctx, `/blocks/${normalizePageId(blockId)}`, {
    method: 'PATCH',
    body: {
      parent: {
        type: 'page_id',
        page_id: normalizePageId(newParentPageId),
      },
    },
  });
}
