var fs = require('fs');
var exec = require('child_process').exec;

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

global.ssa = {};
try {
  global.ssa = require("../khk-ssa/khk-access/index.js")();
} catch(e) {
  console.log("Failed to contact khk-ssa, please clone it from the repo adjacent to this folder.");
}

console.log(ssa);

app.use(ssa.navbar("TMFMAT"));

var forwardersFile = path.join(__dirname, 'forwarders');

app.get('/', function(req, res){
  //load alias file to string
  var forwarders = fs.readFileSync(forwardersFile, 'utf8');
  //convert to json format like:
  /*
    [ { sentTo: 'contact@delta.khk.org',
      forwardTo: [ 'josephldailey@gmail.com' ] },
    { sentTo: 'president@delta.khk.org',
      forwardTo: [ 'josephldailey@gmai.com', 'iankpowell@gmail.com' ] } ]
  */
  forwarders = forwarders.split('\n');
  var entries = [];
  for (var i = 0; i < forwarders.length; i++) {
    if(forwarders[i] && forwarders[i].length > 0) {
      var keyval = forwarders[i].split('\t');
      entries.push({
        sentTo:keyval[0],
        forwardTo:keyval[1].split(',')
      });
    }
  }
  console.log("sent\n", entries);
  if(req.query.error == 1)
    res.render('index', {mail:entries, success:0});
  else if(req.query.error == 0)
    res.render('index', {mail:entries, success:1});
	else
		res.render('index', {mail:entries});
});

var postmap = 'postmap /opt/khk-web/khk-mail/forwarders'
var reload = 'postfix reload';

app.post('/update', function(req, res){

  //build alias file from json format above
  var forwarders = "";
  var has_multiple_entries = false;//handling newlines

  //for every entry
  for (var i = 0; i < req.body.mail.length; i++) {
    //only if the entry sentTo is full and forwardTo list exists
    if(req.body.mail[i] && req.body.mail[i].sentTo && req.body.mail[i].sentTo.length > 0
    && req.body.mail[i].forwardTo){

      //only if at least one forwardTo address full
      //(others will be ignored)
      var no_children = true;
      for (var j = 0; j < req.body.mail[i].forwardTo.length; j++){
        if(req.body.mail[i].forwardTo[j]){
          no_children = false;
          break;
        }
      }
      if(no_children)
        continue;
      
      //newline for index 1+ entry
      if(has_multiple_entries)
        forwarders += '\n';

      //tab spacer
      forwarders += req.body.mail[i].sentTo + '\t';
      
      //for every forwardTo address
      var has_multiple_recips = false;//handle commas
      for (var j = 0; j < req.body.mail[i].forwardTo.length; j++) {
        //only if address is full
        console.log(i,j,req.body.mail[i].forwardTo[j]);
        if(req.body.mail[i].forwardTo[j] && req.body.mail[i].forwardTo[j].length > 0) {
        console.log(i,j,"valid");
          
          //comma for index 1+ entry
          if(has_multiple_recips)
            forwarders += ',';

          forwarders += req.body.mail[i].forwardTo[j];
          has_multiple_recips = true;
        }
      }

      has_multiple_entries = true;
    }
  }

  fs.writeFileSync(forwardersFile, forwarders, 'utf8');
  exec(postmap, function(error, stdout, stderr) {
    console.log(error, stdout, stderr);
    if(error || stderr){
      res.redirect('/?error=1');
      return;
    }
    exec(reload, function(error, stdout, stderr) {
      console.log(error, stdout, stderr);
      if(error || stderr){
        res.redirect('/?error=1');
        return;
      }
      res.redirect('/?error=0');
    });
  });
});



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  console.log(err)
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.listen(2000);
module.exports = app;
