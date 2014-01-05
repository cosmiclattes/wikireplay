var userNotification = function(type){
		//add code to remove class & add the calls to the notification
		if (type == 'play'){
			$('.notify').removeClass().addClass('notify').addClass('notifyPlay').show().fadeOut(2000);
		}
		else if (type == 'pause'){
			if(!$('.notify').hasClass('notifyPause') && $('.notify').hasClass('notifyPlay')){
				$('.notify').removeClass().addClass('notify').addClass('notifyPause').show().fadeOut(2000);
			}
		}
		else{
			$('.notify').removeClass().addClass('notify').addClass('notifyLoad').show().fadeOut(2000);
		}
	}; 
var usingLanguageNamespace = 'en';
var infoBox = function (revInfo){
        for (key in revInfo){                   
            if(key == 'revid'){
                var urlBase = 'https://'+usingLanguageNamespace+'.wikipedia.org/w/index.php?oldid='+revInfo[key];
                var anchor =$('<a>'+revInfo[key]+'</a>').attr({'target':'_blank','href':urlBase});
                 $('#infoBox .revisionLink').html(anchor);
            }
            else if(key == 'timestamp'){
            	$('#infoBox .editDate').html(revInfo[key]);
            }
            else if(key == 'user'){
            	$('#infoBox .userName').html(revInfo[key]);
            }
            else{
            	var minor = revInfo[key]?revInfo[key]:'';
                $('#infoBox .minor').html(minor);
               	
            }
        }
	};