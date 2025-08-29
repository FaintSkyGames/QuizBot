//const { Client, Events, GatewayIntentBits, Partials } = require("discord.js");
//const {EmbedBuilder, ChannelType } = require('discord.js');
const mongoose = require('mongoose');
const quizCurrentSchema = require('../../schemas/quizCurrentSchema');

const QUIZ_HOST_ROLE = "quizhost";

const numberEmojis = ["0️⃣","1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"];

const numberMap = { 
    "0️⃣": "0",
    "1️⃣": "1",
    "2️⃣": "2",
    "3️⃣": "3",
    "4️⃣": "4",
    "5️⃣": "5",
    "6️⃣": "6",
    "7️⃣": "7",
    "8️⃣": "8",
    "9️⃣": "9",
    "🔟": "10"
}

module.exports = {
  name: "messageReactionRemove",  // event name
  async execute(reaction, user, client) {

    // Your logic here, e.g., subtract points
    console.log(`${user.tag} removed a reaction: ${reaction.emoji.name}`);

    if (user.bot) return;

    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        console.error("❌ Failed to fetch reaction:", error);
        return;
      }
    }

    const guild = reaction.message.guild;
    if (!guild) return;

    const member = await guild.members.fetch(user.id);
    if(!member.roles.cache.some(role => role.name === QUIZ_HOST_ROLE)) return;

    // Only handle number emojis
    if (!numberEmojis.includes(reaction.emoji.name)) return;

    const emoji = reaction.emoji.name;
    const toTake = parseInt(numberMap[emoji], 10);

    try{
        const playerDoc = await quizCurrentSchema.findOne({userId: reaction.message.author});
        if (!playerDoc) return;

        playerDoc.points -= toTake;
        await playerDoc.save();

        await reaction.message.channel.send(
            `➖ ${reaction.message.author} lost ${toTake} points`
        );

    } catch (error) {
        console.log(error);
    }      
  }
};