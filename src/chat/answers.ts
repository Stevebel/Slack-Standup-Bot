import { IBotClient } from "../client";
import { ChannelDao } from "../dao/channel-dao";
import { AnswerDao, IAnswer } from "../dao/answer-dao";
import { getQuestionText } from "./question-text";

export class Answers {
    private channelDao: ChannelDao;
    private answerDao: AnswerDao;
    private enabled: boolean = true;

    constructor(private bot: IBotClient, private db: Loki, public channelId: string) {
        this.channelDao = new ChannelDao(db);
        this.answerDao = new AnswerDao(db);

        this.answerDao.onAnswersChange(answer => this.handleNewAnswer(answer));
        console.log(channelId);
    }

    public handleNewAnswer(answer: IAnswer) {
        if (this.enabled && answer.channelId === this.channelId) {
            console.log(answer);
            const question = getQuestionText(answer.questionNum, this.channelId, this.channelDao);
            this.bot.web.chat.postMessage({
                channel: this.channelId,
                text: question + ': ' + answer.answer
            });
        }
    }

    public disable() {
        this.enabled = false;
    }

    public enable() {
        this.enabled = true;
    }
}