import { Awaitable, CommandInteraction, GuildMember, Intents, Message, MessageEmbed, Role, User } from 'discord.js';
import ytdl from "ytdl-core";
import got, { setNonEnumerableProperties } from 'got';
import { Client, Discord, Slash, resolveIGuild, SlashOption, Guard, Guild, SlashChoice, SlashGroup, GuardFunction, ArgsOf, On } from 'discordx';
import { joinVoiceChannel, VoiceConnection } from '@discordjs/voice';
const YouTube = require("youtube-node");
const jsdom = require("jsdom");
import auth from './auth.json';
const cron = require('node-cron')
const { JSDOM } = jsdom;
const url = 'http://www.holidayscalendar.com';
// const url = 'https://www.checkiday.com';
let youtube = new YouTube();
youtube.setKey(auth.googleKey);

const bot = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });
const musicQueue = new Map();
let crons: { [id: string]: typeof cron } = {}
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
let stupid_not_working_emojis = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯', '🇰', '🇱', '🇲', '🇳', '🇴', '🇵', '🇶', '🇷', '🇸', '🇹', '🇺', '🇻', '🇼', '🇽', '🇾', '🇿']

export const NotBot: GuardFunction<ArgsOf<"messageCreate">> = async (
    [message],
    client,
    next
) => {
    if (client.user?.id !== message.author.id) {
        await next();
    }
};

// embed example:
// const exampleEmbed = new Discord.MessageEmbed()
// 	.setColor('#0099ff')
// 	.setTitle('Some title')
// 	.setURL('https://discord.js.org/')
// 	.setAuthor('Some name', 'https://i.imgur.com/wSTFkRM.png', 'https://discord.js.org')
// 	.setDescription('Some description here')
// 	.setThumbnail('https://i.imgur.com/wSTFkRM.png')
// 	.addFields(
// 		{ name: 'Regular field title', value: 'Some value here' },
// 		{ name: '\u200B', value: '\u200B' },
// 		{ name: 'Inline field title', value: 'Some value here', inline: true },
// 		{ name: 'Inline field title', value: 'Some value here', inline: true },
// 	)
// 	.addField('Inline field title', 'Some value here', true)
// 	.setImage('https://i.imgur.com/wSTFkRM.png')
// 	.setTimestamp()
// 	.setFooter('Some footer text here', 'https://i.imgur.com/wSTFkRM.png');

// const musicHandle = {
//     execute: async function (message: Discord.Message, serverQueue: any) {

//         const voiceChannel = message.member?.voice.channel;
//         if (!voiceChannel)
//             return message.channel.send("You need to be in a voice channel to play music");
//         const permissions = voiceChannel.permissionsFor(message.client.user!);
//         if (!permissions?.has("CONNECT") || !permissions?.has("SPEAK")) {
//             return message.channel.send("I need the permissions to join and speak in your voice channel");
//         }

//         // works on youtube
//         let args = message.content.split(" ");
//         args.splice(0, 1);
//         let query = args.join(" ");
//         let result = "";
//         if (query.indexOf("youtube.com/") === -1) {
//             let search = new Promise<string>(
//                 (resolve, reject) => {
//                     youtube.search(query, 2, function(error: any, result: any) {
//                         if (error) { reject(error); }
//                         resolve(result.items[0].id.videoId);
//                     })
//                 }
//             );
//             result = await search;
//             query = "https://youtube.com/watch?v=".concat(result);
//         }

//         let songInfo = await ytdl.getInfo(query);
//         const song = {
//             title: songInfo.videoDetails.title,
//             url: songInfo.videoDetails.video_url
//         };

//         if (!serverQueue) {
//             const queueConstruct: {
//                 textChannel: Discord.TextBasedChannels,
//                 voiceChannel: Discord.VoiceChannel | Discord.StageChannel,
//                 connection: VoiceConnection | null,
//                 songs: Array<{title: string, url: string}>,
//                 volume: number,
//                 playing: boolean
//             } = {
//                 textChannel: message.channel,
//                 voiceChannel: voiceChannel,
//                 connection: null,
//                 songs: [],
//                 volume: 5,
//                 playing: true
//             };

//             musicQueue.set(message.guild?.id, queueConstruct);

//             queueConstruct.songs.push(song);
//             queueConstruct.connection = joinVoiceChannel({
//                 channelId: voiceChannel.id,
//                 guildId: voiceChannel.guild.id,
//                 adapterCreator: null
//             })

