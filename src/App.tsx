import { useState, useEffect } from 'react'
import './App.css'
import MessagesTab from './components/MessagesTab'
import BuildingMaterialsTab from './components/BuildingMaterialsTab'
import BuildingMaterialCategoryList from './components/BuildingMaterialCategoryList'
import BuildingMaterialSeriesList from './components/BuildingMaterialSeriesList'
import Login from './components/Login'

function App() {
  const STORAGE_USER_KEY = 'bmw_admin_user';
  const STORAGE_TAB_KEY = 'bmw_admin_tab';

  const [isAuthenticated, setIsAuthenticated] = useState(false);
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

  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_USER_KEY);
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (user: any) => {
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_USER_KEY);
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="admin-container">
      <aside className="sidebar">
        <div className="logo">BMW Admin</div>
        {currentUser && (
          <div className="user-info" style={{ padding: '0 16px 20px', color: '#64748b', fontSize: '14px' }}>
            Welcome, {currentUser.name}
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
          <button className="nav-item logout-btn" onClick={handleLogout}>
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
  )
}

export default App
