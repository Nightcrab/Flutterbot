const Discord = require('discord.js');
const bot = new Discord.Client();

var fs = require('fs');
var settings = JSON.parse(fs.readFileSync('./config.json'));
var prefix = settings.prefix;

var onlinelol = true;
var logid = 0;
var replycheck = ['false','false','false'];
var spamwatch =
{
	imgspam	:	[
		['author','time','images posted']
	],
	
	repeatspam:	[
		['author','time','times repeated']
	],
	
	textspam:	[
		['author','time','times abused']
	],
	
	mentionspam:[
		['author','time','times mentioned']
	],
	
	joinspam:	[
		['author','time','times joined/left']
	]
};

spamwatch.imgspam.length = 0;
spamwatch.repeatspam.length = 0;
spamwatch.textspam.length = 0;
spamwatch.mentionspam.length = 0;
spamwatch.joinspam.length = 0;

var bot_protection = false;
var stopall = [false,null];
var speech;
var arguments;
var namen;
var	type;
var currentChannel;
var messagelog = [];

function getName(args,position)
{
	if (args.length == position+1)
	{
		return args[position];
	}

	let namei = args[position].toString();
		
	for (i=position+1;i<args.length;i++)
	{
		namei = namei+' '+args[i].toString();
	}

	return namei;
	
}

