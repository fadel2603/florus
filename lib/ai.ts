import { supabase } from './supabase';

const EDGE_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/ai-chat`;

type ClaudeBody = {
  model: string;
  max_tokens: number;
  system: string;
  messages: unknown[];
};

type ClaudeResponse = {
  content: Array<{ type: string; text: string }>;
  error?: { message: string };
};

export async function callClaude(body: ClaudeBody): Promise<ClaudeResponse> {
  const { data: { session } } = await supabase.auth.getSession();

  const res = await fetch(EDGE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session?.access_token ?? ''}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    const msg = data?.error?.message ?? data?.error ?? `Erreur ${res.status}`;
    console.warn('[AI] Edge Function error:', res.status, msg);
    throw new Error(msg);
  }

  return data;
}
