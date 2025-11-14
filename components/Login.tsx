
import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  AuthError
} from 'firebase/auth';
import { auth } from '../services/firebase';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginView, setIsLoginView] = useState(true);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      if (isLoginView) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      const authError = err as AuthError;
      switch (authError.code) {
        case 'auth/user-not-found':
          setError('Pengguna tidak ditemukan. Silakan periksa kembali email Anda.');
          break;
        case 'auth/wrong-password':
          setError('Kata sandi salah. Silakan coba lagi.');
          break;
        case 'auth/email-already-in-use':
          setError('Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.');
          break;
        case 'auth/weak-password':
          setError('Kata sandi terlalu lemah. Minimal 6 karakter.');
          break;
        default:
          setError('Terjadi kesalahan. Silakan coba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 space-y-6">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800">PT BMS</h1>
            <p className="text-gray-500 mt-2">{isLoginView ? 'Masuk ke akun Anda' : 'Buat akun baru'}</p>
        </div>
        <form onSubmit={handleAuthAction} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
              placeholder="anda@email.com"
            />
          </div>
          <div>
            <label htmlFor="password"className="block text-sm font-medium text-gray-700">Kata Sandi</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:bg-indigo-300"
            >
              {isLoading ? 'Memproses...' : (isLoginView ? 'Masuk' : 'Daftar')}
            </button>
          </div>
        </form>
        <p className="text-center text-sm text-gray-600">
          {isLoginView ? 'Belum punya akun?' : 'Sudah punya akun?'}
          <button onClick={() => { setIsLoginView(!isLoginView); setError(''); }} className="font-medium text-accent hover:text-indigo-500 ml-1">
            {isLoginView ? 'Daftar di sini' : 'Masuk di sini'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