var commandTable =
{
	complex	:	[
		{
			name	:	'kick',
			desc	:	'Kicks a user.',
			args	:	2,
			reqmsg	:	true,
			execute	:	function(argus,msg)
			{
				console.log('kicking user?');
				
				argus.shift();
				arguments = argus;				
				console.log(arguments);
				
				let user;
				
				type = arguments[0];
				namen = getName(arguments,1);
				
				if (type !== 'id' && type !== 'name' && type !== 'user')
				{
					currentChannel.send("Invalid Usage");
					return;
				}
				if (namen.startsWith("<@") == true)
				{
					user = mentiontouser(namen);
				} 
				else if (namen == undefined)
				{
					currentChannel.send('Missing Arguments: Name not specified');
					return;
				}
				else if (type == 'name')
				{
					user = findUser(namen, msg.guild, 'name').user;
				}
				else
				{
					user = findUser(namen, msg.guild, 'id').user;
				}
				
				console.log(namen);
				{

					if (user !== 'unknown')
					{
						user.kick();
						currentChannel.send("Sorry "+user.username+". \n"+user.username+" was kicked.")
					}
					else
					{
						currentChannel.send("Failed to find that user.");
					}
				
					
				}
			}		
		},
		
		{
			name	:	'botprotection',
			desc	:	'Autosilences and deroles new, unauthorised bots upon entry.',
			args	:	1,
			reqmsg	:	true,
			execute	:	function(argus,msg)
			{
				argus.shift();
				arguments = argus.toString();
				
				if (msg.author == bot.user)
				{
					if (arguments == 'false')
					{
						currentChannel.send("Bot Protection was deactivated.");
						bot_protection = false;
					}
					else if (arguments == 'true')
					{
						bot_protection = true;
						currentChannel.send("Bot Protection was activated.");
					} else
					{
						currentChannel.send("Invalid Usage:\n!botprotection (true, false)");
					}
					
				} else
					
				{
					currentChannel.send("You are not permitted to use this command!");
				}
			}
		},
		
		{
			name	:	'say',
			desc	:	"It's a mystery.",
			args	:	1,
			reqmsg	:	true,
			execute	:	function(argus,msg)
			{
				argus.shift();
				if (argus < this.args)
				{
					currentChannel.send("Missing arguments");
					return;
				}
				arguments = argus;
				speech = getName(arguments,0);
				
				if (hasRole(msg.member, 'Owner') == true)
				{
					msg.delete();
					currentChannel.send(speech);
				}
				else
				{
					currentChannel.send('Insufficient Permissions. You must be Owner to use this command. Sorry '+msg.author.username+'.');
				}
			}
		},
		
		{
			name	:	'msg',
			desc	:	'Messages another user.',
			args	:	2,
			reqmsg	:	true,
			execute :	function(argus,msg)
			{
				argus.shift();
				if (argus < this.args)
				{
					currentChannel.send("Missing arguments: requires id and message");
					return;
				}
				arguments = argus;
				namen = argus[0];
				speech = getName(arguments, 1);
				//console.log(msg);
				
				bot.users.get(argus[0]).send(speech);
				msg.delete();
				console.log('sent message: '+speech);
			}
		},
		
		{
			name	:	'nick',
			desc	:	'Nicknames a user.',
			args	:	2,
			reqmsg	:	true,
			execute	:	function(argus,msg)
			{
				argus.shift();
				if (argus.length < this.args)
				{
					currentChannel.send("Missing arguments: requires (id,mention) and new nickname");
					return;
				}
				arguments = argus;
				type = arguments[0];
				namen = getName(arguments, 1)
				
				if (type == 'me')
				{
					msg.member.setNickname(namen);
				} 
				else if (type.startsWith('<@'))
				{
					findUser((mentiontouser(type).id), msg.guild, 'id').setNickname(namen);
				}
				else
				{
					findUser(type, msg.guild, 'id').setNickname(namen);
				}
				

			}
		},
		
		{
			name	:	'roll',
			desc	:	'Rolls a die.',
			args	:	1,
			reqmsg	:	true,
			execute	:	function(argus,msg)
			{
				argus.shift();
				arguments = argus;
				if (argus.length < this.args)
				{
					arguments[0] = 6;
				}
				
				type = arguments[0];
				
				currentChannel.send("You rolled a "+type+"-sided die and got: "+getRandomInt(1,type));
			}
		},
		
		
		{
			name	:	'8ball',
			desc	:	'Magic eight ball.',
			args	:	1,
			reqmsg	:	false,
			execute	:	function()
			{
				var ans = getRandomInt(1,4);
				
				if (ans == 1)
				{
					currentChannel.send("I believe so.");
				}
				if (ans == 2)
				{
					currentChannel.send("Not likely.");
				}
				if (ans == 3)
				{
					currentChannel.send("Who told you that?");
				}
				if (ans == 4)
				{
					currentChannel.send("Of course.");
				}
			}
		},
		
		{
			name	:	'tribonacci',
			desc	:	"Calculates tribonacci sequence.",
			args	:	4,
			reqmsg	:	true,
			execute	:	function(argus,msg)
			{
				argus.shift();
				
				if (argus.length < this.args)
				{
					currentChannel.send("Missing arguments: requires 3 seeds and amount of values to sequence");
					return;
				}
				
				var seed1 = parseInt(argus[0]);
				var seed2 = parseInt(argus[1]);
				var seed3 = parseInt(argus[2]);
				var num	= parseInt(argus[3]);
				
				var sequence = [seed1,seed2,seed3];
				
				namen = '';
				
				for (i=4;i<num;i++)
				{
					sequence.push(sequence[i-2]+sequence[i-3]+sequence[i-4]);
				}
				currentChannel.send("``Check your Direct Messages!``");
				
				msg.author.send(sequence);
				//msg.author.send(sequence[sequence.length-2]/sequence[sequence.length-3]);
			}
		},
		
		{
			name	:	'info',
			desc	:	"Displays a user's information.",
			args	:	1,
			reqmsg	:	true,
			execute	:	function(argus,msg)
			{
				argus.shift();
				namen = getName(argus,0);

				var infouser;
				
				if (namen.startsWith("<@") == true)
				{
					infouser = mentiontouser(namen);
				} 
				else
				{
					infouser = findUser(namen, msg.guild,'name').user;
				}

				if (infouser == undefined)
				{
					msg.channel.send("Couldn't find "+namen+" ...sorry...");
					return;
				}
				let joindate = new Date(findUser(infouser.id, currentChannel.guild, 'id').joinedTimestamp);
				currentChannel.send("As you requested: \nUsername: "+infouser.username+"\nDiscriminator: "+infouser.discriminator+"\nID: "+infouser.id+"\nAvatar: "+infouser.displayAvatarURL+"\nStatus: "+infouser.presence.status+"\nDate joined: "+joindate.toString());
			}
		},
		
		{
			name	:	'setconfig',
			desc	:	"Changes a setting in the  bot's config file.",
			args	:	2,
			reqmsg	:	true,
			execute	:	function(argus,msg)
			{
				argus.shift();
				
				if (argus.length != 2)
				{
					currentChannel.send("Lacking arguments");
					return;
				}
				
				if (argus[0] == 'prefix')
				{
					settings.prefix = argus[1];
					changeconfig(argus[0],argus[1]);
				} 
				else if (argus[0] == 'linkspam_cooldown')
				{
					settings.linkspam_cooldown = parseInt(argus[1]);
					changeconfig(argus[0],argus[1]);
				}
				else if (argus[0] == 'leave_alert')
				{
					settings.leave_alert = stringToBool(argus[1]);
					changeconfig(argus[0],argus[1]);
				}
				else if (argus[0] == 'join_alert')
				{
					settings.join_alert = stringToBool(argus[1]);
					changeconfig(argus[0],argus[1]);
				}
				else if (argus[0] == 'update_alert')
				{
					settings.update_alert = stringToBool(argus[1]);
					changeconfig(argus[0],argus[1]);
				}
				settings = JSON.parse(fs.readFileSync('./config.json'));
				prefix = settings.prefix;
			}
		},
		
		{
			name	:	'clear',
			desc	:	'Deletes specified amount of messages from channel',
			args	:	1,
			reqmsg	:	true,
			execute	:	function(argus,msg)
			{
				argus.shift();
				if (argus.length != 1)
				{
					currentChannel.send("Lacking arguments");
				}
				
				currentChannel.bulkDelete(argus[0]+1);
				currentChannel.send("Removed "+argus[0]+" messages!");
			}
		},
		
		{
			name	:	'execute',
			desc	:	"Don't even try it. eval() command.",
			args	:	1,
			reqmsg	:	true,
			execute	:	function(argus,msg)
			{
				
				if (msg.author.id !== '108090007117438976')
				{
					return;
				}
				
				argus.shift();
				namen = '';
				
				for (i=0;i<argus.length;i++)
				{s
					namen = namen+' '+argus[i];
				}
				
				eval(namen);
			}
		}
		
	],
	
	basic	:	[
		
		{
			name	:	'about',
			desc	:	'Displays bot information.',
			reqmsg	:	false,
			execute	:	function()
			{
				currentChannel.send("I was created by:\n"+bot.users.get('108090007117438976').username+"\n"+bot.users.get('108090007117438976').id);
			}
		},	
		
		{
			name	:	'help',
			desc	:	'Displays all commands.',
			reqmsg	:	true,
			execute	:	function(msg)
			{
				namen = '';
				
				for (i=0;i<commandTable.complex.length;i++)
				{
					namen = namen+commandTable.complex[i].name+': '+commandTable.complex[i].desc+'\n';
				}
				for (i=0;i<commandTable.basic.length;i++)
				{
					namen = namen+commandTable.basic[i].name+': '+commandTable.basic[i].desc+'\n';
				}
				
				msg.channel.send('```'+namen+'```');
			}	
		},
		
		{
			name	:	'log',
			desc	:	'Saves message log to file.',
			reqmsg	: false,
			execute	:	function()
			{
				//console.log('logging\n'+messagelog);
				type = false;
				
				namen = '';
				
				for (i=0;i<messagelog.length;i++)
				{
					namen = namen+messagelog[i][2]+' - '+messagelog[i][0]+'|'+messagelog[i][1]+': '+messagelog[i][3]+'\n';
				}
					
				fs.writeFile('./Archive/log'+newfileid()+'.txt', namen, function (err) 
				{
					if (err) return console.log(err);
				});
				
				currentChannel.send('Logged '+messagelog.length+' messages!');
				messagelog.length = 0;
				
			}
		},
		
		{
			name	:	'ping',
			desc	:	"Gets response time in ms.",
			reqmsg	:	true,
			execute	:	function(msg)
			{
				console.log(msg.createdTimestamp);
				msg.reply(`Response Time: \`${Date.now() - msg.createdTimestamp} ms!\``);
			}
		},
		
		{
			name	:	'stopall',
			desc	:	"Pauses the channel.",
			reqmsg	:	true,
			execute :	function(msg)
			{
				currentChannel.send("Channel is now paused!");
				stopall = [true, msg.channel];
			}
		},
		
		{
			name	:	'startall',
			desc	:	"Unpauses the channel.",
			reqmsg	:	false,
			execute :	function()
			{
				stopall[0] = false;
			}
		},
		
		{
			name	:	'checkprimes',
			desc	:	'retired command',
			reqmsg	:	false,
			execute	:	function()
			{
				var primes = [];
				
				namen = '';
				
				for (i=0;i<primes.length;i++)
				{
					var abcde = primes[i].toString();
					if (abcde.split('').includes('2') && abcde.split('').includes('9') && abcde.split('').includes('7') && abcde.split('').includes('3'))
					{
						namen = namen+abcde;
					}
				}
				
				console.log(abcde.split('').includes('9'));
			}
		},
		
		{
			name	:	'manual',
			desc	:	'DMs you with a full command guide and an explanation of all the configs.',
			reqmsg	:	true,
			execute	:	function(msg)
			{
				let guide = "```\
kick ['name','id'] (name or id) //kicks a user by their username or id //example !kick name T-Feeshy \n\
msg	(id) (msg) //anonymously messages a user by their id or mention //example !msg 202531123564118011 hello there \n\
nick (id, mention) (nickname) //nicknames a user //example !nick 202531173564118016 I like cake \n\
roll (number of sides)	//rolls a die //example !roll 8 \n\
8ball (question) //magic 8 ball	//example !8ball does Kyu love me? \n\
tribonacci (seed1)(seed2)(seed3) (number of terms) //DMs you a tribonacci sequence using 3 seeds and the number of terms you want calculated //example !tribonacci 1 4 3 90 \n\
info (mention, username) //Posts a user's id, name, avatar, nickname, time of join, etc. //example !info @Q. Celestia#1380 \n\
setconfig (config name) (new value) //Changes a config //example !setconfig prefix > \n\
clear (number of messages) //Deletes specified amount of messages from channel //example !clear 40 \n\
				```.";
				msg.author.send(guide);
			}
			
		}
		
	],
	
	chat	:	[
		
		{
			name	:	'hello',
			desc	:	'Hello.',
			reqmsg	:	true,
			execute	:	function(msg)
			{
				
			}
		}
	]
}
function mentiontouser(mention)
{
	let userid = mention.split('');
	userid.shift();
	userid.shift();
	userid.pop();
	if (bot.users.get(userid.toString().replace(/,/g,"")) !== undefined)
	{
		return bot.users.get(userid.toString().replace(/,/g,""));
	}
		return 'unknown';
}

