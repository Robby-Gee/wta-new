import { getPlayerCost } from './scoring'

// Fetch current rankings by scraping ESPN WTA rankings
export async function fetchCurrentRankings(): Promise<{
  name: string
  country: string
  wtaRanking: number
  cost: number
}[]> {
  const res = await fetch('https://www.espn.com/tennis/rankings/_/type/wta', {
    cache: 'no-store',
  })
  const html = await res.text()

  const rankings: { name: string; country: string; wtaRanking: number; cost: number }[] = []

  // Parse ESPN's table structure
  // Find table rows in the rankings table
  const rowRegex = /<tr[^>]*class="Table__TR[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi
  let rowMatch

  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const row = rowMatch[1]

    // Extract rank from span with class "rank_column"
    const rankMatch = row.match(/<span[^>]*class="rank_column"[^>]*>(\d+)<\/span>/)
    if (!rankMatch) continue
    const rank = parseInt(rankMatch[1])

    // Extract player name from anchor tag with class "AnchorLink"
    const nameMatch = row.match(/<a[^>]*class="AnchorLink"[^>]*>([^<]+)<\/a>/)
    if (!nameMatch) continue
    const name = nameMatch[1].trim()

    // Extract country from img title attribute
    const countryMatch = row.match(/<img[^>]*title="([^"]+)"[^>]*>/)
    const country = countryMatch ? countryMatch[1].substring(0, 3).toUpperCase() : ''

    if (name && name.length > 1 && rank >= 1) {
      rankings.push({
        name,
        country,
        wtaRanking: rank,
        cost: getPlayerCost(rank),
      })
    }
  }

  return rankings
}

// WTA 2026 Tournament Calendar
export const WTA_2026_CALENDAR = [
  // Grand Slams
  { name: 'Australian Open', level: 'GRAND_SLAM', startDate: '2026-01-19', endDate: '2026-02-01' },
  { name: 'Roland Garros', level: 'GRAND_SLAM', startDate: '2026-05-24', endDate: '2026-06-07' },
  { name: 'Wimbledon', level: 'GRAND_SLAM', startDate: '2026-06-29', endDate: '2026-07-12' },
  { name: 'US Open', level: 'GRAND_SLAM', startDate: '2026-08-31', endDate: '2026-09-13' },

  // WTA 1000
  { name: 'Dubai', level: 'WTA_1000', startDate: '2026-02-15', endDate: '2026-02-21' },
  { name: 'Indian Wells', level: 'WTA_1000', startDate: '2026-03-11', endDate: '2026-03-22' },
  { name: 'Miami Open', level: 'WTA_1000', startDate: '2026-03-25', endDate: '2026-04-05' },
  { name: 'Madrid Open', level: 'WTA_1000', startDate: '2026-04-26', endDate: '2026-05-09' },
  { name: 'Rome', level: 'WTA_1000', startDate: '2026-05-10', endDate: '2026-05-17' },
  { name: 'Canadian Open', level: 'WTA_1000', startDate: '2026-08-08', endDate: '2026-08-16' },
  { name: 'Cincinnati', level: 'WTA_1000', startDate: '2026-08-17', endDate: '2026-08-23' },
  { name: 'Wuhan Open', level: 'WTA_1000', startDate: '2026-09-20', endDate: '2026-09-27' },
  { name: 'China Open', level: 'WTA_1000', startDate: '2026-09-28', endDate: '2026-10-04' },

  // WTA 500
  { name: 'Adelaide', level: 'WTA_500', startDate: '2026-01-12', endDate: '2026-01-17' },
  { name: 'Abu Dhabi', level: 'WTA_500', startDate: '2026-02-01', endDate: '2026-02-07' },
  { name: 'Doha', level: 'WTA_500', startDate: '2026-02-08', endDate: '2026-02-14' },
  { name: 'Charleston', level: 'WTA_500', startDate: '2026-04-06', endDate: '2026-04-12' },
  { name: 'Stuttgart', level: 'WTA_500', startDate: '2026-04-13', endDate: '2026-04-19' },
  { name: 'Berlin', level: 'WTA_500', startDate: '2026-06-15', endDate: '2026-06-21' },
  { name: 'Eastbourne', level: 'WTA_500', startDate: '2026-06-22', endDate: '2026-06-27' },
  { name: 'San Diego', level: 'WTA_500', startDate: '2026-09-07', endDate: '2026-09-13' },
  { name: 'Tokyo', level: 'WTA_500', startDate: '2026-10-12', endDate: '2026-10-18' },
]

export function getUpcomingTournaments() {
  const now = new Date()
  return WTA_2026_CALENDAR.filter(t => new Date(t.startDate) > now)
}
