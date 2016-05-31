var Botkit = require('botkit');
var http = require('http');
var infoText = 'Puedes simplemente decirme "blue" u "oficial" para conocer sus cotizaciones. Tambien puedes decirme "diferencia" para saber cual es la diferencia entre sus valores.';
var infoTextGroups = 'Pueden simplemente mencionarme con el mensaje "blue" u "oficial" para conocer las cotizaciones. Tambien pueden decirme "diferencia" para saber cual es la diferencia entre sus valores.';
var controller = Botkit.slackbot({
    debug: false
});
var apiObject = {
    host: 'api.bluelytics.com.ar',
    path: '/v2/latest'
};

controller.spawn({
    token: 'xoxb-44175921392-Ziv3UEHQT7Vo1dSCwYRxhxhO', //Slack bot Token
}).startRTM()

controller.hears(['hola', 'hey'], ['direct_message', 'direct_mention', 'mention'], function(bot, message) {
    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Hola ' + user.name + '!!');
        } else {
            askName = function(response, convo) {
                convo.ask('Hola! como te llamas?', function(response, convo) {
                    controller.storage.users.get(message.user, function(err, user) {
                        if (!user) {
                            user = {
                                id: message.user,
                            };
                        }
                        user.name = response.text;
                        controller.storage.users.save(user, function(err, id) {
                            bot.reply(message, 'Hola ' + user.name + ', mi nombre es DolarBB y te puedo informar sobre el precio del dolar.');
                        });

                    });
                    askInfo(response, convo);
                    convo.next();
                });
            }
            askInfo = function(response, convo) {
                convo.ask('Te gustaria saber como pedirme información?', [{
                    pattern: 'ok',
                    callback: function(response, convo) {
                        convo.say(infoText);
                        convo.next();
                    }
                }, {
                    pattern:'si',
                    callback: function(response, convo) {
                        convo.say(infoText);
                        convo.next();
                    }
                }, {
                    pattern: bot.utterances.no,
                    callback: function(response, convo) {
                        convo.say('No hay problema, quizas luego. Cuando quieras saber que puedo hacer solo dime "info".');
                        convo.next();
                    }
                }, {
                    default: true,
                    callback: function(response, convo) {
                        // just repeat the question
                        convo.repeat();
                        convo.next();
                    }
                }]);
                convo.next();
            }
            bot.startConversation(message, askName);
        }
    });
});

controller.hears(['blue'], ['direct_message', 'direct_mention', 'mention'], function(bot, message) {
    http.get(apiObject, function(response) {
        var body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {
            var values = JSON.parse(body);
            replayDolarValue(bot, message, values.blue, 'blue');
        });
    });
});

controller.hears(['oficial'], ['direct_message', 'direct_mention', 'mention'], function(bot, message) {
    http.get(apiObject, function(response) {
        var body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {
            var values = JSON.parse(body);
            replayDolarValue(bot, message, values.oficial, 'oficial');
        });
    });
});

controller.hears(['diferencia'], ['direct_message', 'direct_mention', 'mention'], function(bot, message) {
    http.get(apiObject, function(response) {
        var body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {
            var values = JSON.parse(body);
            bot.reply(message, 'El dolar blue se paga ' + (values.blue.value_sell - values.oficial.value_sell).toFixed(2) + ' centavos más que el oficial para la venta y ' + (values.blue.value_buy - values.oficial.value_buy).toFixed(2) + ' centavos más en la compra');
        });
    });
});

controller.hears(['info'], ['direct_message', 'direct_mention', 'mention'], function(bot, message) {
    bot.reply(message, infoText);
});

controller.on('bot_channel_join',function(bot,message) {
  bot.reply(message, "Hola a todos!, gracias por agregarme a este canal");
  bot.reply(message, infoTextGroups);
});

/*controller.on('bot_channel_left',function(bot,message) {
  bot.reply(message, "Bueno... se ve que tuve menos éxito que Osvaldo en Boca, gracias por la oportunidad!");
  bot.reply(message, {
      text: "Chau...",
      icon_emoji: ":cry:",
    });
});*/

function replayDolarValue(bot, message, dolar, type) {
    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, user.name + ', el dolar ' + type + ' cotiza ' + dolar.value_sell.toFixed(2) + ' para la venta y ' + dolar.value_buy.toFixed(2) + ' para la compra');
        } else {
            bot.reply(message, 'Hola, el dolar ' + type + ' cotiza ' + dolar.value_sell.toFixed(2) + ' para la venta y ' + dolar.value_buy.toFixed(2) + ' para la compra');
        }
    });
}