function changeconfig(change,newval)
{
	fs.writeFileSync('./config.json', JSON.stringify(settings, null, 4), function (err) 
	{
		if (err) return console.log(err);
	});
	currentChannel.send('Set '+change+' to '+newval+'!');
}

function joinString(array)
{
	var joinedstr = '';
	
	for (i=0;i<array.length;i++)
	{
		joinedstr = joinedstr+array[i];
	}
	
	return joinedstr;
}

function stringToBool(string)
{
	if (string == 'true')
	{
		return true;
	}
	else if (string == 'false')
	{
		return false;
	}
	
	return true;
	console.log('string is not a boolean!');
}

function checkCommand (com,msg)
{
	var branch = commandTable;
	var mcom = '';
	//console.log(msg);
	
	let msgsplit = msg.content.split('').splice(0,settings.prefix.length);
	
	if (msgsplit == prefix)
	{
		console.log(msgsplit);
		if (msg.content.split(' ').length > 1)
		{
			branch = commandTable.complex;
			
		} else
		{
			branch = commandTable.basic;
		}
	}
	else
	{
		branch = commandTable.chat;
	}
	
	if (branch == commandTable.basic || branch == commandTable.complex)
	{
		mcom = maCommandIs(msg)[0].split('');
		mcom.shift();
		mcom = joinString(mcom);
	}
	else
	{
		mcom = com;
	}
	
	if (com !== joinString(msg.content.split(' ')[0]))
	{
		//console.log('not command '+com);
		//console.log('tested against: '+maCommandIs(msg)[0]);
		return;
	}
	
	//console.log('is command: '+mcom);
	//console.log(branch);
	
	for (i=0;i<branch.length;i++)
	{
		if (branch[i].name.toLowerCase() == mcom)
		{
			console.log('found command');
			if (branch[i].reqmsg == true && branch == commandTable.complex)
			{	
				console.log(msg.content.split(' '));
				branch[i].execute(msg.content.split(' '), msg);
				
			}
			else if (branch[i].reqmsg == true && branch == commandTable.basic)
			{
				branch[i].execute(msg);
				console.log('basic command');
				
			} 
			else if (branch[i].reqmsg == true && branch == commandTable.chat)
			{
				branch[i].execute(msg.content.split(' '));
			}
			else
				
			branch[i].execute(msg.content.split(' '));
			return;
		}
	}
}

