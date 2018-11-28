const express = require('express');
const router = express.Router();

const file_upload = require('express-fileupload');
router.use(file_upload());


// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
// *                                                          * // App Init //
const website_name = 'Kanji Freak';


// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
// *                                                           * // Routing //
router.get('/', function(req, res, next) {
  res.render('index', { title: website_name });
});

router.get('/upload', function(req, res, next) {
  res.render('upload', { title: 'Upload a Script - ' + website_name });
});

router.post('/upload', function(req, res, next) {
  if (Object.keys(req.files).length == 0) {
    return res.status(400).send('No files were uploaded.');
  }
  else {
    // const script_file = req.files.script;
    res.redirect('/');
  }
});

module.exports = router;
