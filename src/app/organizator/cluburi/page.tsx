import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function CluburiPage() {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: clubs } = await (supabase as any)
    .from('clubs')
    .select('id, name, city, created_at')
    .order('name')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cluburi</h1>
        <Link
          href="/organizator/cluburi/nou"
          className="bg-blue-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          + Club nou
        </Link>
      </div>

      {clubs && clubs.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {clubs.map((club: any) => (
            <Link
              key={club.id}
              href={`/organizator/cluburi/${club.id}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition"
            >
              <div>
                <p className="font-semibold text-gray-900">{club.name}</p>
                {club.city && <p className="text-sm text-gray-500">📍 {club.city}</p>}
              </div>
              <span className="text-sm text-gray-400">
                {new Date(club.created_at).toLocaleDateString('ro-RO')}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
          <p className="text-4xl mb-3">🏊</p>
          <p className="font-medium">Niciun club adăugat încă.</p>
          <Link href="/organizator/cluburi/nou" className="text-blue-700 text-sm mt-2 inline-block hover:underline">
            Adaugă primul club →
          </Link>
        </div>
      )}
    </div>
  )
}
