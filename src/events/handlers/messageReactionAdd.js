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
  name: "messageReactionAdd",  // event name
  async execute(reaction, user, client) {
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

    // Now the message has been cached and is fully available
	console.log(`${reaction.message.author}'s message "${reaction.message.content}" gained a reaction! Called ${reaction.emoji.name}`);

    if (numberEmojis.includes(reaction.emoji.name)) {

        const emoji = reaction.emoji.name;
        const toGive = parseInt(numberMap[emoji], 10);

        try{
            const playerDoc = await quizCurrentSchema.findOne({userId: reaction.message.author});

            playerDoc.points += toGive;
            await playerDoc.save();

            await reaction.message.channel.send(
                `➕ ${reaction.message.author} recieved ${toGive} points`
            );

        } catch (error) {
            console.log(error);

        }      
    }

  }
};