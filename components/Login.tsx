import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { APP_PASSWORD } from '../constants';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === APP_PASSWORD) {
      onLogin();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-lg border border-gray-200">
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg">
            <Lock className="w-10 h-10 text-white" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-3">Virginia AI</h2>
        <p className="text-center text-gray-500 mb-10 text-lg">AXA 智能保險顧問系統</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">請輸入訪問密碼</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              // Modified for high contrast: Dark black background, White text
              className="w-full px-5 py-4 rounded-xl border border-gray-300 bg-black text-white text-lg focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all placeholder-gray-500"
              placeholder="密碼..."
              autoFocus
            />
          </div>
          
          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-base font-medium text-center rounded-xl border border-red-200">
              密碼錯誤，請重試。
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform active:scale-[0.99] text-lg"
          >
            解鎖進入
          </button>
        </form>
        
        <div className="mt-10 text-center text-sm text-gray-400">
          Virginia AI 內部系統 | 僅限授權人員使用
        </div>
      </div>
    </div>
  );
};

export default Login;