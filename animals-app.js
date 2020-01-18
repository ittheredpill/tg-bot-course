var API_TOKEN = "XXX";
var SHEET_NAME = 'Animals';
var ADMIN_CHAT_ID = XXX; // замени на свой id в telegram
var table = Sheetfu.getTable(SHEET_NAME);

var STATE_WAIT_TYPE = 1;
var STATE_WAIT_CAN_FLY = 2;

var commands = {
  "add": addCommand,
  "update": updateCommand,
  "list_can_fly": listCanFlyCommand,
  "remove": removeCommand
};

function doPost(e) {
  var update = JSON.parse(e.postData.contents);
  var request = new Request(update);
  var chatId = request.getChatId();
  var response = new BotMessage(chatId);
  
  var responseText = route(request);
  var responseKeyboard = getKeyboard(request);
  response.send(responseText, responseKeyboard);
}

function jobCheckAnimals(){
  var incompleteEnimalRecords = table.select([[{"type": ""}, {"can_fly": ""}]])
  
  if(incompleteEnimalRecords.length > 0){
    var responseLines = [];
    for(var i=0; i<incompleteEnimalRecords.length; i++){
      var animal = incompleteEnimalRecords[i];
      responseLines.push("<b>" + animal.getFieldValue("name") + "</b>");
    }
    var responseMessage = "Данные по\n<b>" + responseLines.join("\n") + "</b>\nне полны";
    var response = new BotMessage(ADMIN_CHAT_ID);
    
    response.send(responseMessage);
  }
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
    var responseMessage = "Тип животного <b>" + record.getFieldValue("name") + "</b> обновлен: " + value + "\nЖивотное умеет летать?";
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

function removeCommand(params){
  var animalName = params[0];
  table.deleteSelection({"name": animalName});
  table.commit();
  return "Животное <b>" + animalName + "</b> удалено";
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

function getKeyboard(request){
  var keyboard = null;
  var waitingRecord = findWaitState();
  if(waitingRecord && waitingRecord.getFieldValue("state") == STATE_WAIT_CAN_FLY){
    keyboard = [[
      {"text": "Да", "callback_data": "TRUE"},
      {"text": "Нет", "callback_data": "FALSE"}
    ]]
  };
  return keyboard;
}

var Request = function(update){
  var command, params, chatId;
  
  if(update.hasOwnProperty('callback_query')){
    var callback = update.callback_query;
    var message = callback.data.toString();
    this.chatId = callback.message.chat.id;
  } else {
    var message = update.message.text.toString();
    this.chatId = update.message.chat.id;
  }
  var messageParts = message.split(' ');
  
  if (messageParts.length >= 1 && messageParts[0].indexOf('/') == 0) {
    this.command = messageParts.shift().substring(1);
    this.params = messageParts;
  } else {
    this.params = message;
  }
  
  this.getChatId = function(){
    return this.chatId;
  };
  
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
