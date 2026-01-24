import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import './BuildingMaterialCategoryList.css';
import { api } from '../config/api';
interface Category {
  id: number;
  category: string;
  description: string;
  image: string;
  prefix?: string;
}

const BuildingMaterialCategoryList: React.FC = () => {
  const { getToken } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    prefix: '',
    image: null as File | null
  });
  const [previewImage, setPreviewImage] = useState<string>('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [timestamp, setTimestamp] = useState(Date.now());

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch(api('/building-material-categories'));
      if (response.ok) {
        const { data } = await response.json();
        setCategories(data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        category: category.category,
        description: category.description,
        prefix: category.prefix || '',
        image: null
      });
      setPreviewImage(category.image);
    } else {
      setEditingCategory(null);
      setFormData({
        category: '',
        description: '',
        prefix: '',
        image: null
      });
      setPreviewImage('');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({ category: '', description: '', prefix: '', image: null });
    setPreviewImage('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({ ...formData, image: file });
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!formData.category || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }

    if (!editingCategory && !formData.image) {
      alert('Please select an image');
      return;
    }

    setIsSaving(true);
    try {
      const data = new FormData();
      data.append('category', formData.category);
      data.append('description', formData.description);
      if (formData.prefix) data.append('prefix', formData.prefix);
      if (formData.image) {
        data.append('image', formData.image);
      }

      let url = api('/building-material-categories');
      let method = 'POST';

      if (editingCategory) {
        url = `${url}/${editingCategory.id}`;
        method = 'PUT';
      }

      const token = await getToken();
      const response = await fetch(url, {
        method,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: data,
      });

      if (!response.ok) throw new Error('Failed to save category');

      await fetchCategories();
      setTimestamp(Date.now());
      handleCloseModal();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Failed to save category');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    setIsDeleting(id);
    try {
      const token = await getToken();
      const response = await fetch(api(`/building-material-categories/${id}`), {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!response.ok) throw new Error('Failed to delete category');

      setCategories(categories.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    } finally {
      setIsDeleting(null);
    }
  };

  const getImageUrl = (url: string) => {
    return `${url}?t=${timestamp}`;
  };

  if (loading) return <div className="loading-state">Loading categories...</div>;

  return (
    <div className="category-list-container">
      <div className="list-header">
        <div className="header-text">
          <h2>Categories</h2>
          <p>Manage building material categories</p>
        </div>
        <button className="add-btn" onClick={() => handleOpenModal()}>
          + Add New Category
        </button>
      </div>

      <div className="category-grid">
        {categories.map((category) => (
          <div key={category.id} className="category-card">
            <img 
              src={getImageUrl(category.image)} 
              alt={category.category} 
              className="category-image"
            />
            <div className="category-content">
              <h3 className="category-title">{category.category}</h3>
              <p className="category-description">{category.description}</p>
              <div className="category-actions">
                <button 
                  className="cat-action-btn edit"
                  onClick={() => handleOpenModal(category)}
                >
                  Edit
                </button>
                <button 
                  className="cat-action-btn delete"
                  onClick={() => handleDelete(category.id)}
                  disabled={isDeleting === category.id}
                >
                  {isDeleting === category.id ? '...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="cat-modal-overlay" onClick={handleCloseModal}>
          <div className="cat-modal-content" onClick={e => e.stopPropagation()}>
            <div className="cat-modal-header">
              <h3>{editingCategory ? 'Edit Category' : 'New Category'}</h3>
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>

            <div className="cat-form">
              <div className="cat-form-group">
                <label>Category Name</label>
                <input 
                  type="text" 
                  className="cat-form-input"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Exterior Materials"
                />
              </div>

              <div className="cat-form-group">
                <label>Prefix (2-3 letters)</label>
                <input 
                  type="text" 
                  className="cat-form-input"
                  value={formData.prefix}
                  onChange={e => setFormData({ ...formData, prefix: e.target.value.toUpperCase() })}
                  placeholder="e.g. EM"
                  maxLength={3}
                />
              </div>

              <div className="cat-form-group">
                <label>Description</label>
                <textarea 
                  className="cat-form-textarea"
                  rows={4}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Category description..."
                />
              </div>

              <div className="cat-form-group">
                <label>Image</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {previewImage && (
                  <img src={previewImage} alt="Preview" className="cat-image-preview" />
                )}
              </div>

              <div className="cat-modal-actions">
                <button className="cancel-btn" onClick={handleCloseModal}>Cancel</button>
                <button 
                  className="save-btn" 
                  onClick={handleSubmit}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuildingMaterialCategoryList;
