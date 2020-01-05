var API_TOKEN = "XXX";
var SHEET_NAME = 'Animals';
var table = Sheetfu.getTable(SHEET_NAME);

var commands = {
  "add": addCommand
};

function doPost(e) {
  var update = JSON.parse(e.postData.contents);
  var request = new Request(update);
  var chatId = update.message.chat.id;
  var response = new BotMessage(chatId);
  
  var responseText = route(request);
  response.send(responseText);
}

function addCommand(params){
  var newAnimalName = params[0];
  var newAnimal = {
    "name": newAnimalName
  };
  table.add(newAnimal);
  table.commit();
  
  return "Животное <b>" + params[0] + "</b> добавлено!";
}

function defaultCommand(text){
  return "Неизвестная команда";
}

function route(request){
  if(request.getCommand() in commands && typeof commands[request.getCommand()]){
    return commands[request.getCommand()](request.getParams());
  } else {
    return defaultCommand(request.getParams());
  }
}

var Request = function(update){
  var command, params;
  
  var message = update.message.text.toString();
  var messageParts = message.split(' ');
  if (messageParts.length >= 1 && messageParts[0].indexOf('/') == 0) {
    this.command = messageParts.shift().substring(1);
    this.params = messageParts;
  } else {
    this.params = message;
  }
  
  this.getCommand = function(){
    return this.command;
  };
  
  this.getParams = function(){
    return this.params;
  };
};

var BotMessage = function(chatId){  
  this.chatId = String(chatId);
  
  this.send = function(text, keyboard) {
    var payload = {
      'method': 'sendMessage',
      'chat_id': this.chatId,
      'text': text,
      'parse_mode': 'HTML'
    };  
    if(keyboard){
      payload.reply_markup = JSON.stringify({'inline_keyboard': keyboard});
    }
    var data = {
      "method": "post",
      "payload": payload
    };
      
    try {
      var res = UrlFetchApp.fetch('https://api.telegram.org/bot' + API_TOKEN + '/', data);
    } catch(e){

    }
  };
};
