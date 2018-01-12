//pull in my npm node bits
require("dotenv").config();
var keys = require("./keys.js");
var Twitter = require('twitter');
var Spotify = require('node-spotify-api');
var request = require("request");
var fs = require("fs");
var inquirer = require("inquirer");

var theCommand;
var theData;

//create my spotify and twitter clients
var sClient = new Spotify(keys.spotify);
var tClient = new Twitter(keys.twitter);

//pop the menu up
inquireMe();


function parseTheCommand(aCommand,aData)
{//log the current command
	fs.appendFile("log.txt",aCommand.trim() + "," + aData.trim() + " \n", (err) =>
	{
		if(err)//if there is an error - console log it and return
		{
			console.log("Error writing to log: " + err);
			console.log("\n");
			inquireMe();
			return;
		}
	});
	switch(aCommand) //which command did i pick?
	{//call the chosen command
	    case "my-tweets":
	    	twitterSearch(aData);
	        break;
	    case "spotify-this-song":
	    	spotSearch(aData);
	        break;
	    case "mobie-this":
	    	mobiSearch(aData);
	        break;
    }
}

function twitterSearch(tData)
{//searching twitter - set up a param and get the timeline
	var params = {screen_name: tData};
	tClient.get('statuses/user_timeline', params, function(error, tweets, response) 
	{
		if (!error) //if there is no error - console.log the tweets
		{
		    for (var i = 0; i < tweets.length; i++) 
		    {
		    	if(i == 20)
		    	{
		    		break;
		    	}
		    	console.log(tweets[i].user.screen_name + ":");
		    	console.log(tweets[i].created_at);
		    	console.log(tweets[i].text);
		    	console.log('\n');
		    }
		    inquireMe();// pop the menu back up
		}
		else//if there is an error, console.log it and pop the menu back up
		{
			console.log("Error occurred: " + error);
			console.log("\n");
			inquireMe();
		}
	});
}

function spotSearch(sData)
{//set up the spotify client and send the query
	sClient.search({ type: 'track', query: sData }, function(err, data) 
	{
		if (err) //if there is an error, console.log it and pop the menu back up
		{
			console.log('Error occurred: ' + err);
			console.log("\n");
			inquireMe();
		}
		else
		{
			for (var i = 0; i < data.tracks.items.length; i++) //console.log the track info
		    {
		    	if(i == 20)
		    	{
		    		break;
		    	}
		    	console.log("Artist: " + data.tracks.items[i].artists[0].name);
		    	console.log("Track: " + data.tracks.items[i].name);
		    	console.log("Preview: " + data.tracks.items[i].preview_url);
		    	console.log("Album: " + data.tracks.items[i].album.name);
		    	console.log('\n');
		    } 
	    	inquireMe();
		}
	});
}

function mobiSearch(mData)
{//set up my query URL bits
	var movieName = mData.split(" ");
	var name = movieName.join("+");
	// Then run a request to the OMDB API with the movie specified
	//var queryUrl = "http://www.omdbapi.com/?t=" + movieName + "&y=&plot=short&apikey=trilogy";
	var queryUrl = "http://www.omdbapi.com/?t=" + name + "&y=&plot=short&apikey=trilogy";
	//Mr. Nobody
	request(queryUrl,function(error, response, body)
	{
		if(!error && response.statusCode === 200)//if there's no error, let's console.log the info
		{
			//console.log(response);
			//console.log(body);
			//console.log(JSON.parse(body));
			console.log("Title: " + JSON.parse(body).Title);
			console.log("Year: " + JSON.parse(body).Year);
			if(JSON.parse(body).Ratings)//if there is no info this breaks, so we check first
			{
				console.log(JSON.parse(body).Ratings[0].Source + ": " + JSON.parse(body).Ratings[0].Value);
				if(JSON.parse(body).Ratings.length > 1)
				{
					console.log(JSON.parse(body).Ratings[1].Source + ": " + JSON.parse(body).Ratings[1].Value);	
				}

			}
			console.log("Country: " + JSON.parse(body).Country);
			console.log("Language: " + JSON.parse(body).Language);
			console.log("Plot: " + JSON.parse(body).Plot);
			console.log("Actors: " + JSON.parse(body).Actors);
			console.log("\n");
			inquireMe();//pop the menu back up again when done
		}
		else//oops there was an error, let's console.log it and pop the menu back up
		{
			console.log("Error occurred: " + error);
			console.log(response.statusCode);
			console.log("\n");
			inquireMe();
		}
	});

}

function inquireMe()// give the user a choice of commands
{
	inquirer
  	.prompt([
    // Here we give the user a list to choose from.
    {
      type: "list",
      message: "Please choose a function",
      choices: ["my-tweets", "spotify-this-song", "mobie-this","do-what-it-says", "quit"],
      name: "myChoice"
    }
  ])
  .then(function(inquirerResponse) {
    // get the choice and then do something
    if(inquirerResponse.myChoice == "do-what-it-says") //do what's in the text file
	{//use the fs function to log the command
		fs.appendFile("log.txt",inquirerResponse.myChoice.trim() + " \n", (err) =>
		{
			if(err)
			{
				console.log("Error writing to log: " + err);
				console.log("\n");
				inquireMe();
				return;
			}
		});
    	fs.readFile("random.txt", "utf8", (err, data) =>
		{
			if(err)//uh oh there was an error let's log it and exit
			{
				console.log(err)
				return;
			}
			else//get the command from the text file and run it
			{
				var dataArray = data.split(",");
				//console.log(dataArray);
				//console.log("command: " + dataArray[0] + " data: " + dataArray[1]);
				//parseTheCommand(dataArray[0],dataArray[1])
				theCommand = dataArray[0];
				if(dataArray.length > 1)
				{
					theData = dataArray[1];
					parseTheCommand(theCommand,theData);
				}
				else
				{
					parseTheCommand(theCommand);
				}
			}
		});
    }
    else if(inquirerResponse.myChoice == "quit") //exit the program - we're done
	{
		return;
	}
    else
    {
    	theCommand = inquirerResponse.myChoice;//they made a choice, do they want to add more data?
    	getMore();
    }
  });
}

function getMore()//we can use the default data, or the use can type something in.  
{
	var theMessage;
	switch(theCommand) 
	{
	    case "my-tweets"://set the default data
	    	theMessage = "Which twitter account would you like?";
	    	theData = "@tweetyourmomma";
	        break;
	    case "spotify-this-song":
	    	theMessage = "Which song would you like to search?";
	    	theData = "the Sign";
	        break;
	    case "mobie-this":
	    	theMessage = "Which movie would you like to search?";
	    	theData = "Mr+Nobody";
	        break;
    }
	inquirer
  	.prompt([
	    // Here we create a basic text prompt.
	    {
	      type: "input",
	      message: theMessage,
	      name: "myData"
	    }
  	])
	.then(function(inquirerResponse) {
	    // grab the user data and run the command with that instead of the default data
	    if (inquirerResponse.myData) 
	    {
	      	theData = inquirerResponse.myData;
		}
		parseTheCommand(theCommand,theData);
	 });
}

