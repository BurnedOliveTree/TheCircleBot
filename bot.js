const Discord = require('discord.js');
const ytdl = require("ytdl-core");
const auth = require('./auth.json');
const bot = new Discord.Client();
const musicQueue = new Map();

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
        const args = message.content.split(" ");
        args.splice(0, 1)

        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel)
            return message.channel.send("You need to be in a voice channel to play music");
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
            return message.channel.send("I need the permissions to join and speak in your voice channel");
        }

        // works on a url
        const songInfo = await ytdl.getInfo(args.join(" "));
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
                        { name: 'book', value: 'Sends the link to the ebook'}
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
            case 'poll':
                let stupid_not_working_emojis = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯', '🇰', '🇱', '🇲', '🇳', '🇴', '🇵', '🇶', '🇷', '🇸', '🇹', '🇺', '🇻', '🇼', '🇽', '🇾', '🇿']
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
            case 'loop': {
                var interval = setInterval(function () {
                    message.channel.send("test").catch(console.error);
                }, 60 * 1000); // every minute
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