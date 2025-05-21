import React, { useMemo, useState } from 'react';

// GitHub-inspired green color scale (matching the image)
const COLOR_SCALE = [
  'bg-gray-800 border-gray-700', // 0 contributions
  'bg-green-900 border-green-800', // 1
  'bg-green-700 border-green-600', // 2
  'bg-green-500 border-green-400', // 3
  'bg-green-300 border-green-200', // 4
];

function getColor(count) {
  if (!count) return COLOR_SCALE[0];
  if (count < 2) return COLOR_SCALE[1];
  if (count < 5) return COLOR_SCALE[2];
  if (count < 10) return COLOR_SCALE[3];
  return COLOR_SCALE[4];
}

// Helper: Generate calendar data for the selected year, starting on the Monday on or before Jan 1
function getCalendarData(year, dailyActivity = {}) {
  const startDate = new Date(year, 0, 1); // Jan 1
  const endDate = new Date(year, 11, 31); // Dec 31
  const startDay = startDate.getDay();
  const mondayOffset = (startDay + 6) % 7; // Days to subtract to get to Monday
  const firstMonday = new Date(startDate);
  firstMonday.setDate(firstMonday.getDate() - mondayOffset);

  const totalDays = Math.ceil((endDate - firstMonday) / (1000 * 60 * 60 * 24)) + 1; // Days from first Monday to Dec 31
  const weeks = [];
  let week = [];
  let date = new Date(firstMonday);

  for (let i = 0; i < totalDays; i++) {
    const iso = date.toISOString().slice(0, 10);
    const isCurrentYear = date.getFullYear() === year;
    week.push({
      date: iso,
      count: isCurrentYear ? (dailyActivity[iso] || 0) : 0,
      month: date.getMonth(),
      day: (date.getDay() + 6) % 7, // Shift so Monday=0, Sunday=6
      isPadding: !isCurrentYear,
    });

    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
    date.setDate(date.getDate() + 1);
  }

  // Add the last week if it's not empty, padding with empty days
  if (week.length > 0) {
    while (week.length < 7) {
      week.push({ date: null, count: 0, month: null, day: null, isPadding: true });
    }
    weeks.push(week);
  }

  return weeks;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', ''];

export default function OnchainHeatmap({ dailyActivity = {}, currentStreak = 0, longestStreak = 0, totalActiveDays = 0 }) {
  // --- Year Tabs Logic ---
  const allYears = useMemo(() => {
    const years = Object.keys(dailyActivity)
      .map(date => new Date(date).getFullYear())
      .filter(y => y >= 2023);
    const unique = Array.from(new Set(years));
    if (!unique.includes(2023)) unique.unshift(2023);
    const current = new Date().getFullYear();
    for (let y = Math.max(...unique) + 1; y <= current; y++) unique.push(y);
    return unique.sort((a, b) => b - a); // Descending
  }, [dailyActivity]);

  const [selectedYear, setSelectedYear] = useState(() => {
    const current = new Date().getFullYear();
    return allYears.includes(current) ? current : allYears[0];
  });

  // Filter dailyActivity for selected year
  const filteredActivity = useMemo(() => {
    const obj = {};
    Object.entries(dailyActivity).forEach(([date, count]) => {
      if (new Date(date).getFullYear() === selectedYear) {
        obj[date] = count;
      }
    });
    return obj;
  }, [dailyActivity, selectedYear]);

  // Calculate total contributions for the selected year
  const totalContributions = useMemo(() => {
    return Object.values(filteredActivity).reduce((sum, count) => sum + count, 0);
  }, [filteredActivity]);

  // Generate calendar data for the selected year
  const weeks = useMemo(() => getCalendarData(selectedYear, filteredActivity), [filteredActivity, selectedYear]);

  // Month label positions: first week that contains a day from each month
  const monthLabelPositions = useMemo(() => {
    const positions = [];
    let seenMonths = new Set();
    for (let i = 0; i < weeks.length; i++) {
      const week = weeks[i];
      const firstValidDay = week.find(day => day && !day.isPadding);
      if (firstValidDay && !seenMonths.has(firstValidDay.month)) {
        positions.push({ index: i, label: MONTH_LABELS[firstValidDay.month] });
        seenMonths.add(firstValidDay.month);
      }
    }
    return positions;
  }, [weeks]);

  return (
    <div className="w-full bg-gray-900 rounded-xl p-4 sm:p-6 md:p-8 border border-gray-700 shadow-lg">
      {/* Year Tabs */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6 justify-end">
        {allYears.map(year => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-mono text-xs sm:text-sm transition-all duration-200 border-2 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
              selectedYear === year
                ? 'bg-blue-600 text-white border-blue-400'
                : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700 hover:text-white'
            }`}
            aria-pressed={selectedYear === year}
          >
            {year}
          </button>
        ))}
      </div>

      {/* Header */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="text-xl sm:text-2xl md:text-3xl text-white font-mono mb-2">
            {totalContributions.toLocaleString()} contributions in {selectedYear}
          </div>
          {/* <h2 className="font-mono text-xl sm:text-2xl md:text-3xl text-white bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-2">
            Onchain Streak
          </h2> */}
          <div className="flex flex-wrap gap-4 sm:gap-6 text-xs sm:text-sm font-mono text-gray-300">
            <span>
              Current Streak: <span className="text-green-400 font-semibold">{currentStreak}</span>
            </span>
            <span>
              Longest Streak: <span className="text-green-400 font-semibold">{longestStreak}</span>
            </span>
            <span>
              Active Days: <span className="text-green-400 font-semibold">{totalActiveDays}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable container */}
      <div className="relative overflow-x-auto w-full">
        {/* Month Labels */}
        <div className="flex mb-1">
          {weeks.map((week, i) => {
            const found = monthLabelPositions.find(pos => pos.index === i);
            return (
              <div
                key={i}
                className="flex items-center justify-center flex-shrink-0 text-[6px] xs:text-[8px] sm:text-[10px] md:text-xs font-semibold text-gray-200 font-mono text-center min-w-[0.6rem] xs:min-w-[0.8rem] sm:min-w-[1rem] md:min-w-[1.2rem] h-4 sm:h-5 md:h-6 leading-tight"
              >
                {found ? found.label : ''}
              </div>
            );
          })}
        </div>

        {/* Heatmap Grid */}
        <div className="flex w-full">
          {/* Day-of-week Labels */}
          <div className="flex flex-col mr-1 mt-1">
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                className="h-2 xs:h-3 sm:h-4 md:h-5 text-[6px] xs:text-[8px] sm:text-[10px] md:text-xs text-gray-400 font-mono text-right pr-1"
                style={{ minHeight: '0.6rem' }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Heatmap */}
          <div className="flex w-fit">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col">
                {Array.from({ length: 7 }).map((_, di) => {
                  const day = week[di];
                  const cellClasses = [
                    'w-[0.4rem] h-[0.4rem] xs:w-[0.5rem] xs:h-[0.5rem] sm:w-[0.7rem] sm:h-[0.7rem] md:w-4 md:h-4 border rounded-sm',
                    'cursor-pointer',
                    day && !day.isPadding ? getColor(day.count) : 'bg-transparent border-transparent',
                    'md:transition-all',
                    'md:hover:scale-110',
                    'md:hover:shadow-md',
                  ].join(' ');
                  return (
                    <div
                      key={di}
                      className={cellClasses}
                      title={day && !day.isPadding && day.date ? `${day.date}: ${day.count} txns` : ''}
                      aria-label={day && !day.isPadding && day.date ? `${day.date}: ${day.count} transactions` : 'No data'}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 sm:gap-3 mt-4 sm:mt-6">
        <span className="text-[8px] xs:text-[10px] sm:text-xs md:text-sm text-gray-400 font-mono">Less</span>
        {COLOR_SCALE.map((cls, i) => (
          <div
            key={i}
            className={`w-[0.6rem] h-[0.6rem] xs:w-[0.8rem] xs:h-[0.8rem] sm:w-[1rem] sm:h-[1rem] md:w-[1.15rem] md:h-[1.15rem] border rounded-sm ${cls}`}
            aria-label={`Activity level ${i}`}
          />
        ))}
        <span className="text-[8px] xs:text-[10px] sm:text-xs md:text-sm text-gray-400 font-mono">More</span>
      </div>
    </div>
  );
}