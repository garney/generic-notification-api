import React, { useEffect, useState } from 'react';
import Config from './config';
import Socket from './socket/index';

import './app.scss';

function Status({socket = {}}) {
    const [status, setStatus] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [statusDetails, setStatusDetails] = useState(null);

    useEffect(() => {
        if (socket.id) {
            socket.connection.emit('getStatus');
            socket.connection.on('statusList', (status) => {
                setStatus(status);
            });
            socket.connection.on('statusDetails', (statusDetails) => {
                console.log(statusDetails);
                setStatusDetails(statusDetails);
            });
        }
    }, [socket.id]);

    const handleStatusClick = (statusPath) => {
        setSelectedStatus(statusPath);
        setStatusDetails(status[statusPath]);
    };

    return (
        <div>
            <h1>Status</h1>
            <div>
                {
                    // JSON.stringify(status)
                    Object.keys(status).map((key, idx) => (
                        <div key={idx} onClick={() => handleStatusClick(key)}>
                            {key} - {status[key].lastCheckIn}
                            <br/>
                            {status[key].status}
                        </div>
                    ))
                }
            </div>
            <div>
                {
                    selectedStatus && (
                        <div>
                            <h2>Selected Status</h2>
                            <pre>{selectedStatus}</pre>
                            {statusDetails.status}
                        </div>
                    )
                }
            </div>
        </div>
    )
}

module.exports = Status;