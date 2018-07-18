const axios = require('axios');

//для хранения информации client_id(key) -> fingerprint(value)
//необходимо для регистрации событий входа/выхода, ибо сам websocket-сервер оперирует только с client_id
var users_online = new Map();

//ассинхронная функция, 
//указывает соответствие id клиента сервера и его отпечатка,
//"регистрирует" клиента websocket-сервера в базе данных по его отпечатку
function registrateConnectedUser(client_id, fingerprint) {
  return new Promise((resolve, reject) => {
    console.log('Registering connected user in database for client_id:' + client_id + ' and fingerprint: ' + fingerprint);
    users_online.set(client_id, fingerprint);

    //запрос к http api базы данных на добавление fingerprint'а пользователя к 'user_connected'
    axios({
      method: 'post',
      url: 'http://localhost:8086/write?db=testapi',
      data: 'user_connected,product=myaso,version=2 fingerprint="' + fingerprint + '"'
    })
    .then(function(response) {
      resolve = response;
    })
    .catch(function(error) {
      reject = error;
    })
  });
}

//ассинхронная функция, 
//удаляет имеющееся соответсвие id клиента и его отпечатка,
//"регистрирует" факт отключения клиента в базе данных по его отпечатку
function registrateDisconnectedUser(client_id) {
  return new Promise((resolve, reject) => {
    console.log('Registering disconnected user in database for client_id:' + client_id + ' and fingerprint: ' + users_online.get(client_id));

    //запрос к http api базы данных на добавление fingerprint'а пользователя к 'user_disconnected'
    axios({
      method: 'post',
      url: 'http://localhost:8086/write?db=testapi',
      data: 'user_disconnected,product=myaso,version=2 fingerprint="' + users_online.get(client_id) + '"'
    })
    .then(function(response) {
      resolve = response;
    })
    .catch(function(error) {
      reject = error;
    });

    users_online.delete(client_id);
  });
}

var io = require('socket.io')();
io.on('connection', function(client){
  console.log('Got a client!');

  //after receiving a fingerprint from user
  client.on('fingerprint', function(fingerprint) {
    registrateConnectedUser(client.id, fingerprint);

    //Vue не может отослать никакое сообщение при закрытии вкладки, а факт прекращения пребывания
    //пользователя на сайте необходимо зафиксировать
  });

  //after client disconnecting
  client.on('disconnect', function() {
    registrateDisconnectedUser(client.id);
    console.log('Client disconnected from server!');
  });
});

io.listen(3000);
console.log('server started');
