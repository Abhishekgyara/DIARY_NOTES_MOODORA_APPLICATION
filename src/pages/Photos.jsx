import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Search, X, Pencil, Trash2, ImageIcon, Link2, Filter, ArrowUpDown, Calendar as CalIcon } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { getAllPhotos, addPhoto, updatePhoto, deletePhoto, getPhotoURL, fileToBlob } from '@/services/photoService';
import { getEntries } from '@/services/diaryService';
import { getMonthGroupKey, getMonthGroupLabel, formatDate, generateId, formatFileSize } from '@/utils/dateUtils';
import { validatePhotoFile } from '@/utils/validation';
import Modal from '@/components/common/Modal';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/EmptyState';
import { useToast } from '@/components/common/Toast';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'name-asc', label: 'Name A-Z' },
  { value: 'name-desc', label: 'Name Z-A' },
];

export default function Photos() {
  const { showToast, ToastEl } = useToast();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filter, setFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editPhoto, setEditPhoto] = useState(null);
  const [viewPhoto, setViewPhoto] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [urls, setUrls] = useState({});

  const entries = useMemo(() => getEntries(), []);
  const entryMap = useMemo(() => {
    const map = {};
    entries.forEach((e) => { map[e.id] = e; });
    return map;
  }, [entries]);

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const all = await getAllPhotos();
      setPhotos(all);
      const newUrls = {};
      for (const p of all) {
        newUrls[p.id] = await getPhotoURL(p);
      }
      setUrls(newUrls);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { loadPhotos(); }, [loadPhotos]);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      Object.values(urls).forEach((u) => u && URL.revokeObjectURL(u));
    };
  }, [urls]);

  const filteredPhotos = useMemo(() => {
    let result = [...photos];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        p.name?.toLowerCase().includes(q) || p.caption?.toLowerCase().includes(q)
      );
    }
    if (filter === 'linked') result = result.filter((p) => p.linkedEntryId);
    if (filter === 'independent') result = result.filter((p) => !p.linkedEntryId);
    if (monthFilter) result = result.filter((p) => getMonthGroupKey(p.dateKey) === monthFilter);

    switch (sortBy) {
      case 'oldest': result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
      case 'name-asc': result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'name-desc': result.sort((a, b) => b.name.localeCompare(a.name)); break;
      default: result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return result;
  }, [photos, search, sortBy, filter, monthFilter]);

  const groupedPhotos = useMemo(() => {
    const groups = {};
    filteredPhotos.forEach((p) => {
      const key = getMonthGroupKey(p.dateKey);
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredPhotos]);

  const monthOptions = useMemo(() => {
    const months = [...new Set(photos.map((p) => getMonthGroupKey(p.dateKey)))].sort().reverse();
    return months;
  }, [photos]);

  const handleAddPhoto = async (data) => {
    try {
      const blob = await fileToBlob(data.file);
      await addPhoto({
        name: data.name,
        caption: data.caption,
        date: data.date,
        blob,
        linkedEntryId: data.linkedEntryId || null,
        fileType: data.file.type,
        fileSize: data.file.size,
      });
      setShowAdd(false);
      showToast('Photo added');
      loadPhotos();
    } catch (err) {
      showToast('Failed to add photo', 'error');
    }
  };

  const handleUpdatePhoto = async (id, updates) => {
    try {
      await updatePhoto(id, updates);
      setEditPhoto(null);
      showToast('Photo updated');
      loadPhotos();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleDeletePhoto = async () => {
    if (!deleteId) return;
    try {
      await deletePhoto(deleteId);
      if (urls[deleteId]) URL.revokeObjectURL(urls[deleteId]);
      setDeleteId(null);
      showToast('Photo deleted');
      loadPhotos();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  return (
    <div className="animate-fadeIn">
      {ToastEl}
      <div className="section-header">
        <div>
          <h1 className="section-title">Photos</h1>
          <p className="section-subtitle">{photos.length} {photos.length === 1 ? 'photo' : 'photos'} in your gallery</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={18} />
          Add Photo
        </button>
      </div>

      {/* Filters */}
      <div className="card photo-filters">
        <div className="photo-search-wrapper">
          <Search size={18} style={{ color: 'var(--text-muted)', position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: 42 }}
            placeholder="Search by name or caption..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="photo-filter-row">
          <select className="input-field photo-filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Photos</option>
            <option value="linked">Linked to Entries</option>
            <option value="independent">Independent</option>
          </select>
          <select className="input-field photo-filter-select" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
            <option value="">All Months</option>
            {monthOptions.map((m) => (
              <option key={m} value={m}>{getMonthGroupLabel(m + '-01')}</option>
            ))}
          </select>
          <select className="input-field photo-filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {(search || filter !== 'all' || monthFilter) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFilter('all'); setMonthFilter(''); }}>
              <X size={16} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Gallery */}
      {loading ? (
        <LoadingSpinner label="Loading photos..." />
      ) : filteredPhotos.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ImageIcon}
            title={photos.length === 0 ? "No photos yet" : "No matching photos"}
            subtitle={photos.length === 0 ? "Add photos to your gallery or attach them while writing entries." : "Try adjusting your filters or search."}
            action={photos.length === 0 ? (
              <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
                <Plus size={18} />
                Add Your First Photo
              </button>
            ) : null}
          />
        </div>
      ) : (
        <div className="photo-groups">
          {groupedPhotos.map(([monthKey, group]) => (
            <div key={monthKey} className="photo-group">
              <h3 className="photo-group-title">{getMonthGroupLabel(monthKey + '-01')}</h3>
              <div className="photo-grid">
                {group.map((photo) => (
                  <div key={photo.id} className="photo-card" onClick={() => setViewPhoto(photo)}>
                    <div className="photo-thumb">
                      {urls[photo.id] ? (
                        <img src={urls[photo.id]} alt={photo.name} />
                      ) : (
                        <div className="photo-thumb-placeholder"><ImageIcon size={24} /></div>
                      )}
                      {photo.linkedEntryId && (
                        <div className="photo-linked-badge"><Link2 size={12} /></div>
                      )}
                    </div>
                    <div className="photo-info">
                      <span className="photo-name">{photo.name}</span>
                      <span className="photo-date">{formatDate(photo.dateKey, 'MMM d')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Photo Modal */}
      <AddPhotoModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={handleAddPhoto}
        entries={entries}
      />

      {/* Edit Photo Modal */}
      <EditPhotoModal
        open={!!editPhoto}
        photo={editPhoto}
        url={editPhoto ? urls[editPhoto.id] : null}
        entries={entries}
        entryMap={entryMap}
        onClose={() => setEditPhoto(null)}
        onUpdate={handleUpdatePhoto}
      />

      {/* View Photo Modal */}
      <Modal
        open={!!viewPhoto}
        onClose={() => setViewPhoto(null)}
        size="lg"
        title={viewPhoto?.name}
      >
        {viewPhoto && (
          <div>
            <div className="photo-view-img">
              {urls[viewPhoto.id] && <img src={urls[viewPhoto.id]} alt={viewPhoto.name} />}
            </div>
            {viewPhoto.caption && (
              <p className="text-secondary mt-4" style={{ fontSize: 15, lineHeight: 1.6 }}>{viewPhoto.caption}</p>
            )}
            <div className="mt-4 flex items-center gap-4 flex-wrap" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              <span className="flex items-center gap-1"><CalIcon size={14} />{formatDate(viewPhoto.dateKey)}</span>
              <span>{formatFileSize(viewPhoto.fileSize)}</span>
              {viewPhoto.linkedEntryId && entryMap[viewPhoto.linkedEntryId] && (
                <span className="flex items-center gap-1"><Link2 size={14} />Linked to: {entryMap[viewPhoto.linkedEntryId].title}</span>
              )}
            </div>
            <div className="mt-6 flex gap-2">
              <button className="btn btn-ghost" onClick={() => { setEditPhoto(viewPhoto); setViewPhoto(null); }}>
                <Pencil size={16} /> Edit
              </button>
              <button className="btn btn-danger" onClick={() => { setDeleteId(viewPhoto.id); setViewPhoto(null); }}>
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Photo"
        message="Are you sure you want to delete this photo? This cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={handleDeletePhoto}
        onCancel={() => setDeleteId(null)}
      />

      <style>{`
        .photo-filters {
          padding: 16px;
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .photo-search-wrapper { position: relative; }
        .photo-filter-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .photo-filter-select {
          width: auto;
          min-width: 140px;
          padding: 9px 36px 9px 14px;
          font-size: 14px;
        }
        .photo-groups { display: flex; flex-direction: column; gap: 28px; }
        .photo-group-title {
          font-size: 16px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          color: var(--text-secondary);
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--border-light);
        }
        .photo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 14px;
        }
        .photo-card {
          cursor: pointer;
          border-radius: var(--radius);
          overflow: hidden;
          background: var(--bg-card);
          border: 1px solid var(--border);
          transition: all 0.2s ease;
        }
        .photo-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 28px var(--shadow-lg);
        }
        .photo-thumb {
          position: relative;
          aspect-ratio: 1;
          overflow: hidden;
          background: var(--bg-tertiary);
        }
        .photo-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
        .photo-card:hover .photo-thumb img {
          transform: scale(1.05);
        }
        .photo-thumb-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--text-muted);
        }
        .photo-linked-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          background: var(--accent);
          color: var(--text-inverse);
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .photo-info {
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .photo-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .photo-date {
          font-size: 12px;
          color: var(--text-muted);
        }
        .photo-view-img {
          border-radius: var(--radius-sm);
          overflow: hidden;
          max-height: 400px;
        }
        .photo-view-img img {
          width: 100%;
          max-height: 400px;
          object-fit: contain;
        }
        @media (max-width: 480px) {
          .photo-grid {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 10px;
          }
          .photo-filter-select {
            flex: 1;
            min-width: 120px;
          }
        }
      `}</style>
    </div>
  );
}

function AddPhotoModal({ open, onClose, onAdd, entries }) {
  const [name, setName] = useState('');
  const [caption, setCaption] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [linkedEntryId, setLinkedEntryId] = useState('');
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (!open) {
      setName(''); setCaption(''); setDate(format(new Date(), 'yyyy-MM-dd'));
      setFile(null); setFilePreview(null); setLinkedEntryId(''); setErrors([]);
    }
  }, [open]);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const fileErrors = validatePhotoFile(f);
    if (fileErrors.length) { setErrors(fileErrors); return; }
    setErrors([]);
    setFile(f);
    if (!name) setName(f.name.replace(/\.[^.]+$/, ''));
    const reader = new FileReader();
    reader.onload = () => setFilePreview(reader.result);
    reader.readAsDataURL(f);
  };

  const handleSubmit = () => {
    if (!file) { setErrors(['Please select a photo']); return; }
    onAdd({ name, caption, date, file, linkedEntryId });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Photo"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={!file}>Add Photo</button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {errors.length > 0 && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', padding: '12px 16px' }}>
            {errors.map((err, i) => <p key={i} style={{ fontSize: 13, color: '#EF4444' }}>{err}</p>)}
          </div>
        )}

        <div className="form-group">
          <label className="input-label">Photo File</label>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="input-field" style={{ padding: 8 }} />
          {filePreview && (
            <div style={{ marginTop: 12, borderRadius: 'var(--radius-sm)', overflow: 'hidden', maxHeight: 200 }}>
              <img src={filePreview} alt="Preview" style={{ width: '100%', objectFit: 'cover', maxHeight: 200 }} />
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="input-label">Name</label>
          <input type="text" className="input-field" placeholder="Photo name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="form-group">
          <label className="input-label">Caption</label>
          <textarea className="input-field" placeholder="Add a caption..." value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} />
        </div>

        <div className="form-group">
          <label className="input-label">Date</label>
          <input type="date" className="input-field" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        {entries.length > 0 && (
          <div className="form-group">
            <label className="input-label">Link to Entry (optional)</label>
            <select className="input-field" value={linkedEntryId} onChange={(e) => setLinkedEntryId(e.target.value)}>
              <option value="">No link</option>
              {entries.map((e) => <option key={e.id} value={e.id}>{e.title} — {formatDate(e.dateKey)}</option>)}
            </select>
          </div>
        )}
      </div>
    </Modal>
  );
}

function EditPhotoModal({ open, photo, url, entries, entryMap, onClose, onUpdate }) {
  const [name, setName] = useState('');
  const [caption, setCaption] = useState('');
  const [date, setDate] = useState('');
  const [linkedEntryId, setLinkedEntryId] = useState('');

  useEffect(() => {
    if (photo) {
      setName(photo.name || '');
      setCaption(photo.caption || '');
      setDate(photo.dateKey || '');
      setLinkedEntryId(photo.linkedEntryId || '');
    }
  }, [photo]);

  const handleUpdate = () => {
    onUpdate(photo.id, { name, caption, dateKey: date, linkedEntryId: linkedEntryId || null });
  };

  if (!photo) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Photo"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleUpdate}>Save Changes</button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {url && (
          <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', maxHeight: 200, marginBottom: 4 }}>
            <img src={url} alt={photo.name} style={{ width: '100%', objectFit: 'cover', maxHeight: 200 }} />
          </div>
        )}
        <div className="form-group">
          <label className="input-label">Name</label>
          <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="input-label">Caption</label>
          <textarea className="input-field" value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} />
        </div>
        <div className="form-group">
          <label className="input-label">Date</label>
          <input type="date" className="input-field" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        {entries.length > 0 && (
          <div className="form-group">
            <label className="input-label">Link to Entry</label>
            <select className="input-field" value={linkedEntryId} onChange={(e) => setLinkedEntryId(e.target.value)}>
              <option value="">No link</option>
              {entries.map((e) => <option key={e.id} value={e.id}>{e.title} — {formatDate(e.dateKey)}</option>)}
            </select>
          </div>
        )}
      </div>
    </Modal>
  );
}
