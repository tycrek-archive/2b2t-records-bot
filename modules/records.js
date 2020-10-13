const CATEGORY = 'admin';

/* Imports */
const { MessageEmbed } = require('discord.js');
const fs = require('fs-extra');
const path = require('path');
const { log, trash, filter, noPermission, Command } = require('../utils');
const { prefix, owner } = require('../bot');
const UsageEmbed = require('../UsageEmbed');

// export command functions
module.exports = {
	record: new Command(CATEGORY, new UsageEmbed('record', ' ', false,
		[
			'user',
			'record',
			'value',
			'screenshotUrl',
			'mcusername',
			'colour'
		],
		[
			'Discord username',
			'What record got broken (deaths, block mined, etc). Use hyphens to indicate a space.',
			'Numerical value of the record',
			'URL to the screenshot for proof',
			'Minecraft username for skin',
			'Colour for Embed accent (use &colours to see available colours)'
		]), (cmd, userMsg) => {
			const args = userMsg.content.slice(prefix.length).trim().split(/ +/);
			let command = args.shift();

			if (args.length < 6)
				return cmd.help(userMsg);

			// New record data
			let discordUser = args[0];
			let title = args[1];
			let value = args[2].replace(/[a-zA-Z]/g, '');
			let units = args[2].replace(/[0-9]/g, '');
			let screenshot = args[3];
			let mcusername = args[4];
			let colour = args[5];

			// New record object
			let record = fs.readJsonSync(path.join(__dirname, '../data/__new_record.json'));
			record.category = userMsg.channel.name.split('-')[0].trim().toLowerCase();
			record.title = title;
			record.discord = discordUser;
			record.minecraft = mcusername;
			record.value = value + units;
			record.url = screenshot;
			record.colour = colour;
			record.message = null;

			// Read all existing records
			let records = fs.readJsonSync(path.join(__dirname, '../data/records.json'));

			// Get ID of old message to delete if applicable
			let oldMsg;
			if (records.records[record.category][title])
				oldMsg = records.records[record.category][title].message;

			// Apply new record to object
			records.records[record.category][title] = record;

			// Send the record message
			userMsg.channel.send(
				new MessageEmbed()
					.setTitle(`${title.replace(/\-/g, ' ')}`)
					.setImage(screenshot)
					.setColor(colour)
					.addField('Record', numberWithCommas(value) + units, true)
					.addField('Set by', `${discordUser} (${mcusername})`, true))
				.then((botMsg) => record.message = botMsg.id)
				.then(() => Promise.all([userMsg.delete ? userMsg.delete() : true, oldMsg ? userMsg.channel.messages.delete(oldMsg) : true, fs.writeJson(path.join(__dirname, '../data/records.json'), records, { spaces: '\t' })]))
				.then(() => log.info(`Added record ${title}`))
				.catch((err) => log.warn(err));

			function numberWithCommas(x) {
				return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
			}
		}),

	migrate: new Command(CATEGORY, null, (cmd, userMsg) => {
		const args = userMsg.content.slice(prefix.length).trim().split(/ +/);
		let command = args.shift();

		let oldChannel = userMsg.guild.channels.cache.get(args[0]), newChannel = userMsg.guild.channels.cache.get(args[1]);

		userMsg.channel.send(`Confirm migration from \`${oldChannel.name}\` to \`${newChannel.name}\``)
			.then((botMsg) => Promise.all([botMsg, botMsg.react('🟢'), botMsg.react('🔴')]))
			.then((results) => results[0].awaitReactions((reaction, user) => (reaction.emoji.name === '🟢' || reaction.emoji.name === '🔴') && user.id === userMsg.author.id, { max: 1 }))
			.then((collected) => {
				if (collected.first()._emoji.name !== '🟢') throw new Error('Cancelled migration');

				// Migrate
				return oldChannel.messages.fetch({ limit: 90 });
			})
			.then((fullMessages) => fullMessages.map(({ content, attachments, mentions }) => ({ content, attachments, mentions })))
			.then((messages) =>
				messages.map((message) => () =>
					new Promise((resolve) =>
						userMsg.channel.send(
							new MessageEmbed()
								.setTitle(`Migrating record`)
								.setDescription(
									`**Text**:\n${message.content}` + '\n\n\n' +
									`**User**: ${message.mentions.users.first()}` + '\n\n\n' +
									`**Proof URL**: ${message.attachments.first() ? message.attachments.first().url : 'see previous or next message for url'}` + '\n\n\n' +
									`To continue, run the following command:` + '\n\n' +
									`\`  &confirm user record value screenshotUrl mcusername colour\`` + '\n\n' +
									`Tip: right-click the user mentioned in this message to mention them in a private channel` + '\n'
								))
							.then((botMsg) => botMsg.channel.awaitMessages((confirmMsg) => confirmMsg.content.trim().toLowerCase().startsWith('&confirm') && confirmMsg.author.id === userMsg.author.id, { max: 1 }))
							.then((collected) => {
								let mArgs = collected.first().content.slice(prefix.length).trim().split(/ +/);
								mArgs.shift();
								mArgs = mArgs.join(' ');

								let newMsg = JSON.parse(JSON.stringify(userMsg));
								newMsg.content = '&record ' + mArgs;
								newMsg.channel = newChannel;
								newMsg.guild = userMsg.guild;
								newMsg.author = userMsg.author;

								module.exports.record.execute(newMsg);
							})
							.catch((err) => log.warn(err))
							.finally(resolve)
					)
				)
			)
			.then((promises) => {
				doPromises(0)
					.then((index) => userMsg.channel.send(`Completed migration of \`${index}\` messages from **${oldChannel.name}** to **${newChannel.name}**`))
					.catch((err) => log.warn(err));

				function doPromises(index) {
					return new Promise((resolve, reject) => {
						promises[index] ? promises[index]()
							.then(() => doPromises(index + 1))
							.then(resolve)
							.catch(reject) : resolve(index);
					});
				}
			})
			.catch((err) => log.warn(err));
	}),

	search: new Command(CATEGORY, new UsageEmbed('search', ' ', false, ['category', 'query'], ['Category to search in', 'What to search for'], ['Example: `&search mob zombies killed`']), (cmd, msg) => {
		const args = msg.content.slice(prefix.length).trim().split(/ +/);
		let command = args.shift();

		if (args.length < 2)
			return cmd.help(msg);

		let category = args.shift();
		let query = args.join(' ').toLowerCase();

		fs.readJson(path.join(__dirname, '../data/records.json'))
			.then((records) => records.records)
			.then((records) => {
				if (records[category]) return records[category];
				else throw new Error('Category not found');
			})
			.then((category) => [category, Object.keys(category).filter((record) => record.toLowerCase().includes(query))])
			.then((results) => {
				if (results[1].length === 0) throw new Error('No results found');
				else return results[1].map((result) => results[0][result]);
			})
			.then((results) => results.map((record) => `**Record**: \`${record.title.replace(/\-/g, ' ')}\`\n**Set by**: ${record.discord} (${record.minecraft})\n[Click to go to record](https://discordapp.com/channels/664189110562586625/${msg.guild.channels.cache.find((channel) => channel.name.includes(category)).id}/${record.message})`))
			.then((formattedResults) =>
				msg.channel.send(new MessageEmbed()
					.setTitle(`Results for \`${query}\` in category \`${category}\``)
					.setDescription(formattedResults.join('\n\n'))))
			.catch((err) => {
				log.warn(err);
				msg.channel.send(err.message);
			});
	})
}
