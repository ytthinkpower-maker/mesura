/**
 * Swap suggestions for the Urge SOS screen — one is shown per visit.
 *
 * Authored copy, bundled and versioned with the app. Rules these follow:
 * every one is doable within the twenty minutes an urge takes to pass, needs
 * nothing you have to go out and buy, and is phrased as an offer rather than
 * an instruction. None of them mention willpower, and none of them are
 * exclamations — this screen is a deep breath, not a pep talk.
 */

export const SWAP_SUGGESTIONS: string[] = [
  'Cold sparkling water with a wedge of lime, in a proper glass.',
  'Ten minutes outside, phone left on the table.',
  'A pot of strong mint tea, made slowly.',
  'The washing up, start to finish, hot water and all.',
  'One song with headphones on and the lights off.',
  'A shower hot enough to fog the mirror.',
  'Text one person something you have been meaning to say.',
  'Twenty press-ups, or twenty of whatever you can do.',
  'Tonic and bitters over ice, with the same ritual as the real thing.',
  'Step outside and find three things you can hear.',
  'Cook something that takes both hands.',
  'A cup of cocoa, made on the hob rather than in the microwave.',
  'Ten minutes of a book, paper or otherwise.',
  'Put on the kettle and stand there until it boils.',
  'Cold water on your wrists and the back of your neck.',
];

/**
 * Cycles through the list rather than picking at random, so two consecutive
 * visits can never land on the same suggestion. The starting point is random
 * so the order is not identical every time the app launches.
 */
let nextIndex = Math.floor(Math.random() * SWAP_SUGGESTIONS.length);

export function nextSwapSuggestion(): string {
  const suggestion = SWAP_SUGGESTIONS[nextIndex];
  nextIndex = (nextIndex + 1) % SWAP_SUGGESTIONS.length;
  return suggestion;
}
