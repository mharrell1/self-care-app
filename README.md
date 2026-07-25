# 🐸 Frogagotchi - Virtual Pet & Self-Care App

**[🌐 Play the Live Demo Here!](https://frog-self-care-170395053839.us-central1.run.app)**

A charming, 2000s-inspired retro pixel art web application designed to help you take care of yourself by taking care of a virtual pet frog! 

Earn coins and keep your frog happy by completing daily self-care tasks, tracking your water intake, practicing mindfulness, playing fun mini-games, snapping photobooth pictures, listening to ambient soundscapes, tracking check-in streaks, and reflecting in your secret journal.

## ✨ Key Features

- **Virtual Pet Companion (Frogagotchi)**: Keep your frog well-fed, happy, and clean. Their mood reflects how well you check in and care for them.
  - **Inactivity Decay System**: Stats decay by 15 points per 24 hours of inactivity.
  - **Drained State View**: If stats reach 0, your frog turns into a transparent sad frowning plush sticker until you care for them!
  - **Retro Coin Badge**: Displays coin balance in a Y2K gold pixel badge.
  - **Interactive Action Buttons**: Feed, Play, Water, Medicine, and Adventure buttons (sized at a comfortable retro 1.25rem layout).
  - **Floating Pixel Heart Boost**: Sized 36px transparent pixel heart with a pink glowing drop-shadow floats over your frog's head every time you feed, play, or boost your pet's happiness!
  - **Dynamic Pet View Container Height**: Window container expands downwards automatically to fit longer dresses and outfits without distorting frog scale.

- **Background & Customization Options**:
  - **9 Retro Background Themes**: Switch between `Default`, `Bedtime`, `Beach`, `Jungle`, `Ocean`, `Purple Sky`, `Rainbow`, and `Seasonal` (dynamically selects *Halloween*, *Thanksgiving*, *Christmas*, or *Easter* based on the closest upcoming holiday!).
  - **Custom Image Upload**: Upload any custom image file to use as your pet's backdrop.
  - **Vacation & Campsite Adventure Views**: View your equipped frog avatar in vacation mode or centered inside an outdoor campsite background frame during adventure logs.

- **Activity & Stats Center**:
  - **Monthly Active Calendar**: Navigate through all 12 months to see your activity history. The calendar marks every day you check in with a transparent pixel frog emoji marker (`pixel_frog_marker.png`).
  - **Interactive Day Activity Log**: Click any day on the calendar to view that day's uniquely assigned Froggy Affirmation, past journal entries, recorded moods, and self-care check-ins.
  - **Daily Check-In Streaks & Rewards**: Maintains consecutive check-in streaks and rewards users with bonus coins and Friendship XP.
  - **Pet Friendship Leveling System**: Level up your friendship status with your pet (Level 1: *New Friends* ➔ Level 2: *Good Pals* ➔ Level 3: *Best Friends* ➔ Level 4: *Soulmates* ➔ Level 5+: *Inseparable Partners*).
  - **Mood & Self-Care Analytics**: Toggle between Calendar View and Habit Correlation Insights showing how hydration, soundscapes, and journaling correlate with positive mood days for the selected month.

- **Self Care Suite**: 
  - **Pond Sound Machine**: A retro pixel music player featuring a Web Audio API ambient sound synthesizer engine with **Gentle Rain**, **Pond & Frogs** (soft water ripples with relaxing periodic frog croaks), and **Lofi Beats** (warm pentatonic synth chords).
  - **Daily Self-Care Checklist**: Custom daily checklist with default tasks (*Drink water*, *Make bed*, *Step outside*, *Stretch*) and custom task creation. Completing tasks rewards **+10 Coins** and **+10 Happiness** per task, with automatic daily resets.
  - **Mood Tracker**: Log your daily emotions using cute frog mood badges. Save your mood directly to a new journal entry with one click!
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

- **Mobile-Responsive Retro Y2K UI**: A cozy 2000s OS window interface with clean text options and multiple color themes (*Pink*, *Purple*, *Blue*, *Green*) optimized for desktop and mobile screens.

## 🚀 Tech Stack

- **Frontend**: React (with React Router)
- **Audio Engine**: Web Audio API Sound Synthesizer (Zero network dependency)
- **Build Tool**: Vite
- **Cloud & Deployment**: Google Cloud Run & Firebase Firestore / Storage
- **Styling**: Vanilla CSS with retro Y2K window borders and pixel fonts
- **Icons & Assets**: Custom Pixel Art Assets & Lucide React

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