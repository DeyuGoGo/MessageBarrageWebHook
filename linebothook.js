var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');
const line = require('@line/bot-sdk');
var EVENT_NAME = 'MessageBarrage';
var LINE_API_REPLY = "https://api.line.me/v2/bot/message/reply";
var LINE_API_ACCESSTOKEN = "https://api.line.me/v2/oauth/accessToken";
var LINE_CLIENT_ID = "1544272688"
var LINE_CLIENT_SECRET = "b178bd50b9523568c2e5167aab025534"
var URL_FCM_MEESSAGE = "https://fcm.googleapis.com/fcm/send";
var API_GET_TOKENS =  "https://us-central1-barrage-demo.cloudfunctions.net/getTokens";
var FCM_API_KEY = "key=AIzaSyAhYVLmy3R7A3B35Zn7YCjcddguRLazr6U";

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json())
app.post('/postBarrge', (req, res) => {
  let events = req.body.events
  if(!events){
    res.send("No data?")
    return;
  }
  console.log(JSON.stringify(req.body));
  processOnLinePost(events,res)
});

// Request body
// {
//   "replyToken": "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA",
//   "type": "message",
//   "timestamp": 1462629479859,
//   "source": {
//     "type": "user",
//     "userId": "U4af4980629..."
//   },
//   "message": {
//     "id": "325708",
//     "type": "text",
//     "text": "Hello, world!"
//   }
// }
const processOnLinePost = async (events,res) => {
  try {
    let accessToken = await getAccessToken()
    let registration_ids = await getFcmRegistration_ids()
    for(var i=0; i<events.length; i++){
      const lineEvent = events[i];
      if(lineEvent.type==='message'){
        let profile = await getLineUserName(accessToken,lineEvent.source.userId)
        let result = await sendFcmToDevices(registration_ids,lineEvent.message.text,profile.displayName,lineEvent.message.type)
      }
    }
    res.send('Success?')
  } catch (e) {
    res.send('Fuck you?')
  }
}

const getAccessToken = () => {
  return new Promise((resolve, reject) =>{
    const payload = {
      grant_type: 'client_credentials',
      client_id: LINE_CLIENT_ID,
      client_secret: LINE_CLIENT_SECRET
    }
    request.post({
    url: LINE_API_ACCESSTOKEN,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    form: payload
  },(error , response , body)=>{
    if (!error && response.statusCode == 200) {
      resolve(JSON.parse(body).access_token);
    } else {
      reject(error);
    }
  });
 });
}


const getFcmRegistration_ids = () => {
  return new Promise((resolve, reject) =>{
    const payload = {
      uid: EVENT_NAME
    };
    request.post(
      {
      url: API_GET_TOKENS,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify(payload)
    },function(error , response , body){
      if (!error && response.statusCode == 200) {
        resolve(JSON.parse(body).tokens);
      } else {
        reject(error);
      }
    });
  });
}

const getLineUserName = (accessToken,userid) =>{
  const client = new line.Client({channelAccessToken: accessToken})
  return client.getProfile(userid)
}

const sendFcmToDevices = (registration_ids,message,userName,type)=>{
  return new Promise((resolve, reject) =>{
    const payload = {
      registration_ids: registration_ids,
      data: {
        userName: userName,
        type: type,
        message: message
      }
    };
    request.post({
      url: URL_FCM_MEESSAGE,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': FCM_API_KEY
      },
      body: JSON.stringify(payload)
    }, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        resolve(body);
      } else {
        reject(error);
      }
    });
  });
}

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
