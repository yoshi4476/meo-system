'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, ArrowRight, Star, BarChart2, Settings } from 'lucide-react';
import Link from 'next/link';

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/settings`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        // If not completed, show modal
        if (!data.has_completed_onboarding) {
          setIsOpen(true);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const markAsCompleted = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ has_completed_onboarding: true })
      });
      setIsOpen(false);
    } catch (e) {
      console.error("Failed to update status", e);
    }
  };

  if (loading || !isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-100 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden">
        
        {/* Progress Bar */}
        <div className="h-1 bg-slate-800 w-full">
           <div 
             className="h-full bg-linear-to-r from-purple-500 to-pink-500 transition-all duration-500"
             style={{ width: `${(step / 3) * 100}%` }}
           />
        </div>

        <div className="p-8">
            <div className="absolute top-4 right-4">
               <button 
                  onClick={markAsCompleted}
                  className="p-1 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition"
               >
                 <X className="w-5 h-5" />
               </button>
            </div>

            {step === 1 && (
                <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Settings className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Google連携をしましょう</h2>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        MEO Mastermind AIへようこそ！<br/>
                        まずはGoogleビジネスプロフィールと連携して、店舗データを同期しましょう。
                    </p>
                    <div className="pt-4">
                        <button 
                          onClick={() => setStep(2)}
                          className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                        >
                          次へ <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="w-16 h-16 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Star className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">キーワードを設定</h2>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        AIが最適な投稿を作成するために、<br/>
                        お店の「強み」や「ターゲット地域」を設定画面で登録します。
                    </p>
                    <div className="pt-4 flex gap-3">
                        <button 
                          onClick={() => setStep(1)}
                          className="px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800"
                        >
                          戻る
                        </button>
                        <button 
                          onClick={() => setStep(3)}
                          className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
                        >
                          次へ <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <BarChart2 className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">準備完了です！</h2>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        設定画面から「Googleでログイン」ボタンを押して連携を開始してください。<br/>
                        その後、自動でデータ同期が始まります。
                    </p>
                    <div className="pt-4">
                        <Link href="/dashboard/settings">
                            <button 
                              onClick={markAsCompleted}
                              className="w-full bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-green-500/20 transition-all flex items-center justify-center gap-2"
                            >
                              <Check className="w-5 h-5" />
                              設定画面へ移動する
                            </button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
