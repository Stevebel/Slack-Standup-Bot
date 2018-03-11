import { getClient, IBotClient } from './client';
import { connection } from './dao/database';
import { ChannelDao } from './dao/channel-dao';
import { UserDao } from './dao/user-dao';

let bot: IBotClient;
let channelDao: ChannelDao;
let userDao: UserDao;
const userChannels = new Map<string, string[]>();

console.log("Loading...");
Promise.all([connection, getClient]).then( data => {
  console.log("Got connection");
  const db = data[0];
  bot = data[1];
  channelDao = new ChannelDao(db);
  userDao = new UserDao(db);
  init();
});

function init() {
  console.log("Updating knowledge...");
  // rtm.on('slack_event', (type, evt) => console.log(type, evt));
  bot.web.channels.list().then( res => {
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
    console.log("Finished loading");
  });
  // Bot channel changes
  bot.rtm.on('channel_joined', evt => handleAddChannel(evt.channel) );
  bot.rtm.on('channel_left', evt => handleChannelLeft(evt.channel) );
  // User channel changes
  bot.rtm.on('member_joined_channel', evt => addUserToChannel(evt.user, evt.channel));
  bot.rtm.on('member_left_channel', evt => removeUserFromChannel(evt.user, evt.channel));
}

function handleAddChannel(channel) {
  const dbChannel = channelDao.addChannel(channel);
  if (!dbChannel.visited) {
    bot.rtm.sendMessage(
      `Hello, I'm a bot that will help you with your daily stand-up.` +
      `If you would like to stop receiving messages from me please say \`@${bot.name} stop\`.`,
      channel.id)
    .then(msg => channelDao.markChannelVisited(channel.id))
    .catch(console.error);
  }
  channel.members
    .filter(userId => userId !== bot.userId)
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