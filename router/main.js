'use strict'
module.exports = function(app){
var bodyParser = require("body-parser");
var http = require('http');
var kafka = require('kafka-node');
var Consumer = kafka.Consumer;
var Producer = kafka.Producer;

var client = new kafka.Client('localhost:2181');
var producer = new Producer(client);

app.use(bodyParser.urlencoded({extended : true}));
    
app.get("/TIScreen",function(req,res){
    
    
    res.render("index"); 
    
});   

app.post("/calculateTI",function(req,res){
    let questioncode = req.body.questioncode;
    let adjvalues = req.body.countrycodevalues;
    
    let data = {};
    let resilientvalue = 0;
    let competitivevalue = 0;
    
    //Pass question code to kafka topic and multiply with adjvalues and print on screen
    var payloads = [{topic: 'TItopics', messages: questioncode, partition: 0 }];
    
     producer.send(payloads, function (err, data) {
		console.log('Pushed Successfully');
		
		//some delay and then read back from another topic
		
		setTimeout(fromConsumer, 2000);
		function fromConsumer(){
        	 var consumer = new Consumer(
                    client,
                    [
                        { topic: 'TItopics2', partition: 0 }
                    ],
                    {
                        autoCommit: false
                    }
                );
                
                consumer.on('message', function (message) {
                    //console.log(message);
                    //Get json response from kafa topics
                    var responseobj = JSON.parse(message);
                    resilientvalue = responseobj.resilientvalue * adjvalues;  // Kafka topic must generate json response as {resilientvalue : <somevalue>, competitivevalue : <somevalue>}
                    competitivevalue = responseobj.competitivevalue * adjvalues;
                    
                    data  = {"Resilient" : resilientvalue , "Competitive" : competitivevalue};
                    
                    res.send(data);
                });
		}
		
     });
    
});  
    
}

