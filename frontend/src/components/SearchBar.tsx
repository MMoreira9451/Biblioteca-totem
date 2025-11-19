// frontend/src/components/SearchBar.tsx
import { useState } from 'react'
import { Search } from 'lucide-react'

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Buscando:', searchQuery)
    // Aquí después agregaremos la funcionalidad de búsqueda
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <form onSubmit={handleSearch}>
        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-3">
          Buscar en el catálogo
        </label>
        
        <div className="relative">
          {/* Icono de búsqueda */}
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-gray-400" />
          </div>

          {/* Input de búsqueda */}
          <input
            id="search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título, autor o ISBN..."
            className="block w-full rounded-xl border-2 border-gray-300 pl-12 pr-4 py-4 text-lg placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors duration-200"
            autoComplete="off"
          />
        </div>
      </form>
    </div>
  )
}