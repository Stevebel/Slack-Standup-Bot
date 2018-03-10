const { RTMClient, WebClient } = require('@slack/client');
const database = require('./dao/database');
const ChannelDao = require('./dao/channel-dao');

// An access token (from your Slack app or custom integration - usually xoxb)
const token = process.env.SLACK_TOKEN;

// The client is initialized and then started to get an active connection to the platform
const rtm = new RTMClient(token);
const web = new WebClient(token);
let dbConn;
let myName = 'standup_bot';


let rtmWait = new Promise(resolve => {
    rtm.start();
    rtm.on('ready', resolve);
  }
);

console.log("Loading...");
Promise.all([database, rtmWait]).then( (data) => {
  console.log("Finished loading");
  dbConn = data[0];
  init();
})
function init(){
  //rtm.on('slack_event', (type, evt) => console.log(type,evt));
  web.users.info({user: rtm.activeUserId}).then(user => {
    myName = user.user.name;
    web.channels.list().then( res => {
      // Take any channel for which the bot is a member
      const channels = res.channels.filter(c => c.is_member);
      channels.forEach(channel => handleChannel(channel));
      ChannelDao.markMissingChannelsLeft(channels.map(c => c.id));

      if(channels.length === 0) {
        console.log('This bot does not belong to any channels, invite it to at least one and try again');
      }
    });
    rtm.on('channel_joined', evt => handleChannel(evt.channel) );
    rtm.on('channel_left', evt => handleChannelLeft(evt.channel) );
  }).catch(e => console.log(e));
}

function handleChannel(channel){
  let dbChannel = ChannelDao.addChannel(channel.id, channel.name);
  if(!dbChannel.visited){
    rtm.sendMessage(
      `Hello, I'm a bot that will help you with your daily stand-up.` + 
      `If you would like to stop receiving messages from me please say \`@${myName} stop\`.`, 
      channel.id)
    .then((msg) => ChannelDao.markChannelVisited(channel.id))
    .catch(console.error);
  }
}
function handleChannelLeft(channelId){
  ChannelDao.markChannelLeft(channelId);
}
