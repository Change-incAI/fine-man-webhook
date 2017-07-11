'use strict';
 
const express = require('express');
const bodyParser = require('body-parser');

const restService = express();
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/nodeapi";
 

restService.use(bodyParser.json());
 
restService.post('/webhook', function (req, res) {
 
    console.log('hook request');
 
    try {
        var speech = 'empty speech';
 
        if (req.body) {
            var requestBody = req.body;
 
            if (requestBody.result) {
                speech = '';
 
                if (requestBody.result.action) {
					
                  //  speech += 'action: ' + requestBody.result.resolvedQuery;
				  // speech += 'action: ' + requestBody.result.action;  // original
				    if(requestBody.result.action=='name')
				  {
					  
				      var given_name = requestBody.result.parameters["given-name"];
					//  console.log(given_name);
					  MongoClient.connect(url, function(err, db) {
					  if (err) throw err;
					  var myobj = { name: given_name, studentid: "17", id: "8" };
					  db.collection("users").insertOne(myobj, function(err, res) {
						if (err) throw err;
						console.log("1 record inserted");
						db.close();
					  });
					}); 
					speech +=  requestBody.result.resolvedQuery;
					return res.json({
								speech: speech,
								displayText: speech,
								source: 'apiai-webhook-sample'
							});
				  }
				  else if(requestBody.result.action=='remember')
				  {
			
					 MongoClient.connect(url,function(err, db) {
					  if (err) throw err;
					  var query = {studentid:"17"};
					  db.collection("users").find(query).toArray(function(err, results) {
						if (err) throw err;
						
						requestBody.result.fulfillment.speech = results[0].name;
						
							speech +=  requestBody.result.fulfillment.speech;
							
							
						db.close();
						console.log('inresult: ', speech);
 
							return res.json({
								speech: speech,
								displayText: speech,
								source: 'apiai-webhook-sample'
							});
					  });
					  
					}); 
				
				
				  }
				  else
				  {
					  speech += 'action: ' + requestBody.result.resolvedQuery;
					  console.log('result: ', speech);
					  return res.json({
								speech: speech,
								displayText: speech,
								source: 'apiai-webhook-sample'
							});
				  }
					
                }
            }
        }
 
        
 
       /*  return res.json({
            speech: speech,
            displayText: speech,
            source: 'apiai-webhook-sample'
        }); */
    } catch (err) {
        console.error("Can't process request", err);
 
        return res.status(400).json({
            status: {
                code: 400,
                errorType: err.message
            }
        });
    }
});
 
restService.listen((process.env.PORT || 5000), function () {
    console.log("Server listening");
});
 
 
