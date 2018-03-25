import * as loki from "lokijs";
import * as database from "./database";

export interface IAnswerInput {
    userId: string;
    channelId: string;
    questionNum: number;
    answer: string;
    submitDate?: Date;
}
export interface IAnswer {
    userId: string;
    channelId: string;
    questionNum?: number;
    answer?: string;
    submitDate: Date;
}

export class AnswerDao {
    private collection: Collection<IAnswer>;

    constructor(private db: Loki) {
        this.schema();
    }
    public schema() {
        this.collection =
            this.db.addCollection('answers', {
                indices: ['userId', 'channelId', 'submitDate'],
            });
        this.collection.removeDataOnly();
    }
    public onAnswersChange(callback) {
        this.collection.on('insert', callback);
    }
    public submitAnswer(answer: IAnswerInput) {
        if (!answer.submitDate) {
            answer.submitDate = new Date();
        }
        this.collection.insert(answer as IAnswer);
    }
    public getUserAnswersAfter(date: Date, userId: string) {
        return this.collection.find({
            submitDate: {
                $jgte: date
            },
            userId: { $eq: userId }
        });
    }
    public getChannelAnswersAfter(date: Date, channelId: string) {
        return this.collection.find({
            submitDate: {
                $jgte: date
            },
            channelId: { $eq: channelId }
        });
    }
}