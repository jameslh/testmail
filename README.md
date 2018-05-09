# testmail
Runs a local smtp server for testing application email functionality

Clone repository, then:
```
npm install --production
npm start <http port|3000> <smtp port|25>
```

Set your application's mailserver to localhost:25

View messages at localhost:3000

Mail is stored in a local file-based database using [tingodb](http://www.tingodb.com/).
