import * as loki from 'lokijs';
import * as database from './database';

export interface IChannel {
    id: string;
    name?: string;
    visited?: boolean;
    left?: boolean;
}

export class ChannelDao {
    private collection: Collection<IChannel>;

    constructor(private db: Loki) {
        this.schema();
    }
    public schema() {
        this.collection =
            this.db.addCollection('channels', {
                unique: ['id']
            });
    }
    public addChannel(input: IChannel) {
        let channel = this.collection.by("id", input.id);
        if (channel) {
            channel.left = false;
            return channel;
        }
        channel = { id: input.id, name: input.name, visited: false };
        channel = this.collection.insert(channel);

        return channel;
    }
    public markChannelVisited(id: string) {
        let channel = this.collection.by("id", id);
        if (channel) {
            channel.visited = true;
            channel = this.collection.update(channel);
            return channel;
        }

        return null;
    }
    public markChannelLeft(id: string) {
        let channel = this.collection.by("id", id);
        if (channel) {
            channel.visited = false;
            channel.left = true;
            channel = this.collection.update(channel);
            return channel;
        }

        return null;
    }
    public markMissingChannelsLeft(ids: string[]) {
        this.collection.findAndUpdate({
            id: {$nin: ids}
        }, channel => {
            channel.visited = false;
            channel.left = true;
            return channel;
        });
    }
}