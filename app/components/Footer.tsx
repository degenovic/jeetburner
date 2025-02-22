'use client'

export function Footer() {
  return (
    <footer className="w-full border-t border-gray-800 bg-black py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mt-8 pt-8 border-t border-gray-800">
          <p className="text-center text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} PFTC. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
