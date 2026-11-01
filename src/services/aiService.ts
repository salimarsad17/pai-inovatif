export interface AIGenerateRequest {
  topic: string;
  subTopic?: string;
  gradeLevel: number;
  semester: string;
  type:
    | 'full'
    | 'summary'
    | 'practice'
    | 'hots'
    | 'lkpd'
    | 'crossword'
    | 'quiz'
    | 'educational_game'
    | 'video_recs';
  customPrompt?: string;
}

export interface AIGenerateResponse {
  success: boolean;
  topic: string;
  subTopic?: string;
  gradeLevel: number;
  semester: string;
  type: string;
  content: string;
  error?: string;
  modelUsed?: string;
}

export function formatCleanErrorMessage(rawError: any): string {
  if (!rawError) return 'Terjadi kendala saat memproses permintaan AI.';
  const str = typeof rawError === 'string' ? rawError : String(rawError?.message || rawError);

  // Check if string is raw JSON or contains a JSON error block
  const jsonMatch = str.match(/\{[\s\S]*"error"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (
        parsed.error?.code === 503 ||
        parsed.error?.status === 'UNAVAILABLE' ||
        (parsed.error?.message && parsed.error.message.includes('high demand'))
      ) {
        return 'Layanan Gemini AI sedang mengalami lonjakan antrean sementara (503 High Demand). Silakan klik "Coba Lagi Sekarang".';
      }
      if (parsed.error?.message) {
        return parsed.error.message;
      }
    } catch {}
  }

  const lower = str.toLowerCase();
  if (
    lower.includes('503') ||
    lower.includes('high demand') ||
    lower.includes('unavailable') ||
    lower.includes('temporarily') ||
    lower.includes('overloaded') ||
    lower.includes('resource exhausted') ||
    lower.includes('429')
  ) {
    return 'Layanan Gemini AI sedang mengalami lonjakan antrean sementara (503 High Demand). Silakan klik "Coba Lagi Sekarang".';
  }

  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network error')
  ) {
    return 'Gagal terhubung ke server. Periksa koneksi internet Anda atau coba sesaat lagi.';
  }

  return str.replace(/^Error:\s*/, '');
}

export const aiService = {
  async checkStatus(): Promise<{ hasKey: boolean; model: string }> {
    try {
      const res = await fetch('/api/ai/status');
      if (!res.ok) throw new Error('Status endpoint error');
      return await res.json();
    } catch {
      return { hasKey: false, model: 'gemini-3.8-flash' };
    }
  },

  async generateMaterial(params: AIGenerateRequest): Promise<AIGenerateResponse> {
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}: Gagal menghasilkan bahan ajar dengan AI.`);
      }

      return data;
    } catch (err: any) {
      throw new Error(formatCleanErrorMessage(err));
    }
  },

  async generateMaterialStream(
    params: AIGenerateRequest,
    onChunk: (accumulated: string, delta: string) => void,
    signal?: AbortSignal,
    onStatus?: (statusText: string) => void
  ): Promise<string> {
    try {
      const response = await fetch('/api/ai/generate-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
        signal,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${response.status}: Gagal memulai stream.`);
      }

      if (!response.body) {
        throw new Error('ReadableStream tidak didukung browser ini.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulated = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          const dataStr = trimmed.slice(5).trim();
          if (dataStr === '[DONE]') {
            return accumulated;
          }

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.error) {
              throw new Error(formatCleanErrorMessage(parsed.error));
            }
            if (parsed.status && onStatus) {
              onStatus(parsed.status);
            }
            if (parsed.text) {
              accumulated += parsed.text;
              onChunk(accumulated, parsed.text);
            }
          } catch (e: any) {
            // Non-JSON SSE string or handled error
            if (e.message && e.message !== 'Unexpected token') {
              throw e;
            }
          }
        }
      }

      return accumulated;
    } catch (err: any) {
      if (signal?.aborted) {
        throw new Error('Generasi bahan ajar dihentikan oleh pengguna.');
      }
      console.warn('Streaming error, falling back to standard generate:', err.message);
      if (onStatus) {
        onStatus('Mengalihkan ke model cadangan atau mode standar...');
      }

      try {
        const fallbackRes = await this.generateMaterial(params);
        onChunk(fallbackRes.content, fallbackRes.content);
        return fallbackRes.content;
      } catch (fallbackErr: any) {
        throw new Error(formatCleanErrorMessage(fallbackErr));
      }
    }
  },
};
