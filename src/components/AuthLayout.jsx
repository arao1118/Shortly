import { Link } from 'react-router-dom';
import Logo from './Logo';
export default function AuthLayout({ title, subtitle, children, footer }) {
  return <div className="auth-shell"><div className="auth-glow one"/><div className="auth-glow two"/><header className="auth-header"><Logo/><Link className="text-link" to="/">Back to home</Link></header><main className="auth-card"><div className="eyebrow">SECURE URL MANAGEMENT</div><h1>{title}</h1><p className="muted">{subtitle}</p>{children}{footer && <div className="auth-footer">{footer}</div>}</main></div>;
}
