const express = require('express');
const router = express.Router();

const file_upload = require('express-fileupload');
router.use(file_upload());


// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
// *                                                          * // App Init //
const website_name = 'Kanji Freak';

try {
  config = require('../config');
}
catch (e) {
  console.warn('No config file found.');
}


// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
// *                                                           * // DB Init //
const pg = require('pg');
const url = require('url');

let db_url;
let pg_pool;

if (process.env.DATABASE_URL) {
  db_url = process.env.DATABASE_URL;
}
else {
  db_url = config.db.url;
}

if (db_url) {
  const params = url.parse(db_url);
  const auth = params.auth.split(':');

  const pg_config = {
    host: params.hostname,
    port: params.port,
    user: auth[0],
    password: auth[1],
    database: params.pathname.split('/')[1],
    ssl: true,
    max: 10,
    idleTimeoutMillis: 30000 };

  pg_pool = new pg.Pool(pg_config);
}
else {
  console.error('Couldn\'t connect to database as no config could be loaded.');
}

pg_pool.on('error', function(err, client) {
  console.error('Idle client error: ', err.message, err.stack);
});


// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
// *                                                 * // General Functions //
function getTimestamp() {
  return new Date(new Date().getTime()).toISOString();
}


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
    const script_file = req.files.script;

    const query = 'INSERT INTO scripts (type, title, filename, script, added) VALUES ($1, $2, $3, $4, $5);'; // eslint-disable-line max-len
    const vars = [
      req.body.type,
      req.body.title,
      script_file.name,
      script_file.data.toString('utf-8'),
      getTimestamp() ];

    pg_pool.query(query, vars, (err, result) => {
      if (err) {
        console.error(err);
      }

      res.redirect('/');
    });
  }
});

router.get('/listing', function(req, res, next) {
  let query = 'SELECT id, type, title, added, status, n_unique_kanji, n_unique_vocab, file_size FROM scripts ORDER BY '; // eslint-disable-line max-len

  if (!req.query.sort || req.query.sort == 'uploaded') {
    query += 'n_unique_kanji';
  }
  else if (req.query.sort == 'title') {
    query += 'title';
  }
  else if (req.query.sort == 'kanji') {
    query += 'n_unique_kanji';
  }
  else if (req.query.sort == 'vocab') {
    query += 'n_unique_vocab';
  }

  if (!req.query.order || req.query.order == 'desc') {
    query += ' DESC;';
  }
  else {
    query += ' ASC;';
  }

  pg_pool.query(query, (err, result) => {
    if (err) {
      console.error(err);
    }

    res.render('listing', {
      title: 'Listing - ' + website_name,
      scripts: result.rows });
  });
});

router.get('/script/:id', function(req, res, next) {
  const query = 'SELECT title, script, filename FROM scripts WHERE id = $1;';

  pg_pool.query(query, [req.params.id], (err, result) => {
    if (err) {
      console.error(err);
    }

    res.render('script', {
      title: result.rows[0].title + ' - ' + website_name,
      script: result.rows[0] });
  });
});

router.get('/kanji', function(req, res, next) {
  const query = 'SELECT * FROM kanji ORDER BY count DESC;';

  pg_pool.query(query, (err, result) => {
    if (err) {
      console.error(err);
    }

    const query = 'SELECT count(*) FROM scripts;';

    pg_pool.query(query, (err, result2) => {
      if (err) {
        console.error(err);
      }

      res.render('kanji', {
        title: 'Kanji - ' + website_name,
        kanji: result.rows,
        n_scripts: result2.rows[0].count });
    });
  });
});

router.get('/kanji/:id', function(req, res, next) {
  const query = 'SELECT id, title, n_unique_kanji, kanji_stats FROM scripts WHERE id = $1;'; // eslint-disable-line max-len

  pg_pool.query(query, [req.params.id], (err, result) => {
    if (err) {
      console.error(err);
    }

    res.render('kanji_specific', {
      title: 'Kanji (' + result.rows[0].title + ') - ' + website_name,
      script: result.rows[0],
      kanji: JSON.parse(result.rows[0].kanji_stats) });
  });
});

router.get('/vocab/:id', function(req, res, next) {
  const query = 'SELECT id, title, vocab_stats FROM scripts WHERE id = $1;';

  pg_pool.query(query, [req.params.id], (err, result) => {
    if (err) {
      console.error(err);
    }

    res.render('vocab_specific', {
      title: 'Vocab (' + result.rows[0].title + ') - ' + website_name,
      script: result.rows[0],
      vocab: JSON.parse(result.rows[0].vocab_stats) });
  });
});

module.exports = router;
