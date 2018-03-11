import * as loki from "lokijs";
import * as database from "./database";

export interface IUserChannel {
    id: string;
    disabled?: boolean;
    lastCompleted?: Date;
}
export interface IUser {
    id: string;
    channels?: IUserChannel[];
    name?: string;
}

export class UserDao {
    private collection: Collection<IUser>;

    constructor(private db: Loki) {
        this.schema();
    }
    public schema() {
        this.collection =
            this.db.addCollection('users', {
                unique: ['id']
            });
    }
    public getOrAddUser(input: IUser): IUser {
        let user = this.collection.by("id", input.id);
        if (user) {
            return user;
        }
        user = {
            id: input.id,
            name: input.name
        };
        return this.collection.insert(user);
    }
    public addChannel(userId: string, channelId: string) {
        this.updateUser(userId, user => {
            if (!user.channels) {
                user.channels = [];
            }
            if (!user.channels.find(c => c.id === channelId)) {
                console.log("Add", userId, channelId);
                user.channels.push({id: channelId});
            }
        });
    }
    public removeChannel(userId: string, channelId: string) {
        this.updateUser(userId, user => {
            if (user.channels) {
                user.channels = user.channels
                    .filter(c => c.id !== channelId);
            }
        });
    }
    public removeMissingChannels(userId: string, currentChannelIds: string[]) {
        this.updateUser(userId, user => {
            if (user.channels) {
                user.channels = user.channels
                    .filter(c => currentChannelIds.indexOf(c.id) >= 0);
            }
        });
    }
    public disableChannel(userId: string, channelId: string) {
        this.setChannelDisabled(userId, channelId, true);
    }
    public enableChannel(userId: string, channelId: string) {
        this.setChannelDisabled(userId, channelId, false);
    }
    public updateUser(userId: string, updateFn: (user: IUser & LokiObj) => any) {
        this.collection.findAndUpdate(
            {id: userId},
            updateFn
        );
    }
    private setChannelDisabled(userId: string, channelId: string, disabled: boolean) {
        this.updateUser(userId, user => {
            if (user.channels) {
                user.channels
                    .filter(c => c.id === channelId)
                    .forEach(c => c.disabled = disabled);
            }
        });
    }
}