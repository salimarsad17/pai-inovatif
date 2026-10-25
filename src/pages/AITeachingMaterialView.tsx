import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  BookOpen,
  Save,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  Printer,
  HelpCircle,
  RefreshCw,
  FileQuestion,
  GraduationCap,
  Puzzle,
  Gamepad2,
  Video,
  ListFilter,
  Check,
  StopCircle,
  FileText,
  Eye,
  EyeOff,
  Edit3,
  Layers,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Bookmark,
} from 'lucide-react';
import { aiService, AIGenerateRequest } from '../services/aiService';
import { dataService } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import { ClassItem } from '../types';
import {
  extractCrosswordData,
  buildCrosswordLayout,
  generateCrosswordSinglePageHtml,
  CrosswordLayout,
} from '../utils/crosswordEngine';

// Curated Kurikulum Merdeka PAI SMP Fase D Presets
interface CurriculumChapter {
  id: string;
  chapterNumber: number;
  title: string;
  topic: string;
  subTopics: string[];
}

const PAI_CURRICULUM_PRESETS: Record<number, Record<'Ganjil' | 'Genap', CurriculumChapter[]>> = {
  7: {
    Ganjil: [
      {
        id: '7-1',
        chapterNumber: 1,
        title: "Bab 1: Membaca, Menghafal, Menulis, & Menjelaskan Ayat Al-Qur'an tentang Pentingnya Iman (QS. An-Nisa: 136 & QS. Al-Anfal: 2-4)",
        topic: "Pentingnya Iman dalam QS. An-Nisa: 136 dan QS. Al-Anfal: 2-4 serta Kaidah Tajwid Hukum Alif Lam",
        subTopics: [
          "Membaca, Menghafal, dan Menulis QS. An-Nisa ayat 136",
          "Membaca, Menghafal, dan Menulis QS. Al-Anfal ayat 2-4",
          "Kaidah Tajwid: Hukum Bacaan Alif Lam Syamsiyah dan Alif Lam Qamariyah",
          "Penjelasan Kandungan Ayat tentang Pentingnya Rukun Iman",
          "Ciri-Ciri Karakter Orang Beriman Berdasarkan QS. Al-Anfal: 2-4",
        ],
      },
      {
        id: '7-2',
        chapterNumber: 2,
        title: "Bab 2: Meyakini dan Merefleksikan Iman kepada Allah SWT Melalui Sifat dan Asmaul Husna (Al-Alim, As-Sami', Al-Basir, Al-Khabir)",
        topic: "Meyakini dan Merefleksikan Iman kepada Allah SWT Melalui Sifat dan Asmaul Husna (Al-Alim, As-Sami', Al-Basir, Al-Khabir)",
        subTopics: [
          "Makna & Penghayatan Asmaul Husna Al-Alim (Maha Mengetahui)",
          "Makna & Penghayatan Asmaul Husna As-Sami' (Maha Mendengar)",
          "Makna & Penghayatan Asmaul Husna Al-Basir (Maha Melihat)",
          "Makna & Penghayatan Asmaul Husna Al-Khabir (Maha Teliti/Waspada)",
          "Refleksi Perilaku Mawas Diri, Kejujuran Ujian, dan Takwa dalam Keseharian Siswa",
        ],
      },
      {
        id: '7-3',
        chapterNumber: 3,
        title: "Bab 3: Menerapkan Makna Ikhlas dalam Kehidupan Sehari-hari",
        topic: "Menerapkan Makna Ikhlas dalam Kehidupan Sehari-hari",
        subTopics: [
          "Pengertian & Hakikat Ikhlas Menurut Syariat Islam",
          "Dalil Naqli Al-Qur'an & Hadis tentang Perintah Beramal Ikhlas",
          "Tingkatan Ikhlas dalam Beribadah dan Berbuat Kebaikan",
          "Bahaya Penyakit Hati: Riya, Sum'ah, dan Nifaq",
          "Penerapan Sikap Ikhlas dalam Belajar, Membantu Orang Tua, dan Berteman di Sekolah",
        ],
      },
      {
        id: '7-4',
        chapterNumber: 4,
        title: "Bab 4: Menerapkan Ketentuan Macam-Macam Sujud di Luar Rukun Shalat",
        topic: "Menerapkan Ketentuan Macam-Macam Sujud di Luar Rukun Shalat",
        subTopics: [
          "Ketentuan, Sebab, Tata Cara, & Doa Sujud Syukur atas Nikmat Allah",
          "Ketentuan, Sebab, Tata Cara, & Doa Sujud Sahwi Saat Lupa/Ragu Bilangan Rakaat",
          "Ketentuan, Sebab, Tata Cara, & Doa Sujud Tilawah Saat Membaca/Mendengar Ayat Sajdah",
          "Perbedaan Sujud Syukur, Sujud Sahwi, dan Sujud Tilawah",
          "Hikmah Ketundukan Hati, Menghindari Kesombongan, dan Rasa Syukur",
        ],
      },
      {
        id: '7-5',
        chapterNumber: 5,
        title: "Bab 5: Merefleksikan Sejarah dan Peran Kekhalifahan Islam Paska Khulafaur Rasyidin Bani Umayah Periode Damaskus",
        topic: "Sejarah dan Peran Kekhalifahan Islam Paska Khulafaur Rasyidin Bani Umayah Periode Damaskus",
        subTopics: [
          "Sejarah Berdirinya Bani Umayah Periode Damaskus oleh Muawiyah bin Abu Sufyan",
          "Keteladanan dan Prestasi Khalifah Shalih Umar bin Abdul Aziz",
          "Kemajuan Peradaban: Ilmu Pengetahuan, Administrasi Pemerintahan, dan Arsitektur",
          "Faktor-Faktor Kejayaan dan Sebab Runtuhnya Bani Umayah di Damaskus",
          "Refleksi Nilai Kepemimpinan dan Keteladanan Sejarah bagi Generasi Muslim",
        ],
      },
    ],
    Genap: [
      {
        id: '7-6',
        chapterNumber: 1,
        title: "Bab 1: Membaca, Menghafal, Menulis, & Menjelaskan Ayat Al-Qur'an tentang Taqwa (QS. Al-Baqarah: 103 & Ali 'Imran: 76)",
        topic: "Ayat Al-Qur'an tentang Taqwa dalam QS. Al-Baqarah: 103 dan Ali 'Imran: 76 serta Kaidah Tajwid Ghunnah",
        subTopics: [
          "Membaca, Menghafal, dan Menulis QS. Al-Baqarah ayat 103",
          "Membaca, Menghafal, dan Menulis QS. Ali 'Imran ayat 76",
          "Kaidah Tajwid: Hukum Bacaan Ghunnah Musyaddadah (Nun & Mim Bertasydid)",
          "Hadis Terkait Keutamaan dan Karakter Orang yang Bertaqwa",
          "Kandungan Makna Menepati Janji dan Integritas Ketaqwaan dalam Kehidupan",
        ],
      },
      {
        id: '7-7',
        chapterNumber: 2,
        title: "Bab 2: Meyakini dan Merefleksikan Iman kepada Malaikat Allah SWT",
        topic: "Meyakini dan Merefleksikan Iman kepada Malaikat-Malaikat Allah SWT",
        subTopics: [
          "Hakikat & Dalil Naqli Kewajiban Beriman kepada Malaikat Allah SWT",
          "Mengenal 10 Malaikat Allah Beserta Tugas-Tugasnya",
          "Perbedaan Sifat Hakiki Malaikat, Jin/Iblis, dan Manusia",
          "Dampak Keimanan kepada Malaikat terhadap Sikap Muraqabah (Senantiasa Merasa Diawasi)",
          "Penerapan Kejujuran dan Disiplin Siswa Melalui Kesadaran Pencatatan Amal Baik dan Buruk",
        ],
      },
      {
        id: '7-8',
        chapterNumber: 3,
        title: "Bab 3: Menerapkan Makna Bersyukur kepada Allah SWT",
        topic: "Menerapkan Makna Bersyukur kepada Allah SWT",
        subTopics: [
          "Hakikat dan Keutamaan Bersyukur Berdasarkan Al-Qur'an dan Hadis Nabi SAW",
          "Tiga Pilar Syukur: Syukur dengan Hati (Tasdiq), Lisan (Tahmid), dan Perbuatan (Amal Shalih)",
          "Bahaya Kufur Nikmat dan Dampak Kerugiannya (QS. Ibrahim: 7)",
          "Praktik Nyata Bersyukur: Merawat Tubuh, Berbagi dengan Dhuafa, dan Mengembangkan Potensi",
          "Refleksi Menumbuhkan Rasa Cukup (Qana'ah) di Era Media Sosial",
        ],
      },
      {
        id: '7-9',
        chapterNumber: 4,
        title: "Bab 4: Menerapkan Ketentuan Rukhsah dalam Ibadah",
        topic: "Menerapkan Ketentuan Rukhsah dalam Ibadah",
        subTopics: [
          "Konsep dan Prinsip Rukhsah (Keringanan) dalam Syariat Islam: Kemudahan Tanpa Meremehkan",
          "Ketentuan dan Tata Cara Salat Jamak (Taqdim & Takhir) dan Salat Qashar bagi Musafir",
          "Rukhsah Puasa Ramadhan bagi Orang Sakit, Lansia, Musafir, Ibu Hamil & Menyusui",
          "Rukhsah Bersuci dengan Tayamum Saat Ketiadaan Air atau Sakit",
          "Hikmah Kasih Sayang Allah SWT dalam Memberikan Keringanan Ibadah",
        ],
      },
      {
        id: '7-10',
        chapterNumber: 5,
        title: "Bab 5: Merefleksikan Diri terhadap Sejarah dan Peran Kekhalifahan Islam Paska Khulafaur Rasyidin Bani Umayah Periode Andalusia",
        topic: "Sejarah dan Peran Kekhalifahan Islam Paska Khulafaur Rasyidin Bani Umayah Periode Andalusia",
        subTopics: [
          "Sejarah Masuknya Islam ke Andalusia (Spanyol) oleh Thariq bin Ziyad dan Abdurrahman Ad-Dakhil",
          "Kejayaan Kota Cordoba dan Granada sebagai Mercusuar Sains, Filsafat, dan Seni Eropa",
          "Pusat-Pusat Perpustakaan, Baitul Hikmah Andalusia, dan Universitas Kedokteran Termasyhur",
          "Harmoni dan Toleransi Tiga Umat Beragama (Islam, Kristen, Yahudi) di Andalusia",
          "Ibrah dan Refleksi: Faktor Kegemilangan serta Sebab Kemunduran Islam di Andalusia",
        ],
      },
    ],
  },
  8: {
    Ganjil: [
      {
        id: '8-1',
        chapterNumber: 1,
        title: "Bab 1: Inspirasi Al-Qur'an: Melestarikan Alam",
        topic: "Melestarikan Alam Menurut Pandangan Al-Qur'an",
        subTopics: [
          'Kandungan QS Ar-Rum/30: 41 (Kerusakan Akibat Ulah Manusia)',
          'Kandungan QS Ibrahim/14: 32 dan QS Az-Zukhruf/43: 13',
          'Hukum Bacaan Ra (Tafkhim & Tarqiq) dan Lam Jalalah',
          'Perilaku Hidup Bersih & Hemat Energi Siswa',
        ],
      },
      {
        id: '8-2',
        chapterNumber: 2,
        title: 'Bab 2: Meyakini Kitab-Kitab Allah: Generasi Pecinta Al-Qur’an',
        topic: 'Iman kepada Kitab-Kitab Allah SWT',
        subTopics: [
          'Taurat, Zabur, Injil, dan Al-Qur’an sebagai Penyempurna',
          'Fungsi Al-Qur’an sebagai Al-Huda, Al-Furqan, dan Asy-Syifa',
          'Adab Membaca, Mentadaburi, dan Menghafal Al-Qur’an',
        ],
      },
      {
        id: '8-3',
        chapterNumber: 3,
        title: 'Bab 3: Menjadi Pribadi Berintegritas dengan Amanah dan Jujur',
        topic: 'Integritas Diri Melalui Sifat Amanah dan Jujur',
        subTopics: [
          'Kandungan QS Al-Anfal/8: 27 dan Hadis Kejujuran Menuju Surga',
          'Bentuk-bentuk Amanah terhadap Allah, Sesama, dan Diri Sendiri',
          'Menolak Perilaku Curang dan Plagiarisme',
        ],
      },
      {
        id: '8-4',
        chapterNumber: 4,
        title: 'Bab 4: Ibadah dengan Penuh Harap kepada Allah SWT',
        topic: 'Salat Gerhana, Shalat Istisqa, dan Shalat Jenazah',
        subTopics: [
          'Tata Cara Salat Kusuf (Gerhana Matahari) & Khusuf (Bulan)',
          'Pelaksanaan Shalat Istisqa (Memohon Turunnya Hujan)',
          'Tata Cara & Doa Salat Jenazah',
          'Hikmah Mengingat Kematian dan Kebesaran Ilahi',
        ],
      },
      {
        id: '8-5',
        chapterNumber: 5,
        title: 'Bab 5: Semangat Literasi dan Ilmu Cendekiawan Abbasiyah',
        topic: 'Kejayaan Sains Islam Masa Daulah Abbasiyah',
        subTopics: [
          'Peran Baitul Hikmah Baghdad sebagai Pusat Riset Dunia',
          'Kontribusi Ibnu Sina (Kedokteran) dan Al-Khawarizmi (Aljabar)',
          'Meneladani Semangat Membaca dan Meneliti bagi Remaja',
        ],
      },
    ],
    Genap: [
      {
        id: '8-6',
        chapterNumber: 6,
        title: "Bab 6: Inspirasi Al-Qur'an: Indahnya Toleransi & Keberagaman",
        topic: 'Toleransi dan Keberagaman dalam Bingkai Islam',
        subTopics: [
          'Kandungan QS Al-Hujurat/49: 13 tentang Keragaman Suku Bangsa',
          'Konsep Tasamuh dan Batasan Toleransi Beragama',
          'Sikap Menghormati Perbedaan di Lingkungan Sekolah',
        ],
      },
      {
        id: '8-7',
        chapterNumber: 7,
        title: 'Bab 7: Meneladani Sifat-Sifat Mulia Para Rasul Allah',
        topic: 'Iman kepada Rasul-Rasul Allah SWT',
        subTopics: [
          '4 Sifat Wajib Rasul: Siddiq, Amanah, Tabligh, Fathanah',
          'Kisah Ketabahan 5 Rasul Ulul Azmi',
          'Meneladani Keteguhan Akhlak Rasulullah SAW di Era Modern',
        ],
      },
      {
        id: '8-8',
        chapterNumber: 8,
        title: 'Bab 8: Menghindari Perilaku Mencontek dan Curang',
        topic: 'Membangun Budaya Jujur dan Bersih dari Kecurangan',
        subTopics: [
          'Dampak Negatif Mencontek bagi Masa Depan',
          'Bahaya Miras, Judi Online, dan Tawuran Pelajar',
          'Solusi Islam Mengatasi Tekanan Sosial Remaja',
        ],
      },
      {
        id: '8-9',
        chapterNumber: 9,
        title: 'Bab 9: Ketentuan Jual Beli dan Khiyar dalam Fiqih Islam',
        topic: 'Fiqih Muamalah: Jual Beli Halal dan Hak Khiyar',
        subTopics: [
          'Rukun dan Syarat Sah Jual Beli',
          'Macam-macam Khiyar (Majlis, Syarat, Aib) untuk Keadilan',
          'Bahaya Praktik Riba dan Penipuan Transaksi Online',
        ],
      },
      {
        id: '8-10',
        chapterNumber: 10,
        title: 'Bab 10: Peradaban Islam Masa Daulah Umayyah di Andalusia',
        topic: 'Kemajuan Peradaban Islam di Spanyol (Cordoba & Granada)',
        subTopics: [
          'Masuknya Islam ke Andalusia oleh Thariq bin Ziyad',
          'Cordoba sebagai Pusat Ilmu Pengetahuan Eropa',
          'Toleransi Tiga Agama (Islam, Kristen, Yahudi) di Andalusia',
        ],
      },
    ],
  },
  9: {
    Ganjil: [
      {
        id: '9-1',
        chapterNumber: 1,
        title: 'Bab 1: Meraih Ketenangan Hidup dengan Meyakini Hari Akhir',
        topic: 'Iman kepada Hari Akhir (Kiamat)',
        subTopics: [
          'Tanda-tanda Kiamat Sugra dan Kiamat Kubra',
          'Tahapan Hari Akhir: Yaumul Ba’ats hingga Surga dan Neraka',
          'Dampak Keimanan Hari Akhir terhadap Semangat Berbuat Kebaikan',
        ],
      },
      {
        id: '9-2',
        chapterNumber: 2,
        title: 'Bab 2: Menatap Masa Depan dengan Optimis, Ikhtiar, Tawakal',
        topic: 'Sikap Optimis, Ikhtiar, dan Tawakal dalam Meraih Cita-cita',
        subTopics: [
          'Kandungan QS Az-Zumar/39: 53 (Jangan Berputus Asa)',
          'Kandungan QS An-Najm/53: 39-42 dan QS Ali Imran/3: 159',
          'Hukum Bacaan Tajwid Qalqalah (Sugra & Kubra)',
          'Membangun Resiliensi Mental Remaja Muslim',
        ],
      },
      {
        id: '9-3',
        chapterNumber: 3,
        title: 'Bab 3: Menggapai Berkah dengan Menghormati Orang Tua dan Guru',
        topic: 'Berbakti kepada Orang Tua (Birrul Walidain) dan Menghormati Guru',
        subTopics: [
          'Kandungan QS Al-Isra/17: 23-24 tentang Larangan Berkata Kasar',
          'Hadis Keutamaan Ridha Orang Tua Menentukan Ridha Allah',
          'Adab Berkomunikasi dan Menghormati Guru di Sekolah',
        ],
      },
      {
        id: '9-4',
        chapterNumber: 4,
        title: 'Bab 4: Zakat, Infak, Sedekah, dan Wakaf untuk Umat',
        topic: 'Pemberdayaan Umat Melalui Zakat Mal, Infak, dan Wakaf',
        subTopics: [
          'Perbedaan Zakat Fitrah dan Zakat Mal (Nisab & Haul)',
          '8 Golongan Mustahik Zakat (QS At-Taubah: 60)',
          'Peran Wakaf Produktif dalam Mengentaskan Kemiskinan',
        ],
      },
      {
        id: '9-5',
        chapterNumber: 5,
        title: 'Bab 5: Sejarah dan Jalur Masuknya Islam di Nusantara',
        topic: 'Sejarah Masuk dan Berkembangnya Islam di Indonesia',
        subTopics: [
          'Teori Masuknya Islam: Gujarat, Mekkah, dan Persia',
          'Peran Strategis Wali Songo dalam Dakwah Kultural Santun',
          'Kerajaan Samudera Pasai, Demak, dan Mataram Islam',
        ],
      },
    ],
    Genap: [
      {
        id: '9-6',
        chapterNumber: 6,
        title: 'Bab 6: Meneguhkan Iman Melalui Qada dan Qadar',
        topic: 'Iman kepada Qada dan Qadar Allah SWT',
        subTopics: [
          'Pengertian Qada dan Qadar Menurut Bahasa dan Istilah',
          'Perbedaan Takdir Mu’allaq (Dapat Diikhtiarkan) dan Takdir Mubram',
          'Sikap Tawakal Positif dan Menghilangkan Sikap Fatalisme',
        ],
      },
      {
        id: '9-7',
        chapterNumber: 7,
        title: 'Bab 7: Membangun Harmoni Sosial dengan Sikap Toleransi',
        topic: 'Moderasi Beragama (Wasathiyah) dan Kerukunan Bangsa',
        subTopics: [
          'Prinsip Wasathiyah: Tawazun, I’tidal, dan Tasamuh',
          'Implementasi Sikap Toleransi di Lingkungan Masyarakat Majemuk',
          'Menangkal Paham Radikalisme dan Ekstremisme di Kalangan Remaja',
        ],
      },
      {
        id: '9-8',
        chapterNumber: 8,
        title: 'Bab 8: Fiqih Penyembelihan Hewan, Qurban, dan Aqiqah',
        topic: 'Penyembelihan Hewan, Ibadah Qurban, dan Syariat Aqiqah',
        subTopics: [
          'Syarat & Rukun Menyembelih Hewan Sesuai Syariat Islam',
          'Ketentuan & Waktu Penyembelihan Hewan Qurban (Idul Adha & Tasyrik)',
          'Ketentuan Ibadah Aqiqah bagi Anak Laki-laki dan Perempuan',
          'Hikmah Kepedulian Sosial Berbagi Daging Qurban',
        ],
      },
      {
        id: '9-9',
        chapterNumber: 9,
        title: 'Bab 9: Kearifan Lokal dan Tradisi Islam di Nusantara',
        topic: 'Akulturasi Budaya dan Tradisi Islam di Nusantara',
        subTopics: [
          'Tradisi Sekaten, Grebeg Mulud, Halalbihalal, dan Tahlilan',
          'Menyikapi Tradisi Lokal dengan Kaidah Fiqih Al-Adah Muhakkamah',
          'Melestarikan Seni Budaya Islam Bernuansa Positif',
        ],
      },
      {
        id: '9-10',
        chapterNumber: 10,
        title: 'Bab 10: Perjuangan Tokoh Islam Mempertahankan NKRI',
        topic: 'Peran Ulama dan Tokoh Islam dalam Kemerdekaan Indonesia',
        subTopics: [
          'Peran KH Hasyim Asy’ari, KH Ahmad Dahlan, dan Tokoh Pejuang',
          'Makna Resolusi Jihad 22 Oktober bagi Kedaulatan Bangsa',
          'Menumbuhkan Jiwa Nasionalisme Religius pada Generasi Z',
        ],
      },
    ],
  },
};

