import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface SchoolExportMeta {
  schoolName: string;
  schoolAddress: string;
  headmasterName: string;
  headmasterNip: string;
  teacherName: string;
  teacherNip: string;
  academicYear: string;
  semester: string;
  className: string;
}

export interface TeacherJournalExportItem {
  no: number;
  dateStr: string;
  dayName: string;
  fullDate: string;
  className: string;
  hour: string;
  topic: string;
  activities: string;
  attendanceStr: string;
  notes: string;
}

export interface AttitudeRecordExportItem {
  no: number;
  timeStr: string;
  studentName: string;
  className: string;
  behaviorNote: string;
  attitudeItem: string;
  notes: string;
}

/**
 * Trigger file download helper
 */
const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// ============================================================================
// 1. TEACHER JOURNAL EXPORTS (WORD & PDF)
// ============================================================================

export const exportTeacherJournalToWord = (
  meta: SchoolExportMeta,
  items: TeacherJournalExportItem[]
) => {
  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const tableRowsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="text-align: center; font-weight: bold;">${item.no}</td>
      <td style="text-align: left;"><strong>${item.dayName}</strong><br/>${item.fullDate}</td>
      <td style="text-align: center; font-weight: bold;">${item.className}</td>
      <td style="text-align: center;">${item.hour}</td>
      <td style="text-align: left; font-weight: 500;">${item.topic}</td>
      <td style="text-align: left; white-space: pre-line;">${item.activities}</td>
      <td style="text-align: center; font-family: monospace;">${item.attendanceStr}</td>
      <td style="text-align: left;">${item.notes}</td>
      <td style="text-align: center; height: 35px;"></td>
    </tr>`
    )
    .join('');

  const htmlContent = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>Buku Jurnal Mengajar Guru PAI</title>
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
@page Section1 {
  size: 297mm 210mm;
  margin: 15mm 15mm 15mm 15mm;
  mso-page-orientation: landscape;
}
div.Section1 {
  page: Section1;
}
body {
  font-family: 'Times New Roman', Times, serif;
  font-size: 10pt;
  color: #000;
  line-height: 1.3;
}
.header-box {
  text-align: center;
  border-bottom: 3px double #000;
  padding-bottom: 8px;
  margin-bottom: 12px;
}
.kop-title1 {
  font-size: 11pt;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.kop-school {
  font-size: 14pt;
  font-weight: bold;
  text-transform: uppercase;
  margin: 2px 0;
}
.kop-addr {
  font-size: 9pt;
  color: #333;
}
.doc-title {
  font-size: 12pt;
  font-weight: bold;
  text-transform: uppercase;
  text-decoration: underline;
  text-align: center;
  margin-top: 10px;
}
.doc-subtitle {
  font-size: 10pt;
  font-weight: bold;
  text-align: center;
  margin-top: 3px;
}
.doc-meta {
  font-size: 9pt;
  text-align: center;
  margin-bottom: 12px;
}
.meta-table {
  width: 100%;
  margin-bottom: 8px;
  font-size: 9.5pt;
}
.meta-table td {
  border: none;
  padding: 2px 0;
}
table.content-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 6px;
  font-size: 9pt;
}
table.content-table th, table.content-table td {
  border: 1px solid #000;
  padding: 5px 6px;
  vertical-align: top;
}
table.content-table th {
  background-color: #f2f2f2;
  font-weight: bold;
  text-align: center;
}
.sign-table {
  width: 100%;
  margin-top: 25px;
  border-collapse: collapse;
}
.sign-table td {
  border: none;
  width: 50%;
  text-align: center;
  vertical-align: top;
  font-size: 9.5pt;
}
</style>
</head>
<body>
<div class="Section1">
  <div class="header-box">
    <div class="kop-title1">Pemerintah Kabupaten Way Kanan &bull; Dinas Pendidikan dan Kebudayaan</div>
    <div class="kop-school">${meta.schoolName}</div>
    <div class="kop-addr">${meta.schoolAddress} &bull; NSS: 201120803023 &bull; NPSN: 10806871</div>
  </div>

  <div class="doc-title">BUKU JURNAL HARIAN PELAKSANAAN PEMBELAJARAN</div>
  <div class="doc-subtitle">MATA PELAJARAN: PENDIDIKAN AGAMA ISLAM DAN BUDI PEKERTI</div>
  <div class="doc-meta">Tahun Ajaran ${meta.academicYear} &bull; Semester ${meta.semester} &bull; Kelas: ${meta.className}</div>

  <table class="meta-table">
    <tr>
      <td style="text-align: left;"><strong>Guru Pengampu:</strong> ${meta.teacherName} (NIP. ${meta.teacherNip})</td>
      <td style="text-align: right;"><strong>Format:</strong> Microsoft Word (A4 Landscape)</td>
    </tr>
  </table>

  <table class="content-table">
    <thead>
      <tr>
        <th style="width: 30px;">No</th>
        <th style="width: 90px;">Hari / Tanggal</th>
        <th style="width: 55px;">Kelas</th>
        <th style="width: 75px;">Jam Ke-</th>
        <th style="width: 140px;">Materi Pokok</th>
        <th>Kegiatan Pembelajaran (KBM)</th>
        <th style="width: 75px;">Kehadiran<br/>(S, I, A)</th>
        <th style="width: 100px;">Keterangan</th>
        <th style="width: 45px;">Paraf</th>
      </tr>
    </thead>
    <tbody>
      ${tableRowsHtml || '<tr><td colspan="9" style="text-align:center; padding: 15px;">Belum ada catatan jurnal mengajar.</td></tr>'}
    </tbody>
  </table>

  <table class="sign-table">
    <tr>
      <td>
        Mengetahui,<br/>
        <strong>Kepala ${meta.schoolName}</strong>
        <br/><br/><br/><br/>
        <strong><u>${meta.headmasterName}</u></strong><br/>
        NIP. ${meta.headmasterNip}
      </td>
      <td>
        Rebang Tangkas, ${todayFormatted}<br/>
        <strong>Guru Mata Pelajaran PAI & BP</strong>
        <br/><br/><br/><br/>
        <strong><u>${meta.teacherName}</u></strong><br/>
        NIP. ${meta.teacherNip}
      </td>
    </tr>
  </table>
</div>
</body>
</html>`;

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8',
  });
  const cleanClass = meta.className.replace(/\s+/g, '_');
  downloadBlob(blob, `Jurnal_Mengajar_PAI_${cleanClass}_${new Date().toISOString().slice(0, 10)}.doc`);
};

