var Model = require('./model.js');
var Ticker = Model.Ticker;
var User = Model.User;
var Room = Model.Room;
var Util = Model.Util;
var Bridge = require('../bridge/lib/bridge.js').Bridge;
var bridge = new Bridge({apiKey:"R+DPnfAq"});
//var bridge=new Bridge({apiKey:"abcdefgh"});
//var bridge = {ready:function(){}}
var Dao = require('./dao.js').Dao;
var dao = new Dao('localhost','root','narsiodeyar1','quizbowl');
var bDao;
var ticker;
var users = {};
var rooms = {};
var roomnames=[];
bridge.ready(function(){
  console.log("Connected to Bridge");
  tickerHandler = {
    push:function(ticker){
      console.log(ticker.name+" "+ticker.text);
    }
  }
  bDao = {
    "tossup_get":function(pKey, callback) {
      dao.tossup.get(pKey, callback);
    },
    "tossup_search":function(obj, callback){
      dao.tossup.search(obj, function(result){
        callback(result);
      });
    },
    "tossup_search_java":function(obj,callback){
      dao.tossup.search(obj,function(result){
        callback.callback(result);
      });
    },
    "user_login":function(user,callback){
      dao.user.get(user.fbId,function(result) {
      if (result.length == 1){
        login(user, result.loggedIn, function(obj) {
          if (callback) {
            callback(obj);
          }
        });
      } else {
        dao.user.create(user,function(result){
          if (result.message = "success") {
            console.log(result);
            login(user, true, function(obj) {
              if (callback) {
                callback(obj);
              }
            });
          } else {

          }
        });
      }
      });
    },
    "user_logoff":function(user, callback){
      logoff(user,function(obj) {
          if (callback){
        callback(obj);
        }
      });
    },
    "user_create":function(user, callback) {
      dao.user.create(user, callback);
    },
    "single_answer":function(score, callback) {

      dao.single.answer(score, function(obj){
          if (obj.correct){
          answer(req.query.username, obj.answer, req.query.score);
          }
          callback({message:"success"});
          });
    }
  }
  multi = {
join:function(user,room,handler,callback){
       if (users.user !== undefined) {
       if (roomnames.indexOf(room)!=-1){
       } else {
         roomnames.push(room);
         rooms.room = new Room(room,room.password,handler);
         bridge.joinChannel(room,
             {
              chat:function(name,message){
                console.log("["+room+"] "+name+": "+message);
              } 
             }
         );
       }
       rooms.room.join(users.user,room.password,function(obj){
          if (obj.joined) {
            bridge.joinChannel(room,handler,callback);
            users.user.handler = handler;
            console.log(users.user.name+" joined ["+room+"]");
          }  
       });
       } else {
         callback({message:"user must be logged in"});
       }
     },
leave:function(user){
        console.log(users.user);
        room = users.user.room.name;
        if (roomnames.indexOf(room)==-1){
        } else {
          rooms.room.leave(users.user,function(){});
          if (rooms.room.users.length ==0){
            delete rooms.room;
            roomnames.pop(room); 
          }
          console.log(rooms.room);
        }
        bridge.leaveChannel(room,users.user.handler);
        console.log("HI");
        users.user.handler=null;
        console.log(roomnames,rooms);
      },
getRooms:function(callback){
           callback(rooms);
         }
  }
  bridge.joinChannel("ticker", tickerHandler, function(channel){ticker = channel;console.log("joined ticker");});
  bridge.publishService("dao",bDao);
  bridge.publishService("multi",multi);
  console.log("published dao");
});
answer = function(user, answer, score) {
  ticker.push(new Ticker(user, "answered "+answer+" correctly with a score of "+score));
}
login = function(user, loggedIn, callback) {
  if (true){//loggedIn) {
    users.user = new User(user);
    console.log(users);
    ticker.push(new Ticker(user.username, "logged in"));
    callback({message:"success"});
  } else {
    callback({message:"failed"});
  }
}
logoff = function(user, callback) {
  delete users.user;
  ticker.push(new Ticker(user.username, "logged off"));
  callback({"message":"success"});
}
