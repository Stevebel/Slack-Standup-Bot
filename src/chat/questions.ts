import { IBotClient } from '../client';
import { WebAPICallResult } from '@slack/client';
import { ChannelDao, IChannel } from '../dao/channel-dao';
import { UserDao } from '../dao/user-dao';
import { ChatPostMessageArguments } from '@slack/client/dist/methods';
import { getQuestionCount, getQuestionText } from "./question-text";

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
        if (this.questionNum >= getQuestionCount()) {
            this.channelNum++;
            this.questionNum = 0;
        }
        const channels = this.getChannelsWithQuestions();
        if (channels.length > this.channelNum) {
            const channel = channels[this.channelNum];

            const message: ChatPostMessageArguments = {
                channel: this.chatChannel,
                text: getQuestionText(this.questionNum, channel.id, this.channelDao)
            };
            if (this.questionNum === 0) {
                message.attachments = [{
                    fallback: "Please respond YES or NO",
                    actions: [
                        {
                            name: "yes_or_no",
                            type: "button",
                            text: "Yes"
                        },
                        {
                            name: "yes_or_no",
                            type: "button",
                            text: "No"
                        }
                    ]
                }];
            }
            console.log(message);
            this.bot.web.chat.postMessage(message);
            this.questionNum++;
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
}