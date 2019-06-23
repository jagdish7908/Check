const express = require('express');
const app = express();
const vsts = require("azure-devops-node-api"); // To simplify making REST API calls to Azure Repos
const bodyParser = require('body-parser'); //  To help parse the JSON returned by the service hook
var helper = require('./helper_functions');

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

app.listen(process.env.PORT || 5000, function () {
    console.log(`Checklist checker listening on port ${process.env.PORT}`);
});

app.post("/", function (req, res) {
    // Get the details about the PR from the service hook payload
    var repoId = req.body.resource.repository.id;
    var pullRequestId = req.body.resource.pullRequestId;
    var description = req.body.resource.description;

    // Build the status object that we want to post.
    var prStatus = {
        "state": "failed",
        "description": "Checklist",
        //"targetUrl": "http://visualstudio.microsoft.com",
        "context": {
            "name": "checklist-checker",
            "genre": "continuous-integration"
        }
    };

    // Check the description to see if there are mandatory keywords
    if (helper.keywordCheck(description)) {
        // If so, change the status to succeeded and change the description.
        prStatus.state = "succeeded";
        prStatus.description = "Checklist"
    }
    // Post the status to the PR
    vstsGit.createPullRequestStatus(prStatus, repoId, pullRequestId).then( result => {
        console.log(result);
    }); 
    res.send("Received the POST");
});