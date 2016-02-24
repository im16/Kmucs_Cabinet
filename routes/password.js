
var express = require('express');
var mysql = require('mysql');
var router = express.Router();

var pool = mysql.createPool({
  connectionLimit: 3,
  host: '52.69.46.152',
  user: 'kmucsHI',
  database: 'cabinet',
  password: 'kmucs'
});

var location='/';

/* GET home page. */
router.get('/', function(req, res, next) {

	var StudentID=getParameter('id', req.url);
	res.render('password',{StudentID:StudentID});
});

router.post('/',function(req,res,next){
  pool.getConnection(function (err, connection) {

//	S_Id이자 변경 전 비밀번호, 비밀번호 변경시 필요함
	 var before_pwd=req.body.SId;

	 //password.ejs에서 변경한 비밀번호를 가져온다
	   var changed_pwd=req.body.pwd;
	//로그한번찍어보자
	console.log("before_pwd: " +before_pwd+changed_pwd);





	//기존의 비밀번호를 새로운 비밀번호로 변경하는 쿼리
        connection.query('UPDATE student_infos set S_Password= ? where S_Id = ? ' ,[changed_pwd,before_pwd],function(err,rows) {
             if (err) throw err;

             });
		//바꾼 후 로그인 페이지로 다시 이동
		 var sendMessage="/login";
                res.redirect(sendMessage);

      //  res.render('apply1');

      connection.release();
    });
  });

var getParameter = function (param,my_url) {
    var returnValue;
    var url = my_url;
    var parameters = (url.slice(url.indexOf('?') + 1, url.length)).split('&');
    for (var i = 0; i < parameters.length; i++) {
        var varName = parameters[i].split('=')[0];
        if (varName.toUpperCase() == param.toUpperCase()) {
            returnValue = parameters[i].split('=')[1];
            return decodeURIComponent(returnValue);
        }
    }
};



module.exports = router;
