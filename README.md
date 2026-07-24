# 🐸 Frogagotchi - Virtual Pet & Self-Care App

**[🌐 Play the Live Demo Here!](https://frog-self-care-170395053839.us-central1.run.app)**

A charming, 2000s-inspired retro pixel art web application designed to help you take care of yourself by taking care of a virtual pet frog! 

Earn coins and keep your frog happy by completing daily self-care tasks, tracking your water intake, practicing mindfulness, playing fun mini-games, snapping photobooth pictures, listening to ambient soundscapes, and reflecting in your secret journal.

## ✨ Key Features

- **Virtual Pet Companion (Frogagotchi)**: Keep your frog well-fed, happy, and clean. Their mood reflects how well you check in and care for them.
  - **Inactivity Decay System**: Stats decay by 15 points per 24 hours of inactivity.
  - **Drained State View**: If stats reach 0, your frog turns into a transparent sad frowning plush sticker until you care for them!
  - **Retro Coin Badge**: Displays coin balance in a Y2K gold pixel badge.
  - **Daily Water Intake Button**: Track your daily water cups on the dashboard to boost cleanliness (+10%) and happiness (+5%).
- **Self Care Suite**: 
  - **Pond Sound Machine**: A retro pixel music player featuring a Web Audio API ambient sound synthesizer engine with **Gentle Rain**, **Pond & Frogs** (soft water ripples with relaxing periodic frog croaks), and **Lofi Beats** (warm pentatonic synth chords). Styled with theme-matching LCD colors and block pixel SVG control icons.
  - **Daily Self-Care Checklist**: Custom daily checklist with default tasks (*Drink water*, *Make bed*, *Step outside*, *Stretch*) and custom task creation. Completing tasks rewards **+10 Coins** and **+10 Happiness** per task, with automatic daily resets.
  - **Mood Tracker**: Log your daily emotions using cute frog emoticons. Save your mood directly to a new journal entry with one click!
  - **Breathing Exercise**: Follow visual cues for a calming breathing cycle to center yourself. Space-optimized retro layout.
  - **Meditation Timer**: Set a timer and practice mindfulness to earn coins and happiness points.
- **Secret Journal**: A safe space to write down your daily thoughts and reflections. 
  - **Guided Reflection Prompts**: Choose from 5 guided prompts to kickstart your writing.
  - **Journal Entry Rewards**: Earn **+15 Coins** and **+10 Happiness** for saving reflection entries.
  - **Mood & Photo Imports**: Import your last saved mood or a photobooth picture directly into your entry.
- **Photobooth & Album**:
  - **Live Camera & Upload**: Take photos with your custom frog companion using your webcam or photo uploads.
  - **Draggable Frog & Outfits**: Position frog stickers with custom outfit selection (*Party Hat*, *Necklace*, *Basic Frog*).
  - **Pixel Control Bar**: Retro controls for camera feed, flash, front/rear camera toggle, and full-size photo album modal.
- **Mini-Games**: 
  - 🎣 **Fishing**: Timing-based mini-game to catch common, rare, and epic fish.
  - 🍳 **Cooking**: Prepare a delicious meal before the timer runs out by chopping, mixing, and cooking ingredients.
  - 🛁 **Bathing**: Pop bubbles to keep your frog squeaky clean!
  - 🐸 **Leaping Lilypads**: Hop through a vibrant pond! Hold to charge your jump and aim for the lilypads.
- **Dress Up & Customization**: Spend earned coins to buy cute accessories and freely customize your frog's outfit using a full drag-and-drop closet interface.
- **Mobile-Responsive Retro Y2K UI**: A cozy 2000s OS window interface with multiple color themes (*Pink*, *Purple*, *Blue*, *Green*) optimized for all desktop and mobile screens.

## 🚀 Tech Stack

- **Frontend**: React (with React Router)
- **Audio Engine**: Web Audio API Sound Synthesizer (Zero network dependency)
- **Build Tool**: Vite
- **Cloud & Deployment**: Google Cloud Run & Firebase Firestore / Storage
- **Styling**: Vanilla CSS with retro Y2K window borders and pixel fonts
- **Icons**: Custom Pixel Art Assets & Lucide React

## 💻 Running Locally

1. Navigate to the `app` directory:
   ```bash
   cd app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:5173` in your browser.

---
*Take care of yourself, and your Frogagotchi will take care of you!* 💚