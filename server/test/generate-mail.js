const nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 25,
    secure: false,
    ignoreTLS: true
});

// setup email data with unicode symbols
let mailOptions = {
    from: '"Test Foo 👻" <foo@example.com>', // sender address
    to: 'bar@example.com, baz@example.com', // list of receivers
    subject: 'Hello ✔', // Subject line
    text: 'Hello world?', // plain text body
    html: '<b>Hello world?</b>' // html body
};

function sendMail(){
    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    });
}

setInterval(sendMail, 20);