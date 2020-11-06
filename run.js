const express = require('express');
const app = express();
const port = 3000;
var AWS = require('aws-sdk');
var multer = require('multer');
var storage = multer.diskStorage({
    destination : function (req,file,cb){
        cb(null,'/uploads');
    },
    filename: function (req,file,cb){
        cb(null,file.originalname);
    }
})

var upload = multer({storage:storage})
app.set("view engine","ejs");
app.set("views","./views");
app.use(express.urlencoded({
    extended: true
}));
app.use(express.json());
AWS.config.update({
    region: "ap-southeast-1",
    endpoint: "http://dynamodb.ap-southeast-1.amazonaws.com",

});
var dynamodb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();


/***************************************  Thêm Sinh Viên */
let save = function (id,msv,ten,ngaysinh,avatar) {

    var input = {
        ID: id,
        MaSinhVien:msv,
        Ten:ten,
        NgaySinh:ngaysinh,
        avatar:avatar
    };
    var params = {
        TableName: "Student",
        Item: input
    };
    docClient.put(params, function (err, data) {
        if (err) {
            console.log("Student::save::error - " + JSON.stringify(err, null, 2));
        } else {
            console.log("Student::save::success" );
        }
    });
}
app.get('/', (req, res) => {
    res.render('index.ejs');
});
app.post('/', (req, res) => {
    var id = Math.floor(Math.random() * 100) + 1;
    var msv = req.body.txtma;
    var ten = req.body.txtTen;
    var ngaysinh = req.body.txtngaySinh;
    var avatar = req.body.txtAvata;
    save(id,msv,ten,ngaysinh,avatar);
    res.redirect('/DanhSachSV');
})

/***************************************  Load Sinh Viên */
function findUser (res) {
    let params = {
        TableName: "Student"
    };
    docClient.scan(params, function (err, data) {
        if (err) {
            console.log(JSON.stringify(err, null, 2));
        } else {
            if(data.Items.length === 0){
                res.end(JSON.stringify({message :'Table rỗng '}));
            }
            res.render('DanhSachSV.ejs',{
                data : data.Items
            });
        }
    });

}
/***************************************  Xóa Sinh Viên */
function deleteSV(res,id){
    var check = !Number.isNaN(id) ? parseInt(id) : id;
    var params = {
        TableName:"Student",
        Key:{
            "ID": check
        },
        ConditionExpression:"ID = :r",
        ExpressionAttributeValues: {
            ":r": check
        }
    };

    console.log("Attempting a conditional delete...");
    docClient.delete(params, function(err, data) {
        if (err) {
            console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("DeleteItem succeeded:", JSON.stringify(data, null, 2));
            res.redirect('/DanhSachSV');
        }
    });
}

app.get('/DanhSachSV', (req, res) => {
    findUser(res)
});
app.post('/DanhSachSV', (req, res) => {
    deleteSV(res,req.body.ID);
});
/***************************************  Sửa Sinh Viên */
function updateUser(res,id,ten,ngaySinh,avatar){
    var check = !Number.isNaN(id) ? parseInt(id) : id;
    var params = {
        TableName:"Student",
        Key:{
            "ID": check
        },
        UpdateExpression:"set Ten =:ten, NgaySinh =:ns , avatar =:a ",
        ExpressionAttributeValues: {
            ":ten": ten,
            ":ns" : ngaySinh,
            ":a" : avatar
        }
    };
    docClient.update(params, function(err, data) {
        if (err) {
            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
            res.redirect('/DanhSachSV');
        }
    });

}
/***************************************  tìm 1 Sinh Viên */
function find1User (res , id) {
    var check = !Number.isNaN(id) ? parseInt(id) : id;
    let params = {
        TableName: "Student",
        KeyConditionExpression: "#ID = :ms",
        ExpressionAttributeNames:{
            "#ID": "ID"
        },
        ExpressionAttributeValues: {
            ":ms": check
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
            res.render('updateSV.ejs',{
                data : data.Items
            });
        }
    });

}
app.get('/SuaSV',upload.single("txtAvata"), (req, res) => {
    console.log(req.file);
    find1User(res,req.query.IDupdate);
});
app.post('/SuaSV', (req, res) => {
    console.log('**************');
    console.log(parseInt(req.body.txtma));
    updateUser(res,parseInt(req.body.txtma),req.body.txtTen,req.body.txtngaySinh,req.body.txtAvata);
});
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
})
