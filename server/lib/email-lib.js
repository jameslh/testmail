const fs = require('fs-extra'),
    path = require('path'),
    express = require('express'),
    db = require('../db'),
    _ = require('lodash');

exports.get = async (_id) => {
    let collection = db.emails;
    return new Promise((resolve, reject) => {
        collection.findOne({ "_id": _id }, function (err, item) {
            if (err) return reject(err);
            return resolve(item);
        });
    });
};

exports.findPaged = async (opts) => {
    let pageSize = _.get(opts, 'pageSize', 25);
    let searchTxt = _.get(opts, 'search');
    let sortBy = _.get(opts, 'sortBy', ['date', -1]);
    let skip = _.get(opts, 'start', 0);
    let query = {};

    if (searchTxt) {
        query = {
            $or: [
                { "subject": { $regex: ".*" + searchTxt + ".*", $options: "i" } },
                { "from.value.0.address": { $regex: ".*" + searchTxt + ".*", $options: "i" } },
                { "to.value.0.address": { $regex: ".*" + searchTxt + ".*", $options: "i" } },
                { "text": { $regex: ".*" + searchTxt + ".*", $options: "i" } }
            ]
        };
    }

    let orderablePaths = {
        "subject": "subject",
        "date": "date",
        "from": "from.value.0.address",
        "to": "to.value.0.address"
    };

    sortBy = _.map(sortBy, (c) => {
        if(orderablePaths[c[0]]){
            return [orderablePaths[c[0]], c[1]];
        }
    })

    return new Promise((resolve, reject) => {
        db.emails
            .find(query)
            .count(function (err, count) {
                if (err) return reject(err);
                db.emails
                    .find(query)
                    .sort(sortBy)
                    .limit(pageSize)
                    .skip(skip)
                    .toArray(function (err, result) {
                        if (err) return reject(err);
                        return resolve({ data: _.map(result, exports.shortform), count, query });
                    });

            });
    });
}

exports.getAttachment = async (_id, checksum) => {
    return new Promise((resolve, reject) => {
        // must tell tingodb to search through sub-arrays with prefix '_tiar' as stated in docs (https://github.com/sergeyksv/tingodb)
        db.emails.findOne({ "_id": _id, "attachments.checksum": checksum }, { "_tiar.attachments.checksum": 0 }, function (err, item) {
            if (err || !item) return reject(err);
            for (let i = 0; i < item.attachments.length; i++) {
                if (item.attachments[i].checksum == checksum) {
                    let att = item.attachments[i];
                    return resolve(att);
                }
            }
            return reject({ error: 'Attachment not found' });
        });
    });
}

exports.delete = async (_id) => {
    return new Promise((resolve, reject) => {
        db.emails.remove({ _id: _id }, (err, obj) => {
            if (err) return reject(err);
            return resolve(obj);
        });
    });
}

exports.deleteAll = async () => {
    return new Promise((resolve, reject) => {
        db.emails.remove({}, (err, o) => {
            if (err) return reject(err);
            try {
                fs.mkdirsSync(db.FS_PATH);
                fs.emptyDir(db.FS_PATH);
                return resolve(o);
            } catch (e) {
                return reject(e);
            }
        });
    });
}

exports.getStats = async () => {
    return new Promise((resolve, reject) => {
        db.emails.count(function (err, count) {
            if (err) return reject(err);
            return resolve({ count });
        });
    });
}

exports.insertMail = async (mail) => {
    _.each(mail.attachments, itm => {
        itm.basename = path.basename(itm.filename);
        fs.writeFile(path.join(db.FS_PATH, itm.checksum), itm.content);
        delete itm.content;
    });
    db.emails.insert([mail]);
}

exports.shortform = (mail) => ({
    _id: mail._id,
    subject: _.get(mail, 'subject', ''),
    from: _.get(mail, 'from.text', ''),
    to: _.get(mail, 'to.text', ''),
    date: mail.date
})