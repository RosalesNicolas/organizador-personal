type ModuleCardProps = {
  title: string;
  description: string;
  accentClass: string;
};

export function ModuleCard({
  title,
  description,
  accentClass,
}: ModuleCardProps) {
  return (
    <article className={`module-card ${accentClass}`}>
      <h2>{title}</h2>
      <p>{description}</p>
    </article>
  );
}