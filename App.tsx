
import React, { useState, useEffect, useCallback } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from './services/firebase';

import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import DataManagement from './components/DataManagement';
import ShopManagement from './components/ShopManagement';
import AdminManagement from './components/AdminManagement';
import CreatorHub from './components/CreatorHub';
import CreatorSamples from './components/CreatorSamples';
import AffiliateService from './components/AffiliateService';


type View = 'dashboard' | 'data' | 'shopManagement' | 'adminManagement' | 'creatorHub' | 'creatorSamples' | 'affiliateService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [pendingEventsCount, setPendingEventsCount] = useState(0);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for pending affiliate events
    const q = query(collection(db, "AFFILIATE_EVENTS"), where("status", "==", "scheduled"));
    const unsubscribeEvents = onSnapshot(q, (querySnapshot) => {
      setPendingEventsCount(querySnapshot.size);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeEvents();
    };
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
      case 'affiliateService':
        return <AffiliateService />;
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
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView}
        pendingEventsCount={pendingEventsCount}
      />
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
