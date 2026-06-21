'use client';

import { useCallback } from 'react';

function tryParseJSON<T>(raw: string): T | null {
  const cleaned = raw.replace(/```(?:json)?/gi, '').trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Try to salvage the first JSON object/array from a mixed response.
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    const start =
      firstBrace === -1 ? firstBracket :
      firstBracket === -1 ? firstBrace :
      Math.min(firstBrace, firstBracket);
    if (start === -1) return null;

    const lastBrace = cleaned.lastIndexOf('}');
    const lastBracket = cleaned.lastIndexOf(']');
    const end = Math.max(lastBrace, lastBracket);
    if (end <= start) return null;

    const candidate = cleaned.slice(start, end + 1);
    try {
      return JSON.parse(candidate) as T;
    } catch {
      return null;
    }
  }
}

export function useGroq() {
  const getModel = () => {
    if (typeof window === 'undefined') return 'llama-3.1-8b-instant';
    return localStorage.getItem('groq_model') || 'llama-3.1-8b-instant';
  };

  const getTemperature = () => {
    if (typeof window === 'undefined') return 0.7;
    return parseFloat(localStorage.getItem('groq_temp') || '0.7');
  };

  const complete = useCallback(async (prompt: string, systemPrompt = '') => {
    const response = await fetch('/api/groq', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        systemPrompt: systemPrompt || 'You are a helpful CMS assistant.',
        model: getModel(),
        temperature: getTemperature()
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Groq API error');
    }

    return data.content;
  }, []);

  const completeJSON = useCallback(async <T>(prompt: string, systemPrompt: string): Promise<T | null> => {
    try {
      const raw = await complete(prompt, systemPrompt + ' Always respond with valid JSON only.');
      return tryParseJSON<T>(raw);
    } catch {
      return null;
    }
  }, [complete]);

  // API key is now server-side, so it's always "configured"
  const isConfigured = true;

  return { complete, completeJSON, isConfigured };
}