export const exportTeacherJournalToPdf = (
  meta: SchoolExportMeta,
  items: TeacherJournalExportItem[]
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Kop Dinas
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('PEMERINTAH KABUPATEN WAY KANAN - DINAS PENDIDIKAN DAN KEBUDAYAAN', pageWidth / 2, 10, { align: 'center' });
  doc.setFontSize(13);
  doc.text(meta.schoolName.toUpperCase(), pageWidth / 2, 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`${meta.schoolAddress} | NSS: 201120803023 | NPSN: 10806871`, pageWidth / 2, 21, { align: 'center' });

  // Double Line
  doc.setLineWidth(0.6);
  doc.line(10, 23, pageWidth - 10, 23);
  doc.setLineWidth(0.2);
  doc.line(10, 24, pageWidth - 10, 24);

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('BUKU JURNAL HARIAN PELAKSANAAN PEMBELAJARAN', pageWidth / 2, 29, { align: 'center' });
  doc.setFontSize(9);
  doc.text('MATA PELAJARAN: PENDIDIKAN AGAMA ISLAM DAN BUDI PEKERTI', pageWidth / 2, 34, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Tahun Ajaran ${meta.academicYear} | Semester ${meta.semester} | Kelas: ${meta.className}`, pageWidth / 2, 38.5, { align: 'center' });

  // Teacher Info
  doc.setFontSize(8);
  doc.text(`Guru Pengampu: ${meta.teacherName} (NIP. ${meta.teacherNip})`, 10, 43);
  doc.text(`Format Kertas: A4 Landscape`, pageWidth - 10, 43, { align: 'right' });

  // Table
  const tableData = items.map((item) => [
    item.no.toString(),
    `${item.dayName},\n${item.fullDate}`,
    item.className,
    item.hour,
    item.topic,
    item.activities,
    item.attendanceStr,
    item.notes,
    '',
  ]);

  autoTable(doc, {
    startY: 45,
    margin: { left: 10, right: 10, bottom: 35 },
    head: [[
      'No',
      'Hari / Tanggal',
      'Kelas',
      'Jam Ke-',
      'Materi Pokok',
      'Kegiatan KBM',
      'Kehadiran (S,I,A)',
      'Keterangan',
      'Paraf',
    ]],
    body: tableData.length > 0 ? tableData : [['-', 'Belum ada data', '-', '-', '-', '-', '-', '-', '-']],
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.15,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 26, halign: 'left' },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 42, halign: 'left' },
      5: { cellWidth: 'auto', halign: 'left' },
      6: { cellWidth: 22, halign: 'center' },
      7: { cellWidth: 32, halign: 'left' },
      8: { cellWidth: 12, halign: 'center' },
    },
    didDrawPage: (data) => {
      // Signatures on last page or bottom
      const pageHeight = doc.internal.pageSize.getHeight();
      const currentY = data.cursor ? data.cursor.y : 150;

      if (currentY + 30 <= pageHeight - 5) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        // Left
        doc.text('Mengetahui,', 40, currentY + 8, { align: 'center' });
        doc.text(`Kepala ${meta.schoolName}`, 40, currentY + 12, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.text(meta.headmasterName, 40, currentY + 26, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.text(`NIP. ${meta.headmasterNip}`, 40, currentY + 30, { align: 'center' });

        // Right
        const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        doc.text(`Rebang Tangkas, ${todayStr}`, pageWidth - 45, currentY + 8, { align: 'center' });
        doc.text('Guru Mata Pelajaran PAI & BP', pageWidth - 45, currentY + 12, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.text(meta.teacherName, pageWidth - 45, currentY + 26, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.text(`NIP. ${meta.teacherNip}`, pageWidth - 45, currentY + 30, { align: 'center' });
      }
    },
  });

  const cleanClass = meta.className.replace(/\s+/g, '_');
  doc.save(`Jurnal_Mengajar_PAI_${cleanClass}_${new Date().toISOString().slice(0, 10)}.pdf`);
};

// ============================================================================
// 2. ATTITUDE JOURNAL EXPORTS (WORD & PDF)
// ============================================================================

export const exportAttitudeJournalToWord = (
  meta: SchoolExportMeta,
  items: AttitudeRecordExportItem[]
) => {
  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const tableRowsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="text-align: center; font-weight: bold;">${item.no}</td>
      <td style="text-align: left;">${item.timeStr}</td>
      <td style="text-align: left; font-weight: bold;">${item.studentName}</td>
      <td style="text-align: center; font-weight: bold;">${item.className}</td>
      <td style="text-align: left;">${item.behaviorNote}</td>
      <td style="text-align: center; font-weight: bold;">${item.attitudeItem}</td>
      <td style="text-align: left;">${item.notes}</td>
      <td style="text-align: center; height: 35px;"></td>
    </tr>`
    )
    .join('');

  const htmlContent = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>Buku Jurnal Pengamatan Sikap Siswa</title>
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
@page Section1 {
  size: 297mm 210mm;
  margin: 15mm 15mm 15mm 15mm;
  mso-page-orientation: landscape;
}
div.Section1 {
  page: Section1;
}
body {
  font-family: 'Times New Roman', Times, serif;
  font-size: 10pt;
  color: #000;
  line-height: 1.3;
}
.header-box {
  text-align: center;
  border-bottom: 3px double #000;
  padding-bottom: 8px;
  margin-bottom: 12px;
}
.kop-title1 {
  font-size: 11pt;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.kop-school {
  font-size: 14pt;
  font-weight: bold;
  text-transform: uppercase;
  margin: 2px 0;
}
.kop-addr {
  font-size: 9pt;
  color: #333;
}
.doc-title {
  font-size: 12pt;
  font-weight: bold;
  text-transform: uppercase;
  text-decoration: underline;
  text-align: center;
  margin-top: 10px;
}
.doc-subtitle {
  font-size: 10pt;
  font-weight: bold;
  text-align: center;
  margin-top: 3px;
}
.doc-meta {
  font-size: 9pt;
  text-align: center;
  margin-bottom: 12px;
}
.meta-table {
  width: 100%;
  margin-bottom: 8px;
  font-size: 9.5pt;
}
.meta-table td {
  border: none;
  padding: 2px 0;
}
table.content-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 6px;
  font-size: 9pt;
}
table.content-table th, table.content-table td {
  border: 1px solid #000;
  padding: 5px 6px;
  vertical-align: top;
}
table.content-table th {
  background-color: #f2f2f2;
  font-weight: bold;
  text-align: center;
}
.sign-table {
  width: 100%;
  margin-top: 25px;
  border-collapse: collapse;
}
.sign-table td {
  border: none;
  width: 50%;
  text-align: center;
  vertical-align: top;
  font-size: 9.5pt;
}
</style>
</head>
<body>
<div class="Section1">
  <div class="header-box">
    <div class="kop-title1">Pemerintah Kabupaten Way Kanan &bull; Dinas Pendidikan dan Kebudayaan</div>
    <div class="kop-school">${meta.schoolName}</div>
    <div class="kop-addr">${meta.schoolAddress} &bull; NSS: 201120803023 &bull; NPSN: 10806871</div>
  </div>

  <div class="doc-title">BUKU JURNAL PENGAMATAN SIKAP SISWA</div>
  <div class="doc-subtitle">MATA PELAJARAN: PENDIDIKAN AGAMA ISLAM DAN BUDI PEKERTI</div>
  <div class="doc-meta">Tahun Ajaran ${meta.academicYear} &bull; Semester ${meta.semester} &bull; Kelas: ${meta.className}</div>

  <table class="meta-table">
    <tr>
      <td style="text-align: left;"><strong>Guru Pengampu:</strong> ${meta.teacherName} (NIP. ${meta.teacherNip})</td>
      <td style="text-align: right;"><strong>Format:</strong> Microsoft Word (A4 Landscape)</td>
    </tr>
  </table>

  <table class="content-table">
    <thead>
      <tr>
        <th style="width: 35px;">No</th>
        <th style="width: 95px;">Waktu</th>
        <th style="width: 150px;">Nama Siswa</th>
        <th style="width: 55px;">Kelas</th>
        <th>Catatan Perilaku</th>
        <th style="width: 95px;">Butir Sikap</th>
        <th style="width: 130px;">Keterangan</th>
        <th style="width: 50px;">Paraf</th>
      </tr>
    </thead>
    <tbody>
      ${tableRowsHtml || '<tr><td colspan="8" style="text-align:center; padding: 15px;">Belum ada catatan sikap siswa.</td></tr>'}
    </tbody>
  </table>

  <table class="sign-table">
    <tr>
      <td>
        Mengetahui,<br/>
        <strong>Kepala ${meta.schoolName}</strong>
        <br/><br/><br/><br/>
        <strong><u>${meta.headmasterName}</u></strong><br/>
        NIP. ${meta.headmasterNip}
      </td>
      <td>
        Rebang Tangkas, ${todayFormatted}<br/>
        <strong>Guru Mata Pelajaran PAI & BP</strong>
        <br/><br/><br/><br/>
        <strong><u>${meta.teacherName}</u></strong><br/>
        NIP. ${meta.teacherNip}
      </td>
    </tr>
  </table>
</div>
</body>
</html>`;

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8',
  });
  const cleanClass = meta.className.replace(/\s+/g, '_');
  downloadBlob(blob, `Jurnal_Sikap_Siswa_PAI_${cleanClass}_${new Date().toISOString().slice(0, 10)}.doc`);
};

export const exportAttitudeJournalToPdf = (
  meta: SchoolExportMeta,
  items: AttitudeRecordExportItem[]
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Kop Dinas
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('PEMERINTAH KABUPATEN WAY KANAN - DINAS PENDIDIKAN DAN KEBUDAYAAN', pageWidth / 2, 10, { align: 'center' });
  doc.setFontSize(13);
  doc.text(meta.schoolName.toUpperCase(), pageWidth / 2, 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`${meta.schoolAddress} | NSS: 201120803023 | NPSN: 10806871`, pageWidth / 2, 21, { align: 'center' });

  // Double Line
  doc.setLineWidth(0.6);
  doc.line(10, 23, pageWidth - 10, 23);
  doc.setLineWidth(0.2);
  doc.line(10, 24, pageWidth - 10, 24);

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('BUKU JURNAL PENGAMATAN SIKAP SISWA', pageWidth / 2, 29, { align: 'center' });
  doc.setFontSize(9);
  doc.text('MATA PELAJARAN: PENDIDIKAN AGAMA ISLAM DAN BUDI PEKERTI', pageWidth / 2, 34, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Tahun Ajaran ${meta.academicYear} | Semester ${meta.semester} | Kelas: ${meta.className}`, pageWidth / 2, 38.5, { align: 'center' });

  // Teacher Info
  doc.setFontSize(8);
  doc.text(`Guru Pengampu: ${meta.teacherName} (NIP. ${meta.teacherNip})`, 10, 43);
  doc.text(`Format Kertas: A4 Landscape`, pageWidth - 10, 43, { align: 'right' });

  // Table
  const tableData = items.map((item) => [
    item.no.toString(),
    item.timeStr,
    item.studentName,
    item.className,
    item.behaviorNote,
    item.attitudeItem,
    item.notes,
    '',
  ]);

  autoTable(doc, {
    startY: 45,
    margin: { left: 10, right: 10, bottom: 35 },
    head: [[
      'No',
      'Waktu',
      'Nama Siswa',
      'Kelas',
      'Catatan Perilaku',
      'Butir Sikap',
      'Keterangan',
      'Paraf',
    ]],
    body: tableData.length > 0 ? tableData : [['-', 'Belum ada data', '-', '-', '-', '-', '-', '-']],
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.15,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 26, halign: 'left' },
      2: { cellWidth: 42, halign: 'left' },
      3: { cellWidth: 16, halign: 'center' },
      4: { cellWidth: 'auto', halign: 'left' },
      5: { cellWidth: 28, halign: 'center' },
      6: { cellWidth: 35, halign: 'left' },
      7: { cellWidth: 14, halign: 'center' },
    },
    didDrawPage: (data) => {
      const pageHeight = doc.internal.pageSize.getHeight();
      const currentY = data.cursor ? data.cursor.y : 150;

      if (currentY + 30 <= pageHeight - 5) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        // Left
        doc.text('Mengetahui,', 40, currentY + 8, { align: 'center' });
        doc.text(`Kepala ${meta.schoolName}`, 40, currentY + 12, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.text(meta.headmasterName, 40, currentY + 26, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.text(`NIP. ${meta.headmasterNip}`, 40, currentY + 30, { align: 'center' });

        // Right
        const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        doc.text(`Rebang Tangkas, ${todayStr}`, pageWidth - 45, currentY + 8, { align: 'center' });
        doc.text('Guru Mata Pelajaran PAI & BP', pageWidth - 45, currentY + 12, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.text(meta.teacherName, pageWidth - 45, currentY + 26, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.text(`NIP. ${meta.teacherNip}`, pageWidth - 45, currentY + 30, { align: 'center' });
      }
    },
  });

  const cleanClass = meta.className.replace(/\s+/g, '_');
  doc.save(`Jurnal_Sikap_Siswa_PAI_${cleanClass}_${new Date().toISOString().slice(0, 10)}.pdf`);
};

