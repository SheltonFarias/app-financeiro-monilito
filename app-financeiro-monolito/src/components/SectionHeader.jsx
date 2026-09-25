/**
 * SectionHeader — Título de seção com slot para ações à direita.
 */
export default function SectionHeader({ title, children }) {
  return (
    <div className="section-header">
      <h2 className="section-header__title">{title}</h2>
      {children}
    </div>
  );
}
