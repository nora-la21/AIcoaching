'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Mic,
  LayoutDashboard,
  MessageSquare,
  History,
  FileText,
  Settings,
  Zap,
  PhoneCall,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/practice', label: 'Practice', icon: MessageSquare },
  { href: '/real-calls', label: 'Real Calls', icon: PhoneCall },
  { href: '/sessions', label: 'Sessions', icon: History },
  { href: '/scripts', label: 'Scripts', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-60 flex flex-col border-r"
      style={{
        backgroundColor: '#16161f',
        borderColor: '#2a2a3c',
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: '#2a2a3c' }}>
        <div
          className="flex items-center justify-center w-9 h-9 rounded-lg"
          style={{ backgroundColor: '#6366f1' }}
        >
          <Mic size={18} color="white" />
        </div>
        <div>
          <span className="text-base font-semibold" style={{ color: '#f1f5f9' }}>
            AI Coach
          </span>
          <div className="flex items-center gap-1 mt-0.5">
            <Zap size={10} style={{ color: '#6366f1' }} />
            <span className="text-xs" style={{ color: '#64748b' }}>
              Sales Training
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/' ? pathname === '/' : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group"
              style={{
                backgroundColor: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: isActive ? '#6366f1' : '#64748b',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#1e1e2a';
                  (e.currentTarget as HTMLAnchorElement).style.color = '#f1f5f9';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent';
                  (e.currentTarget as HTMLAnchorElement).style.color = '#64748b';
                }
              }}
            >
              <Icon
                size={17}
                style={{ color: isActive ? '#6366f1' : 'inherit' }}
              />
              <span>{label}</span>
              {isActive && (
                <div
                  className="ml-auto w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: '#6366f1' }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-4 py-4 border-t" style={{ borderColor: '#2a2a3c' }}>
        <div
          className="rounded-lg px-3 py-3"
          style={{ backgroundColor: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)' }}
        >
          <p className="text-xs font-medium mb-0.5" style={{ color: '#6366f1' }}>
            Pro Tip
          </p>
          <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>
            Practice daily to build muscle memory and improve your close rate.
          </p>
        </div>
      </div>
    </aside>
  );
}
