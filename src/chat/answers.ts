import { IBotClient } from "../client";
import { ChannelDao } from "../dao/channel-dao";
import { AnswerDao, IAnswer } from "../dao/answer-dao";
import { getQuestionText, getQuestions } from "./question-text";
import { getStartTime } from "./standup-config";
import { ChatPostMessageArguments, MessageAttachment, ChatUpdateArguments } from "@slack/client/dist/methods";

export class Answers {
    private channelDao: ChannelDao;
    private answerDao: AnswerDao;
    private enabled: boolean = true;
    private messageTs: string;
    private userIcons: Map<string, string>;

    constructor(private bot: IBotClient, private db: Loki, public channelId: string) {
        this.channelDao = new ChannelDao(db);
        this.answerDao = new AnswerDao(db);

        this.answerDao.onAnswersChange(answer => this.handleNewAnswer(answer));

        this.bot.web.users.list().then(list => {
            this.userIcons = list.members.reduce((map, user) => {
                map[user.id] = user.profile.image_32;
                return map;
            }, {});
        });
    }

    public handleNewAnswer(answer: IAnswer) {
        if (this.enabled && answer.channelId === this.channelId) {
            const message = this.getMessage();
            if (this.messageTs) {
                message.ts = this.messageTs;
                this.bot.web.chat.update(message as ChatUpdateArguments);
            } else {
                this.bot.web.chat.postMessage(this.getMessage()).then(posted => {
                    if (posted) {
                        this.messageTs = posted.ts;
                    }
                });
            }
        }
    }

    public getMessage(): ChatPostMessageArguments {
        const answers = this.answerDao.getChannelAnswersAfter(getStartTime(), this.channelId);
        const attachments =
            getQuestions(this.channelId, this.channelDao)
            .map((question, i) => {
                const answerText = answers
                    .filter(answer => answer.questionNum === i)
                    .map(answer => '<@' + answer.userId + '> ' + answer.answer)
                    .join('\n');
                const attachment: MessageAttachment = {
                    title: question,
                    text: answerText
                };
                return attachment;
            });
        return {
            channel: this.channelId,
            text: "Answers for " + (new Date()).toDateString() ,
            as_user: true,
            attachments
        };
    }

    public disable() {
        this.enabled = false;
    }

    public enable() {
        this.enabled = true;
    }
}