// ============================================================================
// 3. ATTENDANCE MONTHLY (1-31) & RECAP EXPORTS (WORD & PDF)
// ============================================================================

export interface AttendanceMonthlyExportItem {
  no: number;
  studentNumber: string;
  studentName: string;
  gender: string;
  dailyStatus: Record<number, string>;
  rekapS: number;
  rekapI: number;
  rekapA: number;
  rekapJumlah: number;
  notes: string;
  accumS: number;
  accumI: number;
  accumA: number;
  accumJumlah: number;
}

export interface AttendanceRecapExportItem {
  no: number;
  studentNumber: string;
  studentName: string;
  gender: string;
  monthlyStats: Record<string, { s: number; i: number; a: number }>;
  totalS: number;
  totalI: number;
  totalA: number;
  totalAbsen: number;
  presentRate: string;
  notes: string;
}

export const exportAttendanceMonthlyToWord = (
  meta: SchoolExportMeta & { monthName: string; daysInMonth: number; semesterName: string },
  items: AttendanceMonthlyExportItem[]
) => {
  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const daysHeaderHtml = Array.from({ length: 31 }, (_, i) => i + 1)
    .map((d) => `<th style="width: 18px; text-align: center; font-size: 8pt; ${d > meta.daysInMonth ? 'background-color: #ddd;' : ''}">${d}</th>`)
    .join('');

  const tableRowsHtml = items
    .map((item) => {
      const daysCellsHtml = Array.from({ length: 31 }, (_, i) => i + 1)
        .map((d) => {
          if (d > meta.daysInMonth) return '<td style="background-color: #eee; text-align: center;">-</td>';
          const val = item.dailyStatus[d] || '.';
          let color = '#333';
          if (val === 'S') color = '#2563eb; font-weight: bold;';
          if (val === 'I') color = '#d97706; font-weight: bold;';
          if (val === 'A') color = '#dc2626; font-weight: bold;';
          return `<td style="text-align: center; color: ${color}; font-size: 8pt;">${val}</td>`;
        })
        .join('');

      return `
      <tr>
        <td style="text-align: center; font-weight: bold;">${item.no}</td>
        <td style="text-align: center; font-family: monospace;">${item.studentNumber}</td>
        <td style="text-align: left; font-weight: bold;">${item.studentName}</td>
        <td style="text-align: center;">${item.gender}</td>
        ${daysCellsHtml}
        <td style="text-align: center; font-weight: bold; color: #2563eb;">${item.rekapS || 0}</td>
        <td style="text-align: center; font-weight: bold; color: #d97706;">${item.rekapI || 0}</td>
        <td style="text-align: center; font-weight: bold; color: #dc2626;">${item.rekapA || 0}</td>
        <td style="text-align: center; font-weight: bold; background-color: #f8fafc;">${item.rekapJumlah || 0}</td>
        <td style="text-align: center; font-size: 8.5pt;">${item.accumS}/${item.accumI}/${item.accumA} (${item.accumJumlah})</td>
        <td style="text-align: left; font-size: 8pt;">${item.notes || '-'}</td>
      </tr>`;
    })
    .join('');

  const htmlContent = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>Buku Absensi Siswa Bulanan</title>
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
@page Section1 {
  size: 297mm 210mm;
  margin: 10mm 10mm 10mm 10mm;
  mso-page-orientation: landscape;
}
div.Section1 {
  page: Section1;
}
body {
  font-family: 'Times New Roman', Times, serif;
  font-size: 9pt;
  color: #000;
}
.header-box {
  text-align: center;
  border-bottom: 3px double #000;
  padding-bottom: 6px;
  margin-bottom: 10px;
}
.kop-title1 {
  font-size: 10pt;
  font-weight: bold;
  text-transform: uppercase;
}
.kop-school {
  font-size: 13pt;
  font-weight: bold;
  text-transform: uppercase;
}
.doc-title {
  font-size: 11pt;
  font-weight: bold;
  text-transform: uppercase;
  text-align: center;
  text-decoration: underline;
}
table.content-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 6px;
  font-size: 8pt;
}
table.content-table th, table.content-table td {
  border: 1px solid #000;
  padding: 3px 2px;
}
table.content-table th {
  background-color: #f1f5f9;
  text-align: center;
  font-weight: bold;
}
.sign-table {
  width: 100%;
  margin-top: 20px;
  border-collapse: collapse;
}
.sign-table td {
  border: none;
  width: 50%;
  text-align: center;
  font-size: 9pt;
}
</style>
</head>
<body>
<div class="Section1">
  <div class="header-box">
    <div class="kop-title1">Pemerintah Kabupaten Way Kanan &bull; Dinas Pendidikan dan Kebudayaan</div>
    <div class="kop-school">${meta.schoolName}</div>
    <div style="font-size: 8.5pt;">${meta.schoolAddress} &bull; NSS: 201120803023 &bull; NPSN: 10806871</div>
  </div>

  <div class="doc-title">BUKU DAFTAR HADIR / ABSENSI SISWA BULANAN</div>
  <div style="text-align:center; font-weight:bold; font-size: 9pt;">BULAN: ${meta.monthName.toUpperCase()} &bull; ${meta.semesterName.toUpperCase()} &bull; KELAS: ${meta.className}</div>
  <div style="text-align:center; font-size: 8.5pt; margin-bottom: 8px;">Tahun Ajaran ${meta.academicYear} &bull; Guru Mata Pelajaran: ${meta.teacherName} (NIP. ${meta.teacherNip})</div>

  <table class="content-table">
    <thead>
      <tr>
        <th rowspan="2" style="width: 24px;">No</th>
        <th rowspan="2" style="width: 60px;">NIS</th>
        <th rowspan="2" style="width: 140px;">Nama Peserta Didik</th>
        <th rowspan="2" style="width: 25px;">L/P</th>
        <th colspan="31">Tanggal Bulan ${meta.monthName} (1 - 31)</th>
        <th colspan="4">Rekap ${meta.monthName}</th>
        <th rowspan="2" style="width: 80px;">Akumulasi<br/>(S/I/A)</th>
        <th rowspan="2" style="width: 70px;">Ket</th>
      </tr>
      <tr>
        ${daysHeaderHtml}
        <th style="width: 20px; background-color: #dbeafe; color: #1e40af;">S</th>
        <th style="width: 20px; background-color: #fef3c7; color: #92400e;">I</th>
        <th style="width: 20px; background-color: #ffe4e6; color: #9f1239;">A</th>
        <th style="width: 26px; background-color: #f1f5f9;">Jml</th>
      </tr>
    </thead>
    <tbody>
      ${tableRowsHtml}
    </tbody>
  </table>

  <table class="sign-table">
    <tr>
      <td>
        Mengetahui,<br/>
        <strong>Kepala ${meta.schoolName}</strong>
        <br/><br/><br/><br/>
        <strong><u>${meta.headmasterName}</u></strong><br/>
        NIP. ${meta.headmasterNip}
      </td>
      <td>
        Rebang Tangkas, ${todayFormatted}<br/>
        <strong>Guru Mata Pelajaran PAI & BP</strong>
        <br/><br/><br/><br/>
        <strong><u>${meta.teacherName}</u></strong><br/>
        NIP. ${meta.teacherNip}
      </td>
    </tr>
  </table>
