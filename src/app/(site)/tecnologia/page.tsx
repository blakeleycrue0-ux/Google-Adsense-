import type { Metadata } from "next";
import Link from "next/link";
import { ListingAside } from "@/components/news/ListingAside";
import { PostList, pageFrom } from "@/components/news/PostList";
import { PageHeader } from "@/components/site/PageHeader";
import { getCategories, getCategoryMap, getPublishedPosts } from "@/lib/content";

export const metadata: Metadata = {
  title: "Tecnología",
  description: "Inteligencia artificial, ordenadores, Apple, Android, videojuegos, conectividad y regulación tecnológica.",
  alternates: { canonical: "/tecnologia" },
};

export default async function TechPage({ searchParams }: PageProps<"/tecnologia">) {
  const page = pageFrom((await searchParams).pagina);
  const [posts, cats, categories] = await Promise.all([getPublishedPosts(), getCategoryMap(), getCategories()]);
  return (
    <>
      <PageHeader
        kicker="Sección"
        emoji="💻"
        title="Tecnología"
        description="Toda la actualidad tecnológica. Filtra por tema para ir directo a lo que te interesa."
      >
        <nav aria-label="Temas" className="no-scrollbar -mx-4 mt-8 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/categoria/${c.slug}`}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-sm border border-line px-3.5 text-[14px] transition-colors hover:border-ink"
            >
              {c.emoji && <span aria-hidden>{c.emoji}</span>}
              {c.name}
            </Link>
          ))}
        </nav>
      </PageHeader>
      <div className="container-x mt-12 grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-8">
          <PostList posts={posts} cats={cats} page={page} basePath="/tecnologia" />
        </div>
        <div className="lg:col-span-4">
          <ListingAside />
        </div>
      </div>
    </>
  );
}
