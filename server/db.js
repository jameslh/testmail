var fs = require('fs-extra'),
	path = require('path');

var DB_PATH = path.join(__dirname, 'data'),
	FS_PATH = path.join(DB_PATH, 'mail_attachments');

// ensure paths
fs.mkdirsSync(DB_PATH);
fs.mkdirsSync(FS_PATH);

// init database
var dbEngine = require('tingodb')();
var db = new dbEngine.Db(__dirname+'/data', {});

var emails = db.collection('emails');
emails.createIndex( { subject: "text" } );

module.exports = {db, emails, DB_PATH, FS_PATH};