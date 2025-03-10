import React, { useEffect, useState } from 'react';
import './ProductListManager.css';

const ProductListManager = ({ socket, onProductListsUpdate }) => {
    const [productLists, setProductLists] = useState({});
    const [selectedListKey, setSelectedListKey] = useState('');
    const [newListName, setNewListName] = useState('');
    const [productUrl, setProductUrl] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [ignore, setIgnore] = useState(false);
    const [whole, setWhole] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [watcherStatus, setWatcherStatus] = useState({ active: false });

    useEffect(() => {
        // Load product lists from localStorage
        const loadProductLists = () => {
            try {
                const storedLists = localStorage.getItem('PRODUCT_LISTS');
                const lists = storedLists ? JSON.parse(storedLists) : { 'DEFAULT_LIST': [] };
                setProductLists(lists);
                
                if (Object.keys(lists).length > 0) {
                    setSelectedListKey(Object.keys(lists)[0]);
                }
                
                // Get watcher status
                if (socket.id) {
                    socket.connection.emit('getWatcherStatus', {}, (status) => {
                        setWatcherStatus(status);
                    });
                }
            } catch (error) {
                console.error('Error loading product lists:', error);
            }
        };
        
        loadProductLists();
    }, [socket.id]);

    const saveProductLists = (lists) => {
        try {
            localStorage.setItem('PRODUCT_LISTS', JSON.stringify(lists));
            // Notify parent component that product lists have been updated
            if (onProductListsUpdate) {
                onProductListsUpdate();
            }
            return true;
        } catch (error) {
            console.error('Error saving product lists:', error);
            return false;
        }
    };

    const createNewList = () => {
        if (!newListName.trim()) {
            alert('Please enter a list name');
            return;
        }
        
        const listKey = newListName.toUpperCase().replace(/\s+/g, '_');
        
        if (productLists[listKey]) {
            alert('A list with this name already exists');
            return;
        }
        
        const updatedLists = {
            ...productLists,
            [listKey]: []
        };
        
        setProductLists(updatedLists);
        setSelectedListKey(listKey);
        setNewListName('');
        
        saveProductLists(updatedLists);
    };

    const deleteList = (listKey) => {
        if (window.confirm(`Are you sure you want to delete the list "${listKey}"?`)) {
            const updatedLists = { ...productLists };
            delete updatedLists[listKey];
            
            setProductLists(updatedLists);
            
            if (selectedListKey === listKey) {
                setSelectedListKey(Object.keys(updatedLists)[0] || '');
            }
            
            saveProductLists(updatedLists);
        }
    };

    const addOrUpdateProduct = () => {
        if (!productUrl || !displayName) {
            alert('Please fill in all required fields.');
            return;
        }
        
        if (!selectedListKey) {
            alert('Please select or create a product list first.');
            return;
        }

        const currentList = [...(productLists[selectedListKey] || [])];
        
        if (editingIndex !== null) {
            currentList[editingIndex] = { 
                url: productUrl, 
                name: displayName, 
                ignore, 
                whole 
            };
            setEditingIndex(null);
        } else {
            currentList.push({ 
                url: productUrl, 
                name: displayName, 
                ignore, 
                whole 
            });
        }

        const updatedLists = {
            ...productLists,
            [selectedListKey]: currentList
        };
        
        setProductLists(updatedLists);
        saveProductLists(updatedLists);
        clearProductInputs();
    };

    const removeProduct = (index) => {
        const currentList = [...(productLists[selectedListKey] || [])];
        currentList.splice(index, 1);
        
        const updatedLists = {
            ...productLists,
            [selectedListKey]: currentList
        };
        
        setProductLists(updatedLists);
        saveProductLists(updatedLists);
    };

    const editProduct = (index) => {
        const product = productLists[selectedListKey][index];
        setProductUrl(product.url);
        setDisplayName(product.name);
        setIgnore(product.ignore || false);
        setWhole(product.whole || false);
        setEditingIndex(index);
    };

    const clearProductInputs = () => {
        setProductUrl('');
        setDisplayName('');
        setIgnore(false);
        setWhole(false);
    };

    const startProductWatcher = () => {
        if (!selectedListKey || !productLists[selectedListKey]) {
            alert('Please select a valid product list');
            return;
        }

        const data = {
            listName: selectedListKey,
            products: productLists[selectedListKey]
        };

        if (socket.id) {
            socket.connection.emit('startProductWatcher', data, (response) => {
                if (response.success) {
                    setWatcherStatus({ active: true, listName: selectedListKey });
                    alert(response.message);
                } else {
                    alert('Failed to start product watcher');
                }
            });
        }
    };

    const stopProductWatcher = () => {
        if (socket.id) {
            socket.connection.emit('stopWatcher', {}, (response) => {
                if (response.success) {
                    setWatcherStatus({ active: false });
                    alert(response.message);
                } else {
                    alert('Failed to stop product watcher');
                }
            });
        }
    };

    const reloadTab = () => {
        if (socket.id) {
            socket.connection.emit('reloadTab', {}, () => {
                // The page will reload, so no need to handle the response
            });
        }
    };

    return (
        <div className="product-list-manager">
            <h2 className="product-list-title">Product List Manager</h2>
            
            <div className="product-list-controls">
                <div className="watcher-status">
                    <span>Watcher Status: </span>
                    <span className={`status-badge ${watcherStatus.active ? 'active' : 'inactive'}`}>
                        {watcherStatus.active ? 'Active' : 'Inactive'}
                    </span>
                    {watcherStatus.active && watcherStatus.listName && (
                        <span className="watching-list">Watching: {watcherStatus.listName}</span>
                    )}
                </div>
                
                <div className="watcher-actions">
                    <button 
                        className="action-button start-button" 
                        onClick={startProductWatcher}
                        disabled={watcherStatus.active}
                    >
                        Start Watcher
                    </button>
                    <button 
                        className="action-button stop-button" 
                        onClick={stopProductWatcher}
                        disabled={!watcherStatus.active}
                    >
                        Stop Watcher
                    </button>
                    <button className="action-button reload-button" onClick={reloadTab}>
                        Reload Tab
                    </button>
                </div>
            </div>
            
            <div className="product-list-selector">
                <div className="form-group">
                    <label>Select Product List</label>
                    <div className="select-with-action">
                        <select 
                            value={selectedListKey} 
                            onChange={(e) => setSelectedListKey(e.target.value)}
                            className="product-list-select"
                        >
                            {Object.keys(productLists).map(key => (
                                <option key={key} value={key}>{key.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                        {selectedListKey && (
                            <button 
                                className="action-button delete-button" 
                                onClick={() => deleteList(selectedListKey)}
                            >
                                Delete List
                            </button>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="form-group">
                <label>Create New List</label>
                <div className="input-with-action">
                    <input
                        type="text"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        placeholder="Enter new list name"
                        className="product-list-input"
                    />
                    <button className="action-button create-button" onClick={createNewList}>
                        Create
                    </button>
                </div>
            </div>
            
            {selectedListKey && (
                <>
                    <h3 className="product-form-title">Add Product to {selectedListKey.replace(/_/g, ' ')}</h3>
                    <div className="product-form">
                        <div className="form-group">
                            <label>Product URL</label>
                            <input
                                type="text"
                                value={productUrl}
                                onChange={(e) => setProductUrl(e.target.value)}
                                placeholder="Enter product URL"
                                className="product-list-input"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Display Name</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Enter display name"
                                className="product-list-input"
                            />
                        </div>
                        
                        <div className="checkbox-group">
                            <div className="checkbox">
                                <input
                                    type="checkbox"
                                    id="ignore-checkbox"
                                    checked={ignore}
                                    onChange={(e) => setIgnore(e.target.checked)}
                                />
                                <label htmlFor="ignore-checkbox">Ignore</label>
                            </div>
                            
                            <div className="checkbox">
                                <input
                                    type="checkbox"
                                    id="whole-checkbox"
                                    checked={whole}
                                    onChange={(e) => setWhole(e.target.checked)}
                                />
                                <label htmlFor="whole-checkbox">Whole</label>
                            </div>
                        </div>
                        
                        <button 
                            className="action-button add-button" 
                            onClick={addOrUpdateProduct}
                        >
                            {editingIndex !== null ? 'Update Product' : 'Add Product'}
                        </button>
                    </div>
                    
                    <h3 className="product-list-title">Products in {selectedListKey.replace(/_/g, ' ')}</h3>
                    <div className="product-list">
                        {productLists[selectedListKey] && productLists[selectedListKey].length > 0 ? (
                            productLists[selectedListKey].map((product, index) => (
                                <div key={index} className="product-item">
                                    <div className="product-details">
                                        <div className="product-name">{product.name}</div>
                                        <div className="product-url">{product.url}</div>
                                        <div className="product-flags">
                                            {product.ignore && <span className="flag ignore-flag">Ignored</span>}
                                            {product.whole && <span className="flag whole-flag">Whole</span>}
                                        </div>
                                    </div>
                                    <div className="product-actions">
                                        <button 
                                            className="action-button edit-button" 
                                            onClick={() => editProduct(index)}
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            className="action-button delete-button" 
                                            onClick={() => removeProduct(index)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-list-message">
                                No products in this list yet
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default ProductListManager; 