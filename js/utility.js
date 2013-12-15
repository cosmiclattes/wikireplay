var userNotification = function(type){
		//add code to remove class & add the calls to the notification
		if (type == 'play'){
			$('.notify').removeClass().addClass('notify').addClass('notifyPlay').show().fadeOut(2000);
		}
		else if (type == 'pause'){
			if(!$('.notify').hasClass('notifyPause')){
				$('.notify').removeClass().addClass('notify').addClass('notifyPause').show().fadeOut(2000);
			}
		}
		else{
			$('.notify').removeClass().addClass('notify').addClass('notifyLoad').show().fadeOut(2000);
		}
	}; 