const fs = require('fs-extra'),
	express = require('express'),
	_ = require('lodash'),
	db = require('../db'),
	email = require('../lib/email-lib');

const emailRouter = express.Router();
module.exports = emailRouter;

emailRouter.get('/', async (req, res) => {
	try {
		let cols = _.get(req.query, 'columns');
		let order = _.get(req.query, 'order');
		let sortBy = _.map(order, (c,i) => {
			var col = _.get(cols, c.column);
			if(col && (col.name || col.data)) {
				return [col.name || col.data, c.dir == 'desc' ? -1 : 1];
			}
			return;
		});
		let results = await email.findPaged({
			pageSize: +req.query.length,
			start: +req.query.start,
			search: _.get(req.query, 'search.value', req.query.search),
			sortBy
		});
		let stats = await email.getStats();
		let out = {
			data: results.data,
			draw: parseInt(req.query.draw),
			recordsTotal: stats.count,
			recordsFiltered: results.count,
		};
		res.json(out);
	} catch (e) {
		res.status(500).json(e.toString());
	}
});

emailRouter.get('/:id(\\d+)', async (req, res) => {
	try {
		var data = await email.get(+req.params.id);
		res.json(data);
	} catch (e) {
		res.status(500).json({ error: true, msg: `Could not locate message ${_id}` });
	}
});

emailRouter.get('/:id(\\d+)/content', async (req, res) => {
	try {
		var data = await email.get(+req.params.id);
		res.send(data.html ? data.textAsHtml : data.text); res.json(data);
	} catch (e) {
		res.status(500).json({ error: true, msg: `Could not locate message ${_id}` });
	}
});

emailRouter.get('/:id/attachment/:checksum', async (req, res) => {
	let collection = db.emails;
	let _id = +(req.params.id || '');
	let checksum = req.params.checksum || '';
	if (!_id || !checksum) return res.status(500).send("Missing required parameters");
	try {
		let att = await email.getAttachment(_id, checksum);
		let headers = {};
		res.type(att.contentType);
		if (att.contentType.indexOf('image') == -1) {
			headers["Content-Disposition"] = 'attachment; filename="' + att.basename + '"';
		}
		res.sendFile(att.checksum, { root: db.FS_PATH, headers: headers }, function (err) {
			if (err) res.status(500).send(err.message);
		});
	} catch (e) {
		res.status(500).json({ error: true, msg: `Could not locate attachment ${_id}/${checksum}` });
	}
});

emailRouter.delete('/:id(\\d+)', async (req, res) => {
	let _id = +(req.params.id || '');
	try {
		await email.delete(_id);
		res.json(true);
	} catch(e){
		return res.status(500).json(e.toString());
	}
});

emailRouter.delete('/', async (req, res) => {
	try {
		await email.deleteAll();
		res.json(true);
	} catch(e){
		return res.status(500).json(e.toString());
	}
});

emailRouter.get('/stats', function (req, res) {
	let collection = db.emails;
	collection.count(function (err, count) {
		if (err) {
			return res.status(500).json(err || { error: true, msg: 'Unspecified error' });
		}
		res.status(200).json({ count: count });
	});
});