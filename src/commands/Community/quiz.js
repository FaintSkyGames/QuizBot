const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const mongoose = require('mongoose');
const quizPlayersSchema = require('../../schemas/quizPlayersSchema');
const quizCurrentSchema = require('../../schemas/quizCurrentSchema');
const quizOverviewSchema = require('../../schemas/quizOverviewSchema');
const player = require('./player');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('quiz')
        .setDescription('For all your quiz needs.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('start')
                .setDescription('Start a new quiz!')
                .addUserOption(option =>
                    option
                        .setName('host')
                        .setDescription('Who is hosting the quiz today?')
                        .setRequired(true)
                )
                .addUserOption(option =>
                    option
                        .setName('cohost')
                        .setDescription('Would you like a second in command?')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('end')
                .setDescription('End todays quiz')
                .addUserOption(option =>
                    option
                        .setName('host')
                        .setDescription('Who is hosting the quiz today?')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('give')
                .setDescription('Give points to a player.')
                .addUserOption(option =>
                    option
                        .setName('player')
                        .setDescription('The user you would like to give points to.')
                        .setRequired(true)
                )
                .addNumberOption(option =>
                    option
                        .setName('points')
                        .setDescription('The number of points to add.')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('take')
                .setDescription('Give points to a player.')
                .addUserOption(option =>
                    option
                        .setName('player')
                        .setDescription('The user you would like to take points from.')
                        .setRequired(true)
                )
                .addNumberOption(option =>
                    option
                        .setName('points')
                        .setDescription('The number of points to take away.')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('wipe')
                .setDescription('Wipe the leaderboard')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription('Clear points for today')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('leaderboard')
                .setDescription('show leaderboard')
        ),             
    async execute(interaction) {
        // Command execution logic goes here

        // Get current subcommand
        const subcommand = interaction.options.getSubcommand();

        const guild = interaction.guild;

        const roleName = "quizhost";

        //const quizPlayersDB = mongoose.models.players  || mongoose.model('players', quizPlayersSchema);
        //const PlayersDB = mongoose.models.PlayersDB || mongoose.model('PlayersDB', quizPlayersSchema, 'players');

        if(subcommand == 'start'){
            try {

                await interaction.deferReply();

                // Find the role by name
                const hostRole = guild.roles.cache.find(r => r.name === roleName);
                if (!hostRole) return interaction.editReply(`The role "${roleName}" is required.`);                

                await guild.members.fetch();
                const host = guild.members.cache.filter(member => member.roles.cache.has(hostRole.id));
                
                // if host present then quiz active
                if(host.size > 0){
                    const hostUsernames = host.map(member => member.user.tag).join(", ");
                    console.log(`Role "${roleName}" exists for: ${hostUsernames}`);
                    
                    const embed = new EmbedBuilder()
                        .setColor('Random')
                        .setTitle('Start Quiz')
                        .setDescription(`Error: No quiz started. There is an existing quiz hosted by ${hostUsernames}`)
                        .setTimestamp()

                    await interaction.editReply({embeds: [embed]});
                } else {
    
                    // Assign host
                    const hostId = interaction.options.getUser('host');

                    // Find role in guild
                    const hostRole = guild.roles.cache.find(r => r.name === roleName);
                    if (!hostRole) return interaction.editReply(`The role "${roleName}" is required.`);

                    // Assign role
                    const member = await guild.members.fetch(hostId);
                    member.roles.add(hostRole)
                        .then(() => console.log(`${member.user.tag} was given the role "${roleName}"!`))
                        .catch(err => console.error(`Failed to assign role: ${err}`));

                    // Assign cohost
                    
                    
                    // Add to DB
                    const allPlayers = await quizPlayersSchema.find(); // Fetch all
                    const check = `<@${hostId.id}>`;                    

                    for (const player of allPlayers){
                        if(player.userId != check){
                            await quizCurrentSchema.create({
                            userId: player.userId,
                            points: 0
                            })
                        }                   
                    }

                    const embed = new EmbedBuilder()
                        .setColor('Random')
                        .setTitle('Start Quiz')
                        .setDescription(`${member}s quiz is starting soon!`)
                        .setTimestamp()

                    await interaction.editReply({embeds: [embed]});
                }      

            } catch (error) {
                interaction.editReply(error);
            }
        } else if (subcommand === 'end') {

            await interaction.deferReply();

            
             try {

                const hostId = interaction.options.getUser('host');

                


                /// only if host




                // post results
                const players = await quizCurrentSchema.find().sort({points: -1});

                if(players === 0){
                    return interaction.editReply("No players found in the database.");
                }

                const leaderboard = players
                    .map((player, index) => `${index +1}. ***${player.userId}*** - ${player.points} points`)
                    .join("\n");

                await interaction.editReply({
                    embeds: [
                        {
                            title: "🏆 Quiz Results",
                            description: leaderboard,
                            color: 0xffd700 // gold
                        }
                    ]
                });               
                
                // add to overview
                const today = new Date();
                const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${
                    (today.getMonth() + 1).toString().padStart(2, '0')
                }/${today.getFullYear()}`;

                console.log(hostId.id);

                try {
                    await quizOverviewSchema.create({
                        hostId: `<@${hostId.id}>`,
                        date: formattedDate,
                        first: players[0]?.userId ?? "a",
                        second: players[1]?.userId ?? "a",
                        third: players[2]?.userId ?? "a",
                        fourth: players[3]?.userId ?? "a",
                        fifth: players[4]?.userId ?? "a"
                    });
                } catch (err) {
                    console.error("Failed to create quiz overview:", err);
                }



                // clear current quiz

                try {
                    await quizCurrentSchema.deleteMany({});
                    console.log("All quizCurrentSchema documents have been cleared!");
                } catch (err) {
                    console.error("Failed to clear quizCurrentSchema:", err);
                }


                // clear host & cohost roles

                const hostRole = guild.roles.cache.find(r => r.name === roleName);
                if (!hostRole) return console.log(`Role "${roleName}" not found`);

                const members = await guild.members.fetch();
                const membersWithRole = members.filter(member => member.roles.cache.has(hostRole.id));

                for (const member of membersWithRole.values()) {
                    await member.roles.remove(hostRole)
                        .then(() => console.log(`${member.user.tag} was removed from the role "${roleName}"`))
                        .catch(err => console.error(`Failed to remove role from ${member.user.tag}: ${err}`));
                }               


            } catch (error) {
                interaction.editReply(error)
                
            }

            // const embed = new EmbedBuilder()
            //     .setColor('Random')
            //     .setTitle('End Quiz')
            //     .setDescription(`Thank you for joining the quiz!`)
            //     .setTimestamp()

            // await interaction.reply({embeds: [embed]});

        } else if (subcommand === 'give') {
            const playerId = interaction.options.getUser('player');
            const toGive = interaction.options.getNumber('points');

            try {
                const playerDoc = await quizCurrentSchema.findOne({userId: playerId});

                playerDoc.points += toGive;
                await playerDoc.save();

                const embed = new EmbedBuilder()
                    .setColor('Random')
                    .setTitle('Give Points')
                    .setDescription('Successfully updated ')
                    .setTimestamp()
                    
                await interaction.reply({embeds: [embed]});
                
            } catch (error) {
                //console.log("error");
                interaction.reply("error");
            }
            
        } else if (subcommand === 'take') {
            const playerId = interaction.options.getUser('player');
            const toTake = interaction.options.getNumber('points');

            try {
                const playerDoc = await quizCurrentSchema.findOne({userId: playerId});

                playerDoc.points -= toTake;
                await playerDoc.save();

                const embed = new EmbedBuilder()
                    .setColor('Random')
                    .setTitle('Take Points')
                    .setDescription('Successfully updated ')
                    .setTimestamp()
                    
                await interaction.reply({embeds: [embed]});
                
            } catch (error) {
                //console.log("error");
                interaction.reply("error");
            }
            
        } else if (subcommand === 'wipe') {
            
        } else if (subcommand === 'clear') {  // Clear points for today
            try {
                const allPlayers = await quizCurrentSchema.find();
            
                for(const player of allPlayers){
                    player.points = 0;
                    await player.save();
                }

                const embed = new EmbedBuilder()
                    .setColor('Random')
                    .setTitle('Clear points')
                    .setDescription('Successfully updated ')
                    .setTimestamp()
                    
                await interaction.reply({embeds: [embed]});
                
            } catch (error) {
                interaction.reply("error");
            }
            
        } else if (subcommand === 'leaderboard'){

            await interaction.deferReply();

            try {
                const players = await quizPlayersSchema.find().sort({totalPoints: -1});

                if(players === 0){
                    return interaction.editReply("No players found in the database.");
                }

                const leaderboard = players
                    .map((player, index) => `${index +1}. ***${player.username}*** - ${player.totalPoints} points`)
                    .join("\n");

                await interaction.editReply({
                    embeds: [
                        {
                            title: "🏆 Quiz Leaderboard",
                            description: leaderboard,
                            color: 0xffd700 // gold
                        }
                    ]
                });          

            } catch (error) {
                interaction.editReply(error)
                
            }


        }

    }
};