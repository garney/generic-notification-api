import shortId from 'shortid';
import fs from 'fs';
import path from 'path';

export default class Socket {
  constructor(socket) {
    this.socket = socket;
    console.log(socket.id, 'CONNECTED')
    socket.emit(`connected`, shortId.generate());
    this.setup();
  }

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
  }

  destroy = () => {
    console.log('destroy');
    this.socket.off('disconnect', this.onDisconnect);
    this.socket.off('reconnect', this.onReconnect);
    this.socket.off('roll', this.roll);
    this.socket.off('getLogs', this.getLogs);
    this.socket.off('getLogContents', this.getLogContents);
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

  static init(server) {
    const io = require('socket.io')(server);
    Socket.io = io;
    io.on('connection', (socket) => {
      new Socket(socket);
    });
    return io;
  }
}
