/*========================================
MiCasa Verde VeraLite Device Demo
==========================================*/

//Change the IP below to the IP of your Vera unit
var MiCasaIP = "192.168.50.155";
var MiCasaPort = "3480";

//Main function auto loads when iViewer is started
//Make sure you don't have more than one CF.userMain declared in your any scripts your project uses.
CF.userMain = function() {
	//calls getDevices with a basejoin of 100
	getDevices(100);
	getRooms(200);
};

//Gets the url/host before sending the JSON request to MiCasaVerde
geturl = function() {
	return "http://" + MiCasaIP +":" + MiCasaPort + "/";
};

micasarpc = function(method, callback) {
	var host = self.geturl();
	var url = host + method;
		
	CF.request(url, function(status, headers, body) {
		var data = JSON.parse(body);
		callback(data);
	});
};
	
//Sets up room names for each list
getRooms = function(join) {
	var baseJoin = join;
	
	micasarpc("data_request?id=user_data&output_format=json", function(data) {
	
	RoomArray = [];
	
		for (var i = 0; i<data.rooms.length; i++) {
		
			var roomid = data.rooms[i].id;
			var roomname = data.rooms[i].name;
			
			CF.setJoin("s"+baseJoin, roomname);
			baseJoin++;
		};
	});
};
	
//called when iViewer is started and gets all devices of Mi Casa Verde.  Then Assigns names and device id's to buttons
getDevices = function(join) {
	var baseJoin = join;

		micasarpc("data_request?id=user_data&output_format=json", function(data) {
			
			DeviceArray = [];
			
			for (var i = 0; i<data.devices.length; i++) {
				
				var deviceid = data.devices[i].id;
				var name = data.devices[i].name;
				var roomid = data.devices[i].room;
				
				if (data.devices[i].invisible == null) {
					// Add to array to add to list in one go later
					DeviceArray.push({
						s10: name,
						Room:  roomid,
						s11: {
							tokens: {
								"[id]": deviceid
							}
						},
						d12: {
							tokens: {
								"[id]": deviceid
							}
						},
						d13: {
							tokens: {
								"[id]": deviceid
							}
						}
					});
				};
			};
			
			//add all devices found to Room list
			for (var i = 0; i<DeviceArray.length; i++) {
				if (DeviceArray[i].Room == "1") {
					CF.listAdd("l"+baseJoin, [DeviceArray[i]]);
				};
				if (DeviceArray[i].Room == "2") {
					CF.listAdd("l"+(baseJoin + 1), [DeviceArray[i]]);
				};
				if (DeviceArray[i].Room == "3") {
					CF.listAdd("l"+(baseJoin + 2), [DeviceArray[i]]);
				};
				if (DeviceArray[i].Room == "4") {
					CF.listAdd("l"+(baseJoin + 3), [DeviceArray[i]]);
				};
			};
			
			//get the status of all devices
			UpdateAllDevices();
		});	
};

DeviceOn = function(list, listIndex, join) {

	CF.getJoin(list+":"+listIndex+":"+join, function(j,v,t) {
		micasarpc( ("data_request?id=action&output_format=json&DeviceNum=" + t["[id]"] + "&serviceId=urn:upnp-org:serviceId:SwitchPower1&action=SetTarget&newTargetValue=1"), function(data) {
			
			//data gives back the job id, can use:  http://ip_address:3480/data_request?id=jobstatus&job=6&plugin=zwave to pull back job success

		});
	});

	//delay for 1 second then get the device status
	setTimeout(function() {UpdateAllDevices()}, 1000);
};

DeviceOff = function(list, listIndex, join) {
	
	CF.getJoin(list+":"+listIndex+":"+join, function(j,v,t) {
		micasarpc( ("data_request?id=action&output_format=json&DeviceNum=" + t["[id]"] + "&serviceId=urn:upnp-org:serviceId:SwitchPower1&action=SetTarget&newTargetValue=0"), function(data) {
			
			//data gives back the job id, can use:  http://ip_address:3480/data_request?id=jobstatus&job=6&plugin=zwave to pull back job success/fail

		});
	});
	
	//delay for 1 second then get the device status
	setTimeout(function() {UpdateAllDevices()}, 1000);
};

GetDeviceStatus = function(list, listIndex, join) {
	CF.getJoin(list+":"+listIndex+":"+join, function(j,v,t) {
		micasarpc( ("data_request?id=status&output_format=json&DeviceNum=" + t["[id]"]), function(data) {
			
			var devicestatus = data["Device_Num_"+t["[id]"]].states[0].value;
			
			SetDeviceStatus(list, listIndex, devicestatus);
		});
	});
};

SetDeviceStatus = function(list, listIndex, status) {
	if (status === "0")	{
		CF.setJoin(list +":" + listIndex +":s11", "Resources/light_Off.jpg");
	};
	
	if (status === "1") {
		CF.setJoin(list +":" + listIndex +":s11",  "Resources/light_On.jpg");
	};
};

UpdateAllDevices = function() {
	var listjoin = 100;
	var maxrooms = (listjoin + 4);
	
	//gets each list and then updates all devices in each list
	for (listjoin; listjoin<maxrooms; listjoin++) {
		var list = ("l" + listjoin);

		CF.listInfo(list, function(list, count, first, numVisible, scrollPosition) {
			//loop through the list and set the devices status.
			var listcount = count;
			
			for (var i = 0; i<listcount; i++){
				GetDeviceStatus(list, i, "s11");
			};
		});
	};
};