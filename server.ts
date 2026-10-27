import express, { Request, Response } from 'express';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side Gemini API client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Endpoint: AI Status check
app.get('/api/ai/status', (_req: Request, res: Response) => {
  res.json({
    hasKey: Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY'),
    model: 'gemini-3.8-flash',
  });
});

// Endpoint: Secure username to email resolution
app.post('/api/auth/resolve-username', async (req: Request, res: Response) => {
  try {
    const { username = '', role = 'guru' } = req.body;
    const clean = String(username).trim().toLowerCase();

    if (!clean) {
      return res.status(400).json({ error: 'Username diperlukan' });
    }

    // 1. Direct email provided
    if (clean.includes('@')) {
      return res.json({ email: clean, candidates: [clean] });
    }

    const candidates: string[] = [];

    // 2. Teacher specific mappings (e.g. Salim Arsad)
    if (clean === 'salim' || clean === 'salimarsad' || clean === 'salimarsad17') {
      candidates.push('salimarsad17@gmail.com');
      candidates.push('salim@pai-inovatif.sch.id');
      candidates.push('salim@gmail.com');
    }

    // 3. Student specific mappings (NIS)
    if (role === 'siswa' || /^\d+$/.test(clean) || clean.startsWith('siswa_')) {
      const nis = clean.replace(/^siswa_/, '');
      candidates.push(`siswa_${nis}@pai-inovatif.sch.id`);
      candidates.push(`${nis}@pai-inovatif.sch.id`);
    }

    // 4. Default school domain
    candidates.push(`${clean}@pai-inovatif.sch.id`);
    candidates.push(`${clean}@gmail.com`);

    return res.json({
      primaryEmail: candidates[0],
      candidates: Array.from(new Set(candidates)),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Helper: Build structured prompt for Kurikulum Merdeka PAI SMP
function buildPAIPrompt(params: {
  topic: string;
  subTopic?: string;
  gradeLevel: number;
  semester: string;
  type: string;
  customPrompt?: string;
}) {
  const { topic, subTopic = '', gradeLevel, semester, type, customPrompt = '' } = params;

  const systemInstruction = `Anda adalah Guru Ahli & Pakar Kurikulum Pendidikan Agama Islam (PAI) dan Budi Pekerti untuk jenjang SMP (Fase D: Kelas 7, 8, dan 9) di Indonesia, yang bertugas di UPT SMPN 2 Rebang Tangkas, Kabupaten Way Kanan, Lampung.

TUGAS UTAMA:
Menghasilkan bahan ajar yang CEPAT, TEPAT, MENDALAM, EDUKATIF, dan LENGKAP tanpa terpotong untuk guru dan peserta didik SMP.

PRINSIP KUALITAS & KEBERSIHAN FORMAT:
1. DISIPLIN MATERI (TIDAK BOLEH KELUAR DARI MATERI): Fokus 100% pada topik dan submateri yang diminta. DILARANG KERAS menyimpang atau melebar ke bab/topik lain di luar kurikulum yang ditentukan. Seluruh dalil naqli, teori, studi kasus, LKPD, dan soal asesmen harus murni berakar pada materi dan submateri yang ditentukan.
2. WAJIB PATUHI INSTRUKSI GURU: Jika guru memberikan instruksi khusus, instruksi tersebut memiliki prioritas tertinggi dan WAJIB diwujudkan secara nyata dalam konten.
3. KESESUAIAN TINGKAT SISWA: Materi ditujukan untuk remaja SMP (usia 12-15 tahun) dengan bahasa komunikatif, santun, inspiratif, dan menumbuhkan karakter Profil Pelajar Pancasila (Beriman, Mandiri, Bernalar Kritis, Bergotong Royong, Berkebhinekaan Global, Kreatif).
4. VALIDITAS & KEJELASAN DALIL NAQLI: Teks Al-Qur'an dan Hadis wajib mencantumkan tulisan Arab berharakat lengkap dan benar (rasm Utsmani), dipisahkan dalam baris mandiri agar tidak tercampur huruf latin, dilengkapi transliterasi Latin yang presisi, terjemahan resmi Kemenag RI, serta intisari kandungan/asbabun nuzul singkat.
5. FORMAT OUTPUT BERSIH & RAPI: Langsung berikan bahan ajar dalam format Markdown rapi dan terstruktur (#, ##, ###, bullet points, tabel rapi dengan kolom sejajar, quote block untuk dalil). JANGAN sertakan kalimat pembuka basa-basi ("Tentu, ini materi...", "Halo rekan guru...") dan JANGAN sertakan penutup basa-basi. Mulailah langsung dari Judul Materi.`;

  let promptDetail = '';
  switch (type) {
    case 'summary':
      promptDetail = `Susunlah RINGKASAN MATERI ESENSIAL Kurikulum Merdeka PAI SMP yang padat, berbobot, dan mudah dihafal/dipahami:
1. PETA KONSEP & KATA KUNCI UTAMA
2. DALIL NAQLI KUNCI (Teks Arab berharakat, Latin, dan Terjemahan)
3. 5-7 POIN INTISARI MATERI & SUBMATERI secara jelas dan terperinci
4. TABEL RANGKUMAN / PERBANDINGAN KONSEP
5. REFLEKSI HIKMAH & AMALAN PRAKTIS HARIAN SISWA`;
      break;

    case 'practice':
      promptDetail = `Susunlah PAKET SOAL LATIHAN PEMAHAMAN LENGKAP berisi 10 soal siap pakai:
- Bagian A: 5 Soal Pilihan Ganda Berstandar HOTS (C4-C6) dengan 4 opsi (A, B, C, D)
- Bagian B: 5 Soal Isian / Uraian Pemahaman Konseptual & Penerapan Nyata
- KUNCI JAWABAN LENGKAP untuk seluruh soal Bagian A dan Bagian B
- PEMBAHASAN MENDALAM untuk setiap nomor soal
- PEDOMAN PENSKORAN & RUBRIK PENILAIAN`;
      break;

    case 'hots':
      promptDetail = `Susunlah 3 SOAL & STUDI KASUS HOTS (Higher Order Thinking Skills - Analisis, Evaluasi, Kreasi) kontekstual kehidupan remaja SMP masa kini (sekolah, keluarga, pertemanan, dan media sosial):
- Tiap studi kasus memuat:
  1. Narasi Stimulus Kontekstual yang realistis
  2. Pertanyaan Analisis Kritis Berbobot
  3. Kunci Jawaban / Rekomendasi Solusi Islami
  4. Indikator Ketercapaian Pembelajaran & Rubrik Penilaian Terukur`;
      break;

    case 'lkpd':
      promptDetail = `Susunlah LEMBAR KERJA PESERTA DIDIK (LKPD) KURIKULUM MERDEKA yang siap cetak dan dipakai di kelas:
1. IDENTITAS LKPD (Mata Pelajaran, Kelas, Semester, Alokasi Waktu, Kelompok/Nama Siswa)
2. CAPAIAN PEMBELAJARAN & TUJUAN KEGIATAN
3. PETUNJUK KERJA PESERTA DIDIK
4. STIMULUS MASALAH / KASUS ISLAMI
5. LANGKAH-LANGKAH AKTIVITAS DISKUSI & INVESTIGASI KELOMPOK
6. LEMBAR PENGAMATAN & JAWABAN SISWA
7. PERTANYAAN REFLEKSI DIRI
8. RUBRIK ASESMEN KINERJA KELOMPOK`;
      break;

    case 'crossword':
      promptDetail = `Susunlah TEKA-TEKI SILANG (TTS) PAI & BUDI PEKERTI KURIKULUM MERDEKA YANG PAS UNTUK 1 LEMBAR KERJA SISWA A4:
PENTING: Pilih 8 sampai 10 kata kunci istilah PAI (panjang 3-10 huruf) yang saling berpotongan murni dari materi dan submateri yang diminta (5 Soal Mendatar dan 3-5 Soal Menurun).

WAJIB sertakan blok data terstruktur pada bagian awal dalam format \`\`\`crossword-data
{
  "title": "Teka-Teki Silang PAI: [Judul Bab]",
  "items": [
    { "number": 1, "direction": "across", "answer": "KATA1", "clue": "Petunjuk soal mendatar nomor 1..." },
    { "number": 2, "direction": "down", "answer": "KATA2", "clue": "Petunjuk soal menurun nomor 2..." }
  ]
}
\`\`\`

Lalu di bawahnya tuliskan naskah teks lengkap yang rapi dan teratur:
# LEMBAR KERJA PESERTA DIDIK (LKPD) - TEKA-TEKI SILANG PAI
## PETUNJUK PENGERJAAN
Isilah kotak-kotak teka-teki silang mendatar dan menurun dengan huruf kapital yang tepat!

## PERTANYAAN MENDATAR (ACROSS)
1. [Petunjuk soal...] ([jumlah] huruf)
...

## PERTANYAAN MENURUN (DOWN)
2. [Petunjuk soal...] ([jumlah] huruf)
...

## KUNCI JAWABAN & PENJELASAN KONSEP (PEGANGAN GURU)
Sertakan daftar kata jawaban lengkap beserta hikmah/penjelasan ringkas konsepnya.`;
      break;

    case 'quiz':
      promptDetail = `Susunlah 10 SOAL KUIS CBT PILIHAN GANDA (A, B, C, D) siap pakai untuk asesmen formatif/sumatif:
- Soal disusun bergradasi dari LOTS hingga HOTS
- Setiap nomor memiliki 4 pilihan jawaban yang masuk akal dan terdistribusi merata
- KUNCI JAWABAN BENAR yang ditandai dengan jelas
- PEMBAHASAN SINGKAT DAN TEPAT untuk setiap nomor soal`;
      break;

    case 'educational_game':
      promptDetail = `Rancanglah sebuah MODUL PERMAINAN EDUKATIF ISLAMI INTERAKTIF untuk kelas:
1. NAMA PERMAINAN & TOPIK
2. TUJUAN PEMBELAJARAN & PROFIL PELAJAR PANCASILA
3. ALAT & BAHAN SEDERHANA (Mudah didapat di kelas SMP)
4. ATURAN & LANGKAH-LANGKAH PERMAINAN (Babak pembuka, babak inti, dan babak final)
5. CONTOH KARTU SOAL / TANTANGAN / STUDI KASUS GAME
6. SISTEM SKOR & PENGHARGAAN
7. HIKMAH & REFLEKSI PEMBELAJARAN BERSAMA`;
      break;

    case 'video_recs':
      promptDetail = `Susunlah PANDUAN MEDIA VIDEO PEMBELAJARAN & LEMBAR DISKUSI:
1. 3 REKOMENDASI TEMA VIDEO YOUTUBE EDUKATIF yang relevan
2. KATA KUNCI PENCARIAN TEPAT di YouTube
3. PANDUAN MENONTON (Apa yang harus diamati siswa selama video berputar)
4. LEMBAR DISKUSI KELAS (5 Pertanyaan Kritis pasca-menonton video)
5. KESIMPULAN & TUGAS TINDAK LANJUT SISWA`;
      break;

    default:
      promptDetail = `Susunlah MODUL BAHAN AJAR LENGKAP & KOMPREHENSIF Kurikulum Merdeka PAI dan Budi Pekerti:
1. IDENTITAS MODUL & CAPAIAN PEMBELAJARAN (Fase D, Elemen PAI, Alokasi Waktu, 3 Tujuan Pembelajaran ABCD, KKTP, Profil Pelajar Pancasila)
2. LANDASAN DALIL NAQLI AL-QUR'AN & HADIS (Teks Arab berharakat jelas, transliterasi Latin, terjemahan resmi Kemenag RI, serta asbabun nuzul/kandungan hukum)
3. PETA KONSEP & PEMBAHASAN SUBMATERI MENDALAM (Uraian konsep secara runut, analogi yang relevan dengan remaja SMP, tabel komparasi atau bagan konsep)
4. KISAH HIKMAH & STUDI KASUS KONTEKSTUAL (Situasi dilema etika nyata anak SMP masa kini dan jalan keluar secara Islam)
5. LEMBAR KERJA PESERTA DIDIK (LKPD) MINI (Petunjuk kegiatan kelompok aktif)
6. ASESMEN & EVALUASI PEMBELAJARAN:
   - 5 Soal Pilihan Ganda HOTS (A, B, C, D)
   - 3 Soal Uraian Berbobot
   - Kunci Jawaban Lengkap dan Pembahasan Terperinci
   - Rubrik Pedoman Penskoran
7. GLOSARIUM KATA SULIT & KATA MUTIARA INSPIRATIF`;
  }

  const prompt = `Mata Pelajaran: Pendidikan Agama Islam dan Budi Pekerti (PAI & BP)
Satuan Pendidikan: SMP (Sekolah Menengah Pertama) / UPT SMPN 2 Rebang Tangkas
Fase / Kelas: Fase D / Kelas ${gradeLevel} SMP
Semester: Semester ${semester}
Materi Pokok / Bab: "${topic}"
Submateri / Fokus Utama: "${subTopic || topic}"

${
  customPrompt
    ? `[INSTRUKSI KHUSUS GURU PAI - PRIORITAS UTAMA WAJIB DITERAPKAN]:
"${customPrompt}"
Pastikan seluruh permintaan pada instruksi guru di atas diterapkan secara nyata ke dalam materi yang disusun.`
    : ''
}

TUGAS SPESIFIK:
${promptDetail}

PETUNJUK FORMAT & TATA LETAK:
- Tuliskan langsung dokumen materi dalam format Markdown tanpa pendahuluan atau penutup basa-basi.
- Gunakan struktur heading jelas (# Judul Utama, ## Bagian/Bab, ### Sub-bagian).
- Tuliskan teks ayat Al-Qur'an dan Hadis dalam aksara Arab berharakat rapi (rasm Utsmani) pada baris/blok tersendiri agar terbaca jelas dan indah.
- Sajikan tabel perbandingan/rangkuman dalam format tabel Markdown standar dengan garis batas (| Kolom 1 | Kolom 2 |).
- Pastikan materi 100% tuntas, padat, mendalam, dan tidak melenceng dari materi atau submateri yang ditentukan.`;

  return { systemInstruction, prompt };
}

// Endpoint: AI Generate Teaching Material (Standard JSON)
app.post('/api/ai/generate', async (req: Request, res: Response) => {
  try {
    if (!ai) {
      return res.status(400).json({
        error:
          'GEMINI_API_KEY belum dikonfigurasi di server environment. Silakan tambahkan GEMINI_API_KEY di panel Secrets atau .env.',
      });
    }

    const {
      topic,
      subTopic = '',
      gradeLevel = 7,
      semester = 'Ganjil',
      type = 'full',
      customPrompt = '',
    } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topik pembelajaran wajib diisi.' });
    }

    const { systemInstruction, prompt } = buildPAIPrompt({
      topic,
      subTopic,
      gradeLevel: Number(gradeLevel),
      semester,
      type,
      customPrompt,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    const generatedText = response.text || '';

    return res.json({
      success: true,
      topic,
      subTopic,
      gradeLevel,
      semester,
      type,
      content: generatedText,
    });
  } catch (error: any) {
    console.error('Gemini API generation error:', error);
    return res.status(500).json({
      error: error.message || 'Gagal menghasilkan materi dengan AI.',
    });
  }
});

// Endpoint: AI Generate Teaching Material (Fast Streaming SSE)
app.post('/api/ai/generate-stream', async (req: Request, res: Response) => {
  try {
    if (!ai) {
      return res.status(400).json({
        error: 'GEMINI_API_KEY belum dikonfigurasi di server environment.',
      });
    }

    const {
      topic,
      subTopic = '',
      gradeLevel = 7,
      semester = 'Ganjil',
      type = 'full',
      customPrompt = '',
    } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topik pembelajaran wajib diisi.' });
    }

    const { systemInstruction, prompt } = buildPAIPrompt({
      topic,
      subTopic,
      gradeLevel: Number(gradeLevel),
      semester,
      type,
      customPrompt,
    });

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    const streamResponse = await ai.models.generateContentStream({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    for await (const chunk of streamResponse) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Gemini Stream Error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: error.message || 'Gagal menghasilkan materi dengan streaming.' });
    }
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// Setup Vite middlewares or static files
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  const publicPath = path.resolve(__dirname, 'public');
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
  }

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PAI INOVATIF Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
