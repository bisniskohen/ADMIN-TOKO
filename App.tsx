import React, { useState, useEffect, useCallback } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';

import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import DataManagement from './components/DataManagement';
import ShopManagement from './components/ShopManagement';
import AdminManagement from './components/AdminManagement';
import CreatorHub from './components/CreatorHub';
import CreatorSamples from './components/CreatorSamples';


type View = 'dashboard' | 'data' | 'shopManagement' | 'adminManagement' | 'creatorHub' | 'creatorSamples';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const renderContent = useCallback(() => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'data':
        return <DataManagement />;
      case 'shopManagement':
        return <ShopManagement />;
      case 'adminManagement':
        return <AdminManagement />;
      case 'creatorHub':
        return <CreatorHub />;
      case 'creatorSamples':
        return <CreatorSamples />;
      default:
        return <Dashboard />;
    }
  }, [currentView]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-primary">
        <div className="text-white text-xl">Memuat...</div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-light">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-light p-4 md:p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;