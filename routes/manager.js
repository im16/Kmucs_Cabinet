
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
    pool.getConnection(function(err,connection){
	//잘못된 접근을 막을 수 있도록.
	var access = req.headers['referrer'] || req.headers['referer'];
	if(access==undefined) res.redirect("/login");
       connection.query('SELECT * FROM StartFlag',function(err,arr){
	   if(err) throw err;
	   var str;
	   if(arr[0].flag=='0') str='유저 신청 못하고 있음';
	   else str= '유저 신청 가능함';

	   var mss='관리자 페이지 입니다.';

	res.render('manager',{message:mss,sta:'get',string:str});
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

	pool.getConnection(function(err,connection){
		if(func1=='start'){
			connection.query('UPDATE StartFlag set flag=?','1',function(err,arr){
				if(err) throw err;
		        str="유저 신청 가능함"
			mss="유저가 신청 가능하게 됬습니다";
			sta1='start';
			res.render('manager',{message:mss,sta:sta1,string:str});
			});
		} // 신청 가능
		if(func1=='end'){
			connection.query('UPDATE StartFlag set flag=?','0',function(err,arr){
                                if(err) throw err;

                        mss="유저가 신청 불가능하게 됬습니다";
			str="유저 신청 불가능함"
                        sta1='end';
                        res.render('manager',{message:mss,sta:sta1,string:str});
			});
		} // 신청을 불가능
		if(func1=='stuDel')// 학생 정보 모두 삭제.
		{
			connection.query('DELETE FROM student_infos',function(err,rows){
				if(err) throw err;
				mss="학생정보 모두 삭제 성공";
				sta1='stuDel';
				res.render('manager',{message:mss,sta:sta1});
			});
		}
		if (func1=='relDel') //관계 데이터 모두 삭제.
		{
			connection.query('SELECT * FROM Relation_Stu_Cab',function(err,rows){
                                if(err) throw err;
				console.log(rows.length);

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
				sta1='relDel'
				res.render('manager',{message:mss,sta:sta1});
				});
                        });

		}
		if(func1=='list') // 신청 정보 모두 보기
		{
			connection.query('SELECT * FROM Relation_Stu_Cab',function(err,rows){
				if(err) throw err;
				mss="보여 줄께"
				info=rows;
				sta1='list'
				console.log(rows);
				res.render('manager',{message:mss,rel_info:info,sta:sta1});

			});
		}




connection.release();


	});


});






module.exports = router;
