import { groupTransactionsByDay } from '../../lib/blockchain';

/**
 * API endpoint to get onchain activity streak data for a wallet.
 * Query params: address, chain, start, end
 * Returns: { dailyActivity, currentStreak, longestStreak, totalActiveDays }
 */
export default async function handler(req, res) {
  const { address, chain = 'base', start, end } = req.query;
  if (!address) {
    return res.status(400).json({ error: 'Missing required parameter: address' });
  }
  try {
    // Group transactions by day
    const dailyActivity = await groupTransactionsByDay(address, chain, { startDate: start, endDate: end });
    // Calculate streaks
    const dates = Object.keys(dailyActivity).sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let streak = 0;
    let prevDate = null;
    let today = new Date().toISOString().slice(0, 10);
    // For current streak, walk backwards from today
    for (let i = dates.length - 1; i >= 0; i--) {
      const date = dates[i];
      if (i === dates.length - 1 && date === today) {
        streak = 1;
      } else if (prevDate) {
        const prev = new Date(prevDate);
        const curr = new Date(date);
        const diff = (prev - curr) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
          streak++;
        } else {
          break;
        }
      } else {
        break;
      }
      prevDate = date;
    }
    currentStreak = streak;
    // For longest streak, walk forward
    streak = 0;
    prevDate = null;
    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];
      if (prevDate) {
        const prev = new Date(prevDate);
        const curr = new Date(date);
        const diff = (curr - prev) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
          streak++;
        } else {
          streak = 1;
        }
      } else {
        streak = 1;
      }
      if (streak > longestStreak) longestStreak = streak;
      prevDate = date;
    }
    const totalActiveDays = dates.length;
    res.status(200).json({
      success: true,
      dailyActivity,
      currentStreak,
      longestStreak,
      totalActiveDays
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
} 