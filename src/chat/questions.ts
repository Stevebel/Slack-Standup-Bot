import { IBotClient } from '../client';
import { WebAPICallResult } from '@slack/client';

const questionTexts = [
   "Did you work on {teamName} {lastDay}?",
   "What did you do for {teamName} {lastDay}?",
   "What will you do for {teamName} today?",
   "Do you have any concerns?"
];

export class Questions {
    private channel: string;
    private questionNum: number = 0;

    constructor(private bot: IBotClient, private userId: string) {
        this.bot = bot;
        this.userId = userId;
        bot.web.im.open({user: userId}).then(im => {
            this.channel = im.channel.id;
            bot.rtm.on('message', evt => this.onMessage(evt));
            this.ask();
        });
    }
    public ask() {
        let text = questionTexts[this.questionNum++ % questionTexts.length];
        text = text.replace('{lastDay}', this.getLastDay());
        this.bot.web.chat.postMessage({
            channel: this.channel,
            text
        });
    }
    private onMessage(evt: WebAPICallResult) {
        if (evt.user === this.userId && evt.channel === this.channel) {
            this.ask();
        }
    }

    private getLastDay() {
        if (new Date().getDay() === 1) {
            return "Friday";
        }
        return "yesterday";
    }
}