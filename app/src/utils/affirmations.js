export const FROG_AFFIRMATIONS = [
  "Even on rainy days, a frog knows how to leap with joy!",
  "Take it one lilypad hop at a time—you are making progress!",
  "It is totally un-frog-gettable how amazing and strong you are!",
  "Rest on your lilypad today. You don't always have to be leaping!",
  "Your kindness is toad-ally magical and brightens the whole pond!",
  "You are ribbit-ing with potential and capable of great things!",
  "Drink your water, breathe deeply, and enjoy calm pond waters.",
  "Small hops every day add up to giant leaps over time!",
  "Bask in the warm sun and be proud of how far you've come.",
  "You are deserving of love, peace, and plenty of cozy pond moments.",
  "Never let anyone dull your shine—you are a masterpiece in this pond!",
  "Keep your head above water and remember you've got this!",
  "A quiet pond brings clarity. Give yourself time to relax.",
  "You are toad-ally awesome, just by being yourself!",
  "Hop into today with confidence and a gentle smile.",
  "Surround yourself with cozy waters and uplifting thoughts.",
  "Every lilypad is a new opportunity to rest and recharge.",
  "You bring balance and harmony to your little corner of the world.",
  "No matter how murky the water gets, your inner light shines bright.",
  "Be patient with your growth—tadpoles take time to blossom into frogs!",
  "Your heart is full of wonder, strength, and endless warmth.",
  "Enjoy the sweet sound of rain and let your worries wash away.",
  "You are strong enough to splash through any obstacle today.",
  "Take a deep breath and listen to the soothing rhythm of nature.",
  "Your resilience is un-frog-gettable. Keep hopping forward!",
  "Pond life is sweet when you take time to care for your heart.",
  "Celebrate your progress today—every hop counts!",
  "You are a precious part of this pond. Never forget your worth.",
  "Embrace your unique splash—the world needs your light!",
  "Croak your truth with confidence and live authentically!"
];

export function getFrogAffirmationForDate(year, month, dayNum) {
  const monthStr = String(month + 1).padStart(2, '0');
  const dayStr = String(dayNum).padStart(2, '0');
  const dateStr = `${year}-${monthStr}-${dayStr}`;
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % FROG_AFFIRMATIONS.length;
  return FROG_AFFIRMATIONS[index];
}

export function getDailyFrogAffirmation() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();
  const todayISO = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  try {
    const cached = localStorage.getItem(`frog_daily_affirmation_${todayISO}`);
    if (cached) return cached;
  } catch (e) {}

  const affirmation = getFrogAffirmationForDate(year, month, day);
  try {
    localStorage.setItem(`frog_daily_affirmation_${todayISO}`, affirmation);
  } catch (e) {}
  return affirmation;
}
