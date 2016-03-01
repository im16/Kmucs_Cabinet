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


/* GET home page. */
router.get('/', function(req, res, next) {
	var message='start';
	res.render('login',{ee: message});
	res.console("Received get request");
});



router.post('/',function(req,res,next){
	 pool.getConnection(function (err, connection) {
    //비밀번호변경페이지로넘어가기
    var edit_pass = req.body.edit_password;
    if(edit_pass=='edit')
    res.redirect('/password');

    //로그인 화면에서 입력한 정보들
	    var login_id=req.body.studentID;
        var login_name=req.body.sname;
        var login_pwd=req.body.pwd;

	//관리자는 페이지
	if(login_id=='kmucs'&login_name=='manager'&login_pwd=='kmucs')
	res.redirect('/manager');




	// Use the connection
        connection.query('SELECT * FROM student_infos WHERE S_Id = ? AND S_Name = ?',[login_id,login_name],function(err,rows) {
            if (err) throw err;
         var message="";

	//쿼리로 값을 셀렉트하는데 성공하면(정보가 있으면)
          if(rows.length!= 0)
            {
                var money=rows[0].IsMoney;
                var name = rows[0].S_Name;
                var id = rows[0].S_Id;
                var grade = rows[0].S_Grade;

                console.log(money,name,id,grade);
    		//돈을 안냈으면 이리로
                if(money==0)
                  message="학생회비를 미납하셨습니다.";
    		//학번과 비밀번호가 같은 경우, 즉 초기상태 >> 여기서 password.js로 바로 넘어감
               else if(login_pwd == login_id){
                 var sendMessage="/password?"+"id="+rows[0].S_Id;
                 res.redirect(sendMessage);
                 }
              else if(login_pwd != rows[0].S_Password)
                   message="비밀번호가 일치하지 않습니다.";

    		// 원래의 경우, 비밀번호 변경 후에는 여기로 와서  사물함 신청페이지로
               else {
                 var sendMessage="/apply?"+"id="+rows[0].S_Id+"&name="+rows[0].S_Name+"&grade="+rows[0].S_Grade+"&status=0";
                 res.redirect(sendMessage);
                 }

            }
	//일치하는 정보가 없으면이리로 온다
          else
              message="일치하는 학생정보가 없습니다.";

            res.render('login', {title: 'test', ee:message});
            connection.release();


      });
    });
});


module.exports = router;
