import React, { useEffect, useState } from 'react';
import Config from './config';
import Socket from './socket/index';

import './app.scss';

function Logs({socket = {}}) {
    const [logs, setLogs] = useState([]);
    const [selectedLog, setSelectedLog] = useState(null);
    const [logContents, setLogContents] = useState(null);

    useEffect(() => {
        if (socket.id) {
            socket.connection.emit('getLogs');
            socket.connection.on('logsList', (logs) => {
                setLogs(logs);
            });
            socket.connection.on('logContents', (logContents) => {
                console.log(logContents);
                setLogContents(logContents);
            });
        }
    }, [socket.id]);

    const handleLogClick = (logPath) => {
        setSelectedLog(logPath);
        socket.connection.emit('getLogContents', logPath);
    };

    return (
        <div>
            <h1>Logs</h1>
            <div>
                {
                    logs.map((logPath, idx) => (
                        <div key={idx} onClick={() => handleLogClick(logPath)}>
                            {logPath}
                        </div>
                    ))
                }
            </div>
            <div>
                {
                    selectedLog && (
                        <div>
                            <h2>Selected Log</h2>
                            <pre>{selectedLog}</pre>
                        <pre style={{ fontFamily: 'monospace' }}>
                            {logContents?.split('\n').map((line) => {
                                const [date, hash, message] = line.split(' - ');
                                const urlMatch = message?.match(/https?:\/\/[^ ]+/);
                                return (
                                    <React.Fragment key={line}>
                                        {/* <strong style={{ color: 'gray' }}>{date}</strong> - {hash} - {urlMatch ? <a href={urlMatch[0]} target="_blank" rel="noopener noreferrer" style={{ color: 'blue' }}>{message}</a> : message} */}
                                        <strong style={{ color: 'gray' }}>{date}</strong> - {hash} - {urlMatch ? <a href={urlMatch[0]} target="_blank" rel="noopener noreferrer" style={{ color: 'blue' }}>{message}</a> : message}
                                        <br />
                                    </React.Fragment>
                                );
                            })}
                        </pre>
                        </div>
                    )
                }
            </div>
        </div>
    )
}

module.exports = Logs;