// Player cost based on WTA ranking
export function getPlayerCost(wtaRanking: number, isQualifier: boolean = false): number {
  // Qualifiers have a fixed cost of 3
  if (isQualifier) return 3

  // Main draw costs by ranking
  if (wtaRanking === 1) return 13
  if (wtaRanking === 2) return 12
  if (wtaRanking === 3) return 11
  if (wtaRanking === 4) return 11
  if (wtaRanking === 5) return 10
  if (wtaRanking === 6) return 9
  if (wtaRanking === 7) return 8
  if (wtaRanking === 8) return 8
  if (wtaRanking === 9) return 7
  if (wtaRanking === 10) return 7
  if (wtaRanking <= 15) return 6
  if (wtaRanking <= 20) return 5
  if (wtaRanking <= 25) return 4
  if (wtaRanking <= 32) return 3
  if (wtaRanking <= 75) return 2
  return 1 // 76+
}

// Points awarded per round won
export const ROUND_POINTS: Record<string, number> = {
  R1: 0,   // R1 win
  R2: 3,   // R2 win
  R3: 6,   // R3 win
  R4: 8,   // R4 win (Grand Slams + Indian Wells only)
  QF: 10,  // Quarterfinal win
  SF: 14,  // Semifinal win
  F: 18,   // Final (runner-up)
  W: 24,   // Tournament win (champion)
}

// Points added to budget when tournament starts
export const TOURNAMENT_ALLOWANCE = {
  WTA_500: 8,
  WTA_1000: 10,
  GRAND_SLAM: 12,
} as const

// Required number of picks per tournament type
export const REQUIRED_PICKS = {
  WTA_500: { mainDraw: 1, qualifier: 1 },
  WTA_1000: { mainDraw: 2, qualifier: 1 },
  GRAND_SLAM: { mainDraw: 2, qualifier: 1 },
} as const

// Starting budget for all players
export const STARTING_BUDGET = 50

// Fixed cost for qualifier picks
export const QUALIFIER_COST = 3

// Calculate total points earned from picks
export function calculatePointsEarned(picks: { pointsEarned: number }[]): number {
  return picks.reduce((sum, p) => sum + p.pointsEarned, 0)
}

// Calculate total points spent on player costs
export function calculatePointsSpent(picks: { pickType: string; player: { cost: number } }[]): number {
  return picks.reduce((sum, p) => {
    // Qualifiers always cost QUALIFIER_COST, main draw uses player cost
    const cost = p.pickType === 'QUALIFIER' ? QUALIFIER_COST : p.player.cost
    return sum + cost
  }, 0)
}

// Calculate tournament allowances received (only for started tournaments)
export function calculateAllowancesReceived(
  tournaments: { status: string; pointsAllowance: number }[]
): number {
  return tournaments
    .filter(t => t.status !== 'UPCOMING')
    .reduce((sum, t) => sum + t.pointsAllowance, 0)
}

// Calculate current budget
export function calculateBudget(
  tournaments: { status: string; pointsAllowance: number }[],
  picks: { pointsEarned: number; pickType: string; player: { cost: number } }[]
): number {
  const allowancesReceived = calculateAllowancesReceived(tournaments)
  const pointsEarned = calculatePointsEarned(picks)
  const pointsSpent = calculatePointsSpent(picks)

  return STARTING_BUDGET + allowancesReceived + pointsEarned - pointsSpent
}

// Get points for a specific round
export function getPointsForRound(round: string): number {
  return ROUND_POINTS[round] ?? 0
}

// Calculate cumulative points for a player's tournament run
export function calculateTournamentPoints(roundsWon: string[]): number {
  return roundsWon.reduce((total, round) => total + getPointsForRound(round), 0)
}
