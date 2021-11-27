
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore'
import 'firebase/compat/auth'
import { firestore } from "firebase-admin";
import { collection, getDocs } from "firebase/firestore";
import { doc, getDoc, deleteDoc, updateDoc, deleteField, query, where } from "firebase/firestore";
import { orderBy, limit } from "firebase/firestore";
import { getAuth, deleteUser } from "firebase/auth";
import { SignOut } from './App';
import $ from 'jquery';
import { useHistory } from "react-router-dom";


const firebaseConfig = {
    apiKey: "AIzaSyDXtGR1FNQz9zxOk79Ikkqzg9j8IYi2mh0",
    authDomain: "modusdb-4d7ed.firebaseapp.com",
    projectId: "modusdb-4d7ed",
    storageBucket: "modusdb-4d7ed.appspot.com",
    messagingSenderId: "738850813503",
    appId: "1:738850813503:web:e7e97619a1eaa6510daa8a",
    measurementId: "G-84F8J1Y1VY",
    // apiKey: "AIzaSyCzMuDRDmQMFsvabbAuOzi_ca8wz-fdjcY",
    // authDomain: "modusai.firebaseapp.com",
    // databaseURL: "https://modusai-default-rtdb.firebaseio.com",
    // projectId: "modusai",
    // storageBucket: "modusai.appspot.com",
    // messagingSenderId: "986175331521",
    // appId: "1:986175331521:web:1da20cf1eab28207060840",
    // measurementId: "G-JCXJ2W0FTL",
};


let app;
if (!firebase.apps.length) {
    app = firebase.initializeApp(firebaseConfig);
} else {
    app = firebase.app(); // if already initialized, use that one
}
// const app = firebase.initializeApp(firebaseConfig);
let currentUser;

export const auth = app.auth();
export const db = app.firestore();
export const googleProvider = new firebase.auth.GoogleAuthProvider();
export const facebookProvider = new firebase.auth.FacebookAuthProvider();

