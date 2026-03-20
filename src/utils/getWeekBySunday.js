//for payment reporting
export function getFirstWeekBySunday(fromDate) {
  const date = new Date(fromDate);
  const year= date.getFullYear()

  // Get first Sunday on or after fromDate
  const day = date.getDay();
  const diff = (7 - day) % 7;
  const sunday = new Date(date);
  sunday.setDate(date.getDate() + diff);

  // First Sunday of the year
  const yearStart = new Date(sunday.getFullYear(), 0, 1);
  const firstSundayOfYear = new Date(yearStart);
  firstSundayOfYear.setDate(
    yearStart.getDate() + ((7 - yearStart.getDay()) % 7)
  );

  // Calculate week number
  const diffDays = Math.floor(
    (sunday - firstSundayOfYear) / (1000 * 60 * 60 * 24)
  );
  const weekNumber = Math.floor(diffDays / 7) + 1;

  // Week start (Monday)
  const monday = new Date(sunday);
  monday.setDate(sunday.getDate() - 6);

  return {
    weekNumber, year
    // weekStart: monday,
    // weekEnd: sunday,
  };
}

//for payment reporting
export function getLastWeekBySunday(toDate) {
  const date = new Date(toDate);
  const year= date.getFullYear()
  // Get last Sunday on or before toDate
  const day = date.getDay();
  const sunday = new Date(date);
  sunday.setDate(date.getDate() - day);

  // First Sunday of the year
  const yearStart = new Date(sunday.getFullYear(), 0, 1);
  const firstSundayOfYear = new Date(yearStart);
  firstSundayOfYear.setDate(
    yearStart.getDate() + ((7 - yearStart.getDay()) % 7)
  );

  // Calculate week number
  const diffDays = Math.floor(
    (sunday - firstSundayOfYear) / (1000 * 60 * 60 * 24)
  );
  const weekNumber = Math.floor(diffDays / 7) + 1;

  // Week start (Monday)
  const monday = new Date(sunday);
  monday.setDate(sunday.getDate() - 6);

  return {
    weekNumber, year
    // weekStart: monday,
    // weekEnd: sunday,
  };
}