const twit    = require("twit");
const request = require('request');
const config  = require("./configTwit.js");
const fs      = require("fs");

var twitter = new twit(config);
var user_stream = twitter.stream('user');
const execFile = require("child_process").execFile;
const spawn = require("child_process").spawn;

//Used to get tweet's id
function get_tweet_id(url){
  if (url.indexOf('https://twitter.com/') > -1){
    return url.split('/')[5];  
  }
  else{
    return false;
  }
}

//used to send direct messages
function send_twitter_dm(username, message){
  twitter.post('direct_messages/new', {
    screen_name: username,
    text: message
  }, 
  function(err, data, response){
    if (err){
      console.log('Error:', err);
    }
  });  
}

function retweet_tweet(tweet_id, user_name){
  twitter.post('statuses/retweet/:id',
    {
      id: tweet_id
    }, function(err, data, response) {
      if (err){
        send_twitter_dm(user_name, 'There was an error!\n\n' + err.message);
      }
      else{
        send_twitter_dm(user_name, 'Retweeted!');          
      }
    }
  );
}

console.log("bot running...");

user_stream.on('tweet', function (tweet) {
  twitter.get('friends/ids', { screen_name: "SimulatedArtist", stringify_ids: true },  function (err, data, response) {    
    (function(tweet){
            //mention should match text to trigger bot.
            if(tweet.text.match(/@SimulatedArtist\spicture\splease/)){
              console.log("match");
              
            var status_text = "@"+tweet.user.screen_name+" Here you go buddy!";
           var seed = Math.floor(Math.random()*1000000);
           
           var child = execFile('node',['print',seed],(err,stdout,stderr)=>{
            if (err){
                console.error('stderr',stderr);
                throw err;
            }
            var image_name = "render_"+ seed.toString() + ".png";
            var b64content = fs.readFileSync("./output/"+image_name, { encoding: 'base64' });
            console.log("image loaded");
             // first we must post the media to Twitter
            twitter.post('media/upload', { media_data: b64content }, function (err, data, response) {
            if (err){
              console.log(err);
            }
            console.log("no error");
            // now we can assign alt text to the media, for use by screen readers and
            // other text-based presentations and interpreters
            var mediaIdStr = data.media_id_string;
            var meta_params = { media_id: mediaIdStr}
            
            twitter.post('media/metadata/create', meta_params, function (err, data, response) {
              if (!err) {
                console.log("no error");
                // now we can reference the media and post a tweet (media will attach to the tweet)
                var params = { status: status_text, media_ids: [mediaIdStr], in_reply_to_status_id:tweet.id_str };
          
                twitter.post('statuses/update', params, function (err, data, response) {
                  //console.log(data)
                })
                console.log("sending image");
                child = spawn('rm',["./output/"+image_name, '-f']);
                
                child.stderr.on('data', (data) => {
                  console.log(`stderr: ${data}`);
                });
                child.on('close',(code) => {
                  console.log(`child process exited with code ${code}`);
                });
                //var dm_sender = dm.direct_message.sender.screen_name;
                //send_twitter_dm(dm_sender,dm_text,mediaIdStr);
              }
              else{
                console.log(err);
              }
            })
            });
            })
            }else{
              console.log("no match");
            }
            //console.log(tweet);
          
    })(tweet);
  });
});

