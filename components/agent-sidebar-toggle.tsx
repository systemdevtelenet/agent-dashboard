'use client';

import { Menu } from 'lucide-react';

export default function AgentSidebarToggle() {
  return <button className="topbar-menu" type="button" aria-label="Open navigation" onClick={() => window.dispatchEvent(new Event('open-agent-sidebar'))}><Menu /></button>;
}
