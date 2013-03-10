$(document).ready(function(){
	var ajaxdomain = 'http://'+window.location.hostname+'/';
	var entry_el = $('#entry');
	var socket = new io.connect('http://'+window.location.hostname+':5000');
	socket.on('connect', function() {
		console.log('connecting ... ');
		console.log('sending username ... ');
		socket.emit('adduser', {username: username, team: 0, ready: false, room: gatherkey});


	});
	socket.on('updateplayer', function (data) {
		console.log(data);
		$('#currenPlayerListTeam1').empty();
		$('#currenPlayerListTeam2').empty();
		$.each(data, function(i) {
			$('#currenPlayerListTeam1').append('<li>'+data[i]+'</li>');
		});
		var team1count = $('#currenPlayerListTeam1 li').size();
		var team1max = $('#currenPlayerListTeam1').attr('data-max');
		var team2count = $('#currenPlayerListTeam2 li').size();
		var team2max = $('#currenPlayerListTeam2').attr('data-max');
		console.log('Team1: '+team1count+'/'+team1max+' - Team2: '+team2count+'/'+team2max);
		if(team1count < team1max) {
			currentTeam = '1';
			$('#currenPlayerListTeam1').append('<li>'+username+'</li>');
			// ajaxmange($id = null, $method = null, $player = null, $team = null) {
			//			$.get(ajaxdomain+'ajaxmanage/'+gatherid+'/add/'+username+'/1', function(data){
			//				$.get(ajaxdomain+'ajaxmanage/'+gatherid+'/getplayers/', function(data){
			//					console.log(data);
			//					var teams = data["players"];
			//					console.log(teams);
			//					//					alert(teams);
			//					var ready = data["ready"];
			//					console.log(ready);
			//				});
			//			});
			return;
		}
		if(team2count < team2max) {
			currentTeam = '2';
			$('#currenPlayerListTeam2').append('<li>'+username+'</li>');
			//			$.get(ajaxdomain+'ajaxmanage/'+gatherid+'/add/'+username+'/2', function(data){
			//				$.get(ajaxdomain+'ajaxmanage/'+gatherid+'/getplayers/', function(data){
			//					console.log($data);
			//				});
			//			});
			return;
		}
		return;
	});
	socket.on('updatechat', function (username, data) {
		console.log('updatechat', username, data);
		$('#log ul').prepend('<li>['+myTime()+'] <b>'+username + ': </b>' + data + '</li>');
	});
	socket.on('add', function (data) {
		var team1count = $('#currenPlayerListTeam1 li').size();
		var team1max = $('#currenPlayerListTeam1').attr('data-max');
		var team2count = $('#currenPlayerListTeam2 li').size();
		var team2max = $('#currenPlayerListTeam2').attr('data-max');
		console.log('Team1: '+team1count+'/'+team1max+' - Team2: '+team2count+'/'+team2max);
		if(team1count < team1max) {
			currentTeam = '1';
			$('#currenPlayerListTeam1').append('<li>'+data+'</li>');
			$.get(ajaxdomain+'ajaxmanage/'+gatherid+'/add/'+username+'/1', function(data){
				$.get(ajaxdomain+'ajaxmanage/'+gatherid+'/getplayers/', function(data){
					console.log(data);
					var teams = data["players"];
					console.log(teams);
					//					alert(teams);
					var ready = data["ready"];
					console.log(ready);
				});
			});
			return;
		}
		if(team2count < team2max) {
			currentTeam = '2';
			$('#currenPlayerListTeam2').append('<li>'+data+'</li>');
			$.get(ajaxdomain+'ajaxmanage/'+gatherid+'/add/'+username+'/2', function(data){
				$.get(ajaxdomain+'ajaxmanage/'+gatherid+'/getplayers/', function(data){
					console.log($data);
				});
			});
			return;
		}
		return;
	});
	socket.on('remove', function (data) {
		console.log(data);
		$.get(ajaxdomain+'ajaxmanage/'+gatherid+'/remove/'+data+'/'+currentTeam, function(data){
			$.get(ajaxdomain+'ajaxmanage/'+gatherid+'/getplayers/', function(data){
				console.log(data);
			});
		});
		return;
	});
	socket.on('updateplayers', function (data) {
		$.get(ajaxdomain+'ajaxmanage/'+gatherid+'/getplayers/', function(data){
			console.log($data);
			
		});
	});
	entry_el.keypress(function(e) {
		if (e.which == 13) {
			var message = $(entry_el).val();
			$(entry_el).val('')
			socket.emit('sendchat', message)
		}
	});
});

function myTime() {
	var time = new Date();
	var curr_hour = time.getHours();
	curr_hour = curr_hour + "";
	if (curr_hour.length == 1) {
		curr_hour = "0" + curr_hour;
	}
	var curr_min = time.getMinutes();
	curr_min = curr_min + "";
	if (curr_min.length == 1) {
		curr_min = "0" + curr_min;
	}
	var curr_sec = time.getSeconds();
	curr_sec = curr_sec + "";
	if (curr_sec.length == 1) {
		curr_sec = "0" + curr_sec;
	}
	var displaytime = curr_hour + ":" + curr_min + ":" + curr_sec; 
	return displaytime;
}