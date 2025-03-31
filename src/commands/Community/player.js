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
                        .setRequired(true)
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
        ),
    async execute(interaction) {
        // Command execution logic goes here
        // Get current subcommand
        const subcommand = interaction.options.getSubcommand();
        
        // Returns userId number not the @
        const userId = interaction.options.getUser('user');

        if(subcommand == 'add'){
            
            const name = interaction.options.getString('name');
            //const existingSetup = await quizPlayersSchema.findOne({guildId: guildId});

            //if  (existingSetup){
            //    return interaction.reply({content: 'User already added.'})
            //}

            try {
                //await autoReactorSchema.create({
                //    guildId: guildId,
                //    channelId: channel.id,
                //    emoji: emoji
                //})

                const embed = new EmbedBuilder()
                    .setColor('Random')
                    .setTitle('Add Player')
                    .setDescription('Successfully setup ' + userId.username + '! Their irl name is ' + name)
                    .setTimestamp()

                await interaction.reply({embeds: [embed]});
            } catch (error) {
                interaction.reply(error);
            }
        } else if (subcommand === 'remove') {
            // check for setup exsist

            //await autoReactorSchema.deleteOne({});
        }
    }
};