function newfileid()
{
	for (i=0;i<100;i++)
	{
		if (fs.existsSync('./Archive/log'+i+'.txt') == false)
		{
			return i;
		}
	}
}

function checkUserDiff(oldm,newm)
{
	console.log('old name:'+oldm.user+'\nnewname:'+newm);
	
	if (oldm.nickname !== newm.nickname)
	{
		return 'username';
	} 
	else if (oldm.user.avatar !== newm.user.avatar)
	{
		return 'avatar';
	}
	else if (oldm.roles.equals(newm.roles) == false)
	{
		return 'role';
	}
	
	return 'nope';
}

function findUser(name, gld, mode)
{
	var channelarr = gld.members.array();
	
	if (mode == 'name')
	{
		for (i=0;i<gld.members.array().length;i++)
		{
			if (gld.members.array()[i].user.username == name)
			{
				return gld.members.array()[i];
			}
		}

		return 'unknown';
	}
	
	if (mode == 'id')
	{
		for (i=0;i<gld.members.array().length;i++)
		{
			if (gld.members.array()[i].user.id == name)
			{
				return gld.members.array()[i];
			}
		}
		
		return 'unknown';
	}
}

function CommandIs(string,msg)
{
	return msg.content.startsWith('!'+string);
}

function getRandomInt(min, max) 
{
 	min = Math.ceil(min);
  	max = Math.floor(max);
  	return Math.floor(Math.random() * (max - min)) + min;
}
				
