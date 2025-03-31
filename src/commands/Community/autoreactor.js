const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const autoReactorSchema = require('../../schemas/autoReactSchema');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('auto-react')
        .setDescription('Sets up / removes auto-react function.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Set up auto-reaction')
                .addStringOption(option =>
                    option
                        .setName('emoji')
                        .setDescription('The emoji to react with')
                        .setRequired(true)
                )
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('The channel where bot auto reacts')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('removes auto reaction setup')
        ),
    async execute(interaction) {
        // Command execution logic goes here

        // get current subcommand
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        if(subcommand == 'setup'){
            const emoji = interaction.options.getString('emoji');
            const channel = interaction.options.getChannel('channel');

            const existingSetup = await autoReactorSchema.findOne({guildId: guildId});

            if  (existingSetup){
                return interaction.reply({content: 'auto react already set up'})
            }

            try {
                await autoReactorSchema.create({
                    guildId: guildId,
                    channelId: channel.id,
                    emoji: emoji
                })

                const embed = new EmbedBuilder()
                    .setColor('Random')
                    .setTitle('Auto Reactor Setup')
                    .setDescription('Successfully setup ${emoji} for ${channel}')
                    .setTimestamp()

                await interaction.reply({embeds: [embed]});
            } catch (error) {
                interaction.reply(error);
            }
        } else if (subcommand === 'remove') {
            // check for setup exsist

            await autoReactorSchema.deleteOne({});
        }
    }
};