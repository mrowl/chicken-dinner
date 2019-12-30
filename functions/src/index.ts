import * as cookies from '../etc/cookies.json'
import * as serviceAccount from '../etc/serviceAccountKey.json'
import * as config from '../etc/config.json'

const request = require('request')
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const {OAuth2Client} = require('google-auth-library');
const {google} = require('googleapis');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://chicken-dinner-7b640.firebaseio.com'
});
const db = admin.firestore();
const entriesRef = db.collection("entries")

// The OAuth Callback Redirect.
const FUNCTIONS_REDIRECT = `https://us-central1-chicken-dinner-7b640.cloudfunctions.net/oauthcallback`

// setup for authGoogleAPI
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const functionsOauthClient = new OAuth2Client(config.client_id, config.client_secret,
  FUNCTIONS_REDIRECT);

let oauthTokens: any = null;

exports.authgoogleapi = functions.https.onRequest((req: any, res: any) => {
  res.set('Cache-Control', 'private, max-age=0, s-maxage=0');
  res.redirect(functionsOauthClient.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  }));
});

const DB_TOKEN_PATH = '/api_tokens';
// after you grant access, you will be redirected to the URL for this Function
// this Function stores the tokens to your Firebase database
exports.oauthcallback = functions.https.onRequest(async (req: any, res: any) => {
  res.set('Cache-Control', 'private, max-age=0, s-maxage=0');
  const code = req.query.code;
  try {
    const {tokens} = await functionsOauthClient.getToken(code);
    // Now tokens contains an access_token and an optional refresh_token. Save them.
    await admin.database().ref(DB_TOKEN_PATH).set(tokens);
    return res.status(200).send('App successfully configured with new Credentials. '
        + 'You can now close this page.');
  } catch (error) {
    return res.status(400).send(error);
  }
});


const cookieStr: string = cookies.items.join('; ')
const options = {
  url: 'https://www.nytimes.com/puzzles/leaderboards',
  headers: {
    'Cookie': cookieStr,
  }
}
const re = /"scoreList":(\[\{.*\}\])\}/

// checks if oauthTokens have been loaded into memory, and if not, retrieves them
async function getAuthorizedClient() {
  if (oauthTokens) {
    return functionsOauthClient;
  }
  const snapshot = await admin.database().ref(DB_TOKEN_PATH).once('value');
  oauthTokens = snapshot.val();
  functionsOauthClient.setCredentials(oauthTokens);
  return functionsOauthClient;
}


function upsertEntry(entry: any) {
  console.log("Upsert entry:")
  console.log(entry)

  const userEntries = entriesRef
    .where("name", "==", entry.name)
    .where("date", "==", entry.date)
  userEntries.get().then(function (querySnapshot: any) {
    if (querySnapshot.empty) {
      console.log("[" + entry.date + "] Adding entry for: " + entry.name)
      entriesRef.add(entry)
    } else {
      console.log("[" + entry.date + "] Updating entry for: " + entry.name)
      querySnapshot.forEach(function (queryDocSnapshot: any) {
        queryDocSnapshot.ref.set(entry)
      })
    }
  })
}

function recordResults(results: Array<any>) {
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
  
  const entries: Array<any> = []
  results.forEach((result: any) => {
    if (result.finished) {
      const split: Array<string> = result.solveTime.split(':')
      let seconds: number = 0
      for (let i: number = 0; i < split.length; i++) {
        seconds += Math.pow(60, split.length - i - 1) * parseInt(split[i])
      }
      
      const entry: any = {
        name: result.name,
        rank: parseInt(result.rank),
        solveTime: seconds,
        dayOfWeek: dayOfWeek,
        timestamp: timestamp,
        date: dateStr
      }
      entries.push(entry)
      upsertEntry(entry)
    }
  })
  addEntriesToSheet(entries)
}

function addEntriesToSheet(entries: Array<any>) {
  console.log("processing " + entries.length + " entries for sheet")
  const entryMap: Record<string, Record<string, number>> = {}
  entries.forEach((entry: any) => {
    if (entryMap[entry.date] === undefined) {
      entryMap[entry.date] = {}
    }
    entryMap[entry.date][entry.name] = entry.solveTime
  })

  const sheets: Record<string, Array<string>> = config.sheets
  const sheetIds: Array<string> = Object.keys(sheets)
  const rowsBySheetId: Record<string, Array<any>> = {}
  sheetIds.forEach((sheetId: string) => {
    rowsBySheetId[sheetId] = []
  })
  Object.keys(entryMap).sort().forEach((date: string) => {
    sheetIds.forEach((sheetId: string) => {
      const columns: Array<string> = sheets[sheetId]
      const row: Array<any> = [date]
      columns.forEach((name: string) => {
        if (entryMap[date][name] !== undefined) {
          row.push(entryMap[date][name])
        } else {
          row.push(null)
        }
      })
      rowsBySheetId[sheetId].push(row)
    })
  })
  console.log('adding rows to sheet:')
  console.log(rowsBySheetId)
  sheetIds.forEach((sheetId: string) => {
    appendRowsToSheet(sheetId, rowsBySheetId[sheetId])
  })
}

function appendRowsToSheet(sheetId: string, rows: Array<Array<any>>) {
  const req: any = {
    spreadsheetId: sheetId,
    range: 'A:K',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: {
      values: rows,
    },
  }
  getAuthorizedClient().then((client) => {
    const sheets = google.sheets('v4')
    req.auth = client
    sheets.spreadsheets.values.append(req, (err: any, response: any) => {
      if (err) {
        console.log(`The API returned an error: ${err}`);
      }
    })
  }).catch(err => {
    console.log('error')
  })
}

function fetchScores() {
  request.get(options, function(error: any, response: Response, body: string) {
    const match: RegExpMatchArray | null = body.match(re)
    if (match !== null && match.length > 1) {
      const results: any = JSON.parse(match[1])
      recordResults(results)
    }
  })
}

function runBackfill() {
  entriesRef.where("date", ">=", "2019-12-01").get().then(function (querySnapshot: any) {
    const entries: Array<any> = []
    querySnapshot.forEach(function (doc: any) {
      console.log("pushing entry for backfill:")
      console.log(doc.data())
      entries.push(doc.data())
    })
    addEntriesToSheet(entries)
  })
}

exports.backfill = functions.pubsub.schedule('56 21 1 1 1')
  .timeZone('America/New_York')
  .onRun((context: any) => {
    if (false) {
      runBackfill()
    }
    return null
  })

exports.weekdayRun = functions.pubsub.schedule('56 21 * * 1-5')
  .timeZone('America/New_York')
  .onRun((context: any) => {
    fetchScores()
    return null
  })

exports.weekendRun = functions.pubsub.schedule('56 17 * * 0,6')
  .timeZone('America/New_York')
  .onRun((context: any) => {
    fetchScores()
    return null
  })
