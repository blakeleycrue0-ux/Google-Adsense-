import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingAside } from "@/components/news/ListingAside";
import { PostList, pageFrom } from "@/components/news/PostList";
import { PageHeader } from "@/components/site/PageHeader";
import { getAllTags, getCategoryMap, getPostsByTagSlug } from "@/lib/content";

export const revalidate = 60;

export async function generateMetadata({ params }: PageProps<"/etiqueta/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const tag = (await getAllTags()).get(slug);
  if (!tag) return { title: "Etiqueta no encontrada" };
  return { title: `${tag.name}: noticias y guías`, alternates: { canonical: `/etiqueta/${slug}` } };
}

export default async function TagPage({ params, searchParams }: PageProps<"/etiqueta/[slug]">) {
  const { slug } = await params;
  const tag = (await getAllTags()).get(slug);
  if (!tag) notFound();
  const page = pageFrom((await searchParams).pagina);
  const [posts, cats] = await Promise.all([getPostsByTagSlug(slug), getCategoryMap()]);
  return (
    <>
      <PageHeader kicker="Etiqueta" title={tag.name} description={`${posts.length} ${posts.length === 1 ? "artículo" : "artículos"} sobre ${tag.name}.`} />
      <div className="container-x mt-12 grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-8">
          <PostList posts={posts} cats={cats} page={page} basePath={`/etiqueta/${slug}`} />
        </div>
        <div className="lg:col-span-4">
          <ListingAside />
        </div>
      </div>
    </>
  );
}
