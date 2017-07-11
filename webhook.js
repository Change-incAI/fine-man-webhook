'use strict';

const express = require('express');
const bodyParser = require('body-parser');
var request = require('ajax-request'); // for ajax request
var cheerio = require("cheerio"); // for dom accesss
var http = require("https"); // for imgur image
const restService = express();
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/nodeapi";


restService.use(bodyParser.json());

restService.post('/webhook', function(req, res) {

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
                    if (requestBody.result.action == 'name') {

                        var given_name = requestBody.result.parameters["given-name"];
                        //  console.log(given_name);
                        MongoClient.connect(url, function(err, db) {
                            if (err) throw err;
                            var myobj = {
                                name: given_name,
                                studentid: "17",
                                id: "8"
                            };
                            db.collection("users").insertOne(myobj, function(err, res) {
                                if (err) throw err;
                                console.log("1 record inserted");
                                db.close();
                            });
                        });
                        speech += requestBody.result.resolvedQuery;
                        return res.json({
                            speech: speech,
                            displayText: speech,
                            source: 'apiai-webhook-sample'
                        });
                    } else if (requestBody.result.action == 'remember') {

                        MongoClient.connect(url, function(err, db) {
                            if (err) throw err;
                            var query = {
                                studentid: "17"
                            };
                            db.collection("users").find(query).toArray(function(err, results) {
                                if (err) throw err;

                                requestBody.result.fulfillment.speech = results[0].name;

                                speech += requestBody.result.fulfillment.speech;


                                db.close();
                                console.log('inresult: ', speech);

                                return res.json({
                                    speech: speech,
                                    displayText: speech,
                                    source: 'apiai-webhook-sample'
                                });
                            });

                        });


                    } else if (requestBody.result.action == 'learn') {
                        var user_input = requestBody.result.resolvedQuery;


                        request({
                            url: 'https://www.google.co.in/search',
                            method: 'GET',
                            data: {
                                q: user_input
                            }
                        }, function(err, res1, body) {

                            console.log(body);
                            var $ = cheerio.load(body);
                            var d = 1;
                            speech = 'you can try these links: ';
                            $(".r > a").each(function() {
                                if (d <= 3) {
                                    var link = $(this);
                                    var text = link.text();
                                    var href = link.attr("href");
                                    // get the exact link from href
                                    //console.log(text+" -> " + href);  
                                    href = href.substr(7); // remove /url?q=
                                    //console.log(href);
                                    var index = href.search("&sa="); // remove the string after &sa=
                                    href = href.slice(0, index);
                                    console.log(href);

                                    requestBody.result.fulfillment.speech = "\n" + href;
                                    //you can try this link http://www.cprogramming.com/begin.html

                                    speech += requestBody.result.fulfillment.speech;

                                }
                                console.log('result: ', speech);

                                d++;
                            });
                            return res.json({
                                speech: speech,
                                displayText: speech,
                                source: 'apiai-webhook-sample'
                            });

                        });


                    } else if (requestBody.result.action == 'smalltalk.appraisal.welcome') {
                        request({
                            url: 'http://api.forismatic.com/api/1.0/',
                            method: 'GET',
                            data: {
                                method: 'getQuote',
                                key: '457653',
                                format: 'json',
                                lang: 'en'

                            }
                        }, function(err, res2, datas) {

                            console.log(datas);
                            datas = JSON.parse(datas);
                            console.log(datas.quoteText);
                            // requestBody.result.fulfillment.speech = datas.contents.quotes[0].quote;
                            requestBody.result.fulfillment.speech = datas.quoteText + "\n- " + datas.quoteAuthor;

                            speech += requestBody.result.fulfillment.speech;
                            console.log('result: ', speech);
                            return res.json({
                                speech: speech,
                                displayText: speech,
                                source: 'apiai-webhook-sample'
                            });

                        });

                    } else if (requestBody.result.action == 'gallery') {

                        //https://api.imgur.com/3/gallery/search/{sort}/{page}
                        //q_exactly
                        // var txt = "The doors we open and close each day decide the lives we live";
                        var options = {
                            hostname: 'api.imgur.com',
                            path: '/3/gallery/search/time/1/?q=inspire',
                            headers: {
                                'Authorization': 'Client-ID 7d836875a8c1f08'
                            },
                            json: true,
                            method: 'GET'
                        };
                        // https://api.imgur.com/3/gallery/random/random/0

                        var req = http.request(options, function(resultant) {
                            var dataQueue = "";
                            resultant.on("data", function(d) {
                                dataQueue += d;
                            });
                            resultant.on("end", function() {

                                var jsondata = JSON.parse(dataQueue);
                                //console.log(jsondata);
                                console.log(jsondata.data[0].link);
                                //console.log(jsondata.data[1].link);
                                requestBody.result.fulfillment.speech = jsondata.data[0].link;

                                speech += requestBody.result.fulfillment.speech;

                                console.log('result: ', speech);
                                return res.json({
                                    speech: speech,
                                    displayText: speech,
                                    source: 'apiai-webhook-sample'
                                });
                            });
                        });

                        req.on('error', function(e) {
                            console.error(e);
                        });

                        req.end();
                    } else if (requestBody.result.action == 'imgur') {
                        //https://api.imgur.com/3/gallery/hot/viral/0.json
                        var options = {
                            hostname: 'api.imgur.com',
                            path: '/3/gallery/top/time/0.json',
                            headers: {
                                'Authorization': 'Client-ID 7d836875a8c1f08'
                            },
                            json: true,
                            method: 'GET'
                        };
                        var req = http.request(options, function(resultant) {

                            var dataQueue = "";
                            resultant.on("data", function(d) {
                                dataQueue += d;
                            });
                            resultant.on("end", function() {
                                var jsondata = JSON.parse(dataQueue);
                                //console.log(jsondata);
                                console.log(jsondata.data[0].link);
                                //console.log(jsondata.data[1].link);
                                //http://imgur.com/a/iZVEH
                                var $ = cheerio.load(jsondata.data[0].link);
                                var d = 1;

                                $(".post-image > img").each(function() {
                                    console.log("hii");
                                    var img = $(this);
                                    console.log(img);
                                    var img_src = img.attr("src");
                                    console.log(img_src);
                                    d++;
                                });

                                requestBody.result.fulfillment.speech = jsondata.data[0].link;

                                speech += requestBody.result.fulfillment.speech;

                                console.log('result: ', speech);
                                return res.json({
                                    speech: speech,
                                    displayText: speech,
                                    source: 'apiai-webhook-sample'
                                });
                            });
                        });
                        req.on('error', function(e) {
                            console.error(e);
                        });

                        req.end();


                    } else if (requestBody.result.action == 'jokes') {
                        request({
                            //url: 'http://api.yomomma.info', 
                            //url: 'http://api.icndb.com/jokes',

                            url: 'http://webknox.com:8080/jokes/random',
                            method: 'GET',
                            data: {
                                apiKey: 'bejjddgbjjoegudedkbxpziwvfbwhzj'
                            }

                        }, function(err, res1, output) {
                            console.log(output);

                            var jsonout = JSON.parse(output);
                            console.log(jsonout.joke);
                            requestBody.result.fulfillment.speech = jsonout.joke;

                            speech += requestBody.result.fulfillment.speech;

                            console.log('result: ', speech);
                            return res.json({
                                speech: speech,
                                displayText: speech,
                                source: 'apiai-webhook-sample'
                            });
                        });

                    } else {
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

restService.listen((process.env.PORT || 5000), function() {
    console.log("Server listening");
});