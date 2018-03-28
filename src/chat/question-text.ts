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

export function getQuestions(channel: string, channelDao: ChannelDao) {
    return interpolateText(questionTexts, channel, channelDao);
}

export function getQuestionText(questionNum: number, channel: string, channelDao: ChannelDao): string {
    const text = questionTexts[questionNum];
    return interpolateText([text], channel, channelDao)[0];
}

function interpolateText(text: string[], channel: string, channelDao: ChannelDao){
    const teamName = getTeamName(channel, channelDao);
    const lastDay = getLastDay();

    return text.map(line =>
        line.replace('{teamName}', getTeamName(channel, channelDao))
            .replace('{lastDay}', getLastDay())
    );
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