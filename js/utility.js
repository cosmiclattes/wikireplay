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
var utility = {
	'articleTitle':'',
	'apiUrl':'https://en.wikipedia.org/w/api.php?callback=?',
	'revisionUrl' : 'https://en.wikipedia.org/w/index.php?oldid=',
	'redirectTitle' : function(title){
		var check_redirect_dict = {
			'action':'query',
			'format':'json',
			'titles':title,
			'redirects':''
		};
		var that = this;
		return $.getJSON(that.apiUrl,check_redirect_dict,function(data){
			if (-1 in data['query']['pages']){
				that.articleTitle = false;
			}
			else{
				query = data['query'];	
				if ('redirects' in query){
					console.log(query['redirects'][0]['to']);
					that.articleTitle = query['redirects'][0]['to'];
				}
				else
					that.articleTitle = title;
			}
		});
	},
	'searchTitle' : function(parent, string){
		var that = this;
		var search_dict = {
			'action':'opensearch',
			'format':'json',
			'search':string,
			'namespace':0,
			'suggest':'',
			'limit':5
		};
		$.getJSON(that.apiUrl,search_dict,function(data){
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
	},
	'languageDropdown': function(parent,languages){
		var dropdown = $(parent + ' .languageDropdown ul');
		var count = 0;
		for (language in languages){
			if( count % 6 == 0 ){
				var subList = $('<li><ul></ul></li>');
				dropdown.append(subList);
				var subList = subList.find('ul');
			}
			var li = $('<li></li>').text(languages[language]).attr('data-language',language);
			subList.append(li);
			count ++ ;
		}
	},
	'changeUrlLanguage': function(language){
		this.apiUrl = 'https://'+language+'.wikipedia.org/w/api.php?callback=?';
		this.revisionUrl = 'https://'+language+'.wikipedia.org/w/index.php?oldid=';
	},
	'translate': function(language){
		language = translation[language] ? language : 'en';
		translations = translation[language];
		$('[data-translate]').each(function(index){
			element = $(this);
			if (element.prop('tagName') == 'INPUT'){
				if (element.attr('value')){
					element.attr('value',translations[element.attr('data-translate')]);
				}
				else{
					element.attr('placeholder',translations[element.attr('data-translate')]);
				}
			}
			else if (element.attr('data-title')){
				element.attr('data-title',translations[element.attr('data-translate')]);
			}
			else{
				element.text(translations[element.attr('data-translate')]);
			}
		});
	}
};

var infoBox = function (revInfo){
        for (key in revInfo){                   
            if(key == 'revid'){
                var urlBase = utility.revisionUrl+revInfo[key];
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