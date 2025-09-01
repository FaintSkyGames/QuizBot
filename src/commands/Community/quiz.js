const {
  SlashCommandBuilder,
  EmbedBuilder,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AllowedMentionsTypes,
} = require("discord.js");
const mongoose = require("mongoose");
const quizPlayersSchema = require("../../schemas/quizPlayersSchema");
const quizCurrentSchema = require("../../schemas/quizCurrentSchema");
const quizOverviewSchema = require("../../schemas/quizOverviewSchema");
const player = require("./player");
const {
  QUIZ_HOST_ROLE,
  QUIZ_PLAYER_ROLE,
  BOT_MANAGER_ROLE,
} = require("../../utils/constants.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("quiz")
    .setDescription("For all your quiz needs.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("start")
        .setDescription("Start a new quiz!")
        .addUserOption((option) =>
          option
            .setName("host")
            .setDescription("Who is hosting the quiz today?")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("end")
        .setDescription("End todays quiz")
        .addUserOption((option) =>
          option
            .setName("host")
            .setDescription("Who is hosting the quiz today?")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("join")
        .setDescription("Join today's quiz")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to join if not you.")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("give")
        .setDescription("Give points to a player.")
        .addUserOption((option) =>
          option
            .setName("player")
            .setDescription("The user you would like to give points to.")
            .setRequired(true)
        )
        .addNumberOption((option) =>
          option
            .setName("points")
            .setDescription("The number of points to add.")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("take")
        .setDescription("Give points to a player.")
        .addUserOption((option) =>
          option
            .setName("player")
            .setDescription("The user you would like to take points from.")
            .setRequired(true)
        )
        .addNumberOption((option) =>
          option
            .setName("points")
            .setDescription("The number of points to take away.")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("wipe")
        .setDescription("Wipe the whole leaderboard. Asks for confirmation")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("clear")
        .setDescription("Clear points for the active quiz")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("timer")
        .setDescription("Set a timer for players to know how time they have")
        .addIntegerOption((option) =>
          option
            .setName("time")
            .setDescription("How much time do you have in seconds")
            .setRequired(true)
            .addChoices(
              { name: "5 seconds", value: 5000 },
              { name: "30 seconds", value: 30000 },
              { name: "1 minute", value: 60000 },
              { name: "1 minute 30 seconds", value: 90000 },
              { name: "2 minutes", value: 120000 },
              { name: "2 minutes 30 seconds", value: 150000 },
              { name: "3 minutes", value: 180000 },
              { name: "5 minutes", value: 300000 },
              { name: "10 minutes", value: 600000 },
              { name: "15 minutes", value: 900000 },
              { name: "20 minutes", value: 1200000 }
            )
        )
        .addChannelOption((option) =>
          option
            .setName("return")
            .setDescription("Return participants to selected call")
            .setRequired(false)
            .addChannelTypes(ChannelType.GuildVoice)
        )
        .addIntegerOption((option) =>
          option
            .setName("forceanswers")
            .setDescription(
              "Force players to submit answers within selected time. Give answer in seconds"
            )
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("teams")
        .setDescription(
          "Generate teams either by team size or total number of teams"
        )
        .addIntegerOption((option) =>
          option
            .setName("total")
            .setDescription("Number of teams to create")
            .setRequired(false)
        )
        .addIntegerOption((option) =>
          option
            .setName("size")
            .setDescription("Number of members per team")
            .setRequired(false)
        )
        .addBooleanOption((option) =>
          option
            .setName("end")
            .setDescription("Remove all the team channels")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("scoreboard")
        .setDescription("Show the current scores for the active quiz")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("leaderboard")
        .setDescription("Show the leaderboard for all the quizes")
    ),
  async execute(interaction) {
    // Get current subcommand
    const subcommand = interaction.options.getSubcommand();
    const guild = interaction.guild;

    // Error handling
    const hostRole = guild.roles.cache.find((r) => r.name === QUIZ_HOST_ROLE);
    if (!hostRole)
      return interaction.editReply(`The role "${QUIZ_HOST_ROLE}" is required.`);

    const playerRole = guild.roles.cache.find(
      (r) => r.name === QUIZ_PLAYER_ROLE
    );
    if (!playerRole)
      return interaction.editReply(
        `The role "${QUIZ_PLAYRE_ROLE}" is required.`
      );

    const botManager = guild.roles.cache.find(
      (r) => r.name === BOT_MANAGER_ROLE
    );

    if (subcommand == "start") {
      try {
        await interaction.deferReply();

        await guild.members.fetch();
        const host = guild.members.cache.filter((member) =>
          member.roles.cache.has(hostRole.id)
        );

        const hostUser = interaction.options.getUser("host");
        const hostEntry = await quizPlayersSchema.findOne({
          userId: hostUser.id,
        });

        // if host present then quiz active
        if (host.size > 0) {
          const hostUsernames = host
            .map((member) => member.user.tag)
            .join(", ");
          console.log(`Role "${QUIZ_HOST_ROLE}" exists for: ${hostUsernames}`);

          const embed = new EmbedBuilder()
            .setColor("Random")
            .setTitle("Start Quiz")
            .setDescription(
              `Error: No quiz started. \n There is an existing quiz hosted by ${hostUsernames}`
            )
            .setTimestamp();

          await interaction.editReply({ embeds: [embed] });
        } else if (!hostEntry) {
          const embed = new EmbedBuilder()
            .setColor("Random")
            .setTitle("Start Quiz")
            .setDescription(
              `Error: No quiz started. \n ${hostUser} is not in the database.`
            )
            .setTimestamp();

          await interaction.editReply({ embeds: [embed] });
        } else {
          // Assign role
          const hostMember = await guild.members.fetch(hostUser);
          hostMember.roles
            .add(hostRole)
            .then(() =>
              console.log(
                `@${hostUser.tag} was given the role "${QUIZ_HOST_ROLE}"!`
              )
            )
            .catch((err) => console.error(`Failed to assign role: ${err}`));

          const displayName = hostEntry.name || hostUser.username;

          const embed = new EmbedBuilder()
            .setColor("Random")
            .setTitle("Start Quiz")
            .setDescription(`${displayName}'s quiz is starting soon!`)
            .setTimestamp();

          await interaction.editReply({ embeds: [embed] });
        }
      } catch (error) {
        interaction.editReply(error);
      }
    } else if (subcommand === "join") {
      await interaction.deferReply();

      await guild.members.fetch();
      const hostMember = guild.members.cache.find((member) =>
        member.roles.cache.has(hostRole.id)
      );

      const discordUser =
        interaction.options.getUser("user") || interaction.user;
      const discordMember = await interaction.guild.members.fetch(
        discordUser.id
      );

      let playerInQuiz;

      // If quiz running
      if (hostMember) {
        const currentQuiz = await quizCurrentSchema.find();
        const allPlayers = await quizPlayersSchema.find();

        // Check is in player database
        const playerEntry = await quizPlayersSchema.findOne({
          userId: discordUser.id,
        });

        if (!playerEntry) {
          const embed = new EmbedBuilder()
            .setColor("Random")
            .setTitle("Join Quiz")
            .setDescription(
              `Hold your horses, youre not part of the database. Use /player add to add yourself.`
            )
            .setTimestamp();

          return interaction.editReply({ embeds: [embed] });
        }

        // Check if player is host
        if (discordUser.id === hostMember.id) {
          const embed = new EmbedBuilder()
            .setColor("Random")
            .setTitle("Join Quiz")
            .setDescription(`Quiz hosts can't join the quiz!`)
            .setTimestamp();

          return interaction.editReply({ embeds: [embed] });
        }

        // Check if player is in quiz database
        playerInQuiz = await quizCurrentSchema.findOne({
          userId: discordUser.id,
        });
      } else {
        return interaction.editReply(`No quiz running.`);
      }

      if (playerInQuiz) {
        const embed = new EmbedBuilder()
          .setColor("Random")
          .setTitle("Join Quiz")
          .setDescription(`Sorry, joining twice will not get you extra points.`)
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      } else {
        // Create entry
        await quizCurrentSchema.create({
          userId: discordUser.id,
          points: 0,
        });

        // Give role
        await discordMember.roles
          .add(playerRole)
          .then(() =>
            console.log(
              `${discordMember.user.tag} was given the role "${QUIZ_PLAYER_ROLE}"`
            )
          )
          .catch((err) =>
            console.error(
              `Failed to add role to ${discordMember.user.tag}: ${err}`
            )
          );

        // Find hostname
        const hostEntry = await quizPlayersSchema.findOne({
          userId: hostMember.id,
        });
        const hostDisplayName = hostEntry.name || hostMember.username;

        const embed = new EmbedBuilder()
          .setColor("Random")
          .setTitle("Join Quiz")
          .setDescription(
            `Whoop whoop, you're joining ${hostDisplayName}'s quiz!`
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      }
    } else if (subcommand === "end") {
      const member = interaction.member;
      if (!member.roles.cache.some((role) => role.name === QUIZ_HOST_ROLE)) {
        return interaction.reply({
          content: "❌ You need the **quizhost** role to run this command!",
          ephemeral: true,
        });
      }

      await interaction.deferReply();

      try {
        const hostId = interaction.options.getUser("host");

        const scores = await quizCurrentSchema.find().sort({ points: -1 });
        const players = await quizPlayersSchema.find();

        // Build nickname map
        const nicknameMap = new Map(players.map((p) => [p.userId, p.name]));

        // post results
        //await interaction.deferReply();

        // Build leaderboard string
        const scoreboard = buildScoreboard(scores, nicknameMap, scores.length);

        await interaction.editReply({
          embeds: [
            {
              title: "🏆 Quiz Results",
              description: scoreboard,
              color: 0xffd700, // gold
            },
          ],
        });

        // add to overview
        const today = new Date();
        const formattedDate = `${today
          .getDate()
          .toString()
          .padStart(2, "0")}/${(today.getMonth() + 1)
          .toString()
          .padStart(2, "0")}/${today.getFullYear()}`;

        const top5 = scores.slice(0, 5);

        try {
          await quizOverviewSchema.create({
            hostId: `<@${hostId.id}>`,
            date: formattedDate,
            first: players[0]?.userId ?? "0000",
            second: players[1]?.userId ?? "0000",
            third: players[2]?.userId ?? "0000",
            fourth: players[3]?.userId ?? "0000",
            fifth: players[4]?.userId ?? "0000",
          });
        } catch (err) {
          console.error("Failed to create quiz overview:", err);
        }

        // give players points
        await awardTopPoints();

        // clear current quiz
        try {
          await quizCurrentSchema.deleteMany({});
          console.log("All quizCurrentSchema documents have been cleared!");
        } catch (err) {
          console.error("Failed to clear quizCurrentSchema:", err);
        }

        // clear roles

        const hostRole = guild.roles.cache.find(
          (r) => r.name === QUIZ_HOST_ROLE
        );
        const playerRole = guild.roles.cache.find(
          (r) => r.name === QUIZ_PLAYER_ROLE
        );

        if (!hostRole) return console.log(`Role "${QUIZ_HOST_ROLE}" not found`);

        if (!playerRole)
          return console.log(`Role "${QUIZ_PLAYER_ROLE}" not found`);

        const members = await guild.members.fetch();
        const membersWithHostRole = members.filter((member) =>
          member.roles.cache.has(hostRole.id)
        );
        const membersWithPlayerRole = members.filter((member) =>
          member.roles.cache.has(playerRole.id)
        );

        for (const member of membersWithHostRole.values()) {
          await member.roles
            .remove(hostRole)
            .then(() =>
              console.log(
                `${member.user.tag} was removed from the role "${QUIZ_HOST_ROLE}"`
              )
            )
            .catch((err) =>
              console.error(
                `Failed to remove role from ${member.user.tag}: ${err}`
              )
            );
        }

        for (const member of membersWithPlayerRole.values()) {
          await member.roles
            .remove(playerRole)
            .then(() =>
              console.log(
                `${member.user.tag} was removed from the role "${QUIZ_PLAYER_ROLE}"`
              )
            )
            .catch((err) =>
              console.error(
                `Failed to remove role from ${member.user.tag}: ${err}`
              )
            );
        }
      } catch (error) {
        interaction.editReply(error);
      }
    } else if (subcommand === "give") {
      const member = interaction.member;
      if (!member.roles.cache.some((role) => role.name === QUIZ_HOST_ROLE)) {
        return interaction.reply({
          content: "❌ You need the **quizhost** role to run this command!",
          ephemeral: true,
        });
      }

      const playerId = interaction.options.getUser("player");
      const toGive = interaction.options.getNumber("points");

      try {
        const playerDoc = await quizCurrentSchema.findOne({ userId: playerId });

        playerDoc.points += toGive;
        await playerDoc.save();

        const embed = new EmbedBuilder()
          .setColor("Random")
          .setTitle("Give Points")
          .setDescription("Successfully updated ")
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      } catch (error) {
        //console.log("error");
        interaction.reply("error");
      }
    } else if (subcommand === "take") {
      const member = interaction.member;
      if (!member.roles.cache.some((role) => role.name === QUIZ_HOST_ROLE)) {
        return interaction.reply({
          content: "❌ You need the **quizhost** role to run this command!",
          ephemeral: true,
        });
      }

      const playerId = interaction.options.getUser("player");
      const toTake = interaction.options.getNumber("points");

      try {
        const playerDoc = await quizCurrentSchema.findOne({ userId: playerId });

        playerDoc.points -= toTake;
        await playerDoc.save();

        const embed = new EmbedBuilder()
          .setColor("Random")
          .setTitle("Take Points")
          .setDescription("Successfully updated ")
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      } catch (error) {
        //console.log("error");
        interaction.reply("error");
      }
    } else if (subcommand === "wipe") {
      await interaction.deferReply();

      const hostRole = guild.roles.cache.find((r) => r.name === QUIZ_HOST_ROLE);

      await guild.members.fetch();
      const host = guild.members.cache.filter((member) =>
        member.roles.cache.has(hostRole.id)
      );

      // if host present then quiz active
      if (host.size > 0) {
        const hostUsernames = host.map((member) => member.user.tag).join(", ");
        console.log(`Role "${QUIZ_HOST_ROLE}" exists for: ${hostUsernames}`);

        const embed = new EmbedBuilder()
          .setColor("Random")
          .setTitle("Wipe Failed")
          .setDescription(
            `Error: A quiz can not be running. There is an existing quiz hosted by ${hostUsernames}`
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      }

      // Send confirmation buttons
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("confirm_wipe")
          .setLabel("Yes, wipe it!")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId("cancel_wipe")
          .setLabel("Cancel")
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.editReply({
        content:
          "Are you sure you want to wipe the database? This will delete all players and all the scores for every quiz so far.",
        components: [row],
        ephemeral: true,
      });

      // Create collector to wait for button click
      const filter = (i) => i.user.id === interaction.user.id; // only allow the command user
      const collector = interaction.channel.createMessageComponentCollector({
        filter,
        time: 60000,
        max: 1,
      });

      collector.on("collect", async (i) => {
        if (i.customId === "confirm_wipe") {
          // Wipe leaderboard
          await quizPlayersSchema.deleteMany({});
          await quizOverviewSchema.deleteMany({});
          await i.update({ content: "✅ Database wiped!", components: [] });
        } else {
          await i.update({ content: "❌ Wipe canceled.", components: [] });
        }
      });

      collector.on("end", async (collected) => {
        if (collected.size === 0) {
          // No button clicked within 60 seconds
          await interaction.editReply({
            content: "⌛ No response, wipe canceled.",
            components: [],
          });
        }
      });
    } else if (subcommand === "clear") {
      // Clear points for today

      const member = interaction.member;
      if (!member.roles.cache.some((role) => role.name === QUIZ_HOST_ROLE)) {
        return interaction.reply({
          content: "❌ You need the **quizhost** role to run this command!",
          ephemeral: true,
        });
      }

      try {
        const allPlayers = await quizCurrentSchema.find();

        for (const player of allPlayers) {
          player.points = 0;
          await player.save();
        }

        const embed = new EmbedBuilder()
          .setColor("Random")
          .setTitle("Clear points")
          .setDescription("Successfully updated ")
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      } catch (error) {
        interaction.reply("error");
      }
    } else if (subcommand === "timer") {
      const member = interaction.member;
      if (!member.roles.cache.some((role) => role.name === QUIZ_HOST_ROLE)) {
        return interaction.reply({
          content: "❌ You need the **quizhost** role to run this command!",
          ephemeral: true,
        });
      }

      const pingRole = interaction.guild.roles.cache.find(
        (role) => role.name === QUIZ_PLAYER_ROLE
      );
      if (!pingRole) {
        return interaction.reply({
          content: 'Role "${QUIZ_PLAYER_ROLE}" not found in this server.',
          ephemeral: true,
        });
      }

      const timerMs = interaction.options.getInteger("time");
      let remainingTimerMs = timerMs;
      const answerS = interaction.options.getInteger("forceanswers");
      let answerMs = answerS * 1000;

      // Initial embed
      const timerEmbed = new EmbedBuilder()
        .setTitle("⏱ Timer")
        .setDescription(
          `Time remaining: **${Math.ceil(remainingTimerMs / 1000)} seconds**`
        )
        .setColor("Blue");

      const message = await interaction.reply({
        embeds: [timerEmbed],
        withResponse: true,
      });

      const timerInterval = setInterval(async () => {
        remainingTimerMs -= 1000;

        if (remainingTimerMs <= 0) {
          clearInterval(timerInterval);

          if (answerMs) {
            await interaction.editReply({
              embeds: [
                new EmbedBuilder()
                  .setTitle("⏱ Timer Complete!")
                  .setDescription(
                    `Time is up!⚡ You have ${
                      answerMs / 1000
                    } seconds to post your answers.`
                  )
                  .setColor("Green"),
              ],
            });
          } else {
            await interaction.editReply({
              embeds: [
                new EmbedBuilder()
                  .setTitle("⏱ Timer Complete!")
                  .setDescription(`Time is up!⚡`)
                  .setColor("Green"),
              ],
            });
          }
          await interaction.followUp({
            content: `${pingRole} your time is up!`,
            AllowedMentions: { roles: [pingRole.id] },
          });

          // Return players
          const returnChannel = interaction.options.getChannel("return");

          if (returnChannel && returnChannel.type === ChannelType.GuildVoice) {
            // Loop through all voice channels in the guild
            interaction.guild.channels.cache
              .filter((channel) => channel.type === ChannelType.GuildVoice)
              .forEach((voiceChannel) => {
                console.log(`Going through ${voiceChannel.name}`);
                voiceChannel.members.forEach(async (member) => {
                  try {
                    // Move each member to the specified return channel
                    if (member.voice.channelId !== returnChannel.id) {
                      await member.voice.setChannel(returnChannel);
                    }
                  } catch (err) {
                    console.error(`Failed to move ${member.user.tag}:`, err);
                  }
                });
              });
          } else {
            console.error(`ERROR with return channel`);
          }

          if (answerMs) {
            let remainingAnswerMs = answerMs;

            const answerInterval = setInterval(async () => {
              remainingAnswerMs -= 1000;

              if (remainingAnswerMs <= 0) {
                clearInterval(answerInterval);
                await interaction.followUp({
                  content: `STOP! All answers are submitted.`,
                });
              }
            }, 1000);
          }
        } else {
          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setTitle("⏱ Timer")
                .setDescription(
                  `Time remaining: **${Math.ceil(
                    remainingTimerMs / 1000
                  )} seconds**`
                )
                .setColor("Blue"),
            ],
          });
        }
      }, 1000);
    } else if (subcommand === "teams") {
      const numTeams = interaction.options.getInteger("total");
      const teamSize = interaction.options.getInteger("size");
      const end = interaction.options.getBoolean("end");

      if (!numTeams && !teamSize && !end) {
        return interaction.reply({
          content:
            "❌ You must specify either number of teams or team size if you want to make a team.",
          ephemeral: true,
        });
      }

      if (end) {
        const member = interaction.member;

        const currentChannel = member.voice.channel;
        // Get the category of that voice channel
        const category = interaction.member.voice.channel.parent;

        if (!category) {
          return interaction.reply({
            content: "❌ Your voice channel is not in a category.",
            ephemeral: true,
          });
        }

        // Get all voice channels in this category
        const voiceChannels = interaction.guild.channels.cache.filter(
          (ch) =>
            ch.parentId === category.id &&
            ch.type === ChannelType.GuildVoice &&
            ch.id != currentChannel.id
        );

        voiceChannels.forEach(async (channel) => {
          try {
            await channel.delete();
          } catch (err) {
            console.error(`failed to delete ${channel.name}`, err);
          }
        });

        return interaction.reply({
          content: "✅  Complete. Removed extra channels.",
          ephemeral: true,
        });
      } else {
        const quizRole = interaction.guild.roles.cache.find(
          (r) => r.name === "quizplayer"
        );
        if (!quizRole) {
          return interaction.reply({
            content: '❌ Could not find a role named "quizplayer".',
            ephemeral: true,
          });
        }

        // Collect members with quizplayer role who are connected to voice
        const members = quizRole.members.filter((m) => m.voice.channel);
        if (members.size === 0) {
          return interaction.reply({
            content: "❌ No quizplayers are in a voice channel.",
            ephemeral: true,
          });
        }

        const players = Array.from(members.values());
        // Shuffle members
        players.sort(() => Math.random() - 0.5);

        // Determine number of teams
        let teams = [];
        if (numTeams) {
          const size = Math.ceil(players.length / numTeams);
          for (let i = 0; i < numTeams; i++) {
            teams.push(players.slice(i * size, (i + 1) * size));
          }
        } else if (teamSize) {
          for (let i = 0; i < players.length; i += teamSize) {
            teams.push(players.slice(i, i + teamSize));
          }
        }

        // Get the category of that voice channel
        const category = interaction.member.voice.channel.parent;

        if (!category) {
          return interaction.reply({
            content: "❌ Your voice channel is not in a category.",
            ephemeral: true,
          });
        }

        // Create channels & move members
        for (let i = 0; i < teams.length; i++) {
          if (teams[i].length === 0) continue;
          const teamChannel = await interaction.guild.channels.create({
            name: `Team ${i + 1}`,
            type: ChannelType.GuildVoice,
            parent: category.id,
          });

          for (const member of teams[i]) {
            try {
              await member.voice.setChannel(teamChannel);
            } catch (err) {
              console.error(`Failed to move ${member.user.tag}`, err);
            }
          }
        }

        await interaction.reply({
          content: `✅ Created ${teams.length} team(s) and moved players!`,
        });
      }
    } else if (subcommand === "scoreboard") {
      await interaction.deferReply();

      const scores = await quizCurrentSchema.find().sort({ points: -1 });
      const players = await quizPlayersSchema.find();

      // Build nickname map
      const nicknameMap = new Map(players.map((p) => [p.userId, p.name]));

      // Build leaderboard string
      const scoreboard = buildScoreboard(scores, nicknameMap, scores.length);

      await interaction.editReply({
        embeds: [
          {
            title: "🏆 Current Scores",
            description: scoreboard,
            color: 0xffd700, // gold
          },
        ],
      });
    } else if (subcommand === "leaderboard") {
      await interaction.deferReply();

      try {
        const players = await quizPlayersSchema
          .find()
          .sort({ totalPoints: -1 });

        if (players === 0) {
          return interaction.editReply("No players found in the database.");
        }

        // Build nickname lookup
        const nicknameMap = new Map(players.map((p) => [p.userId, p.name]));

        let currentRank = 0;
        let lastScore = null;
        const medals = ["🥇", "🥈", "🥉"]; // top 3 emojis

        // Build scoreboard
        const leaderboard = players
          .map((player, index) => {
            const displayName =
              nicknameMap.get(player.userId) || player.username;

            if (player.totalPoints !== lastScore) {
              currentRank = index + 1;
              lastScore = player.totalPoints;
            }

            const rank = medals[currentRank - 1] || `${currentRank}.`;
            return `${rank} ***${displayName}*** - ${player.totalPoints} points`;
          })
          .join("\n");

        await interaction.editReply({
          embeds: [
            {
              title: "🏆 Leaderboard",
              description: leaderboard,
              color: 0xffd700, // gold
            },
          ],
        });
      } catch (error) {
        interaction.editReply(error);
      }
    }
  },
};

/**
 * Build a leaderboard string from scores + optional nicknames.
 *
 * @param {Array} scores - Array of player objects, sorted by totalPoints (descending).
 *   Each player should have { userId, username, totalPoints }.
 * @param {Map} nicknameMap - Map of userId → nickname (optional).
 * @param {number} limit - Max number of players to show (default 10).
 * @returns {string} leaderboard string
 */
function buildScoreboard(scores, nicknameMap = new Map(), limit = 10) {
  const medals = ["🥇", "🥈", "🥉"];
  let currentRank = 0;
  let lastScore = null;
  let skips = 0;

  return scores
    .slice(0, limit)
    .map((player, index) => {
      const displayName = nicknameMap.get(player.userId) || player.username;

      // Competition ranking logic (1224 style)
      if (player.points === 0 && lastScore !== 0) {
        currentRank = currentRank + 1;
        lastScore = player.points;
      } else if (player.points === 0 && lastScore === 0) {
        currentRank = currentRank;
        lastScore = player.points;
      } else if (player.points !== lastScore) {
        currentRank = index + 1;
        lastScore = player.points;
      }

      const rankDisplay = medals[currentRank - 1] || `${currentRank}.`;
      return `${rankDisplay} ***${displayName}*** - ${player.points} points`;
    })
    .join("\n");
}

async function awardTopPoints() {
  try {
    const players = await quizPlayersSchema.find();
    // 1️⃣ Fetch all players sorted by current points descending
    const scores = await quizCurrentSchema.find().sort({ points: -1 });

    const rankPoints = [5, 4, 3, 2, 1]; // top 5 points
    let currentRank = 0;
    let lastScore = null;

    for (let i = 0; i < scores.length; i++) {
      const player = scores[i];

      // Determine if this player gets a new rank or shares last one
      if (player.points === 0 && lastScore !== 0) {
        currentRank = i + 1;
        lastScore = player.points;
      } else if (player.points === 0 && lastScore === 0) {
        currentRank = currentRank;
        lastScore = player.points;
      } else if (player.points !== lastScore) {
        currentRank = i + 1;
        lastScore = player.points;
      }

      // Only award points to top 5 ranks
      if (currentRank <= 5) {
        const pointsToGive = rankPoints[currentRank - 1];
        const playerDoc = await quizPlayersSchema.findOne({
          userId: player.userId,
        });
        if (playerDoc) {
          playerDoc.totalPoints += pointsToGive;
          await playerDoc.save();
          console.log(
            `${playerDoc.username} awarded ${pointsToGive} points in players collection`
          );
        } else {
          console.warn(
            `Player with userId ${player.userId} not found in players collection`
          );
        }
      }
    }

    console.log("Top 5 points awarded successfully!");
  } catch (err) {
    console.error("Error awarding top points:", err);
  }
}
