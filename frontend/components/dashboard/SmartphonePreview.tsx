import Image from 'next/image';

export function SmartphonePreview({ content, image, storeName }: { content: string; image?: string; storeName?: string }) {
    return (
      <div className="relative w-[300px] h-[600px] bg-black rounded-[3rem] border-8 border-slate-800 shadow-2xl overflow-hidden mx-auto">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-6 bg-slate-800 rounded-b-xl z-20"></div>
        
        {/* Google Maps UI モック */}
        <div className="w-full h-full bg-white text-slate-900 overflow-y-auto pt-8">
            <div className="bg-slate-100 p-2 text-xs text-center border-b font-medium">最新情報</div>
            
            <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-linear-to-tr from-aurora-purple to-aurora-cyan flex items-center justify-center text-white text-sm font-bold">{storeName ? storeName.charAt(0) : "渋"}</div>
                    <div>
                        <div className="font-bold text-sm">{storeName || "渋谷店"}</div>
                        <div className="text-xs text-slate-500">たった今</div>
                    </div>
                </div>
                
                <p className="text-sm mb-3 whitespace-pre-wrap leading-relaxed">{content || "AIで生成された投稿がここに表示されます..."}</p>
                
                <div className="w-full aspect-square bg-linear-to-br from-slate-200 to-slate-300 rounded-lg overflow-hidden flex items-center justify-center relative">
                    {image ? (
                        <Image 
                          src={image} 
                          alt="プレビュー" 
                          fill 
                          className="object-cover"
                          sizes="(max-width: 300px) 100vw, 300px"
                        />
                    ) : (
                        <div className="text-slate-400 text-xs text-center p-4">
                          <div className="text-4xl mb-2">📸</div>
                          AI生成画像
                        </div>
                    )}
                </div>
                
                <div className="mt-4 flex gap-2">
                    <button className="flex-1 py-2 bg-blue-600 text-white text-xs font-bold rounded-full">電話する</button>
                    <button className="flex-1 py-2 border border-slate-300 text-slate-600 text-xs font-bold rounded-full">詳細を見る</button>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>👍 いいね 24</span>
                        <span>💬 コメント 3</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
  }