export const signInWithGoogle = async () => {
    try {
        const res = await auth.signInWithPopup(googleProvider);
        const user = res.user;
        currentUser = user;
        const query = await db
            .collection("users")
            .where("uid", "==", user.uid)
            .get();
        if (query.docs.length === 0) {
            await db.collection("users").doc(user.email).set({
                uid: user.uid,
                name: user.displayName,
                authProvider: "google",
                email: user.email,
            });
        }
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
};

export const signInWithFacebook = async () => {
    try {
        const res = await auth.signInWithPopup(facebookProvider);
        const user = res.user;
        const query = await db
            .collection("users")
            .where("uid", "==", user.uid)
            .get();
        if (query.docs.length === 0) {
            await db.collection("users").add({
                uid: user.uid,
                name: user.displayName,
                authProvider: "facebook",
                email: user.email,
            });
        }
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
};

export const signInWithEmailAndPassword = async (email, password) => {
    try {
        const res = await auth.signInWithEmailAndPassword(email, password);
        currentUser = res.user;
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
};

//add passwordconfirm to the state
export const registerWithEmailAndPassword = async (name, email, password) => {
    try {
        const res = await auth.createUserWithEmailAndPassword(email, password);
        const user = res.user;
        currentUser = user;
        await db.collection("users").add({
            uid: user.uid,
            name: name,
            authProvider: "local",
            email: email,
        });
    } catch (err) {
        console.error(err);
        alert(err.message);
    }

    try {
        const res = await auth.createUserWithEmailAndPassword(email, password);
        const user = res.user;
        currentUser = user;
        await db.collection("users").add({
            uid: user.uid,
            name: name,
            authProvider: "local",
            email: email,
        });
    } catch (err) {
        console.error(err);
        alert(err.message);
    }

};

export const sendPasswordResetEmail = async (email) => {
    try {
        await auth.sendPasswordResetEmail(email);
        alert("Password reset link sent!");
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
};

export const handleLogout = async (email) => {
    try {
        await auth.signOut();
        alert("Signed Out!");
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
};

export const deleteCurrentUser = async () => {
    deleteUserData()
    deleteUser(auth.currentUser).then(() => {
        console.log('deleted user')
    }).catch((error) => {
        console.log(error)
    });
}

// This function must be called to avoid OOM errors
const deleteUserData = async () => {
    // deleting files in batch
    // var batch = firebase.firestore().batch()

    // await firebase.firestore().collection('users').doc(auth.currentUser.email).collection('journalEntries').getDocs().then(val => {
    //     val.map((val) => {
    //         batch.delete(val)
    //     })
    //     batch.commit()
    // })
    await deleteDoc(doc(db, 'users', auth.currentUser.email));
}

// This is a generic function.
// the caller must check if entry already exists (check by title?)
export const submitJournalEntry = async (title, text) => {
    const jid = getJID();
    console.log(title);
    //code that depends on mood analysis result
    await getMoodAnalysis(text, function (moodAnalysis) {
        //code that depends on result
        console.log(moodAnalysis);
        db.collection('users').doc(auth.currentUser.email).collection('journalEntries').doc(jid).set({
            jid: jid,
            text: text,
            title: title,
            createdAt: Date.now(),
            status: 'submitted',
            t2eEntryMoodAnalysis: moodAnalysis['t2eEntry'],
            t2eSentMoodAnalysis: moodAnalysis['t2eSent'],
            polarityEntryMoodAnalysis: moodAnalysis['polarEntry'],
            polaritySentMoodAnalysis: moodAnalysis['polarSent']
        })
    });
    //console.log(moodAnalysis['t2eEntry']);
    //plotPieChart(moodAnalysis.t2eEntry);
    // getAllMoodScores()
    console.log('done')
}

export const saveJournalEntry = async (title, text) => {
    const jid = getJID();
    await db.collection('users').doc(auth.currentUser.email).collection('journalEntries').doc(jid).set({
        jid: jid,
        text: text,
        title: title,
        createdAt: Date.now(),
        status: 'saved',
        t2eEntryMoodAnalysis: '',
        t2eSentMoodAnalysis: '',
        polarityEntryMoodAnalysis: '',
        polaritySentMoodAnalysis: ''
    })
    // searchByDate(new Date())
}

// deletes a journal entry given a journal entry id
// TODO: Add journal id as argument
export const deleteJournalEntry = async (jid) => {
    const querySnapshot = db.collection('users').doc(auth.currentUser.email).collection('journalEntries').doc(jid).get()
        .then(function (result) {
            //console.log(result);
            result.ref.delete();
        })
    //  .then(() => {
    //     window.location.reload(false);
    //  })

    console.log("deleted journal entry!!")
}

// TODO: post results onto MHR component
export const getrecommendedMHResources = async (resourceType) => {
    console.log("in mhr");
    const score = -1;
    var resources = [];
    const querySnapshot = db.collection('users').doc(auth.currentUser.email).collection('journalEntries').orderByChild('createdAt')
        .limitToLast(1).get()
        .then(function (result) {
            console.log(result);
            score = parseInt(result['polarityEntryMoodAnalysis']);
        })
    if (score > 0.90) {
        const querySnapshot = db.collection('mentalHealthResources').doc('Mindfulness').get()
            .then(function (result) {
                console.log(result);
                resources.push(result);
            })


    } else if (score > 0.65) {
        const querySnapshot = db.collection('Anxiety').doc('Mindfulness').get()
            .then(function (result) {
                console.log(result);
                resources.push(result);
            })

    } else if (score > 0.35) {
        const querySnapshot = db.collection('Depression').doc('Mindfulness').get()
            .then(function (result) {
                console.log(result);
                resources.push(result);
            })

    } else {
        const querySnapshot = db.collection('Suicide').doc('Mindfulness').get()
            .then(function (result) {
                console.log(result);
                resources.push(result);
            })
    }
    return resources;
}

// receives mental health resources given a specific mental health type (from mood score)
// TODO:  connect title and links to display on UI
// TODO: determine what type of mental health resource needed based on mood score
export const getMHResources = async (resourceType) => {
    const querySnapshot = db.collection('mentalHealthResources').doc(resourceType).get().then(function (result) {
        const data = result.data();
        const title = data['Title'];
        const link = data['Link'];
        console.log(title + ": " + link);
    })
    console.log("received resources")
}

export const getJournalEntries = async () => {
    var journalEntries = [];
    const querySnapshot = await getDocs(collection(db.collection('users').
        doc(auth.currentUser.email), 'journalEntries').withConverter(entryConverter));

    querySnapshot.forEach((doc) => {
        const entry = doc.data();
        journalEntries.push(entry)
    });
    return journalEntries;
}

class JournalEntry {
    constructor(jid, text, title, createdAt, status, t2eEntryMoodAnalysis,
        t2eSentMoodAnalysis, polarityEntryMoodAnalysis, polaritySentMoodAnalysis) {
        this.jid = jid;
        this.text = text;
        this.title = title;
        this.createdAt = createdAt;
        this.status = status;
        this.t2eEntryMoodAnalysis = t2eEntryMoodAnalysis;
        this.t2eSentMoodAnalysis = t2eSentMoodAnalysis;
        this.polarityEntryMoodAnalysis = polarityEntryMoodAnalysis;
        this.polaritySentMoodAnalysis = polaritySentMoodAnalysis;
    }
    toString() {
        return this.jid + ', ' + this.text + ', ' + this.title + ', ' +
            this.createdAt + ', ' + this.status + ', ' + this.t2eEntryMoodAnalysis +
            ', ' + this.t2eSentMoodAnalysis + ', ' + this.polarityEntryMoodAnalysis +
            ', ' + this.polaritySentMoodAnalysis;
    }
}

// Firestore data converter
const entryConverter = {
    toFirestore: (jid) => {
        return {
            jid: jid.jid,
            text: jid.text,
            title: jid.title,
            createdAt: jid.createdAt,
            status: jid.status,
            t2eEntryMoodAnalysis: jid.t2eEntryMoodAnalysis,
            t2eSentMoodAnalysis: jid.t2eSentMoodAnalysis,
            polarityEntryMoodAnalysis: jid.polarityEntryMoodAnalysis,
            polaritySentMoodAnalysis: jid.polaritySentMoodAnalysis
        };
    },
    fromFirestore: (snapshot, options) => {
        const data = snapshot.data(options);
        return new JournalEntry(data.jid, data.text, data.title,
            data.createdAt, data.status, data.t2eEntryMoodAnalysis,
            data.t2eSentMoodAnalysis, data.polarityEntryMoodAnalysis,
            data.polaritySentMoodAnalysis);
    }
};

export const searchByTitle = async (title) => {
    var result = []
    const q = query(collection(db.collection('users').
        doc(auth.currentUser.email), 'journalEntries'), where("title", "==", title));

    const querySnapshot = await getDocs(q.withConverter(entryConverter))
    querySnapshot.forEach((doc) => {
        const entry = doc.data()
        result.push(entry)
        //   console.log("search by title: ", title, entry)
    });
    return result
}

export const searchByDate = async (date) => {
    var millis = getMillisFromDate(date)
    var upperLimit = 86400000 + millis // adding 24 hours
    console.log("upperLimit");
    console.log(upperLimit);
    console.log('MILLIS');
    console.log(millis);
    var result = []
    const q = query(collection(db.collection('users').
        doc(auth.currentUser.email), 'journalEntries'), where("createdAt", '<', upperLimit), where("createdAt", '>=', millis));

    const querySnapshot = await getDocs(q.withConverter(entryConverter))
    querySnapshot.forEach((doc) => {
        const entry = doc.data()
        result.push(entry)
        console.log("search by date: ", date, entry)
    });
    return result

}

function getMillisFromDate(date) {
    date.setHours(0, 0, 0, 0)
    const millis = Date.parse(date)
    return millis
}

function getJID() {
    const { v4: uuidv4 } = require('uuid')
    return uuidv4()
}
// Using 'superagent' which will return a promise.
/*var superagent = require('superagent')
 
// This is isn't declared as `async` because it already returns a promise
function delay() {
    // `delay` returns a promise
    return new Promise(function(resolve, reject) {
        // Only `delay` is able to resolve or reject the promise
        setTimeout(function() {
            resolve(42); // After 3 seconds, resolve the promise with value 42
        }, 3000);
    });
}*/

function getMoodAnalysis(text, callback) {
    //var moodDict = {t2eEntry: '', t2eSent:'', polarEntry:'', polarSent:''};
    $.post({
        url: "http://127.0.0.1:5000/moodanalysis?text=" + text,
    }).done(function (response) {
        console.log(response);
        //console.log(response.data.t2e_entry_analysis);
        var tentry = response.data.t2e_entry_analysis;
        var tsent = response.data.t2e_sent_analysis;
        var pentry = response.data.polarity_entry_analysis;
        var psent = response.data.polarity_sent_analysis;
        /* const moodArray = [JSON.stringify(t2eEntry), JSON.stringify(t2eSent), 
            JSON.stringify(polarEntry), JSON.stringify(polarSent)];
            callback(moodArray); */
        var moodDict = { t2eEntry: tentry, t2eSent: tsent, polarEntry: pentry, polarSent: psent };
        callback(moodDict);
        //console.log(moodDict);
    });
    //console.log(moodArray);
    //return moodArray;
    // push pls
}

export const getCurrentEntryMoodScores = async (title) => {
    var result = [];
    const q = query(collection(db.collection('users').
        doc(auth.currentUser.email), 'journalEntries'), where("title", "==", title), limit(1));

    const querySnapshot = await getDocs(q.withConverter(entryConverter))
    querySnapshot.forEach((doc) => {
        const entry = doc.data()
        result.push(entry)
        //   console.log("search by title: ", title, entry)
    });
    console.log(result[0].t2eEntryMoodAnalysis)
    return result[0].t2eEntryMoodAnalysis;
}

// get aggregated mood scores and set overall score in firebase
export const getAllMoodScores = async () => {
    var result = []
    var sumAngry = 0.0
    var sumFear = 0.0
    var sumHappy = 0.0
    var sumSad = 0.0
    var sumSurprise = 0.0
    const q = query(collection(db.collection('users').
        doc(auth.currentUser.email), 'journalEntries'), where('status', '==', 'submitted'));

    const querySnapshot = await getDocs(q.withConverter(entryConverter))
    querySnapshot.forEach((doc) => {
        const entry = doc.data()
        result.push(entry.t2eEntryMoodAnalysis)
        sumAngry += entry.t2eEntryMoodAnalysis['Angry']
        sumFear += entry.t2eEntryMoodAnalysis['Fear']
        sumHappy += entry.t2eEntryMoodAnalysis['Happy']
        sumSad += entry.t2eEntryMoodAnalysis['Sad']
        sumSurprise += entry.t2eEntryMoodAnalysis['Surprise']
    });
    var aggregatedScores = {}
    aggregatedScores["Angry"] = sumAngry / result.length
    aggregatedScores["Fear"] = sumSad / result.length
    aggregatedScores["Happy"] = sumHappy / result.length
    aggregatedScores["Sad"] = sumSad / result.length
    aggregatedScores["Surprise"] = sumSurprise / result.length
    console.log(result)
    console.log("aggregated scores: " + JSON.stringify(aggregatedScores))

    db.collection('users').doc(auth.currentUser.email).set({
        overallAnalysis: aggregatedScores,
        happiness: aggregatedScores['Happy']
    })
    return aggregatedScores
}

export const getHappinessScore = async() => {
    const docRef = doc(db, 'users', auth.currentUser.email)
    const docSnap = await getDoc(docRef)
    var score = docSnap.get('happiness')
    console.log(score)
    return score
}

// aggregated mood scores over the last 7 days
export const getOverallMoodScores7 = async () => {
    var result = []
    var sumAngry = 0.0
    var sumFear = 0.0
    var sumHappy = 0.0
    var sumSad = 0.0
    var sumSurprise = 0.0
    const q = query(collection(db.collection('users').
        doc(auth.currentUser.email), 'journalEntries'), orderBy("createdAt", "desc"), where('status', '==', 'submitted'), limit(7));

    const querySnapshot = await getDocs(q.withConverter(entryConverter))
    querySnapshot.forEach((doc) => {
        const entry = doc.data()
        result.push(entry.t2eEntryMoodAnalysis)
        sumAngry += entry.t2eEntryMoodAnalysis['Angry']
        sumFear += entry.t2eEntryMoodAnalysis['Fear']
        sumHappy += entry.t2eEntryMoodAnalysis['Happy']
        sumSad += entry.t2eEntryMoodAnalysis['Sad']
        sumSurprise += entry.t2eEntryMoodAnalysis['Surprise']
    });
    var aggregatedScores = {}
    aggregatedScores["Angry"] = sumAngry / result.length
    aggregatedScores["Fear"] = sumSad / result.length
    aggregatedScores["Happy"] = sumHappy / result.length
    aggregatedScores["Sad"] = sumSad / result.length
    aggregatedScores["Surprise"] = sumSurprise / result.length
    console.log(result)
    console.log("aggregated scores: " + JSON.stringify(aggregatedScores))
    return aggregatedScores
}

// aggregated mood scores over the last 30 days
export const getOverallMoodScores30 = async () => {
    var result = []
    var sumAngry = 0.0
    var sumFear = 0.0
    var sumHappy = 0.0
    var sumSad = 0.0
    var sumSurprise = 0.0
    const q = query(collection(db.collection('users').
        doc(auth.currentUser.email), 'journalEntries'), orderBy("createdAt", "desc"), where('status', '==', 'submitted'), limit(30));

    const querySnapshot = await getDocs(q.withConverter(entryConverter))
    querySnapshot.forEach((doc) => {
        const entry = doc.data()
        result.push(entry.t2eEntryMoodAnalysis)
        sumAngry += entry.t2eEntryMoodAnalysis['Angry']
        sumFear += entry.t2eEntryMoodAnalysis['Fear']
        sumHappy += entry.t2eEntryMoodAnalysis['Happy']
        sumSad += entry.t2eEntryMoodAnalysis['Sad']
        sumSurprise += entry.t2eEntryMoodAnalysis['Surprise']
    });
    var aggregatedScores = {}
    aggregatedScores["Angry"] = sumAngry / result.length
    aggregatedScores["Fear"] = sumSad / result.length
    aggregatedScores["Happy"] = sumHappy / result.length
    aggregatedScores["Sad"] = sumSad / result.length
    aggregatedScores["Surprise"] = sumSurprise / result.length
    console.log(result)
    console.log("aggregated scores: " + JSON.stringify(aggregatedScores))
    return aggregatedScores
}

// all raw scores over the last 7 days
export const getAllMoodScores7 = async () => {
    var result = []
    const q = query(collection(db.collection('users').
        doc(auth.currentUser.email), 'journalEntries'), orderBy("createdAt", "desc"), where('status', '==', 'submitted'), limit(7));

    const querySnapshot = await getDocs(q.withConverter(entryConverter))
    querySnapshot.forEach((doc) => {
        const entry = doc.data()
        result.push(entry.t2eEntryMoodAnalysis)
    });
    console.log(result)
    return result
}

// All raw scores over the last 30 days
export const getAllMoodScores30 = async () => {
    var result = []
    const q = query(collection(db.collection('users').
        doc(auth.currentUser.email), 'journalEntries'), orderBy("createdAt", "desc"), where('status', '==', 'submitted'), limit(30));

    const querySnapshot = await getDocs(q.withConverter(entryConverter))
    querySnapshot.forEach((doc) => {
        const entry = doc.data()
        result.push(entry.t2eEntryMoodAnalysis)
    });
    console.log(result)
    return result
}