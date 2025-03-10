import React, { useState, useEffect } from 'react';
import './ActionModal.css';

const ActionModal = ({ isOpen, onClose, onSubmit, socket, tabId, productLists = {} }) => {
    const [action, setAction] = useState('');
    const [actionData, setActionData] = useState({});
    const [selectedListKey, setSelectedListKey] = useState('');
    const [watcherStatus, setWatcherStatus] = useState({ active: false });

    useEffect(() => {
        // Initialize selected list and get watcher status when modal opens
        if (isOpen) {
            if (Object.keys(productLists).length > 0 && !selectedListKey) {
                setSelectedListKey(Object.keys(productLists)[0]);
            }
            getWatcherStatus();
        }
    }, [isOpen, socket.id, productLists]);

    const getWatcherStatus = () => {
        if (socket.id) {
            socket.connection.emit('getWatcherStatus', {}, (status) => {
                setWatcherStatus(status);
            });
        }
    };

    const handleActionChange = (e) => {
        setAction(e.target.value);
        // Reset action data when action changes
        setActionData({});
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setActionData({
            ...actionData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleListChange = (e) => {
        setSelectedListKey(e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        let data = { action };
        
        switch (action) {
            case 'startProductWatcher':
                if (!selectedListKey || !productLists[selectedListKey]) {
                    alert('Please select a valid product list');
                    return;
                }
                
                data = {
                    action,
                    listName: selectedListKey,
                    products: productLists[selectedListKey]
                };
                
                if (socket.id) {
                    socket.connection.emit('startProductWatcher', data, (response) => {
                        if (response.success) {
                            alert(response.message);
                            getWatcherStatus();
                        } else {
                            alert('Failed to start product watcher');
                        }
                    });
                }
                break;
                
            case 'stopWatcher':
                if (socket.id) {
                    socket.connection.emit('stopWatcher', {}, (response) => {
                        if (response.success) {
                            alert(response.message);
                            getWatcherStatus();
                        } else {
                            alert('Failed to stop product watcher');
                        }
                    });
                }
                break;
                
            case 'getWatcherStatus':
                getWatcherStatus();
                break;
                
            case 'reloadTab':
                if (socket.id) {
                    socket.connection.emit('reloadTab', { tabId }, () => {
                        // The page will reload, so no need to handle the response
                    });
                }
                break;
                
            default:
                // For other custom actions
                data = {
                    ...data,
                    ...actionData,
                    tabId
                };
                onSubmit(data);
                break;
        }
        
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="action-modal-overlay">
            <div className="action-modal-content">
                <div className="action-modal-header">
                    <h3>Perform Action</h3>
                    <button className="action-modal-close" onClick={onClose}>×</button>
                </div>
                
                <div className="action-modal-body">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Select Action</label>
                            <select 
                                value={action} 
                                onChange={handleActionChange}
                                className="action-select"
                                required
                            >
                                <option value="">-- Select an action --</option>
                                <option value="startProductWatcher">Start Product Watcher</option>
                                <option value="stopWatcher">Stop Product Watcher</option>
                                <option value="getWatcherStatus">Get Watcher Status</option>
                                <option value="reloadTab">Reload Tab</option>
                                <option value="custom">Custom Action</option>
                            </select>
                        </div>
                        
                        {action === 'startProductWatcher' && (
                            <div className="form-group">
                                <label>Select Product List</label>
                                {Object.keys(productLists).length > 0 ? (
                                    <select 
                                        value={selectedListKey} 
                                        onChange={handleListChange}
                                        className="product-list-select"
                                        required
                                    >
                                        {Object.keys(productLists).map(key => (
                                            <option key={key} value={key}>{key.replace(/_/g, ' ')}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="no-lists-message">
                                        No product lists available. Please create a product list first.
                                    </div>
                                )}
                                
                                <div className="watcher-status-info">
                                    <p>Current Watcher Status: 
                                        <span className={`status-badge ${watcherStatus.active ? 'active' : 'inactive'}`}>
                                            {watcherStatus.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </p>
                                    {watcherStatus.active && watcherStatus.listName && (
                                        <p>Watching List: <strong>{watcherStatus.listName}</strong></p>
                                    )}
                                </div>
                                
                                {selectedListKey && productLists[selectedListKey] && (
                                    <div className="product-list-info">
                                        <p>Products in list: {productLists[selectedListKey].length}</p>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {action === 'stopWatcher' && (
                            <div className="watcher-status-info">
                                <p>Current Watcher Status: 
                                    <span className={`status-badge ${watcherStatus.active ? 'active' : 'inactive'}`}>
                                        {watcherStatus.active ? 'Active' : 'Inactive'}
                                    </span>
                                </p>
                                {watcherStatus.active && watcherStatus.listName && (
                                    <p>Watching List: <strong>{watcherStatus.listName}</strong></p>
                                )}
                            </div>
                        )}
                        
                        {action === 'getWatcherStatus' && (
                            <div className="watcher-status-info">
                                <p>Current Watcher Status: 
                                    <span className={`status-badge ${watcherStatus.active ? 'active' : 'inactive'}`}>
                                        {watcherStatus.active ? 'Active' : 'Inactive'}
                                    </span>
                                </p>
                                {watcherStatus.active && watcherStatus.listName && (
                                    <p>Watching List: <strong>{watcherStatus.listName}</strong></p>
                                )}
                            </div>
                        )}
                        
                        {action === 'reloadTab' && (
                            <div className="reload-info">
                                <p>This will reload the tab with ID: <strong>{tabId}</strong></p>
                            </div>
                        )}
                        
                        {action === 'custom' && (
                            <>
                                <div className="form-group">
                                    <label>Action Name</label>
                                    <input
                                        type="text"
                                        name="actionName"
                                        value={actionData.actionName || ''}
                                        onChange={handleInputChange}
                                        placeholder="Enter action name"
                                        className="action-input"
                                        required
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>Action Parameters (JSON)</label>
                                    <textarea
                                        name="params"
                                        value={actionData.params || ''}
                                        onChange={handleInputChange}
                                        placeholder='{"key": "value"}'
                                        className="action-textarea"
                                        rows={5}
                                    />
                                </div>
                            </>
                        )}
                        
                        <div className="action-buttons">
                            <button type="button" className="cancel-button" onClick={onClose}>
                                Cancel
                            </button>
                            <button type="submit" className="submit-button">
                                Execute Action
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ActionModal; 