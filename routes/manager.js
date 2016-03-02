
var express = require('express');
var mysql = require('mysql');
var router = express.Router();
var time = require('time');
var pool = mysql.createPool({
  connectionLimit: 3,
  host: 'localhost',
  user: 'kmucsHI',
  database: 'cabinet',
  password: 'kmucs'
});

var location='/';

/* GET home page. */
router.get('/', function(req, res, next) {
  pool.getConnection(function(err,connection){

	//잘못된 접근을 막을 수 있도록.
	 var access = req.headers['referrer'] || req.headers['referer'];
   if(access==undefined) res.redirect("/login");
   var mss='관리자 페이지 입니다.';
   var info;
   connection.query('SELECT * FROM Relation_Stu_Cab',function(err,rows){
     if(err) throw err;
     info=rows;
     res.render('manager1',{message:mss,rel_info:info});
   });
	connection.release();
  });
 });

router.post('/', function(req,res,next){
	var func1 = req.body.a;
  var mss;
  var info;
	var sta1;
	var str;
  var info;

	pool.getConnection(function(err,connection){

    connection.query('SELECT * FROM Relation_Stu_Cab',function(err,rows){
      if(err) throw err;
      info=rows;
    });

    if(func1=="time_setting")
    {
      var now = new time.Date();
      now.setTimezone('UTC-9');

      var start_time = req.body.start_time;
      var end_time = req.body.end_time;
      var start_timeArr = start_time.split(':');
      var end_timeArr = end_time.split(':');
      var start_ms = Date.UTC(now.getFullYear(),now.getMonth(),now.getDay(),start_timeArr[0],start_timeArr[1]);
      var end_ms = Date.UTC(now.getFullYear(),now.getMonth(),now.getDay(),end_timeArr[0],start_timeArr[1]);

     connection.query('DELETE FROM possible_time',function(err,rows){
        if(err) throw err;
      });
      connection.query('INSERT INTO possible_time VALUES(?,?)' ,[start_ms,end_ms],function(err,rows) {
        if (err)
          {
            throw err;
          }
          var mss="시간설정 성공"
          res.render('manager1',{message:mss,rel_info:info});
      });


    }

		if(func1=='student_del')// 학생 정보 모두 삭제.
		{
			connection.query('DELETE FROM student_infos',function(err,rows){
				if(err) throw err;
				mss="학생정보 모두 삭제 성공";
				res.render('manager1',{message:mss,rel_info:info});
			});
		}
		else if (func1=='relation_del') //관계 데이터 모두 삭제.
		{
			connection.query('SELECT * FROM Relation_Stu_Cab',function(err,rows){
        if(err) throw err;

				for(var i=0; i<rows.length; i++)
				{
					var cabinetNo=rows[i].CabinetNo;
					connection.query('SELECT * FROM cabinet_infos  WHERE CabinetNo = ? ' ,cabinetNo,function(err,arr) {
     					        if (err) throw err;
      					        var possible=arr[0].IsUse;
						var studentGrade=arr[0].S_Grade;
					        var avail_use=1;
						console.log('hi'+possible);
      						if(studentGrade==1){ avail_use=2;}


      						if(possible<avail_use)
     						{
     	   						possible+=1;

							console.log(possible);
        						connection.query('UPDATE cabinet_infos set IsUse= ? where CabinetNo=? ',[possible ,cabinetNo],function(err,rows) {
          							if (err) throw err;

        						});
						}

					  });
				}
				connection.query('DELETE FROM Relation_Stu_Cab',function(err,rows){
                                if(err) throw err;



        mss="관계정보 모두 삭제 성공"
				res.render('manager1',{message:mss,rel_info:info});
				});
    });

	}

 connection.release();
 });
});






module.exports = router;
