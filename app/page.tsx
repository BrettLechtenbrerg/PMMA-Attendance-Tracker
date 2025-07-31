import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto">
        <img 
          src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/Uj6CJxWXVU8HyNgI39xb/media/88575c62-51f8-4837-875d-808d452bbc6b.png"
          alt="PMMA Logo"
          className="mx-auto mb-8 max-w-48 h-auto"
        />
        <h1 className="text-3xl font-bold text-primary mb-4">
          PMMA Attendance Tracker
        </h1>
        <p className="text-gray-600 mb-8">
          Professional martial arts attendance tracking system
        </p>
        <div className="space-y-4">
          <Link 
            href="/login"
            className="block w-full bg-primary text-white py-3 px-6 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Staff Login
          </Link>
          <Link 
            href="/portal"
            className="block w-full bg-secondary text-primary py-3 px-6 rounded-lg hover:bg-yellow-500 transition-colors"
          >
            Parent Portal
          </Link>
        </div>
      </div>
    </main>
  )
}