import Link from 'next/link';
import { useDashboard } from '../../contexts/DashboardContext';

const menuItems = [
  { name: 'ダッシュボード', href: '/dashboard', icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' },
  { name: '投稿管理', href: '/dashboard/posts', icon: 'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z' },
  { name: 'インサイト', href: '/dashboard/insights', icon: 'M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z' },
  { name: '一括管理', href: '/dashboard/bulk', icon: 'M4 6h16v2H4zm2 4h12v2H6zm-2 4h16v2H4z' },
  { name: '感情分析(AI)', href: '/dashboard/insights/sentiment', icon: 'M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6A4.997 4.997 0 017 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z' },
  { name: 'クチコミ', href: '/dashboard/reviews', icon: 'M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V7h2v3z' },
  { name: 'メッセージ', href: '/dashboard/messages', icon: 'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z' },
];

const toolsItems = [
  { name: '店舗情報', href: '/dashboard/profile', icon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z' },
  { name: '写真管理', href: '/dashboard/photos', icon: 'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z' },
  { name: 'Q&A管理', href: '/dashboard/qa', icon: 'M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z' },
  { name: 'プロフィール最適化', href: '/dashboard/optimize', icon: 'M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z' },
];

const settingsItems = [
  { name: 'ユーザー管理', href: '/dashboard/users', icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
  { name: '店舗管理', href: '/dashboard/stores', icon: 'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z' },
  { name: '設定', href: '/dashboard/settings', icon: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.04.64.09.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.58 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z' },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const { isDemoMode, toggleDemoMode, syncData, availableStores, userInfo } = useDashboard();

  return (
    <aside className="w-64 h-screen bg-deep-navy/95 backdrop-blur-xl border-r border-white/10 flex flex-col relative z-50">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-aurora-purple to-aurora-cyan">
              MEO Mastermind
            </h1>
            <p className="text-xs text-slate-400 mt-1">エンタープライズ版</p>
          </div>
          {/* Mobile Close Button */}
          {onClose && (
            <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* 店舗切替 */}
        <div className="p-4 border-b border-white/10">
          <label className="text-xs text-slate-500 mb-2 block">店舗を選択</label>
          <select 
            className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-aurora-cyan"
            value={userInfo?.store_id || ''}
            onChange={(e) => {
                alert(`店舗ID: ${e.target.value} に切り替えます (実装準備中)`);
            }}
          >
            <option value="">店舗を選択してください</option>
            {availableStores.map(store => (
                <option key={store.id} value={store.id}>{store.name}</option>
            ))}
          </select>
        </div>

        {/* Sync & Demo Mode */}
        <div className="p-4 border-b border-white/10 space-y-3">
            {/* Sync Button */}
            <button
                onClick={() => {
                   if(confirm("Googleビジネスプロフィールと同期しますか？")) {
                       syncData();
                   }
                }}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg transition-colors border border-white/5"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-sm font-bold">Google同期</span>
            </button>

             {/* Demo Mode Toggle */}
             <div className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-white/5">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">デモモード</span>
                    {isDemoMode && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-aurora-cyan opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-aurora-cyan"></span></span>}
                </div>
                <button 
                  onClick={toggleDemoMode}
                  className={`${isDemoMode ? 'bg-aurora-cyan' : 'bg-slate-700'} relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                >
                   <span className="sr-only">Toggle demo mode</span>
                   <span
                     aria-hidden="true"
                     className={`${isDemoMode ? 'translate-x-4' : 'translate-x-0'} pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                   />
                </button>
             </div>
        </div>
      
      {/* メインメニュー */}
        <nav className="p-4 space-y-1">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 px-4">メイン</p>
          {menuItems.map((item) => (
            <Link 
              key={item.name} 
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-all group"
            >
              <svg className="w-5 h-5 fill-current text-slate-400 group-hover:text-aurora-cyan transition-colors" viewBox="0 0 24 24">
                <path d={item.icon} />
              </svg>
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* ツール */}
        <nav className="p-4 pt-0 space-y-1">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 px-4">ツール</p>
          {toolsItems.map((item) => (
            <Link 
              key={item.name} 
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-all group"
            >
              <svg className="w-5 h-5 fill-current text-slate-400 group-hover:text-aurora-purple transition-colors" viewBox="0 0 24 24">
                <path d={item.icon} />
              </svg>
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* マニュアル */}
        <nav className="p-4 pt-0 space-y-1">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 px-4">クライアントサポート</p>
            <Link 
              href="/dashboard/manual/usage"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-all group"
            >
              <svg className="w-5 h-5 fill-current text-slate-400 group-hover:text-amber-400 transition-colors" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
              </svg>
              <span className="font-medium text-sm">システム操作マニュアル</span>
            </Link>
            <Link 
              href="/dashboard/manual/meo-guide"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-all group"
            >
              <svg className="w-5 h-5 fill-current text-slate-400 group-hover:text-amber-400 transition-colors" viewBox="0 0 24 24">
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
              </svg>
              <span className="font-medium text-sm">MEO対策ガイド</span>
            </Link>
        </nav>

        {/* 設定 */}
        <nav className="p-4 pt-0 space-y-1">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 px-4">設定</p>
          {settingsItems.map((item) => (
            <Link 
              key={item.name} 
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-all group"
            >
              <svg className="w-5 h-5 fill-current text-slate-400 group-hover:text-green-400 transition-colors" viewBox="0 0 24 24">
                <path d={item.icon} />
              </svg>
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
