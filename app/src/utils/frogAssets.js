export const FROG_VERSIONS = [
  {
    id: 'base',
    name: 'Default',
    stickerImg: '/assets/frog_dressup_base.png',
    transparentImg: '/assets/frog_naked_transparent.png',
    description: 'Classic green plush frog'
  },
  {
    id: 'partyhat',
    name: 'Party Hat',
    stickerImg: '/assets/mugugins_partyhat_sticker_v2.png',
    transparentImg: '/assets/mugugins_partyhat_sticker_v2.png',
    description: 'Festive party hat frog'
  },
  {
    id: 'necklace',
    name: 'Necklace',
    stickerImg: '/assets/frog_necklace.png',
    transparentImg: '/assets/frog_necklace.png',
    description: 'Fancy beaded necklace frog'
  },
  {
    id: 'blue_shirt',
    name: 'Blue Shirt',
    stickerImg: '/assets/frog_blue_shirt.png?v=20260730_v4',
    transparentImg: '/assets/frog_blue_shirt.png?v=20260730_v4',
    description: 'Mugugins in tie-dye heart shirt'
  }
];

export function getFrogBaseImage(gameState) {
  if (!gameState) return '/assets/frog_dressup_base.png';
  const isFullyDrained = (gameState.happiness ?? 50) <= 0 || (gameState.hunger ?? 50) <= 0 || (gameState.cleanliness ?? 50) <= 0;
  if (isFullyDrained) return '/assets/frog_drained_clean.png?v=20260723_1945';
  if ((gameState.hunger ?? 50) < 30) return '/assets/frog_sad.png';

  const version = gameState.frogVersion;
  if (version === 'blue_shirt') return '/assets/frog_blue_shirt.png?v=20260730_v7';
  if (version === 'partyhat') return '/assets/frog_partyhat_base.png?v=20260730_v10';
  if (version === 'necklace') return '/assets/frog_necklace.png?v=20260730_v7';
  if (version === 'base') return '/assets/frog_dressup_base.png';

  // Fallback check on equipped items if frogVersion is not explicitly set
  const items = gameState.equippedItems || (gameState.equippedItem ? [gameState.equippedItem] : []);
  const itemNames = items.map(i => typeof i === 'object' ? i.name : i);
  if (itemNames.includes('blue_shirt_frog')) return '/assets/frog_blue_shirt.png?v=20260730_v7';
  if (itemNames.includes('partyhat')) return '/assets/frog_partyhat_base.png?v=20260730_v10';
  if (itemNames.includes('necklace')) return '/assets/frog_necklace.png?v=20260730_v7';

  return '/assets/frog_dressup_base.png';
}

export function getFrogTransparentImage(gameState) {
  if (!gameState) return '/assets/frog_naked_transparent.png';
  const version = gameState.frogVersion;
  if (version === 'blue_shirt') return '/assets/frog_blue_shirt_aligned.png?v=20260730_v4';
  if (version === 'partyhat') return '/assets/frog_partyhat_aligned.png?v=20260730_v3';
  if (version === 'necklace') return '/assets/frog_necklace_aligned.png?v=20260730_v3';
  return '/assets/frog_naked_transparent.png';
}
