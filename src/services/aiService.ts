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
    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Gagal menghasilkan bahan ajar dengan AI.');
    }

    return data;
  },

  async generateMaterialStream(
    params: AIGenerateRequest,
    onChunk: (accumulated: string, delta: string) => void,
    signal?: AbortSignal
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
              throw new Error(parsed.error);
            }
            if (parsed.text) {
              accumulated += parsed.text;
              onChunk(accumulated, parsed.text);
            }
          } catch (e: any) {
            // Non-JSON SSE string
            if (e.message && e.message !== 'Unexpected token') {
              throw e;
            }
          }
        }
      }

      return accumulated;
    } catch (err: any) {
      // If streaming fails or is aborted by non-abort reason, fallback to non-streaming
      if (signal?.aborted) {
        throw new Error('Generasi bahan ajar dihentikan oleh pengguna.');
      }
      console.warn('Streaming error, falling back to standard generate:', err.message);
      const fallbackRes = await this.generateMaterial(params);
      onChunk(fallbackRes.content, fallbackRes.content);
      return fallbackRes.content;
    }
  },
};

