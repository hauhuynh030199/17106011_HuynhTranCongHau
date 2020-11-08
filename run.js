const express = require('express');
const app = express();
const port = 3000;
var AWS = require('aws-sdk');
app.set("view engine","ejs");
app.set("views","./views");
app.use(express.urlencoded({
    extended: true
}));
app.use(express.json());
AWS.config.update({
    region:"us-east-2",
    enpoint:"https://dynamodb.us-east-2.amazonaws.com",

});
var dynamodb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();


let save = function (maSP,tenSP,SL) {

    var input = {
        maSP: maSP,
        TenSP:tenSP,
        soluong:SL,
    };
    var params = {
        TableName: "Sanpham",
        Item: input
    };
    docClient.put(params, function (err, data) {
        if (err) {
            console.log("SanPham::save::error - " + JSON.stringify(err, null, 2));
        } else {
            console.log("SanPham::save::success" );
        }
    });
}
app.get('/', (req, res) => {
    res.render('index.ejs');
});
app.post('/', (req, res) => {
    var msp = req.body.txtma;
    console.log(msp);
    var tensp = req.body.txtTen;
    var sl = req.body.txtSL;
    save(msp,tensp,sl);
    res.redirect('/DanhSachSP');
})

function findUser (res) {
    let params = {
        TableName: "Sanpham"
    };
    docClient.scan(params, function (err, data) {
        if (err) {
            console.log(JSON.stringify(err, null, 2));
        } else {
            if(data.Items.length === 0){
                res.end(JSON.stringify({message :'Table rỗng '}));
            }
            res.render('DanhSachSP.ejs',{
                data : data.Items
            });
        }
    });

}

app.get('/DanhSachSP', (req, res) => {
    findUser(res)
});

function updateUser(res,id,ten,sl){
    var params = {
        TableName:"Sanpham",
        Key:{
            "maSP": id
        },
        UpdateExpression:"set TenSP =:ten, soluong =:ns  ",
        ExpressionAttributeValues: {
            ":ten": ten,
            ":ns" : sl
        }
    };
    docClient.update(params, function(err, data) {
        if (err) {
            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
            res.redirect('/DanhSachSP');
        }
    });

}

function find1User (res , id) {
    let params = {
        TableName: "Sanpham",
        KeyConditionExpression: "#ID = :ms",
        ExpressionAttributeNames:{
            "#ID": "maSP"
        },
        ExpressionAttributeValues: {
            ":ms": id
        }
    };
    docClient.query(params, function (err, data) {
        if (err) {
            console.log(JSON.stringify(err, null, 2));
        } else {
            if(data.Items.length === 0){
                res.end(JSON.stringify({message :'Table rỗng '}));
            }
            console.log(data.Items)
            res.render('updateSP.ejs',{
                data : data.Items
            });
        }
    });

}
app.get('/SuaSV', (req, res) => {
    console.log('**************');
    console.log(' sadasd'+req.query.IDupdate);
    find1User(res,req.query.IDupdate);
});
app.post('/SuaSV', (req, res) => {
    console.log('**************');
    updateUser(res,req.body.txtma,req.body.txtTen,req.body.txtsoluong);
});
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
})
