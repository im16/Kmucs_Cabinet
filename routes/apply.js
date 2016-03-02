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

var location= '/';



/* GET home page. */
router.get('/', function(req, res, next) {
  pool.getConnection(function (err, connection) {

    var studentID=getParameter('id',req.url);
    var studentName=getParameter('name',req.url);
    var studentGrade=getParameter('grade',req.url);

    var status=getParameter('status',req.url);

    var cabinet_number;

    //등록한 케비넷이 있는지 확인
    connection.query('SELECT * FROM Relation_Stu_Cab WHERE S_Id = ? ' ,studentID,function(err,rows){
      if (err) throw err;

      if(rows.length!= 0)
      cabinet_number=rows[0].CabinetNo;
      else
      cabinet_number="false";

    });

    //잘못된 접근 막을 수있도록
    var access=req.headers['referrer'] || req.headers['referer'];
    if(access==undefined) res.redirect('login');

    else{
      var cabinets=[];

      //사물함 상태확인
      connection.query('SELECT * FROM cabinet_infos  WHERE S_Grade = ? ' ,studentGrade,function(err,rows) {
        if (err) throw err;


        for(var i=0; i<rows.length; i++ )
        {
          var cabinet = { 번호: rows[i].CabinetNo, 사용: rows[i].IsUse };
          cabinets.push(cabinet);
        }


        var student_infos={ id:studentID , name:studentName, grade:studentGrade, cabinet:cabinet_number}


        if(studentGrade == 1){
          res.render('apply1',{ cabinet_status : cabinets , student_infos:student_infos, msg : status });

        }
        else if(studentGrade == 2)
        {
          res.render('apply2',{ cabinet_status : cabinets , student_infos:student_infos, msg : status });

        }
        else if(studentGrade ==3)
        {
          res.render('apply3',{ cabinet_status : cabinets , student_infos:student_infos, msg : status });
        }
        else
        {
          res.render('apply4',{ cabinet_status : cabinets , student_infos:student_infos, msg : status });

        }


      });

      }
      connection.release();
    });
  });

  router.post('/',function(req,res,next){


    var studentID=req.body.id;
    var studentName=req.body.name;
    var studentGrade=req.body.grade;
    var modify=req.body.flag;
    var cabinet_old=req.body.cabinetOld;
    var cabinet_apply=req.body.apply_cabinet;  //신청한 사물함 번호
    var status=0;

    var now = new time.Date();
    now.setTimezone('UTC-9');  //현재 시간을 받아오기 위해서

    //현재 시간을 ms로 나타낸 변수
    var current_ms = Date.UTC(now.getFullYear(),now.getMonth(),now.getDay(),now.getHours(),now.getMinutes());

    // console.log("확인"+studentID + " "+studentName+ " "+ studentGrade+" "+modify+" "+cabinet_old+" "+cabinet_apply+" ");

    pool.getConnection(function (err, connection) {

      //신청가능한 시간인가 1
      connection.query('SELECT * FROM possible_time',function(err,row){
        if(err) throw err;

        if(row[0].start_time<=current_ms&& current_ms<=row[0].end_time)
        {
          //여기서부터 신청!! 1.사물함 use비트 변경 2.관계테이블에 추가

          // 사물함 use비트 확인 (새로신청하는 사물함 cabinet_apply)  2
          connection.query('SELECT * FROM cabinet_infos  WHERE CabinetNo = ? ' ,cabinet_apply,function(err,rows) {

            if (err) throw err;

            var possible=rows[0].IsUse;

            //  console.log("캐비넷번호: "+ cabinet_apply+" 현재값은"+possible);

            if(possible>0)
            {
              possible-=1;
              connection.query('UPDATE cabinet_infos set IsUse= ? where CabinetNo=? ' ,[possible,cabinet_apply],function(err,rows) {
                if (err) throw err;

              });

              status=1;  // 캐비넷 사용한다. (성공)

              // relation instance insert작업
              connection.query('INSERT INTO Relation_Stu_Cab VALUES(?,?,?,?)' ,[studentID,cabinet_apply,studentName,studentGrade],function(err,rows) {
                if (err) throw err;
              });


                if(modify==1) //변경 신청일 경우 기존에 있던 관계 지우고, 사물함 비트 올리기
                {
                  //사물함 현재 use비트 확인하고 1개 올리기! (변경하기전 old)
                  connection.query('SELECT * FROM cabinet_infos  WHERE CabinetNo = ? ' ,cabinet_old,function(err,rows) {

                    if (err) throw err;

                    var possible=rows[0].IsUse;

                    //    console.log("캐비넷번호: "+ cabinet_old+" 현재값은"+possible);
                    var avail_use=1;

                    if(studentGrade==1)  avail_use=2;


                    if(possible<avail_use)
                    {
                      possible+=1;
                      connection.query('UPDATE cabinet_infos set IsUse= ? where CabinetNo=? ' ,[possible,cabinet_old],function(err,rows) {
                        if (err) throw err;
                      });

                      status=1;  // 캐비넷 반환한다. (성공)
                    }

                    else
                    status=4; // 에러
                  });

                  if(status==4) throw err;

                  // relation instance delete작업
                  connection.query('DELETE FROM Relation_Stu_Cab WHERE S_Id = ? AND CabinetNo= ?' ,[studentID,cabinet_old],function(err,rows) {
                    if (err) throw err;  });

                  }

                  console.log("학번:"+studentID+" 이름:"+studentName+" 사물함번호 :"+cabinet_apply+" 신청완료");
                  //작업완료! (get으로 다시보냄)
                  var sendMessage="/apply?"+"id="+studentID+"&name="+studentName+"&grade="+studentGrade+"&status="+status;
                  res.redirect(sendMessage);


                }

                else
                {
                  status=2; // 그 사이에 이미 신청했다. 다시신청하도록!
                  var sendMessage="/apply?"+"id="+studentID+"&name="+studentName+"&grade="+studentGrade+"&status="+status;
                  //     console.log("here");
                  res.redirect(sendMessage);
                }

              });   // 사물함 use비트 확인 (새로신청하는 사물함 cabinet_apply)  2 쿼리안에 변수 사용끝

            }// 신청가능 시간 or 불가능


            else{//신청 불가능한 시간이면
              status=5;
              var sendMessage="/apply?"+"id="+studentID+"&name="+studentName+"&grade="+studentGrade+"&status="+status;
              res.redirect(sendMessage);
            }

            }); //신청가능한 시간인가 1 쿼리 사용끝
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
