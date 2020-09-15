/* Imports */
const { MessageEmbed } = require('discord.js');
const { log, filter, noPermission } = require('../utils');
const prefix = require('../bot').prefix;
const owner = require('../bot').owner;
const UsageEmbed = require('../UsageEmbed');
const moment = require('moment-timezone');
moment.tz.setDefault('UTC');

// export command functions
module.exports = {

	clear: (msg) => {
		const args = msg.content.slice(prefix.length).trim().split(/ +/);
		let channel = msg.channel;

		if (args.length !== 2)
			return msg.channel.send(new UsageEmbed('clear', '', false, ['amount'], ['How many messages to delete from the channel'], ['No maximum (that I know of :wink:)']));

		// amount is total user wants deleted plus the message calling the command
		let amount = parseInt(args[1]) + 1;

		// leftover is messages when amount is below 100, or the remainder when amount > 100
		// This is required since bulkDelete only deletes 100 at a time
		let leftover = amount % 100;

		// Discord API won't let us delete more than 100 messages at a time
		hundredPlus(amount)

			// Delete the messages not included in the bulk delete (this is always less than 100)
			.then(() => channel.bulkDelete(leftover))

			// Tell the user we deleted all the messages
			.then(() => {
				log.info(`Deleted ${amount - 1} (${amount}) messages`);
				return channel.send(`:bomb: Deleted **\`${args[1]}\`** messages!`);
			})

			// Delete the bot message after 1.5 seconds
			.then((bombMessage) => setTimeout(() => bombMessage.delete(), 1500))
			.catch((err) => log.warn(err));

		// Deletes more than 100 messages
		function hundredPlus(amount) {
			// Resolves once we have deleted x hundred messages
			return new Promise((resolve) => {

				// If requested amount can be done all at once, resolve
				if (amount < 100) return resolve(0);

				// How many times we will need to delete 100 messages
				let iterations = parseInt((amount / 100).toString().split('.')[0]);

				// Used for logging purposes
				let completed = 0;
				let total = iterations * 100;

				// Each set of 100 is a separate Promise
				let promises = [];

				// Create the promisese
				for (let i = 0; i < iterations; i++) {
					promises.push(() => new Promise((resolve) => {
						log.info(`Bulk deletion task section [${i}] is running!`);

						// Delete bulk messages
						channel.bulkDelete(100)
							.then(() => {

								// Update completed and log progress
								completed += 100;
								log.info(`Bulk deletion task section [${i}] completed: Deleted ${completed} / ${total} bulk messages (${amount} total)`);

								// Wait two seconds before continuing. Two possible scenarios:
								//  1. We are on the last task and want to resolve everything back out of promises[0]
								//       completed === total ? resolve(total)
								//  2. We are not on the last task and need to recursively call the next task
								//       promises[i + 1]().then((result) => resolve(result))
								setTimeout(() => completed === total ? resolve(total) : promises[i + 1]().then((result) => resolve(result)), 2500);
							});
					}));
				}

				// Wait for all deletion tasks to complete
				promises[0]()
					.then((result) => {
						log.info(`Bulk deletion task complete! Deleted ${result} messages out of ${amount} total`);
						setTimeout(() => resolve(result), 2500);
					})
					.catch((err) => log.warn(err));
			});
		}
	},

	kick: (msg) => {
		const args = msg.content.slice(prefix.length).trim().split(/ +/);

		if (args.length < 3)
			return msg.channel.send(new UsageEmbed('kick', ' ', false, ['@user', 'reason'], ['User to kick (must be a mention)', 'Reason to kick user'], ['Reason does not have to be wrapped in quotes (" ")']));

		args.shift(); // Remove the command
		args.shift(); // Remove the user
		let reason = args.join(' ');

		let nick = msg.mentions.members.first().user.username;

		// Kick the user
		msg.mentions.members.first().kick(reason)
			.then(() => {
				let result = `Kicked **${nick}** for: *${reason}*`;
				log.info(result);
				return msg.reply(result);
			})
			.catch((err) => log.warn(err));
	},

	drole: (msg) => {
		let roleId, roleName;
		try {
			roleId = msg.mentions.roles.first().id;
			roleName = msg.mentions.roles.first().name;
		} catch (err) {
			log.warn(err);
			return msg.channel.send(new UsageEmbed('drole', '', false, ['@role'], ['Role to delete from the server']));
		}

		msg.guild.roles.fetch(roleId)
			.then((role) => role.delete())
			.then(() => msg.channel.send(`Deleted role ${roleName}`))
			.catch((err) => log.warn(err));
	},

	crole: (msg) => {
		let args = msg.content.slice(prefix.length).trim().split(/ +/);
		let command = args.shift(); // Remove the command

		// Sort the args by quotes
		args = args.join(' ').split(/" "+/);

		// Remove quote on the first argument
		args[0] = args[0].substring(1);

		// Remove quote on the last argument
		let lastArg = args[args.length - 1];
		args[args.length - 1] = lastArg.substring(0, lastArg.length - 1);

		// Check if the command has the required number of arguments
		if (args.length != 4)
			return msg.channel.send(
				new UsageEmbed(command, '" "', true,
					['name', 'color', 'permissions', 'mentionable'],
					[
						'String. Can have spaces.',
						'Must be a [ColorResolvable](https://discord.js.org/#/docs/main/stable/typedef/ColorResolvable)',
						'Must be `NONE` or a [PermissionResolvable](https://discord.js.org/#/docs/main/stable/typedef/PermissionResolvable)',
						'Boolean.'
					],
					['All parameters must be contained within "quotes"']
				));

		// Create the role!
		msg.guild.roles.create(
			{
				data: {
					name: args[0],
					color: args[1],
					permissions: args[2] === 'NONE' ? 0 : /\d/g.test(args[2]) ? parseInt(args[2]) : args[2],
					mentionable: args[3] == 'true'
				}
			})
			.then((role) => msg.channel.send(`Role [${role.toString()}] created`))
			.catch((err) => log.warn(err));
	},

	steal: (msg) => {
		const args = msg.content.slice(prefix.length).trim().split(/ +/);
		args.shift(); // Remove command from args

		if (args.length < 1)
			return msg.channel.send(new UsageEmbed('steal', '', false, [':emoji:'], ['Emoji to steal and add to current server'], ['To steal multiple emoji, separate each with a space', 'Both static and animated emoji can be stolen']));

		//! MASSIVE rate limit if you do this too fast
		if (args.length > 5)
			return msg.reply('slow down, buckaroo! Only do 5 emoji at a time.');

		// iterate through the added emoji (must be seperated with a space in message)
		for (let arg of args)
			msg.guild.emojis.create(`https://cdn.discordapp.com/emojis/${arg.split(':')[2].replace('>', '')}${arg.startsWith('<a:') ? '.gif?v=1' : '.png?v=1'}`, arg.split(':')[1])
				.then((emoji) => msg.reply(`added ${emoji}`))
				.catch((err) => log.warn(err));
	},

	vote: (msg) => {
		const args = msg.content.slice(prefix.length).trim().split(/ +/);
		args.shift(); // Remove command from args

		msg.channel.send(new MessageEmbed()
			.setTitle('Vote now!')
			.setDescription(args.join(' ')))
			.then((msg) => Promise.all([msg.react('👍'), msg.react('👎')]));
	}
}