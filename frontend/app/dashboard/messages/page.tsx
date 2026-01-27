'use client';
import { useState } from 'react';

// モックデータ：メッセージ
const mockMessages = [
  { 
    id: 1, 
    user: '佐藤 健太', 
    lastMessage: '本日、19時から3名で予約可能でしょうか？', 
    time: '10分前', 
    unread: true,
    avatarColor: 'bg-blue-500',
    history: [
      { sender: 'user', text: 'こんにちは。本日、19時から3名で予約可能でしょうか？', time: '10分前' }
    ] 
  },
  { 
    id: 2, 
    user: '鈴木 エミ', 
    lastMessage: 'ありがとうございます！楽しみにしています。', 
    time: '2時間前', 
    unread: false,
    avatarColor: 'bg-pink-500',
    history: [
      { sender: 'user', text: '来週のランチメニューを教えていただけますか？', time: '3時間前' },
      { sender: 'store', text: 'お問い合わせありがとうございます。来週は「春キャベツと桜エビのパスタ」をご用意しております。', time: '2時間前' },
      { sender: 'user', text: 'ありがとうございます！楽しみにしています。', time: '2時間前' }
    ]
  },
  { 
    id: 3, 
    user: 'Michael Brown', 
    lastMessage: 'Do you have a vegetarian menu?', 
    time: '昨日', 
    unread: false,
    avatarColor: 'bg-green-500',
    history: [
      { sender: 'user', text: 'Do you have a vegetarian menu?', time: '昨日' },
      { sender: 'store', text: 'Yes, we have several vegetarian options including vegetable curry and pasta.', time: '昨日' }
    ]
  },
];

export default function MessagesPage() {
  const [messages, setMessages] = useState(mockMessages);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // 返信プロンプト
  const [replyPrompt, setReplyPrompt] = useState('丁寧かつフレンドリーに返信して');
  const [promptLocked, setPromptLocked] = useState(true);

  const selectedChat = messages.find(m => m.id === selectedChatId);

  const handleSendMessage = () => {
    if (!inputText.trim() || !selectedChatId) return;
    
    setIsSending(true);
    
    // メッセージ送信シミュレーション
    setTimeout(() => {
      setMessages(prev => prev.map(m => {
        if (m.id === selectedChatId) {
          return {
            ...m,
            unread: false,
            lastMessage: inputText,
            time: 'たった今',
            history: [...m.history, { sender: 'store', text: inputText, time: 'たった今' }]
          };
        }
        return m;
      }));
      setInputText('');
      setIsSending(false);
    }, 500);
  };

  const handleSmartReply = () => {
    if (!selectedChatId) return;
    setIsSending(true);
    
    setTimeout(() => {
      const suggestions = [
        'お問い合わせありがとうございます。はい、ご予約可能です。',
        'ご連絡ありがとうございます。申し訳ございませんが、その時間は満席となっております。',
        'ご質問ありがとうございます。詳細は当店のウェブサイトをご覧ください。'
      ];
      const randomReply = suggestions[Math.floor(Math.random() * suggestions.length)];
      setInputText(randomReply);
      setIsSending(false);
    }, 800);
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-6">
      {/* 左カラム：チャットリスト */}
      <div className="w-1/3 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">メッセージ</h1>
          <div className="bg-aurora-purple/20 text-aurora-purple px-3 py-1 rounded-full text-xs font-bold border border-aurora-purple/30">
            AI対応モード: ON
          </div>
        </div>

        <div className="glass-card p-4 border border-aurora-cyan/30 bg-aurora-cyan/5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-aurora-cyan flex items-center gap-1">
              <span>🤖</span> AI返信アシスタント設定
            </label>
            <button
              onClick={() => setPromptLocked(!promptLocked)}
              className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full transition-colors ${promptLocked ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/10 text-slate-400 hover:bg-white/20'}`}
            >
              {promptLocked ? '🔒 ロック中' : '🔓 ロック'}
            </button>
          </div>
          <input
            type="text"
            className={`w-full bg-slate-900/50 border rounded-lg px-3 py-2 text-white text-xs focus:outline-none transition-colors ${promptLocked ? 'border-red-500/30 bg-red-500/5 text-slate-400' : 'border-white/10 focus:border-aurora-cyan'}`}
            value={replyPrompt}
            onChange={(e) => !promptLocked && setReplyPrompt(e.target.value)}
            disabled={promptLocked}
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {messages.map((chat) => (
            <div 
              key={chat.id}
              onClick={() => setSelectedChatId(chat.id)}
              className={`p-4 rounded-xl cursor-pointer transition-all border ${
                selectedChatId === chat.id
                  ? 'bg-aurora-purple/20 border-aurora-purple'
                  : 'bg-slate-800/50 border-white/5 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${chat.avatarColor} flex items-center justify-center text-sm font-bold text-white shadow-lg`}>
                  {chat.user.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-sm font-bold text-white truncate">{chat.user}</h3>
                    <span className="text-xs text-slate-500">{chat.time}</span>
                  </div>
                  <p className={`text-xs truncate ${chat.unread ? 'text-white font-bold' : 'text-slate-400'}`}>
                    {chat.lastMessage}
                  </p>
                </div>
                {chat.unread && (
                  <div className="w-2 h-2 rounded-full bg-aurora-cyan shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 右カラム：チャット詳細 */}
      <div className="flex-1 glass-card flex flex-col h-full relative overflow-hidden">
        {selectedChat ? (
          <>
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full ${selectedChat.avatarColor} flex items-center justify-center text-xs font-bold text-white`}>
                  {selectedChat.user.charAt(0)}
                </div>
                <span className="font-bold text-white">{selectedChat.user}</span>
              </div>
              <button className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-900/20">
              {selectedChat.history.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-4 ${
                    msg.sender === 'user' 
                      ? 'bg-slate-800 text-slate-200 rounded-tl-none' 
                      : 'bg-aurora-purple text-white rounded-tr-none shadow-lg shadow-purple-500/20'
                  }`}>
                    <p className="text-sm">{msg.text}</p>
                    <p className={`text-[10px] mt-1 text-right ${msg.sender === 'user' ? 'text-slate-500' : 'text-purple-200'}`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-white/10 bg-slate-900/80 backdrop-blur-md">
              <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-none">
                <button 
                  onClick={handleSmartReply}
                  disabled={isSending}
                  className="whitespace-nowrap px-3 py-1.5 rounded-full bg-aurora-cyan/10 border border-aurora-cyan/30 text-aurora-cyan text-xs hover:bg-aurora-cyan/20 transition-colors flex items-center gap-1"
                >
                  ✨ AI返信提案: 予約を受け付ける
                </button>
                <button 
                  onClick={handleSmartReply}
                  disabled={isSending}
                  className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs hover:bg-white/10 transition-colors"
                >
                  満席とお伝えする
                </button>
                <button 
                  onClick={handleSmartReply}
                  disabled={isSending}
                  className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs hover:bg-white/10 transition-colors"
                >
                  定型文: 営業時間
                </button>
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-aurora-purple transition-colors"
                  placeholder="メッセージを入力..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || isSending}
                  className="p-3 rounded-xl bg-aurora-purple hover:bg-aurora-purple/80 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/20"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
            <div className="text-4xl mb-4">💬</div>
            <p>左側のリストからメッセージを選択してください</p>
          </div>
        )}
      </div>
    </div>
  );
}
