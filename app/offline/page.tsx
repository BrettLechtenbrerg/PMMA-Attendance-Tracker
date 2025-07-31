'use client'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center px-4">
      <div className="text-center max-w-md mx-auto">
        <img 
          src="https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/Uj6CJxWXVU8HyNgI39xb/media/88575c62-51f8-4837-875d-808d452bbc6b.png"
          alt="PMMA Logo"
          className="mx-auto mb-8 max-w-48 h-auto"
        />
        
        <div className="mb-8">
          <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 1 0 0 19.5 9.75 9.75 0 0 0 0-19.5Z" />
          </svg>
          
          <h1 className="text-2xl font-bold text-primary mb-4">
            You&apos;re Offline
          </h1>
          
          <p className="text-gray-600 mb-6">
            No internet connection detected. Don&apos;t worry - you can still use the QR scanner and your attendance data will be saved and synced when you&apos;re back online.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">What you can do offline:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Scan QR codes for attendance</li>
              <li>• View cached student information</li>
              <li>• Access recently viewed pages</li>
              <li>• Check offline queue status</li>
            </ul>
          </div>

          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-primary text-white py-3 px-6 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Try Again
          </button>
          
          <button 
            onClick={() => window.history.back()}
            className="w-full bg-secondary text-primary py-3 px-6 rounded-lg hover:bg-yellow-500 transition-colors"
          >
            Go Back
          </button>
        </div>

        <div className="mt-8 text-xs text-gray-500">
          <p>Data will automatically sync when connection is restored</p>
        </div>
      </div>
    </div>
  )
}