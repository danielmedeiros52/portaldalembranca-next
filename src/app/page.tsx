import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Heart, QrCode, Users, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-slate-900 mb-6">
            Portal da Lembrança
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            Eternize memórias com QR codes em homenagens especiais
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="text-lg">
                Acessar
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="text-lg">
                Criar Conta
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
          <FeatureCard
            icon={<QrCode className="w-12 h-12 text-primary" />}
            title="QR Codes"
            description="Crie QR codes personalizados para cada memorial"
          />
          <FeatureCard
            icon={<Heart className="w-12 h-12 text-primary" />}
            title="Homenagens"
            description="Compartilhe histórias e preserve memórias"
          />
          <FeatureCard
            icon={<Users className="w-12 h-12 text-primary" />}
            title="Família"
            description="Convide familiares para colaborar"
          />
          <FeatureCard
            icon={<Shield className="w-12 h-12 text-primary" />}
            title="Seguro"
            description="Seus dados protegidos e privados"
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2 text-center">
        {title}
      </h3>
      <p className="text-slate-600 text-center">{description}</p>
    </div>
  );
}
