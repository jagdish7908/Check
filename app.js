const express = require('express');
const app = express();
const vsts = require("azure-devops-node-api"); // To simplify making REST API calls to Azure Repos
const bodyParser = require('body-parser'); //  To help parse the JSON returned by the service hook

app.use(bodyParser.json());
// set up the details for a connection to your account, and get an instance of the Git API

const collectionURL = process.env.COLLECTIONURL;
const token = process.env.TOKEN;

var authHandler = vsts.getPersonalAccessTokenHandler(token);
var connection = new vsts.WebApi(collectionURL, authHandler);

//var vstsGit = connection.getGitApi().then(success => { console.log("success"); }, error => { console.log(error); });
var vstsGit = null;
connection.getGitApi().then((api) => { vstsGit = api; })

app.get('/', function (req, res) {
    res.sendFile('views/landingPage.html', {root: __dirname });
});

app.listen(3000, function () {
    console.log('Checklist checker listening on port 3000!');
});

app.post("/", function (req, res) {

    // Get the details about the PR from the service hook payload
    var repoId = req.body.resource.repository.id;
    var pullRequestId = req.body.resource.pullRequestId;
    var title = req.body.resource.title;

    // Build the status object that we want to post.
    var prStatus = {
        "state": "failed",
        "description": "Ready for review",
        "targetUrl": "http://visualstudio.microsoft.com",
        "context": {
            "name": "checklist-checker",
            "genre": "continuous-integration"
        }
    }

    // Check the title to see if there is "WIP" in the title.
    if (title.includes("WIP")) {
        // If so, change the status to pending and change the description.
        prStatus.state = "pending";
        prStatus.description = "Work in progress"
    }

    // Post the status to the PR
    vstsGit.createPullRequestStatus(prStatus, repoId, pullRequestId).then( result => {
        console.log(result);
    });

    res.send("Received the POST");
});