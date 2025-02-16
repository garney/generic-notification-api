import React, { useEffect, useState } from 'react';
import Config from './config';

import './app.scss';

import Dice from './dice';
import Logs from './logs';

function App({socket,connectionId}) {
    const [connectionDetails, setConnectionDetails] = useState({});

    useEffect(() => {
        socket.on('connected', (id) => {
            setConnectionDetails({
                id,
                status: socket.status
            })
        });
    

    }, []);


    return (
        <div className="app">
            <div>
                <span className="status">{connectionDetails.status}</span> with
                connection ID <span className="id">{connectionId}</span>
            </div>
            {/* <Dice socket={socket}/> */}
            <Logs socket={socket}/>
        </div>
    )
}

module.exports = App;