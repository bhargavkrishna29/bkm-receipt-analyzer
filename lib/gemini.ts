// lib/gemini.ts — Gemini AI helpers (server-side only)
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash-lite';

export function getModel() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set');
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: GEMINI_MODEL });
}

export function parseGeminiJSON<T = Record<string, unknown>>(text: string): T {
  const clean = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('No JSON object found in Gemini response');
  }
  return JSON.parse(clean.slice(start, end + 1)) as T;
}

export function auditLog(
  request: Request,
  action: string,
  meta: Record<string, unknown> = {}
) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  const entry = {
    timestamp: new Date().toISOString(),
    action,
    ip,
    userAgent: request.headers.get('user-agent')?.slice(0, 120) ?? null,
    ...meta,
  };
  console.log(JSON.stringify({ level: 'audit', ...entry }));
}
