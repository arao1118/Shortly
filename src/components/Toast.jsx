export default function Toast({ toast, onClose }) {
  if (!toast) return null;
  return <div className={`toast ${toast.type || 'error'}`} role="alert"><span>{toast.message}</span><button onClick={onClose}>×</button></div>;
}
