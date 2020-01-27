/**
 * Функция, возвращающая случайное целое число от 0 до max (не включая max)
 * Может пригодиться, например, для выбора случайной записи таблицы
 * var randomRecord = table.items[getRandomInt(table.items.length)];
 *
 * @param {integer} max - правый предел диапазона случайных чисел 
 * @returns {integer} - случайное число в диапазоне [0; max)
 */
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

/**
 * Функция, выполняющая запрос по заданному адресу, отвечающему в формате json.
 * Возвращает объект с данными ответа или null в случае ошибки 
 *
 * @param {string} url - URL API-ресурса
 * @returns {(Object|null)} - объект с данными ответа API
 */
function getJsonAPI(url){
  var options = {
    'method' : 'get',
    'contentType' : 'application/json'
  };
  
  try {
    var response = UrlFetchApp.fetch(url, options);
    return JSON.parse(response.getContentText());
  } catch (e) {
    Logger.log(e.message);
    return null;
  }
}
