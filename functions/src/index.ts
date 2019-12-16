import * as functions from 'firebase-functions'
import * as cookies from '../etc/cookies.json'
import * as serviceAccount from '../etc/serviceAccountKey.json'

const request = require('request')
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

function upsertEntry(entry: any) {
  console.log("Upsert entry:")
  console.log(entry)

  const userEntries = entriesRef
    .where("name", "==", entry.name)
    .where("date", "==", entry.date)
  userEntries.get().then(function (querySnapshot: any) {
    if (querySnapshot.empty) {
      console.log("[" + entry.dateStr + "] Adding entry for: " + entry.name)
        //entriesRef.add(entry)
    } else {
      console.log("[" + entry.dateStr + "] Updating entry for: " + entry.name)
      querySnapshot.forEach(function (queryDocSnapshot: any) {
          //queryDocSnapshot.ref.set(entry)
      })
    }
  })
}

function parseResults(results: Array<any>) {
  const localDt: string = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
  const date: Date = new Date(localDt)
  if (
    ((date.getDay() === 6 || date.getDay() === 0) && date.getHours() >= 18) ||
    date.getHours() >= 22
  ) {
    // roll forward to the next day since they release the evening before
    date.setTime(date.getTime() + (6 * 60 * 60 * 1000))
  }
  const dayOfWeek: number = date.getDay()
  const timestamp: number = Date.now()
  const dateStr: string = date.toISOString().split('T')[0]
  console.log('Processing results for date: ' + dateStr)
  results.forEach((result: any) => {
    if (result.finished) {
      const split: Array<string> = result.solveTime.split(':')
      let seconds: number = 0
      for (let i: number = 0; i < split.length; i++) {
        seconds += Math.pow(60, split.length - i - 1) * parseInt(split[i])
      }
      upsertEntry({
        name: result.name,
        rank: parseInt(result.rank),
        solveTime: seconds,
        dayOfWeek: dayOfWeek,
        timestamp: timestamp,
        date: dateStr
      })
    }
  })
}

function fetchScores() {
  request.get(options, function(error: any, response: Response, body: String) {
    const match: RegExpMatchArray | null = body.match(re)
    if (match !== null && match.length > 1) {
      const results: any = JSON.parse(match[1])
      parseResults(results)
    }
  })
}

exports.weekdayRun = functions.pubsub.schedule('56 21 * * 1-5')
  .timeZone('America/New_York')
  .onRun((context) => {
    fetchScores()
    return null
  })

exports.weekendRun = functions.pubsub.schedule('56 17 * * 0,6')
  .timeZone('America/New_York')
  .onRun((context) => {
    fetchScores()
    return null
  })
