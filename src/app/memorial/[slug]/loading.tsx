import { Loader2, Heart } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Skeleton */}
      <div className="relative h-96 bg-gradient-to-br from-teal-100 to-cyan-100">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Heart className="w-16 h-16 text-teal-600 mx-auto mb-4 animate-pulse" />
            <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-2" />
            <p className="text-gray-700 font-medium">Carregando memorial...</p>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded-lg w-3/4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
