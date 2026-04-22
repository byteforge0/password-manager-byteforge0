const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const PBKDF2_ITERATIONS = 250000;

export function bufToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function base64ToBuf(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function randomBytes(length = 16) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

export async function deriveKey(masterPassword, saltBase64) {
  const salt = saltBase64 ? new Uint8Array(base64ToBuf(saltBase64)) : randomBytes(16);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(masterPassword),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  );

  return { key, saltBase64: bufToBase64(salt.buffer) };
}

export async function encryptVault(masterPassword, entries, existingSaltBase64) {
  const { key, saltBase64 } = await deriveKey(masterPassword, existingSaltBase64);
  const iv = randomBytes(12);
  const payload = {
    version: 1,
    updatedAt: new Date().toISOString(),
    entries,
  };

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(JSON.stringify(payload))
  );

  return {
    salt: saltBase64,
    iv: bufToBase64(iv.buffer),
    ciphertext: bufToBase64(ciphertext),
    iterations: PBKDF2_ITERATIONS,
    updatedAt: payload.updatedAt,
  };
}

export async function decryptVault(masterPassword, stored) {
  const { key } = await deriveKey(masterPassword, stored.salt);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(base64ToBuf(stored.iv)) },
    key,
    base64ToBuf(stored.ciphertext)
  );

  return JSON.parse(decoder.decode(plaintext));
}

export function generatePassword(length = 20) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()-_=+';
  const bytes = randomBytes(length);
  let output = '';

  for (let i = 0; i < length; i++) {
    output += chars[bytes[i] % chars.length];
  }

  return output;
}

export function getPasswordStrength(password) {
  let score = 0;

  if (password.length >= 10) score += 20;
  if (password.length >= 14) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[a-z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^A-Za-z0-9]/.test(password)) score += 20;

  const capped = Math.min(score, 100);

  if (capped < 45) return { score: capped, label: 'Weak', tone: 'weak' };
  if (capped < 75) return { score: capped, label: 'Good', tone: 'good' };
  return { score: capped, label: 'Strong', tone: 'strong' };
}
