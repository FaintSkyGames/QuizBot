const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const quizPlayersSchema = require('../../schemas/quizPlayersSchema');



module.exports = {
    data: new SlashCommandBuilder()
        .setName('player')
        .setDescription('Adds and removes players from the database.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add player to database.')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('The user you would like to add.')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('The irl name of the player.')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('update')
                .setDescription('Update player in database.')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('The user you would like to update.')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('The irl name of the player. Leaving this blank will set name to null.')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Removes a user from the database.')
                .addUserOption(option => 
                    option
                        .setName('user')
                        .setDescription('The user you would like to remove.')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('points')
                .setDescription('Display player points so far.')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('The user you would like to view points for.')
                        .setRequired(true)
                )
        ),
    async execute(interaction) {
        // Command execution logic goes here
        // Get current subcommand
        const subcommand = interaction.options.getSubcommand();
        
        // Returns userId number not the @
        const userId = interaction.options.getUser('user');
        const existingSetup = await quizPlayersSchema.findOne({userId: userId});

        if(subcommand == 'add'){
            
            const name = interaction.options.getString('name');

            if  (existingSetup){
                return interaction.reply({content: 'User already added.'})
            }

            try {
                await quizPlayersSchema.create({
                    userId: userId,
                    username: userId.username,
                    name: name,
                    totalPoints: 0
                })

                if (name === null){
                    const embed = new EmbedBuilder()
                        .setColor('Random')
                        .setTitle('Add Player')
                        .setDescription('Successfully setup ' + userId.username)
                        .setTimestamp()

                    await interaction.reply({embeds: [embed]});
                } else {
                    const embed = new EmbedBuilder()
                        .setColor('Random')
                        .setTitle('Add Player')
                        .setDescription('Successfully setup @' + userId.username + ' ! Nice to meet you ' + name + '.')
                        .setTimestamp()

                    await interaction.reply({embeds: [embed]});
                }
                
            } catch (error) {
                interaction.reply(error);
            }
        } else if (subcommand === 'remove') {

            if  (existingSetup){
                await quizPlayersSchema.findOneAndDelete({userId: userId});

                const embed = new EmbedBuilder()
                        .setColor('Random')
                        .setTitle('Remove Player')
                        .setDescription('@' + userId.username + ' has been removed from the database.')
                        .setTimestamp()

                    await interaction.reply({embeds: [embed]});
            }
            else {
                const embed = new EmbedBuilder()
                        .setColor('Random')
                        .setTitle('Remove Player')
                        .setDescription('User @' + userId.username + 'is not present in the database.')
                        .setTimestamp()

                    await interaction.reply({embeds: [embed]});
            }
        } else if (subcommand === 'update') {
            const name = interaction.options.getString('name');

            if  (existingSetup){
                try {
                    let extraDetails = "";
                
                    if (name === existingSetup.name) {
                        extraDetails += "IRL name remained the same. ";
                    } else if (name === null){
                        extraDetails += "IRL name erased. ";
                    } else {
                        extraDetails += "IRL name updated to " + name + ". ";
                    }

                    if (userId.username === existingSetup.username){
                        extraDetails += "Username remained the same. ";
                    }
                    else {
                        extraDetails += "Username updated to " + userId.username + ". ";
                    }

                    await quizPlayersSchema.findOneAndUpdate({userId}, {
                        username: userId.username,
                        name: name
                    })

                    const embed = new EmbedBuilder()
                        .setColor('Random')
                        .setTitle('Update Player')
                        .setDescription('Successfully updated @' + existingSetup.username + ' ! ' + extraDetails)
                        .setTimestamp()
    
                    await interaction.reply({embeds: [embed]});
                    
                } catch (error) {
                    interaction.reply(error);
                }
            } else {
                const embed = new EmbedBuilder()
                    .setColor('Random')
                    .setTitle('Update player')
                    .setDescription('@' + userId.username + ' is not in the database.')
                    .setTimestamp()
    
                await interaction.reply({embeds: [embed]});
            }
        } else if (subcommand === 'points') {
            
                let extraDetails = "";

                if(existingSetup.name != null){
                    extraDetails += existingSetup.name;
                } else {
                    extraDetails += `@${existingSetup.username}`;
                }

                const embed = new EmbedBuilder()
                        .setColor('Random')
                        .setTitle('Player Points')
                        .setDescription(`Congratulations ${extraDetails}, you have ${Number(existingSetup.totalPoints) || 0} points!`)
                        .setTimestamp()
    
                    await interaction.reply({embeds: [embed]});
            
        }
    }
};