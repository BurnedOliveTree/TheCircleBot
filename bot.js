const Discord = require('discord.js');
const ytdl = require("ytdl-core");
const YouTube = require("youtube-node");
const got = require('got');
const jsdom = require("jsdom");
const auth = require('./auth.json');
const bot = new Discord.Client();
const musicQueue = new Map();
const { JSDOM } = jsdom;
const url = 'http://www.holidayscalendar.com';
// const url = 'https://www.checkiday.com';
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
var interval;
let stupid_not_working_emojis = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯', '🇰', '🇱', '🇲', '🇳', '🇴', '🇵', '🇶', '🇷', '🇸', '🇹', '🇺', '🇻', '🇼', '🇽', '🇾', '🇿']
let youtube = new YouTube();
youtube.setKey(auth.googleKey);

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

const musicHandle = {
    execute: async function (message, serverQueue) {

        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel)
            return message.channel.send("You need to be in a voice channel to play music");
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
            return message.channel.send("I need the permissions to join and speak in your voice channel");
        }

        // works on youtube
        let args = message.content.split(" ");
        args.splice(0, 1);
        let query = args.join(" ");
        let result = "";
        if (query.indexOf("youtube.com/") === -1) {
            let search = new Promise(
                (resolve, reject) => {
                    youtube.search(query, 2, function(error, result) {
                        if (error) { reject(error); }
                        resolve(result.items[0].id.videoId);
                    })
                }
            );
            result = await search;
            query = "https://youtube.com/watch?v=".concat(result);
        }

        let songInfo = await ytdl.getInfo(query);
        const song = {
            title: songInfo.videoDetails.title,
            url: songInfo.videoDetails.video_url
        };

        if (!serverQueue) {
            const queueConstruct = {
                textChannel: message.channel,
                voiceChannel: voiceChannel,
                connection: null,
                songs: [],
                volume: 5,
                playing: true
            };

            musicQueue.set(message.guild.id, queueConstruct);

            queueConstruct.songs.push(song);

            try {
                queueConstruct.connection = await voiceChannel.join();
                musicHandle.play(message.guild, queueConstruct.songs[0]);
            } catch (err) {
                console.log(err);
                musicQueue.delete(message.guild.id);
                return message.channel.send(err);
            }
        } else {
            serverQueue.songs.push(song);
            return message.channel.send(`${song.title} has been added to the queue`);
        }
    },

    skip: function (message, serverQueue) {
        if (!message.member.voice.channel)
            return message.channel.send(
                "You have to be in a voice channel to stop the music"
            );
        if (!serverQueue)
            return message.channel.send("There is no song that I could skip");
        serverQueue.connection.dispatcher.end();
    },

    stop: function (message, serverQueue) {
        if (!message.member.voice.channel)
            return message.channel.send(
                "You have to be in a voice channel to stop the music"
            );

        if (!serverQueue)
            return message.channel.send("There is no song that I could stop");

        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end();
    },

    play: function (guild, song) {
        const serverQueue = musicQueue.get(guild.id);
        if (!song) {
            serverQueue.voiceChannel.leave();
            musicQueue.delete(guild.id);
            return;
        }

        const dispatcher = serverQueue.connection
            .play(ytdl(song.url))
            .on("finish", () => {
                serverQueue.songs.shift();
                musicHandle.play(guild, serverQueue.songs[0]);
            })
            .on("error", error => console.error(error));
        dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
        serverQueue.textChannel.send(`Started playing: **${song.title}**`);
    }
};

async function getHolidays(url) {
    try {
        const response = await got(url);
        const dom = new JSDOM(response.body);
        return dom.window.document.querySelector('table').textContent;
    } catch (error) {
        console.log(error.response.body);
    }
}

async function getHolidaysWrapper(url) {
    return await getHolidays(url).then(result => {
        let text = result;
        text = text.split('    ').join('');
        text = text.split('\n');
        text = text.filter(function (elmnt) { return elmnt !== ''; });
        text.shift(); text.shift(); text.shift();
        text_size = text.length / 3;
        let final_result = []
        for (i = 0; i < text_size; i++) {
            if (text[3*i+2] === 'Weird' || text[3*i+2] === 'Multiple Types') {
                final_result.push(text[3*i])
            }
        }
        text = final_result;
        return text;
    })
}

