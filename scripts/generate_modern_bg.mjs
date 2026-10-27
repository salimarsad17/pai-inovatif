import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('No GEMINI_API_KEY');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function run() {
  console.log('Generating ultra-modern Islamic educational wallpaper with Gemini 3.8 Flash...');
  const prompt = `
Create an ultra-modern, aesthetic, visually captivating widescreen vector SVG illustration (viewBox="0 0 1920 1080", preserveAspectRatio="xMidYMid slice", xmlns="http://www.w3.org/2000/svg").

Subject & Visual Theme:
"Modern Islamic Junior High School (SMP) Campus - Student Reading Al-Qur'an with Grand Modern Mosque and School"

Style:
- Ultra-modern, premium architectural digital art style (sleek, high-contrast, clean curves, futuristic-traditional blend like modern architecture of Masjid Al-Jabbar, Sheikh Zayed Solo, or contemporary Indonesian Islamic design).
- Rich cinematic lighting: dawn/sunrise golden hour transition into deep sapphire blue sky, soft ambient glow, volumetric sunbeams, warm rim light, and subtle glowing particles.

Key Elements:
1. Foreground (Right-Center):
   - A modern, politely sitting Indonesian junior high school student (SMP) wearing a crisp white uniform shirt, black velvet peci/songkok, and navy blue pants/sarong.
   - Reading the Holy Al-Qur'an resting on an elegant modern minimalist wooden rekal stand.
   - The open pages of the Quran emit a soft ethereal golden light (Nur Ilahi) with fine gold ornamental geometric patterns.
   - Beautiful soft lighting on the student's respectful expression, songkok, and hands.

2. Midground (Center & Right):
   - A breathtaking Modern Grand Mosque with a sleek translucent/metallic turquoise-emerald and gold geometric dome, soaring modern minarets with LED architectural accent lighting, glass archways, and reflecting water pool (kolam air pantul) reflecting the dome and sky.
   - Adjacent Modern Indonesian Junior High School Building (UPT SMPN 2 Rebang Tangkas) featuring contemporary white concrete and glass architecture, green louvers/sunshades, a manicured palm and floral courtyard, and an Indonesian Flag (Merah Putih) flying high on a sleek flagpole.

3. Background & Sky:
   - Deep cinematic morning twilight graduating from deep navy/midnight blue at the top (#071126) down to radiant golden amber (#f59e0b) and soft peach mist (#fda4af) near the horizon.
   - Subtle geometric Islamic star tessellations in the upper sky with low opacity (3-6%).
   - Gentle floating glowing bokeh orbs and morning mist.

4. Composition:
   - The left-to-center area is balanced and smooth so that a transparent glassmorphic login card sits over it with perfect legibility while allowing the stunning mosque, school, and student to frame it seamlessly.

Return ONLY the raw <svg ...>...</svg> markup. No markdown fences, no explanatory text.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
  });

  let raw = response.text || '';
  raw = raw.replace(/^```(?:xml|svg)?\s*/i, '').replace(/```\s*$/i, '').trim();

  const startIdx = raw.indexOf('<svg');
  const endIdx = raw.lastIndexOf('</svg>');

  if (startIdx !== -1 && endIdx !== -1) {
    const svgCode = raw.substring(startIdx, endIdx + 6);
    if (!fs.existsSync('public')) fs.mkdirSync('public', { recursive: true });
    fs.writeFileSync('public/login-background-modern.svg', svgCode);
    console.log('Saved to public/login-background-modern.svg! Bytes:', svgCode.length);
  } else {
    console.error('Failed to extract SVG markup.');
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
