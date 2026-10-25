export interface CrosswordItem {
  number?: number;
  direction?: 'across' | 'down';
  answer: string;
  clue: string;
}

export interface PlacedWord {
  number: number;
  direction: 'across' | 'down';
  word: string;
  clue: string;
  row: number;
  col: number;
  length: number;
}

export interface CrosswordGridCell {
  row: number;
  col: number;
  letter: string;
  isBlocked: boolean;
  cellNumber?: number;
}

export interface CrosswordLayout {
  width: number;
  height: number;
  grid: CrosswordGridCell[][];
  acrossClues: PlacedWord[];
  downClues: PlacedWord[];
  unplacedWords?: string[];
}

// Clean word to uppercase letters only
export function cleanWord(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .trim();
}

/**
 * Extracts crossword items from markdown text or JSON codeblocks
 */
export function extractCrosswordData(text: string): { title: string; items: CrosswordItem[] } {
  if (!text) return { title: 'Teka-Teki Silang PAI', items: [] };

  // 1. Try finding ```crossword-data or ```json block
  const codeBlockMatch = text.match(/```(?:crossword-data|json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1]);
      if (parsed && Array.isArray(parsed.items)) {
        return {
          title: parsed.title || 'Teka-Teki Silang PAI & Budi Pekerti',
          items: parsed.items.map((it: any) => ({
            number: it.number,
            direction: it.direction === 'down' ? 'down' : 'across',
            answer: cleanWord(it.answer || it.word || ''),
            clue: String(it.clue || '').trim(),
          })),
        };
      }
    } catch {
      // Ignore JSON parse failure, fallback to regex
    }
  }

  // 2. Extract Title
  const titleMatch = text.match(/#\s*(.*?)(?:\n|$)/);
  const title = titleMatch ? titleMatch[1].trim() : 'Teka-Teki Silang PAI & Budi Pekerti';

  // 3. Regex parse from text sections
  const items: CrosswordItem[] = [];
  const lines = text.split('\n');

  let currentDir: 'across' | 'down' = 'across';
  const answerMap: Record<number | string, string> = {};

  // First pass: look for answer key section
  let inAnswerKey = false;
  lines.forEach((line) => {
    const l = line.trim();
    if (l.match(/kunci\s+jawaban/i)) {
      inAnswerKey = true;
      return;
    }
    if (inAnswerKey) {
      const m = l.match(/^(\d+)[.\s\-\)]+([A-Z\s]{2,25})(?:\s*\(|\s*-|\s*:|$)/i);
      if (m) {
        const num = parseInt(m[1], 10);
        const ans = cleanWord(m[2]);
        if (ans.length >= 2) {
          answerMap[num] = ans;
        }
      }
    }
  });

  // Second pass: parse clues
  lines.forEach((line) => {
    const l = line.trim();
    if (l.match(/mendatar/i)) {
      currentDir = 'across';
      return;
    }
    if (l.match(/menurun/i)) {
      currentDir = 'down';
      return;
    }
    if (l.match(/kunci\s+jawaban/i)) {
      return;
    }

    const m = l.match(/^(\d+)[.\s\-\)]+(.*)/);
    if (m) {
      const num = parseInt(m[1], 10);
      let rest = m[2].trim();

      // Check if word is included in clue e.g. "Clue text (JAWABAN)" or "JAWABAN: Clue text"
      let answer = answerMap[num] || '';
      const parenthesisMatch = rest.match(/\(([A-Z]{3,20})\)/i);
      if (parenthesisMatch) {
        answer = cleanWord(parenthesisMatch[1]);
        rest = rest.replace(parenthesisMatch[0], '').trim();
      }

      const colonMatch = rest.match(/^([A-Z]{3,20})\s*[-:]\s*(.*)/i);
      if (colonMatch && !answer) {
        answer = cleanWord(colonMatch[1]);
        rest = colonMatch[2].trim();
      }

      if (rest) {
        items.push({
          number: num,
          direction: currentDir,
          clue: rest,
          answer: answer || `KATA${num}`,
        });
      }
    }
  });

  return { title, items };
}

/**
 * Intelligent Crossword Grid Placement Algorithm
 */
export function buildCrosswordLayout(items: CrosswordItem[]): CrosswordLayout {
  const validItems = items
    .filter((it) => it.answer && it.answer.length >= 2)
    .map((it) => ({
      ...it,
      answer: cleanWord(it.answer),
    }));

  if (validItems.length === 0) {
    return {
      width: 10,
      height: 10,
      grid: Array.from({ length: 10 }, (_, r) =>
        Array.from({ length: 10 }, (_, c) => ({ row: r, col: c, letter: '', isBlocked: true }))
      ),
      acrossClues: [],
      downClues: [],
    };
  }

  const MAX_SIZE = 26;
  const board: (string | null)[][] = Array.from({ length: MAX_SIZE }, () => Array(MAX_SIZE).fill(null));

  interface TempPlaced {
    word: string;
    clue: string;
    direction: 'across' | 'down';
    row: number;
    col: number;
  }

  const placed: TempPlaced[] = [];

  // Sort: longest words first
  const sorted = [...validItems].sort((a, b) => b.answer.length - a.answer.length);

  // Place first word horizontally in center
  const first = sorted[0];
  const startRow = Math.floor(MAX_SIZE / 2);
  const startCol = Math.floor((MAX_SIZE - first.answer.length) / 2);

  for (let i = 0; i < first.answer.length; i++) {
    board[startRow][startCol + i] = first.answer[i];
  }
  placed.push({
    word: first.answer,
    clue: first.clue,
    direction: 'across',
    row: startRow,
    col: startCol,
  });

  // Try placing subsequent words
  const unplaced: string[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const item = sorted[i];
    const word = item.answer;
    let bestPlacement: { row: number; col: number; dir: 'across' | 'down'; score: number } | null = null;

    // Try finding intersections with already placed words
    for (const p of placed) {
      const targetDir: 'across' | 'down' = p.direction === 'across' ? 'down' : 'across';

      for (let pIdx = 0; pIdx < p.word.length; pIdx++) {
        const pChar = p.word[pIdx];

        for (let wIdx = 0; wIdx < word.length; wIdx++) {
          if (word[wIdx] === pChar) {
            // Potential intersection
            let testRow = p.row;
            let testCol = p.col;

            if (p.direction === 'across') {
              testCol = p.col + pIdx;
              testRow = p.row - wIdx;
            } else {
              testRow = p.row + pIdx;
              testCol = p.col - wIdx;
            }

            if (canPlaceWord(board, word, testRow, testCol, targetDir)) {
              // Score based on distance from center
              const rDist = Math.abs(testRow - MAX_SIZE / 2);
              const cDist = Math.abs(testCol - MAX_SIZE / 2);
              const score = 100 - (rDist + cDist);

              if (!bestPlacement || score > bestPlacement.score) {
                bestPlacement = { row: testRow, col: testCol, dir: targetDir, score };
              }
            }
          }
        }
      }
    }

    if (bestPlacement) {
      // Place word
      for (let k = 0; k < word.length; k++) {
        const r = bestPlacement.dir === 'down' ? bestPlacement.row + k : bestPlacement.row;
        const c = bestPlacement.dir === 'across' ? bestPlacement.col + k : bestPlacement.col;
        board[r][c] = word[k];
      }
      placed.push({
        word,
        clue: item.clue,
        direction: bestPlacement.dir,
        row: bestPlacement.row,
        col: bestPlacement.col,
      });
    } else {
      unplaced.push(word);
    }
  }

  // Calculate bounding box
  let minR = MAX_SIZE;
  let maxR = -1;
  let minC = MAX_SIZE;
  let maxC = -1;

  for (let r = 0; r < MAX_SIZE; r++) {
    for (let c = 0; c < MAX_SIZE; c++) {
      if (board[r][c] !== null) {
        minR = Math.min(minR, r);
        maxR = Math.max(maxR, r);
        minC = Math.min(minC, c);
        maxC = Math.max(maxC, c);
      }
    }
  }

  if (minR > maxR || minC > maxC) {
    minR = 0;
    maxR = 9;
    minC = 0;
    maxC = 9;
  }

  // Add 1 cell padding if possible
  const cropMinR = Math.max(0, minR - 1);
  const cropMaxR = Math.min(MAX_SIZE - 1, maxR + 1);
  const cropMinC = Math.max(0, minC - 1);
  const cropMaxC = Math.min(MAX_SIZE - 1, maxC + 1);

  const croppedHeight = cropMaxR - cropMinR + 1;
  const croppedWidth = cropMaxC - cropMinC + 1;

  // Build cropped grid
  const grid: CrosswordGridCell[][] = [];
  for (let r = 0; r < croppedHeight; r++) {
    const rowCells: CrosswordGridCell[] = [];
    for (let c = 0; c < croppedWidth; c++) {
      const origR = cropMinR + r;
      const origC = cropMinC + c;
      const char = board[origR][origC];
      rowCells.push({
        row: r,
        col: c,
        letter: char || '',
        isBlocked: char === null,
      });
    }
    grid.push(rowCells);
  }

  // Adjust placed words coordinates to cropped grid
  const adjustedPlaced: TempPlaced[] = placed.map((p) => ({
    ...p,
    row: p.row - cropMinR,
    col: p.col - cropMinC,
  }));

  // Assign numbers top-to-bottom, left-to-right
  let clueNumber = 1;
  const acrossClues: PlacedWord[] = [];
  const downClues: PlacedWord[] = [];

  for (let r = 0; r < croppedHeight; r++) {
    for (let c = 0; c < croppedWidth; c++) {
      const cell = grid[r][c];
      if (cell.isBlocked) continue;

      const matchingAcross = adjustedPlaced.find((p) => p.direction === 'across' && p.row === r && p.col === c);
      const matchingDown = adjustedPlaced.find((p) => p.direction === 'down' && p.row === r && p.col === c);

      if (matchingAcross || matchingDown) {
        cell.cellNumber = clueNumber;

        if (matchingAcross) {
          acrossClues.push({
            number: clueNumber,
            direction: 'across',
            word: matchingAcross.word,
            clue: matchingAcross.clue,
            row: r,
            col: c,
            length: matchingAcross.word.length,
          });
        }

        if (matchingDown) {
          downClues.push({
            number: clueNumber,
            direction: 'down',
            word: matchingDown.word,
            clue: matchingDown.clue,
            row: r,
            col: c,
            length: matchingDown.word.length,
          });
        }

        clueNumber++;
      }
    }
  }

  return {
    width: croppedWidth,
    height: croppedHeight,
    grid,
    acrossClues: acrossClues.sort((a, b) => a.number - b.number),
    downClues: downClues.sort((a, b) => a.number - b.number),
    unplacedWords: unplaced,
  };
}

function canPlaceWord(
  board: (string | null)[][],
  word: string,
  startRow: number,
  startCol: number,
  dir: 'across' | 'down'
): boolean {
  const MAX = board.length;
  const len = word.length;

  if (dir === 'across') {
    if (startRow < 0 || startRow >= MAX || startCol < 0 || startCol + len > MAX) return false;

    // Check cell before and after
    if (startCol > 0 && board[startRow][startCol - 1] !== null) return false;
    if (startCol + len < MAX && board[startRow][startCol + len] !== null) return false;

    for (let i = 0; i < len; i++) {
      const r = startRow;
      const c = startCol + i;
      const current = board[r][c];

      if (current !== null) {
        if (current !== word[i]) return false;
      } else {
        // Orthogonal checks: above and below shouldn't be occupied
        if (r > 0 && board[r - 1][c] !== null) return false;
        if (r < MAX - 1 && board[r + 1][c] !== null) return false;
      }
    }
  } else {
    if (startCol < 0 || startCol >= MAX || startRow < 0 || startRow + len > MAX) return false;

    // Check cell before and after
    if (startRow > 0 && board[startRow - 1][startCol] !== null) return false;
    if (startRow + len < MAX && board[startRow + len][startCol] !== null) return false;

    for (let i = 0; i < len; i++) {
      const r = startRow + i;
      const c = startCol;
      const current = board[r][c];

      if (current !== null) {
        if (current !== word[i]) return false;
      } else {
        // Orthogonal checks: left and right shouldn't be occupied
        if (c > 0 && board[r][c - 1] !== null) return false;
        if (c < MAX - 1 && board[r][c + 1] !== null) return false;
      }
    }
  }

  return true;
}

/**
 * Generate 1-Page A4 Printable and Word HTML for Crossword
 */
export function generateCrosswordSinglePageHtml(options: {
  title: string;
  gradeLevel: number;
  semester: string;
  topic: string;
  subTopic?: string;
  layout: CrosswordLayout;
  showAnswers?: boolean;
}): string {
  const { title, gradeLevel, semester, topic, subTopic, layout, showAnswers = false } = options;

  // Grid HTML Table with precise styling
  let gridTableHtml = `
    <table class="tts-grid-table" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto; border-collapse: collapse; page-break-inside: avoid;">
      <tbody>
  `;

  for (let r = 0; r < layout.height; r++) {
    gridTableHtml += '<tr>';
    for (let c = 0; c < layout.width; c++) {
      const cell = layout.grid[r][c];
      if (cell.isBlocked) {
        gridTableHtml += `
          <td style="width: 22pt; height: 22pt; background-color: #1e293b; border: 1px solid #94a3b8; padding: 0;"></td>
        `;
      } else {
        const letterDisplay = showAnswers ? cell.letter : '&nbsp;';
        const numDisplay = cell.cellNumber ? `<span style="position: absolute; top: 1pt; left: 2pt; font-size: 6.5pt; font-weight: bold; color: #1e3a8a;">${cell.cellNumber}</span>` : '';
        gridTableHtml += `
          <td style="position: relative; width: 22pt; height: 22pt; background-color: #ffffff; border: 1.5pt solid #000000; text-align: center; vertical-align: middle; font-size: 11pt; font-weight: bold; color: #000000; padding: 0;">
            ${numDisplay}
            <span style="display: block; line-height: 22pt;">${letterDisplay}</span>
          </td>
        `;
      }
    }
    gridTableHtml += '</tr>';
  }
  gridTableHtml += '</tbody></table>';

  // Clues list HTML (2 columns)
  const acrossHtml = layout.acrossClues
    .map(
      (c) =>
        `<div style="margin-bottom: 4pt; font-size: 8.5pt; line-height: 1.35;"><b>${c.number}.</b> ${c.clue} <i>(${c.length} huruf)</i>${showAnswers ? ` — <b style="color:#1e3a8a;">[${c.word}]</b>` : ''}</div>`
    )
    .join('');

  const downHtml = layout.downClues
    .map(
      (c) =>
        `<div style="margin-bottom: 4pt; font-size: 8.5pt; line-height: 1.35;"><b>${c.number}.</b> ${c.clue} <i>(${c.length} huruf)</i>${showAnswers ? ` — <b style="color:#1e3a8a;">[${c.word}]</b>` : ''}</div>`
    )
    .join('');

  return `
    <div class="tts-single-page" style="width: 100%; max-width: 210mm; margin: 0 auto; font-family: 'Calibri', Arial, sans-serif; color: #000000;">
      <!-- Kop Lembar Kerja Siswa -->
      <table style="width: 100%; border-bottom: 2pt solid #000000; margin-bottom: 8pt; border-collapse: collapse;">
        <tr>
          <td style="text-align: center; padding-bottom: 4pt;">
            <div style="font-size: 10pt; font-weight: bold; letter-spacing: 0.5px;">UPT SMP NEGERI 2 REBANG TANGKAS</div>
            <div style="font-size: 11pt; font-weight: bold; color: #1e3a8a;">LEMBAR KERJA PESERTA DIDIK (LKPD) - TEKA-TEKI SILANG PAI</div>
            <div style="font-size: 8pt; color: #475569;">Fase D | Kelas ${gradeLevel} | Semester ${semester} | Topik: ${topic} ${subTopic ? `(${subTopic})` : ''}</div>
          </td>
        </tr>
      </table>

      <!-- Tabel Identitas Siswa -->
      <table style="width: 100%; border: 1px solid #94a3b8; border-collapse: collapse; margin-bottom: 10pt; font-size: 8.5pt;">
        <tr>
          <td style="width: 15%; padding: 3pt 5pt; font-weight: bold; background: #f8fafc; border: 1px solid #94a3b8;">Nama Siswa</td>
          <td style="width: 45%; padding: 3pt 5pt; border: 1px solid #94a3b8;">.........................................................</td>
          <td style="width: 15%; padding: 3pt 5pt; font-weight: bold; background: #f8fafc; border: 1px solid #94a3b8;">Hari/Tanggal</td>
          <td style="width: 25%; padding: 3pt 5pt; border: 1px solid #94a3b8;">................................</td>
        </tr>
        <tr>
          <td style="padding: 3pt 5pt; font-weight: bold; background: #f8fafc; border: 1px solid #94a3b8;">Kelas / No. Absen</td>
          <td style="padding: 3pt 5pt; border: 1px solid #94a3b8;">.........................................................</td>
          <td style="padding: 3pt 5pt; font-weight: bold; background: #f8fafc; border: 1px solid #94a3b8;">Nilai / Paraf</td>
          <td style="padding: 3pt 5pt; border: 1px solid #94a3b8;">................................</td>
        </tr>
      </table>

      <!-- Kotak Grid TTS -->
      <div style="text-align: center; margin: 10pt 0;">
        ${gridTableHtml}
      </div>

      <!-- Petunjuk Pengerjaan -->
      <div style="font-size: 8pt; font-style: italic; color: #334155; margin-bottom: 8pt; text-align: center;">
        Petunjuk: Isilah kotak-kotak kosong dengan huruf kapital yang tepat sesuai nomor dan arah pertanyaan di bawah ini!
      </div>

      <!-- 2 Kolom Pertanyaan (Mendatar & Menurun) -->
      <table style="width: 100%; border-collapse: collapse; margin-top: 6pt;">
        <tr>
          <td style="width: 50%; vertical-align: top; padding-right: 8pt;">
            <div style="background-color: #f1f5f9; padding: 3pt 6pt; font-size: 9pt; font-weight: bold; color: #1e3a8a; border-left: 3pt solid #1e3a8a; margin-bottom: 5pt;">
              PERTANYAAN MENDATAR (ACROSS)
            </div>
            ${acrossHtml || '<div style="font-size: 8pt; color: #64748b;">(Tidak ada soal mendatar)</div>'}
          </td>
          <td style="width: 50%; vertical-align: top; padding-left: 8pt;">
            <div style="background-color: #f1f5f9; padding: 3pt 6pt; font-size: 9pt; font-weight: bold; color: #0284c7; border-left: 3pt solid #0284c7; margin-bottom: 5pt;">
              PERTANYAAN MENURUN (DOWN)
            </div>
            ${downHtml || '<div style="font-size: 8pt; color: #64748b;">(Tidak ada soal menurun)</div>'}
          </td>
        </tr>
      </table>
    </div>
  `;
}
