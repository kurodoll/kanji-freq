const express = require('express');
const router = express.Router();


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

module.exports = router;
