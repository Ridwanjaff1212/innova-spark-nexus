import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Github, Globe, Linkedin, Twitter, ArrowLeft, Sparkles } from "lucide-react";

type PortfolioRow = {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  bio: string | null;
  theme: string | null;
  social_links: Record<string, string> | null;
  is_public: boolean | null;
};

const THEMES: Record<string, { label: string; wrapperClass: string }> = {
  modern: { label: "Modern Minimal", wrapperClass: "bg-card" },
  gradient: { label: "Gradient Flow", wrapperClass: "bg-card" },
  nature: { label: "Nature Green", wrapperClass: "bg-card" },
  sunset: { label: "Sunset Warm", wrapperClass: "bg-card" },
  ocean: { label: "Ocean Blue", wrapperClass: "bg-card" },
  gold: { label: "Royal Gold", wrapperClass: "bg-card" },
};

export default function PublicPortfolio() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState<PortfolioRow | null>(null);

  const theme = useMemo(() => {
    const key = portfolio?.theme || "modern";
    return THEMES[key] || THEMES.modern;
  }, [portfolio?.theme]);

  useEffect(() => {
    const run = async () => {
      if (!slug) return;
      setLoading(true);

      const { data, error } = await supabase
        .from("portfolios")
        .select("id,user_id,slug,title,bio,theme,social_links,is_public")
        .eq("slug", slug)
        .maybeSingle();

      if (error) {
        setPortfolio(null);
        setLoading(false);
        return;
      }

      setPortfolio((data as PortfolioRow) ?? null);
      setLoading(false);
    };

    run();
  }, [slug]);

  useEffect(() => {
    if (!portfolio?.title) return;
    document.title = `${portfolio.title} | TechnoVista`;
  }, [portfolio?.title]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Loading portfolio…
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Please wait.</CardContent>
        </Card>
      </div>
    );
  }

  if (!portfolio || portfolio.is_public === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Portfolio not found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This portfolio link is invalid or the portfolio is private.
            </p>
            <Button asChild variant="outline" className="gap-2">
              <Link to="/">
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const social = portfolio.social_links || {};

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/40 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-6 py-5 flex items-center justify-between">
          <Button asChild variant="ghost" className="gap-2">
            <Link to="/">
              <ArrowLeft className="w-4 h-4" />
              TechnoVista
            </Link>
          </Button>
          <Badge variant="secondary">{theme.label}</Badge>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <section className={`rounded-2xl border border-border ${theme.wrapperClass} p-8`}
          aria-label="Portfolio overview"
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">{portfolio.title}</h1>
              <p className="text-muted-foreground max-w-2xl">{portfolio.bio || ""}</p>
            </div>

            <div className="flex items-center gap-2">
              {social.github && (
                <Button asChild variant="outline" size="icon" title="GitHub">
                  <a href={social.github} target="_blank" rel="noreferrer">
                    <Github />
                  </a>
                </Button>
              )}
              {social.linkedin && (
                <Button asChild variant="outline" size="icon" title="LinkedIn">
                  <a href={social.linkedin} target="_blank" rel="noreferrer">
                    <Linkedin />
                  </a>
                </Button>
              )}
              {social.twitter && (
                <Button asChild variant="outline" size="icon" title="Twitter">
                  <a href={social.twitter} target="_blank" rel="noreferrer">
                    <Twitter />
                  </a>
                </Button>
              )}
              {social.website && (
                <Button asChild variant="outline" size="icon" title="Website">
                  <a href={social.website} target="_blank" rel="noreferrer">
                    <Globe />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 text-sm text-muted-foreground">
          Generated with TechnoVista Portfolio Generator.
        </section>
      </main>
    </div>
  );
}