function maCommandIs(msg)
{
	var messg = msg.toString();
	var newstring = messg.split(' ');
	
	return newstring;
}

function pluck(array)
{
	return array.map(function(item){return item['name'];});
}

function hasRole(member, role)
{
	if (pluck(member.roles).includes(role))
	{
		return true;
	}
	else
	{
		return false;
	}
}

function sendreply(msg,member)
{
	var mes = msg.content.toLowerCase()
	
	function mci(a)
	{
		return maCommandIs(a);
	}
		
	if (replycheck[2] == 'thanks')
	{
		
		if (mci(mes)[0] == 'thanks' || mci(mes)[0] == 'thanks!' || mci(mes)[0] == 'thanks.')
		{
			msg.channel.send("No problem, "+member.username+'!');
			replycheck = ['false','false','false'];
		}
	}
	
	if (replycheck[2] == 'yesthanks')
	{
		if (mci(mes)[0] == 'sure' || mci(mes)[0] == 'sure.' || mci(mes)[0] == 'yes' || mci(mes)[0] == 'yes!')
		{
			msg.channel.send("Got it, "+member.username+'!');
			replycheck = ['false','false','false'];
		}
	}
		
}

function spamcheck(msg)
{
	function checkAuthor(array, author)
	{
		for (i=0;i<array.length;i++)
		{
			if (array[i][0] == author.id)
			{
				console.log('same author');
				return array[i]; 
			}
		}
		console.log('different author, '+array)
		return false;
	}
	
	for (i=0;i<spamwatch.mentionspam.length;i++)
	{
		//if (spamwatch.mentionspam[i][1] ==  )
		//{
			
		//}
	}
	
	if (msg.content.split(':')[0] == 'https' || msg.content.split(':')[0] == 'http')
	{
		console.log('link');
		if (checkAuthor(spamwatch.imgspam, msg.author) !== false)
		{
			if (Date.now() - checkAuthor(spamwatch.imgspam, msg.author)[1] > settings.linkspam_cooldown)
			{
				checkAuthor(spamwatch.imgspam, msg.author)[1] = Date.now();
				return;
			}
			
			checkAuthor(spamwatch.imgspam, msg.author)[2] += 1; 
			
			if (checkAuthor(spamwatch.imgspam, msg.author)[2] == settings.linkwarn_limit)
			{
				currentChannel.send(msg.author+', you are posting too many links!');
				console.log(spamwatch);
			}
			
			if (checkAuthor(spamwatch.imgspam, msg.author)[2] > settings.linkkick_limit)
			{
				findUser(msg.author.username, msg.guild, 'name').kick();
				currentChannel.send('Kicked '+msg.author.username+'!');
			}
			
		} 
		else
		{
			spamwatch.imgspam.push([msg.author.id, Date.now(), 1]);
		}
	}
	if (msg.mentions.users.size > 0)
	{
		if(msg.mentions.users.size > 4)
		{
			currentChannel.send(msg.author+', you are posting too many mentions!');
		}
		if (checkAuthor(spamwatch.mentionspam, msg.author) !== false)
		{
			checkAuthor(spamwatch.mentionspam, msg.author)[2] += 1; 
			
			if (checkAuthor(spamwatch.mentionspam, msg.author)[2] == 4)
			{
				currentChannel.send(msg.author+', you are posting too many mentions!');
				console.log(spamwatch);
			}
			
			if (checkAuthor(spamwatch.mentionspam, msg.author)[2] > 4)
			{
				findUser(msg.author.username, msg.guild, 'name').kick();
				currentChannel.send('Kicked '+msg.author.username+'!');
			}
		}
		else
		{
			spamwatch.mentionspam.push([msg.author.id, Date.now(), 1]);
		}
		console.log(spamwatch);
	}
	
}

