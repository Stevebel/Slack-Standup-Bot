import { ChannelDao, IChannel } from "../dao/channel-dao";

const questionTexts = [
    "Did you work on {teamName} {lastDay}?",
    "What did you do for {teamName} {lastDay}?",
    "What will you do for {teamName} today?",
    "Do you have any concerns?"
 ];

export function getQuestionCount() {
    return questionTexts.length;
}

export function getQuestionText(questionNum: number, channel: string, channelDao: ChannelDao): string {
    let text = questionTexts[questionNum];
    text = text.replace('{teamName}', getTeamName(channel, channelDao));
    text = text.replace('{lastDay}', getLastDay());
    return text;
}

function getTeamName(channel: string, channelDao: ChannelDao) {
    const channelDb = channelDao.getChannel(channel);
    if (channelDb && (channelDb.teamName || channelDb.name)) {
        return channelDb.teamName || channelDb.name;
    }
    return "your project";
}
function getLastDay() {
    if (new Date().getDay() === 1) {
        return "Friday";
    }
    return "yesterday";
}