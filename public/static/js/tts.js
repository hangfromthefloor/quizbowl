QDB = {};
QDB.tts = {};

QDB.tts.Source = function() {
  this.externalScripts = [];
  this.requestParams = {};
  this.baseURL = '';
};
QDB.tts.Source.prototype.loadExternalScript = function(scriptURL) {
  var newScript = document.createElement('script');
  newScript.setAttribute('type','text/javascript');
  newScript.setAttribute('src',scriptURL);
  document.getElementsByTagName('head')[0].appendChild(newScript);
}
QDB.tts.Source.prototype.loadExternalScripts = function() {
  for (var externalScript in this.externalScripts)
    this.loadExternalScript(this.externalScripts);
};
QDB.tts.Source.prototype.requestURL = function(text) {
  return this.baseURL + '?' + this.requestParamsToQuerySubstring() + '&text=' + encodeURIComponent(text);
};
QDB.tts.Source.prototype.requestParamsToQuerySubstring = function() {
  var requestParamsList = [];
  for (requestParam in this.requestParams)
    requestParamsList.push(requestParam + '=' + this.requestParams[requestParam]);
  return requestParamsList.join('&');
};

WebAnywhere = IVONASpeechCloud = jQueryAPI = iSpeech = Ericsson = GoogleTranslate = GoogleTranslate2 = new QDB.tts.Source();

WebAnywhere = function() {
  this.externalScripts = ['tts/wa.js'];
};
WebAnywhere.prototype = new QDB.tts.Source();
WebAnywhere.prototype.constructor = WebAnywhere;

Ericsson = function() {
  this.requestParams = {
    devkey: '5mmx251XsW149Hbls6pFF6g764FyHx9MqaK1tmyY',
    voice: 0,
    format: 'mp3',
    lang: 'en_us',
  };
  this.baseURL = 'http://tts.labs.ericsson.net/read';
  
  //this.externalScripts = ['http://www.schillmania.com/projects/soundmanager2/script/soundmanager2.js'];
  //this.loadExternalScripts();
  
  this.speak = function(text) {
    //var URL = this.requestURL(text);
    URL = 'tts/ericsson.mp3';
    var audio = new Audio();
    audio.src = URL;
    audio.play();
  }
};
Ericsson.prototype = new QDB.tts.Source();
Ericsson.prototype.constructor = Ericsson;

iSpeech = function() {
  this.requestParams = {
    //apikey: '86acdf0e28a23618846cfd1a81a8bc9',
    apikey: 'developerdemokeydeveloperdemokey',
    action: 'convert',
    voice: 'usenglishfemale',
    format: 'mp3',
    //frequency: '44100',
    bitrate: '48',
    speed: '0',
    startpadding: '0',
    endpadding: '0',
  };
  this.baseURL = 'http://api.ispeech.org/api/rest';
  
  this.speak = function(text) {
    var URL = this.requestURL(text);
    //URL = 'tts/ericsson.mp3';
    var audio = new Audio();
    audio.src = URL;
    audio.play();
  };
};
iSpeech.prototype = new QDB.tts.Source();
iSpeech.prototype.constructor = iSpeech;

QDB.tts.sources = {
  WebAnywhere: WebAnywhere,
  IVONASpeechCloud: IVONASpeechCloud,
  jQueryAPI: jQueryAPI,
  iSpeech: iSpeech,
  Ericsson: Ericsson,
  GoogleTranslate: GoogleTranslate,
  GoogleTranslate2: GoogleTranslate2,
};
QDB.tts.loadSource = function(sourceName) {
  this._source = this.sources[sourceName];
  var newSource = new this._source();
  return newSource.load();
}
tts = QDB.tts.loadSource