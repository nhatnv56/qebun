var express = require('express');
var app = express();

var session = require('express-session');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

app.set('port', (process.env.PORT || 5000));
app.set('views', __dirname + '/views');
app.engine('.html',require('ejs').__express);
app.set('view engine','html');

app.use(session({secret: 'ssshhhhh'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname+'/public'));
mongoose.connect('mongodb://localhost/test');

var UserSchema = new Schema({
    email:{type: String, required: true},
    password:{type: String, required: true},
    comment: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comments' }]
});
var CommentSchema = new mongoose.Schema({
  title: {type: String, required: true},
  body: {type: String, required: true},
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'users' }
});

var User = mongoose.model('users', UserSchema);
var Comment = mongoose.model('Comments', CommentSchema);

var sess;

app.get('/',function(req,res){
    sess=req.session;
    if(sess.email){
        res.redirect('/home');
    }else{
        res.render('index');
    }
});

app.post('/login',function(req,res){
    User.findOne({
        email: req.body.email,
        password: req.body.pass
    },function(err, doc) {
        if(err){
            return handleError(err);
        }else{
            if(doc===null){
                console.log('dang nhap ko thanh cong');
                res.end('error');
            }
            sess=req.session;
            sess.email=req.body.email;
            res.end('done');
        }
    });
});

app.get('/home',function(req,res){
    sess=req.session;
    if(sess.email){
        User.findOne({email: req.session.email}).populate('comment').exec(function(err,doc) {
            if(err) console.error(err)
            else
                res.render('home',{email: sess.email, div: doc.comment});
        });
    }else{
        res.redirect('/');
    }
});

app.post('/home', function(req, res) {
    console.log(req.body);
    console.log(req.session);
    
    User.findOne({
        email: req.session.email
    },function(err,user) {
        Comment.create({
            title: req.body.title,
            body: req.body.comment,
            parent: user._id
        },function(err,comment) {
            user.comment.push(comment._id);
            user.save(function(err) {
                if(err) console.error(err)
                else{
                    console.log('success');
                }
            });
        });
    });
    res.redirect('/home');
});

app.get('/logout',function(req,res){
    req.session.destroy(function(err){
        if(err)
            console.log(err);
        else
            res.redirect('/');
    });

});

app.post('/create',function (req,res) {
    console.log(req.body.email);
    console.log(req.body.pass);
    User.create({
        email: req.body.email,
        password: req.body.pass
    },function (err, doc) {
        if(err){
            console.log(err);
            res.end('error');
        }else{
            console.log('added: \n' + doc);
            res.end('done');
        }
    });
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});
