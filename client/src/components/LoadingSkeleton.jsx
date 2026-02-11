import React from 'react';
import './LoadingSkeleton.css';

export const CardSkeleton = () => (
    <div className="skeleton-card">
        <div className="skeleton-header">
            <div className="skeleton skeleton-title"></div>
            <div className="skeleton skeleton-icon"></div>
        </div>
        <div className="skeleton skeleton-text"></div>
        <div className="skeleton skeleton-text short"></div>
        <div className="skeleton-footer">
            <div className="skeleton skeleton-button"></div>
        </div>
    </div>
);

export const ListSkeleton = ({ count = 5 }) => (
    <div className="skeleton-list">
        {[...Array(count)].map((_, i) => (
            <div key={i} className="skeleton-list-item">
                <div className="skeleton skeleton-avatar"></div>
                <div className="skeleton-list-content">
                    <div className="skeleton skeleton-text"></div>
                    <div className="skeleton skeleton-text short"></div>
                </div>
            </div>
        ))}
    </div>
);

export const GridSkeleton = ({ count = 6 }) => (
    <div className="skeleton-grid">
        {[...Array(count)].map((_, i) => (
            <CardSkeleton key={i} />
        ))}
    </div>
);

export const LoadingSpinner = () => (
    <div className="loading-spinner">
        <div className="spinner"></div>
    </div>
);
