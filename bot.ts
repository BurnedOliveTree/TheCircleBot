import { Awaitable, CommandInteraction, Intents, Message, MessageEmbed } from 'discord.js';
import ytdl from "ytdl-core";
import got from 'got';
import { Client, Discord, Slash, resolveIGuild, SlashOption } from 'discordx';
import { joinVoiceChannel, VoiceConnection } from '@discordjs/voice';
const YouTube = require("youtube-node");
const jsdom = require("jsdom");
const auth = require('./auth.json');
const cron = require('node-cron')
const { JSDOM } = jsdom;
const url = 'http://www.holidayscalendar.com';
// const url = 'https://www.checkiday.com';
let youtube = new YouTube();
youtube.setKey(auth.googleKey);

const bot = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const musicQueue = new Map();
let crons: { [id: string]: typeof cron } = {}
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
var interval;
let stupid_not_working_emojis = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯', '🇰', '🇱', '🇲', '🇳', '🇴', '🇵', '🇶', '🇷', '🇸', '🇹', '🇺', '🇻', '🇼', '🇽', '🇾', '🇿']

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
//
// channel.send(exampleEmbed);

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

async function getHolidays(url: string) {
    try {
        const response = await got(url);
        const dom = new JSDOM(response.body);
        return dom.window.document.querySelector('table').textContent;
    } catch (error: any) {
        console.log(error.response.body);
    }
}

