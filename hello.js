var http = require('http');
var express = require('express');
var postgres = require('pg');
var bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

var connectionString = 'postgres://postgres:taxrates1@localhost:5432/taxrates';

var client = new postgres.Client(connectionString);
client.connect();


app.get('/', function(req, res) {
    bodyParser.json(req.body);
    var amount = parseFloat(req.query['amount']);
    var state = req.query['state'];
    var results = [];
    //Get postgres client from connection pool
    postgres.connect(connectionString, function(err, client, done) {
        //handle connection errors
        if(err) {
            done();
            console.log(err);
            return res.status(500).json({success: false, data: err});
        }
        var query = client.query('SELECT * FROM rates ORDER BY statecode ASC');
        //stream query results one at a time
        query.on('row', function(row) {
            results.push(row);
        });
        //Close connection
        query.on('end', function() {
            done();
            for(i=0; i < results.length; i++){
                if(results[i]['statecode'] == state){
                    var taxRate = results[i]['salestaxrate'];
                    var total = (amount * (1 + taxRate)).toFixed(2);
                }
            }
            res.render('app', {amount: amount, state: state, taxRate: taxRate, total: total, results: results});
        });
    });
});

app.listen(8080);
