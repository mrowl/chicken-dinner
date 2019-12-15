import * as functions from 'firebase-functions'
import * as cookies from '../etc/cookies.json'
import * as serviceAccount from '../etc/serviceAccountKey.json'

const request = require('request')
//const firebase = require('firebase')
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://chicken-dinner-7b640.firebaseio.com'
});
const db = admin.firestore();
const entriesRef = db.collection("entries")

const cookieStr: string = cookies.items.join('; ')
const options = {
  url: 'https://www.nytimes.com/puzzles/leaderboards',
  headers: {
    'Cookie': cookieStr,
  }
}
const re = /"scoreList":(\[\{.*\}\])\}/

function fetchScores() {
  request.get(options, function(error: any, response: Response, body: String) {
    const match: RegExpMatchArray | null = body.match(re)
    if (match !== null && match.length > 1) {
      const results: any = JSON.parse(match[1])
      const date: Date = new Date()
      if (
        date.getDay() === 6 && date.getHours() >= 18 ||
        date.getHours() >= 22
      ) {
        date.setTime(date.getTime() + (6 * 60 * 60 * 1000))
      }
      const dayOfWeek: number = date.getDay()
      const dateStr: string = date.toISOString().split('T')[0]
      console.log('dateStr: ' + dateStr)
      const timestamp: number = Date.now()
      results.forEach((result: any) => {
        if (result.finished) {
          const split: Array<string> = result.solveTime.split(':')
          let minutes: number = 0
          let seconds: number = 0
          let hours: number = 0
          if (split.length === 1) {
            seconds = parseInt(split[0])
          } else if (split.length === 2) {
            minutes = parseInt(split[0])
            seconds = parseInt(split[1])
          } else if (split.length === 3) {
            hours = parseInt(split[0])
            minutes = parseInt(split[1])
            seconds = parseInt(split[2])
          }
          const entry = {
            name: result.name,
            rank: parseInt(result.rank),
            solveTime: (hours * 3600) + (minutes * 60) + seconds,
            dayOfWeek: dayOfWeek,
            timestamp: timestamp,
            date: dateStr
          }
          console.log("Processing entry:")
          console.log(entry)

          const userEntries = entriesRef
            .where("name", "==", result.name)
            .where("date", "==", dateStr)
          userEntries.get().then(function (querySnapshot: any) {
            if (querySnapshot.empty) {
              console.log("[" + dateStr + "]" + "Adding entry for: " + result.name)
              entriesRef.add(entry)
            } else {
              console.log("[" + dateStr + "]" + "Updating entry for: " + result.name)
              querySnapshot.forEach(function (queryDocSnapshot: any) {
                queryDocSnapshot.ref.set(entry)
              })
            }
          })
        }
      })
    }
  })
}

exports.weekdayRun = functions.pubsub.schedule('56 21 * * 0-4')
  .timeZone('America/New_York')
  .onRun((context) => {
    fetchScores()
    return null
  })

exports.weekendRun = functions.pubsub.schedule('56 17 * * 5,6')
  .timeZone('America/New_York')
  .onRun((context) => {
    fetchScores()
    return null
  })
