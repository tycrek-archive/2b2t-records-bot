const CATEGORY = 'utility';

/* Imports */
const { MessageEmbed } = require('discord.js');
const UUID = require('uuid').v4;
const client = require('../bot').client;
const prefix = require('../bot').prefix;
const UsageEmbed = require('../UsageEmbed');
const { log, trash, Command } = require('../utils');

// export command functions
module.exports = {

	uptime: new Command(CATEGORY, null, (cmd, msg) => {
		let totalSeconds = client.uptime / 1000;
		let hours = (totalSeconds / (60 * 60)).toString().split('.')[0];
		let minutes = (totalSeconds / 60 % 60).toString().split('.')[0];
		let seconds = (totalSeconds % 60).toString().split('.')[0];

		msg.channel.send(
			new MessageEmbed()
				.setTitle(`Bot has been active for ${hours} hours, ${minutes} minutes, ${seconds} seconds`))
			.then((botMsg) => trash(msg, botMsg))
			.catch((err) => log.warn(err));
	})
}