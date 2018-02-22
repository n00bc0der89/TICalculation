'use strict'
module.exports = function(app) {
    var bodyParser = require("body-parser");
    var http = require('http');
    var kafka = require('kafka-node');
    var Consumer = kafka.Consumer;
    var Producer = kafka.Producer;
    var SSE = require('sse-node');
    var client = new kafka.Client('172.16.243.118:5181');
    var producer = new Producer(client);
    var Q = require("q");
    var async = require("async");
    let adjvalues = 0; 

    app.use(bodyParser.urlencoded({ extended: true }));

    app.get("/TIScreen", function(req, res) {


        res.render("index");

    });

    app.post("/calculateTI", function(req, res) {
        console.log("Called calculateTI function");
        let questioncode = req.body.questioncode;
        adjvalues = req.body.countrycodevalues;

        let data = {};
        let resilientvalue = 0;
        let competitivevalue = 0;

        //Pass question code to kafka topic and multiply with adjvalues and print on screen
        var payloads = [{ topic: 'TItopics3', messages: questioncode, partition: 0 }];

        console.log("Payloads is : " + JSON.stringify(payloads));

        producer.send(payloads, function(err, data) {
            console.log('Pushed Successfully');

            //some delay and then read back from another topic

            //setTimeout(fromConsumer, 5000);

            /*  function fromConsumer(){
                       
                       const options = {
                            autoCommit: true,
                            fetchMaxWaitMs: 1000,
                            fetchMaxBytes: 1024 * 1024,
                            encoding: "buffer"
                        };

                        const topics = [
                            {
                                topic: "TItopics4"
                            }
                        ];

                       var consumer = new kafka.HighLevelConsumer(client,topics, options);
                        
                        consumer.on('message', function (message) {
                            var buf = new Buffer(message.value, "binary"); 
                            var decodedMessage = JSON.parse(buf.toString());
                            console.log(decodedMessage);
                            //Get json response from kafa topics
                          //  var responseobj = JSON.parse(message);
                          //  resilientvalue = responseobj.resilientvalue * adjvalues;  // Kafka topic must generate json response as {resilientvalue : <somevalue>, competitivevalue : <somevalue>}
                          //  competitivevalue = responseobj.competitivevalue * adjvalues;
                            resilientvalue = decodedMessage;
                            data  = {"Resilient" : resilientvalue , "Competitive" : competitivevalue};
                            console.log("Sending data to screen");
                            res.send(data);
                        });

                    
                }
                //fromConsumer();
                */
        });

    });

    app.get("/getTIvalues", function(req, res) {

        var app1 = SSE(res);
        const options = {
                           /* autoCommit: true,
                            fetchMaxWaitMs: 1000,
                            fetchMaxBytes: 1024 * 1024,
                            encoding: "buffer" */
                            autoCommit: true
                        };

     const topics = [{
                    topic: "TItopics4" , partition: 0
                }];


      var consumer = new kafka.HighLevelConsumer(client, topics, options);

        setInterval(
            function() {
                async.series([
                    function(cb) {
                        

                            consumer.once('message', function(message) {
                               // var buf = new Buffer(message.value, "binary");
                               // var decodedMessage = JSON.parse(buf.toString());
                               var decodedMessage = message.value;
                                console.log(decodedMessage);
                                //Get json response from kafa topics
                                //  var responseobj = JSON.parse(message);
                                //  resilientvalue = responseobj.resilientvalue * adjvalues;  // Kafka topic must generate json response as {resilientvalue : <somevalue>, competitivevalue : <somevalue>}
                                //  competitivevalue = responseobj.competitivevalue * adjvalues;
                                cb(null, decodedMessage);
                                // return decodedMessage;
                            });

                        
                    }
                ], function(err, data) {
                    console.log(err);
                    console.log('data', data);
                    console.log("Adjvalues", adjvalues);
                    //data = data *adjvalues;

                    app1.sendEvent('getTIvalues', function() {
                        return data;
                    });
                });

            }, 1000);




        /*kafkaConsumer().then(function(scorevalue){
            console.log("From sse : " + scorevalue);
            console.log("Response is : "+ res);
            
        }); */

    });

    app.get("/getTIvalues2",function(req,res){
        console.log("Inside getTIvalues2");

        const sseclient = SSE(req, res);

        const options = {
                           /* autoCommit: true,
                            fetchMaxWaitMs: 1000,
                            fetchMaxBytes: 1024 * 1024,
                            encoding: "buffer" */
                            autoCommit: true
                        };

        const topics = [{
                    topic: "TItopics4" , partition: 0
                }];


        var consumer = new kafka.HighLevelConsumer(client, topics, options);

        setInterval(
            function() {
                 consumer.once('message', function(message) {
                                       // var buf = new Buffer(message.value, "binary");
                   // var decodedMessage = JSON.parse(buf.toString());
                   var decodedMessage = message.value;
                    console.log(decodedMessage);
                    //Get json response from kafa topics
                    //  var responseobj = JSON.parse(message);
                    //  resilientvalue = responseobj.resilientvalue * adjvalues;  // Kafka topic must generate json response as {resilientvalue : <somevalue>, competitivevalue : <somevalue>}
                    //  competitivevalue = responseobj.competitivevalue * adjvalues;
                    //cb(null, decodedMessage);
                    sseclient.send(decodedMessage);
                    // return decodedMessage;
                });
             },2000);

      
        //client.onClose(() => console.log("Bye client!"));
    });

}
