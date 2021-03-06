try {
    // Load modules here.
    fs = require('fs');
    Discord = require('discord.io');
    log = require('fancy-log');
    colors = require('colors');
    lodash = require('lodash');
    log(colors.green(' --- Starting Initialization'))

}catch(ex){
    console.error(colors.red("There was an error loading the required modules. Try running 'npm install' and try again."));
}

try 
{

    config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

}catch(ex){
    console.error(colors.red("Config failed to load: " + ex));
}


commands = {};

fs.readdir("./commands/", (err, files) => {
  files.forEach(file => {
    try{

        temp = require("./commands/" + file);
        commands[temp.name] = temp;

        try{
            commands[temp.name].modules()
        }catch(ex){
            log(colors.red(file + " is missing modules!"))
        }

        commands[temp.name].onInit()

        log(colors.green("Command '" + commands[temp.name].name + "' was loaded."))

    }catch(ex){

        log(colors.red(file + " failed to load!"))

    }
  });
})

bot = new Discord.Client({
    autorun: true,
    token: config.user.token
});

bot.on('ready', function(event) {

    log(colors.green(' --- Bot Ready, Logged in as ' + bot.username));

});

bot.on('disconnect', function(erMsg, code) {
	log(colors.red(' --- Bot Disconnected'));
    log(colors.red(erMsg))
    bot.connect();
});
		
bot.on('message', function(user, userID, channelID, message, event) {
        
    var execute = true;
    
    if(config.commands.allowbot == false){
        if(bot.users[userID].bot == true){
            execute = false;
        }
    }

    if(userID != bot.id){

		if( message.substring(0, config.commands.prefix.length) == config.commands.prefix){

			
			if(execute == true){
				message = message.substring(config.commands.prefix.length, message.length);
				args = message.split(/ +(?=(?:(?:[^"]*"){2})*[^"]*$)/g);

				cmd = args[0];
				args.splice(0, 1);

                var guild = bot.channels[channelID].guild_id

				if(typeof commands[cmd] == 'object'){

                    var perm = commands[cmd].permission;

                    if(hasPerm(guild, userID, perm) == true){

					    commands[cmd].onTrigger(userID, channelID, guild, args, message, event);

                    }else{

                        bot.sendMessage({
                                to: channelID,
                                message: ":no_entry:  You need the `" + commands[cmd].permission + "` permission."
                        });

                    }
				}
			}


		}
    }
});

function isEven(n) {
   return n % 2 == 0;
}

function isOdd(n) {
   return Math.abs(n % 2) == 1;
}

function hasPerm(server, userID, permission){

    if(permission == "everyone" || permission == "none" || permission == "@everyone" || permission == "all"){ return true };

    var roleID = findRoleByName(server, permission);
    try{

        if (bot.servers[server].members[userID].roles.indexOf(roleID.id) > -1) {
            return true;
        }else{
            return false;
        }
        
    }catch(ex){
        return false;
    }

}

function findRoleByName(server, permission){

    var picked = lodash.filter(bot.servers[server].roles, { 'name': permission } );
    return picked[0];

}