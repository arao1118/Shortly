import { Link } from 'react-router-dom';
import { Link2 } from 'lucide-react';
export default function Logo() { return <Link className="logo" to="/"><span className="logo-mark"><Link2 size={18}/></span><span>Shortly</span></Link>; }
