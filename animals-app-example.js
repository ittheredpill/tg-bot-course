var API_TOKEN = "XXX"; // подставь сюда секретный ключ бота
var SHEET_NAME = 'Animals';
var table = Sheetfu.getTable(SHEET_NAME);

var STATE_WAIT_TYPE = 1;
var STATE_WAIT_CAN_FLY = 2;

/**
  Словарик со связями команд и обрабатывающих их функций
*/
var commands = {
  "add": addCommand,
  "update": updateCommand,
  "list_flying": listFlyingCommand
};

/**
  Команды
*/

// Обработчик команды /add
function addCommand(params){
  var newAnimalName = params[0];
  var newAnimal = {
    "name": newAnimalName
  };
  table.add(newAnimal);
  table.commit();
  
  return "Животное <b>" + params[0] + "</b> добавлено!";
}

// Обработчик команды /update
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

// Обработчик команды /update
function updateRecord(record, value){
  if(record.getFieldValue("state") == STATE_WAIT_TYPE){
    record.setFieldValue("type", value);
    record.setFieldValue("state", STATE_WAIT_CAN_FLY);
    var responseMessage = "Тип животного <b>" + record.getFieldValue("name") + "</b> обновлен: " + value + "\nЖивотное умеет летать? (TRUE или FALSE)";
  } else if(record.getFieldValue("state") == STATE_WAIT_CAN_FLY){
    record.setFieldValue("can_fly", value);
    record.setFieldValue("state", "");
    var responseMessage = "Умение летать животного <b>" + record.getFieldValue("name") + "</b> обновлено: " + value;
  }
  record.commit();
  
  return responseMessage;
}

// Обработчик команды /list_flying
function listFlyingCommand(){
  var flyingAnimals = findFlyingAnimals();

  var responseLines = [];
  for(var i=0; i<flyingAnimals.length; i++){
    var animal = flyingAnimals[i];
    responseLines.push(animal.getFieldValue("name") + ", " + animal.getFieldValue("type"));
  }
  var responseMessage = responseLines.join("\n");

  return responseMessage;
}

// Обработчик для неизвестных команд (не описанных в словарике commands)
function defaultCommand(text){
  var waitingRecord = findWaitState();
  if(waitingRecord){
    return updateRecord(waitingRecord, text);
  }
  
  return "Неизвестная команда";
}

/**
  Функция формирования клавиатур (кнопок) 
*/
function getKeyboard(request){
  return null;
}

/**
  Функции работы с данными
*/

// Поиск животного по названию
function findAnimal(animalName){
  return table.select({"name": animalName}).first();
}

// Поиск всех животных, умеющих летать 
function findFlyingAnimals(){
  return table.select({"can_fly": true});
}

// Поиск записей в состояниях STATE_WAIT_TYPE и STATE_WAIT_CAN_FLY
function findWaitState(){
  return table.select([[{"state": STATE_WAIT_TYPE}, {"state": STATE_WAIT_CAN_FLY}]]).first();
}

/**
  Специальный метод, запускаемый при получении запроса от бота
*/
function doPost(e) {
  var update = JSON.parse(e.postData.contents);
  var request = new Request(update);
  var chatId = request.getChatId();
  var response = new BotMessage(chatId);
  
  var responseText = route(request);
  var responseKeyboard = getKeyboard(request);
  response.send(responseText, responseKeyboard);
}

/**
  Служебный метод, определяющий, как обрабатывать пришедший запрос 
*/
function route(request){
  if(request.getCommand() in commands && typeof commands[request.getCommand()]){
    return commands[request.getCommand()](request.getParams());
  } else {
    return defaultCommand(request.getParams());
  }
}

/**
  Служебный класс для обработки бот-запроса
*/
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

/**
  Служебный класс для отправки ответа в Telegram
*/
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
