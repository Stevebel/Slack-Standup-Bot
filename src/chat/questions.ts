import { IBotClient } from '../client';
import { WebAPICallResult } from '@slack/client';
import { ChannelDao, IChannel } from '../dao/channel-dao';
import { UserDao } from '../dao/user-dao';

const questionTexts = [
   "Did you work on {teamName} {lastDay}?",
   "What did you do for {teamName} {lastDay}?",
   "What will you do for {teamName} today?",
   "Do you have any concerns?"
];

export class Questions {
    private chatChannel: string;
    private questionNum: number = 0;
    private channelNum: number = 0;

    private channelDao: ChannelDao;
    private userDao: UserDao;

    constructor(private bot: IBotClient, private db: Loki, private userId: string) {
        this.channelDao = new ChannelDao(db);
        this.userDao = new UserDao(db);

        bot.web.im.open({user: userId}).then(im => {
            this.chatChannel = im.channel.id;
            bot.rtm.on('message', evt => this.onMessage(evt));
            this.ask();
        });
    }
    public ask() {
        if (this.questionNum >= questionTexts.length) {
            this.channelNum++;
            this.questionNum = 0;
        }
        const channels = this.getChannelsWithQuestions();
        if (channels.length > this.channelNum) {
            const channel = channels[this.channelNum];

            let text = questionTexts[this.questionNum++ % questionTexts.length];
            text = text.replace('{teamName}', this.getTeamName(channel));
            text = text.replace('{lastDay}', this.getLastDay());
            this.bot.web.chat.postMessage({
                channel: this.chatChannel,
                text
            });
        }
    }
    private getChannelsWithQuestions() {
        const user = this.userDao.getOrAddUser({id: this.userId});
        if (user.channels) {
            return user.channels.filter(c => {
                return !c.disabled;
            });
        }
        return [];
    }
    private onMessage(evt: WebAPICallResult) {
        if (evt.user === this.userId && evt.channel === this.chatChannel) {
            this.ask();
        }
    }
    private getTeamName(channel: IChannel) {
        const channelDb = this.channelDao.getChannel(channel.id);
        if (channelDb && (channelDb.teamName || channelDb.name)) {
            return channelDb.teamName || channelDb.name;
        }
        return "your project";
    }
    private getLastDay() {
        if (new Date().getDay() === 1) {
            return "Friday";
        }
        return "yesterday";
    }
}