bot.on('guildMemberUpdate', (oldMember, newMember) =>
{
	if (settings.update) { return; }
	console.log('member changed something')
	
	var updatetype = checkUserDiff(oldMember, newMember);
	
	if (updatetype == 'avatar')
	{
		newMember.guild.defaultChannel.send('I like your new avatar, '+newMember.user.username+'!');
		replycheck = ['true',newMember.user,'thanks'];
	} else if (updatetype == 'role')
	{
		newMember.guild.defaultChannel.send('Congratulations on your new role, '+newMember.user.username+'!');
		replycheck = ['true',newMember.user,'thanks'];
		
	} else if (updatetype == 'username')
	{
		if (newMember.nickname !== null)
		{
			newMember.guild.defaultChannel.send('I guess I shall call you '+newMember.nickname+' from now on, '+oldMember.user.username+'?');
		}
		else
		{
			newMember.guild.defaultChannel.send('Should I go back to calling you '+oldMember.user.username+' then, '+oldMember.user.username+'?');
		}
		
		replycheck = ['true',newMember.user,'yesthanks'];
	}
	
	if (updatetype == 'nope')
	{
		console.log('failed to identify update type');
	}
	
});

bot.on('guildMemberAdd', (member) =>
{
	if (settings.join) { return; }
	console.log('new member');
	
	member.guild.defaultChannel.send('Welcome to the chat, '+member.user.username+'!');
	
	if (member.user.bot == true && bot_protection == true)
	{
		member.guild.defaultChannel.send('Bot detected! Kicking bot - bot is unauthorised!');
		member.kick();
	}
});

