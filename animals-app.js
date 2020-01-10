var API_TOKEN = "XXX";
var SHEET_NAME = 'Animals';
var table = Sheetfu.getTable(SHEET_NAME);

var STATE_WAIT_TYPE = 1;
var STATE_WAIT_CAN_FLY = 2;

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
  var animalName = params[0];
  var animal = findAnimal(animalName);
  
  if (animal){
    animal.setFieldValue("state", STATE_WAIT_TYPE);
    animal.commit();
    return "Введите тип животного <b>" + animalName + "</b>:";
  }
  
  return "Животное <b>" + animalName + "</b> не нейдено";
}

function updateRecord(record, value){
  if(record.getFieldValue("state") == STATE_WAIT_TYPE){
    record.setFieldValue("type", value);
    record.setFieldValue("state", STATE_WAIT_CAN_FLY);
    var responseMessage = "Тип животного <b>" + record.getFieldValue("name") + "</b> обновлен: " + value + "\nВведите признак умения летать (TRUE или FALSE):";
  } else if(record.getFieldValue("state") == STATE_WAIT_CAN_FLY){
    record.setFieldValue("can_fly", value);
    record.setFieldValue("state", "");
    var responseMessage = "Умение летать животного <b>" + record.getFieldValue("name") + "</b> обновлено: " + value;
  }
  record.commit();
  
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

function findWaitState(){
  return table.select([[{"state": 1}, {"state": 2}]]).first();
}

function defaultCommand(text){
  var waitingRecord = findWaitState();
  if(waitingRecord){
    return updateRecord(waitingRecord, text);
  }
  
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
