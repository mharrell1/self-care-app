# Frog Self Care

A virtual pet application where you care for your frog! Keep your frog happy, clean, and fed to earn coins and unlock new features.

## Recent Updates

- **Photobooth Rendering Engine & Camera Roll Fixes:** Switched to a custom 2D canvas composite renderer with aspect-ratio containment (`drawContainImage`) that matches browser rendering exactly. Correctly parses custom coordinates (`top`/`left` drag percentages) of equipped accessories, fixing displaced/stretched clothing, and allows clean iOS/Android Camera Roll saving.
- **Journal Photo Imports:** Added support for importing photobooth photos directly into your journal entries with live creation/editing preview and deletion support.
- **Interactive Dress Up Closet:** Dress up your frog using a full drag-and-drop closet interface! Clothes hang on shelves and hangers until you drag them onto your frog.
- **Improved Item Sizing:** All clothing items have been meticulously scaled and positioned to perfectly fit the transparent frog base.
- **Frog Versions:** Swap between different versions of your frog base directly from the dashboard!
- **Fishing Minigame Enhancements:** Added more randomization to fish catches so it feels less repetitive.
- **Cooking Minigame Tweaks:** Improved placement of ingredients in the cooking game for a better aesthetic feel.

## Tech Stack
- React + Vite
- Firebase
- React Router DOM

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
