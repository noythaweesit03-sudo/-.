import React, { useState } from 'react';
import { StorageService } from '../utils/storage';
import { User } from '../types';
import { ShieldCheck, Lock, User as UserIcon, AlertCircle } from 'lucide-react';

interface LoginModalProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('somchai');
  const [password, setPassword] = useState('1234');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const user = await StorageService.authenticate(username, password);
      if (!user) {
        setError('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง หรือบัญชีถูกระงับการใช้งาน');
      } else {
        onLoginSuccess(user);
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
    setIsLoading(true);
    const user = await StorageService.authenticate(u, p);
    setIsLoading(false);
    if (user) {
      onLoginSuccess(user);
    } else {
      setError('ไม่สามารถเข้าสู่ระบบด้วยบัญชีนี้ได้');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden">
      {/* Background geometric accents */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-4 shadow-lg shadow-emerald-950/50">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            ระบบจัดทำและพิมพ์เช็ค
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Cheque Management & Printing System (KTB / BAAC / GSB)
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
          <div className="mb-6 pb-4 border-b border-slate-700/60">
            <h2 className="text-base font-semibold text-slate-200">เข้าสู่ระบบเพื่อปฏิบัติงาน</h2>
            <p className="text-xs text-slate-400 mt-0.5">ระบุตัวตนเพื่อการบันทึกประวัติการสร้าง แก้ไข และออกเช็คย้อนหลัง</p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-950/50 border border-red-800/60 text-red-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                ชื่อผู้ใช้งาน (Username)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="เช่น somchai หรือ admin"
                  className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                รหัสผ่าน (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg shadow-md shadow-emerald-950 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-8 pt-5 border-t border-slate-700/60">
            <span className="block text-xs font-medium text-slate-400 mb-2.5">
              เลือกบัญชีสาธิตเพื่อทดสอบระบบทันที:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('somchai', '1234')}
                className="text-left p-2 rounded-lg bg-slate-900/60 hover:bg-slate-700/60 border border-slate-700/80 text-xs transition-colors cursor-pointer group"
              >
                <div className="font-medium text-slate-200 group-hover:text-emerald-400">นายสมชาย (USER)</div>
                <div className="text-[11px] text-slate-400">เจ้าหน้าที่การเงิน</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('suda', '1234')}
                className="text-left p-2 rounded-lg bg-slate-900/60 hover:bg-slate-700/60 border border-slate-700/80 text-xs transition-colors cursor-pointer group"
              >
                <div className="font-medium text-slate-200 group-hover:text-emerald-400">นางสาวสุดา (USER)</div>
                <div className="text-[11px] text-slate-400">เจ้าหน้าที่พัสดุ</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="text-left p-2 rounded-lg bg-slate-900/60 hover:bg-slate-700/60 border border-slate-700/80 text-xs transition-colors cursor-pointer group sm:col-span-2"
              >
                <div className="font-medium text-slate-200 group-hover:text-emerald-400">นายชำนาญ การคลัง (ADMIN)</div>
                <div className="text-[11px] text-slate-400">หัวหน้าฝ่ายการเงิน / ผู้ดูแลระบบ</div>
              </button>
            </div>
          </div>

        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          ระบบบันทึกและจัดทำเช็คตามระเบียบงานคลังและพัสดุ · รองรับ KTB, BAAC, GSB
        </p>

      </div>
    </div>
  );
};