//             try {
//                 musicHandle.play(message.guild, queueConstruct.songs[0]);
//             } catch (err: any) {
//                 console.log(err);
//                 musicQueue.delete(message.guild?.id);
//                 return message.channel.send(err);
//             }
//         } else {
//             serverQueue.songs.push(song);
//             return message.channel.send(`${song.title} has been added to the queue`);
//         }
//     },

//     skip: function (message: Discord.Message, serverQueue: any) {
//         if (!message.member?.voice.channel)
//             return message.channel.send(
//                 "You have to be in a voice channel to stop the music"
//             );
//         if (!serverQueue)
//             return message.channel.send("There is no song that I could skip");
//         serverQueue.connection.dispatcher.end();
//     },

//     stop: function (message: Discord.Message, serverQueue: any) {
//         if (!message.member?.voice.channel)
//             return message.channel.send(
//                 "You have to be in a voice channel to stop the music"
//             );

//         if (!serverQueue)
//             return message.channel.send("There is no song that I could stop");

//         serverQueue.songs = [];
//         serverQueue.connection.dispatcher.end();
//     },

//     play: function (guild: Discord.Guild | null, song: {title: string, url: string}) {
//         const serverQueue = musicQueue.get(guild?.id);
//         if (!song) {
//             serverQueue.voiceChannel.leave();
//             musicQueue.delete(guild?.id);
//             return;
//         }

//         const dispatcher = serverQueue.connection
//             .play(ytdl(song.url))
//             .on("finish", () => {
//                 serverQueue.songs.shift();
//                 musicHandle.play(guild, serverQueue.songs[0]);
//             })
//             .on("error", (error: any) => console.error(error));
//         dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
//         serverQueue.textChannel.send(`Started playing: **${song.title}**`);
//     }
// };

// slash commands

@Discord()
abstract class TheCircleBot {
    @Slash('help')
    private help(interaction: CommandInteraction) {
        const embedHelp = new MessageEmbed()
            .setTitle('Help')
            .setDescription('Cześć wszystkim! Jestem TheCircleBot, nasz kółeczkowy bot. Na razie posiadam takie komendy (dostępne po znaku \'!\'):')
            .addFields(
                { name: 'help', value: 'Shows this embed message' },
                { name: 'ping', value: 'Ping bot' },
                { name: 'roll', value: 'Rolls dices: arguments should be structured like this: 2d10+3' },
                { name: 'poll', value: 'Creates a poll with up to 26 answers: arguments should be structured like this: \'Question\' \'Answer A\' \'Answer B\'' },
                { name: 'holidays', value: "Shows today's international and weird holidays"},
                { name: 'book', value: 'Sends the link to the ebook'},
                { name: 'cron', value: 'set up or remove a scheduled message, example:\ncron start test 0 0 */14 * * This message will appear every 14 days'},
                { name: 'play', value: 'Play a given video from YouTube. You can type in a link or its name'},
                { name: 'skip', value: 'Skips to next song in queue'},
                { name: 'queue', value: 'Lists all songs added to the queue'},
                { name: 'stop', value: 'Stop playing music and leave the voice channel'}
            )
        interaction.reply({ embeds: [embedHelp] })
    }

    @Slash('ping')
    private ping(interaction: CommandInteraction) {
        interaction.reply("Pong!")
    }

    @Slash("whois")
    private whois(
        @SlashOption("x", { type: "MENTIONABLE", required: true }) mentionable: GuildMember | User | Role,
        interaction: CommandInteraction
    ) {
        interaction.reply(mentionable.id);
    }

    @Slash('roll')
    private roll(
        @SlashOption("sides", { description: "amount of sides on these dices", type: "INTEGER", required: true }) die_sides: number,
        @SlashOption("amount", { description: "amount of dices", type: "INTEGER" }) die_amount: number,
        @SlashOption("offset", { description: "amount to add to the result", type: "INTEGER" }) die_offset: number,
        interaction: CommandInteraction
    ) {
        if (die_amount === undefined || die_amount <= 0)
            die_amount = 1
        if (die_offset === undefined)
            die_offset = 0
        var results: string = ''
        for (var i = 0; i < die_amount; ++i) {
            results = results + (Math.floor((Math.random() * die_sides)) + 1 + die_offset).toString() + ' ';
        }
        interaction.reply(results)
    }

    @Slash('event')
    private async event(
        @SlashOption("name", { description: "name of the message", type: "STRING", required: true }) name: string,
        interaction: CommandInteraction
    ) {
        const embedEvent = new MessageEmbed()
            .setTitle(name)
            .setDescription("🟢 - tak\n🟡 - może\n🔴 - nie")
        const message = await interaction.reply({ embeds: [embedEvent], fetchReply: true })
        if (!(message instanceof Message))
            throw TypeError
        message.react("🟢")
        message.react("🟡")
        message.react("🔴")
    }

