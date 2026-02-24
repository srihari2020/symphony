import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getProjectFiles, uploadFile, deleteFile } from '../api';
import { useEffect } from 'react';

export default function ProjectFiles({ projectId }) {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        loadFiles();
    }, [projectId]);

    const loadFiles = async () => {
        try {
            const res = await getProjectFiles(projectId);
            setFiles(res.data.files || []);
        } catch (err) {
            console.error('Failed to load files:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (fileList) => {
        if (!fileList?.length) return;
        setUploading(true);
        try {
            for (const file of fileList) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('projectId', projectId);
                const res = await uploadFile(formData);
                setFiles(prev => [res.data.file, ...prev]);
            }
        } catch (err) {
            console.error('Upload failed:', err);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this file?')) return;
        try {
            await deleteFile(id);
            setFiles(prev => prev.filter(f => f._id !== id));
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        handleUpload(e.dataTransfer.files);
    };

    const formatSize = (bytes) => {
        if (!bytes) return '—';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    };

    const isImage = (type) => type?.startsWith('image/');

    const getFileIcon = (type) => {
        if (isImage(type)) return '🖼️';
        if (type?.includes('pdf')) return '📄';
        if (type?.includes('zip') || type?.includes('tar')) return '📦';
        if (type?.includes('video')) return '🎬';
        if (type?.includes('audio')) return '🎵';
        if (type?.includes('text') || type?.includes('json') || type?.includes('javascript')) return '📝';
        return '📎';
    };

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading files...</div>;
    }

    return (
        <div>
            {/* Upload zone */}
            <motion.div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                animate={{ borderColor: dragOver ? '#6366f1' : 'var(--border-color)' }}
                style={{
                    border: '2px dashed', borderColor: 'var(--border-color)',
                    borderRadius: '16px', padding: '2rem', textAlign: 'center',
                    cursor: 'pointer', background: dragOver ? 'rgba(99,102,241,0.05)' : 'var(--bg-secondary)',
                    transition: 'background 0.2s', marginBottom: '1.5rem',
                }}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={e => handleUpload(e.target.files)}
                    style={{ display: 'none' }}
                />
                {uploading ? (
                    <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⬆️</div>
                        <div style={{ color: '#6366f1', fontSize: '0.85rem' }}>Uploading...</div>
                    </motion.div>
                ) : (
                    <>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📁</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Drop files here or click to upload</div>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.72rem', marginTop: '0.25rem' }}>Max 10MB per file</div>
                    </>
                )}
            </motion.div>

            {/* File grid */}
            {files.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '2rem', fontSize: '0.85rem' }}>
                    No files uploaded yet.
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                    <AnimatePresence>
                        {files.map((file, i) => (
                            <motion.div
                                key={file._id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                whileHover={{ y: -4 }}
                                transition={{ delay: i * 0.05 }}
                                style={{
                                    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                                    borderRadius: '14px', overflow: 'hidden',
                                }}
                            >
                                {/* Preview */}
                                <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                                    {isImage(file.type) ? (
                                        <img src={file.url} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ fontSize: '2.5rem' }}>{getFileIcon(file.type)}</span>
                                    )}
                                </div>
                                <div style={{ padding: '0.75rem' }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
                                        {file.name}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                                        {formatSize(file.size)} • {file.uploadedBy?.name || 'Unknown'}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        <a
                                            href={file.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{
                                                flex: 1, textAlign: 'center', padding: '0.35rem',
                                                background: 'rgba(99,102,241,0.1)', borderRadius: '8px',
                                                color: '#6366f1', fontSize: '0.7rem', textDecoration: 'none', fontWeight: 600,
                                            }}
                                        >
                                            Open
                                        </a>
                                        <button
                                            onClick={() => handleDelete(file._id)}
                                            style={{
                                                padding: '0.35rem 0.5rem', background: 'rgba(239,68,68,0.1)',
                                                border: 'none', borderRadius: '8px', color: '#ef4444',
                                                fontSize: '0.7rem', cursor: 'pointer', fontWeight: 600,
                                            }}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
