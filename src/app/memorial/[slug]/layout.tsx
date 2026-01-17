import { type Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  // In a real implementation, you would fetch the memorial data here
  // For now, we'll provide generic metadata
  // TODO: Fetch memorial data server-side for proper SEO

  return {
    title: "Memorial",
    description: "Página de memorial com história, fotos e dedicações",
    openGraph: {
      title: "Memorial",
      description: "Conheça a história e deixe sua dedicação",
      type: "profile",
    },
  };
}

export default function MemorialLayout({ children }: Props) {
  return <>{children}</>;
}
