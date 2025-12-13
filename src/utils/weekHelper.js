function getDatesOfISOWeek(week, year) {
  const simple = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = simple.getUTCDay() || 7;

  const monOfWeek1 = new Date(simple);
  monOfWeek1.setUTCDate(simple.getUTCDate() - (dayOfWeek - 1));

  const target = new Date(monOfWeek1);
  target.setUTCDate(monOfWeek1.getUTCDate() + (week - 1) * 7);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(target);
    d.setUTCDate(target.getUTCDate() + i);
    days.push(d);
  }
  return days;
}

export default getDatesOfISOWeek;
