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
const msgErrorCommande = "La commande n'a pas été reconnue";

bot.on('ready', function () {
    console.log("Goboue Bot connecté");
})

bot.on('message', msg => {
    if (!msg.member.hasPermission("ADMINISTRATOR")) {
        return;
    }

    processMsg(msg.content).then(parsedMsg => {
        switch (parsedMsg[0]) {
            case 'create':
                channelNameIsUnique(parsedMsg[1]).then(data => {
                    if (data) {
                        createChannel(msg.guild, parsedMsg[1]);
                        msg.channel.send(msgSuccess)
                    } else
                        msg.channel.send(":warning: Le nom de ce channel existe déjà");
                });

                break;
            case 'add':
                // <prefix>add <channel name> <nb points>
                findChannelByName(parsedMsg[1]).then(data => {
                    if (data !== null) {
                        if (isNaN(parseInt(parsedMsg[2]))) {
                            msg.channel.send(":warning: Veuillez saisir un chiffre valide");
                            return;
                        }

                        var channel = msg.guild.channels.find(c => c.id === data.id);
                        channel.setName(data.name + delimiter + " " + parseInt(getOldScore(channel.name) + parseInt(parsedMsg[2])) + " pts");
                        msg.channel.send(msgSuccess)
                    } else {
                        msg.channel.send(":warning: Channel introuvable");
                    }
                })
                break;
            case 'remove':
                findChannelByName(parsedMsg[1]).then(data => {
                    removeChannelByName(parsedMsg[1]).then(() => {
                        msg.guild.channels.find(c => c.id === data.id).delete();
                    });
                    msg.channel.send(msgSuccess);
                })
                break;
            default:
                msg.channel.send(msgErrorCommande);
                break;
        }
    });
});

bot.login(token);

// Example msg : +add <channel_name>
function processMsg(rawMsg) {
    return new Promise(function (resolve, reject) {
        if (rawMsg.substring(0, 1) === prefix)
            resolve(rawMsg.substring(1).split(' '));
    });
}

function getOldScore(channelName) {
    channelName = channelName.substring(channelName.lastIndexOf(delimiter) + 1).trim();
    return parseInt(channelName.match(/\d+/g)); // \d+ means 1or + digit (regex)
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