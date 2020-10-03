const CATEGORY = 'fun';

/* Imports */
const { MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');
const prefix = require('../bot').prefix;
const UsageEmbed = require('../UsageEmbed');
const { log, trash, Command } = require('../utils');

// export command functions
module.exports = {

	namemc: new Command(CATEGORY, new UsageEmbed('namemc', '', false, ['username'], ['Minecraft username to get a link from NameMC']), (cmd, msg) => {
		const args = msg.content.slice(prefix.length).trim().split(/ +/);
		let command = args.shift();

		if (args.length === 0)
			return cmd.help(msg);

		msg.channel.send(
			new MessageEmbed()
				.setTitle(`${args[0]} on NameMC`)
				.setColor(0x234875)
				.setURL(`https://namemc.com/s?${args[0]}`)
				.setFooter('https://namemc.com'))
			.then((botMsg) => trash(msg, botMsg))
			.catch((err) => log.warn(err));
	}),

	mcskin: new Command(CATEGORY, new UsageEmbed('mcskin', '', false, ['username'], ['Minecraft username to display a skin for']), (cmd, msg) => {
		const args = msg.content.slice(prefix.length).trim().split(/ +/);
		let command = args.shift();

		if (args.length === 0)
			return cmd.help(msg);

		msg.channel.send(
			new MessageEmbed()
				.setTitle(`${args[0]}'s Minecraft skin`)
				.setColor(0xFF4136)
				.setImage(`https://minotar.net/armor/body/${args[0]}/150.png`)
				.setFooter('https://minotar.net'))
			.then((botMsg) => trash(msg, botMsg))
			.catch((err) => log.warn(err));
	})
}
