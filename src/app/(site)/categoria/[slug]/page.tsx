import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingAside } from "@/components/news/ListingAside";
import { PostList, pageFrom } from "@/components/news/PostList";
import { StackStory } from "@/components/news/Story";
import { PageHeader } from "@/components/site/PageHeader";
import { getCategories, getCategoryBySlug, getCategoryMap, getPosts } from "@/lib/content";

export const revalidate = 60;

export async function generateStaticParams() {
  return (await getCategories()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/categoria/[slug]">): Promise<Metadata> {
  const cat = await getCategoryBySlug((await params).slug);
  if (!cat) return { title: "Sección no encontrada" };
  return { title: cat.name, description: cat.description, alternates: { canonical: `/categoria/${cat.slug}` } };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/categoria/[slug]">) {
  const cat = await getCategoryBySlug((await params).slug);
  if (!cat) notFound();
  const page = pageFrom((await searchParams).pagina);
  const [posts, cats] = await Promise.all([getPosts({ categoryId: cat.id }), getCategoryMap()]);
  const [top, ...rest] = posts;
  return (
    <>
      <PageHeader kicker="Sección" emoji={cat.emoji} title={cat.name} description={cat.description} />
      <div className="container-x mt-12 grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-8">
          {top && page === 1 && (
            <div className="mb-10 border-b border-line pb-10">
              <StackStory post={top} category={cats.get(top.categoryId)} />
            </div>
          )}
          <PostList
            posts={page === 1 ? rest : posts.slice(1)}
            cats={cats}
            page={page}
            basePath={`/categoria/${cat.slug}`}
            emptyTitle={top ? "No hay más artículos en esta sección" : "Aún no hay artículos en esta sección"}
          />
        </div>
        <div className="lg:col-span-4">
          <ListingAside currentCategory={cat.id} />
        </div>
      </div>
    </>
  );
}
