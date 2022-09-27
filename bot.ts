import { CommandInteraction, GuildMember, Intents, Message, MessageEmbed, Role, StageChannel, TextBasedChannels, User, VoiceChannel } from 'discord.js';
import { AudioPlayer, AudioPlayerStatus, createAudioPlayer, createAudioResource, DiscordGatewayAdapterCreator, entersState, joinVoiceChannel, PlayerSubscription, VoiceConnection, VoiceConnectionStatus } from '@discordjs/voice';
import * as discordx from 'discordx';
import ytdl from "ytdl-core";
import got from 'got';
import YouTube from "youtube-sr";
import * as jsdom from "jsdom";
import * as cron from 'node-cron';
const { JSDOM } = jsdom;

import auth from './auth.json';
const bot = new discordx.Client({ intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_PRESENCES,
    Intents.FLAGS.GUILD_VOICE_STATES
] });
const url = 'http://www.holidayscalendar.com';
// const url = 'https://www.checkiday.com';

declare const queueConstruct: {
    textChannel: TextBasedChannels,
    voiceChannel: VoiceChannel | StageChannel,
    player: AudioPlayer,
    connection: VoiceConnection,
    subscription: PlayerSubscription | null | undefined,
    songs: Array<{title: string, url: string}>,
    volume: number
}
type QueueConstruct = typeof queueConstruct
const musicQueue = new Map<string, QueueConstruct>();
let crons: { [id: string]: cron.ScheduledTask } = {}
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const stupid_not_working_emojis = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯', '🇰', '🇱', '🇲', '🇳', '🇴', '🇵', '🇶', '🇷', '🇸', '🇹', '🇺', '🇻', '🇼', '🇽', '🇾', '🇿']

