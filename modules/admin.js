const CATEGORY = 'admin';

/* Imports */
const { MessageEmbed } = require('discord.js');
const fs = require('fs-extra');
const path = require('path');
const { log, trash, filter, noPermission, Command } = require('../utils');
const { prefix, owner } = require('../bot');
const UsageEmbed = require('../UsageEmbed');
const TycrekCert = require('tycrek-certs-custom');

// export command functions
module.exports = {

	getconfig: new Command(CATEGORY, null, (cmd, msg) => {
		const args = msg.content.slice(prefix.length).trim().split(/ +/);
		args.shift();

		cmd.getConfig(msg, args)
			.then((result) => msg.channel.send(`\`\`\`json\n${JSON.stringify(result, null, 2)}\`\`\``))
			.then((botMsg) => trash(msg, botMsg));
	}),

	setconfig: new Command(CATEGORY, null, (cmd, msg) => {
		const args = msg.content.slice(prefix.length).trim().split(/ +/);
		args.shift();

		cmd.setConfig(msg, args)
			.then((result) => msg.channel.send(result))
			.then((botMsg) => trash(msg, botMsg));
	}),

	/* stats: new Command(CATEGORY, null, (cmd, msg) => {
		const args = msg.content.slice(prefix.length).trim().split(/ +/);
		let command = args.shift();
		let category = args.join('-');

		let age = msg.guild.createdTimestamp;
		let everyone = msg.guild.roles.everyone.id;
		let configPath = path.join(__dirname, `../config/servers/guild.${msg.guild.id}.json`);

		let members = bots = 0;

		msg.guild.members.cache.each((member) => member.user.bot ? bots++ : members++);

		msg.guild.channels.create(category, { type: 'category' })
			.then((c) => c.setPosition(0))
			.then((c) => Promise.all([
				fs.readJson(configPath),
				c.id,
				c.guild.channels.create(`Members: ${members}`, { type: 'voice', parent: c.id, permissionOverwrites: [{ id: everyone, deny: 1048576 }, { id: require('../bot').client.user.id, allow: 1048592 }] }),
				c.guild.channels.create(`Bots: ${bots}`, { type: 'voice', parent: c.id, permissionOverwrites: [{ id: everyone, deny: 1048576 }, { id: require('../bot').client.user.id, allow: 1048592 }] })
			]))
			.then((results) => {
				let config = results[0];
				config.stats = {
					parent: results[1],
					members: results[2].id,
					bots: results[3].id
				};
				return config;
			})
			.then((config) => fs.writeJson(configPath, config, { spaces: '\t' }))
			.then(() => msg.channel.send('Stats channels created successfully.'))
			.then((botMsg) => trash(msg, botMsg))
			.catch((err) => log.warn(err));
	}),

	delstats: new Command(CATEGORY, null, (cmd, msg) => {
		let configPath = path.join(__dirname, `../config/servers/guild.${msg.guild.id}.json`);

		let config;
		fs.readJson(configPath)
			.then((mConfig) => config = mConfig)
			.then(() => { if (!config.stats) throw Error('No stats data in config') })
			.then(() => msg.guild.channels)
			.then((channels) => Promise.all([channels.resolve(config.stats.parent), channels.resolve(config.stats.members), channels.resolve(config.stats.bots)]))
			.then((stats) => Promise.all(stats.map((statChannel) => statChannel.delete())))
			.then((_results) => msg.channel.send('Deleted stats channels'))
			.then((botMsg) => trash(msg, botMsg))
			.catch((err) => log.warn(err));
	}), */

	record: new Command(CATEGORY, new UsageEmbed('record', ' ', false, ['user', 'record', 'value', 'screenshotUrl', 'mcusername', 'colour'], ['Discord username', 'What record got broken (deaths, block mined, etc). Use hyphens to indicate a space.', 'Numerical value of the record', 'URL to the screenshot for proof', 'Minecraft username for skin', 'Colour for Embed accent (use &colours to see available colours)']), (cmd, msg) => {
		if (!filter.author(msg, owner)) return noPermission(msg);
		const args = msg.content.slice(prefix.length).trim().split(/ +/);
		let command = args.shift();

		if (args.length < 6)
			return cmd.help(msg);

		let discordUser = args[0];
		let record = args[1];
		let value = args[2].replace(/[a-zA-Z]/g, '');
		let units = args[2].replace(/[0-9]/g, '');
		let screenshot = args[3];
		let mcusername = args[4];
		let colour = args[5];

		msg.channel.send(
			new MessageEmbed()
				.setTitle(`${record.replace(/\-/g, ' ')}`)
				.setImage(screenshot)
				.setColor(colour)
				.addField('Record', numberWithCommas(value) + units, true)
				.addField('Set by', `${discordUser} (${mcusername})`, true))
			.then((botMsg) => msg.delete())
			.catch((err) => log.warn(err));

		function numberWithCommas(x) {
			return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		}
	})
}
