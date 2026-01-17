import { Loader2, Edit3 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center py-12">
          <Edit3 className="w-12 h-12 text-teal-600 mx-auto mb-4 animate-pulse" />
          <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-2" />
          <p className="text-gray-600 font-medium">Carregando editor...</p>
        </div>
      </main>
    </div>
  );
}
