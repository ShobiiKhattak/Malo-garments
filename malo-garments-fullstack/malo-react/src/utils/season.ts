export type Season = 'winter' | 'summer'

// Pakistani retail calendar: Nov–Feb reads as the Winter collection window,
// Mar–Oct as Summer — matches how the store actually splits its two ranges.
export function getCurrentSeason(date: Date = new Date()): Season {
  const month = date.getMonth() // 0 = Jan ... 11 = Dec
  return month >= 10 || month <= 1 ? 'winter' : 'summer'
}
