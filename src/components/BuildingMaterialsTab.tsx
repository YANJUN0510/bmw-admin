import React, { useEffect, useState } from 'react';
import BuildingMaterialList from './BuildingMaterialList';
import BuildingMaterialUpload from './BuildingMaterialUpload';

interface BuildingMaterialsTabProps {
  isActive: boolean;
}

const BuildingMaterialsTab: React.FC<BuildingMaterialsTabProps> = ({ isActive }) => {
  const [view, setView] = useState<'list' | 'upload'>('list');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (isActive) {
      setRefreshKey(prev => prev + 1);
    }
  }, [isActive]);

  useEffect(() => {
    if (view === 'upload') {
      setRefreshKey(prev => prev + 1);
    }
  }, [view]);

  return (
    <div className="building-materials-tab">
      <div style={{ display: view === 'list' ? 'block' : 'none' }}>
        <BuildingMaterialList onAddMaterial={() => setView('upload')} />
      </div>
      {view === 'upload' && (
        <div className="upload-view-wrapper">
          <div className="upload-header-actions" style={{ marginBottom: '20px' }}>
            <button 
              onClick={() => setView('list')}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              ← Back to List
            </button>
          </div>
          <BuildingMaterialUpload refreshKey={refreshKey} />
        </div>
      )}
    </div>
  );
};

export default BuildingMaterialsTab;