bot.on('message', async message => {
    // console.log(message.content)
    let args;

    // the command if
    if (message.content.substring(0, 1) === '!') {
        args = message.content.substring(1).split(' ');
        const cmd = args[0];

        const serverQueue = musicQueue.get(message.guild.id);

        args = args.splice(1);
        switch(cmd) {
            case 'help':
                const embedHelp = new Discord.MessageEmbed()
                    .setTitle('Help')
                    .setDescription('Cześć wszystkim! Jestem TheCircleBot, nasz kółeczkowy bot. Na razie posiadam takie komendy (dostępne po znaku \'!\'):')
                    .addFields(
                        { name: 'help', value: 'Shows this embed message' },
                        { name: 'ping', value: 'Ping bot' },
                        { name: 'roll', value: 'Rolls dices: arguments should be structured like this: 2d10+3' },
                        { name: 'poll', value: 'Creates a poll with up to 26 answers: arguments should be structured like this: \'Question\' \'Answer A\' \'Answer B\'' },
                        { name: 'holidays', value: "Shows today's international and weird holidays"},
                        { name: 'book', value: 'Sends the link to the ebook'},
                        { name: 'play', value: 'Play a given video from YouTube. You can type in a link or its name'},
                        { name: 'skip', value: 'Skips to next song in queue'},
                        { name: 'stop', value: 'Stop playing music and leave the voice channel'}
                    )
                await message.channel.send(embedHelp)
                break;
            case 'ping':
                await message.channel.send('Pong!')
                break;
            case 'roll':
                if (args.length > 0) {
                    let dices = args[0].split('d');
                    if (dices.length === 2) {
                        if (dices[0] === '') {
                            dices = ['1', dices[1]];
                        }
                        let dices_offset = 0;
                        if (dices[1].includes('+')) {
                            let args = dices[1].split('+');
                            dices[1] = args[0];
                            if (args[1] !== '') {
                                dices_offset = parseInt(args[1]);
                            }
                        }
                        const dices_amount = parseInt(dices[0]);
                        const dices_size = parseInt(dices[1]);
                        let i, results = '';
                        for (i = 0; i < dices_amount; ++i) {
                            results = results + (Math.floor((Math.random() * dices_size)) + 1 + dices_offset).toString() + ' ';
                        }
                        await message.channel.send(results)
                    }
                }
                break;
            case 'event':
                if (args.length > 0) {
                    const embedEvent = new Discord.MessageEmbed()
                        .setTitle(args.join(' '))
                        .setDescription("🟢 - tak\n🟡 - może\n🔴 - nie")
                    await message.channel.send(embedEvent).then(sent => {
                        sent.react("🟢")
                        sent.react("🟡")
                        sent.react("🔴")
                    })
                }
                break;
            case 'poll':
                if (args.length > 0) {
                    args = args.join(' ');
                    const options = args.split('\'').filter(i => i !== ' ').filter(i => i);
                    let result = '';
                    let i;
                    for (i = 1; i < options.length; ++i) {
                        result = result + stupid_not_working_emojis[i - 1] + ' ' + options[i] + '\n';
                    }
                    const embedPoll = new Discord.MessageEmbed()
                        .setTitle(options[0])
                        .setDescription(result)
                    await message.channel.send(embedPoll).then(sent => {
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
                date = date[2]+' '+months[parseInt(date[1])-1]+' '+date[0];
                const embedHolidays = new Discord.MessageEmbed()
                    .setTitle("Today's Holidays:")
                    .setDescription(date)
                holidays.forEach(entry => {
                    embedHolidays.addField(entry, '\u200b');
                });
                await message.channel.send(embedHolidays)
                break;
            }
            case 'nick':
                if (!message.guild.me.hasPermission('MANAGE_NICKNAMES'))
                    return message.channel.send('I don\'t have permission to change your nickname!');
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

                    bot.guilds.cache.get(auth.serverID).members.fetch().then(member => console.log(member.toJSON()));

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
                    await message.member.setNickname(args[0]);
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
            case 'fortnight': {
                if (interval) {
                    clearInterval(interval);
                    interval = null;
                }
                else {
                    interval = setInterval(function () {
                        const embedNicks = new Discord.MessageEmbed()
                            .setTitle("Co dwutygodniowa zmiana nicków!")
                        message.channel.send(embedHolidays)
                    }, 14 * 24 * 60 * 60 * 1000); // every fortnight
                }
                break;
            }
            case 'play': {
                await musicHandle.execute(message, serverQueue);
                break;
            }
            case 'skip': {
                musicHandle.skip(message, serverQueue);
                break;
            }
            case 'stop': {
                musicHandle.stop(message, serverQueue);
            }
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
        await message.channel.send('Dokładnie :smiley:')
    }
});

bot.once('ready', () => {
    console.log('bot is online');
    bot.user.setPresence({
        status: 'available',
        activity: {
            name: '!help',
            type: 'WATCHING'
        }
    });
});

bot.once('reconnecting', () => {
    console.log('reconnecting...');
});

bot.once('disconnect', () => {
    console.log('disconnected');
});

bot.login(auth.token);