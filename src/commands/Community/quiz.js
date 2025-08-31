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

const QUIZ_HOST_ROLE = "quizhost"; // name of the role
const QUIZ_PLAYER_ROLE = "quizplayer";

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
    // Command execution logic goes here

    // Get current subcommand
    const subcommand = interaction.options.getSubcommand();

    const guild = interaction.guild;

    //const quizPlayersDB = mongoose.models.players  || mongoose.model('players', quizPlayersSchema);
    //const PlayersDB = mongoose.models.PlayersDB || mongoose.model('PlayersDB', quizPlayersSchema, 'players');

    if (subcommand == "start") {
      try {
        await interaction.deferReply();

        // Find the role by name
        const hostRole = guild.roles.cache.find(
          (r) => r.name === QUIZ_HOST_ROLE
        );
        if (!hostRole)
          return interaction.editReply(
            `The role "${QUIZ_HOST_ROLE}" is required.`
          );

        await guild.members.fetch();
        const host = guild.members.cache.filter((member) =>
          member.roles.cache.has(hostRole.id)
        );

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
              `Error: No quiz started. There is an existing quiz hosted by ${hostUsernames}`
            )
            .setTimestamp();

          await interaction.editReply({ embeds: [embed] });
        } else {
          // Assign host
          const hostId = interaction.options.getUser("host");

          // Find role in guild
          const hostRole = guild.roles.cache.find(
            (r) => r.name === QUIZ_HOST_ROLE
          );
          if (!hostRole)
            return interaction.editReply(
              `The role "${QUIZ_HOST_ROLE}" is required.`
            );

          // Assign role
          const member = await guild.members.fetch(hostId);
          member.roles
            .add(hostRole)
            .then(() =>
              console.log(
                `${member.user.tag} was given the role "${QUIZ_HOST_ROLE}"!`
              )
            )
            .catch((err) => console.error(`Failed to assign role: ${err}`));

          // Assign cohost

          // Add to DB
          const allPlayers = await quizPlayersSchema.find(); // Fetch all
          const check = `<@${hostId.id}>`;

          for (const player of allPlayers) {
            if (player.userId != check) {
              await quizCurrentSchema.create({
                userId: player.userId,
                points: 0,
              });
            }
          }

          const embed = new EmbedBuilder()
            .setColor("Random")
            .setTitle("Start Quiz")
            .setDescription(`${member}s quiz is starting soon!`)
            .setTimestamp();

          await interaction.editReply({ embeds: [embed] });
        }
      } catch (error) {
        interaction.editReply(error);
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

        // clear host & cohost roles

        const hostRole = guild.roles.cache.find(
          (r) => r.name === QUIZ_HOST_ROLE
        );
        if (!hostRole) return console.log(`Role "${QUIZ_HOST_ROLE}" not found`);

        const members = await guild.members.fetch();
        const membersWithRole = members.filter((member) =>
          member.roles.cache.has(hostRole.id)
        );

        for (const member of membersWithRole.values()) {
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
      } catch (error) {
        interaction.editReply(error);
      }

      // const embed = new EmbedBuilder()
      //     .setColor('Random')
      //     .setTitle('End Quiz')
      //     .setDescription(`Thank you for joining the quiz!`)
      //     .setTimestamp()

      // await interaction.reply({embeds: [embed]});
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
      let remainingMs = timerMs;

      // Initial embed
      const embed = new EmbedBuilder()
        .setTitle("⏱ Timer")
        .setDescription(
          `Time remaining: **${Math.ceil(remainingMs / 1000)} seconds**`
        )
        .setColor("Blue");

      const message = await interaction.reply({
        embeds: [embed],
        withResponse: true,
      });

      const interval = setInterval(async () => {
        remainingMs -= 1000;

        if (remainingMs <= 0) {
          clearInterval(interval);
          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setTitle("⏱ Timer Complete!")
                .setDescription(`Time is up! ${pingRole} ⚡`)
                .setColor("Green"),
            ],
          });

          await interaction.followUp({
            content: `${pingRole} your time is up!`,
            AllowedMentions: { roles: [pingRole.id] },
          });

          // Return players
          const returnChannel = interaction.options.getChannel("return");

          console.log(returnChannel);

          if (returnChannel && returnChannel.type === ChannelType.GuildVoice) {
            // Loop through all voice channels in the guild
            interaction.guild.channels.cache
              .filter((channel) => channel.type === ChannelType.GuildVoice)
              .forEach((voiceChannel) => {

                console.log(`Going through ${voiceChannel.name}`);
                voiceChannel.members.forEach(async (member) => {
                    console.log(`moveing ${member.user.tag}`);
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
        } else {
          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setTitle("⏱ Timer")
                .setDescription(
                  `Time remaining: **${Math.ceil(remainingMs / 1000)} seconds**`
                )
                .setColor("Blue"),
            ],
          });
        }
      }, 1000);
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
