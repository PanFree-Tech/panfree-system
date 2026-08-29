export default function FavoritosPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-[#334c2b] mb-6">❤️ Mis Favoritos</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-500 text-lg mb-4">
          No tienes productos guardados en favoritos.
        </p>
        <p className="text-gray-400 text-sm">
          Explora nuestro catálogo y guarda tus productos preferidos.
        </p>
        <a
          href="/catalogo"
          className="inline-block mt-6 bg-[#334c2b] text-white px-6 py-3 rounded-lg hover:bg-[#2a3d24] transition font-medium"
        >
          🛍️ Ver catálogo
        </a>
      </div>
    </div>
  )
}