    @Slash('poll')
    private async poll(
        @SlashOption("args", { description: "poll options", type: "STRING", required: true }) args: string,
        interaction: CommandInteraction
    ) {
        const options = args.split('\'').filter((i: string) => i !== ' ').filter((i: string) => i);
        var result = '';
        for (var i = 1; i < options.length; ++i) {
            result = result + stupid_not_working_emojis[i - 1] + ' ' + options[i] + '\n';
        }
        const embedPoll = new MessageEmbed()
            .setTitle(options[0])
            .setDescription(result)

        const message = await interaction.reply({ embeds: [embedPoll], fetchReply: true })
        if (!(message instanceof Message))
            throw TypeError
        for (var i = 1; i < options.length; ++i) {
            message.react(stupid_not_working_emojis[i - 1])
        }
    }

    @Slash('holidays')
    private async holidays(interaction: CommandInteraction) {
        async function getHolidaysWrapper(url: string) {
            async function getHolidays(url: string) {
                try {
                    const response = await got(url);
                    const dom = new JSDOM(response.body);
                    return dom.window.document.querySelector('table').textContent;
                } catch (error: any) {
                    console.log(error.response.body);
                }
            }

            return await getHolidays(url).then(result => {
                let text = result;
                text = text.split('    ').join('');
                text = text.split('\n');
                text = text.filter(function (elmnt: string) { return elmnt !== ''; });
                text.shift(); text.shift(); text.shift();
                let text_size = text.length / 3;
                let final_result = []
                for (var i = 0; i < text_size; i++) {
                    if (text[3*i+2] === 'Weird' || text[3*i+2] === 'Multiple Types') {
                        final_result.push(text[3*i])
                    }
                }
                text = final_result;
                return text;
            })
        }

        const holidays = await getHolidaysWrapper(url);
        let date = new Date().toISOString().slice(0, 10).split('-');
        const embedHolidays = new MessageEmbed()
            .setTitle("Today's Holidays:")
            .setDescription(date[2]+' '+months[parseInt(date[1])-1]+' '+date[0])
        holidays.forEach((entry: string) => {
            embedHolidays.addField(entry, '\u200b');
        });
        interaction.reply({ embeds: [embedHolidays] })
    }

    @Guild(auth.serverID)
    @Slash('book')
    private book(interaction: CommandInteraction) {
        interaction.reply("Link to Hacking 101: "+auth.hacking101+"\nLink to O'Reilly: "+auth.oreilly)
    }

    @Guild(auth.serverID)
    // @Slash('nick')
    private nick(
        @SlashChoice(auth.memberIDs)
        @SlashOption("name", { description: "name of a member", required: true }) memberID: number,
        interaction: CommandInteraction
    ) {
        if (!bot.guilds.cache.get(auth.serverID)?.me?.permissions.has('MANAGE_NICKNAMES'))
            interaction.reply('I don\'t have permission to change your nickname!');
        else {
            bot.guilds.cache.get(auth.serverID)?.members.fetch().then(member => console.log(member.toJSON()));

            // console.log(memberID);
            // console.log("");
            // console.log(message.guild.members.resolve(String(memberID)));
            // console.log("");
            // const list = message.client.guilds.cache.get(auth.serverID);
            // list.members.cache.forEach(member => console.log(member.user.username));
            // message.guild.fetchAllMembers

            // for (const guild of client.guilds.cache)
            //     for (const user of await guild.members.fetch())
            //         console.log(user);
            //         // user.send('message').catch(() => console.log('User had DMs disabled'));

            // message.guild.members.fetch(String(memberID)).setNickname(args[0]);
            // let rMember = message.guild.member(await message.guild.members.fetch(memberID));
            // console.log(rMember);
            // await rMember.setNickname(args[0]);
            // let guildMember = message.guild.members.fetch(String(memberID));
            // console.log((await guildMember).setNickname(args[0]));
            // await message.guild.members.fetch(String(memberID)).setNickname(args[0]);
            // await message.guild.members.fetch(String(memberID)).then(member => { member.setNickname(args[0]).catch(error => message.channel.send("ok"));}).catch(error => message.channel.send('fetch error'));
            // message.guild.members.fetch().then(member => {
            //     console.log(member.user.id)
            //     if (member.user.id === (memberID)) {
            //         console.log(member.user.id)
            //         member.setNickname(args[0])
            //     }
            // })
        }
    }

