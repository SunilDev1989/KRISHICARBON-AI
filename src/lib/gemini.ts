/**
 * Centralised Gemini AI client — shared by all API routes.
 *
 * SDK v0.24.1 defaults to v1beta. The AQ.* key class from Google AI Studio
 * requires the stable v1 endpoint.
 *
 * Pattern: pass GEMINI_REQUEST_OPTIONS as the second arg to every
 * getGenerativeModel() call to override the API version per-request.
 *
 * Important: The Files API (fileData / fileUri parts) is v1beta-only.
 * When using v1, always use inlineData for all file types including PDFs.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';

const key = process.env.GEMINI_API_KEY ?? '';

export const genAI = new GoogleGenerativeAI(key);

/**
 * gemini-2.5-flash — confirmed live and working on this key (v1, free tier).
 * Supports: generateContent, inlineData (images + PDFs), countTokens.
 * 
 * Models available on this key (confirmed via ListModels):
 *   gemini-2.5-flash ✅  gemini-2.0-flash (quota exhausted)  gemini-2.5-pro
 *   gemini-2.0-flash-lite  gemini-2.5-flash-lite  gemini-3.5-flash
 */
export const GEMINI_MODEL = 'gemini-2.5-flash';

/** Ordered fallback list if primary model hits quota */
export const GEMINI_MODEL_FALLBACKS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-3.5-flash',
];

/**
 * Pass as second arg to getGenerativeModel() to force v1 endpoint.
 * e.g. genAI.getGenerativeModel({ model: GEMINI_MODEL }, GEMINI_REQUEST_OPTIONS)
 */
export const GEMINI_REQUEST_OPTIONS = { apiVersion: 'v1' } as const;
