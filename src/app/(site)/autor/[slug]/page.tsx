import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingAside } from "@/components/news/ListingAside";
import { PostList, pageFrom } from "@/components/news/PostList";
import { PageHeader } from "@/components/site/PageHeader";
import { getAuthors, getCategoryMap, getPublishedPosts } from "@/lib/content";

export const revalidate = 60;

async function findAuthor(slug: string) {
  return (await getAuthors()).find((a) => a.slug === slug) ?? null;
}

export async function generateMetadata({ params }: PageProps<"/autor/[slug]">): Promise<Metadata> {
  const a = await findAuthor((await params).slug);
  if (!a) return { title: "Autor no encontrado" };
  return { title: a.name, description: a.bio, alternates: { canonical: `/autor/${a.slug}` } };
}

export default async function AuthorPage({ params, searchParams }: PageProps<"/autor/[slug]">) {
  const a = await findAuthor((await params).slug);
  if (!a) notFound();
  const page = pageFrom((await searchParams).pagina);
  const [all, cats] = await Promise.all([getPublishedPosts(), getCategoryMap()]);
  const posts = all.filter((p) => p.authorId === a.id);
  return (
    <>
      <PageHeader kicker={a.role} title={a.name} description={a.bio} />
      <div className="container-x mt-12 grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-8">
          <PostList posts={posts} cats={cats} page={page} basePath={`/autor/${a.slug}`} />
        </div>
        <div className="lg:col-span-4">
          <ListingAside />
        </div>
      </div>
    </>
  );
}
