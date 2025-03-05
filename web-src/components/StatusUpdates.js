import React, { useEffect, useState } from 'react';
import './StatusUpdates.css';
import ActionModal from './ActionModal';

function StatusUpdates({ socket = {} }) {
    const [updates, setUpdates] = useState({});
    const [modalData, setModalData] = useState(null);
    const [actionModalOpen, setActionModalOpen] = useState(false);
    const [selectedTabId, setSelectedTabId] = useState(null);

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
                        tabId: update.tabId,
                        type: update.type,
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

    const handleActionClick = (tabId) => {
        setSelectedTabId(tabId);
        setActionModalOpen(true);
    };

    const handleActionSubmit = (actionData) => {
        if (socket.id) {
            socket.connection.emit('addActionToQueue', actionData);
        }
    };

    return (
        <div className="status-container">
            <h2 className="status-title">Status Updates</h2>
            
            <div className="status-table-header">
                <div>ID</div>
                <div>Status</div>
                <div>Timestamp</div>
                <div>Data</div>
                <div style={{display: 'none'}}>Tab ID</div>
                <div>Type</div>
                <div>image</div>
                <div>Actions</div>
            </div>

            <div className="status-table-body">
                {Object.values(updates).map((update) => (
                    <div key={update.id} className="status-row">
                        <div>
                            <span className="status-id">{update.id}</span>
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

                        <div className="status-tabId" style={{display: 'none'}}>{update.tabId}</div>
                        <div className="status-type">{update.type}</div>
                        <div className="status-image">
                            {update.imageUrl ? <img src={update.imageUrl}/> : 'n/a'}
                        </div>

                        <div className="status-actions">
                            {update.tabId && (
                                <button 
                                    className="status-button status-button-action"
                                    onClick={() => handleActionClick(update.tabId)}
                                >
                                    Actions
                                </button>
                            )}
                            
                        </div>
                    </div>
                ))}
            </div>

            <ActionModal
                isOpen={actionModalOpen}
                onClose={() => setActionModalOpen(false)}
                onSubmit={handleActionSubmit}
                socket={socket}
                tabId={selectedTabId}
            />

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