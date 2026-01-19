import { getPlayerCost } from './scoring'

// Fetch current rankings by scraping Tennis Abstract (updated weekly, easier to parse)
export async function fetchCurrentRankings(): Promise<{
  name: string
  country: string
  wtaRanking: number
  cost: number
}[]> {
  const res = await fetch('https://tennisabstract.com/reports/wtaRankings.html', {
    cache: 'no-store',
  })
  const html = await res.text()

  const rankings: { name: string; country: string; wtaRanking: number; cost: number }[] = []

  // Parse the HTML table - Tennis Abstract uses a simple table format
  // Look for table rows with ranking data
  const tableMatch = html.match(/<table[^>]*class="[^"]*tablesorter[^"]*"[^>]*>([\s\S]*?)<\/table>/i)
  if (!tableMatch) {
    console.error('Could not find rankings table')
    return []
  }

  const tableContent = tableMatch[1]
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
  let rowMatch

  while ((rowMatch = rowRegex.exec(tableContent)) !== null) {
    const row = rowMatch[1]

    // Extract cells
    const cells: string[] = []
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi
    let cellMatch
    while ((cellMatch = cellRegex.exec(row)) !== null) {
      // Strip HTML tags, decode entities, and trim
      const cellText = cellMatch[1]
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim()
      cells.push(cellText)
    }

    // Tennis Abstract format: Rank, Player, Country/Flag, Points, etc.
    if (cells.length >= 3) {
      const rank = parseInt(cells[0])
      if (!isNaN(rank) && rank <= 150) {
        const name = cells[1]
        const country = cells[2]?.substring(0, 3).toUpperCase() || ''

        if (name && name.length > 1) {
          rankings.push({
            name,
            country,
            wtaRanking: rank,
            cost: getPlayerCost(rank),
          })
        }
      }
    }
  }

  return rankings.slice(0, 150) // Top 150
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
