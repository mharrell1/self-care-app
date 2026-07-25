// One-time cleanup: removes "2026-07-25" from all users' activeDays
// Uses firebase-admin with Application Default Credentials (gcloud auth)
// Run: npm install firebase-admin && node cleanup-active-day.js

process.env.GOOGLE_CLOUD_PROJECT = 'self-care-app-29745';

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const app = initializeApp({
  credential: applicationDefault(),
  projectId: 'self-care-app-29745',
});

const db = getFirestore(app);

async function removeBadActiveDay() {
  const BAD_DATE = '2026-07-25';
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  let count = 0;
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const activeDays = data.activeDays || [];
    if (activeDays.includes(BAD_DATE)) {
      const filtered = activeDays.filter(d => d !== BAD_DATE);
      await docSnap.ref.update({ activeDays: filtered });
      console.log(`✅ Cleaned userId: ${docSnap.id} — removed ${BAD_DATE}`);
      count++;
    }
  }

  if (count === 0) {
    console.log('ℹ️  No users had 2026-07-25 in their activeDays.');
  } else {
    console.log(`\n🎉 Done! Cleaned ${count} user(s).`);
  }
  process.exit(0);
}

removeBadActiveDay().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
