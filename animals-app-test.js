function testAdd(){
  var contents = {
    "message": {
      "chat": {
        "id": YOUR_TELEGRAM_ID
      },
      "from": {
        "id": YOUR_TELEGRAM_ID
      },
      "entities": [{
        "type": "bot_command"
      }],
      "text": "/add кошка"
    }
  };
  var d = {
    "postData": {
      "contents": JSON.stringify(contents)
    }
  };
  doPost(d);
}
