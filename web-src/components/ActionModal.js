import React, { useState, useEffect } from 'react';
import './ActionModal.css';

function ActionModal({ isOpen, onClose, onSubmit, socket, tabId }) {
    const [actionType, setActionType] = useState('');
    const [actionData, setActionData] = useState({});
    const [priorityList, setPriorityList] = useState([]);

    useEffect(() => {
        if (socket?.id && actionType === 'loadPriority') {
            socket.connection.emit('readDataFile', 'priority-list.json');
            socket.connection.on('dataFileContents', (data) => {
                setPriorityList(data);
            });
        }
    }, [socket?.id, actionType]);

    const actionTypes = [
        { value: 'reloadTab', label: 'Reload Tab' },
        { value: 'loadPriority', label: 'Load Priority URL' },
        { value: 'openPrioriy', label: 'Open New Priority URL' },
        { value: 'setUpConfig', label: 'Setup Configuration' }
    ];

    const handleSubmit = () => {
        if (!tabId) {
            alert('Tab ID is required');
            return;
        }

        onSubmit({
            type: actionType,
            tabId,
            data: actionData
        });
        onClose();
    };

    const renderActionFields = () => {
        switch (actionType) {
            case 'reloadTab':
                return null;
            case 'loadPriority':
                return (
                    <div className="action-fields">
                        <select 
                            value={actionData.url || ''} 
                            onChange={(e) => setActionData({ ...actionData, url: e.target.value })}
                        >
                            <option value="">Select from Priority List</option>
                            {priorityList.map((item, index) => (
                                <option key={index} value={item.url}>{item.url}</option>
                            ))}
                        </select>
                        <div className="separator">OR</div>
                        <input
                            type="text"
                            placeholder="Enter URL manually"
                            value={actionData.manualUrl || ''}
                            onChange={(e) => setActionData({ ...actionData, manualUrl: e.target.value })}
                        />
                    </div>
                );
            case 'openPrioriy':
                return (
                    <div className="action-fields">
                        <select 
                            value={actionData.url || ''} 
                            onChange={(e) => setActionData({ ...actionData, url: e.target.value })}
                        >
                            <option value="">Select from Priority List</option>
                            {priorityList.map((item, index) => (
                                <option key={index} value={item.url}>{item.url}</option>
                            ))}
                        </select>
                        <div className="separator">OR</div>
                        <input
                            type="text"
                            placeholder="Enter URL manually"
                            value={actionData.manualUrl || ''}
                            onChange={(e) => setActionData({ ...actionData, manualUrl: e.target.value })}
                        />
                    </div>
                );
            case 'setUpConfig':
                return (
                    <div className="action-fields">
                        <input
                            type="text"
                            placeholder="Priority Mode"
                            value={actionData.priorityMode || ''}
                            onChange={(e) => setActionData({ ...actionData, priorityMode: e.target.value })}
                        />
                        <input
                            type="number"
                            placeholder="Reload Interval (seconds)"
                            value={actionData.reloadInterval || ''}
                            onChange={(e) => setActionData({ ...actionData, reloadInterval: e.target.value })}
                        />
                        <input
                            type="number"
                            placeholder="Try Again In (seconds)"
                            value={actionData.tryAgainInSeconds || ''}
                            onChange={(e) => setActionData({ ...actionData, tryAgainInSeconds: e.target.value })}
                        />
                        <input
                            type="number"
                            placeholder="Idle Check In (seconds)"
                            value={actionData.idleCheckInSecs || ''}
                            onChange={(e) => setActionData({ ...actionData, idleCheckInSecs: e.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="Priority URL"
                            value={actionData.priorityUrl || ''}
                            onChange={(e) => setActionData({ ...actionData, priorityUrl: e.target.value })}
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="action-modal-overlay" onClick={onClose}>
            <div className="action-modal-content" onClick={e => e.stopPropagation()}>
                <div className="action-modal-header">
                    <h3>Select Action</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div className="action-modal-body">
                    <select 
                        value={actionType} 
                        onChange={(e) => setActionType(e.target.value)}
                        className="action-type-select"
                    >
                        <option value="">Select an action</option>
                        {actionTypes.map(type => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>

                    {renderActionFields()}

                    <div className="action-modal-footer">
                        <button 
                            className="action-submit-button" 
                            onClick={handleSubmit}
                            disabled={!actionType || !tabId}
                        >
                            Submit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ActionModal; 