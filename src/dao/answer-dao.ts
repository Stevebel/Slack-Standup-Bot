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
                indices: ['userId', 'channelId', 'submitDate']
            });
    }
    public submitAnswer(answer: IAnswerInput) {
        if (!answer.submitDate) {
            answer.submitDate = new Date();
        }
        this.collection.insert(answer as IAnswer);
    }
    public getAnswersAfter(date: Date, userId?: string, channelId?: string) {
        const userIdQuery = userId ? { $eq: userId} : undefined;
        const channelIdQuery = channelId ? { $eq: channelId} : undefined;
        return this.collection.find({
            submitDate: {
                $jgte: date
            },
            userId: userIdQuery,
            channelId: channelIdQuery
        });
    }
}