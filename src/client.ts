import {RTMClient, WebClient} from '@slack/client';

export interface IBotClient {
    userId: string;
    name: string;
    rtm: RTMClient;
    web: WebClient;
}

export const getClient = new Promise<IBotClient>((resolve, reject) => {
    // An access token (from your Slack app or custom integration - usually xoxb)
    const token = process.env.SLACK_TOKEN;

    // The client is initialized and then started to get an active connection to the platform
    const rtm = new RTMClient(token);
    const web = new WebClient(token);

    rtm.start({});
    rtm.on('ready', () => {
        web.users.info({user: rtm.activeUserId}).then(user => {

            resolve({
                userId: rtm.activeUserId,
                name: user.user.name,
                rtm,
                web
            });

        }).catch(console.error);
    });
});