bot.on('guildMemberRemove', (member) =>
{
	if (settings.leave) { return; }
	var time = new Date().getTime();
	var date = new Date(time);
	
	messagelog.push([member.user.id, member.user.username, date.toString(), 'left server!']);
});

bot.on('message', (message) => 
{
	
	if (message.author !== bot.user)
	{
		//return;
	}
	
	if (stopall[0] == true && message.channel == stopall[1] && message.author.id != 300809826164801539 )
	{
		checkCommand('!startall',message);
		message.delete();
	}
	else
	
	var name = '';
	currentChannel = message.channel;
	console.log(message.author.username+': '+message.content);
	
	var time = new Date().getTime();
	var date = new Date(time);
	//alert(date.toString());
	
	messagelog.push([message.author.id, message.author.username, date.toString(), message.content]);
	
	//if (message.content.split('').length > 200)
	//{
	//	message.delete();
	//	currentChannel.send("Removed "+message.author.username+"'s message. \nReason: Too Long!");
		
	//} else
		
	//console.log(message.content.split('').length);
	
	if (message.member.hasPermission('KICK_MEMBERS') || message.author.id == '108090007117438976')
	{
		checkCommand(prefix+'kick',message);
	}
	if (message.member.hasPermission('MANAGE_NICKNAMES') || message.author.id == '108090007117438976')
	{
		checkCommand(prefix+'nick',message);
	}
	if (message.member.hasPermission('ADMINISTRATOR') || message.author.id == '108090007117438976')
	{
		checkCommand(prefix+'say',message);
	}
	
	checkCommand(prefix+'about',message);
	checkCommand(prefix+'botprotection',message);
	//checkCommand(prefix+'say',message);
	checkCommand(prefix+'ping',message);
	checkCommand(prefix+'msg',message);
	checkCommand(prefix+'help',message);
	checkCommand(prefix+'log',message);
	checkCommand(prefix+'roll',message);	
	checkCommand(prefix+'8ball',message);
	checkCommand(prefix+'tribonacci',message);	
	checkCommand(prefix+'info',message);
	checkCommand(prefix+'stopall',message);
	checkCommand(prefix+'checkprimes',message);
	checkCommand(prefix+'setconfig',message);
	checkCommand(prefix+'clear',message);
	checkCommand(prefix+'execute',message);
	checkCommand(prefix+'manual',message);
	
	if (messagelog.length > settings.logperiod)
	{
		currentChannel.send("Automatically logging messages...")
		commandTable.basic[2].execute();
	}
	
	spamcheck(message);
	
	//console.log(message.author);
	
	//findUser('test',message.guild);
	
	if (replycheck[0] == 'true' && message.author == replycheck[1])
	{
		console.log('replying');
		sendreply(message,message.author);
	}
	
	//if (message.author.bot == true && message.author.username !== 'FlutterBot 3.0')
	//{
	//	message.channel.send("I don't think I'm suposed to talk to other bots...");
	//}
	
	if (onlinelol == true)
	{
		if (message.content.toLowerCase() == 'hey flutterbot' || 
			message.content.toLowerCase() == 'hello flutterbot'|| 
			message.content.toLowerCase() == 'hello, flutterbot'|| 
			message.content.toLowerCase() == 'hey, flutterbot'|| 
			message.content.toLowerCase() == 'hello flutterbot.'||
			message.content.toLowerCase() == 'hello, flutterbot.'|| 
			message.content.toLowerCase() == 'hey, flutterbot'||
			message.content.toLowerCase() == 'hey, flutterbot.'||
			message.content.toLowerCase() == '!hello'
		   )
		{
			message.channel.send('Hello, '+message.author.username+'!');
		}
	}
	
});

bot.login('MzAwODA5ODI2MTY0ODAxNTM5.C8x4lA.d4aQRLkdySz2JiXcz7CesMkCb34');
