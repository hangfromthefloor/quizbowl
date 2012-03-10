var Client = require('mysql').Client;
var client = new Client();
var pageLength = 10;
var Dao = function(host, user, password, database){
  client.host = host;
  client.user = user;
  client.password = password;
  client.database = database;
  this.tossup = {}; 
  this.user = {};
  this.rating = {};
  this.reader = {};
  this.tossup.get = function(pKey, callback){
    client.query("select * from tossups where pKey='"+pKey+"'", function(err, result, field){
        if (!err) {
        callback(result[0]);
        } else {
        console.log(err);
        }
        });
  }
  this.tossup.search = function(obj, callback) {
    var query = "";
    if (obj['condition']!==undefined && obj['answer']!==undefined){
      if (obj['condition']=="all"){
        query += "(t.answer like '%" + util.escapeSql(obj['answer']).replace(/ /g,'%') +"%' or t.question like '%" + obj['answer'].replace(/ /g,'%')+"%')";	
      } else if (obj['condition']=="question") {
        query +="(t.question like '%"+util.escapeSql(obj['answer']).replace(/ /g,'%') + "%')";
      } else if (obj['condition']=="answer") {
        query += "(t.answer like '%"+util.escapeSql(obj['answer']).replace(/ /g,'%')+"%')";
      }
    } else {
      if (obj['answer']!==undefined){
        query += "(t.answer like '%" + util.escapeSql(obj['answer']).replace(/ /g,'%')+"%')";
      } else {
        query += "(t.answer like '%%')";
      }
      if (obj['question'] !== undefined){
        query += " and (t.question like '%" + util.escapeSql(obj['question']).replace(/ /g,'%') + "%')";
      }
    }
    if (obj['tournament']!==undefined){
      query = util.addQueryTerm(query,'t.tournament',obj['tournament'],'like');
    }
    if (obj['round']!==undefined){
      query = util.addQueryTerm(query,'t.round',obj['round'],'like');
    }
    if (obj['year']!==undefined){
      query = util.addQueryTerm(query,'t.year',obj['year'],'=');
    }
    if (obj['category']!==undefined){
      query = util.addQueryTerm(query,'t.category',obj['category'],'like');
    }
    if (obj['questionNum']!==undefined){
      query = util.addQueryTerm(query,'t.question_num',obj['questionNum'],'like');
    }
    if (obj['difficulty']!==undefined){
      query = util.addQueryTerm(query,'t.difficulty',obj['difficulty'],'like');
    }
    query += " group by t.pKey";
    limitstring = "";
    if (obj['random']!==undefined){
      if (obj['random']=='true'){
        if (obj['limit']!==undefined){
          limitstring+= " order by rand()";
        } else {
          limitstring+= " order by rand() limit 1";
        }
      }
    } else {	
      if (obj['sort'] == undefined || obj['sort'] == 'date') {
        query += " order by year desc, tournament asc, round asc,question_num asc";
      } else if (obj['sort'] == 'rating') {
        query += " order by sum(r.rating) desc";
      }
      if (obj['offset']!==undefined) {
        limitstring += " limit "+pageLength+" offset "+obj['offset'];
      } else {
        limitstring += " limit "+pageLength;
      }
    }
    if (obj['username']!==undefined){
      querystring = 'select t.tournament,t.year,t.question, t.answer, t.round, t.question_num, t.difficulty, t.pKey,t.category, t.accept, sum(r.rating) as rating,(select rating from ratings where user="'+obj['username']+'" and question=t.pKey) user_rating from tossups t left outer join ratings r on t.pKey = r.question where '+query+limitstring;
    } else {
      querystring = 'select t.tournament,t.year,t.question, t.answer, t.round, t.question_num, t.difficulty, t.pKey,t.category, t.accept, sum(r.rating) as rating from tossups t left outer join ratings r on t.pKey = r.question where '+query+limitstring;
    }
    countstring = 'select count(*),sum(r.rating) from tossups t left outer join ratings r on t.pKey = r.question where '+query;
    console.log(querystring);
    client.query(countstring,function(err,results,fields){
        if (!err) {
        count = results.length;
        client.query(querystring,function selectCb(err,results,fields){
          if (!err) {
          if (!obj['offset'])
            obj['offset']=0; 
          callback({'count':count,'offset':obj['offset'],'results':results});
          } else{ 
          console.log(err);
          callback({offset:0,results:[]});
          }
          });
	} else {
		console.log(err);
    callback({offset:0,results:[]});
	}
        });
  }
  this.data = function(callback) {
    client.query('select count(*) from tossups', function selectCb(err,results,fields){
        var num_tossups = results[0]['count(*)'];
        client.query('select count(*) from usernames', function selectCb(err, results, fields){
          var num_users = results[0]['count(*)'];
          client.query('select count(*) from scores', function selectCb(err, results, fields){
            var num_scores = results[0]['count(*)'];
            client.query('select distinct year,tournament from tossups order by year desc, tournament asc', function selectCb(err, results, fields){
              var tournaments = results;
              client.query('select distinct year from tossups', function selectCb(err, results, fields){
                var years = results;
                client.query('select distinct difficulty from tossups', function selectCb(err,results,fields){
                  var difficulties = results;
                  client.query('select distinct category from tossups', function selectCb(err, results, fields){
                    var categories = results
                    data = {}; 
                    data['data'] = {};
                    data['data']['numScores'] = num_scores;
                    data['data']['numQuestions'] = num_tossups;
                    data['data']['numUsers'] = num_users;
                    data['data']['difficulties'] = util.convertMapToList(difficulties,'difficulty');
                    data['data']['years'] = util.convertMapToList(years,'year');
                    data['data']['categories'] = util.convertMapToList(categories,'category');
                    data['data']['tournaments'] = util.convertDoubleMapToList(tournaments,'year','tournament');
                    callback(data);
                  });
                });
            });
          });
        });
    });
    });
  }
  this.reader.answer = function(obj, callback) {
    client.query("insert into scores (username,score,correct,answer,question) values ('"+obj.username+"','"+obj.score+"',"+obj.correct+",'"+util.escapeSql(obj.answer)+"','"+util.escapeSql(obj.pKey)+"')", function(err, info){
        if (err){
        console.log(err);
        } else {
        this.get(obj.pKey, function(question) {
          callback({name:username,action:{'correct':correct,'score':score, 'answer':question.answer}});
          });
        }
        });

  }
  this.user.login = function(user, callback){
    client.query("select * from usernames where username = '"+user.username+"' and password = '"+user.password+"'", function(err, result, field){
        if (err) {
        console.log(err); 
        } else {
        if (result.length==1){
        callback(true);
        } else if (result.length == 0){
        callback(false);
        } else {
        console.log("AAAAH EXPLODEY FATAL ERROR");
        }
        }
        });
  }
  this.user.create = function(user, callback){
    client.query("insert into usernames(username, password) values('"+user.username+"','"+user.password+"')", function(err, result, info){
        if (err){
        callback(true);
        }
        else {
        callback(false);
        }
        });
  }
  this.rating.add = function(obj,callback){
    client.query("select * from ratings where user='"+obj.username+"' and question = '"+util.escapeSql(obj.question)+"'",function selectCb(err,result,fields){
        if (result.length!=0){
        client.query("update ratings set rating = "+obj.value+" where user='"+obj.username+"' and question = '"+util.escapeSql(obj.question)+"'",function selectCb(err,result,fields){
          if (!err){
          callback(true);
          } else {
          console.log(err);
          }
          });

        } else {
        client.query("insert into ratings(rating,user,question) values ("+value+",'"+username+"','"+question.replace(/'/g,"''")+"')", function selectCb(err,result,fields){
          if (!err){
          callback(true);
          } else {
          console.log(err);
          }
          });
        }
        });
  }
}
var util = {
escapeSql:function(str) {
            return str.replace(/'/g,"''").replace(/\\/g,'\\\\');
          },
addQueryTerm:function(str,param,value,comp){
               values = value.split("|");
               str += " and (";
               delimiter = "";
               for (i=0;i<values.length;i++){
                 str += delimiter;
                 if (param == "t.tournament"){
                   str+="((t.year = "+values[i].substring(0, 4).trim()+") and ";
                   str+="(t.tournament like '%"+values[i].substring(5).trim().replace(/ /g,'%')+"%'))";
                 } else {
                   if (comp=="="){
                     separator = "";
                   } else {
                     separator = "'";
                   }
                   str+="("+param+" "+comp+" "+separator+values[i].replace(/ /g,"%")+separator+")";
                 }
                 delimiter = " or ";
               }
               str+=")";
               return str;
             },
convertMapToList:function(obj,term){
                   var arr = [];
                   for (i=0;i<obj.length;i++){
                     arr[i] = obj[i][term];
                   }
                   return arr;
                 },
convertDoubleMapToList:function(obj,t1,t2){
                         var arr = [];
                         for (i=0;i<obj.length;i++){
                           arr[i] = obj[i][t1]+" "+obj[i][t2];
                         }
                         return arr;
                       }
}
exports.Dao = Dao;
