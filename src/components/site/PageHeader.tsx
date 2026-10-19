export function PageHeader({
  kicker,
  title,
  emoji,
  description,
  children,
}: {
  kicker?: string;
  title: string;
  emoji?: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="container-x pt-10 sm:pt-14">
      {kicker && <p className="kicker text-muted">{kicker}</p>}
      <h1 className="headline mt-3 text-[40px] sm:text-[56px]">
        {emoji && (
          <span aria-hidden className="mr-3 inline-block text-[0.75em]">
            {emoji}
          </span>
        )}
        {title}
      </h1>
      {description && <p className="pretty mt-4 max-w-2xl text-[17px] leading-relaxed text-muted">{description}</p>}
      {children}
    </header>
  );
}
