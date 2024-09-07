const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const exerciseSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    default: 0,
    required: true,
  },
  date: {
    type: String,
  }
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    //unique: true
  },
});

let User = mongoose.model('User', userSchema);


let Exercise = mongoose.model('Exercise', exerciseSchema);

app.use("/api/users", bodyParser.urlencoded({extended: false}));

app.route('/api/users')

.post((req, res) => {
    const username = req.body.username;
    createAndSaveUser(username, res);
})
.get((req, res) => {
  User.find()
  .then((doc) => {
    res.json(doc);
  })
  .catch((err) => {
    console.error(err);
  });
})

app.use("/api/users/:_id/exercises", bodyParser.urlencoded({extended: false}));

app.route('/api/users/:_id/exercises')

.post((req, res) => {
    const id = req.params._id;
    const description = req.body.description;
    const duration = req.body.duration;
    const date = req.body.date;
    createAndSaveExercise(id, description, duration, date, res);
})

app.route('/api/users/:_id/logs')
.get((req, res) => {
  const id = req.params._id;
  const { from, to, limit } = req.query;
  User.findOne({_id: id })
  .then(userDoc => {
    const fromDate = req.query.from ? new Date(from) : null;
    const toDate = req.query.to ? new Date(to) : null;

    let query = Exercise.find({
      username: userDoc.username
    })
    .select({description: 1, duration: 1, date: 1})

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    query.exec((err, exercises) => {
      let finalExercises;
      if (fromDate && !limit) {
       finalExercises = exercises.filter(item => {
          const testDate = new Date(item.date);
          return testDate >= fromDate && testDate <= toDate 
        })
        
      } 
      else finalExercises = exercises

      if (err) {
          console.log(err, "ERROR")
          return res.status(500).send(err);
      }

      let finalResult = {
        username: userDoc.username,
        _id: id,
        log: finalExercises,
        count: finalExercises.length
      }

      res.json(finalResult);
  });
    
  
  })
  .catch(err => {
    console.error('Error creating Log:', err);
  });

})

var createAndSaveUser = function(username, res) {
  var newUser = new User({username: username });

  newUser.save()
  .then(doc => {
    res.json(doc);
  })
  .catch(err => {
    console.error('Error creating User:', err);
  });
};

var createAndSaveExercise = function(id, description, duration, date, res) {

    User.findOne({_id: id })
    .then(doc => {

      let finalDate;

      if (date) {
        let formattedDate = new Date(date);

        finalDate = formattedDate.toDateString();
        
      }
      else {
        finalDate = new Date().toDateString();
      }

      var newExercise = new Exercise({username: doc.username, description: description, duration: parseInt(duration), date: finalDate });

      let returnedUser = {_id: doc._id, username: doc.username, duration: parseInt(duration), description: description, date: finalDate};
    
      newExercise.save();

      res.json(returnedUser);
    })
    .catch(err => {
      console.error('Error creating Exercise:', err);
    });

};





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
