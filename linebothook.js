var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');
var EVENT_NAME = 'MessageBarrge';
var LINE_API_REPLY = "https://api.line.me/v2/bot/message/reply";
var URL_FCM_MEESSAGE = "https://fcm.googleapis.com/fcm/send";
var API_GET_TOKENS =  "https://us-central1-barrage-demo.cloudfunctions.net/getTokens";

var FCM_API_KEY = "key=AIzaSyAhYVLmy3R7A3B35Zn7YCjcddguRLazr6U";
app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json())

app.post('/postBarrge', (req, res) => {
  console.log(req.body);
  res.send('Hello World')
  const result = req.body.events;
  for(var i=0; i<result.length; i++){
    const type = result[i]['type'];
    console.log('receive: ', type);
    if(type==='message'){
      getTokens(result[i].message.text)
    }
  }
});

function getTokens(message){
  const payload = {
    uid: EVENT_NAME
  };
  request(
    {
    url: API_GET_TOKENS,
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
    },
    method: 'POST',
    body: JSON.stringify(payload)
  },function(error , response , body){
    console.log(body);
    sendFcmToDevices(JSON.parse(body).tokens,message);
  });
}

function sendFcmToDevices(registration_ids,message){
  console.log("registration_ids : " + registration_ids);
  const payload = {
    registration_ids: registration_ids,
    data: {
      message: message
    }
  };
  request({
    url: URL_FCM_MEESSAGE,
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': FCM_API_KEY
    },
    method: 'POST',
    body: JSON.stringify(payload)
  }, function(error, response, body) {
    if (error) {
      console.log('Error sending message: ', error);
    } else if (response.body.error) {
      console.log('Error: ', response.body.error);
    }
    console.log('send response: ', body);
  });
}

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
