const loki = require('lokijs');

let db = new loki(); // Hint to editor that this will be a loki db
require('./database').then(connection => {
    db = connection;
    ChannelDao.schema();
});

let collection = db.getCollection();
const ChannelDao = {
    schema: function(){
        collection = ChannelDao.collection = 
            db.addCollection('channels', {
                unique: ['id']
            });
    },
    addChannel: function(id, name){
        let channel = collection.by("id", id);
        if(channel){
            channel.left = false;
            return channel;
        }
        channel = { id, name };
        channel = collection.insert(channel);
        console.log("New Channel", id)

        return channel;
    },
    markChannelVisited: function(id){
        let channel = collection.by("id", id);
        if(channel){
            channel.visited = true;
            channel = collection.update(channel);
            return channel;
        }

        return null;
    },
    markChannelLeft: function(id){
        let channel = collection.by("id", id);
        if(channel){
            channel.visited = false;
            channel.left = true;
            channel = collection.update(channel);
            return channel;
        }

        return null;
    },
    markMissingChannelsLeft: function(ids){
        collection.findAndUpdate({
            id: {$nin: ids}
        }, (channel) => {
            channel.visited = false;
            channel.left = true;
            return channel;
        });
    }
}

module.exports = ChannelDao;