import { config } from 'process';

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const express = require('express');
const shortId = require('shortid');
const queryParser = require('express-query-parser');
const configuration = require('../configuration');
const { Client, Collection, Events, GatewayIntentBits, Intents, Constants, EmbedBuilder } = require('discord.js');

const SOCKET_PORT = configuration.PORT;
const SOCKET_URL = process.env.SOCKET_URL || configuration.SOCKET_URL;


export default class Routes {
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
    ;

    Routes.client.once('ready', () => {
      console.log(`Logged in as ${Routes.client.user.tag}!`);
      
      // Get the channel and send a test message
      Routes.channel = Routes.client.channels.cache.get(discordConfig.popmartChannel);
      if (Routes.channel) {
        Routes.channel.send('Test message from bot!');
      }
    });

    Routes.client.login(discordConfig.token);
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
