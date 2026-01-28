'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '@/contexts/DashboardContext';

type Prompt = {
    id: string;
    title: string;
    content: string;
    category: string;
    is_locked: boolean;
    is_system: boolean;
};

export default function PromptsPage() {
    const { userInfo, isDemoMode } = useDashboard();
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
    
    // Form state
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('POST_GENERATION');
    const [isLocked, setIsLocked] = useState(false);

    useEffect(() => {
        fetchPrompts();
    }, [isDemoMode]);

    const fetchPrompts = async () => {
        setLoading(true);
        try {
            if (isDemoMode) {
                setPrompts([
                    { id: '1', title: 'フレンドリーな返信', content: 'ありがとうございます！またのご来店をお待ちしております。', category: 'REVIEW_REPLY', is_locked: true, is_system: true },
                    { id: '2', title: '新商品のお知らせ', content: '季節限定の新作が登場しました！ぜひお試しください。', category: 'POST_GENERATION', is_locked: false, is_system: false },
                    { id: '3', title: '謝罪（フォーマル）', content: 'この度は不快な思いをさせてしまい申し訳ございません。', category: 'REVIEW_REPLY', is_locked: true, is_system: true },
                ]);
                setLoading(false);
                return;
            }

            const token = localStorage.getItem('meo_auth_token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/prompts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setPrompts(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    // Redoing this content block to include isDemoMode properly in the full function replacement if I can, 
    // but I am targeting specific block. 
    // Let's replace the whole component start effectively in next steps.
    // For now, let's just make fetchPrompts robust or return mock if token missing?
    
    // Actually, I should update the whole component logic to use useDashboard correctly.
    // Let me update the top part of the file first to get isDemoMode.
    return; // cancelling this tool call to do it right

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('meo_auth_token');
        const url = editingPrompt 
            ? `${process.env.NEXT_PUBLIC_API_URL}/ai/prompts/${editingPrompt.id}`
            : `${process.env.NEXT_PUBLIC_API_URL}/ai/prompts`;
        
        const method = editingPrompt ? 'PATCH' : 'POST';
        
        try {
            const res = await fetch(url, {
                method,
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({ title, content, category, is_locked: isLocked })
            });
            
            if (res.ok) {
                setShowModal(false);
                fetchPrompts();
                resetForm();
            } else {
                alert("保存できませんでした");
            }
        } catch (e) {
            console.error(e);
        }
    };
    
    const handleDelete = async (id: string) => {
        if(!confirm("削除しますか？")) return;
        try {
            const token = localStorage.getItem('meo_auth_token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/prompts/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) fetchPrompts();
        } catch(e) { console.error(e); }
    };

    const resetForm = () => {
        setEditingPrompt(null);
        setTitle('');
        setContent('');
        setCategory('POST_GENERATION');
        setIsLocked(false);
    };

    const openCreate = () => {
        resetForm();
        setShowModal(true);
    };

    const openEdit = (p: Prompt) => {
        setEditingPrompt(p);
        setTitle(p.title);
        setContent(p.content);
        setCategory(p.category);
        setIsLocked(p.is_locked);
        setShowModal(true);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">プロンプト管理</h1>
                    <p className="text-slate-400 mt-1">AI生成に使用するプロンプトをカスタマイズできます</p>
                </div>
                <button 
                    onClick={openCreate}
                    className="bg-aurora-cyan text-deep-navy font-bold px-4 py-2 rounded-lg hover:bg-cyan-400"
                >
                    + 新規作成
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {prompts.map(p => (
                    <div key={p.id} className={`glass-card p-6 relative group ${p.is_locked ? 'border-amber-500/30' : ''}`}>
                        {p.is_system && <span className="absolute top-2 right-2 bg-slate-700 text-xs px-2 py-1 rounded">SYSTEM</span>}
                        {p.is_locked && !p.is_system && <span className="absolute top-2 right-2 bg-amber-500/20 text-amber-500 text-xs px-2 py-1 rounded">LOCKED</span>}
                        
                        <div className="mb-4">
                            <span className={`text-xs px-2 py-1 rounded ${p.category === 'POST_GENERATION' ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-400'}`}>
                                {p.category === 'POST_GENERATION' ? '投稿生成' : 'クチコミ返信'}
                            </span>
                            <h3 className="text-xl font-bold text-white mt-2">{p.title}</h3>
                        </div>
                        
                        <p className="text-slate-400 text-sm line-clamp-3 mb-4 bg-slate-900/50 p-2 rounded">
                            {p.content}
                        </p>
                        
                        {!p.is_system && (
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEdit(p)} className="text-sm text-slate-400 hover:text-white">編集</button>
                                <button onClick={() => handleDelete(p.id)} className="text-sm text-red-400 hover:text-red-300">削除</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="glass-card p-8 w-full max-w-lg">
                        <h2 className="text-2xl font-bold text-white mb-6">
                            {editingPrompt ? 'プロンプト編集' : '新規プロンプト'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-slate-400 text-sm mb-1">タイトル</label>
                                <input 
                                    type="text" 
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-sm mb-1">カテゴリ</label>
                                <select 
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                                >
                                    <option value="POST_GENERATION">投稿生成</option>
                                    <option value="REVIEW_REPLY">クチコミ返信</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-slate-400 text-sm mb-1">内容</label>
                                <textarea 
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                    className="w-full h-32 bg-slate-800 border border-slate-700 rounded p-2 text-white"
                                    required
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    checked={isLocked}
                                    onChange={e => setIsLocked(e.target.checked)}
                                    id="locked"
                                />
                                <label htmlFor="locked" className="text-slate-400 text-sm">ロックする（お気に入り）</label>
                            </div>
                            
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-400 hover:text-white">キャンセル</button>
                                <button type="submit" className="px-4 py-2 bg-aurora-cyan text-deep-navy font-bold rounded">保存</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
