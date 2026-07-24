# Frogagotchi App

A virtual pet application where you care for your virtual frog companion! Keep your frog happy, clean, and fed to earn coins and unlock new features.

## Recent Updates

- **Renamed App to Frogagotchi:** Updated all app branding and title headers.
- **Daily Self-Care Checklist:** Added custom daily self-care task list on the Care page with daily uncheck resets and +10 Coin / +10 Happiness completion rewards.
- **Pond Sound Machine:** Built-in Web Audio API ambient sound synthesizer engine with **Gentle Rain**, **Pond & Frogs** (soft water ripples with relaxing periodic frog croaks), and **Lofi Beats** (warm pentatonic synth chords). Features theme-matching LCD colors and custom block SVG control icons.
- **Guided Reflection Prompts:** Added 5 guided journal reflection prompts to the Secret Journal tab.
- **Journal Entry Rewards:** Earn **+15 Coins** and **+10 Happiness** per saved journal entry.
- **Daily Water Intake Tracker:** Track daily water cups on the dashboard to boost cleanliness and happiness.
- **Inactivity Decay & Drained Sticker:** Added 15-point/day stat decay system for 24h inactivity. Automatically swaps pet avatar to a sad frowning plush frog sticker with background removed when stats reach 0.
- **Photobooth Rendering Engine & Camera Roll Fixes:** Custom 2D canvas composite renderer with aspect-ratio containment (`drawContainImage`).
- **Interactive Closet:** Full drag-and-drop closet interface for customized clothing.

## Tech Stack
- React + Vite
- Web Audio API (Sound Synthesizers)
- Firebase Firestore & Storage
- React Router DOM
