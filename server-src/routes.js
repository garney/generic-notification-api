import { config } from 'process';
import fs from 'fs';
import path from 'path';

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const express = require('express');
const shortId = require('shortid');
const queryParser = require('express-query-parser');
const configuration = require('../configuration');
const { Client, Collection, Events, GatewayIntentBits, Intents, Constants, EmbedBuilder } = require('discord.js');

const SOCKET_PORT = configuration.PORT;
const SOCKET_URL = process.env.SOCKET_URL || configuration.SOCKET_URL;


export default class Routes {

  static status = {

  }
  static init(app) {
    const { discordConfig } = configuration;
      
    app
      .use(
        queryParser({
          parseNull: true,
          parseBoolean: true
        })
      )
      .use(bodyParser.urlencoded({ extended: false }))
      .use(bodyParser.json())
      .use(cookieParser())
      .use(express.static(path.join(__dirname, '../public')))
      .set('views', path.join(__dirname, './views'))
      .set('view engine', 'ejs')
      .get('/', Routes.loadIndex)
      .post('/send-notification', Routes.sendNotification)
      .post('/store-data', Routes.storeData)
      .get('/get-data/:filename', Routes.getData)
      .post('/check-in', Routes.checkIn)
      .get('/get-status', Routes.getStatus)
    ;


    Routes.client.once('ready', () => {
      // console.log(`Logged in as ${Routes.client.user.tag}!`);
      
      // Get the channel and send a test message
      Routes.channel = Routes.client.channels.cache.get(discordConfig.popmartChannel);
      if (Routes.channel) {
        Routes.channel.send('Test message from bot!');
      }
    });

    Routes.client.login(discordConfig.token);
  }

  

  static logToFile(message) {
    const logDir = path.join(__dirname, '../logs');
    const date = new Date();
    const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const logFilePath = path.join(logDir, `${formattedDate}.log`);

    // Ensure log directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }

    const logMessage = `${date.toISOString()} - ${message}\n`;

    // Append the log message to the file
    fs.appendFileSync(logFilePath, logMessage, { encoding: 'utf8' });
  }


  static checkIn(req, res) {
    try {
      if (req.body.id) {
        Routes.status[req.body.id] = {
          ...req.body,
          lastCheckIn: new Date()
        }
        if(req.body.status) {
          Routes.logToFile(`${req.body.id} - ${req.body.status}`)
        }
      }
    } catch(err) {
    console.log('🤡 ~ Routes ~ checkIn ~ err:', err)

    }
    return res.json({
      success: true,
      data: Routes.status[req.body.id]
    });
  }
  static getStatus(req, res) {
    return res.json({
      success: true,
      data: Routes.status[req.body.id]
    });
  }

  static async storeData(req, res) {
    try {
      if (!req.body.data || !req.body.filename) {
        return res.status(400).json({
          success: false,
          error: 'Both data and filename are required'
        });
      }

      // Format filename: convert to kebab case and ensure .json extension
      const formattedFilename = req.body.filename
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');  // Remove leading/trailing hyphens
      const filename = formattedFilename.endsWith('.json') 
        ? formattedFilename 
        : `${formattedFilename}.json`;

      const filePath = path.join(__dirname, '../data', filename);
      
      // Ensure data directory exists
      if (!fs.existsSync(path.join(__dirname, '../data'))) {
        fs.mkdirSync(path.join(__dirname, '../data'));
      }

      fs.writeFileSync(filePath, JSON.stringify(req.body.data, null, 2));
      
      return res.json({
        success: true,
        message: 'Data stored successfully',
        filename: filename  // Return the formatted filename
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  static async getData(req, res) {
    try {
      const formattedFilename = req.params.filename
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/, '');  // Remove leading/trailing hyphens
      const filename = formattedFilename.endsWith('.json') 
        ? formattedFilename 
        : `${formattedFilename}.json`;

      const filePath = path.join(__dirname, '../data', filename);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error: 'File not found'
        });
      }

      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      return res.json({
        success: true,
        data
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  static async sendNotification(req, res) {
    try {
      if (!req.body.message) {
        return res.status(400).json({ 
          success: false, 
          error: 'Message is required' 
        });
      }
  
      if (Routes.channel) {
        await Routes.channel.send(req.body.message);
        return res.json({ success: true });
      } else {
        return res.status(500).json({ 
          success: false, 
          error: 'Discord channel not initialized' 
        });
      }
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  static loadIndex(req, res) {
    const cookies = req.cookies;
    const userId = cookies['user-cookie'] || shortId.generate();
    const userName =  req.query.name || req.query.userName || cookies['user-name'];
    res.cookie('user-cookie', userId);
    if(userName) {
      res.cookie('user-name', userName);
    }
    res.render('pages/index',
      {
        userId,
        socketPort: SOCKET_PORT,
        socketUrl: SOCKET_URL,
        userName: userName || `guest-${userId}`,
        userId
      });
  }


  

}

Routes.sessions = {};



Routes.client = new Client({ 
	partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'COMMAND'],
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.DirectMessageTyping,
	],
});

Routes.client.on("message", message => { 
  
	// console.log('🎮 ~ file: index2.js:20 ~ message', message);
    // Checks if the message says "hello"
    if (message.content === "hello") { 
  
        // Sending custom message to the channel
        message.channel.send("Hello Geeks!!"); 
    }
});
Routes.client.on("messageCreate", message => { 
  
	// console.log('🎮 ~ file: index2.js:20 ~ messageCreate', message);
    // Checks if the message says "hello"
    if (message.content === "hello") { 
  
        // Sending custom message to the channel
        message.channel.send("Hello Geeks!!"); 
    }
});
