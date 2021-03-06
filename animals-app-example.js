var API_TOKEN = "XXX"; // подставь сюда секретный ключ бота
var SHEET_NAME = 'Animals';
var table = Sheetfu.getTable(SHEET_NAME);

/**
  Словарик со связями команд и обрабатывающих их функций
*/
var commands = {
  "add": addCommand
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

// Обработчик для неизвестных команд (не описанных в словарике commands)
function defaultCommand(text){
  return "Неизвестная команда";
}

/**
  Функция формирования клавиатур (кнопок) 
*/
function getKeyboard(request){
  return null;
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
