import axios, { AxiosInstance } from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Cache DB settings for 5 minutes to avoid hitting DB on every API call
let cachedSettings: { apiUrl: string; apiKey: string; orgSlug: string } | null = null;
let cacheExpiry = 0;

async function getTon80Settings() {
  if (cachedSettings && Date.now() < cacheExpiry) return cachedSettings;

  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: 'ton80' } });
    if (row) {
      const parsed = JSON.parse(row.value);
      cachedSettings = {
        apiUrl: parsed.apiUrl || process.env.TON80_API_URL || 'https://ton80.ca/api/v1',
        apiKey: parsed.apiKey || process.env.TON80_API_KEY || '',
        orgSlug: parsed.orgSlug || '',
      };
      cacheExpiry = Date.now() + 5 * 60 * 1000;
      return cachedSettings;
    }
  } catch {
    // DB unavailable — fall through to env vars
  }

  cachedSettings = {
    apiUrl: process.env.TON80_API_URL || 'https://ton80.ca/api/v1',
    apiKey: process.env.TON80_API_KEY || '',
    orgSlug: '',
  };
  cacheExpiry = Date.now() + 60 * 1000; // shorter cache on fallback
  return cachedSettings;
}

async function getClient(): Promise<AxiosInstance> {
  const settings = await getTon80Settings();
  const client = axios.create({
    baseURL: settings.apiUrl,
    timeout: 10000,
  });
  if (settings.apiKey) {
    client.defaults.headers.common['X-API-Key'] = settings.apiKey;
  }
  return client;
}

export async function lookupTon80Player(ton80Id: string) {
  const client = await getClient();
  const { data } = await client.get(`/players/${ton80Id}`);
  return data.data;
}

export async function getTon80PlayerStats(ton80Id: string) {
  const client = await getClient();
  const { data } = await client.get(`/players/${ton80Id}/stats`);
  return data.data;
}

export async function getTon80OrgMembers(slug?: string, page = 1, pageSize = 100) {
  const settings = await getTon80Settings();
  const orgSlug = slug || settings.orgSlug;
  if (!orgSlug) throw new Error('No organization slug configured');
  const client = await getClient();
  const { data } = await client.get(`/organizations/${orgSlug}/members`, {
    params: { page, pageSize },
  });
  return data.data;
}

/** Clear cached settings (call after admin saves new settings) */
export function clearTon80Cache() {
  cachedSettings = null;
  cacheExpiry = 0;
}
