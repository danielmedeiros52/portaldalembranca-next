import { Loader2, Shield } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Shield className="w-12 h-12 text-teal-600 mx-auto mb-4 animate-pulse" />
        <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-2" />
        <p className="text-gray-600 font-medium">Carregando painel administrativo...</p>
      </div>
    </div>
  );
}
