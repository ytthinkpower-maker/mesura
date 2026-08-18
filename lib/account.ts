import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { USER_TABLES } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type AccountActionResult = { ok: true } | { ok: false; message: string };

/** What a user gets when they ask for their data. Everything, or an error. */
export type ExportedAccount = {
  exported_at: string;
  format_version: 1;
  account: { id: string; email: string | null; created_at: string };
  data: Record<string, unknown[]>;
};

/**
 * Reads every row the signed-in user owns.
 *
 * RLS does the filtering, so an unfiltered `select *` returns exactly this
 * user's rows and nothing else — the same guarantee the rest of the app relies
 * on. If a query fails, the whole export fails: a partial export that looks
 * complete is worse than no export.
 */
export async function buildAccountExport(): Promise<
  { ok: true; payload: ExportedAccount } | { ok: false; message: string }
> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { ok: false, message: 'You need to be signed in to export your data.' };
  }

  const data: Record<string, unknown[]> = {};

  for (const table of USER_TABLES) {
    const { data: rows, error } = await supabase.from(table).select('*');
    if (error) {
      return { ok: false, message: `Could not read your ${table.replace(/_/g, ' ')}. Try again.` };
    }
    data[table] = rows ?? [];
  }

  return {
    ok: true,
    payload: {
      exported_at: new Date().toISOString(),
      format_version: 1,
      account: {
        id: userData.user.id,
        email: userData.user.email ?? null,
        created_at: userData.user.created_at,
      },
      data,
    },
  };
}

/**
 * Builds the export, writes it to a cache file, and hands it to the iOS share
 * sheet. The cache directory is right for this: the file is a handoff artifact,
 * not something the app needs to keep.
 */
export async function exportAccountData(): Promise<AccountActionResult> {
  const built = await buildAccountExport();
  if (!built.ok) return built;

  if (!(await Sharing.isAvailableAsync())) {
    return { ok: false, message: 'Sharing is not available on this device.' };
  }

  try {
    const stamp = new Date().toISOString().slice(0, 10);
    const file = new File(Paths.cache, `mesura-data-${stamp}.json`);

    if (file.exists) file.delete();
    file.create();
    file.write(JSON.stringify(built.payload, null, 2));

    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      UTI: 'public.json',
      dialogTitle: 'Your Mesura data',
    });

    return { ok: true };
  } catch {
    return { ok: false, message: 'Could not prepare the file. Try again.' };
  }
}

/**
 * Deletes the account and every row belonging to it.
 *
 * The work happens in the `delete_account` Postgres function — see
 * [`supabase/schema.sql`](../supabase/schema.sql). Deleting the auth user does
 * not end the session on this device, so the local session is cleared after.
 * The sign-out is scoped `local` deliberately: the server-side session is
 * already gone with the user, and a global sign-out would just fail.
 */
export async function deleteAccount(): Promise<AccountActionResult> {
  const { error } = await supabase.rpc('delete_account');

  if (error) {
    return { ok: false, message: 'Could not delete your account. Try again, or contact support.' };
  }

  await supabase.auth.signOut({ scope: 'local' });
  return { ok: true };
}
