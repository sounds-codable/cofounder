type VisibilityCardProps = {
  title: string;
  visible: string[];
  hidden: string[];
};

export function VisibilityCard({ title, visible, hidden }: VisibilityCardProps) {
  return (
    <article className="visibility-card">
      <h3>{title}</h3>
      <div className="visibility-columns">
        <section>
          <h4>对方将看到什么</h4>
          <ul>
            {visible.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section>
          <h4>对方暂时看不到什么</h4>
          <ul>
            {hidden.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
    </article>
  );
}
