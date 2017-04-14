const commando = require('discord.js-commando');

class kick extends commando.Command
{
	constructor(client)
	{
		super(client,
			{
				name	:	'kick',
				group	:	'admin',
				memberName: 'kick',
				description:'Kicks a user from the server.'
			});
	}
	
	async run(message, args)
	{
		
	}
	
	
}
	
module.exports()