import shortId from 'shortid';
import fs from 'fs';
import path from 'path';
import Routes from './routes';

export default class Socket {
  constructor(socket) {
    this.socket = socket;
    console.log(socket.id, 'CONNECTED')
    socket.emit(`connected`, shortId.generate());
    this.setup();
  }

  static statusList = {};
  static actionQueueForTabs = {};

  roll = (num) => {
    console.log('roll');
    const dice = [];
    for(let i = 0; i < num; i++) {
      dice.push(Math.ceil(Math.random()*6))
    }
    console.log('rolled', dice)
    this.socket.emit('rolled', dice)
  }

  setup = () => {
    console.log('setup');
    this.socket.on('disconnect', this.onDisconnect);
    this.socket.on('reconnect', this.onReconnect);
    this.socket.on('roll', this.roll);
    this.socket.on('getLogs', this.getLogs);
    this.socket.on('getLogContents', this.getLogContents);
    this.socket.on('getStatus', this.getStatus);
    this.socket.on('getDataFiles', this.getDataFiles);
    this.socket.on('readDataFile', this.readDataFile);
    this.socket.on('updateDataFile', this.updateDataFile);
    this.socket.on('addActionToQueue', this.addActionToQueue);
  }

  destroy = () => {
    console.log('destroy');
    this.socket.off('disconnect', this.onDisconnect);
    this.socket.off('reconnect', this.onReconnect);
    this.socket.off('roll', this.roll);
    this.socket.off('getLogs', this.getLogs);
    this.socket.off('getLogContents', this.getLogContents);
    this.socket.off('getStatus', this.getStatus);
    this.socket.off('getDataFiles', this.getDataFiles);
    this.socket.off('readDataFile', this.readDataFile);
    this.socket.off('updateDataFile', this.updateDataFile);
    this.socket.off('addActionToQueue', this.addActionToQueue);
  }

  onDisconnect = () => {
    console.log('disconnect');
    this.destroy();
  }

  onReconnect = () => {
    console.log('reconnect');
    this.setup();
  }

  getLogs = () => {
    const logDir = path.join(__dirname, '../logs');
    const files = fs.readdirSync(logDir);
    const logs = files.map(file => path.join(logDir, file));
    logs.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
    this.socket.emit('logsList', logs);
  }

  getLogContents = (logPath) => {
    if (!fs.existsSync(logPath)) {
      this.socket.emit('logContents', { error: 'Log file not found' });
      return;
    }
    const logContents = fs.readFileSync(logPath, 'utf8');
    this.socket.emit('logContents', logContents);
  }

  getStatus = () => {
    this.socket.emit('statusList', Socket.statusList);
  }

  getDataFiles = () => {
    const dataDir = path.join(__dirname, '../data');
    const files = fs.readdirSync(dataDir);
    this.socket.emit('dataFilesList', files);
  }
  static updateStatus(id, status, data, type, tabId) {
    const prevStatus = this.statusList[id] || {};
    if (!id) {
      throw new Error('ID is required to update status');
    }
    this.statusList = this.statusList || {};
    this.statusList[id] = {
      id,
      status,
      data,
      type,
      tabId,
      lastUpdated: new Date()
    };
    console.log(`Status updated for ID: ${id}`, this.statusList[id]);
    Socket.io.emit('statusUpdate', { id, status, data, type, tabId });
    return {
      prevStatus,
      time: new Date()
    };
  }


  readDataFile = (filename) => {
    const filePath = path.join(__dirname, '../data', filename);
    if (!fs.existsSync(filePath)) {
      this.socket.emit('dataFileContents', { error: 'Data file not found' });
      return;
    }
    const fileContents = fs.readFileSync(filePath, 'utf8');
    this.socket.emit('dataFileContents', JSON.parse(fileContents));
  }

  updateDataFile = (filename, contents) => {
    const filePath = path.join(__dirname, '../data', filename);
    if (!fs.existsSync(filePath)) {
      this.socket.emit('updateDataFileResult', { error: 'Data file not found' });
      return;
    }
    fs.writeFileSync(filePath, JSON.stringify(contents, useCallback, 3));
    this.socket.emit('updateDataFileResult', { success: true });
  }

  addActionToQueue = ({tabId, type, data}) => {
    if (!Socket.actionQueueForTabs[tabId]) {
      Socket.actionQueueForTabs[tabId] = [];
    }
    Socket.actionQueueForTabs[tabId].push({ type, data });
    console.log(`Added action to queue for tab ${tabId}:`, { type, data });
  }

  static getNextAction(tabId) {
    console.log('🪵 ~ Socket ~ getNextAction ~ tabId:', tabId, this.actionQueueForTabs);
    if (!this.actionQueueForTabs[tabId] || this.actionQueueForTabs[tabId].length === 0) {
      return null;
    }
    return this.actionQueueForTabs[tabId].shift();
  }

  static init(server) {
    const io = require('socket.io')(server);
    Socket.io = io;
    io.on('connection', (socket) => {
      new Socket(socket);
    });
    return io;
  }
}