    @On('messageCreate')
    @Guard(NotBot)
    private onMessage(
        [message]: ArgsOf<"messageCreate">
    ) {
        if (message.content.substring(0, 4) === 'Cześć') {
            let args = message.content.substring(4).split(' ');
            message.channel.send('Cześć '+args.join(' ')+'!')
        }
        if (message.content.includes('awaj admina')) {
            message.channel.send('Nie')
        }
        if (message.content.substring(1, 7) === 'estem ') {
            let args = message.content.substring(7).split(' ');
            if (args[0].substring(1, 7) === "sawery" || args[0].substring(1, 5) === "dmin")
                if (parseInt(message.author.id) !== auth.memberIDs["Ksawery"])
                    message.channel.send('Witaj... Wait a minute, you are not Ksawery. You are not Ksawery at all!')
                else
                    message.channel.send('Witaj Ksawery :smiley:')
            else
                message.channel.send('Witaj '+args.join(' ')+'! Ja jestem TheCircleBot :grin:!')
        }
        if (message.content.substring(1, 8) === 'ie zdam') {
            message.channel.send('Oj tam, nie martw się, będzie dobrze :blush:')
        }
        if (message.content.substring(1, 4) === 'dam') {
            message.channel.send('Dokładnie :smiley:');
        };
        if (message.content.includes('🐙')) {
            message.channel.send('🐙')
        }
        if (message.content.includes('hlep')) {
            message.channel.send('🍞')
        }
    }
}

@Discord()
@SlashGroup("cron", "cron commands group")
abstract class CronGroup {

    @Slash('start')
    private start(
        @SlashOption("name", { description: "name of cron job", type: "STRING", required: true }) name: string,
        @SlashOption("message", { description: "message to send while schedule appears", type: "STRING", required: true  }) message: string,
        @SlashOption("minute", { description: "cron minute argument", type: "STRING", required: true }) minute: string,
        @SlashOption("hour", { description: "cron hour argument", type: "STRING", required: true }) hour: string,
        @SlashOption("day", { description: "cron day argument", type: "STRING", required: true }) day_of_the_month: string,
        @SlashOption("month", { description: "cron month argument", type: "STRING", required: true }) month: string,
        @SlashOption("week", { description: "cron day of the week argument", type: "STRING", required: true }) day_of_the_week: string,
        interaction: CommandInteraction
    ) {
        let cron_arg = minute + ' ' + hour + ' ' + day_of_the_month + ' ' + month + ' ' + day_of_the_week;
        crons[name] = cron.schedule(cron_arg, () => {
            interaction.channel?.send({ embeds: [new MessageEmbed().setTitle(message)] })
        }, {
            timezone: 'Europe/Warsaw',
            scheduled: false
        });
        crons[name].start();
        interaction.reply("Added new "+message+" cron")
    }
    
    @Slash('kill')
    private kill(
        @SlashOption("name", { description: "name of cron job", type: "STRING", required: true }) name: string,
        interaction: CommandInteraction
    ) {
        if (!(name in crons)) { // does this check the keys or values?
            interaction.reply('No such job as \"'+name+'\"!')
        }
        else {
            crons[name].stop();
            delete(crons[name]);
            interaction.reply("Deleted cron: "+name)
        }
    }
}

// the great switch

bot.on('messageCreate', async (message: Message): Promise<void> => {
    let args: string[];

    if (message.content.substring(0, 1) === '!') {
        args = message.content.substring(1).split(' ');
        const cmd = args[0];

        const serverQueue = musicQueue.get(message.guild?.id);

        args = args.splice(1);
        switch(cmd) {
            // case 'play': {
            //     await musicHandle.execute(message, serverQueue);
            //     break;
            // }
            // case 'skip': {
            //     musicHandle.skip(message, serverQueue);
            //     break;
            // }
            // case 'stop': {
            //     musicHandle.stop(message, serverQueue);
            //     break;
            // }
            // case 'queue':
            //     const embedQueue = new MessageEmbed()
            //         .setTitle('Queue')
            //         .setDescription(serverQueue.songs)
            //     await message.channel.send({ embeds: [embedQueue] })
            //     break;
        }
    }
});

bot.once('ready', async () => {
    await bot.initApplicationCommands();
    await bot.initApplicationPermissions();
    console.log('bot is online');
    bot.user?.setStatus('online');
    bot.user?.setActivity({ name: '!help', type: 'WATCHING' });
});

bot.on("interactionCreate", (interaction) => {
    bot.executeInteraction(interaction);
});

bot.once('reconnecting', () => {
    console.log('reconnecting...');
});

bot.once('disconnect', () => {
    console.log('disconnected');
    bot.user?.setStatus('dnd');
});

bot.login(auth.token);
