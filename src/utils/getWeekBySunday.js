//for payment reporting
export function getFirstWeekBySunday(fromDate) {
  const date = new Date(fromDate);
  // const year = date.getUTCFullYear(); // ✅ FIX
//testing
// console.log("RAW fromDate:", fromDate);
// console.log("Parsed:", new Date(fromDate));
// console.log("ISO:", new Date(fromDate).toISOString());




  // Get first Sunday on or after fromDate

    const day = date.getUTCDay(); // ✅
  const diff = (7 - day) % 7;
  const sunday = new Date(date);
  sunday.setUTCDate(date.getUTCDate() + diff); // ✅

    const year = sunday.getUTCFullYear(); // ✅ FIX

  // First Sunday of the year
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const firstSundayOfYear = new Date(yearStart);
  firstSundayOfYear.setUTCDate(
    yearStart.getUTCDate() + ((7 - yearStart.getUTCDay()) % 7)
  );

  // Calculate week number
  const diffDays = Math.floor(
    (sunday - firstSundayOfYear) / (1000 * 60 * 60 * 24)
  );
  const weekNumber = Math.floor(diffDays / 7) + 1;

  // Week start (Monday)
  const monday = new Date(sunday);
  monday.setUTCDate(sunday.getUTCDate() - 6);

  // console.log("weekNumber", weekNumber , "year", year)
  return {
    weekNumber, year
    // weekStart: monday,
    // weekEnd: sunday,
  };
}



//for payment reporting
export function getLastWeekBySunday(toDate) {
  const date = new Date(toDate);


  // Get last Sunday on or before toDate
  const day = date.getUTCDay();
  const sunday = new Date(date);
  sunday.setUTCDate(date.getUTCDate() - day);

const year = sunday.getUTCFullYear(); // ✅ FIX

  // First Sunday of the year
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const firstSundayOfYear = new Date(yearStart);
  firstSundayOfYear.setUTCDate(
    yearStart.getUTCDate() + ((7 - yearStart.getUTCDay()) % 7)
  );

  // Calculate week number
  const diffDays = Math.floor(
    (sunday - firstSundayOfYear) / (1000 * 60 * 60 * 24)
  );
  const weekNumber = Math.floor(diffDays / 7) + 1;

  // Week start (Monday)
  const monday = new Date(sunday);
  monday.setUTCDate(sunday.getUTCDate() - 6);



  return {
    weekNumber, year
    // weekStart: monday,
    // weekEnd: sunday,
  };
}