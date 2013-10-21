# Mongo transaction

Small and simple package to execute a transaction between two accounts:

```javascript
transfer(sourceId, destId, amount, callback);
```

Make sure the transaction is safe and if there is an error it can be rollbacked or recovered.
The rollback/recovery is not (yet) implemented.

To run the test, you need to have `grunt` installed.
```bash
sudo npm install -g grunt-cli
npm install
```
If one only wants to run the tests: `npm test`.
Some diagrams describing the different usecases can be found [in the uml folder](./uml/diagrams.html).

