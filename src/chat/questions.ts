import { IBotClient } from '../client';
import { WebAPICallResult } from '@slack/client';
import { ChannelDao, IChannel } from '../dao/channel-dao';
import { UserDao } from '../dao/user-dao';
import { ChatPostMessageArguments } from '@slack/client/dist/methods';
import { getQuestionCount, getQuestionText } from "./question-text";
import { AnswerDao } from '../dao/answer-dao';
import { getStartTime } from './standup-config';

export class Questions {
    private chatChannel: string;

    private channelDao: ChannelDao;
    private userDao: UserDao;
    private answerDao: AnswerDao;

    constructor(private bot: IBotClient, private db: Loki, private userId: string) {
        this.channelDao = new ChannelDao(db);
        this.userDao = new UserDao(db);
        this.answerDao = new AnswerDao(db);

        bot.web.im.open({user: userId}).then(im => {
            this.chatChannel = im.channel.id;
            bot.rtm.on('message', evt => this.onMessage(evt));
            this.ask();
        });
    }
    public ask(inResponse?: boolean) {
        const channelAndQuestionNum = this.getChannelAndQuestionNum();
        if (channelAndQuestionNum) {
            const {channelId, questionNum}  = channelAndQuestionNum;
            const message: ChatPostMessageArguments = {
                channel: this.chatChannel,
                text: getQuestionText(questionNum, channelId, this.channelDao)
            };
            console.log(message);
            this.bot.web.chat.postMessage(message);
        } else if (inResponse) {
            this.bot.web.chat.postMessage({
                channel: this.chatChannel,
                text: "Thank You!"
            });
        }
    }
    private onMessage(evt: WebAPICallResult) {
        if (evt.user === this.userId && evt.channel === this.chatChannel) {
            const channelAndQuestionNum = this.getChannelAndQuestionNum();
            if (channelAndQuestionNum) {
                const {channelId, questionNum}  = channelAndQuestionNum;
                this.answerDao.submitAnswer({
                    userId: this.userId,
                    channelId,
                    questionNum,
                    answer: evt.text
                });
            }
            this.ask(true);
        }
    }
    private getChannelAndQuestionNum() {
        const answers = this.answerDao.getUserAnswersAfter(getStartTime(), this.userId);
        const completedChannelIds = answers
            .filter(a => a.questionNum === getQuestionCount() - 1)
            .map(a => a.channelId);
        // Sort such that the highest question answered is first
        answers.sort((a, b) => b.questionNum - a.questionNum);
        // If a channel is currently being asked about, continue
        const next = answers
            .find(a => completedChannelIds.indexOf(a.channelId) === -1 );
        if (next) {
            return {
                channelId: next.channelId,
                questionNum: next.questionNum + 1
            };
        }
        // Otherwise find the first channel that hasn't done standup
        const nextChannel = this.getUserChannels()
            .find(c => completedChannelIds.indexOf(c.id) === -1);
        if (nextChannel) {
            return {
                channelId: nextChannel.id,
                questionNum: 0
            };
        }
        // At this point, all channels have been completed
        return null;
    }
    private getUserChannels() {
        const user = this.userDao.getOrAddUser({id: this.userId});
        if (user.channels) {
            return user.channels.filter(c => {
                return !c.disabled;
            });
        }
        return [];
    }
}