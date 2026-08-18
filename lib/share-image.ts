/**
 * Turning a rendered card into a file the share sheet will accept.
 *
 * `react-native-svg` hands back a base64 PNG and `expo-sharing` wants a file
 * URI, so the only real work here is the decode in between. It is written out
 * by hand rather than pulled from a package because the alternative is either a
 * new dependency or the legacy `expo-file-system` API, and thirty lines of
 * arithmetic is cheaper than both.
 */

import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const LOOKUP = new Uint8Array(128);
for (let index = 0; index < ALPHABET.length; index += 1) {
  LOOKUP[ALPHABET.charCodeAt(index)] = index;
}

/**
 * Base64 to bytes.
 *
 * Anything outside the alphabet is dropped first, which handles the `=` padding
 * and a `data:image/png;base64,` prefix in the same pass.
 */
export function decodeBase64(input: string): Uint8Array {
  const clean = input.replace(/[^A-Za-z0-9+/]/g, '');
  const bytes = new Uint8Array(Math.floor((clean.length * 3) / 4));

  let buffer = 0;
  let bits = 0;
  let out = 0;

  for (let index = 0; index < clean.length; index += 1) {
    buffer = (buffer << 6) | LOOKUP[clean.charCodeAt(index)];
    bits += 6;

    if (bits >= 8) {
      bits -= 8;
      bytes[out] = (buffer >> bits) & 0xff;
      out += 1;
    }
  }

  return bytes;
}

export type ShareResult = { ok: true } | { ok: false; message: string };

/**
 * Writes the PNG to the cache and opens the iOS share sheet on it.
 *
 * The cache is the right home: the file exists to be handed to another app, and
 * once that has happened the system is welcome to reclaim it. Saving to Photos
 * is one of the options the share sheet offers, so the app never has to ask for
 * the photo library permission that would come with doing it directly.
 */
export async function sharePngBase64(base64: string, filename: string): Promise<ShareResult> {
  if (!(await Sharing.isAvailableAsync())) {
    return { ok: false, message: 'Sharing is not available on this device.' };
  }

  try {
    const file = new File(Paths.cache, filename);
    if (file.exists) file.delete();
    file.create();
    file.write(decodeBase64(base64));

    await Sharing.shareAsync(file.uri, {
      mimeType: 'image/png',
      UTI: 'public.png',
      dialogTitle: 'Share your milestone',
    });

    return { ok: true };
  } catch {
    return { ok: false, message: 'Could not prepare the image. Try again.' };
  }
}
