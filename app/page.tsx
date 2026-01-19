import Link from 'next/link'

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center py-16">
        <h1 className="text-5xl font-bold text-wta-purple mb-6">
          WTA Fantasy League
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Draft your favorite WTA players, compete in tournaments, and climb the leaderboard.
          Fantasy tennis has never been this exciting.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/register"
            className="bg-wta-purple text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-purple-800 transition"
          >
            Get Started
          </Link>
          <Link
            href="/leaderboard"
            className="bg-gray-100 text-gray-800 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-200 transition"
          >
            View Leaderboard
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 py-12">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-3xl mb-4">🎾</div>
          <h3 className="text-lg font-semibold mb-2">Draft Players</h3>
          <p className="text-gray-600">
            Select WTA players based on rankings and your budget. Strategic picks lead to victory.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-3xl mb-4">🏆</div>
          <h3 className="text-lg font-semibold mb-2">Earn Points</h3>
          <p className="text-gray-600">
            Your players earn points for every match they win. The deeper they go, the more you score.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-3xl mb-4">📊</div>
          <h3 className="text-lg font-semibold mb-2">Compete</h3>
          <p className="text-gray-600">
            Track your progress on the global leaderboard and prove you know WTA tennis best.
          </p>
        </div>
      </div>

      <div className="bg-wta-purple/5 rounded-lg p-8 my-12">
        <h2 className="text-2xl font-bold text-wta-purple mb-6">How It Works</h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <span className="bg-wta-purple text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">1</span>
            <div>
              <h4 className="font-semibold">Start with 50 points budget</h4>
              <p className="text-gray-600">Every player begins with the same budget to spend on player picks.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="bg-wta-purple text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">2</span>
            <div>
              <h4 className="font-semibold">Pick players for each tournament</h4>
              <p className="text-gray-600">WTA 500s, 1000s, and Grand Slams. Higher-ranked players cost more.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="bg-wta-purple text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">3</span>
            <div>
              <h4 className="font-semibold">Earn points when your players win</h4>
              <p className="text-gray-600">From R2 onwards, every round won earns you fantasy points.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="bg-wta-purple text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">4</span>
            <div>
              <h4 className="font-semibold">Budget grows with tournaments</h4>
              <p className="text-gray-600">Get bonus points added to your budget when each tournament begins.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
