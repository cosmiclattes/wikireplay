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
var url = 'https://en.wikipedia.org/w/api.php?callback=?';
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
var utility = {
	'articleTitle':'',
	'redirectTitle' : function(title){
		var check_redirect_dict = {
			'action':'query',
			'format':'json',
			'titles':title,
			'redirects':''
		};
		var that = this;
		return $.getJSON(url,check_redirect_dict,function(data){
			if ('query' in data){
				query = data['query'];	
			}
			else
				that.articleTitle = false;
			if ('redirects' in query){
				console.log(query['redirects'][0]['to']);
				that.articleTitle = query['redirects'][0]['to'];
			}
			else
				that.articleTitle = title;
		});
	},
	'searchTitle' : function(parent, string){
		var search_dict = {
			'action':'opensearch',
			'format':'json',
			'search':string,
			'namespace':0,
			'suggest':'',
			'limit':5
		};
		$.getJSON(url,search_dict,function(data){
			$('.suggestionDropdown').attr('data-length',data[1].length);
			console.log(data);
			$(parent + ' .suggestionDropdown li').each(function(index){
				if (data[1][index]){
					$(this).text(data[1][index]);
				}
				else{
					$(this).text('');
				}
			});
		});
	}
};
