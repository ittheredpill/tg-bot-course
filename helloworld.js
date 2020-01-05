var API_TOKEN = "XXX";
var SHEET_ID = "XXX";
var doc = SpreadsheetApp.openById(SHEET_ID).getSheets();
var sheet =  doc[0];

function doPost(e) {
  var update = JSON.parse(e.postData.contents);
  var chatId = update.message.chat.id;
  var text = sheet.getRange(1, 1).getValue();
  
  var payload = {
    'method': 'sendMessage',
    'chat_id': chatId,
    'text': text,
    'parse_mode': 'HTML'
  };
  var data = {
    "method": "post",
    "payload": payload
  };
  
  var res = UrlFetchApp.fetch('https://api.telegram.org/bot' + API_TOKEN + '/', data);
}
