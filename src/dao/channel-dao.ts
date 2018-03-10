import * as loki from 'lokijs';
import * as database from './database';

export class ChannelDao{
    private collection:Collection<any>;

    constructor(private db:Loki){
        this.schema();
    }
    schema(){
        this.collection = 
            this.db.addCollection('channels', {
                unique: ['id']
            });
    }
    addChannel(id, name){
        let channel = this.collection.by("id", id);
        if(channel){
            channel.left = false;
            return channel;
        }
        channel = { id, name };
        channel = this.collection.insert(channel);
        console.log("New Channel", id)

        return channel;
    }
    markChannelVisited(id){
        let channel = this.collection.by("id", id);
        if(channel){
            channel.visited = true;
            channel = this.collection.update(channel);
            return channel;
        }

        return null;
    }
    markChannelLeft(id){
        let channel = this.collection.by("id", id);
        if(channel){
            channel.visited = false;
            channel.left = true;
            channel = this.collection.update(channel);
            return channel;
        }

        return null;
    }
    markMissingChannelsLeft(ids){
        this.collection.findAndUpdate({
            id: {$nin: ids}
        }, (channel) => {
            channel.visited = false;
            channel.left = true;
            return channel;
        });
    }
}