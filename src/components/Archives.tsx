import React from 'react';
import { LogOut, ArrowRight } from 'lucide-react';

interface ArchivesProps {
  readonly user: { email: string; phone: string } | null;
  readonly onLogout: () => void;
}

export default function Archives({ user, onLogout }: ArchivesProps): React.JSX.Element {
  const products = [
    {
      id: 1,
      name: "Vintage Canvas Work Jacket",
      category: "Outerwear",
      price: "₹3,499",
      size: "L",
      condition: "9/10 Excellent Fade",
    },
    {
      id: 2,
      name: "Classic Brown Collar Sweatshirt",
      category: "Tops",
      price: "₹1,899",
      size: "M",
      condition: "10/10 Mint",
    },
    {
      id: 3,
      name: "Emerald Ribbed Johnny Collar",
      category: "Tops",
      price: "₹1,599",
      size: "S",
      condition: "Deadstock",
    },
    {
      id: 4,
      name: "Boxy Striped Rugby Polo",
      category: "Tops",
      price: "₹1,299",
      size: "XL",
      condition: "8.5/10 Very Good",
    },
  ];

  return (
    <div className="flex-grow max-w-7xl mx-auto px-6 md:px-12 pt-32 pb-20 w-full animate-fade-in relative z-10 text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-8 mb-12">
        <div>
          <span className="text-purple-400 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse-fast"></span>
            Access Status: Secured
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">
            Archives
          </h1>
          <p className="text-neutral-500 font-mono text-xs mt-2 uppercase tracking-widest">
            Welcome, {user?.email || 'Authenticated User'} // {user?.phone || '+91 XXXXX XXXXX'}
          </p>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center space-x-2 bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white px-5 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-300 cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
        >
          <LogOut size={14} />
          <span>Revoke Access</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="group relative bg-[#111]/40 border border-white/5 rounded-3xl p-6 hover:border-purple-500/30 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] transition-all duration-500 flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/10 transition-colors"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-neutral-300">
                  {product.category}
                </span>
                <span className="text-purple-400 font-mono text-xs font-bold">
                  {product.size}
                </span>
              </div>

              <h3 className="text-white font-black text-sm uppercase leading-tight tracking-tight mb-2 group-hover:text-purple-300 transition-colors">
                {product.name}
              </h3>
              <p className="text-neutral-500 font-mono text-[10px] uppercase tracking-widest mb-8">
                {product.condition}
              </p>
            </div>

            <div className="relative z-10 flex justify-between items-center mt-auto border-t border-white/5 pt-4">
              <span className="text-white font-black text-base">{product.price}</span>
              <button className="p-2.5 bg-white text-black hover:bg-purple-500 hover:text-white rounded-xl active:scale-90 transition-all cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.15)] hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
