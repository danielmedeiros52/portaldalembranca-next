import { notFound } from "next/navigation";
import { api } from "~/trpc/server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Calendar } from "lucide-react";

export default async function MemorialPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const memorial = await api.memorial.getBySlug({ slug });

  if (!memorial) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              {memorial.fullName}
            </h1>
            {memorial.birthDate && memorial.deathDate && (
              <div className="flex items-center justify-center gap-2 text-slate-600">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(memorial.birthDate).toLocaleDateString()} - {new Date(memorial.deathDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Biography */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Biografia</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 whitespace-pre-wrap">
                {memorial.biography}
              </p>
            </CardContent>
          </Card>

          {/* Photos will go here */}
          {memorial.mainPhoto && (
            <Card>
              <CardHeader>
                <CardTitle>Foto</CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={memorial.mainPhoto}
                  alt={memorial.fullName}
                  className="w-full rounded-lg"
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
