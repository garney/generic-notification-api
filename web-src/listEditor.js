import React, { useEffect, useState } from 'react';
import Config from './config';
import Socket from './socket/index';


import './app.scss';

export default function ListEditor({ listName = 'PRODUCT_LIST', title = 'list', socket = {}}) {
    const [productList, setProductList] = useState([]);
    const [dataFileContents, setDataFileContent] = useState([]);
    const [files, setFiles] = useState([]);
    const [discordBotToken, setDiscordBotToken] = useState('');
    const [channelId, setChannelId] = useState('');
    const [productUrl, setProductUrl] = useState('');
    const [productId, setProductId] = useState('');
    const [extraElemClick, setExtraElemClick] = useState('');
    const [importFilename, setImportFilename] = useState(listName);

    useEffect(() => {
        if (socket.id) {
            socket.connection.emit('getDataFiles');
            socket.connection.on('dataFilesList', (data) => {
                setFiles(data);
            });
            socket.connection.on('dataFileContents', (data) => {
                console.log(data);
                setDataFileContent(data);
            });
        }
    }, [socket.id]);

    return (
        <div>
            <h1>{title}</h1>
            <div>
                {
                    files.map((file, idx) => (
                        <div key={idx} onClick={() => socket.connection.emit('readDataFile', file)}>
                            {file}
                        </div>
                    ))
                }
            </div>
        <div>
            <h2>Data File Contents</h2>
            <table>
                <thead>
                    <tr>
                        <th>URL</th>
                        <th>Ignore</th>
                        <th>Extra Elem Click</th>
                        <th>Product ID</th>
                    </tr>
                </thead>
                <tbody>
                    {dataFileContents && dataFileContents.map((item, idx) => (
                        <tr key={idx}>
                            <td>{item.url}</td>
                            <td><input type="checkbox" checked={item.ignore} /></td>
                            <td>{item.extraElemClick}</td>
                            <td>{item.productId}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        </div>
    );
}