</div>
</body>
</html>`;

  const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword;charset=utf-8' });
  const cleanClass = meta.className.replace(/\s+/g, '_');
  downloadBlob(blob, `Absensi_Siswa_${meta.monthName}_${cleanClass}_${new Date().toISOString().slice(0, 10)}.doc`);
};

export const exportAttendanceMonthlyToPdf = (
  meta: SchoolExportMeta & { monthName: string; daysInMonth: number; semesterName: string },
  items: AttendanceMonthlyExportItem[]
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Kop Dinas
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('PEMERINTAH KABUPATEN WAY KANAN - DINAS PENDIDIKAN DAN KEBUDAYAAN', pageWidth / 2, 8, { align: 'center' });
  doc.setFontSize(12);
  doc.text(meta.schoolName.toUpperCase(), pageWidth / 2, 13, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`${meta.schoolAddress} | NSS: 201120803023 | NPSN: 10806871`, pageWidth / 2, 17, { align: 'center' });

  doc.setLineWidth(0.5);
  doc.line(8, 19, pageWidth - 8, 19);
  doc.setLineWidth(0.15);
  doc.line(8, 20, pageWidth - 8, 20);

  // Judul
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('BUKU DAFTAR HADIR / ABSENSI SISWA BULANAN (TANGGAL 1 - 31)', pageWidth / 2, 24.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Bulan: ${meta.monthName.toUpperCase()} | ${meta.semesterName.toUpperCase()} | Kelas: ${meta.className} | Tahun Ajaran: ${meta.academicYear}`, pageWidth / 2, 28.5, { align: 'center' });
  doc.setFontSize(7.5);
  doc.text(`Guru Pengampu: ${meta.teacherName} (NIP. ${meta.teacherNip})`, 8, 32);
  doc.text(`Keterangan Kode: [ . / H ] Hadir | [ S ] Sakit | [ I ] Izin | [ A ] Alpa`, pageWidth - 8, 32, { align: 'right' });

  // Columns: No, NIS, Nama, L/P, 1..31, S, I, A, Jml, Akumulasi, Ket
  const headRow1: any[] = [
    { content: 'No', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
    { content: 'NIS', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
    { content: 'Nama Siswa', rowSpan: 2, styles: { halign: 'left', valign: 'middle' } },
    { content: 'L/P', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
    { content: `Tanggal Bulan ${meta.monthName} (1 - 31)`, colSpan: 31, styles: { halign: 'center' } },
    { content: `Rekap ${meta.monthName}`, colSpan: 4, styles: { halign: 'center' } },
    { content: 'Akumulasi\n(S/I/A)', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
    { content: 'Ket', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
  ];

  const headRow2: any[] = [];
  for (let d = 1; d <= 31; d++) {
    headRow2.push({ content: d.toString(), styles: { halign: 'center', fontSize: 6.5 } });
  }
  headRow2.push({ content: 'S', styles: { halign: 'center', textColor: [30, 64, 175], fontStyle: 'bold' } });
  headRow2.push({ content: 'I', styles: { halign: 'center', textColor: [180, 83, 9], fontStyle: 'bold' } });
  headRow2.push({ content: 'A', styles: { halign: 'center', textColor: [185, 28, 28], fontStyle: 'bold' } });
  headRow2.push({ content: 'Jml', styles: { halign: 'center', fontStyle: 'bold' } });

  const bodyData = items.map((it) => {
    const row: any[] = [
      it.no.toString(),
      it.studentNumber,
      it.studentName,
      it.gender,
    ];

    for (let d = 1; d <= 31; d++) {
      if (d > meta.daysInMonth) {
        row.push('-');
      } else {
        row.push(it.dailyStatus[d] || '.');
      }
    }

    row.push(it.rekapS.toString());
    row.push(it.rekapI.toString());
    row.push(it.rekapA.toString());
    row.push(it.rekapJumlah.toString());
    row.push(`${it.accumS}/${it.accumI}/${it.accumA}`);
    row.push(it.notes || '-');

    return row;
  });

  autoTable(doc, {
    startY: 34,
    margin: { left: 8, right: 8, bottom: 30 },
    head: [headRow1, headRow2],
    body: bodyData,
    theme: 'grid',
    styles: {
      fontSize: 6.8,
      cellPadding: 1,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 16, halign: 'center' },
      2: { cellWidth: 38, halign: 'left' },
      3: { cellWidth: 8, halign: 'center' },
      // 31 days: each ~4.2mm
    },
    didDrawPage: (data) => {
      const pageHeight = doc.internal.pageSize.getHeight();
      const currentY = data.cursor ? data.cursor.y : 155;

      if (currentY + 28 <= pageHeight - 4) {
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        // Left
        doc.text('Mengetahui,', 40, currentY + 7, { align: 'center' });
        doc.text(`Kepala ${meta.schoolName}`, 40, currentY + 11, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.text(meta.headmasterName, 40, currentY + 23, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.text(`NIP. ${meta.headmasterNip}`, 40, currentY + 27, { align: 'center' });

        // Right
        const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        doc.text(`Rebang Tangkas, ${todayStr}`, pageWidth - 45, currentY + 7, { align: 'center' });
        doc.text('Guru Mata Pelajaran PAI & BP', pageWidth - 45, currentY + 11, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.text(meta.teacherName, pageWidth - 45, currentY + 23, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.text(`NIP. ${meta.teacherNip}`, pageWidth - 45, currentY + 27, { align: 'center' });
      }
    },
  });

  const cleanClass = meta.className.replace(/\s+/g, '_');
  doc.save(`Absensi_Siswa_${meta.monthName}_${cleanClass}_${new Date().toISOString().slice(0, 10)}.pdf`);
};

export const exportAttendanceRecapToWord = (
  meta: SchoolExportMeta & { semesterName: string; monthLabels: string[] },
  items: AttendanceRecapExportItem[]
) => {
  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const monthHeadHtml = meta.monthLabels
    .map((m) => `<th colspan="3" style="text-align: center;">${m}</th>`)
    .join('');

  const subHeadHtml = meta.monthLabels
    .map(() => '<th style="width: 18px; color: #1e40af;">S</th><th style="width: 18px; color: #92400e;">I</th><th style="width: 18px; color: #9f1239;">A</th>')
    .join('');

  const tableRowsHtml = items
    .map((item) => {
      const monthCellsHtml = meta.monthLabels
        .map((m) => {
          const st = item.monthlyStats[m] || { s: 0, i: 0, a: 0 };
          return `
            <td style="text-align: center; color: #1e40af;">${st.s || '-'}</td>
            <td style="text-align: center; color: #92400e;">${st.i || '-'}</td>
            <td style="text-align: center; color: #9f1239;">${st.a || '-'}</td>
          `;
        })
        .join('');

      return `
      <tr>
        <td style="text-align: center; font-weight: bold;">${item.no}</td>
        <td style="text-align: center; font-family: monospace;">${item.studentNumber}</td>
        <td style="text-align: left; font-weight: bold;">${item.studentName}</td>
        <td style="text-align: center;">${item.gender}</td>
        ${monthCellsHtml}
        <td style="text-align: center; font-weight: bold; background-color: #dbeafe; color: #1e40af;">${item.totalS}</td>
        <td style="text-align: center; font-weight: bold; background-color: #fef3c7; color: #92400e;">${item.totalI}</td>
        <td style="text-align: center; font-weight: bold; background-color: #ffe4e6; color: #9f1239;">${item.totalA}</td>
        <td style="text-align: center; font-weight: bold; background-color: #f1f5f9;">${item.totalAbsen}</td>
        <td style="text-align: center; font-weight: bold; color: #047857;">${item.presentRate}</td>
        <td style="text-align: left; font-size: 8pt;">${item.notes || '-'}</td>
      </tr>`;
    })
    .join('');

  const htmlContent = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>Rekapitulasi Akumulasi Absensi Siswa</title>
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
@page Section1 {
  size: 297mm 210mm;
  margin: 10mm 10mm 10mm 10mm;
  mso-page-orientation: landscape;
}
div.Section1 {
  page: Section1;
}
body {
  font-family: 'Times New Roman', Times, serif;
  font-size: 9pt;
  color: #000;
}
.header-box {
  text-align: center;
  border-bottom: 3px double #000;
  padding-bottom: 6px;
  margin-bottom: 10px;
}
.kop-title1 {
  font-size: 10pt;
  font-weight: bold;
  text-transform: uppercase;
}
.kop-school {
  font-size: 13pt;
  font-weight: bold;
  text-transform: uppercase;
}
.doc-title {
  font-size: 11pt;
  font-weight: bold;
  text-transform: uppercase;
  text-align: center;
  text-decoration: underline;
}
table.content-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 6px;
  font-size: 8pt;
}
table.content-table th, table.content-table td {
  border: 1px solid #000;
  padding: 4px 3px;
}
table.content-table th {
  background-color: #f1f5f9;
  text-align: center;
  font-weight: bold;
}
.sign-table {
  width: 100%;
  margin-top: 20px;
  border-collapse: collapse;
}
.sign-table td {
  border: none;
  width: 50%;
  text-align: center;
  font-size: 9pt;
}
</style>
</head>
<body>
<div class="Section1">
  <div class="header-box">
    <div class="kop-title1">Pemerintah Kabupaten Way Kanan &bull; Dinas Pendidikan dan Kebudayaan</div>
    <div class="kop-school">${meta.schoolName}</div>
    <div style="font-size: 8.5pt;">${meta.schoolAddress} &bull; NSS: 201120803023 &bull; NPSN: 10806871</div>
  </div>

  <div class="doc-title">REKAPITULASI AKUMULASI KEHADIRAN SISWA</div>
  <div style="text-align:center; font-weight:bold; font-size: 9pt;">${meta.semesterName.toUpperCase()} &bull; KELAS: ${meta.className}</div>
  <div style="text-align:center; font-size: 8.5pt; margin-bottom: 8px;">Tahun Ajaran ${meta.academicYear} &bull; Guru Mata Pelajaran: ${meta.teacherName} (NIP. ${meta.teacherNip})</div>

  <table class="content-table">
    <thead>
      <tr>
        <th rowspan="2" style="width: 26px;">No</th>
        <th rowspan="2" style="width: 65px;">NIS</th>
        <th rowspan="2" style="width: 150px;">Nama Peserta Didik</th>
        <th rowspan="2" style="width: 30px;">L/P</th>
        ${monthHeadHtml}
        <th colspan="4" style="background-color: #e2e8f0;">AKUMULASI TOTAL</th>
        <th rowspan="2" style="width: 50px;">% Hadir</th>
        <th rowspan="2" style="width: 80px;">Ket</th>
      </tr>
      <tr>
        ${subHeadHtml}
        <th style="width: 22px; background-color: #dbeafe; color: #1e40af;">S</th>
        <th style="width: 22px; background-color: #fef3c7; color: #92400e;">I</th>
        <th style="width: 22px; background-color: #ffe4e6; color: #9f1239;">A</th>
        <th style="width: 28px; background-color: #e2e8f0;">Jml</th>
      </tr>
    </thead>
    <tbody>
      ${tableRowsHtml}
    </tbody>
  </table>

  <table class="sign-table">
    <tr>
      <td>
        Mengetahui,<br/>
        <strong>Kepala ${meta.schoolName}</strong>
        <br/><br/><br/><br/>
        <strong><u>${meta.headmasterName}</u></strong><br/>
        NIP. ${meta.headmasterNip}
      </td>
      <td>
        Rebang Tangkas, ${todayFormatted}<br/>
        <strong>Guru Mata Pelajaran PAI & BP</strong>
        <br/><br/><br/><br/>
        <strong><u>${meta.teacherName}</u></strong><br/>
        NIP. ${meta.teacherNip}
      </td>
    </tr>
  </table>
</div>
</body>
</html>`;

  const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword;charset=utf-8' });
  const cleanClass = meta.className.replace(/\s+/g, '_');
  const cleanSem = meta.semesterName.replace(/\s+/g, '_');
  downloadBlob(blob, `Rekap_Akumulasi_Absensi_${cleanSem}_${cleanClass}_${new Date().toISOString().slice(0, 10)}.doc`);
};

export const exportAttendanceRecapToPdf = (
  meta: SchoolExportMeta & { semesterName: string; monthLabels: string[] },
  items: AttendanceRecapExportItem[]
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Kop Dinas
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('PEMERINTAH KABUPATEN WAY KANAN - DINAS PENDIDIKAN DAN KEBUDAYAAN', pageWidth / 2, 8, { align: 'center' });
  doc.setFontSize(12);
  doc.text(meta.schoolName.toUpperCase(), pageWidth / 2, 13, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`${meta.schoolAddress} | NSS: 201120803023 | NPSN: 10806871`, pageWidth / 2, 17, { align: 'center' });

  doc.setLineWidth(0.5);
  doc.line(8, 19, pageWidth - 8, 19);
  doc.setLineWidth(0.15);
  doc.line(8, 20, pageWidth - 8, 20);

  // Judul
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('REKAPITULASI AKUMULASI KEHADIRAN SISWA DARI SEMUA BULAN', pageWidth / 2, 24.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`${meta.semesterName.toUpperCase()} | KELAS: ${meta.className} | TAHUN AJARAN: ${meta.academicYear}`, pageWidth / 2, 28.5, { align: 'center' });
  doc.setFontSize(7.5);
  doc.text(`Guru Pengampu: ${meta.teacherName} (NIP. ${meta.teacherNip})`, 8, 32);
  doc.text(`Rekapitulasi Kehadiran Siswa (Sakit, Izin, Alpa)`, pageWidth - 8, 32, { align: 'right' });

  const headRow1: any[] = [
    { content: 'No', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
    { content: 'NIS', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
    { content: 'Nama Peserta Didik', rowSpan: 2, styles: { halign: 'left', valign: 'middle' } },
    { content: 'L/P', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
  ];

  meta.monthLabels.forEach((m) => {
    headRow1.push({ content: m, colSpan: 3, styles: { halign: 'center' } });
  });

  headRow1.push({ content: 'AKUMULASI TOTAL', colSpan: 4, styles: { halign: 'center', fillColor: [226, 232, 240] } });
  headRow1.push({ content: '% Hadir', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } });
  headRow1.push({ content: 'Ket', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } });

  const headRow2: any[] = [];
  meta.monthLabels.forEach(() => {
    headRow2.push({ content: 'S', styles: { halign: 'center', textColor: [30, 64, 175] } });
    headRow2.push({ content: 'I', styles: { halign: 'center', textColor: [180, 83, 9] } });
    headRow2.push({ content: 'A', styles: { halign: 'center', textColor: [185, 28, 28] } });
  });

  headRow2.push({ content: 'S', styles: { halign: 'center', fontStyle: 'bold', textColor: [30, 64, 175] } });
  headRow2.push({ content: 'I', styles: { halign: 'center', fontStyle: 'bold', textColor: [180, 83, 9] } });
  headRow2.push({ content: 'A', styles: { halign: 'center', fontStyle: 'bold', textColor: [185, 28, 28] } });
  headRow2.push({ content: 'Jml', styles: { halign: 'center', fontStyle: 'bold' } });

  const bodyData = items.map((it) => {
    const row: any[] = [
      it.no.toString(),
      it.studentNumber,
      it.studentName,
      it.gender,
    ];

    meta.monthLabels.forEach((m) => {
      const st = it.monthlyStats[m] || { s: 0, i: 0, a: 0 };
      row.push(st.s ? st.s.toString() : '-');
      row.push(st.i ? st.i.toString() : '-');
      row.push(st.a ? st.a.toString() : '-');
    });

    row.push(it.totalS.toString());
    row.push(it.totalI.toString());
    row.push(it.totalA.toString());
    row.push(it.totalAbsen.toString());
    row.push(it.presentRate);
    row.push(it.notes || '-');

    return row;
  });

  autoTable(doc, {
    startY: 34,
    margin: { left: 8, right: 8, bottom: 30 },
    head: [headRow1, headRow2],
    body: bodyData,
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.12,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 45, halign: 'left' },
      3: { cellWidth: 9, halign: 'center' },
    },
    didDrawPage: (data) => {
      const pageHeight = doc.internal.pageSize.getHeight();
      const currentY = data.cursor ? data.cursor.y : 155;

      if (currentY + 28 <= pageHeight - 4) {
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        // Left
        doc.text('Mengetahui,', 40, currentY + 7, { align: 'center' });
        doc.text(`Kepala ${meta.schoolName}`, 40, currentY + 11, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.text(meta.headmasterName, 40, currentY + 23, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.text(`NIP. ${meta.headmasterNip}`, 40, currentY + 27, { align: 'center' });

        // Right
        const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        doc.text(`Rebang Tangkas, ${todayStr}`, pageWidth - 45, currentY + 7, { align: 'center' });
        doc.text('Guru Mata Pelajaran PAI & BP', pageWidth - 45, currentY + 11, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.text(meta.teacherName, pageWidth - 45, currentY + 23, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.text(`NIP. ${meta.teacherNip}`, pageWidth - 45, currentY + 27, { align: 'center' });
      }
    },
  });

  const cleanClass = meta.className.replace(/\s+/g, '_');
  const cleanSem = meta.semesterName.replace(/\s+/g, '_');
  doc.save(`Rekap_Akumulasi_Absensi_${cleanSem}_${cleanClass}_${new Date().toISOString().slice(0, 10)}.pdf`);
};
