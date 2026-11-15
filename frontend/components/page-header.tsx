export function PageHeader({
  tag,
  title,
  description,
}: {
  tag: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="max-w-[720px]">
      <span className="tag text-ink">{tag}</span>
      <h1 className="t-48 mt-5">{title}</h1>
      {description ? (
        <p className="t-16 mt-4 max-w-[52ch] font-normal leading-[1.5] text-ink/65">
          {description}
        </p>
      ) : null}
    </header>
  );
}
