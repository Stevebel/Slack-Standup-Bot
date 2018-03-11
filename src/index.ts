import {RTMClient, WebClient} from '@slack/client';
import { connection } from './dao/database';
import { ChannelDao } from './dao/channel-dao';
import { UserDao } from './dao/user-dao';

// An access token (from your Slack app or custom integration - usually xoxb)
const token = process.env.SLACK_TOKEN;

// The client is initialized and then started to get an active connection to the platform
const rtm = new RTMClient(token);
const web = new WebClient(token);
let channelDao: ChannelDao;
let userDao: UserDao;

let myName = 'standup_bot';
const userChannels = new Map<string, string[]>();


const rtmWait = new Promise( resolve => {
    rtm.start({});
    rtm.on('ready', resolve);
  }
);

console.log("Loading...");
Promise.all([connection, rtmWait]).then( data => {
  console.log("Finished loading");
  const db = data[0];
  channelDao = new ChannelDao(db);
  userDao = new UserDao(db);
  init();
});

function init() {
  // rtm.on('slack_event', (type, evt) => console.log(type, evt));
  web.users.info({user: rtm.activeUserId}).then(user => {
    myName = user.user.name;
    web.channels.list().then( res => {
      // Take any channel for which the bot is a member
      const channels = res.channels.filter(c => c.is_member);
      channels.forEach(channel => handleAddChannel(channel));
      // Disable channels that the bot has been removed from
      channelDao.markMissingChannelsLeft(channels.map(c => c.id));
      // Remove channels that each user has left
      userChannels.forEach((channelIds, userId) => {
        userDao.removeMissingChannels(userId, channelIds);
      });

      if (channels.length === 0) {
        console.log('This bot does not belong to any channels, invite it to at least one and try again');
      }
    });
    // Bot channel changes
    rtm.on('channel_joined', evt => handleAddChannel(evt.channel) );
    rtm.on('channel_left', evt => handleChannelLeft(evt.channel) );
    // User channel changes
    rtm.on('member_joined_channel', evt => addUserToChannel(evt.user, evt.channel));
    rtm.on('member_left_channel', evt => removeUserFromChannel(evt.user, evt.channel));

  }).catch(e => console.log(e));
}

function handleAddChannel(channel) {
  const dbChannel = channelDao.addChannel(channel);
  if (!dbChannel.visited) {
    rtm.sendMessage(
      `Hello, I'm a bot that will help you with your daily stand-up.` +
      `If you would like to stop receiving messages from me please say \`@${myName} stop\`.`,
      channel.id)
    .then(msg => channelDao.markChannelVisited(channel.id))
    .catch(console.error);
  }
  channel.members
    .filter(userId => userId !== rtm.activeUserId)
    .forEach(userId => addUserToChannel(userId, channel.id));
}

function handleChannelLeft(channelId) {
  channelDao.markChannelLeft(channelId);
}

function addUserToChannel(userId, channelId) {
  const user = userDao.getOrAddUser({id: userId});
  userDao.addChannel(userId, channelId);
  // Track each user's channels at startup to determine if they left any channels since last run
  if (!userChannels.has(userId)) { userChannels.set(userId, []); }
  userChannels.get(userId).push(channelId);
}

function removeUserFromChannel(userId, channelId) {
  userDao.removeChannel(userId, channelId);
}