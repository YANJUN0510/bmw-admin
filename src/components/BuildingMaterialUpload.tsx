import React, { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import Select from 'react-select';
import type { BuildingMaterial } from '../types';
import './BuildingMaterialUpload.css';
import { api } from '../config/api';
interface BuildingMaterialUploadProps {
  refreshKey?: number;
}

const BuildingMaterialUpload: React.FC<BuildingMaterialUploadProps> = ({ refreshKey }) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [seriesList, setSeriesList] = useState<string[]>([]);
  const [allImages, setAllImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  const [material, setMaterial] = useState<BuildingMaterial>({
    code: '',
    name: '',
    category: '',
    series: '',
    image: '',
    gallery: [],
    description: '',
    specs: [],
    price: ''
  });

  useEffect(() => {
    fetchCategoriesAndSeries();
  }, [refreshKey]);

  const fetchCategoriesAndSeries = async () => {
    try {
      const [categoryResponse, seriesResponse] = await Promise.all([
        fetch(api('/building-material-categories')),
        fetch(api('/building-material-series'))
      ]);

      if (!categoryResponse.ok) throw new Error('Failed to fetch categories');
      if (!seriesResponse.ok) throw new Error('Failed to fetch series');

      const { data: categoryDataResponse } = await categoryResponse.json();
      const { data: seriesDataResponse } = await seriesResponse.json();

      if (categoryDataResponse) {
        setCategoryData(categoryDataResponse);
        setCategories(categoryDataResponse.map((item: any) => item.category).sort());
      }

      if (seriesDataResponse) {
        setSeriesList(seriesDataResponse.map((item: any) => item.name).sort());
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setMaterial(prev => ({ ...prev, [name]: value }));
  };

  const handleImagesChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files).slice(0, 5);
      setAllImages(filesArray);
      
      const mainImage = filesArray[0];
      const galleryImages = filesArray.slice(1, 5);
      
      setMaterial(prev => ({ 
        ...prev, 
        image: mainImage,
        gallery: galleryImages
      }));
      
      const previews: string[] = [];
      filesArray.forEach((file, index) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          previews[index] = reader.result as string;
          if (previews.filter(Boolean).length === filesArray.length) {
            setImagePreviews(previews);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...allImages];
    newImages.splice(index, 1);
    setAllImages(newImages);
    
    const newPreviews = [...imagePreviews];
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
    
    if (newImages.length > 0) {
      const mainImage = newImages[0];
      const galleryImages = newImages.slice(1);
      setMaterial(prev => ({ 
        ...prev, 
        image: mainImage,
        gallery: galleryImages
      }));
    } else {
      setMaterial(prev => ({ 
        ...prev, 
        image: '',
        gallery: []
      }));
    }
  };

  const handleSpecChange = (index: number, field: 'label' | 'value', value: string) => {
    const newSpecs = [...(material.specs || [])];
    newSpecs[index] = { ...newSpecs[index], [field]: value };
    setMaterial(prev => ({ ...prev, specs: newSpecs }));
  };

  const addSpec = () => {
    setMaterial(prev => ({ ...prev, specs: [...(prev.specs || []), { label: '', value: '' }] }));
  };

  const removeSpec = (index: number) => {
    const newSpecs = [...(material.specs || [])];
    newSpecs.splice(index, 1);
    setMaterial(prev => ({ ...prev, specs: newSpecs }));
  };

  const handleCategoryChange = async (option: any) => {
    const category = option?.value || '';
    
    if (!category) {
      setMaterial(prev => ({ ...prev, category: '', code: '' }));
      return;
    }

    setMaterial(prev => ({ ...prev, category }));

    try {
      // First, get the correct prefix from categoryData
      const catInfo = categoryData.find((c: any) => c.category === category);
      let prefix = catInfo?.prefix;
      
      if (!prefix) {
        // Fallback to derivation if prefix is missing
        // Take first letter of each word and capitalize
        prefix = category.split(' ')
          .map((w: string) => w[0])
          .join('')
          .toUpperCase();
      }

      // Fetch all materials to find the last number for this category with the correct prefix
      const response = await fetch(api('/building-materials'));
      if (!response.ok) throw new Error('Failed to fetch materials');
      const { data } = await response.json();

      // Filter materials by category AND prefix to ensure we only count materials with correct prefix
      const categoryMaterials = data.filter((item: any) => {
        if (item.category !== category) return false;
        const itemPrefix = item.code.split('-')[0];
        return itemPrefix === prefix;
      });
      
      // Find the highest number
      let maxNumber = 0;
      categoryMaterials.forEach((item: any) => {
        const parts = item.code.split('-');
        if (parts.length === 2) {
          const num = parseInt(parts[1]);
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num;
          }
        }
      });

      const nextNumber = maxNumber + 1;
      const nextCode = `${prefix}-${String(nextNumber).padStart(3, '0')}`;
      setMaterial(prev => ({ ...prev, category, code: nextCode }));

    } catch (error) {
      console.error('Error generating code:', error);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!material.category) {
        alert('Please select a category before uploading.');
        return;
      }

      const formData = new FormData();
      formData.append('code', material.code);
      formData.append('name', material.name);
      formData.append('category', material.category);
      if (material.series) formData.append('series', material.series);
      if (material.price !== undefined && material.price !== null && material.price !== '') {
        formData.append('price', String(material.price));
      }
      formData.append('description', material.description);
      formData.append('specs', JSON.stringify(material.specs));

      if (material.image instanceof File) {
        formData.append('image', material.image);
      }

      if (material.gallery && material.gallery.length > 0) {
        material.gallery.forEach((file) => {
          if (file instanceof File) {
            formData.append('gallery', file);
          }
        });
      }

      const response = await fetch(api('/building-materials/'), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload material');
      }

      alert('Material uploaded successfully!');
      
      // Reset form
      setMaterial({
        code: '',
        name: '',
        category: '',
        series: '',
        image: '',
        gallery: [],
        description: '',
        specs: [],
        price: ''
      });
      setAllImages([]);
      setImagePreviews([]);

    } catch (error: any) {
      console.error('Error uploading material:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="building-material-upload-container">
      <div className="header">
        <h2>Create New Building Material</h2>
        <p>Add a new material to your inventory</p>
      </div>
      
      <form onSubmit={handleSubmit} className="material-form">
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Material Code (Auto-generated)</label>
              <input 
                type="text" 
                name="code" 
                value={material.code} 
                readOnly
                style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                placeholder="Select category to generate"
              />
            </div>

            <div className="form-group flex-2">
              <label>Material Name</label>
              <input 
                type="text" 
                name="name" 
                value={material.name} 
                onChange={handleChange} 
                placeholder="e.g. Stainless Steel Sheet"
                required 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Price (Optional)</label>
              <input 
                type="text"
                name="price"
                value={material.price ?? ''}
                onChange={handleChange}
                placeholder="e.g. 1200 or $1,200"
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <Select
                value={material.category ? { label: material.category, value: material.category } : null}
                onChange={handleCategoryChange}
                options={categories.map(cat => ({ label: cat, value: cat }))}
                placeholder="Select Category"
                styles={{
                  control: (base) => ({
                    ...base,
                    borderColor: '#e2e8f0',
                    borderRadius: '6px',
                    padding: '2px',
                    boxShadow: 'none',
                    '&:hover': { borderColor: '#cbd5e1' }
                  })
                }}
              />
            </div>

            <div className="form-group">
              <label>Series (Optional)</label>
              <Select
                value={material.series ? { label: material.series, value: material.series } : null}
                onChange={(option: any) => setMaterial(prev => ({ ...prev, series: option?.value || '' }))}
                options={seriesList.map(s => ({ label: s, value: s }))}
                placeholder="Select Series"
                isClearable
                styles={{
                  control: (base) => ({
                    ...base,
                    borderColor: '#e2e8f0',
                    borderRadius: '6px',
                    padding: '2px',
                    boxShadow: 'none',
                    '&:hover': { borderColor: '#cbd5e1' }
                  })
                }}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Details & Media</h3>
          
          <div className="form-group">
            <label>Description</label>
            <textarea 
              name="description" 
              value={material.description} 
              onChange={handleChange} 
              placeholder="Detailed description of the material..."
              required
            />
          </div>

          <div className="form-group">
            <label>Product Images (up to 5, the 1st is the main image) *</label>
            <div className="bm-file-input-wrapper">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImagesChange}
                multiple
                required 
              />
              <span className="helper-text">The 1st image will be the main image. Images 2�? will be gallery images.</span>
            </div>
            {imagePreviews.length > 0 && (
              <div className="all-images-preview-container">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className={`image-preview-item ${index === 0 ? 'main-image' : ''}`}>
                    <img src={preview} alt={`Image ${index + 1}`} className="preview-image" />
                    {index === 0 && <span className="main-badge">Main</span>}
                    {index > 0 && <span className="gallery-badge">Gallery {index}</span>}
                    <button 
                      type="button" 
                      className="remove-image-btn" 
                      onClick={() => removeImage(index)}
                      title="Remove this image"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {imagePreviews.length < 5 && (
                  <div className="add-more-placeholder">
                    <span className="add-more-text">You can add {5 - imagePreviews.length} more</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="form-section">
          <h3>Specifications</h3>
          <div className="specs-container">
            {material.specs?.map((spec, index) => (
              <div key={index} className="spec-row">
                <input 
                  type="text" 
                  placeholder="Label (e.g. Thickness)" 
                  value={spec.label}
                  onChange={(e) => handleSpecChange(index, 'label', e.target.value)}
                />
                <input 
                  type="text" 
                  placeholder="Value (e.g. 18mm)" 
                  value={spec.value}
                  onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                />
                <button type="button" className="remove-btn" onClick={() => removeSpec(index)}>×</button>
              </div>
            ))}
            <button type="button" className="add-spec-btn" onClick={addSpec}>+ Add Specification</button>
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Uploading...' : 'Upload Material'}
        </button>
      </form>

      {/* New Category Modal - Removed */}
      {/* {showCategoryModal && (
        <div className="bm-upload-modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="bm-upload-modal-content" onClick={e => e.stopPropagation()}>
            <h3>Add New Category</h3>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Category Name</label>
              <input 
                type="text" 
                value={newCategory.name}
                onChange={e => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Stainless Steel"
              />
            </div>
            <div className="form-group">
              <label>Prefix (2-3 letters)</label>
              <input 
                type="text" 
                value={newCategory.prefix}
                onChange={e => setNewCategory(prev => ({ ...prev, prefix: e.target.value.toUpperCase() }))}
                placeholder="e.g. SS"
                maxLength={3}
              />
            </div>
            <div className="bm-upload-modal-actions">
              <button className="cancel-btn" onClick={() => setShowCategoryModal(false)}>Cancel</button>
              <button className="save-btn" onClick={handleAddCategory}>Add Category</button>
            </div>
          </div>
        </div>
      )} */}

    </div>
  );
};

export default BuildingMaterialUpload;

