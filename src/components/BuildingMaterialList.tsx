import React, { useState, useEffect } from 'react';
import type { BuildingMaterial } from '../types';
import { api } from '../config/api';
import './BuildingMaterialList.css';

interface BuildingMaterialListProps {
  onAddMaterial: () => void;
}

const BuildingMaterialList: React.FC<BuildingMaterialListProps> = ({ onAddMaterial }) => {
  const [materials, setMaterials] = useState<BuildingMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<BuildingMaterial | null>(null);
  
  // Categories and Series structure
  const [categoryStructure, setCategoryStructure] = useState<{category: string, series: string[]}[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [seriesList, setSeriesList] = useState<string[]>([]);
  
  const [timestamp, setTimestamp] = useState(Date.now());
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  // Filter and Search State
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterSeries, setFilterSeries] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [layout, setLayout] = useState<'list' | 'grid'>('list');
  const [selectedMaterial, setSelectedMaterial] = useState<BuildingMaterial | null>(null);

  useEffect(() => {
    fetchMaterials();
  }, []);

  // Extract categories and series from materials data
  useEffect(() => {
    if (materials.length > 0) {
      // Build category structure: { category: string, series: string[] }[]
      const categoryMap = new Map<string, Set<string>>();
      
      materials.forEach(material => {
        if (material.category) {
          if (!categoryMap.has(material.category)) {
            categoryMap.set(material.category, new Set<string>());
          }
          if (material.series) {
            categoryMap.get(material.category)!.add(material.series);
          }
        }
      });

      // Convert to array format
      const structure = Array.from(categoryMap.entries()).map(([category, seriesSet]) => ({
        category,
        series: Array.from(seriesSet).sort()
      })).sort((a, b) => a.category.localeCompare(b.category));

      setCategoryStructure(structure);
      setCategories(Array.from(categoryMap.keys()).sort());
      
      // Flatten all series for the filter list
      const allSeries = new Set<string>();
      materials.forEach(material => {
        if (material.series) {
          allSeries.add(material.series);
        }
      });
      setSeriesList(Array.from(allSeries).sort());
    }
  }, [materials]);

  const getImageUrl = (url: string | File) => {
    if (typeof url === 'string') {
      return `${url}?t=${timestamp}`;
    }
    return '';
  };

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const response = await fetch(api('/building-materials'));
      if (!response.ok) throw new Error('Failed to fetch materials');
      
      const { data } = await response.json();

      const mappedMaterials = data.map((item: any) => {
        let specs = [];
        if (Array.isArray(item.specs)) {
          specs = item.specs;
        } else if (item.specs) {
          specs = [item.specs];
        }

        return {
          ...item,
          specs
        };
      });

      setMaterials(mappedMaterials);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (code: string) => {
    if (!window.confirm('Are you sure you want to delete this material?')) return;

    setIsDeleting(code);
    try {
      const response = await fetch(api(`/building-materials/${code}`), {
        method: 'DELETE',
      });

      if (response.ok) {
        setMaterials(materials.filter(m => m.code !== code));
        if (selectedMaterial && selectedMaterial.code === code) {
          setSelectedMaterial(null);
        }
      } else {
        alert('Failed to delete material');
      }
    } catch (error) {
      console.error('Error deleting material:', error);
      alert('Error deleting material');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleEditClick = (material: BuildingMaterial) => {
    setSelectedMaterial(material);
    setEditForm({ ...material });
    setIsEditing(true);
  };

  const handleCardClick = (material: BuildingMaterial) => {
    setSelectedMaterial(material);
    setEditForm({ ...material });
    setIsEditing(false);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (editForm) {
      const { name, value } = e.target;
      setEditForm({ ...editForm, [name]: value });
    }
  };

  const handleEditSpecChange = (index: number, field: 'label' | 'value', value: string) => {
    if (editForm) {
      const newSpecs = [...(editForm.specs || [])];
      newSpecs[index] = { ...newSpecs[index], [field]: value };
      setEditForm({ ...editForm, specs: newSpecs });
    }
  };

  const addEditSpec = () => {
    if (editForm) {
      setEditForm({ ...editForm, specs: [...(editForm.specs || []), { label: '', value: '' }] });
    }
  };

  const removeEditSpec = (index: number) => {
    if (editForm) {
      const newSpecs = [...(editForm.specs || [])];
      newSpecs.splice(index, 1);
      setEditForm({ ...editForm, specs: newSpecs });
    }
  };

  const handleEditImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editForm && e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files).slice(0, 5);
      const mainImage = filesArray[0];
      const galleryImages = filesArray.slice(1, 5);
      
      setEditForm({ 
        ...editForm, 
        image: mainImage,
        gallery: galleryImages
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editForm) return;
    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append('name', editForm.name);
      formData.append('category', editForm.category);
      if (editForm.series) formData.append('series', editForm.series);
      if (editForm.price !== undefined && editForm.price !== null && editForm.price !== '') {
        formData.append('price', String(editForm.price));
      } else {
        formData.append('price', '');
      }
      formData.append('description', editForm.description);
      formData.append('specs', JSON.stringify(editForm.specs));

      if (editForm.image instanceof File) {
        formData.append('image', editForm.image);
      }

      if (editForm.gallery && editForm.gallery.length > 0) {
        editForm.gallery.forEach((file) => {
          if (file instanceof File) {
            formData.append('gallery', file);
          }
        });
      }

      const response = await fetch(api(`/building-materials/${editForm.code}`), {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to update material');

      const { data } = await response.json();
      
      // Update local state
      const updatedMaterial = {
        ...data,
        specs: data.specs || []
      };

      setMaterials(materials.map(m => m.code === data.code ? updatedMaterial : m));
      
      if (selectedMaterial && selectedMaterial.code === data.code) {
        setSelectedMaterial(updatedMaterial);
      }
      
      setTimestamp(Date.now()); // Force image refresh
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating material:', error);
      alert('Failed to update material');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter Logic
  const filteredMaterials = materials.filter(material => {
    // Category filter
    const matchesCategory = filterCategory 
      ? (material.category && material.category === filterCategory) 
      : true;
    
    // Series filter
    const matchesSeries = filterSeries 
      ? (material.series && material.series === filterSeries) 
      : true;
    
    // Search filter
    const matchesSearch = searchQuery 
      ? ((material.name && material.name.toLowerCase().includes(searchQuery.toLowerCase())) || 
         (material.code && material.code.toLowerCase().includes(searchQuery.toLowerCase())))
      : true;
    
    return matchesCategory && matchesSeries && matchesSearch;
  });

  // Get available series for the selected category filter
  const availableSeries = filterCategory 
    ? (categoryStructure.find(c => c.category === filterCategory)?.series || [])
    : seriesList;

  if (loading) return <div className="loading-state">Loading materials...</div>;

  return (
    <div className="building-material-list-container">
      <div className="list-header">
        <div className="header-text">
          <h2>Building Materials</h2>
          <p>Manage your building material inventory</p>
        </div>
        <div className="header-actions">
          <button 
            className="refresh-btn" 
            onClick={fetchMaterials}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'white',
              color: '#374151',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
            title="Refresh List"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6"></path>
              <path d="M1 20v-6h6"></path>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            Refresh
          </button>
          <div className="layout-toggles">
            <button 
              className={`layout-btn ${layout === 'list' ? 'active' : ''}`}
              onClick={() => setLayout('list')}
              title="List View"
            >
              ‚ò?            </button>
            <button 
              className={`layout-btn ${layout === 'grid' ? 'active' : ''}`}
              onClick={() => setLayout('grid')}
              title="Grid View"
            >
              ‚ä?            </button>
          </div>
          <button className="add-btn" onClick={onAddMaterial}>
            + Add New Material
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-wrapper">
          <span className="search-icon">üîç</span>
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search by name or code..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="filters-wrapper">
          <select 
            className="filter-select"
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setFilterSeries(''); // Reset series when category changes
            }}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select 
            className="filter-select"
            value={filterSeries}
            onChange={(e) => setFilterSeries(e.target.value)}
          >
            <option value="">All Series</option>
            {availableSeries.map(series => (
              <option key={series} value={series}>{series}</option>
            ))}
          </select>

          {(filterCategory || filterSeries || searchQuery) && (
            <button 
              className="clear-filters-btn"
              onClick={() => {
                setFilterCategory('');
                setFilterSeries('');
                setSearchQuery('');
              }}
              title="Clear all filters"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="filter-results">
          Showing {filteredMaterials.length} of {materials.length} materials
        </div>
      </div>

      {layout === 'list' ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Code</th>
                <th>Name</th>
                <th>Price</th>
                <th>Category / Series</th>
                <th className="actions-header">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state">No materials found matching your criteria.</td>
                </tr>
              ) : (
                filteredMaterials.map((material) => (
                  <tr key={material.code}>
                    <td>
                      {material.image && (
                        <img 
                          src={getImageUrl(material.image)} 
                          alt={material.name} 
                          className="product-image-thumb" 
                        />
                      )}
                    </td>
                    <td className="code-cell">{material.code}</td>
                    <td>{material.name}</td>
                    <td>{material.price ?? '-'}</td>
                    <td>
                      <span className="category-badge">{material.category}</span>
                      {material.series && <span className="series-badge">{material.series}</span>}
                    </td>
                    <td className="actions-cell">
                      <button className="table-action-btn edit" onClick={() => handleEditClick(material)}>
                        Edit
                      </button>
                      <button 
                        className="table-action-btn delete" 
                        onClick={() => handleDelete(material.code)}
                        disabled={isDeleting === material.code}
                      >
                        {isDeleting === material.code ? '...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bm-grid">
          {filteredMaterials.length === 0 ? (
            <div className="empty-state">No materials found matching your criteria.</div>
          ) : (
            filteredMaterials.map((material) => (
              <div 
                key={material.code} 
                className="bm-card"
                onClick={() => handleCardClick(material)}
              >
                <div className="bm-card-image">
                  <img 
                    src={getImageUrl(material.image)} 
                    alt={material.name} 
                    loading="lazy"
                  />
                  <div className="bm-card-overlay">
                    <span>Edit Material</span>
                  </div>
                </div>
                <div className="bm-card-info">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '4px' }}>
                    <span className="bm-card-code">{material.code}</span>
                  </div>
                  <h3>{material.name}</h3>
                  <div className="bm-card-tags">
                    <span className="category-badge">{material.category}</span>
                    {material.series && <span className="series-badge">{material.series}</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal */}
      {selectedMaterial && (
        <div className="bm-list-modal-overlay" onClick={() => setSelectedMaterial(null)}>
          <div className="bm-list-modal-content wide-modal" onClick={e => e.stopPropagation()}>
            <div className="bm-modal-body">
              {/* Left Column: Images */}
              <div className="bm-modal-image-section">
                <div className="bm-main-image">
                  <img 
                    src={getImageUrl(selectedMaterial.image)} 
                    alt={selectedMaterial.name} 
                  />
                  <span className="image-badge main-badge">Main</span>
                </div>
                
                {selectedMaterial.gallery && selectedMaterial.gallery.length > 0 && (
                  <div className="bm-gallery-images">
                    {selectedMaterial.gallery.map((imgUrl, index) => (
                      <div key={index} className="bm-gallery-item">
                        <img 
                          src={typeof imgUrl === 'string' ? `${imgUrl}?t=${timestamp}` : ''} 
                          alt={`${selectedMaterial.name} - ${index + 2}`} 
                        />
                        <span className="image-badge gallery-badge">Gallery {index + 1}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Details or Edit Form */}
              <div className="bm-modal-details-section">
                {isEditing && editForm ? (
                  <div className="bm-edit-form">
                    <div className="bm-list-modal-header">
                      <h3>Edit Material</h3>
                    </div>
                    
                    <div className="form-group">
                      <label>Name</label>
                      <input 
                        type="text" 
                        name="name" 
                        value={editForm.name} 
                        onChange={handleEditChange} 
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Category</label>
                        <select 
                          name="category" 
                          value={editForm.category} 
                          onChange={handleEditChange}
                          style={{ padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                        >
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Series (Optional)</label>
                        <input 
                          type="text" 
                          name="series" 
                          value={editForm.series || ''} 
                          onChange={handleEditChange} 
                          placeholder="e.g. Series A"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Price (Optional)</label>
                      <input 
                        type="text" 
                        name="price" 
                        value={editForm.price ?? ''} 
                        onChange={handleEditChange} 
                        placeholder="e.g. 1200 or $1,200"
                      />
                    </div>

                    <div className="form-group">
                      <label>Description</label>
                      <textarea 
                        name="description" 
                        value={editForm.description} 
                        onChange={handleEditChange} 
                        rows={4}
                      />
                    </div>

                    <div className="form-group">
                      <label>Specifications</label>
                      <div className="specs-container">
                        {editForm.specs?.map((spec, index) => (
                          <div key={index} className="spec-row">
                            <input 
                              type="text" 
                              placeholder="Label" 
                              value={spec.label}
                              onChange={(e) => handleEditSpecChange(index, 'label', e.target.value)}
                            />
                            <input 
                              type="text" 
                              placeholder="Value" 
                              value={spec.value}
                              onChange={(e) => handleEditSpecChange(index, 'value', e.target.value)}
                            />
                            <button type="button" className="remove-btn" onClick={() => removeEditSpec(index)}>√ó</button>
                          </div>
                        ))}
                        <button type="button" className="add-spec-btn" onClick={addEditSpec}>+ Add Specification</button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Update Images (up to 5, the 1st is the main image)</label>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleEditImagesChange}
                        multiple
                      />
                      <small style={{ color: '#64748b', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                        Select 1‚Ä? images. The first will be the main image; the rest will be gallery images.
                      </small>
                    </div>

                    <div className="bm-list-modal-actions">
                      <button className="cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
                      <button className="save-btn" onClick={handleSaveEdit} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bm-view-details">
                    <div className="bm-list-modal-header">
                      <div>
                        <span className="bm-modal-code">{selectedMaterial.code}</span>
                        <h2>{selectedMaterial.name}</h2>
                      </div>
                      <button className="close-btn" onClick={() => setSelectedMaterial(null)}>√ó</button>
                    </div>

                    <div className="bm-modal-tags">
                      <span className="category-badge">{selectedMaterial.category}</span>
                      {selectedMaterial.series && <span className="series-badge">{selectedMaterial.series}</span>}
                      {selectedMaterial.price !== null && selectedMaterial.price !== undefined && selectedMaterial.price !== '' && (
                        <span className="price-badge">{selectedMaterial.price}</span>
                      )}
                    </div>

                    {selectedMaterial.price !== null && selectedMaterial.price !== undefined && selectedMaterial.price !== '' && (
                      <div className="bm-modal-price">
                        <h3>Price</h3>
                        <p>{selectedMaterial.price}</p>
                      </div>
                    )}

                    <div className="bm-modal-description">
                      <h3>Description</h3>
                      <p>{selectedMaterial.description}</p>
                    </div>

                    {selectedMaterial.specs && selectedMaterial.specs.length > 0 && (
                      <div className="bm-modal-specs">
                        <h3>Specifications</h3>
                        <div className="specs-grid">
                          {selectedMaterial.specs.map((spec, idx) => (
                            <div key={idx} className="spec-item">
                              <span className="spec-label">{spec.label}</span>
                              <span className="spec-value">{spec.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bm-view-actions">
                      <button 
                        className="bm-action-btn edit" 
                        onClick={() => {
                          setEditForm({ ...selectedMaterial });
                          setIsEditing(true);
                        }}
                      >
                        Edit Material
                      </button>
                      <button 
                        className="bm-action-btn delete" 
                        onClick={() => handleDelete(selectedMaterial.code)}
                        disabled={isDeleting === selectedMaterial.code}
                      >
                        {isDeleting === selectedMaterial.code ? 'Deleting...' : 'Delete Material'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuildingMaterialList;
