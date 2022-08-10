const url = "wss://"+window.location.hostname+":"+window.location.port;

let videoResolution = true;
//Get our url
const href = new URL (window.location.href);
if (href.searchParams.has ("video"))
	switch (href.searchParams.get ("video").toLowerCase ())
	{
		case "1080p":
			videoResolution = {
				width: {min: 1920, max: 1920},
				height: {min: 1080, max: 1080},
			};
			break;
		case "720p":
			videoResolution = {
				width: {min: 1280, max: 1280},
				height: {min: 720, max: 720},
			};
			break;
		case "576p":
			videoResolution = {
				width: {min: 720, max: 720},
				height: {min: 576, max: 576},
			};
			break;
		case "480p":
			videoResolution = {
				width: {min: 640, max: 640},
				height: {min: 480, max: 480},
			};
			break;
		case "no":
			videoResolution = false;
			break;
	}


function addVideoForStream(stream,muted)
{
	//Create new video element
	const video = document.querySelector (muted ? "#local" : "#remote");
	//Set same id
	video.streamid = stream.id;
	//Set src stream
	video.srcObject = stream;
	//Set other properties
	video.autoplay = true;
	video.muted = muted;
}

//Get user media promise based
function  getUserMedia(constrains)
{
	return new Promise(function(resolve,reject) {
		//Get it
		navigator.getUserMedia(constrains,
			function(stream){
				resolve(stream);
			},
			function(error){
				reject(error);
			});
	});
}

var sdp;
var pc;
	
function connect() 
{

	//Create PC
	pc = new RTCPeerConnection();
	
	var ws = new WebSocket(url,"bwe");
	
	pc.onaddstream = function(event) {
		var prev = 0,prevFrames = 0,prevBytes = 0;
		console.debug("onAddStream",event);
		//Play it
		addVideoForStream(event.stream);
		//Get track
		var track = event.stream.getVideoTracks()[0];
		//Update stats
	};
	
	ws.onopen = function(){
		console.log("opened");


		
		navigator.mediaDevices.getUserMedia({
			audio: false,
			video: videoResolution
		})
		.then(function(stream){
			console.debug("getUserMedia sucess",stream);
			//Play it
			addVideoForStream(stream,true);
			//Add stream to peer connection
			pc.addStream(stream);
			//Create new offer
			return pc.createOffer();
		})
		.then(function(offer){
			console.debug("createOffer sucess",offer);
			//We have sdp
			sdp = offer.sdp;
			//Set it
			pc.setLocalDescription(offer);
			console.log(sdp);
			//Create room
			ws.send(JSON.stringify({
				cmd		: "OFFER",
				offer		: sdp
			}));
		})
		.catch(function(error){
			console.error("Error",error);
		});
	};
	
	ws.onmessage = function(event){
		console.log(event);
		
		//Get protocol message
		const msg = JSON.parse(event.data);
		
		if (msg.answer)
		{
			console.log(msg.answer);
			pc.setRemoteDescription(new RTCSessionDescription({
					type:'answer',
					sdp: msg.answer
				}), function () {
					console.log("JOINED");
				}, function (err) {
					console.error("Error joining",err);
				}
			);
		} else if (msg.estimatedBitrate){
			window.estimatedBitrateUpdateCounter++;
			document.querySelector ('#estimated-bitrate-value').innerHTML = `${msg.estimatedBitrate} bps`;
		} else if(msg.logs){
			document.querySelector ('#logs').textContent = msg.logs;
		}
	};
}

connect();
