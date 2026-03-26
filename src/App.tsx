import React, { createContext, useContext, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ResumeConfig } from './components/ResumeConfig';
import { PlatformManager } from './components/PlatformManager';
import { ApplicationLog } from './components/ApplicationLog';
import { Opportunities } from './components/Opportunities';
import { ErrorBoundary } from './components/ErrorBoundary';

import type { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInAsGuest: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 获取初始 session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 添加一个直接预览的测试登录方法
  const signInAsGuest = () => {
    // 伪造一个用户以便于前端渲染测试
    setUser({
      id: 'guest-preview-id',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'guest@example.com',
      email_confirmed_at: new Date().toISOString(),
      phone: '',
      confirmation_sent_at: '',
      confirmed_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { full_name: '测试体验官', avatar_url: 'https://ui-avatars.com/api/?name=Guest&background=random' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as User);
    setLoading(false);
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('登出失败:', error);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signInAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const { signInAsGuest } = useAuth();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    try {
      if (isLogin) {
        // 登录
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
      } else {
        // 注册
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: email.split('@')[0] } 
          }
        });
        if (error) throw error;
        alert('注册成功！(如果 Supabase 开启了邮箱验证，请去邮箱点确认链接，然后返回这里登录)');
        setIsLogin(true); // 注册成功后跳回登录
      }
    } catch (error: any) {
       console.error('认证错误:', error);
       setErrorMsg(error.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-6">
      <div className="bg-surface-container-lowest p-10 rounded-3xl shadow-2xl max-w-md w-full border border-outline-variant/10">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto">
            <span className="material-symbols-outlined text-primary text-4xl">rocket_launch</span>
          </div>
          <h1 className="text-3xl font-bold text-on-surface mb-2">数字策展人</h1>
          <p className="text-on-surface-variant text-sm">自动化您的职业生涯。集中管理简历、平台与投递日志。</p>
        </div>
        
        <form onSubmit={handleAuth} className="space-y-4">
          {errorMsg && (
            <div className="bg-error/10 text-error p-3 rounded-lg text-sm text-center font-medium">
              {errorMsg}
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">邮箱账号</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary transition-all p-3.5 text-on-surface" 
              placeholder="name@example.com" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">密码</label>
            <input 
              type="password" 
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary transition-all p-3.5 text-on-surface" 
              placeholder="至少 6 位密码" 
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-2 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-container transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? <span className="material-symbols-outlined animate-spin">sync</span> : null}
            {isLogin ? '安全登录' : '立即注册'}
          </button>
          
          <div className="text-center text-sm mt-4">
            <span className="text-on-surface-variant">
              {isLogin ? '还没有账号？' : '已有账号？'}
            </span>
            <button 
              type="button" 
              onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }}
              className="text-primary font-bold hover:underline ml-1"
            >
              {isLogin ? '去注册' : '去登录'}
            </button>
          </div>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-outline-variant/30"></span>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-surface-container-lowest px-2 text-on-surface-variant tracking-wider">OR</span>
            </div>
          </div>

          <button 
            type="button"
            onClick={signInAsGuest}
            className="w-full py-3 bg-secondary-container text-on-secondary-container font-bold rounded-xl hover:bg-secondary-fixed transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined">visibility</span>
            免登录直接预览体验
          </button>
        </form>
      </div>
    </div>
  );
}

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/resume" element={<ResumeConfig />} />
        <Route path="/platforms" element={<PlatformManager />} />
        <Route path="/logs" element={<ApplicationLog />} />
        <Route path="/opportunities" element={<Opportunities />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <ProtectedRoutes />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
