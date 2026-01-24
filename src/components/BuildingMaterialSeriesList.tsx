import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import './BuildingMaterialSeriesList.css';
import { api } from '../config/api';
interface Series {
  id: number;
  name: string;
  pdf: string;
  created_at?: string;
}

const BuildingMaterialSeriesList: React.FC = () => {
  const { getToken } = useAuth();
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    pdf: null as File | null
  });
  const [previewPdf, setPreviewPdf] = useState<string>('');

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  useEffect(() => {
    fetchSeries();
  }, []);

  const fetchSeries = async () => {
    setLoading(true);
    try {
      const response = await fetch(api('/building-material-series'));
      if (response.ok) {
        const { data } = await response.json();
        setSeriesList(data || []);
      }
    } catch (error) {
      console.error('Error fetching series:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (series?: Series) => {
    if (series) {
      setEditingSeries(series);
      setFormData({
        name: series.name,
        pdf: null
      });
      setPreviewPdf(series.pdf);
    } else {
      setEditingSeries(null);
      setFormData({
        name: '',
        pdf: null
      });
      setPreviewPdf('');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSeries(null);
    setFormData({ name: '', pdf: null });
    setPreviewPdf('');
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({ ...formData, pdf: file });
      setPreviewPdf(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      alert('Please enter a series name');
      return;
    }
    if (!editingSeries && !formData.pdf) {
      alert('Please upload a PDF');
      return;
    }

    setIsSaving(true);
    try {
      const data = new FormData();
      data.append('name', formData.name);
      if (formData.pdf) {
        data.append('pdf', formData.pdf);
      }

      let url = api('/building-material-series');
      let method = 'POST';

      if (editingSeries) {
        url = `${url}/${editingSeries.id}`;
        method = 'PUT';
      }

      const token = await getToken();
      const response = await fetch(url, {
        method,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: data,
      });

      if (!response.ok) throw new Error('Failed to save series');

      await fetchSeries();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving series:', error);
      alert('Failed to save series');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this series?')) return;

    setIsDeleting(id);
    try {
      const token = await getToken();
      const response = await fetch(api(`/building-material-series/${id}`), {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!response.ok) throw new Error('Failed to delete series');

      setSeriesList(seriesList.filter(series => series.id !== id));
    } catch (error) {
      console.error('Error deleting series:', error);
      alert('Failed to delete series');
    } finally {
      setIsDeleting(null);
    }
  };

  const getPdfLabel = (url: string) => {
    try {
      const decoded = decodeURIComponent(url);
      const parts = decoded.split('/');
      return parts[parts.length - 1];
    } catch {
      return url;
    }
  };

  if (loading) return <div className="loading-state">Loading series...</div>;

  return (
    <div className="series-list-container">
      <div className="list-header">
        <div className="header-text">
          <h2>Series</h2>
          <p>Manage building material series PDFs</p>
        </div>
        <button className="add-btn" onClick={() => handleOpenModal()}>
          + Add New Series
        </button>
      </div>

      <div className="series-grid">
        {seriesList.map((series) => (
          <div key={series.id} className="series-card">
            <div className="series-content">
              <h3 className="series-title">{series.name}</h3>
              <a
                className="series-file"
                href={series.pdf}
                target="_blank"
                rel="noreferrer"
              >
                <span className="series-file-icon">PDF</span>
                <span className="series-file-name">{getPdfLabel(series.pdf)}</span>
              </a>
              <div className="series-actions">
                <button 
                  className="series-action-btn edit"
                  onClick={() => handleOpenModal(series)}
                >
                  Edit
                </button>
                <button 
                  className="series-action-btn delete"
                  onClick={() => handleDelete(series.id)}
                  disabled={isDeleting === series.id}
                >
                  {isDeleting === series.id ? '...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="series-modal-overlay" onClick={handleCloseModal}>
          <div className="series-modal-content" onClick={e => e.stopPropagation()}>
            <div className="series-modal-header">
              <h3>{editingSeries ? 'Edit Series' : 'New Series'}</h3>
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>

            <div className="series-form">
              <div className="series-form-group">
                <label>Series Name</label>
                <input 
                  type="text" 
                  className="series-form-input"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Classic Metals"
                />
              </div>

              <div className="series-form-group">
                <label>PDF</label>
                <input 
                  type="file" 
                  accept="application/pdf"
                  onChange={handlePdfChange}
                />
                {previewPdf && (
                  <a className="series-preview" href={previewPdf} target="_blank" rel="noreferrer">
                    {getPdfLabel(previewPdf)}
                  </a>
                )}
              </div>

              <div className="series-modal-actions">
                <button className="cancel-btn" onClick={handleCloseModal}>Cancel</button>
                <button 
                  className="save-btn" 
                  onClick={handleSubmit}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Series'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuildingMaterialSeriesList;
