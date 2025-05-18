'use client'

import { usePathname, useRouter } from 'next/navigation'

export const SearchUsers = () => {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className="mb-6">
      <form
        className="flex gap-2 items-end"
        onSubmit={(e) => {
          e.preventDefault()
          const form = e.currentTarget
          const formData = new FormData(form)
          const queryTerm = formData.get('search') as string
          router.push(pathname + '?search=' + queryTerm)
        }}
      >
        <div className="flex flex-col">
          <label htmlFor="search" className="text-sm text-gray-700 mb-1">Rechercher des utilisateurs</label>
          <input 
            id="search" 
            name="search" 
            type="text"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
            placeholder="Nom ou email..." 
          />
        </div>
        <button 
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Rechercher
        </button>
      </form>
    </div>
  )
}