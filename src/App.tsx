import { useEffect, useMemo, useState } from 'react'
import { SignedIn, SignedOut, useAuth } from '@clerk/clerk-react'
import './App.css'
import MessagesTab from './components/MessagesTab'
import BuildingMaterialsTab from './components/BuildingMaterialsTab'
import BuildingMaterialCategoryList from './components/BuildingMaterialCategoryList'
import BuildingMaterialSeriesList from './components/BuildingMaterialSeriesList'
import { api } from './config/api'
import ClerkLogin from './components/ClerkLogin'

function App() {
  const STORAGE_TAB_KEY = 'bmw_admin_tab';

  const { isLoaded, getToken, signOut } = useAuth();
  const [accessState, setAccessState] = useState<'loading' | 'authorized' | 'unauthorized' | 'error'>('loading');
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<'building-materials' | 'categories' | 'series' | 'messages'>(() => {
    const saved = localStorage.getItem(STORAGE_TAB_KEY);
    return (saved === 'building-materials' || saved === 'categories' || saved === 'series' || saved === 'messages')
      ? saved
      : 'building-materials';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_TAB_KEY, activeTab);
  }, [activeTab]);

  const allowedRoles = useMemo(() => new Set(['admin', 'builder']), []);

  useEffect(() => {
    let isMounted = true;

    async function fetchAccess() {
      if (!isLoaded) {
        return;
      }

      setAccessState('loading');

      try {
        const token = await getToken();
        if (!token) {
          setAccessState('unauthorized');
          return;
        }

        const response = await fetch(api('/auth/me'), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          setAccessState('unauthorized');
          return;
        }

        const payload = await response.json();
        const role = payload?.auth?.role;

        if (allowedRoles.has(role)) {
          if (isMounted) {
            setCurrentUser(payload?.auth || null);
            setAccessState('authorized');
          }
          return;
        }

        setAccessState('unauthorized');
      } catch (error) {
        setAccessState('error');
      }
    }

    fetchAccess();

    return () => {
      isMounted = false;
    };
  }, [allowedRoles, getToken, isLoaded]);

  return (
    <>
      <SignedOut>
        <ClerkLogin />
      </SignedOut>
      <SignedIn>
        {!isLoaded || accessState === 'loading' ? (
          <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            Checking access...
          </div>
        ) : accessState === 'unauthorized' ? (
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
            <div>Access denied. Your account does not have admin access.</div>
            <button className="nav-item logout-btn" onClick={() => signOut()}>
              Sign Out
            </button>
          </div>
        ) : accessState === 'error' ? (
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
            <div>Unable to verify access. Please try again.</div>
            <button className="nav-item logout-btn" onClick={() => signOut()}>
              Sign Out
            </button>
          </div>
        ) : (
          <div className="admin-container">
            <aside className="sidebar">
              <div className="logo">BMW Admin</div>
              {currentUser && (
                <div className="user-info" style={{ padding: '0 16px 20px', color: '#64748b', fontSize: '14px' }}>
                  Role: {currentUser.role}
                </div>
              )}
              <nav>
                <button
                  className={`nav-item ${activeTab === 'building-materials' ? 'active' : ''}`}
                  onClick={() => setActiveTab('building-materials')}
                >
                  Building Materials
                </button>
                <button
                  className={`nav-item ${activeTab === 'categories' ? 'active' : ''}`}
                  onClick={() => setActiveTab('categories')}
                >
                  Categories
                </button>
                <button
                  className={`nav-item ${activeTab === 'series' ? 'active' : ''}`}
                  onClick={() => setActiveTab('series')}
                >
                  Series
                </button>
                <button
                  className={`nav-item ${activeTab === 'messages' ? 'active' : ''}`}
                  onClick={() => setActiveTab('messages')}
                >
                  Client Messages
                </button>
              </nav>
              <div className="sidebar-footer">
                <button className="nav-item logout-btn" onClick={() => signOut()}>
                  Sign Out
                </button>
              </div>
            </aside>
            <main className="main-content">
              <div style={{ display: activeTab === 'building-materials' ? 'block' : 'none', height: '100%' }}>
                <BuildingMaterialsTab isActive={activeTab === 'building-materials'} />
              </div>
              <div style={{ display: activeTab === 'categories' ? 'block' : 'none', height: '100%' }}>
                <BuildingMaterialCategoryList />
              </div>
              <div style={{ display: activeTab === 'series' ? 'block' : 'none', height: '100%' }}>
                <BuildingMaterialSeriesList />
              </div>
              <div style={{ display: activeTab === 'messages' ? 'block' : 'none', height: '100%' }}>
                <MessagesTab />
              </div>
            </main>
          </div>
        )}
      </SignedIn>
    </>
  )
}

export default App
