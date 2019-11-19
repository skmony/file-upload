var express=require('express');
var app=express();
var bodyParser=require('body-parser');
var path=require('path');
var crypto=require('crypto');
var mongoose=require('mongoose');
var multer=require('multer');
var GridFsStorage=require('multer-gridfs-storage');
var Grid=require('gridfs-stream');
var methodOverride=require('method-override');


//Middleware
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.set('view engine','ejs');


//Mongo URI
const mongoURI='mongodb://localhost:27017/file';

//Create Connection
const conn=mongoose.createConnection(mongoURI);

//Init gfs
let gfs;

conn.once('open', ()=> {
    //Init Stream
     gfs = Grid(conn.db, mongoose.mongo);
     gfs.collection('uploads');
})
// Create Storage Engine 
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    console.log(file);
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });

app.get('/', (req, res) => {
  res.render('index');
});


app.post('/upload',upload.single('file'),(req,res)=>{
  //console.log(req.file);
  //res.json({file:req.file});
  res.redirect('/');
});

app.get('/files',(req,res)=>{
  gfs.files.find().toArray((err,files)=>{
    if(!files || files.length === 0){
      return res.status(404).json({
        err:'No files found'
      });
    }else{
      res.json(files);
    }
  });
});

app.get('/files/:filename',(req,res)=>{
  gfs.files.findOne({filename:req.params.filename},(err,file)=>{
    if(!file || file.length === 0){
      return res.status(404).json({
        err:'No files found'
      });
    }else{
      res.json(file);
    }
  });
});

app.get('/pdf/:filename',(req,res)=>{
  gfs.files.findOne({filename:req.params.filename},(err,file)=>{
    if(!file || file.length === 0){
      return res.status(404).json({
        err:'No files found'
      });
    }
    if(file.contentType==="application/pdf"){      
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    }else{
      return res.status(404).json({
        err:'Not a pdf'
      });
    }

  });
});

const port=5000;

app.listen(port,()=>{
    console.log(`server started on port: ${port}`);
})