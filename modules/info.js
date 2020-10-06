const CATEGORY = 'info';

/* Imports */
const { MessageEmbed } = require('discord.js');
const UsageEmbed = require('../UsageEmbed');
const { log, trash, Command } = require('../utils');

// export command functions
module.exports = {

	// Thanks coolguy284#5720 for making this hella smaller
	help: new Command(CATEGORY, null, (cmd, msg) =>
		msg.channel.send(
			new MessageEmbed()
				.setTitle('Bot commands')
				.setColor(0x002d4e)
				.setThumbnail('https://cdn.discordapp.com/icons/664189110562586625/32f4c97d13c073e458c3ddaa8dfe30c4.png?size=4096')
				.setFooter('Created by tycrek')
				.addFields(['info', 'fun', 'utility', /* 'voice' */, 'moderator', 'admin', 'records'].map(category => ({
					name: category[0].toUpperCase() + category.slice(1), // crappy way to capitalize 1st letter
					value: Object.keys(require('./' + category)).map(c => `\`&${c}\``).join('\n'),
					inline: true
				}))))
			.then((botMsg) => trash(msg, botMsg))
			.catch((err) => log.warn(err))),



	// 	about: new Command(CATEGORY, null, (cmd, msg) =>
	// 		msg.channel.send(
	// 			new MessageEmbed({
	// 				"title": "Hello! :wave:",
	// 				"description": "I'm a Discord bot. You can check out my **[source code](https://github.com/tycrek/2b2t-records-bot/)**.\n\nRun `&help` to see a list of commands.\n",
	// 				"color": 16776960,
	// 				"footer": "Created by tycrek",
	// 				"thumbnail": "https://cdn.discordapp.com/icons/664189110562586625/32f4c97d13c073e458c3ddaa8dfe30c4.png?size=4096"
	// 			})
	// 				.setThumbnail('https://cdn.discordapp.com/icons/664189110562586625/32f4c97d13c073e458c3ddaa8dfe30c4.png?size=4096'))
	// 			.then((botMsg) => trash(msg, botMsg)))
}

module.exports.commands = module.exports.help;
