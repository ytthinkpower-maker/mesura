import { Stack } from 'expo-router';

import { BrandColor } from '@/constants/brand';

/**
 * Where this group starts. Without it, a signed-out user is dropped on whichever
 * screen the router happened to register first — which is how you end up staring
 * at a code-entry form having never asked for a code.
 */
export const unstable_settings = {
  anchor: 'sign-in',
};

/**
 * The signed-out stack. No headers: each screen carries its own title, and the
 * only way back is the explicit link at the bottom of the form.
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: BrandColor.paper },
      }}
    />
  );
}
