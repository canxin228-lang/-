import React from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../App';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row">
      {/* 顶部导航栏 */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-surface-container-low/80 backdrop-blur-xl z-50 flex items-center justify-between px-6 md:px-12 border-b border-outline-variant/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center overflow-hidden">
            <img 
              src={user?.user_metadata?.avatar_url || "https://www.gravatar.com/avatar/?d=mp"} 
              alt="头像" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-xl font-bold text-primary tracking-tight">数字策展人</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button onClick={logout} className="p-2 rounded-full hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors" title="退出登录">
            <LogOut size={20} />
          </button>
          {/* 桌面端导航 */}
          <nav className="hidden md:flex items-center gap-8 ml-8">
            <NavLink to="/" className={({ isActive }) => cn("text-sm font-medium transition-colors", isActive ? "text-primary font-bold" : "text-on-surface-variant hover:text-primary")}>首页</NavLink>
            <NavLink to="/resume" className={({ isActive }) => cn("text-sm font-medium transition-colors", isActive ? "text-primary font-bold" : "text-on-surface-variant hover:text-primary")}>简历</NavLink>
            <NavLink to="/platforms" className={({ isActive }) => cn("text-sm font-medium transition-colors", isActive ? "text-primary font-bold" : "text-on-surface-variant hover:text-primary")}>平台</NavLink>
            <NavLink to="/logs" className={({ isActive }) => cn("text-sm font-medium transition-colors", isActive ? "text-primary font-bold" : "text-on-surface-variant hover:text-primary")}>日志</NavLink>
            <NavLink to="/opportunities" className={({ isActive }) => cn("text-sm font-medium transition-colors", isActive ? "text-primary font-bold" : "text-on-surface-variant hover:text-primary")}>发现</NavLink>
          </nav>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="flex-1 pt-20 pb-24 md:pb-12 px-6 md:px-12 max-w-7xl mx-auto w-full">
        {children}
      </main>

      {/* 移动端底部导航 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-surface-container-lowest/80 backdrop-blur-xl border-t border-outline-variant/10 flex justify-around items-center px-4 z-50">
        <NavLink to="/" className={({ isActive }) => cn("flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all", isActive ? "bg-primary text-on-primary" : "text-on-surface-variant")}><span className="material-symbols-outlined">home</span><span className="text-[10px] font-medium">首页</span></NavLink>
        <NavLink to="/resume" className={({ isActive }) => cn("flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all", isActive ? "bg-primary text-on-primary" : "text-on-surface-variant")}><span className="material-symbols-outlined">description</span><span className="text-[10px] font-medium">简历</span></NavLink>
        <NavLink to="/opportunities" className={({ isActive }) => cn("flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all", isActive ? "bg-primary text-on-primary" : "text-on-surface-variant")}><span className="material-symbols-outlined">explore</span><span className="text-[10px] font-medium">发现</span></NavLink>
        <NavLink to="/platforms" className={({ isActive }) => cn("flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all", isActive ? "bg-primary text-on-primary" : "text-on-surface-variant")}><span className="material-symbols-outlined">hub</span><span className="text-[10px] font-medium">平台</span></NavLink>
        <NavLink to="/logs" className={({ isActive }) => cn("flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all", isActive ? "bg-primary text-on-primary" : "text-on-surface-variant")}><span className="material-symbols-outlined">event_note</span><span className="text-[10px] font-medium">日志</span></NavLink>
      </nav>
    </div>
  );
}