const TEACHER_INSTRUCTION_SUGGESTIONS = [
  '🏫 Sertakan studi kasus kontekstual kehidupan siswa UPT SMPN 2 Rebang Tangkas / Way Kanan',
  '📖 Berikan analisis hukum bacaan tajwid yang mendalam dan mudah dipahami',
  '💡 Tambahkan ice breaking islami, yel-yel motivasi, dan tepuk semangat',
  '🤝 Gunakan bahasa komunikatif santun khas pergaulan anak SMP',
  '📊 Sertakan tabel perbandingan konsep dan rangkuman hikmah',
  '🎯 Buat soal HOTS berbobot analisis kritis (C4-C6)',
];

export const AITeachingMaterialView: React.FC = () => {
  const { profile } = useAuth();

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [gradeLevel, setGradeLevel] = useState<number>(7);
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');
  const [topic, setTopic] = useState('');
  const [subTopic, setSubTopic] = useState('');
  const [generateType, setGenerateType] = useState<AIGenerateRequest['type']>('full');
  const [customInstructions, setCustomInstructions] = useState('');
  const [targetClassId, setTargetClassId] = useState<string>('');

  const [aiStatus, setAiStatus] = useState<{ hasKey: boolean; model: string }>({
    hasKey: true,
    model: 'gemini-3.8-flash',
  });
  const [loading, setLoading] = useState(false);
  const [streamingStatus, setStreamingStatus] = useState<string>('');
  const [generatedResult, setGeneratedResult] = useState<string>('');
  const [editableTitle, setEditableTitle] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'editor'>('preview');
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [showCrosswordAnswers, setShowCrosswordAnswers] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Compute Crossword grid layout dynamically
  const crosswordData = React.useMemo(() => {
    if (
      generateType === 'crossword' ||
      generatedResult.includes('crossword-data') ||
      generatedResult.includes('PERTANYAAN MENDATAR') ||
      generatedResult.includes('Mendatar')
    ) {
      const data = extractCrosswordData(generatedResult);
      if (data.items.length > 0) {
        const layout = buildCrosswordLayout(data.items);
        return { data, layout };
      }
    }
    return null;
  }, [generatedResult, generateType]);

  useEffect(() => {
    async function loadData() {
      const cls = await dataService.getClasses();
      setClasses(cls);
      const status = await aiService.checkStatus();
      setAiStatus(status);
    }
    loadData();
  }, []);

  // Get current presets for grade & semester
  const availablePresets = PAI_CURRICULUM_PRESETS[gradeLevel]?.[semester] || [];
  const selectedChapter = availablePresets.find((p) => p.topic === topic);

  const handleSelectPreset = (chapter: CurriculumChapter) => {
    setTopic(chapter.topic);
    if (chapter.subTopics.length > 0) {
      setSubTopic(chapter.subTopics[0]);
    } else {
      setSubTopic('');
    }
    setEditableTitle(`Materi PAI: ${chapter.topic} (Kelas ${gradeLevel})`);
  };

  const handleAddInstructionChip = (chip: string) => {
    // Strip emoji for clean instruction
    const cleanText = chip.replace(/^[^\w\s]+/, '').trim();
    if (!customInstructions.includes(cleanText)) {
      setCustomInstructions((prev) => (prev ? `${prev}. ${cleanText}` : cleanText));
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setStatusMessage({ type: 'error', text: 'Topik materi wajib diisi atau dipilih dari kurikulum.' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    setGeneratedResult('');
    setStreamingStatus('Menginisialisasi Gemini 3.8 Flash AI...');

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const fullTopicTitle = subTopic.trim()
      ? `Modul Ajar PAI: ${topic.trim()} - Sub: ${subTopic.trim()} (Kelas ${gradeLevel} SMP)`
      : `Modul Ajar PAI: ${topic.trim()} (Kelas ${gradeLevel} SMP)`;

    setEditableTitle(fullTopicTitle);

    try {
      setStreamingStatus('Menghubungi server dan merumuskan kurikulum...');
      let wordCount = 0;

      await aiService.generateMaterialStream(
        {
          topic: topic.trim(),
          subTopic: subTopic.trim(),
          gradeLevel,
          semester,
          type: generateType,
          customPrompt: customInstructions,
        },
        (accumulated) => {
          setGeneratedResult(accumulated);
          const words = accumulated.trim().split(/\s+/).length;
          if (words !== wordCount) {
            wordCount = words;
            setStreamingStatus(`Sedang mengalirkan respon cepat: ${words} kata disusun...`);
          }
        },
        abortController.signal
      );

      setStatusMessage({
        type: 'success',
        text: 'Bahan ajar berhasil dibuat dengan cepat, tepat, dan lengkap! Anda dapat meninjau format atau langsung menyuntingnya.',
      });
      setActiveTab('preview');
    } catch (err: any) {
      console.error('AI Gen Error:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Gagal menghasilkan bahan ajar. Pastikan koneksi server berjalan normal.',
      });
    } finally {
      setLoading(false);
      setStreamingStatus('');
      abortControllerRef.current = null;
    }
  };

  const handleCancelGenerate = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
      setStreamingStatus('');
      setStatusMessage({ type: 'error', text: 'Generasi bahan ajar dihentikan oleh guru.' });
    }
  };

  const handlePublishToClass = async () => {
    if (!generatedResult || !editableTitle) {
      setStatusMessage({ type: 'error', text: 'Belum ada konten bahan ajar untuk disimpan.' });
      return;
    }

    setSaveLoading(true);
    setStatusMessage(null);

    try {
      await dataService.createTeachingMaterial({
        title: editableTitle,
        grade_level: gradeLevel,
        class_id: targetClassId || null,
        semester,
        topic,
        content: generatedResult,
        ai_generated: true,
        publication_status: 'published',
        created_by: profile?.id,
        published_at: new Date().toISOString(),
      });

      setStatusMessage({
        type: 'success',
        text: 'Bahan ajar berhasil disimpan ke Supabase database! Siswa di kelas terkait sekarang dapat langsung membacanya.',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Gagal menyimpan ke Supabase: ${err.message}`,
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedResult) return;
    navigator.clipboard.writeText(generatedResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const downloadAsMarkdown = () => {
    const blob = new Blob([generatedResult], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(editableTitle || 'bahan-ajar-pai').replace(/[^\w\s-]/gi, '')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Helper: Format inline Markdown for HTML (Bold, Italic, Code)
  function formatInlineHtml(str: string): string {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      .replace(/\*(.*?)\*/g, '<i>$1</i>')
      .replace(/`(.*?)`/g, '<code style="font-family: Consolas, monospace; background: #f1f5f9; padding: 1pt 4pt; border-radius: 3pt;">$1</code>');
  }

  // Helper: Convert Markdown to Structured HTML for Word & Print
  function parseMarkdownToStructuredHtml(md: string): string {
    if (!md) return '';
    const lines = md.split('\n');
    const out: string[] = [];
    let tableRows: string[][] = [];
    let inTable = false;
    let inUl = false;
    let inOl = false;

    const closeLists = () => {
      if (inUl) {
        out.push('</ul>');
        inUl = false;
      }
      if (inOl) {
        out.push('</ol>');
        inOl = false;
      }
    };

    const flushTable = () => {
      if (tableRows.length > 0) {
        closeLists();
        const header = tableRows[0];
        const body = tableRows.slice(1);
        let tableHtml =
          '<table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%; margin: 12pt 0; font-size: 10pt; border: 1px solid #94a3b8; page-break-inside: avoid;">';
        tableHtml += '<thead><tr style="background-color: #f1f5f9; color: #0f172a;">';
        header.forEach((h) => {
          tableHtml += `<th style="border: 1px solid #64748b; padding: 6pt 8pt; text-align: left; font-weight: bold;">${formatInlineHtml(h)}</th>`;
        });
        tableHtml += '</tr></thead><tbody>';
        body.forEach((row, idx) => {
          const bg = idx % 2 === 1 ? '#f8fafc' : '#ffffff';
          tableHtml += `<tr style="background-color: ${bg};">`;
          row.forEach((c) => {
            tableHtml += `<td style="border: 1px solid #cbd5e1; padding: 6pt 8pt; vertical-align: top;">${formatInlineHtml(c)}</td>`;
          });
          tableHtml += '</tr>';
        });
        tableHtml += '</tbody></table>';
        out.push(tableHtml);
        tableRows = [];
        inTable = false;
      }
    };

    lines.forEach((line) => {
      const trimmed = line.trim();

      // Table line
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        inTable = true;
        if (!trimmed.match(/^\|[\s\-:|]+\|$/)) {
          const cells = trimmed
            .split('|')
            .slice(1, -1)
            .map((c) => c.trim());
          tableRows.push(cells);
        }
        return;
      } else if (inTable) {
        flushTable();
      }

      if (!trimmed) {
        closeLists();
        return;
      }

      // Heading 1
      if (trimmed.startsWith('# ')) {
        closeLists();
        const title = trimmed.replace(/^#\s*/, '');
        out.push(
          `<h1 style="font-size: 15pt; color: #1e3a8a; font-weight: bold; margin-top: 18pt; margin-bottom: 6pt; border-bottom: 2pt solid #1e3a8a; padding-bottom: 4pt; page-break-after: avoid;">${formatInlineHtml(title)}</h1>`
        );
        return;
      }

      // Heading 2
      if (trimmed.startsWith('## ')) {
        closeLists();
        const title = trimmed.replace(/^##\s*/, '');
        out.push(
          `<h2 style="font-size: 12.5pt; color: #0369a1; font-weight: bold; margin-top: 14pt; margin-bottom: 4pt; border-left: 3.5pt solid #0284c7; padding-left: 6pt; page-break-after: avoid;">${formatInlineHtml(title)}</h2>`
        );
        return;
      }

      // Heading 3
      if (trimmed.startsWith('### ')) {
        closeLists();
        const title = trimmed.replace(/^###\s*/, '');
        out.push(
          `<h3 style="font-size: 11pt; color: #0f172a; font-weight: bold; margin-top: 10pt; margin-bottom: 3pt; page-break-after: avoid;">${formatInlineHtml(title)}</h3>`
        );
        return;
      }

      // Blockquote / Dalil
      if (trimmed.startsWith('>')) {
        closeLists();
        const text = trimmed.replace(/^>\s*/, '');
        const isArabic = /[\u0600-\u06FF]/.test(text);
        if (isArabic) {
          out.push(
            `<div style="font-family: 'Amiri', 'Traditional Arabic', serif; font-size: 16pt; line-height: 2.3; text-align: right; direction: rtl; color: #0f172a; background-color: #f8fafc; padding: 10pt 14pt; border: 1pt solid #cbd5e1; margin: 8pt 0; page-break-inside: avoid;">${text}</div>`
          );
        } else {
          out.push(
            `<div style="border-left: 3.5pt solid #0284c7; background-color: #f0f9ff; padding: 8pt 12pt; margin: 8pt 0; font-style: italic; color: #0369a1; page-break-inside: avoid;">${formatInlineHtml(text)}</div>`
          );
        }
        return;
      }

      // Arabic text line
      if (/[\u0600-\u06FF]/.test(trimmed) && trimmed.length < 350) {
        closeLists();
        out.push(
          `<div style="font-family: 'Amiri', 'Traditional Arabic', serif; font-size: 16pt; line-height: 2.3; text-align: right; direction: rtl; color: #0f172a; background-color: #f8fafc; padding: 10pt 14pt; border: 1pt solid #e2e8f0; margin: 8pt 0; page-break-inside: avoid;">${trimmed}</div>`
        );
        return;
      }

      // Unordered list
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (inOl) {
          out.push('</ol>');
          inOl = false;
        }
        if (!inUl) {
          out.push('<ul style="margin: 4pt 0 6pt 20pt; padding-left: 0;">');
          inUl = true;
        }
        const item = trimmed.replace(/^[-*]\s*/, '');
        out.push(`<li style="margin-bottom: 3pt; line-height: 1.5;">${formatInlineHtml(item)}</li>`);
        return;
      }

      // Ordered list
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        if (inUl) {
          out.push('</ul>');
          inUl = false;
        }
        if (!inOl) {
          out.push('<ol style="margin: 4pt 0 6pt 20pt; padding-left: 0;">');
          inOl = true;
        }
        out.push(`<li style="margin-bottom: 3pt; line-height: 1.5;">${formatInlineHtml(numMatch[2])}</li>`);
        return;
      }

      // Normal paragraph
      closeLists();
      out.push(`<p style="margin: 4pt 0 6pt 0; line-height: 1.5; text-align: justify;">${formatInlineHtml(trimmed)}</p>`);
    });

    if (inTable) flushTable();
    closeLists();

    return out.join('\n');
  }

  // Export to Microsoft Word with Official A4 Page Setup
  const downloadAsWordDoc = () => {
    if (!generatedResult) return;

    let htmlContent = '';

    if (crosswordData) {
      // Format Khusus Teka-Teki Silang: 1 Lembar LKPD Pas A4 + Lembar Kunci Guru
      const studentSheet = generateCrosswordSinglePageHtml({
        title: editableTitle || 'LKPD TEKA-TEKI SILANG PAI',
        gradeLevel,
        semester,
        topic,
        subTopic,
        layout: crosswordData.layout,
        showAnswers: false,
      });

      const teacherSheet = generateCrosswordSinglePageHtml({
        title: `${editableTitle || 'LKPD TEKA-TEKI SILANG PAI'} (KUNCI JAWABAN GURU)`,
        gradeLevel,
        semester,
        topic,
        subTopic,
        layout: crosswordData.layout,
        showAnswers: true,
      });

      htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office'
              xmlns:w='urn:schemas-microsoft-com:office:word'
              xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>${editableTitle || 'LKPD Teka-Teki Silang PAI'}</title>
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
              <w:DoNotOptimizeForBrowser/>
            </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            @page {
              size: 210mm 297mm; /* Ukuran Kertas A4 Standar */
              margin: 15mm 15mm 15mm 15mm;
              mso-page-orientation: portrait;
            }
            @page Section1 {
              size: 210mm 297mm;
              margin: 15mm 15mm 15mm 15mm;
              mso-header-margin: 20pt;
              mso-footer-margin: 20pt;
            }
            div.Section1 {
              page: Section1;
            }
            body {
              font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
              font-size: 9.5pt;
              line-height: 1.35;
              color: #000000;
            }
          </style>
        </head>
        <body>
          <div class="Section1">
            <!-- HALAMAN 1: LEMBAR KERJA PESERTA DIDIK (LKPD) 1 LEMBAR PAS -->
            ${studentSheet}

            <!-- PEMISAH HALAMAN (PAGE BREAK) -->
            <br clear="all" style="page-break-before: always; mso-break-type: section-break;" />
            <div style="page-break-before: always; margin-top: 20pt;"></div>

            <!-- HALAMAN 2: KUNCI JAWABAN & PANDUAN GURU -->
            ${teacherSheet}
          </div>
        </body>
        </html>
      `;
    } else {
      const structuredBody = parseMarkdownToStructuredHtml(generatedResult);
      const currentDate = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office'
              xmlns:w='urn:schemas-microsoft-com:office:word'
              xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>${editableTitle || 'Modul Bahan Ajar PAI'}</title>
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
              <w:DoNotOptimizeForBrowser/>
            </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            @page {
              size: 210mm 297mm; /* Ukuran Kertas A4 Standar */
              margin: 25mm 20mm 20mm 20mm;
              mso-page-orientation: portrait;
            }
            @page Section1 {
              size: 210mm 297mm;
              margin: 25mm 20mm 20mm 20mm;
              mso-header-margin: 36pt;
              mso-footer-margin: 36pt;
              mso-paper-source: 0;
            }
            div.Section1 {
              page: Section1;
            }
            body {
              font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
              font-size: 11pt;
              line-height: 1.45;
              color: #1f2937;
            }
            table.kop-surat {
              width: 100%;
              border-bottom: 3px double #000000;
              margin-bottom: 14pt;
              border-collapse: collapse;
            }
            table.kop-surat td {
              text-align: center;
              padding-bottom: 8pt;
            }
            table.identitas-table {
              width: 100%;
              border: 1px solid #cbd5e1;
              border-collapse: collapse;
              margin-bottom: 14pt;
              font-size: 9.5pt;
            }
            table.identitas-table td {
              border: 1px solid #cbd5e1;
              padding: 4pt 6pt;
            }
            table.identitas-table td.label {
              background-color: #f8fafc;
              font-weight: bold;
              width: 25%;
            }
          </style>
        </head>
        <body>
          <div class="Section1">
            <!-- Kop Surat Resmi Sekolah -->
            <table class="kop-surat">
              <tr>
                <td>
                  <div style="font-size: 12pt; font-weight: bold; letter-spacing: 0.5px;">PEMERINTAH KABUPATEN WAY KANAN</div>
                  <div style="font-size: 13pt; font-weight: bold; letter-spacing: 0.5px;">DINAS PENDIDIKAN DAN KEBUDAYAAN</div>
                  <div style="font-size: 15pt; font-weight: bold; color: #1e3a8a; letter-spacing: 0.5px;">UPT SMP NEGERI 2 REBANG TANGKAS</div>
                  <div style="font-size: 9pt; color: #475569; margin-top: 2pt;">Alamat: Jl. Poros Rebang Tangkas, Kec. Rebang Tangkas, Kab. Way Kanan, Lampung 34768</div>
                </td>
              </tr>
            </table>

            <!-- Judul Dokumen -->
            <div style="text-align: center; margin-bottom: 12pt;">
              <div style="font-size: 14pt; font-weight: bold; color: #1e3a8a; text-transform: uppercase;">MODUL BAHAN AJAR PAI & BUDI PEKERTI</div>
              <div style="font-size: 11pt; font-weight: bold; color: #334155;">KURIKULUM MERDEKA - FASE D</div>
            </div>

            <!-- Tabel Identitas Modul -->
            <table class="identitas-table">
              <tr>
                <td class="label">Satuan Pendidikan</td>
                <td>UPT SMPN 2 Rebang Tangkas</td>
                <td class="label">Mata Pelajaran</td>
                <td>PAI & Budi Pekerti</td>
              </tr>
              <tr>
                <td class="label">Fase / Kelas</td>
                <td>Fase D / Kelas ${gradeLevel} SMP</td>
                <td class="label">Semester</td>
                <td>Semester ${semester}</td>
              </tr>
              <tr>
                <td class="label">Materi Pokok / Bab</td>
                <td colspan="3"><b>${topic}</b></td>
              </tr>
              ${
                subTopic
                  ? `<tr>
                <td class="label">Submateri / Fokus</td>
                <td colspan="3">${subTopic}</td>
              </tr>`
                  : ''
              }
              <tr>
                <td class="label">Alokasi Waktu</td>
                <td>2 × 40 Menit (1 Pertemuan)</td>
                <td class="label">Tahun Ajaran</td>
                <td>2025/2026</td>
              </tr>
            </table>

            <!-- Isi Konten Terstruktur -->
            ${structuredBody}

            <!-- Pengesahan / Kolom Tanda Tangan -->
            <table style="width: 100%; margin-top: 35pt; border-collapse: collapse; page-break-inside: avoid;">
              <tr>
                <td style="width: 50%; text-align: center; vertical-align: top; font-size: 10pt;">
                  Mengetahui,<br/>
                  Kepala UPT SMPN 2 Rebang Tangkas<br/><br/><br/><br/><br/>
                  <b><u>..................................................</u></b><br/>
                  NIP. ..........................................
                </td>
                <td style="width: 50%; text-align: center; vertical-align: top; font-size: 10pt;">
                  Rebang Tangkas, ${currentDate}<br/>
                  Guru Mata Pelajaran PAI & BP<br/><br/><br/><br/><br/>
                  <b><u>${profile?.full_name || 'Salim Arsad, S.Pd.I'}</u></b><br/>
                  NIP. ..........................................
                </td>
              </tr>
            </table>
          </div>
        </body>
        </html>
      `;
    }

    const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(editableTitle || 'modul-bahan-ajar-pai').replace(/[^\w\s-]/gi, '')}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Component to render stylized markdown blocks with customizable font size
  const FormattedMarkdownContent: React.FC<{ content: string; size?: 'sm' | 'base' | 'lg' }> = ({
    content,
    size = 'base',
  }) => {
    if (!content) return null;

    const textSizeClass = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];

    let currentTableRows: string[][] = [];
    let inTable = false;

    const flushTable = (keyIndex: number) => {
      if (currentTableRows.length > 0) {
        const headerRow = currentTableRows[0];
        const bodyRows = currentTableRows.slice(1);

        elements.push(
          <div key={`table-${keyIndex}`} className="overflow-x-auto my-4 rounded-xl border border-slate-700 bg-slate-950/80 shadow-md">
            <table className="w-full text-left text-xs sm:text-sm text-slate-200 border-collapse">
              <thead className="bg-slate-800 text-amber-300 uppercase font-bold text-[11px] border-b border-slate-700">
                <tr>
                  {headerRow.map((h, i) => (
                    <th key={i} className="px-4 py-3">
                      {renderInlineFormatting(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {bodyRows.map((r, ri) => (
                  <tr key={ri} className={ri % 2 === 1 ? 'bg-slate-900/40 hover:bg-slate-800/50' : 'hover:bg-slate-800/50'}>
                    {r.map((cell, ci) => (
                      <td key={ci} className="px-4 py-2.5 leading-relaxed">
                        {renderInlineFormatting(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        currentTableRows = [];
        inTable = false;
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Table line
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        inTable = true;
        if (!trimmed.match(/^\|[\s\-:|]+\|$/)) {
          const cells = trimmed
            .split('|')
            .slice(1, -1)
            .map((c) => c.trim());
          currentTableRows.push(cells);
        }
        return;
      } else if (inTable) {
        flushTable(idx);
      }

      // Empty line
      if (!trimmed) {
        elements.push(<div key={`sp-${idx}`} className="h-2" />);
        return;
      }

      // Heading 1
      if (trimmed.startsWith('# ')) {
        elements.push(
          <div key={`h1-${idx}`} className="mt-7 mb-3 pb-2.5 border-b-2 border-amber-500/40">
            <h1 className="text-lg sm:text-2xl font-black text-amber-300 tracking-tight flex items-center gap-2.5">
              <Bookmark className="w-6 h-6 text-amber-400 shrink-0" />
              <span>{trimmed.replace(/^#\s*/, '')}</span>
            </h1>
          </div>
        );
        return;
      }

      // Heading 2
      if (trimmed.startsWith('## ')) {
        elements.push(
          <div key={`h2-${idx}`} className="mt-6 mb-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 bg-slate-800/80 px-3.5 py-2 rounded-xl border-l-4 border-amber-400 shadow-sm">
              <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{trimmed.replace(/^##\s*/, '')}</span>
            </h2>
          </div>
        );
        return;
      }

      // Heading 3
      if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${idx}`} className="text-sm sm:text-base font-semibold text-sky-300 mt-5 mb-2">
            {trimmed.replace(/^###\s*/, '')}
          </h3>
        );
        return;
      }

      // Blockquote / Dalil
      if (trimmed.startsWith('>')) {
        const textInside = trimmed.replace(/^>\s*/, '');
        const hasArabic = /[\u0600-\u06FF]/.test(textInside);
        elements.push(
          <blockquote
            key={`bq-${idx}`}
            className={`my-3.5 p-4 rounded-xl border ${
              hasArabic
                ? 'border-amber-500/30 bg-amber-950/20 text-amber-200 text-right'
                : 'border-l-4 border-l-sky-400 bg-sky-950/20 border-slate-800 text-sky-200'
            } ${textSizeClass} leading-relaxed shadow-sm`}
            dir={hasArabic ? 'rtl' : 'ltr'}
          >
            {hasArabic ? (
              <span className="font-['Amiri',serif] text-xl sm:text-2xl block leading-loose text-amber-300">
                {textInside}
              </span>
            ) : (
              renderInlineFormatting(textInside)
            )}
          </blockquote>
        );
        return;
      }

      // Pure Arabic text detector
      if (/[\u0600-\u06FF]/.test(trimmed) && trimmed.length < 350) {
        elements.push(
          <div key={`ar-${idx}`} className="my-3.5 p-4 rounded-2xl bg-slate-950 border border-amber-500/30 text-right shadow-inner">
            <p className="font-['Amiri',serif] text-xl sm:text-2xl text-amber-300 leading-loose" dir="rtl">
              {trimmed}
            </p>
          </div>
        );
        return;
      }

      // Unordered list
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const bulletText = trimmed.replace(/^[-*]\s*/, '');
        elements.push(
          <div key={`ul-${idx}`} className={`flex items-start gap-2.5 my-1.5 ${textSizeClass} text-slate-300 leading-relaxed pl-2`}>
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-2" />
            <div className="flex-1">{renderInlineFormatting(bulletText)}</div>
          </div>
        );
        return;
      }

      // Ordered list
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        elements.push(
          <div key={`ol-${idx}`} className={`flex items-start gap-2.5 my-2 ${textSizeClass} text-slate-300 leading-relaxed pl-1`}>
            <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-md bg-slate-800 text-amber-400 text-xs font-bold shrink-0 mt-0.5 border border-slate-700">
              {numMatch[1]}
            </span>
            <div className="flex-1">{renderInlineFormatting(numMatch[2])}</div>
          </div>
        );
        return;
      }

      // Normal paragraph
      elements.push(
        <p key={`p-${idx}`} className={`${textSizeClass} text-slate-300 leading-relaxed my-2 text-justify`}>
          {renderInlineFormatting(trimmed)}
        </p>
      );
    });

    if (inTable) {
      flushTable(lines.length);
    }

    return <div className="space-y-1">{elements}</div>;
  };

  // Parse inline bold, italic, code for React
  function renderInlineFormatting(str: string): React.ReactNode {
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(str.substring(lastIndex, match.index));
      }

      const raw = match[0];
      if (raw.startsWith('**') && raw.endsWith('**')) {
        parts.push(
          <strong key={match.index} className="text-white font-bold">
            {raw.slice(2, -2)}
          </strong>
        );
      } else if (raw.startsWith('*') && raw.endsWith('*')) {
        parts.push(
          <em key={match.index} className="text-amber-200 italic">
            {raw.slice(1, -1)}
          </em>
        );
      } else if (raw.startsWith('`') && raw.endsWith('`')) {
        parts.push(
          <code key={match.index} className="px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 font-mono text-[11px]">
            {raw.slice(1, -1)}
          </code>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < str.length) {
      parts.push(str.substring(lastIndex));
    }

    return parts.length > 0 ? parts : str;
  }

  // Visual Interactive Crossword Component for on-screen preview
  const CrosswordVisualView: React.FC<{
    crosswordData: {
      data: ReturnType<typeof extractCrosswordData>;
      layout: CrosswordLayout;
    };
    showAnswers: boolean;
    onToggleAnswers: () => void;
    topic: string;
    subTopic?: string;
    gradeLevel: number;
    semester: string;
    rawMarkdown: string;
  }> = ({
    crosswordData,
    showAnswers,
    onToggleAnswers,
    topic,
    subTopic,
    gradeLevel,
    semester,
    rawMarkdown,
  }) => {
    const [showExplanation, setShowExplanation] = useState(false);
    const { layout } = crosswordData;

    // Filter out json data blocks and raw markdown tables to show only the theoretical explanations & dalil
    const notesText = React.useMemo(() => {
      let clean = rawMarkdown.replace(/```(?:crossword-data|json)?[\s\S]*?```/g, '').trim();
      // Remove repetitive TTS heading
      clean = clean.replace(/^#\s*.*TEKA-TEKI SILANG.*$/gmi, '').trim();
      return clean;
    }, [rawMarkdown]);

    return (
      <div className="space-y-4">
        {/* Top Control Bar */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0">
              <Puzzle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-white">Lembar Kerja Siswa: Teka-Teki Silang PAI</h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                  Format 1 Lembar Pas A4
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Grid: {layout.width} × {layout.height} kotak • {layout.acrossClues.length} Mendatar • {layout.downClues.length} Menurun
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleAnswers}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              showAnswers
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {showAnswers ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-amber-400" />}
            <span>{showAnswers ? 'Sembunyikan Kunci' : 'Tampilkan Kunci Guru'}</span>
          </button>
        </div>

        {/* Paper Simulation Container (Modeled after 1 Lembar A4) */}
        <div className="bg-white text-slate-900 rounded-2xl p-6 sm:p-7 shadow-xl border border-slate-200 font-sans max-w-4xl mx-auto">
          {/* Kop LKPD UPT SMPN 2 Rebang Tangkas */}
          <div className="text-center border-b-2 border-slate-900 pb-2 mb-3">
            <div className="text-[11px] font-bold tracking-wider uppercase text-slate-800">
              UPT SMP NEGERI 2 REBANG TANGKAS
            </div>
            <div className="text-xs sm:text-sm font-black tracking-wide text-blue-900 uppercase">
              LEMBAR KERJA PESERTA DIDIK (LKPD) - TEKA-TEKI SILANG PAI
            </div>
            <div className="text-[9.5px] text-slate-600 mt-0.5 font-medium">
              Kurikulum Merdeka Fase D | Kelas {gradeLevel} | Semester {semester} | Topik: {topic} {subTopic ? `(${subTopic})` : ''}
            </div>
          </div>

          {/* Identitas Siswa Box */}
          <div className="mb-4 overflow-x-auto">
            <table className="w-full text-[10px] sm:text-[11px] border border-slate-400 border-collapse">
              <tbody>
                <tr>
                  <td className="w-24 p-1.5 font-bold bg-slate-100 border border-slate-300">Nama Siswa</td>
                  <td className="p-1.5 border border-slate-300 text-slate-400 italic">...................................................</td>
                  <td className="w-28 p-1.5 font-bold bg-slate-100 border border-slate-300">Hari / Tanggal</td>
                  <td className="w-36 p-1.5 border border-slate-300 text-slate-400 italic">............................</td>
                </tr>
                <tr>
                  <td className="p-1.5 font-bold bg-slate-100 border border-slate-300">Kelas / No. Absen</td>
                  <td className="p-1.5 border border-slate-300 text-slate-400 italic">...................................................</td>
                  <td className="p-1.5 font-bold bg-slate-100 border border-slate-300">Nilai / Paraf</td>
                  <td className="p-1.5 border border-slate-300 text-slate-400 italic">............................</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Kotak-Kotak Teka-Teki Silang */}
          <div className="my-4 flex flex-col items-center">
            <div className="overflow-x-auto max-w-full p-2 bg-slate-50 rounded-xl border border-slate-200 shadow-inner">
              <table className="border-collapse select-none">
                <tbody>
                  {layout.grid.map((row, rIdx) => (
                    <tr key={`r-${rIdx}`}>
                      {row.map((cell, cIdx) => {
                        if (cell.isBlocked) {
                          return (
                            <td
                              key={`c-${rIdx}-${cIdx}`}
                              className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 bg-slate-800 border border-slate-300 p-0"
                            />
                          );
                        }
                        return (
                          <td
                            key={`c-${rIdx}-${cIdx}`}
                            className="relative w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 bg-white border-2 border-black text-center align-middle p-0 shadow-xs"
                          >
                            {cell.cellNumber && (
                              <span className="absolute top-0.5 left-1 text-[8px] sm:text-[9px] font-black text-blue-900 leading-none">
                                {cell.cellNumber}
                              </span>
                            )}
                            <span
                              className={`flex items-center justify-center w-full h-full text-xs sm:text-sm font-black transition-colors ${
                                showAnswers ? 'text-slate-900 bg-amber-50/60' : 'text-transparent'
                              }`}
                            >
                              {cell.letter}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-slate-500 italic mt-2 text-center">
              Petunjuk: Isilah kotak putih dengan huruf kapital sesuai nomor dan arah pertanyaan. Kotak hitam adalah pemisah kata.
            </p>
          </div>

          {/* 2 Kolom Pertanyaan (Mendatar & Menurun) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-3 border-t border-slate-200">
            {/* Kolom Mendatar */}
            <div className="space-y-1.5">
              <div className="bg-blue-50 border-l-4 border-blue-700 px-2.5 py-1 rounded-r">
                <h5 className="text-[11px] font-black text-blue-900 tracking-wide uppercase">
                  PERTANYAAN MENDATAR (ACROSS)
                </h5>
              </div>
              <div className="space-y-1.5 pr-1">
                {layout.acrossClues.length > 0 ? (
                  layout.acrossClues.map((clue) => (
                    <div key={`across-${clue.number}`} className="text-[11px] text-slate-800 leading-relaxed flex items-start gap-1.5">
                      <span className="font-bold text-blue-900 shrink-0">{clue.number}.</span>
                      <div className="flex-1">
                        <span>{clue.clue}</span>
                        <span className="text-[10px] text-slate-500 italic ml-1">({clue.length} huruf)</span>
                        {showAnswers && (
                          <span className="ml-1.5 text-[10px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded tracking-wider">
                            [{clue.word}]
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">Tidak ada pertanyaan mendatar.</p>
                )}
              </div>
            </div>

            {/* Kolom Menurun */}
            <div className="space-y-1.5">
              <div className="bg-sky-50 border-l-4 border-sky-600 px-2.5 py-1 rounded-r">
                <h5 className="text-[11px] font-black text-sky-900 tracking-wide uppercase">
                  PERTANYAAN MENURUN (DOWN)
                </h5>
              </div>
              <div className="space-y-1.5 pl-1">
                {layout.downClues.length > 0 ? (
                  layout.downClues.map((clue) => (
                    <div key={`down-${clue.number}`} className="text-[11px] text-slate-800 leading-relaxed flex items-start gap-1.5">
                      <span className="font-bold text-sky-900 shrink-0">{clue.number}.</span>
                      <div className="flex-1">
                        <span>{clue.clue}</span>
                        <span className="text-[10px] text-slate-500 italic ml-1">({clue.length} huruf)</span>
                        {showAnswers && (
                          <span className="ml-1.5 text-[10px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded tracking-wider">
                            [{clue.word}]
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">Tidak ada pertanyaan menurun.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Accordion: Pembahasan Materi & Kunci Jawaban Lengkap */}
        {notesText && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowExplanation((prev) => !prev)}
              className="w-full px-4 py-3 text-left flex items-center justify-between text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Pembahasan Materi, Dalil Naqli &amp; Panduan Guru</span>
              </div>
              {showExplanation ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {showExplanation && (
              <div className="p-4 border-t border-slate-800 bg-slate-950/60">
                <FormattedMarkdownContent content={notesText} size="sm" />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Printable Paper View (Hidden on screen, shown in @media print) */}
      <div id="print-area" className="hidden print:block print:p-4 bg-white text-black font-sans text-xs">
        {crosswordData ? (
          <div>
            {/* HALAMAN 1: LEMBAR KERJA PESERTA DIDIK (LKPD) - PAS 1 LEMBAR A4 */}
            <div
              dangerouslySetInnerHTML={{
                __html: generateCrosswordSinglePageHtml({
                  title: editableTitle || 'LKPD TEKA-TEKI SILANG PAI',
                  gradeLevel,
                  semester,
                  topic,
                  subTopic,
                  layout: crosswordData.layout,
                  showAnswers: false,
                }),
              }}
            />

            {/* HALAMAN 2: KUNCI JAWABAN GURU & PANDUAN PENILAIAN */}
            <div style={{ pageBreakBefore: 'always', marginTop: '24pt' }}>
              <div
                dangerouslySetInnerHTML={{
                  __html: generateCrosswordSinglePageHtml({
                    title: `${editableTitle || 'LKPD TEKA-TEKI SILANG PAI'} (KUNCI JAWABAN GURU)`,
                    gradeLevel,
                    semester,
                    topic,
                    subTopic,
                    layout: crosswordData.layout,
                    showAnswers: true,
                  }),
                }}
              />
            </div>
          </div>
        ) : (
          <div>
            {/* Kop Surat Resmi Sekolah */}
            <div className="text-center border-b-2 border-black pb-3 mb-4">
              <div className="text-xs font-bold tracking-wider uppercase">PEMERINTAH KABUPATEN WAY KANAN</div>
              <div className="text-xs font-bold tracking-wider uppercase">DINAS PENDIDIKAN DAN KEBUDAYAAN</div>
              <div className="text-sm font-black tracking-wider uppercase text-blue-900">UPT SMP NEGERI 2 REBANG TANGKAS</div>
              <p className="text-[10px] text-gray-700 mt-0.5">
                Alamat: Jl. Poros Rebang Tangkas, Kec. Rebang Tangkas, Kab. Way Kanan, Lampung 34768
              </p>
            </div>

            {/* Judul Dokumen */}
            <div className="text-center mb-4">
              <h1 className="text-sm font-bold uppercase tracking-wide text-blue-900">MODUL BAHAN AJAR PAI & BUDI PEKERTI</h1>
              <h2 className="text-[11px] font-semibold text-gray-700">KURIKULUM MERDEKA - FASE D</h2>
            </div>

            {/* Tabel Identitas Modul */}
            <div className="mb-4 text-[10px] border border-gray-400">
              <table className="w-full border-collapse">
                <tbody>
                  <tr className="border-b border-gray-300">
                    <td className="w-1/4 p-1.5 font-bold bg-gray-100 border-r border-gray-300">Satuan Pendidikan</td>
                    <td className="w-1/4 p-1.5 border-r border-gray-300">UPT SMPN 2 Rebang Tangkas</td>
                    <td className="w-1/4 p-1.5 font-bold bg-gray-100 border-r border-gray-300">Mata Pelajaran</td>
                    <td className="w-1/4 p-1.5">PAI & Budi Pekerti</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="p-1.5 font-bold bg-gray-100 border-r border-gray-300">Fase / Kelas</td>
                    <td className="p-1.5 border-r border-gray-300">Fase D / Kelas {gradeLevel} SMP</td>
                    <td className="p-1.5 font-bold bg-gray-100 border-r border-gray-300">Semester</td>
                    <td className="p-1.5">Semester {semester}</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="p-1.5 font-bold bg-gray-100 border-r border-gray-300">Materi Pokok / Bab</td>
                    <td colSpan={3} className="p-1.5 font-bold">{topic}</td>
                  </tr>
                  {subTopic && (
                    <tr className="border-b border-gray-300">
                      <td className="p-1.5 font-bold bg-gray-100 border-r border-gray-300">Submateri / Fokus</td>
                      <td colSpan={3} className="p-1.5">{subTopic}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="p-1.5 font-bold bg-gray-100 border-r border-gray-300">Alokasi Waktu</td>
                    <td className="p-1.5 border-r border-gray-300">2 × 40 Menit (1 Pertemuan)</td>
                    <td className="p-1.5 font-bold bg-gray-100 border-r border-gray-300">Tahun Ajaran</td>
                    <td className="p-1.5">2025/2026</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Parsed Clean Body */}
            <div
              className="print-body space-y-2 text-[11px] leading-relaxed text-justify"
              dangerouslySetInnerHTML={{ __html: parseMarkdownToStructuredHtml(generatedResult) }}
            />

            {/* Kolom Tanda Tangan Pengesahan */}
            <div className="mt-8 pt-4 border-t border-gray-300 break-inside-avoid">
              <table className="w-full text-[11px] text-center border-collapse">
                <tbody>
                  <tr>
                    <td className="w-1/2 align-top">
                      Mengetahui,<br />
                      Kepala UPT SMPN 2 Rebang Tangkas<br /><br /><br /><br /><br />
                      <b><u>..................................................</u></b><br />
                      NIP. ..........................................
                    </td>
                    <td className="w-1/2 align-top">
                      Rebang Tangkas, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br />
                      Guru Mata Pelajaran PAI & BP<br /><br /><br /><br /><br />
                      <b><u>{profile?.full_name || 'Salim Arsad, S.Pd.I'}</u></b><br />
                      NIP. ..........................................
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Screen Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Google Gemini 3.8 Flash AI Engine - Respon Cepat & Tepat</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Pusat Bahan Ajar PAI Inovatif Kurikulum Merdeka
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Hasilkan modul ajar berstandar Kurikulum Merdeka, rangkuman dalil naqli Al-Qur&apos;an &amp; Hadis, lembar kerja siswa (LKPD), studi kasus HOTS, serta latihan soal berbobot secara instan dan komprehensif.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 ${
                aiStatus.hasKey
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${aiStatus.hasKey ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {aiStatus.hasKey ? 'Gemini 3.8 Flash Siap' : 'AI Mode Standby'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Form Left, Preview/Editor Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: 5 Cols */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span>Parameter &amp; Kurikulum Pembelajaran</span>
            </h3>

            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Tingkat Kelas & Semester */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tingkat Kelas</label>
                  <select
                    value={gradeLevel}
                    onChange={(e) => {
                      const newGrade = parseInt(e.target.value, 10);
                      setGradeLevel(newGrade);
                      setTopic('');
                      setSubTopic('');
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                  >
                    <option value={7}>Kelas 7 SMP (Fase D)</option>
                    <option value={8}>Kelas 8 SMP (Fase D)</option>
                    <option value={9}>Kelas 9 SMP (Fase D)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Semester</label>
                  <select
                    value={semester}
                    onChange={(e) => {
                      const newSem = e.target.value as 'Ganjil' | 'Genap';
                      setSemester(newSem);
                      setTopic('');
                      setSubTopic('');
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                  >
                    <option value="Ganjil">Semester Ganjil</option>
                    <option value="Genap">Semester Genap</option>
                  </select>
                </div>
              </div>

              {/* Quick Preset Selector for Kurikulum Merdeka */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Pilih Bab Kurikulum Merdeka Kelas {gradeLevel} ({semester})</span>
                  </label>
                  <span className="text-[10px] text-slate-400">{availablePresets.length} Bab Tersedia</span>
                </div>

                <select
                  value={selectedChapter?.topic || ''}
                  onChange={(e) => {
                    const found = availablePresets.find((p) => p.topic === e.target.value);
                    if (found) handleSelectPreset(found);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-400"
                >
                  <option value="">-- Pilih dari Silabus Resmi atau Ketik Manual --</option>
                  {availablePresets.map((ch) => (
                    <option key={ch.id} value={ch.topic}>
                      {ch.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Topik Materi Utama */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Topik Materi Utama <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Meneladani Asmaul Husna, Salat Berjamaah, Zakat"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none transition-all"
                />
              </div>

              {/* Submateri / Fokus Utama */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Submateri / Fokus Khusus <span className="text-amber-400">(Sangat Dianjurkan)</span>
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="Contoh: Al-Alim, Al-Khabir, As-Sami', Al-Bashir"
                  value={subTopic}
                  onChange={(e) => setSubTopic(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none transition-all"
                />

                {/* Submateri Quick Chips */}
                {selectedChapter && selectedChapter.subTopics.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <span className="text-[10px] text-slate-400 block font-medium">
                      Pilihan Submateri Bab Ini (Klik untuk memilih):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedChapter.subTopics.map((st, idx) => (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => setSubTopic(st)}
                          className={`text-[10px] px-2 py-1 rounded-lg border transition-all text-left ${
                            subTopic === st
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Output Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Format Produk Bahan Ajar
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'full', label: 'Modul Ajar Lengkap', icon: BookOpen, desc: 'CP, Dalil, Teori, LKPD & Evaluasi' },
                    { id: 'summary', label: 'Ringkasan Materi', icon: Sparkles, desc: 'Peta Konsep & Dalil Kunci' },
                    { id: 'practice', label: 'Paket Latihan & Kunci', icon: GraduationCap, desc: '10 Soal PG & Uraian' },
                    { id: 'hots', label: 'Soal HOTS Studi Kasus', icon: HelpCircle, desc: 'Analisis Dilema Siswa' },
                    { id: 'lkpd', label: 'LKPD Peserta Didik', icon: FileQuestion, desc: 'Aktivitas Diskusi Kelompok' },
                    { id: 'crossword', label: 'Teka-Teki Silang PAI', icon: Puzzle, desc: '10 Kata Kunci & Petunjuk' },
                    { id: 'quiz', label: '10 Soal Kuis CBT', icon: CheckCircle2, desc: 'Format Pilihan Ganda A-D' },
                    { id: 'educational_game', label: 'Permainan Edukatif', icon: Gamepad2, desc: 'Rancangan Game Kelas' },
                    { id: 'video_recs', label: 'Panduan Video YouTube', icon: Video, desc: 'Rekomendasi & Lembar Diskusi' },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = generateType === item.id;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => setGenerateType(item.id as any)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-blue-600/30 border-blue-500 text-white font-semibold ring-1 ring-blue-500'
                            : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                          <span className="truncate text-[11px] font-bold">{item.label}</span>
                        </div>
                        <span className="text-[9px] text-slate-400 leading-tight">{item.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Instructions with Quick Suggestions */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Instruksi Khusus Guru (Diprioritaskan)
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Sertakan contoh kasus di lingkungan pedesaan Way Kanan, tambahkan hukum tajwid mad..."
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
                />

                {/* Quick Suggestion Chips */}
                <div className="mt-2 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-medium">Saran Instruksi Tambahan:</span>
                  <div className="flex flex-wrap gap-1">
                    {TEACHER_INSTRUCTION_SUGGESTIONS.map((sug, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => handleAddInstructionChip(sug)}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Generate Button / Stop Button */}
              <div className="pt-2">
                {loading ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handleCancelGenerate}
                      className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all"
                    >
                      <StopCircle className="w-4 h-4" />
                      <span>Hentikan Proses Generasi</span>
                    </button>
                    {streamingStatus && (
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-amber-400 flex items-center gap-2 animate-pulse">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>{streamingStatus}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-101 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Hasilkan Bahan Ajar Cepat &amp; Lengkap</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right Editor / Preview: 7 Cols */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col min-h-[580px]">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Hasil Bahan Ajar &amp; Lembar Kerja</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Pilih tab pratinjau untuk melihat format rapi, atau tab sunting untuk mengubah teks.
              </p>
            </div>

            {/* Mode Switcher & Export Suite */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Tab Switcher & Font Zoom Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeTab === 'preview'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Pratinjau Rapi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('editor')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeTab === 'editor'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Sunting Markdown</span>
                  </button>
                </div>

                {activeTab === 'preview' && (
                  <div className="bg-slate-950 px-2 py-1 rounded-xl border border-slate-800 flex items-center gap-1">
                    <span className="text-[10px] text-slate-500 font-semibold mr-1">Ukuran Font:</span>
                    {(['sm', 'base', 'lg'] as const).map((sz) => (
                      <button
                        type="button"
                        key={sz}
                        onClick={() => setFontSize(sz)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                          fontSize === sz
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title={sz === 'sm' ? 'Font Kecil' : sz === 'lg' ? 'Font Besar' : 'Font Standar'}
                      >
                        {sz === 'sm' ? 'A-' : sz === 'lg' ? 'A+' : 'A'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {generatedResult && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer border border-slate-700"
                    title="Salin Seluruh Konten"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Tersalin' : 'Salin'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    title="Cetak langsung atau simpan sebagai PDF ukuran A4"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak / PDF (A4)</span>
                  </button>
                  <button
                    type="button"
                    onClick={downloadAsWordDoc}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    title="Unduh dokumen resmi format Microsoft Word (.doc) ukuran kertas A4"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Word (.doc A4)</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Status Message Notification */}
          {statusMessage && (
            <div
              className={`my-3 p-3 rounded-xl text-xs flex items-start gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-200'
                  : 'bg-rose-950/60 border border-rose-800 text-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              )}
              <span className="leading-relaxed">{statusMessage.text}</span>
            </div>
          )}

          {/* Editor & Preview Area */}
          <div className="flex-1 my-3 flex flex-col">
            {generatedResult || loading ? (
              <div className="flex-1 flex flex-col space-y-3">
                {/* Title Input */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Judul Modul / Bahan Ajar
                  </label>
                  <input
                    type="text"
                    value={editableTitle}
                    onChange={(e) => setEditableTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none focus:border-amber-400"
                  />
                </div>

                {/* Content View Container */}
                <div className="flex-1 flex flex-col min-h-[380px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden relative">
                  {loading && (
                    <div className="absolute top-2 right-2 z-10 px-2 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold flex items-center gap-1.5 animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Aliran Respon Aktif...</span>
                    </div>
                  )}

                  {activeTab === 'preview' ? (
                    <div
                      ref={previewContainerRef}
                      className="flex-1 p-5 overflow-y-auto max-h-[550px] scrollbar-thin scrollbar-thumb-slate-700"
                    >
                      {crosswordData ? (
                        <CrosswordVisualView
                          crosswordData={crosswordData}
                          showAnswers={showCrosswordAnswers}
                          onToggleAnswers={() => setShowCrosswordAnswers((prev) => !prev)}
                          topic={topic}
                          subTopic={subTopic}
                          gradeLevel={gradeLevel}
                          semester={semester}
                          rawMarkdown={generatedResult}
                        />
                      ) : (
                        <FormattedMarkdownContent content={generatedResult} size={fontSize} />
                      )}
                    </div>
                  ) : (
                    <textarea
                      rows={20}
                      value={generatedResult}
                      onChange={(e) => setGeneratedResult(e.target.value)}
                      placeholder="Teks Markdown bahan ajar akan muncul di sini..."
                      className="w-full flex-1 p-4 bg-transparent text-xs text-slate-200 font-mono leading-relaxed outline-none focus:ring-1 focus:ring-amber-400 resize-none max-h-[550px] overflow-y-auto"
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-800 rounded-xl">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Siap Merumuskan Bahan Ajar PAI</h4>
                <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-4">
                  Pilih bab dari kurikulum resmi di sebelah kiri atau ketikkan topik secara mandiri. AI Gemini 3.8 Flash akan menyusun bahan ajar lengkap dengan dalil Al-Qur&apos;an, rangkuman, LKPD, dan soal asesmen secara presisi.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {availablePresets.slice(0, 3).map((pr) => (
                    <button
                      type="button"
                      key={pr.id}
                      onClick={() => handleSelectPreset(pr)}
                      className="text-[11px] px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                    >
                      ⚡ {pr.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Publication Bottom Bar */}
          {generatedResult && (
            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="w-full sm:w-auto flex items-center gap-2">
                <label className="text-xs text-slate-400 whitespace-nowrap">Publikasikan ke Siswa:</label>
                <select
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 outline-none focus:border-amber-400"
                >
                  <option value="">Semua Siswa Tingkat {gradeLevel}</option>
                  {classes
                    .filter((c) => c.grade_level === gradeLevel)
                    .map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        Khusus Kelas {cls.class_name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={downloadAsMarkdown}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="Unduh Format Markdown (.md)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>.md</span>
                </button>

                <button
                  type="button"
                  onClick={handlePublishToClass}
                  disabled={saveLoading}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all hover:scale-102 disabled:opacity-50 cursor-pointer"
                >
                  {saveLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Simpan &amp; Publikasikan ke Supabase</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
