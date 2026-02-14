
import React, { useState } from 'react';
import { ICONS, SIDEBAR_LOGO } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  notificationCount: number;
  pendingCount: number;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onLogout, notificationCount, pendingCount }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: <ICONS.Dashboard /> },
    {
      id: 'projects_root',
      name: 'Projects',
      icon: <ICONS.Projects />,
      subItems: [
        { id: 'projects', name: 'Active Projects' },
        { id: 'pending', name: 'Pending Approval', badge: pendingCount },
        { id: 'archived', name: 'Archived' },
      ]
    },
    // Mission Control (task board) removed
    { id: 'clients', name: 'Clients', icon: <ICONS.Clients /> },
    { id: 'teams', name: 'Teams', icon: <ICONS.Teams /> },
  ];

  const SidebarContent = () => (
    <>
      <div className="px-10 py-12 flex items-center justify-between">
        <SIDEBAR_LOGO />
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden p-2 hover:bg-slate-50 rounded-xl"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex-1 px-6 overflow-y-auto">
        <div className="mb-6 px-4 text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.3em]">
          Main Menu
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id || (item.subItems && item.subItems.some(sub => sub.id === activeTab));

            return (
              <div key={item.id} className="space-y-2">
                <button
                  onClick={() => {
                    if (item.subItems) {
                      setActiveTab(item.subItems[0].id);
                    } else {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }
                  }}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-[20px] transition-all duration-300 group ${isActive && !item.subItems
                      ? 'bg-[#2563EB] text-white shadow-xl shadow-blue-500/20'
                      : isActive && item.subItems
                        ? 'text-[#2563EB]'
                        : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50'
                    }`}
                >
                  <div className={`${isActive ? '' : 'text-[#94A3B8] group-hover:text-[#475569]'} transition-colors`}>
                    {item.icon}
                  </div>
                  <span className="font-bold text-[15px]">
                    {item.name}
                  </span>
                </button>

                {item.subItems && isActive && (
                  <div className="ml-10 space-y-1 mt-2">
                    {item.subItems.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => {
                          setActiveTab(sub.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-6 py-3 rounded-[16px] text-[14px] font-medium transition-all ${activeTab === sub.id
                            ? 'bg-blue-50 text-[#2563EB]'
                            : 'text-[#94A3B8] hover:text-[#0F172A]'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{sub.name}</span>
                          {sub.badge !== undefined && sub.badge > 0 && (
                            <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {sub.badge}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      <div className="px-8 pb-4">
        <button
          onClick={() => {
            setActiveTab('settings');
            setIsMobileMenuOpen(false);
          }}
          className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all font-bold text-[14px] ${activeTab === 'settings' ? 'bg-[#2563EB] text-white shadow-xl shadow-blue-500/20' : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50'}`}
        >
          <ICONS.Settings />
          <span>Settings</span>
        </button>
      </div>

      <div className="px-8 pb-8">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-6 py-4 text-[#EF4444] hover:bg-rose-50 rounded-2xl transition-all font-bold text-[14px]"
        >
          <ICONS.Logout />
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-[#1E293B] font-sans selection:bg-blue-100 selection:text-blue-900 overflow-hidden">
      <aside className="w-[320px] bg-white border-r border-[#F1F5F9] flex flex-col hidden lg:flex h-full shadow-[20px_0_40px_rgba(0,0,0,0.01)]">
        <SidebarContent />
      </aside>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <aside
            className="w-[280px] bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-left duration-300"
            onClick={e => e.stopPropagation()}
          >
            <SidebarContent />
          </aside>
        </div>
      )}

      <main className="flex-1 overflow-y-auto flex flex-col relative">
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200/80 sticky top-0 z-50">
          <div className="flex items-center gap-4 lg:gap-6">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 bg-[#F8FAFC] rounded-xl text-[#64748B] hover:text-[#0F172A]"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="relative group hidden sm:block">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#94A3B8]">
                <ICONS.Search />
              </div>
              <input
                type="text"
                placeholder="Search resources..."
                className="pl-12 pr-6 py-3 bg-[#F8FAFC] border border-[#F1F5F9] rounded-[18px] text-[14px] w-48 sm:w-64 lg:w-80 focus:lg:w-[400px] focus:bg-white focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-6">
            <button className="relative p-3 text-[#94A3B8] hover:text-[#0F172A] transition-all">
              <ICONS.Bell />
              {notificationCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
              )}
            </button>
            <div className="flex items-center gap-3 sm:gap-4 sm:pl-6 sm:border-l border-[#F1F5F9]">
              <div className="text-right hidden sm:block">
                <p className="text-[13px] font-bold text-[#0F172A]">ADMIN USER</p>
                <p className="text-[11px] font-medium text-[#64748B]">STRATIS HQ</p>
              </div>
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center font-bold text-sm shadow-xl shadow-slate-200">
                AU
              </div>
            </div>
          </div>
        </header>

        <div className="p-5 sm:p-6 lg:p-8 max-w-[1400px] mx-auto w-full min-h-0">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
