# 🐸 Frogagotchi - Virtual Pet & Self-Care App

**[🌐 Play the Live Demo Here!](https://frog-self-care-170395053839.us-central1.run.app)**

A charming, 2000s-inspired retro pixel art web application designed to help you take care of yourself by taking care of a virtual pet frog! 

Earn coins and keep your frog happy by completing daily self-care tasks, tracking your water intake, practicing mindfulness, playing fun mini-games, snapping photobooth pictures, listening to ambient soundscapes, tracking check-in streaks, and reflecting in your secret journal.

## ✨ Key Features

- **Virtual Pet Companion (Frogagotchi)**: Keep your frog well-fed, happy, and clean. Their mood reflects how well you check in and care for them.
  - **Selectable Frog Versions**: Switch seamlessly between **Default**, **Party Hat**, **Necklace**, and **Blue Shirt** (Mugugins tie-dye shirt) frog versions!
  - **Frame-Aligned Scale**: All 4 frog versions share normalized canvas frames and identical proportions across Pet Care, Dress Up, Photobooth, and all Mini-Games.
  - **Inactivity Decay System**: Stats decay by 15 points per 24 hours of inactivity.
  - **Drained State View**: If stats reach 0, your frog turns into a sad frowning plush sticker until you care for them!
  - **Retro Coin Badge**: Displays coin balance in a Y2K gold pixel badge.
  - **Interactive Action Buttons**: Feed, Play, Water, Medicine, and Adventure buttons with active toggle shading.
  - **Floating Pixel Heart Boost**: Sized 36px transparent pixel heart with a pink glowing drop-shadow floats over your frog's head every time you feed, play, or boost your pet's happiness!
  - **Dynamic Pet View Container Height**: Window container expands downwards automatically to fit longer dresses and outfits without distorting frog scale.

- **Dress Up & Accessories**:
  - **Custom Wardrobe**: Dress your frog in bows, sunglasses, dresses, shirts, and purses (scaled up by +10% for enhanced visibility).
  - **Remove All Accessories**: One-click button in the Dress Up tab to quickly clear all equipped items.

- **Background & Customization Options**:
  - **9 Retro Background Themes**: Switch between `Default`, `Bedtime`, `Beach`, `Jungle`, `Ocean`, `Purple Sky`, `Rainbow`, and `Seasonal` (dynamically selects *Halloween*, *Thanksgiving*, *Christmas*, or *Easter* based on the closest upcoming holiday!).
  - **Custom Image Upload**: Upload any custom image file to use as your pet's backdrop.
  - **Vacation & Campsite Adventure Views**: View your equipped frog avatar in vacation mode or centered inside an outdoor campsite background frame during adventure logs.

- **Activity & Stats Center**:
  - **Monthly Active Calendar**: Navigate through all 12 months to see your activity history. The calendar marks every day you check in with a transparent pixel frog marker (`pixel_frog_marker.png`).
  - **Frog's Daily Adventures in Calendar**: Click any date in the calendar to view your frog's logged adventures for that date (location, story, and froggy lesson!).
  - **Accurate Mood Reflection**: Unlogged dates explicitly show `"No mood recorded"` (no default fallback). Logging a mood in Self Care instantly syncs across calendar views.
  - **Prev Day & Next Day Modal Navigation**: Scroll sequentially through past and future activity logs inside the day detail modal with one-click `Prev Day` and `Next Day` navigation controls.
  - **Unified Daily Affirmations**: Consistent date-hashed froggy affirmations shared across app launch modals and Stats calendar views.
  - **Daily Check-In Streaks & Rewards**: Maintains consecutive check-in streaks and rewards users with bonus coins and Friendship XP.
  - **Pet Friendship Leveling System**: Level up your friendship status with your pet (Level 1: *New Friends* ➔ Level 2: *Good Pals* ➔ Level 3: *Best Friends* ➔ Level 4: *Soulmates* ➔ Level 5+: *Inseparable Partners*).

- **Photobooth & Album**:
  - **Frog Frame Mode**: Frame your photobooth pictures with 20 evenly-spaced frogs lining the screen border (6 top, 6 bottom, 4 left, 4 right) with custom headwear clearance!
  - **Frog Version Choice**: Choose between `Current Outfit`, `Basic Frog`, `Party Hat`, `Necklace`, and `Blue Shirt` for single stickers and border frames.
  - **Live Camera & Dynamic Upload Sizing**: Take photos with your custom frog companion using your webcam or photo uploads with zero image cropping or cutoff.
  - **Portrait & Landscape Modes**: Framed camera orientation buttons for Macbook webcams.
  - **Interactive Placement Bounding Box**: Drag and enlarge frog stickers using a transparent dashed bounding box with corner resize handles (`↖`, `↗`, `↙`, `↘`).
  - **One-Click Save & Download**: Pressing `Save Photo` synchronously downloads the high-res PNG file to your computer's Downloads folder while instantly saving the photo into your Photobooth Album.

- **Self Care Suite**: 
  - **Pond Sound Machine**: A retro pixel music player featuring a Web Audio API ambient sound synthesizer engine with **Gentle Rain**, **Pond & Frogs**, and **Lofi Beats**.
  - **Daily Self-Care Checklist**: Custom daily checklist with default tasks (*Drink water*, *Make bed*, *Step outside*, *Stretch*) and custom task creation. Completing tasks rewards **+10 Coins** and **+10 Happiness** per task, with automatic daily resets.
  - **Mood Tracker**: Log your daily emotions using cute frog mood badges. Save your mood directly to a new journal entry with one click!
  - **Breathing Exercise & Meditation Timer**: Snug, edge-to-edge breathing window animation where your selected frog expands on inhale without excess surrounding whitespace.

- **Secret Journal**: A safe space to write down your daily thoughts and reflections. 
  - **Guided Reflection Prompts**: Choose from guided prompts to kickstart your writing.
  - **Journal Entry Rewards**: Earn **+15 Coins** and **+10 Happiness** for saving reflection entries.
  - **Mood & Photo Imports**: Import your last saved mood or a photobooth picture directly into your entry.

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