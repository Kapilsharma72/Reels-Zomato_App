import '../styles/Auth.css';

export default function AuthCard({ title, subtitle, children, altLinks, handleSubmit }) {
  return (
    <section className="auth-wrap">
      <div className="auth-card" role="region" aria-label={title}>
        <h1 className="auth-title">{title}</h1>
        {subtitle && <p className="auth-subtitle">{subtitle}</p>}
        <form className="form" onSubmit={handleSubmit}>
          {children}
          <button className="btn btn-primary" type="submit">
            Continue
          </button>
        </form>
        {altLinks && <div className="alt-links">{altLinks}</div>}
      </div>
    </section>
  );
}
