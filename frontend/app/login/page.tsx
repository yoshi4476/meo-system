'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // モックログイン
    // TODO: バッ​​クエンドと接続する際はここをAPIコールに置き換える
    setTimeout(() => {
      setIsLoading(false);
      router.push('/dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-card p-8 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-aurora-purple to-aurora-cyan inline-block pb-1">
            MEO Mastermind
          </h1>
          <p className="text-slate-400 mt-2">アカウントにログイン</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">メールアドレス</label>
            <input 
              type="email"
              required
              className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-aurora-cyan"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">パスワード</label>
            <input 
              type="password"
              required
              className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-aurora-cyan"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
        
        <div className="text-center">
           <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">パスワードをお忘れですか？</a>
        </div>
      </div>
    </div>
  );
}
