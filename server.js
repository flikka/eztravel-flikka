var express = require('express')
  , http = require('http');
  
var app = express();

app.use('/', express.static(__dirname + '/public'));
app.set('port', process.env.PORT || 3000);



app.get('/travels/currentuser/', function(req, res) {
    // Obtain user info from somewhere?
    res.send("kflik@statoil.com");
});

app.get('/travels/user/:name', function(req, res) {
    // Might as well skip the username as argument fetch from somewhere.
    console.log("Trying to get travels for: " + req.params.name)
    if (req.params.name == "kflik@statoil.com") {
        res.json(
            [
            {"travelid": 12,"location":"Bergen-Odda", "type":"Taxi", 
            "price":"2000", "start":"dødstidlig","slutt" : "lenge etterpå"},
            {"travelid": 2,"location":"Odda-Fjorden", "type":"Taxi", 
            "price":"23", "start":"seint","slutt" : "lenge etterpå"},
            {"travelid": 3,"location":"Fjorden-Odda", "type":"Taxi", 
            "price":"32", "start":"mørkt","slutt" : "lenge etterpå"},
            {"travelid": 4,"location":"Odda-Bergen", "type":"Taxi", 
            "price":"2010", "start":"natt","slutt" : "lenge etterpå"}
            ]
            );
    }
    else {
        res.send("Who are you really?");
    }
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
