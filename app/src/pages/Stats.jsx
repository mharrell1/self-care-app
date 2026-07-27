import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { getJournalEntries, getMoodHistory } from '../services/db';
import { getFrogAffirmationForDate, getDailyFrogAffirmation } from '../utils/affirmations';

export default function Stats() {
  const navigate = useNavigate();
  const { userId, gameState, updateGameState } = useGame();
  const [selectedDayLog, setSelectedDayLog] = useState(null);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'analytics'
  const [journalEntries, setJournalEntries] = useState([]);
  const [moodHistory, setMoodHistory] = useState([]);

  // Today's actual date (never changes)
  const todayDate = new Date();
  const todayYear = todayDate.getFullYear();
  const todayMonth = todayDate.getMonth();
  const todayDay = todayDate.getDate();

  // Navigable calendar month/year (starts at current month)
  const [calendarYear, setCalendarYear] = useState(todayYear);
  const [calendarMonth, setCalendarMonth] = useState(todayMonth);

  useEffect(() => {
    if (userId) {
      getJournalEntries(userId).then(entries => setJournalEntries(entries || []));
      getMoodHistory(userId).then(moods => setMoodHistory(moods || []));
    }
  }, [userId]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Navigate calendar months
  const goToPrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(y => y - 1);
    } else {
      setCalendarMonth(m => m - 1);
    }
    setSelectedDayLog(null);
  };

  const goToNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(y => y + 1);
    } else {
      setCalendarMonth(m => m + 1);
    }
    setSelectedDayLog(null);
  };

  const goToCurrentMonth = () => {
    setCalendarYear(todayYear);
    setCalendarMonth(todayMonth);
    setSelectedDayLog(null);
  };

  // Calculate days in the viewed calendar month
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();

  // Is the calendar showing the current real month?
  const isCurrentMonth = calendarYear === todayYear && calendarMonth === todayMonth;

  // Friendship Level Titles
  const getFriendshipTitle = (level) => {
    if (level >= 5) return "Inseparable Partners";
    if (level === 4) return "Soulmates";
    if (level === 3) return "Best Friends";
    if (level === 2) return "Good Pals";
    return "New Friends";
  };

  const currentLevel = gameState?.friendshipLevel || 1;
  const currentXP = gameState?.friendshipXP || 0;
  const friendshipTitle = getFriendshipTitle(currentLevel);

  // Active Days list (format: YYYY-MM-DD)
  const activeDays = Array.isArray(gameState?.activeDays) ? gameState.activeDays : [];

  // Helper to format ISO date string for the viewed calendar month
  const getISODateForDay = (dayNum) => {
    const monthStr = String(calendarMonth + 1).padStart(2, '0');
    const dayStr = String(dayNum).padStart(2, '0');
    return `${calendarYear}-${monthStr}-${dayStr}`;
  };

  const handleDayClick = (dayNum, targetYear = calendarYear, targetMonth = calendarMonth) => {
    const monthStr = String(targetMonth + 1).padStart(2, '0');
    const dayStr = String(dayNum).padStart(2, '0');
    const dateISO = `${targetYear}-${monthStr}-${dayStr}`;
    const dateObj = new Date(targetYear, targetMonth, dayNum);
    const dateDisplay = dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

    if (targetYear !== calendarYear || targetMonth !== calendarMonth) {
      setCalendarYear(targetYear);
      setCalendarMonth(targetMonth);
    }

    // Find journal entries for this date
    const dayJournals = journalEntries.filter(entry => {
      if (!entry.date) return false;
      const d = new Date(entry.date);
      return d.getFullYear() === targetYear && d.getMonth() === targetMonth && d.getDate() === dayNum;
    });

    // Find mood for this date (check gameState.dailyMoodLogs first, then moodHistory)
    let dayMood = gameState?.dailyMoodLogs?.[dateISO];
    if (!dayMood) {
      const foundMood = moodHistory.slice().reverse().find(m => {
        if (!m.date) return false;
        const d = new Date(m.date);
        return d.getFullYear() === targetYear && d.getMonth() === targetMonth && d.getDate() === dayNum;
      });
      if (foundMood) dayMood = foundMood.mood;
    }

    // Find frog's adventures for this date
    const allAdventures = Array.isArray(gameState?.dailyAdventures) ? gameState.dailyAdventures : [];
    const dayAdventures = allAdventures.filter(adv => {
      if (adv.dateISO) return adv.dateISO === dateISO;
      if (adv.timestamp) {
        const d = new Date(adv.timestamp);
        const advISO = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return advISO === dateISO;
      }
      return false;
    });

    // Include pending/last adventure if dateISO matches and not already in array
    const checkAndAddAdv = (adv) => {
      if (!adv) return;
      const advISO = adv.dateISO || (adv.timestamp ? `${new Date(adv.timestamp).getFullYear()}-${String(new Date(adv.timestamp).getMonth() + 1).padStart(2, '0')}-${String(new Date(adv.timestamp).getDate()).padStart(2, '0')}` : null);
      if (advISO === dateISO && !dayAdventures.some(a => a.timestamp === adv.timestamp || (a.location === adv.location && a.story === adv.story))) {
        dayAdventures.push(adv);
      }
    };
    checkAndAddAdv(gameState?.pendingAdventure);
    checkAndAddAdv(gameState?.lastAdventure);

    // Every day gets its own unique affirmation based on the date (today uses cached daily affirmation)
    const todayObj = new Date();
    const isToday = (targetYear === todayObj.getFullYear() && targetMonth === todayObj.getMonth() && dayNum === todayObj.getDate());
    const affirmation = isToday ? getDailyFrogAffirmation() : getFrogAffirmationForDate(targetYear, targetMonth, dayNum);

    setSelectedDayLog({
      dayNum,
      year: targetYear,
      month: targetMonth,
      dateISO,
      dateDisplay,
      isActive: activeDays.includes(dateISO) || dayJournals.length > 0 || !!dayMood || dayAdventures.length > 0,
      mood: dayMood || 'No mood recorded',
      journals: dayJournals,
      adventures: dayAdventures,
      affirmation
    });
  };

  const handlePrevDay = () => {
    if (!selectedDayLog) return;
    const curDate = new Date(selectedDayLog.year ?? calendarYear, selectedDayLog.month ?? calendarMonth, selectedDayLog.dayNum);
    curDate.setDate(curDate.getDate() - 1);
    handleDayClick(curDate.getDate(), curDate.getFullYear(), curDate.getMonth());
  };

  const handleNextDay = () => {
    if (!selectedDayLog) return;
    const curDate = new Date(selectedDayLog.year ?? calendarYear, selectedDayLog.month ?? calendarMonth, selectedDayLog.dayNum);
    curDate.setDate(curDate.getDate() + 1);
    handleDayClick(curDate.getDate(), curDate.getFullYear(), curDate.getMonth());
  };

  const handleDrinkWater = () => {
    const todayStr = new Date().toLocaleDateString();
    let currentCount = gameState?.waterCount || 0;
    if (gameState?.lastWaterDate !== todayStr) {
      currentCount = 0;
    }
    updateGameState({
      waterCount: currentCount + 1,
      lastWaterDate: todayStr,
      cleanliness: Math.min(100, (gameState?.cleanliness ?? 50) + 10),
      happiness: Math.min(100, (gameState?.happiness ?? 50) + 5)
    });
  };

  return (
    <div style={{ padding: '0.5rem' }}>
      <h2 style={{ fontFamily: 'var(--header-font)', fontSize: '0.95rem', color: 'var(--primary-color)', textAlign: 'center', marginBottom: '0.75rem' }}>
        Pet Statistics & Activity History
      </h2>

      {/* Friendship Level Card */}
      <div style={{
        backgroundColor: '#fff',
        border: '3px solid var(--window-border-dark)',
        borderRadius: '8px',
        padding: '0.75rem',
        marginBottom: '0.75rem',
        boxShadow: '2px 2px 0px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
          <div>
            <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              {gameState?.petName || 'Froggy'}'s Friendship: Level {currentLevel}
            </strong>
            <div style={{ fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>
              Rank: {friendshipTitle}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#2e7d32' }}>
              {currentXP} / 100 XP
            </span>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div style={{
          height: '14px',
          backgroundColor: '#e0e0e0',
          borderRadius: '7px',
          border: '2px solid var(--window-border-dark)',
          overflow: 'hidden',
          marginBottom: '0.4rem'
        }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, currentXP)}%`,
            backgroundColor: 'var(--window-title-bg)',
            transition: 'width 0.4s ease'
          }} />
        </div>
        
        <p style={{ margin: 0, fontSize: '0.75rem', color: '#555', fontStyle: 'italic', textAlign: 'center' }}>
          Open the app daily & complete self-care tasks to level up your friendship!
        </p>
      </div>

      {/* Daily Streak Banner */}
      <div style={{
        backgroundColor: 'var(--primary-light)',
        border: '2px solid var(--window-border)',
        borderRadius: '6px',
        padding: '0.5rem 0.75rem',
        marginBottom: '0.75rem',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <strong style={{ fontSize: '0.9rem', color: 'var(--primary-color)' }}>
            Check-In Streak: {gameState?.checkInStreak || 1} Days
          </strong>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>
            Daily Reward Active (+15 Coins & +20 Friendship XP)
          </div>
        </div>
        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
          Streak Active
        </div>
      </div>

      {/* Moved Water Intake Tracker */}
      <div style={{
        backgroundColor: '#fff',
        border: '2px solid var(--window-border-dark)',
        borderRadius: '8px',
        padding: '0.75rem',
        marginBottom: '0.75rem',
        textAlign: 'center'
      }}>
        <h3 style={{ fontFamily: 'var(--header-font)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
          Water Intake Tracker
        </h3>
        <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Track your daily hydration (Goal: 8 Cups)</p>
        
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(cupNum => {
            const isFilled = (gameState?.waterCount || 0) >= cupNum;
            return (
              <div 
                key={cupNum}
                style={{
                  width: '28px',
                  height: '34px',
                  border: '2px solid var(--window-border-dark)',
                  borderRadius: '0 0 6px 6px',
                  backgroundColor: isFilled ? 'var(--window-title-bg)' : '#e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  color: isFilled ? 'var(--window-title-text)' : '#757575',
                  transition: 'all 0.2s ease'
                }}
              >
                {cupNum}
              </div>
            );
          })}
        </div>

        <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
          {gameState?.waterCount || 0} / 8 Cups Drunk Today
        </div>

        <button 
          className="btn" 
          onClick={handleDrinkWater}
          style={{ padding: '0.3rem 1rem', fontSize: '0.85rem', fontWeight: 'bold' }}
        >
          + Drink 1 Cup
        </button>
      </div>

      {/* View Switcher: Calendar vs Analytics */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <button 
          className="btn"
          onClick={() => setViewMode('calendar')}
          style={{
            fontWeight: viewMode === 'calendar' ? 'bold' : 'normal',
            backgroundColor: viewMode === 'calendar' ? 'var(--window-title-bg)' : 'var(--button-bg)',
            color: viewMode === 'calendar' ? 'var(--window-title-text)' : 'var(--text-primary)'
          }}
        >
          Monthly Active Calendar
        </button>
        <button 
          className="btn"
          onClick={() => setViewMode('analytics')}
          style={{
            fontWeight: viewMode === 'analytics' ? 'bold' : 'normal',
            backgroundColor: viewMode === 'analytics' ? 'var(--window-title-bg)' : 'var(--button-bg)',
            color: viewMode === 'analytics' ? 'var(--window-title-text)' : 'var(--text-primary)'
          }}
        >
          Mood & Self-Care Analytics
        </button>
      </div>

      {/* CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <div style={{
          backgroundColor: '#fff',
          border: '2px solid var(--window-border-dark)',
          borderRadius: '8px',
          padding: '0.75rem',
          marginBottom: '0.75rem'
        }}>
          {/* Month Navigation Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <button
              onClick={goToPrevMonth}
              style={{ background: 'none', border: '2px solid var(--window-border-dark)', borderRadius: '4px', cursor: 'pointer', padding: '0.15rem 0.5rem', fontWeight: 'bold', fontSize: '1rem', lineHeight: '1', color: 'var(--primary-color)' }}
              aria-label="Previous month"
            >‹</button>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontFamily: 'var(--header-font)', fontSize: '0.85rem', margin: 0 }}>
                {monthNames[calendarMonth]} {calendarYear}
              </h3>
              {!isCurrentMonth && (
                <button
                  onClick={goToCurrentMonth}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.7rem', color: 'var(--primary-color)', textDecoration: 'underline', padding: 0, marginTop: '2px' }}
                >
                  Back to Today
                </button>
              )}
            </div>
            <button
              onClick={goToNextMonth}
              style={{ background: 'none', border: '2px solid var(--window-border-dark)', borderRadius: '4px', cursor: 'pointer', padding: '0.15rem 0.5rem', fontWeight: 'bold', fontSize: '1rem', lineHeight: '1', color: 'var(--primary-color)' }}
              aria-label="Next month"
            >›</button>
          </div>

          {/* Day-of-week headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '0.3rem', fontWeight: 'bold', fontSize: '0.75rem', color: '#555' }}>
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {/* Empty offset cells for start of month */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} style={{ minHeight: '38px', backgroundColor: '#f9f9f9', borderRadius: '4px' }} />
            ))}

            {/* Calendar Days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateISO = getISODateForDay(dayNum);
              const isActive = activeDays.includes(dateISO);
              // Highlight today only when viewing the current real month
              const isToday = isCurrentMonth && dayNum === todayDay;

              return (
                <div
                  key={dateISO}
                  onClick={() => handleDayClick(dayNum)}
                  style={{
                    minHeight: '42px',
                    border: isToday ? '2px solid var(--primary-color)' : '1px solid var(--window-border)',
                    borderRadius: '5px',
                    backgroundColor: isActive ? '#f1f8e9' : '#fff',
                    padding: '2px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'relative'
                  }}
                >
                  <span style={{ fontSize: '0.7rem', fontWeight: isToday ? 'bold' : 'normal', color: isToday ? 'var(--primary-color)' : '#333' }}>
                    {dayNum}
                  </span>
                  {isActive && (
                    <img
                      src="/assets/pixel_frog_marker.png"
                      alt="Active Frog Day"
                      style={{ width: '22px', height: '22px', display: 'block', margin: '1px auto' }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#666', textAlign: 'center' }}>
            Tap any day to see its affirmation, mood & journal entries!
          </p>
        </div>
      )}

      {/* ANALYTICS & CORRELATIONS VIEW */}
      {viewMode === 'analytics' && (
        <div style={{
          backgroundColor: '#fff',
          border: '2px solid var(--window-border-dark)',
          borderRadius: '8px',
          padding: '0.75rem',
          marginBottom: '0.75rem'
        }}>
          <h3 style={{ fontFamily: 'var(--header-font)', fontSize: '0.85rem', textAlign: 'center', marginBottom: '0.6rem' }}>
            Mood & Self-Care Summary ({monthNames[calendarMonth]} {calendarYear})
          </h3>

          {/* Section 1: Moods Tracked This Month */}
          <div style={{ marginBottom: '1rem', borderBottom: '1px dashed var(--window-border)', paddingBottom: '0.75rem' }}>
            <h4 style={{ fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--primary-color)', fontFamily: 'var(--header-font)' }}>
              Moods Tracked This Month
            </h4>

            {(() => {
              const monthPrefix = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}`;
              const logs = gameState?.dailyMoodLogs || {};
              const thisMonthLogs = Object.entries(logs).filter(([date]) => date.startsWith(monthPrefix));

              // Count mood frequencies
              const counts = { Great: 0, Good: 0, Okay: 0, Sad: 0, Angry: 0 };
              thisMonthLogs.forEach(([_, mood]) => {
                if (counts[mood] !== undefined) counts[mood]++;
              });

              const totalLogged = thisMonthLogs.length;

              if (totalLogged === 0) {
                return (
                  <p style={{ fontSize: '0.8rem', color: '#666', fontStyle: 'italic', margin: '0.4rem 0' }}>
                    No moods logged yet for this month. Visit the Care tab to log how you are feeling!
                  </p>
                );
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {Object.entries(counts).map(([moodName, count]) => {
                    const pct = totalLogged > 0 ? Math.round((count / totalLogged) * 100) : 0;
                    return (
                      <div key={moodName} style={{ backgroundColor: 'var(--bg-color)', padding: '0.35rem 0.5rem', borderRadius: '5px', border: '1px solid var(--window-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem', fontWeight: 'bold' }}>
                          <span>{moodName}</span>
                          <span>{count} days ({pct}%)</span>
                        </div>
                        <div style={{ height: '8px', backgroundColor: '#e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, backgroundColor: 'var(--window-title-bg)', transition: 'width 0.3s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Section 2: Self-Care Tasks Completed */}
          <div>
            <h4 style={{ fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--primary-color)', fontFamily: 'var(--header-font)' }}>
              Self-Care Tasks Completed
            </h4>

            {(() => {
              const checklist = gameState?.checklist || [];
              const completedChecklist = checklist.filter(t => t.completed);
              const waterCups = gameState?.waterCount || 0;
              const medTaken = gameState?.medicationTaken;
              const todayISO = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
              const isBreathingDone = gameState?.lastBreathingDate === todayISO;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ backgroundColor: '#f1f8e9', padding: '0.4rem 0.6rem', borderRadius: '5px', border: '1px solid #c8e6c9', fontSize: '0.8rem' }}>
                    <strong>Hydration Tracker: </strong>
                    <span>{waterCups} / 8 Cups Drunk Today {waterCups >= 8 ? '[Goal Achieved]' : ''}</span>
                  </div>

                  <div style={{ backgroundColor: medTaken ? '#f1f8e9' : '#fff3e0', padding: '0.4rem 0.6rem', borderRadius: '5px', border: `1px solid ${medTaken ? '#c8e6c9' : '#ffe0b2'}`, fontSize: '0.8rem' }}>
                    <strong>Daily Medicine: </strong>
                    <span>{medTaken ? 'Medicine Taken [Done]' : 'Pending for today'}</span>
                  </div>

                  <div style={{ backgroundColor: isBreathingDone ? '#f1f8e9' : '#fff3e0', padding: '0.4rem 0.6rem', borderRadius: '5px', border: `1px solid ${isBreathingDone ? '#c8e6c9' : '#ffe0b2'}`, fontSize: '0.8rem' }}>
                    <strong>Breathing Exercise: </strong>
                    <span>{isBreathingDone ? '3 Cycles Completed [Done]' : 'Pending for today'}</span>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-color)', padding: '0.4rem 0.6rem', borderRadius: '5px', border: '1px solid var(--window-border)', fontSize: '0.8rem' }}>
                    <strong>Daily Checklist Tasks ({completedChecklist.length} / {checklist.length} Completed):</strong>
                    {checklist.length === 0 ? (
                      <p style={{ margin: '0.2rem 0 0 0', color: '#666', fontStyle: 'italic' }}>No checklist tasks set.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.35rem' }}>
                        {checklist.map(t => (
                          <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ textDecoration: t.completed ? 'line-through' : 'none', color: t.completed ? '#2e7d32' : '#333' }}>
                              {t.text}
                            </span>
                            <span style={{ fontWeight: 'bold', fontSize: '0.75rem', color: t.completed ? '#2e7d32' : '#888' }}>
                              {t.completed ? '[Done]' : '[Pending]'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* DAY LOG DETAILS POPUP MODAL */}
      {selectedDayLog && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="window" style={{
            backgroundColor: '#fff',
            border: '3px solid var(--window-border-dark)',
            borderRadius: '8px',
            maxWidth: '360px',
            width: '100%',
            overflow: 'hidden'
          }}>
            <div className="window-header" style={{
              backgroundColor: 'var(--window-title-bg)',
              color: 'var(--window-title-text)',
              padding: '0.4rem 0.8rem',
              fontWeight: 'bold',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <button
                  onClick={handlePrevDay}
                  title="Previous Day"
                  style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', lineHeight: 1, padding: '0 2px' }}
                >
                  ‹
                </button>
                <span>Activity Log ({selectedDayLog.dateDisplay})</span>
                <button
                  onClick={handleNextDay}
                  title="Next Day"
                  style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', lineHeight: 1, padding: '0 2px' }}
                >
                  ›
                </button>
              </div>
              <button 
                onClick={() => setSelectedDayLog(null)}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 'bold' }}
              >
                X
              </button>
            </div>

            <div style={{ padding: '1rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {selectedDayLog.isActive && (
                  <img src="/assets/pixel_frog_marker.png" alt="Active" style={{ width: '28px', height: '28px' }} />
                )}
                <div>
                  <strong>Status: </strong>
                  {selectedDayLog.isActive ? 'Active Check-In Completed!' : 'No Check-In Recorded'}
                </div>
              </div>

              <div style={{ marginBottom: '0.75rem', borderTop: '1px dashed var(--window-border)', paddingTop: '0.5rem' }}>
                <strong>Logged Mood: </strong>
                <span>{selectedDayLog.mood}</span>
              </div>

              {selectedDayLog.affirmation && (
                <div style={{ marginBottom: '0.75rem', borderTop: '1px dashed var(--window-border)', paddingTop: '0.5rem' }}>
                  <strong>Daily Froggy Affirmation: </strong>
                  <p style={{ fontStyle: 'italic', backgroundColor: 'var(--bg-color)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--window-border)', color: 'var(--text-primary)', margin: '0.3rem 0 0 0' }}>
                    "{selectedDayLog.affirmation}"
                  </p>
                </div>
              )}

              {/* Frog's Adventures Today */}
              <div style={{ marginBottom: '0.75rem', borderTop: '1px dashed var(--window-border)', paddingTop: '0.5rem' }}>
                <strong>Frog's Adventures Today: </strong>
                {selectedDayLog.adventures && selectedDayLog.adventures.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.35rem' }}>
                    {selectedDayLog.adventures.map((adv, i) => (
                      <div key={adv.id || i} style={{ backgroundColor: 'var(--primary-light)', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--window-border)', fontSize: '0.8rem' }}>
                        <div style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>
                          📍 {adv.location}
                        </div>
                        <div style={{ margin: '0.2rem 0', color: 'var(--text-primary)' }}>
                          {gameState?.petName || 'Froggy'} {adv.story}
                        </div>
                        {adv.lesson && (
                          <div style={{ fontStyle: 'italic', color: '#555', fontSize: '0.75rem' }}>
                            "{adv.lesson}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#777', marginTop: '0.2rem', fontStyle: 'italic' }}>No adventures taken on this day yet.</p>
                )}
              </div>

              <div style={{ marginBottom: '0.75rem', borderTop: '1px dashed var(--window-border)', paddingTop: '0.5rem' }}>
                <strong>Journal Entries: </strong>
                {selectedDayLog.journals && selectedDayLog.journals.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.35rem' }}>
                    {selectedDayLog.journals.map((j, i) => (
                      <button 
                        key={j.id || i}
                        className="btn"
                        onClick={() => {
                          setSelectedDayLog(null);
                          navigate('/journal');
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justify: 'space-between',
                          padding: '0.4rem 0.65rem',
                          fontSize: '0.85rem',
                          backgroundColor: 'var(--button-bg)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%'
                        }}
                      >
                        <span>Open Journal Entry #{i + 1}</span>
                        <span style={{ fontWeight: 'bold', marginLeft: '0.5rem', color: 'var(--text-primary)' }}>View in Journal ➔</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#777', marginTop: '0.2rem' }}>No journal entry recorded for this day.</p>
                )}
              </div>

              {/* Day Navigation Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--window-border)' }}>
                <button 
                  className="btn" 
                  onClick={handlePrevDay} 
                  title="View previous day's activities"
                  style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem', fontWeight: 'bold' }}
                >
                  ◀ Prev Day
                </button>
                <button className="btn" onClick={() => setSelectedDayLog(null)} style={{ padding: '0.3rem 1rem', fontWeight: 'bold' }}>
                  Close
                </button>
                <button 
                  className="btn" 
                  onClick={handleNextDay} 
                  title="View next day's activities"
                  style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem', fontWeight: 'bold' }}
                >
                  Next Day ▶
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
