"use client";

import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { api } from "~/trpc/react";
import { Plus } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { data: memorials, isLoading } = api.memorial.list.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600">Gerencie seus memoriais</p>
          </div>
          <Button onClick={() => router.push("/memorial/create")}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Memorial
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {memorials?.map((memorial) => (
            <Card key={memorial.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push(`/memorial/${memorial.slug}`)}>
              <CardHeader>
                <CardTitle>{memorial.fullName}</CardTitle>
                <CardDescription>
                  {memorial.birthDate && memorial.deathDate && (
                    `${new Date(memorial.birthDate).toLocaleDateString()} - ${new Date(memorial.deathDate).toLocaleDateString()}`
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 line-clamp-2">
                  {memorial.biography || "Sem biografia"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {memorials?.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-slate-600 mb-4">Nenhum memorial criado ainda</p>
              <Button onClick={() => router.push("/memorial/create")}>
                Criar Primeiro Memorial
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
