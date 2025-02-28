import React, { useEffect, useState } from 'react';
import './StatusUpdates.css';

function StatusUpdates({ socket = {} }) {
    const [updates, setUpdates] = useState({});
    const [modalData, setModalData] = useState(null);

    useEffect(() => {
        if (socket.id) {
            socket.connection.on('statusUpdate', (update) => {
                console.log('🪵 ~ socket.connection.on ~ update:', update);
                setUpdates(prevUpdates => ({
                    ...prevUpdates,
                    [update.id]: {
                        id: update.id,
                        status: update.status,
                        data: update.data,
                        timestamp: new Date().toLocaleString(),
                    }
                }));
            });

            socket.connection.on('connect', () => {
                setUpdates(prevUpdates => ({
                    ...prevUpdates,
                    connection: {
                        id: 'connection',
                        status: 'Connected to server',
                        timestamp: new Date().toLocaleString(),
                    }
                }));
            });

            socket.connection.on('disconnect', () => {
                setUpdates(prevUpdates => ({
                    ...prevUpdates,
                    connection: {
                        id: 'connection',
                        status: 'Disconnected from server',
                        timestamp: new Date().toLocaleString(),
                    }
                }));
            });
        }

        return () => {
            if (socket.id) {
                socket.connection.off('statusUpdate');
                socket.connection.off('connect');
                socket.connection.off('disconnect');
            }
        };
    }, [socket.id]);

    const shortenId = (id) => {
        return id.substring(0, 8) + '...';
    };

    const formatData = (data) => {
        if (!data) return '';
        return JSON.stringify(data).replace(/,"/g, ', "');
    };

    const handleDataClick = (data) => {
        setModalData(data);
    };

    const closeModal = () => {
        setModalData(null);
    };

    return (
        <div className="status-container">
            <h2 className="status-title">Status Updates</h2>
            
            <div className="status-table-header">
                <div>ID</div>
                <div>Status</div>
                <div>Timestamp</div>
                <div>Data</div>
                <div>Actions</div>
            </div>

            <div className="status-table-body">
                {Object.values(updates).map((update) => (
                    <div key={update.id} className="status-row">
                        <div>
                            <span className="status-id">{shortenId(update.id)}</span>
                        </div>
                        
                        <div className="status-label">{update.status}</div>
                        
                        <div className="status-timestamp">{update.timestamp}</div>
                        
                        <div className="status-data">
                            <span 
                                className="status-data-content" 
                                onClick={() => handleDataClick(update.data)}
                                style={{ cursor: 'pointer' }}
                            >
                                {formatData(update.data)}
                            </span>
                        </div>

                        <div className="status-actions">
                            <button className="status-button status-button-view">View</button>
                            <button className="status-button status-button-clear">Clear</button>
                        </div>
                    </div>
                ))}
            </div>

            {modalData && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Data Details</h3>
                            <button className="modal-close" onClick={closeModal}>×</button>
                        </div>
                        <div className="modal-body">
                            <pre>{JSON.stringify(modalData, null, 2)}</pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default StatusUpdates; 