var API_TOKEN = "XXX";
var SHEET_NAME = 'Animals';
var table = Sheetfu.getTable(SHEET_NAME);

var commands = {
  "add": addCommand,
  "update": updateCommand,
  "list_can_fly": listCanFlyCommand
};

function doPost(e) {
  var update = JSON.parse(e.postData.contents);
  var request = new Request(update);
  var chatId = update.message.chat.id;
  var response = new BotMessage(chatId);
  
  var responseText = route(request);
  response.send(responseText);
}

function findAnimal(animalName){
  return table.select({"name": animalName}).first();
}

function findAnimalsCanFly(animalName){
  return table.select({"can_fly": true});
}

function updateAnimal(animal){
  var animalRecord = findAnimal(animal.name);
  var animalUpdated = false;
  if(animalRecord){
    animalRecord.setFieldValue("type", animal.type);
    animalRecord.setFieldValue("can_fly", animal.can_fly);
    animalRecord.commit();
    animalUpdated = true;
  }
  return animalUpdated;
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

function updateCommand(params){
  var animalUpdate = params[0];
  var animalUpdateParts = animalUpdate.split('\n');
  var animal = {
    "name": animalUpdateParts[0],
    "type": animalUpdateParts[1],
    "can_fly": animalUpdateParts[2],
  };
  var updated = updateAnimal(animal);
  
  if (updated){
    var responseMessage = "Животное <b>" + animal.name + "</b> обновлено";
  } else {
    var responseMessage = "Животное <b>" + animal.name + "</b> не найдено";
  }
  
  return responseMessage;
}

function listCanFlyCommand(){
  var animalsCanFly = findAnimalsCanFly();
  
  var responseLines = [];
  for(var i=0; i<animalsCanFly.length; i++){
    var animal = animalsCanFly[i];
    responseLines.push(animal.getFieldValue("name") + ", " + animal.getFieldValue("type"));
  }
  var responseMessage = responseLines.join("\n");
  
  return responseMessage;
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
