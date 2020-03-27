require('dotenv').config();
const Discord = require('discord.js');
const bot = new Discord.Client({
    autoReconnect: true
});
const axios = require('axios');
const token = process.env.DISCORD_TOKEN;

const prefix = '+';
const delimiter = ':';

const msgSuccess = ":ok_hand_tone1:";
const msgHelp = "``` 4 commandes sont disponibles \n- " + prefix + "create <nom channel> \n- " + prefix + "remove <nom channel> \n- " + prefix + "add <nom channel> <nb de points> \n- " + prefix + "less <nom channel> <nb de points>" + " ```";
const msgErrorCommande = "La commande n'a pas été reconnue";
const msgErrorUnique = ":warning: Le nom de ce channel existe déjà";
const msgErrorNumberFormat = ":warning: Veuillez saisir un chiffre valide";
const msgErrorChannelNotFound = ":warning: Channel introuvable";

bot.on('ready', function () {
    bot.user.setActivity(prefix + "help");
    console.log("Scoromatique Bot ready");
})

bot.on('message', msg => {
    if (!msg.member.hasPermission("ADMINISTRATOR")) {
        return;
    }

    processMsg(msg.content).then(parsedMsg => {
        switch (parsedMsg[0]) {
            case 'create':
                // <prefix>create <channel name>
                channelNameIsUnique(parsedMsg[1]).then(data => {
                    if (data) {
                        createChannel(msg.guild, parsedMsg[1]);
                        msg.channel.send(msgSuccess)
                    } else
                        msg.channel.send(msgErrorUnique);
                });

                break;
            case 'add':
                // <prefix>add <channel name> <nb points>
                addValue(msg, parsedMsg, true);
                break;
            case 'less':
                // <prefix>less <channel name> <nb points>
                addValue(msg, parsedMsg, false);
                break;
            case 'remove':
                // <prefix>remove <channel name>
                findChannelByName(parsedMsg[1]).then(data => {
                    removeChannelByName(parsedMsg[1]).then(() => {
                        msg.guild.channels.find(c => c.id === data.id).delete();
                    });
                    msg.channel.send(msgSuccess);
                });
                break;
            case 'help':
                msg.channel.send(msgHelp);
                break;
            default:
                msg.channel.send(msgErrorCommande);
                break;
        }
    });
});

bot.login(token);

function processMsg(rawMsg) {
    return new Promise(function (resolve, reject) {
        if (rawMsg.substring(0, 1) === prefix)
            resolve(rawMsg.substring(1).split(' '));
    });
}

function getOldScore(channelName) {
    channelName = channelName.substring(channelName.lastIndexOf(delimiter) + 1).trim();
    return parseInt(channelName.match(/\d+/g)); // \d+ means 1 or + digit (regex)
}

function addValue(msg, parsedMsg, isAddition) {
    findChannelByName(parsedMsg[1]).then(data => {
        if (data !== null) {
            if (isNaN(parseInt(parsedMsg[2]))) {
                msg.channel.send(msgErrorNumberFormat);
                return;
            }

            var channel = msg.guild.channels.find(c => c.id === data.id);
            if (isAddition)
                channel.setName(data.name + delimiter + " " + parseInt(getOldScore(channel.name) + parseInt(parsedMsg[2])) + " pts");
            else
                channel.setName(data.name + delimiter + " " + parseInt(getOldScore(channel.name) - parseInt(parsedMsg[2])) + " pts");

            msg.channel.send(msgSuccess);
        } else {
            msg.channel.send(msgErrorChannelNotFound);
        }
    });
}

function createChannel(serv, name) {
    serv.createChannel(name + " " + delimiter + "0 pts", "voice", [{
        id: serv.defaultRole.id,
        deny: ['CONNECT'],
    }, ]).then(channel => {
        saveChannel(channel.id, name);
    }).catch(console.error);
}

function channelNameIsUnique(channelName) {
    return new Promise(resolve => {
        axios({
            method: 'get',
            // https://github.com/Mr-Titos/Data-Center-API
            url: 'http://localhost:4242',
            headers: {
                'method': 'nameIsUnique',
                'file': 'goboue.json'
            },
            params: {
                name: channelName
            }
        }).then(response => {
            resolve(response.data);
        })
    });
}

function saveChannel(idChannel, channelName) {
    axios({
        method: 'post',
        //https://github.com/Mr-Titos/Data-Center-API
        url: 'http://localhost:4242',
        headers: {
            'method': 'save',
            'file': 'goboue.json'
        },
        data: {
            name: channelName,
            id: idChannel,
        }
    });
}

function findChannelByName(channelName) {
    return new Promise(resolve => {
        axios({
            method: 'get',
            // https://github.com/Mr-Titos/Data-Center-API
            url: 'http://localhost:4242',
            headers: {
                'method': 'findByNom',
                'file': 'goboue.json'
            },
            params: {
                name: channelName
            }
        }).then(response => {
            resolve(response.data);
        })
    });
}

function removeChannelByName(channelName) {
    return new Promise(resolve => {
        axios({
            method: 'get',
            // https://github.com/Mr-Titos/Data-Center-API
            url: 'http://localhost:4242',
            headers: {
                'method': 'removeByNom',
                'file': 'goboue.json'
            },
            params: {
                name: channelName
            }
        }).then(response => {
            resolve(response.data);
        })
    });
}