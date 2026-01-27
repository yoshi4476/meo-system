export default function ComingSoon({ title, description }: { title: string, description: string }) {
  return (
    <div className="space-y-6">
       <div>
          <h1 className="text-3xl font-bold text-white">{title}</h1>
          <p className="text-slate-400 mt-1">{description}</p>
       </div>

       <div className="glass-card p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
            <div className="text-6xl mb-6 opacity-50">🚧</div>
            <h2 className="text-2xl font-bold text-white mb-4">現在開発中です</h2>
            <p className="text-slate-400 max-w-lg leading-relaxed">
                この機能は次回のアップデートで提供予定です。<br/>
                ご不便をおかけしますが、今しばらくお待ちください。
            </p>
       </div>
    </div>
  );
}