async function getHolidaysWrapper(url: string) {
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

    @Slash('roll')
    private roll(
        @SlashOption("sides", { description: "amount of sides on these dices", type: "INTEGER", required: true }) die_sides: number,
        @SlashOption("amount", { description: "amount of dices", type: "INTEGER" }) die_amount: number,
        @SlashOption("offset", { description: "amount to add to the result", type: "INTEGER" }) die_offset: number,
        interaction: CommandInteraction
    ) {
        if (die_amount === null)
            die_amount = 1
        var results: string = ''
        for (var i = 0; i < die_amount; ++i) {
            results = results + (Math.floor((Math.random() * die_sides)) + 1 + die_offset).toString() + ' ';
        }
        interaction.reply(results)
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
            case 'event':
                if (args.length > 0) {
                    const embedEvent = new MessageEmbed()
                        .setTitle(args.join(' '))
                        .setDescription("🟢 - tak\n🟡 - może\n🔴 - nie")
                    await message.channel.send({ embeds: [embedEvent] }).then(sent => {
                        sent.react("🟢")
                        sent.react("🟡")
                        sent.react("🔴")
                    })
                }
                break;
            case 'poll':
                if (args.length > 0) {
                    const options = args.join(' ').split('\'').filter(i => i !== ' ').filter(i => i);
                    let result = '';
                    let i;
                    for (i = 1; i < options.length; ++i) {
                        result = result + stupid_not_working_emojis[i - 1] + ' ' + options[i] + '\n';
                    }
                    const embedPoll = new MessageEmbed()
                        .setTitle(options[0])
                        .setDescription(result)
                    await message.channel.send({ embeds: [embedPoll] }).then(sent => {
                        let i;
                        for (i = 1; i < options.length; ++i) {
                            sent.react(stupid_not_working_emojis[i - 1])
                        }
                    })
                }
                break;
            case 'holidays': {
                const holidays = await getHolidaysWrapper(url);
                let date = new Date().toISOString().slice(0, 10).split('-');
                const embedHolidays = new MessageEmbed()
                    .setTitle("Today's Holidays:")
                    .setDescription(date[2]+' '+months[parseInt(date[1])-1]+' '+date[0])
                holidays.forEach((entry: string) => {
                    embedHolidays.addField(entry, '\u200b');
                });
                await message.channel.send({ embeds: [embedHolidays] })
                break;
            }
            case 'nick':
                if (!message.guild?.me?.permissions.has('MANAGE_NICKNAMES'))
                    await message.channel.send('I don\'t have permission to change your nickname!');
                if (args.length === 2) {
                    let userID;
                    switch (args[1]) {
                        // case 'Karolina':
                        //     userID = 0;
                        //     break;
                        case 'Ksawery':
                            userID = auth.ksaweryID;
                            break;
                        case 'Kuba':
                            userID = auth.kubaID;
                            break;
                        case 'Paweł':
                            userID = auth.pawelID;
                            break;
                    }

                    bot.guilds.cache.get(auth.serverID)?.members.fetch().then(member => console.log(member.toJSON()));

                    // console.log(userID);
                    // console.log("");
                    // console.log(message.guild.members.resolve(String(userID)));
                    // console.log("");
                    // const list = message.client.guilds.cache.get(auth.serverID);
                    // list.members.cache.forEach(member => console.log(member.user.username));
                    // message.guild.fetchAllMembers

                    // for (const guild of client.guilds.cache)
                    //     for (const user of await guild.members.fetch())
                    //         console.log(user);
                    //         // user.send('message').catch(() => console.log('User had DMs disabled'));

                    // message.guild.members.fetch(String(userID)).setNickname(args[0]);
                    // let rMember = message.guild.member(await message.guild.members.fetch(userID));
                    // console.log(rMember);
                    // await rMember.setNickname(args[0]);
                    // let guildMember = message.guild.members.fetch(String(userID));
                    // console.log((await guildMember).setNickname(args[0]));
                    // await message.guild.members.fetch(String(userID)).setNickname(args[0]);
                    // await message.guild.members.fetch(String(userID)).then(member => { member.setNickname(args[0]).catch(error => message.channel.send("ok"));}).catch(error => message.channel.send('fetch error'));
                    // message.guild.members.fetch().then(member => {
                    //     console.log(member.user.id)
                    //     if (member.user.id === (userID)) {
                    //         console.log(member.user.id)
                    //         member.setNickname(args[0])
                    //     }
                    // })
                }
                else {
                    await message.member?.setNickname(args[0]);
                }
                break;
            case 'whois': {
                console.log(args);
                break;
            }
            case 'book': {
                await message.channel.send("Link to Hacking 101: "+auth.hacking101+"\nLink to O'Reilly: "+auth.oreilly);
                break;
            }
            case 'cron': {
                if (args[0] != 'start' && !(args[1] in crons)) {
                    await message.channel.send('No such job as \"'+args[1]+'\"!')
                }
                switch(args[0]) {
                    case 'start': {
                        let cron_arg = args[2] + ' ' + args[3] + ' ' + args[4] + ' ' + args[5] + ' ' + args[6];
                        crons[args[1]] = cron.schedule(cron_arg, () => {
                            message.channel.send({ embeds: [new MessageEmbed().setTitle(args.slice(7).join(' '))] })
                        }, {
                            timezone: 'Europe/Warsaw',
                            scheduled: false
			            });
                        crons[args[1]].start();
                        break;
                    }
                    case 'kill':
                        crons[args[1]].stop();
                        delete(crons[args[1]]);
			            break;
                }
                break;
            }
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
            case 'queue':
                const embedQueue = new MessageEmbed()
                    .setTitle('Queue')
                    .setDescription(serverQueue.songs)
                await message.channel.send({ embeds: [embedQueue] })
                break;
        }
    }
    // the messages replies
    if (message.content.substring(0, 4) === 'Cześć') {
        args = message.content.substring(4).split(' ');
        await message.channel.send('Cześć '+args.join(' ')+'!')
    }
    if (message.content.includes(':octopus:')) {
        await message.channel.send(':octopus:')
    }
    if (message.content.substring(1, 7) === 'estem ') {
        args = message.content.substring(7).split(' ');
        if (args[0].substring(1, 7) === "sawery" || args[0].substring(1, 5) === "dmin")
            if (parseInt(message.author.id) !== auth.ksaweryID)
                await message.channel.send('Witaj... Wait a minute, you are not Ksawery. You are not Ksawery at all!')
            else
                await message.channel.send('Witaj Ksawery :smiley:')
        else
            await message.channel.send('Witaj '+args.join(' ')+'! Ja jestem TheCircleBot :grin:!')
    }
    if (message.content.substring(1, 8) === 'ie zdam') {
        await message.channel.send('Oj tam, nie martw się, będzie dobrze :blush:')
    }
    if (message.content.substring(1, 4) === 'dam') {
        await message.channel.send('Dokładnie :smiley:');
    };
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
