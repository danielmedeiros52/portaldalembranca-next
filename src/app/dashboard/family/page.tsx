"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import {
  ArrowLeft, UserPlus, Mail, Shield, Eye, Edit3, Trash2,
  Users, Heart, CheckCircle, XCircle, Loader2
} from "lucide-react";

const APP_TITLE = "Portal da Lembrança";

export default function FamilyManagementPage() {
  const router = useRouter();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: "",
    email: "",
    memorialId: "",
    canEdit: false,
  });

  // Fetch memorials for selection
  const { data: memorials } = api.memorial.list.useQuery();

  // TODO: Fetch family members with access
  // const { data: familyMembers, isLoading } = api.family.list.useQuery();
  const familyMembers: any[] = []; // Placeholder
  const isLoading = false;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // TODO: Implement invite API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(`Convite enviado para ${inviteForm.email}!`);
      setShowInviteDialog(false);
      setInviteForm({
        name: "",
        email: "",
        memorialId: "",
        canEdit: false,
      });
    } catch (error) {
      toast.error("Erro ao enviar convite.");
    }
  };

  const handleRevoke = async (familyMemberId: number) => {
    try {
      // TODO: Implement revoke API call
      toast.success("Acesso removido com sucesso!");
    } catch (error) {
      toast.error("Erro ao remover acesso.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard")}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-gray-900 text-lg">Familiares</h1>
                  <p className="text-xs text-gray-500">Gerencie acesso aos memoriais</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Intro Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Gerencie o Acesso Familiar</h2>
          <p className="text-gray-600">
            Convide familiares para visualizar ou editar memoriais e compartilhar memórias juntos
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center">
                <Users className="w-7 h-7 text-teal-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{familyMembers.length}</p>
                <p className="text-sm text-gray-600">Familiares</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-600">Ativos</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center">
                <Mail className="w-7 h-7 text-amber-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-600">Convites Pendentes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Family Members List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Membros da Família</h3>
              <p className="text-sm text-gray-500 mt-1">Pessoas com acesso aos seus memoriais</p>
            </div>
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-lg shadow-teal-500/25">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Convidar Familiar
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg bg-white">
                <DialogHeader>
                  <DialogTitle className="text-xl">Convidar Familiar</DialogTitle>
                  <DialogDescription>
                    Envie um convite para um familiar acessar e compartilhar memórias
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleInvite} className="space-y-5 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Familiar
                    </label>
                    <input
                      placeholder="Ex: João Silva"
                      value={inviteForm.name}
                      onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                      required
                      className="input-modern"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-mail
                    </label>
                    <input
                      type="email"
                      placeholder="joao@email.com"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                      required
                      className="input-modern"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Memorial
                    </label>
                    <select
                      value={inviteForm.memorialId}
                      onChange={(e) => setInviteForm({ ...inviteForm, memorialId: e.target.value })}
                      required
                      className="input-modern"
                    >
                      <option value="">Selecione um memorial</option>
                      {memorials?.map((memorial) => (
                        <option key={memorial.id} value={memorial.id}>
                          {memorial.fullName}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-2">
                      Escolha qual memorial este familiar poderá acessar
                    </p>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                    <input
                      type="checkbox"
                      id="canEdit"
                      checked={inviteForm.canEdit}
                      onChange={(e) => setInviteForm({ ...inviteForm, canEdit: e.target.checked })}
                      className="mt-1 w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <div className="flex-1">
                      <label htmlFor="canEdit" className="block text-sm font-medium text-gray-900 cursor-pointer">
                        Permitir edição
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        O familiar poderá adicionar fotos, editar informações e gerenciar o memorial
                      </p>
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white">
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar Convite
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Family Members */}
          {familyMembers.length > 0 ? (
            <div className="space-y-4">
              {familyMembers.map((member: any) => (
                <div
                  key={member.id}
                  className="flex items-center gap-4 p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 hover:border-teal-100 hover:shadow-md transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-semibold">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900">{member.name}</h4>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {member.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {member.memorialCount || 0} memoriais
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.canEdit ? (
                      <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-medium flex items-center gap-1">
                        <Edit3 className="w-3 h-3" />
                        Pode editar
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        Apenas visualizar
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRevoke(member.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum familiar ainda
              </h3>
              <p className="text-gray-600 mb-6">
                Comece convidando familiares para compartilhar memórias juntos
              </p>
              <Button
                onClick={() => setShowInviteDialog(true)}
                className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-lg shadow-teal-500/25"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Convidar Primeiro Familiar
              </Button>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-100 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-2">Privacidade e Segurança</h4>
              <p className="text-sm text-blue-800 leading-relaxed">
                Os familiares convidados receberão um e-mail com um link seguro para criar sua conta.
                Você pode revogar o acesso a qualquer momento. Apenas você pode convidar novos membros
                e gerenciar as permissões.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
