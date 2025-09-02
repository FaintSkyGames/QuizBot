const {
  SlashCommandBuilder,
  EmbedBuilder,
  ChannelType,
} = require("discord.js");
const quizPlayersSchema = require("../../schemas/quizPlayersSchema");
const { user } = require("../..");
const {QUIZ_HOST_ROLE, QUIZ_PLAYER_ROLE} = require("../../utils/constants.js")

// const QUIZ_HOST_ROLE = "quizhost";
// const QUIZ_PLAYER_ROLE = "quizplayer";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("player")
    .setDescription("Adds and removes players from the database.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add player to database.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user you would like to add.")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("The irl name of the player.")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("update")
        .setDescription("Update player in database.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user you would like to update.")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription(
              "The irl name of the player. Leaving this blank will set name to null."
            )
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Removes a user from the database.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user you would like to remove.")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("points")
        .setDescription("Display player points so far.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user you would like to view points for.")
            .setRequired(true)
        )
    ),
  async execute(interaction) {
    // Error handle
    const hostRole = interaction.guild.roles.cache.find(
      (role) => role.name === QUIZ_HOST_ROLE
    );
    if (!hostRole)
      return interaction.editReply(`The role "${QUIZ_HOST_ROLE}" is required.`);

    const playerRole = interaction.guild.roles.cache.find(
      (role) => role.name === QUIZ_PLAYER_ROLE
    );
    if (!playerRole)
      return interaction.editReply(
        `The role "${QUIZ_PLAYER_ROLE}" is required.`
      );

    // Get current subcommand
    const subcommand = interaction.options.getSubcommand();

    if (subcommand == "add") {
      // Returns user object
      const discordUser = interaction.options.getUser("user");
      const name = interaction.options.getString("name");

      const existingUser = await quizPlayersSchema.findOne({
        userId: discordUser.id,
      });

      if (existingUser) {
        return interaction.reply({ content: "User already added." });
      }

      try {
        await quizPlayersSchema.create({
          userId: discordUser.id,
          username: discordUser.username,
          name: name,
          avatar: discordUser.avatar,
          totalPoints: 0,
        });

        if (name === null) {
          const embed = new EmbedBuilder()
            .setColor("Random")
            .setTitle("Add Player")
            .setDescription("Successfully setup " + discordUser.username)
            .setTimestamp();

          await interaction.reply({ embeds: [embed] });
        } else {
          const embed = new EmbedBuilder()
            .setColor("Random")
            .setTitle("Add Player")
            .setDescription(
              "Successfully setup @" +
                discordUser.username +
                " ! Nice to meet you " +
                name +
                "."
            )
            .setTimestamp();

          await interaction.reply({ embeds: [embed] });
        }
      } catch (error) {
        interaction.reply(error);
      }
    } else if (subcommand === "remove") {
      // Returns user object
      const discordUser = interaction.options.getUser("user");
      const existingUser = await quizPlayersSchema.findOne({
        userId: discordUser.id,
      });

      if (existingUser) {
        // Remove any quiz related roles
        const member =
          interaction.guild.members.cache.get(discordUser.id) ||
          (await interaction.guild.members.fetch(discordUser.id));

        try {
          await member.roles.remove(playerRole);
          console.log(
            `Removed ${QUIZ_PLAYER_ROLE} role from ${discordUser.tag}`
          );
        } catch (err) {
          console.error(`Failed to remove player role:`, err);
        }

        try {
          await member.roles.remove(hostRole);
          console.log(`Removed ${QUIZ_HOST_ROLE} role from ${discordUser.tag}`);
        } catch (err) {
          console.error(`Failed to remove host role:`, err);
        }

        // Delete
        await quizPlayersSchema.findOneAndDelete({ userId: discordUser.id });

        // Respond
        const embed = new EmbedBuilder()
          .setColor("Random")
          .setTitle("Remove Player")
          .setDescription(
            "@" + discordUser.tag + " has been removed from the database."
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      } else {
        const embed = new EmbedBuilder()
          .setColor("Random")
          .setTitle("Remove Player")
          .setDescription(
            "User @" + discordUser.tag + " is not present in the database."
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      }
    } else if (subcommand === "update") {
      // Returns user object
      const discordUser = interaction.options.getUser("user");
      const existingUser = await quizPlayersSchema.findOne({
        userId: discordUser.id,
      });

      const name = interaction.options.getString("name");

      if (existingUser) {
        try {
          let extraDetails = ``;

          if (name === existingUser.name) {
            extraDetails += `Name remained the same. \n`;
          } else if (name === null) {
            extraDetails += `Name erased. \n`;
          } else {
            extraDetails += `Name updated to ${name}. \n`;
          }

          if (discordUser.username === existingUser.username) {
            extraDetails += `Username remained the same. \n`;
          } else {
            extraDetails += `Username updated to ${discordUser.username}. \n`;
          }

          if (discordUser.avatar === existingUser.avatar) {
            extraDetails += `Avatar remained the same. `;
          } else {
            extraDetails += `Avatar updated. `;
          }

          await quizPlayersSchema.findOneAndUpdate(
            { userId: discordUser.id },
            {
              username: discordUser.username,
              name: name,
              avatar: discordUser.avatar,
            }
          );

          const embed = new EmbedBuilder()
            .setColor("Random")
            .setTitle("Update Player")
            .setDescription(
              `Successfully updated @${discordUser.tag}! \n ${extraDetails}`
            )
            .setTimestamp();

          await interaction.reply({ embeds: [embed] });
        } catch (error) {
          interaction.reply(`Something went wrong. `, error);
        }
      } else {
        const embed = new EmbedBuilder()
          .setColor("Random")
          .setTitle("Update player")
          .setDescription("@" + discordUser.tag + " is not in the database.")
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      }
    } else if (subcommand === "points") {
      // Returns user object
      const discordUser = interaction.options.getUser("user");
      const existingUser = await quizPlayersSchema.findOne({
        userId: discordUser.id,
      });

      if (!existingUser) {
        return interaction.reply({ content: "No user present." });
      }

      let extraDetails = "";

      if (existingUser.name != null) {
        extraDetails += existingUser.name;
      } else {
        extraDetails += `@${existingUser.username}`;
      }

      const embed = new EmbedBuilder()
        .setColor("Random")
        .setTitle("Player Points")
        .setDescription(
          `Congratulations ${extraDetails}, you have ${
            Number(existingUser.totalPoints) || 0
          } points!`
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  },
};
