const Discord = require('discord.js');
const bot = new Discord.Client();

var fs = require('fs');
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

var bot_protection = true;
var speech;
var arguments;
var namen;
var currentChannel;
var messagelog = [];

function getName(args,position)
{
	if (args.length == position+1)
	{
		return args[position];
	}

	var namei = args[position].toString();
		
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
			desc	:	'Kicks a user',
			args	:	2,
			reqmsg	:	true,
			execute	:	function(argus,msg)
			{
				console.log('kicking user?');
				
				argus.shift();
				
				arguments = argus;				
				console.log(arguments);
				
				var type = arguments[0];
				namen = getName(arguments,1);
				
				if (type != 'id' && type != 'name')
				{
					currentChannel.sendMessage("Invalid Usage:\n!kick (id, name) ([username], [userid])");
					return;
				}
				
				if (namen == null)
				{
					currentChannel.sendMessage('Missing Arguments: Name not specified');
					return;
				}
				
				console.log(namen);
				
				{

					if (hasRole(msg.member, 'Owner') == true)
					{
						currentChannel.sendMessage("Sorry "+namen+". \n"+namen+" was kicked.");
						
						if (findUser(namen, msg.guild, type) != 'unknown')
						{
							findUser(namen, msg.guild, type).kick();
						} else
						{
							currentChannel.sendMessage("Failed to find that user, maybe try a different identifier? (id, name)");
						}
					} else
						
					{
						currentChannel.sendMessage('Insufficient Permissions. You must be Owner to use this command. Sorry '+msg.author.username+'.');
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
				if (argus.length == 1)
				{
					currentChannel.sendMessage("Please state true/false.");
					return;
				} else
					
				console.log(argus);
				
				argus.shift();
				
				arguments = argus.toString();
				
				if (msg.author == bot.user)
				{
					if (arguments == 'false')
					{
						currentChannel.sendMessage("Bot Protection was deactivated.");
						bot_protection = false;
					}
					else if (arguments == 'true')
					{
						bot_protection = true;
						currentChannel.sendMessage("Bot Protection was activated.");
					} else
					{
						currentChannel.sendMessage("Invalid Usage:\n!botprotection (true, false)");
					}
					
				} else
					
				{
					currentChannel.sendMessage("You are not permitted to use this command!");
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
				arguments = argus;
				speech = getName(arguments,0);
				
				if (hasRole(msg.member, 'Owner') == true)
				{
					msg.delete();
					currentChannel.sendMessage(speech);
				}
				else
				{
					currentChannel.sendMessage('Insufficient Permissions. You must be Owner to use this command. Sorry '+msg.author.username+'.');
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
				arguments = argus;
				namen = argus[0];
				speech = getName(arguments, 1);
				
				//'204073983769968640'.dmChannel.sendMessage(speech);
				//console.log('sent message: '+speech);
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
				console.log('user used !about command');
				
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
				
				msg.channel.sendMessage(`\`${namen}\``);
			}	
		},
		
		{
			name	:	'log',
			desc	:	'Saves message log to file',
			reqmsg	: false,
			execute	:	function()
			{
				console.log('logging\n'+messagelog);
				
				namen = '';
				
				for (i=0;i<messagelog.length;i++)
				{
					namen = namen+messagelog[i][2]+' - '+messagelog[i][0]+'|'+messagelog[i][1]+': '+messagelog[i][3]+'\n';
				}
					
				fs.writeFile('./Archive/log'+logid+'.txt', namen, function (err) {
				if (err) return console.log(err);
				});
				messagelog.length = 0;
				logid += 1;
				
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

function joinString(array)
{
	var joinedstr = '';
	
	for (i=0;i<array.length;i++)
	{
		joinedstr = joinedstr+array[i];
	}
	
	return joinedstr;
}

function checkCommand (com,msg)
{
	var branch = commandTable;
	var mcom = '';
	//console.log(msg);
	
	if (com.split('')[0] == '!')
	{
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
		//mcom = com;
	}
	
	if (com != joinString(msg.content.split(' ')[0]))
	{
		console.log('not command '+com);
		console.log('tested against: '+maCommandIs(msg)[0]);
		return;
	}
	
	console.log('is command: '+mcom);
	console.log(branch);
	
	for (i=0;i<branch.length;i++)
	{
		if (branch[i].name == mcom)
		{
			console.log('found command');
			if (branch[i].reqmsg == true && branch == commandTable.complex)
			{	
				console.log(msg.content.split(' '));
				branch[i].execute(msg.content.split(' '),msg);
				
				return;
			} else if (branch[i].reqmsg == true && branch == commandTable.basic)
			{
				branch[i].execute(msg);
				console.log('basic command');
				return;
			} else
				
			branch[i].execute(msg.content.split(' '));
			return;
		}
	}
}


function checkUserDiff(oldm,newm)
{
	console.log('old name:'+oldm.user+'\nnewname:'+newm);
	
	if (oldm.nickname != newm.nickname)
	{
		return 'username';
	}
	
	if (oldm.user.avatar != newm.user.avatar)
	{
		return 'avatar';
	}
	
	if (oldm.roles.equals(newm.roles) == false)
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
			msg.channel.sendMessage("No problem, "+member.username+'!');
			replycheck = ['false','false','false'];
		}
	}
	
	if (replycheck[2] == 'yesthanks')
	{
		if (mci(mes)[0] == 'sure' || mci(mes)[0] == 'sure.' || mci(mes)[0] == 'yes' || mci(mes)[0] == 'yes!')
		{
			msg.channel.sendMessage("Got it, "+member.username+'!');
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
	
	if (msg.content.split(':')[0] == 'https')
	{
		console.log('link');
		if (checkAuthor(spamwatch.imgspam, msg.author) != false)
		{
			checkAuthor(spamwatch.imgspam, msg.author)[2] += 1; 
			
			if (Number.isInteger(checkAuthor(spamwatch.imgspam, msg.author)[2]/3) == true)
			{
				currentChannel.sendMessage(msg.author+', you are posting too many links!');
			}
			
			if (checkAuthor(spamwatch.imgspam, msg.author)[2] > 4)
			{
				findUser(msg.author.username, msg.guild, 'name').kick();
				currentChannel.sendMessage('Kicked '+msg.author.username+'!');
			}
			
		} else
		{
			spamwatch.imgspam.push([msg.author.id, Date.now(), 1]);
		}
	}
		
	
	
}

bot.on('disconnect', () =>
{
	
});

bot.on('guildMemberUpdate', (oldMember, newMember) =>
{
	console.log('member changed something')
	
	var updatetype = checkUserDiff(oldMember, newMember);
	
	if (updatetype == 'avatar')
	{
		newMember.guild.defaultChannel.sendMessage('I like your new avatar, '+newMember.user.username+'!');
		replycheck = ['true',newMember.user,'thanks'];
	}
	
	if (updatetype == 'role')
	{
		newMember.guild.defaultChannel.sendMessage('Congratulations on your new role, '+newMember.user.username+'!');
		replycheck = ['true',newMember.user,'thanks'];
	}
	
	if (updatetype == 'username')
	{
		if (newMember.nickname != null)
		{
			newMember.guild.defaultChannel.sendMessage('I guess I shall call you '+newMember.nickname+' from now on, '+oldMember.user.username+'?');
		}
		else
		{
			newMember.guild.defaultChannel.sendMessage('Should I go back to calling you '+oldMember.user.username+' then, '+oldMember.user.username+'?');
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
	console.log('new member');
	
	member.guild.defaultChannel.sendMessage('Welcome to the chat, '+member.user.username+'!');
	
	if (member.user.bot == true && bot_protection == true)
	{
		member.guild.defaultChannel.sendMessage('Bot detected! Kicking bot - bot is unauthorised!');
		member.kick();
	}
});

bot.on('message', (message) => 
{
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
	//	currentChannel.sendMessage("Removed "+message.author.username+"'s message. \nReason: Too Long!");
		
	//} else
		
	//console.log(message.content.split('').length);
	
	
	checkCommand('!about',message);
	checkCommand('!kick',message);
	checkCommand('!botprotection',message);
	checkCommand('!say',message);
	checkCommand('!ping',message);
	checkCommand('!msg',message);
	checkCommand('!help',message);
	checkCommand('!log',message);
	
	if (messagelog.length > 20)
	{
		currentChannel.sendMessage("Automatically logging messages...")
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
	
	//if (message.author.bot == true && message.author.username != 'FlutterBot 3.0')
	//{
	//	message.channel.sendMessage("I don't think I'm suposed to talk to other bots...");
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
			message.channel.sendMessage('Hello, '+message.author.username+'!');
		} else

		if (CommandIs('shutdown', message) == true || CommandIs('stop', message) == true)
		{	
			if (hasRole(message.member, 'Owner') == true)
			{
				message.channel.sendMessage('Oh, uh, okay. Disconnecting...');
				onlinelol = false;
			}
			else
			{
				message.channel.sendMessage('Insufficient Permissions. You must be Owner to use this command. Sorry '+message.author.username+'.');
			}
		} else
		
		if (maCommandIs(message)[0] == '!nick' && maCommandIs(message)[2] != undefined)
		{
			name = maCommandIs(message)[2];

			if (maCommandIs(message).length > 3)
			{
				for (i=3;i<maCommandIs(message).length;i++)
				{
					name = name+' '+maCommandIs(message)[i];
				}
			}
			
			if (maCommandIs(message)[1] == 'me' || maCommandIs(message)[1] == message.author.username)
			{
				console.log('renaming author to '+name);
				findUser(message.author.username,message.guild,'name').setNickname(name); 
			}
			else
			{
				findUser(maCommandIs(message)[1],message.guild,'id').setNickname(name);
			}
		} else
		
		if (maCommandIs(message)[0] == '!info' && maCommandIs(message)[1] != undefined)
		{
			name = maCommandIs(message)[1];

			if (maCommandIs(message).length > 2)
			{
				for (i=2;i<maCommandIs(message).length;i++)
				{
					name = name+' '+maCommandIs(message)[i];
				}
			}
			
			var infouser = findUser(name,message.guild,'name');
			
			if (infouser == 'unknown')
			{
				message.channel.sendMessage("Couldn't find "+name+" ...sorry...");
				return;
			}
			
			message.channel.sendMessage("As you requested: \nUsername: "+infouser.user.username+"\nID: "+infouser.user.id+"\nAvatar: "+infouser.user.displayAvatarURL+"\nStatus: "+infouser.user.presence.status);
		} else
		
		if (CommandIs('about', message))
		{
			message.channel.sendMessage('I was created by: Q. Celestia #1380 or userid: 108090007117438976')
		} else
		
		if (CommandIs('help', message))
		{
			//message.channel.sendMessage("A list of my current functions:\n!about : Displays my info\n!shutdown : Turns me off\n!stop : Turns me off\n!activate : Turns me back on\n!say: Does nothing\n!hello : Hello\n!kick (id, name) ([username], [userid]) : Kicks a user\n!info [id] : Tells you about a user\n!nick ('me',id) [nickname] : Gives a user a nickname")
		}
	}	
			
	if (CommandIs('activate',message) && onlinelol == false)
	{
		if (hasRole(message.member, 'Owner') == true)
		{
			message.channel.sendMessage('Flutterbot is now online. Yay.');
			onlinelol = true;
		}
		else
		{
			message.channel.sendMessage('Insufficient Permissions. You must be Owner to use this command. Sorry '+message.author.username+'.');
		}
	}
	
	if (message.content == 'splicetest')
	{
		var spliced = [0,1,2,3,4,5,6].splice(1,0);
		var sliced = [0,1,2,3,4,5,6].slice(1,2);
		message.channel.sendMessage("Spliced array [0,1,2,3,4,5,6] into "+spliced+"\nSliced array [0,1,2,3,4,5,6] into "+sliced);
	}
	
});

bot.login('MzAwODA5ODI2MTY0ODAxNTM5.C8x4lA.d4aQRLkdySz2JiXcz7CesMkCb34');