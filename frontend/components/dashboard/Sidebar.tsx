import Link from 'next/link';

const menuItems = [
  { name: 'ダッシュボード', href: '/dashboard', icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' },
  { name: '投稿管理', href: '/dashboard/posts', icon: 'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z' },
  { name: 'インサイト', href: '/dashboard/insights', icon: 'M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z' },
  { name: 'クチコミ', href: '/dashboard/reviews', icon: 'M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V7h2v3z' },
  { name: 'メッセージ', href: '/dashboard/messages', icon: 'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z' },
  { name: 'レポート出力', href: '/dashboard/reports', icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z' },
];

const toolsItems = [
  { name: '写真管理', href: '/dashboard/photos', icon: 'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z' },
  { name: 'Q&A管理', href: '/dashboard/qa', icon: 'M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z' },
  { name: 'QRコード生成', href: '/dashboard/qrcode', icon: 'M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM13 13h2v2h-2zM15 15h2v2h-2zM13 17h2v2h-2zM17 17h2v2h-2zM19 15h2v2h-2zM17 13h2v2h-2zM19 19h2v2h-2zM15 19h2v2h-2z' },
  { name: 'プロフィール最適化', href: '/dashboard/optimize', icon: 'M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z' },
];

const settingsItems = [
  { name: 'ユーザー管理', href: '/dashboard/users', icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
  { name: '店舗情報', href: '/dashboard/profile', icon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z' },
  { name: '店舗管理', href: '/dashboard/stores', icon: 'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z' },
  { name: '設定', href: '/dashboard/settings', icon: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.04.64.09.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.58 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z' },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  return (
    <aside className="w-64 h-screen bg-deep-navy/95 backdrop-blur-xl border-r border-white/10 overflow-y-auto relative">
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
        <select className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-aurora-cyan">
          <option>渋谷店</option>
          <option>新宿店</option>
          <option>池袋店</option>
          <option>すべての店舗</option>
        </select>
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

      <div className="absolute bottom-0 w-full p-4">
        <div className="glass-card p-4 rounded-xl">
          <p className="text-xs text-slate-400 mb-2">MEO総合スコア</p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-white">A+</span>
            <span className="text-xs text-aurora-cyan mb-1">前月比+12%</span>
          </div>
          <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-linear-to-r from-aurora-purple to-aurora-cyan h-full w-[85%] rounded-full"></div>
          </div>
        </div>
      </div>
    </aside>
  );
}