const NotBot: discordx.GuardFunction<discordx.ArgsOf<"messageCreate">> = async (
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

// slash commands

@discordx.Discord()
abstract class TheCircleBot {
    @discordx.Slash('ping', { description: "Ping bot and check if it's up" })
    private ping(interaction: CommandInteraction) {
        interaction.reply("Pong!")
    }

    @discordx.Slash("whois")
    private whois(
        @discordx.SlashOption("x", { type: "MENTIONABLE", required: true }) mentionable: GuildMember | User | Role,
        interaction: CommandInteraction
    ) {
        interaction.reply(mentionable.id);
    }

    @discordx.Slash('roll', { description: "Roll the dices" })
    private roll(
        @discordx.SlashOption("sides", { description: "amount of sides on these dices", type: "INTEGER", required: true }) die_sides: number,
        @discordx.SlashOption("amount", { description: "amount of dices", type: "INTEGER" }) die_amount: number,
        @discordx.SlashOption("offset", { description: "amount to add to the result", type: "INTEGER" }) die_offset: number,
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

    @discordx.Slash('event', { description: "Create an event and vote whether you will participate or not" })
    private async event(
        @discordx.SlashOption("title", { description: "title of the event", type: "STRING", required: true }) title: string,
        @discordx.SlashOption("description", { description: "description of the event", type: "STRING"}) description: string,
        @discordx.SlashOption("date", { description: "date of the event, formatted like: YYYY-MM-DDTHH:MM", type: "STRING"}) date: string,
        interaction: CommandInteraction
    ) {
        if (description === undefined)
            description = ""
        else
            description = description + "\n\n"

        if (date !== undefined) {
            date = new Date(date + ":00").toString()
        }
        else
            date = ""
        const embedEvent = new MessageEmbed()
            .setTitle(title)
            .setDescription(description + "🟢 - yes\n🟡 - maybe\n🔴 - no")
            .addField('Date', date)
        const message = await interaction.reply({ embeds: [embedEvent], fetchReply: true })
        if (!(message instanceof Message))
            throw TypeError
        message.react("🟢")
        message.react("🟡")
        message.react("🔴")
    }

    @discordx.Slash('poll', { description: "Creates a poll with up to 20 answers" })
    private async poll(
        @discordx.SlashOption("title", { description: "polls title", type: "STRING", required: true }) title: string,
        @discordx.SlashOption("options", { description: "poll options, structured like this: A, B, C", type: "STRING", required: true }) args: string,
        interaction: CommandInteraction
    ) {
        const options = args.split(', ').filter((i: string) => i !== ' ').filter((i: string) => i);
        var result = '';
        for (var i = 0; i < options.length; ++i) {
            result = result + stupid_not_working_emojis[i] + ' ' + options[i] + '\n';
        }
        const embedPoll = new MessageEmbed()
            .setTitle(title)
            .setDescription(result)

        const message = await interaction.reply({ embeds: [embedPoll], fetchReply: true })
        if (!(message instanceof Message))
            throw TypeError
        for (var i = 0; i < options.length; ++i) {
            message.react(stupid_not_working_emojis[i])
        }
    }

    @discordx.Slash('holidays', { description: "Shows today's international and weird holidays" })
    private async holidays(interaction: CommandInteraction) {
        async function getHolidaysWrapper(url: string) {
            async function getHolidays(url: string) {
                try {
                    const response = await got(url);
                    const dom = new JSDOM(response.body);
                    return dom.window.document.querySelector('table')!.textContent;
                } catch (error: any) {
                    console.log(error.response.body);
                }
            }

            return await getHolidays(url).then(result => {
                let text = result!.split('    ').join('').split('\n').filter(function (elmnt: string) { return elmnt !== ''; });
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

    @discordx.Guild(auth.serverID)
    @discordx.Slash('book', { description: "Sends link to the ebooks" })
    private book(interaction: CommandInteraction) {
        interaction.reply("Link to Hacking 101: "+auth.hacking101+"\nLink to O'Reilly: "+auth.oreilly)
    }

    @discordx.Guild(auth.serverID)
    // @Slash('nick')
    private nick(
        @discordx.SlashChoice(auth.memberIDs)
        @discordx.SlashOption("name", { description: "name of a member", required: true }) memberID: number,
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

    @discordx.On('messageCreate')
    @discordx.Guard(NotBot)
    private onMessage(
        [message]: discordx.ArgsOf<"messageCreate">
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

@discordx.Discord()
@discordx.SlashGroup("cron", { description: "cron commands group"})
abstract class CronGroup {

    @discordx.Slash('start', { description: "Set up a scheduled message, example:\ncron start test 0 0 */14 * * Will appear every 14 days" })
    private start(
        @discordx.SlashOption("name", { description: "name of cron job", type: "STRING", required: true }) name: string,
        @discordx.SlashOption("message", { description: "message to send while schedule appears", type: "STRING", required: true  }) message: string,
        @discordx.SlashOption("minute", { description: "cron minute argument", type: "STRING", required: true }) minute: string,
        @discordx.SlashOption("hour", { description: "cron hour argument", type: "STRING", required: true }) hour: string,
        @discordx.SlashOption("day", { description: "cron day argument", type: "STRING", required: true }) day_of_the_month: string,
        @discordx.SlashOption("month", { description: "cron month argument", type: "STRING", required: true }) month: string,
        @discordx.SlashOption("week", { description: "cron day of the week argument", type: "STRING", required: true }) day_of_the_week: string,
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
    
    @discordx.Slash('kill', { description: "Remove a scheduled message" })
    private kill(
        @discordx.SlashOption("name", { description: "name of cron job", type: "STRING", required: true }) name: string,
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

@discordx.Discord()
@discordx.SlashGroup("music", "music commands group")
abstract class MusicGroup {

    private playNext(serverQueue: QueueConstruct, guildId: string) {
        serverQueue.songs.shift() // pop first element
        if (serverQueue.songs.length === 0) {
            this.destroy(serverQueue, guildId);
        }
        serverQueue.player.play(createAudioResource(ytdl(serverQueue.songs[0].url, { filter: "audioonly" })));
        serverQueue.textChannel.send(`Playing now **${serverQueue.songs[0].title}**`);
    }

    private destroy(serverQueue: QueueConstruct, guildId: string) {
        serverQueue.player.stop();
        serverQueue.subscription!.unsubscribe();
        serverQueue.connection.disconnect();
        if (serverQueue.connection.state.status !== VoiceConnectionStatus.Destroyed) {
            serverQueue.connection.destroy();
        }
        musicQueue.delete(guildId);
    }

    @discordx.Slash('play', { description: "Play a given video from YouTube. You can type in a link or its name" })
    private async play(
        @discordx.SlashOption("query", { description: "query to search for in YT", type: "STRING", required: true }) query: string,
        interaction: CommandInteraction
    ) {
        async function findSong(query: string): Promise<string> {
            // if an URL is not in query, search YouTube, find an URL and replace query with it
            if (!query.includes("youtube.com/")) {
                let foo = await YouTube.searchOne(query)
                if (foo === null) {
                    return ""
                } else {
                    return "https://youtube.com/watch?v=" + foo.id
                }
            }
            else {
                return query
            }
        }

        const serverQueue = musicQueue.get(interaction.guildId!)

        const voiceChannel = interaction.guild!.members.cache.get(interaction.member!.user.id)!.voice.channel;
        if (!voiceChannel)
            interaction.reply("You need to be in a voice channel to play music");

        const permissions = voiceChannel!.permissionsFor(bot.user!);
        if (!permissions!.has("CONNECT") || !permissions!.has("SPEAK"))
            interaction.reply("I need the permissions to join and speak in your voice channel");

        query = await findSong(query)
        if (query === "") {
            interaction.reply(`Requested song was not found on youtube`);
            return;
        }
        let songInfo: ytdl.videoInfo
        try {
            songInfo = await ytdl.getInfo(query);
        } catch (error: any) {
            interaction.reply(`Requested song is probably age restricted on youtube`);
            return;
        }
        const song = {
            title: songInfo.videoDetails.title,
            url: songInfo.videoDetails.video_url
        };

        if (!serverQueue) {
            const serverQueue: QueueConstruct = {
                textChannel: interaction.channel!,
                voiceChannel: voiceChannel!,
                player: createAudioPlayer(),
                connection: joinVoiceChannel({
                    channelId: voiceChannel!.id,
                    guildId: voiceChannel!.guild.id,
                    adapterCreator: voiceChannel!.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator
                }),
                subscription: null,
                songs: [song],
                volume: 5
            };

            serverQueue.subscription = serverQueue!.connection.subscribe(serverQueue!.player)
            musicQueue.set(interaction.guildId!, serverQueue);
            try {
                serverQueue.player.play(createAudioResource(ytdl(serverQueue.songs[0].url, { quality: "highestaudio" })));
                serverQueue.textChannel.send(`Playing now **${serverQueue.songs[0].title}**`);
                serverQueue.player.on(AudioPlayerStatus.Idle, () => {
                    this.playNext(serverQueue, interaction.guildId!)
                })
                serverQueue.connection.on(VoiceConnectionStatus.Destroyed, () => {
                    this.destroy(serverQueue, interaction.guildId!)
                })
                serverQueue.connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
                    try {
                        // check if after 5 seconds bot reconnects
                        await Promise.race([
                            entersState(serverQueue.connection, VoiceConnectionStatus.Signalling, 5_000),
                            entersState(serverQueue.connection, VoiceConnectionStatus.Connecting, 5_000),
                        ]);
                    } catch (error) {
                        this.destroy(serverQueue, interaction.guildId!)
                    }
                });
                interaction.reply(`${song.title} has been added to the queue`);
            } catch (error: any) {
                console.log(error);
                musicQueue.delete(interaction.guildId!);
                interaction.reply(`An error has occurred: ${error}`);
            }
        } else {
            serverQueue.songs.push(song);
            interaction.reply(`${song.title} has been added to the queue`);
        }
    }

    @discordx.Slash('skip', { description: 'Skips to next song in queue' })
    private skip(interaction: CommandInteraction) {
        const serverQueue = musicQueue.get(interaction.guildId!)
        if (!serverQueue)
            interaction.reply("There is no song that I could skip");

        if (!interaction.guild!.members.cache.get(interaction.member!.user.id)!.voice.channel)
            interaction.reply("You need to be in a voice channel to skip music");
        
        this.playNext(serverQueue!, interaction.guildId!)
        interaction.reply(`Skipped to the next song`);
    }

    @discordx.Slash('pause')
    private pause(interaction: CommandInteraction) {
        const serverQueue = musicQueue.get(interaction.guildId!)
        if (!serverQueue)
            interaction.reply("There is no song that I could pause");

        if (!interaction.guild!.members.cache.get(interaction.member!.user.id)!.voice.channel)
            interaction.reply("You need to be in a voice channel to pause music");
        
        if (serverQueue!.player.state.status === AudioPlayerStatus.Playing) {
            serverQueue!.player.pause();
            interaction.reply(`Paused`);
        }
        else {
            interaction.reply(`Can't pause if music is not playing`);
        }
    }

    @discordx.Slash('unpause')
    private unpause(interaction: CommandInteraction) {
        const serverQueue = musicQueue.get(interaction.guildId!)
        if (!serverQueue)
            interaction.reply("There is no song that I could unpause");

        if (!interaction.guild!.members.cache.get(interaction.member!.user.id)!.voice.channel)
            interaction.reply("You need to be in a voice channel to unpause music");
        
        if (serverQueue!.player.state.status === AudioPlayerStatus.Paused) {
            serverQueue!.player.unpause();
            interaction.reply(`Unpaused`);
        }
        else {
            interaction.reply(`Can't unpause if music nothing is paused`);
        }
    }

    @discordx.Slash('stop', { description: "Stop playing music and leave the voice channel" })
    private stop(interaction: CommandInteraction) {
        const serverQueue = musicQueue.get(interaction.guildId!)
        if (!serverQueue)
            interaction.reply("There is no song that I could stop");

        if (!interaction.guild!.members.cache.get(interaction.member!.user.id)!.voice.channel)
            interaction.reply("You need to be in a voice channel to stop music");

        this.destroy(serverQueue!, interaction.guildId!);
        interaction.reply("Stopped playing, bye!");
    }

    @discordx.Slash('queue', { description: "Lists all songs added to the queue" })
    private queue(interaction: CommandInteraction) {
        const serverQueue = musicQueue.get(interaction.guildId!)

        if (!serverQueue)
            interaction.reply("There is no song in the queue");

        const embedQueue = new MessageEmbed()
            .setTitle('Queue')
            .setDescription(serverQueue!.songs.map((value: { title: string, url: string} ) => { return value.title }).join('\n'))
        interaction.reply({ embeds: [embedQueue] })
    }
}

bot.once('ready', async () => {
    await bot.initApplicationCommands();
    await bot.initApplicationPermissions();
    console.log('bot is online');
    bot.user?.setStatus('online');
    bot.user?.setActivity({ name: 'ciebie', type: 'WATCHING' });
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
