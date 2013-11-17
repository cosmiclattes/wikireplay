function playback(){
	var diff = new htmlDiff();
	diff.clearHash();
	var listOfRevisions = [], pageTitle, startRev, endRev, revisionInfo, modifyList;
	var playAnimation = true;
	this.animationSpeed = 500;
	var usingLanguageNamespace = 'en';
	var modifyList =[];
	var revisionListDict = {
		'format': 'json',
		'action': 'query',
		'prop': 'revisions',
		'rvprop': 'ids|user|timestamp|size|flags',
		'rvdir': 'newer',
	};
	
	var compareRevisionDict = {
		'format': 'json',
		'action': 'query',
		'prop': 'revisions',
		'rvprop': 'content',
		'rvexpandtemplates': '',
		'rvparse': '',
	};
	
	var baseUrl = 'https://en.wikipedia.org/w/api.php?callback=?';
	var that = this;
	this.wikiNameSpace = function (language) {
	  usingLanguageNamespace = language;
	  baseUrl = 'https://'+language+'.wikipedia.org/w/api.php?callback=?';
	};
	
	this.getRevisions = function (page,selectedEdits){

			listOfRevisions = selectedEdits;
	        pageTitle = page;
	        startRev = listOfRevisions.shift().revid;
	        revisionInfo = listOfRevisions[0];
	        endRev = revisionInfo.revid;
	        listOfRevisions.shift();
	        playAnimation = true;
	        that.wikiDiff();
       
	};
	/** Caching the results memoization **/
	var hashTable = hashTable || {};
	function getRequest(revid){
		var deferredReady = $.Deferred();
		if (revid in hashTable){
			//console.log('cache hit', revid);
			return true;
		}
		else{
			//console.log('cache fail',revid );
			compareRevisionDict['revids'] = revid;
			return $.getJSON(baseUrl,compareRevisionDict,function(data){
				var resultKey = Object.keys(data.query.pages);
				var dataRev = data.query.pages[resultKey].revisions[0]['*'];
				hashTable[revid] = dataRev;
			});
		}
	};
	var empty = function (list){
		var l =[];
		for (ll in list ){
			if ($(list[ll]).children().text().trim()){
				l.push(list[ll]);
				}
		} 
		return l;
	};
	//hard coding parent element
	var removeRef = function(parentElement){
		$('del a[href^=#CITE_NOTE],del a[href^=#CITE_REF],del *[id^=CITE_NOTE]').remove();
		$('del sup a[href^=#CITE_NOTE]').parent().parent().remove();
		$('a[href^=#CITE_NOTE] del').remove();
		$('a[href^=#CITE_NOTE] ins').each(function(){
			var element = $(this);
			element.replaceWith(element.text());
		});
	};
	this.wikiDiff = function(){
	    //Creating the info box about the revisions
        var revInfo = {
				'title': pageTitle,
				'revid': revisionInfo.revid,
				'user': revisionInfo.user,
				'timestamp': revisionInfo.timestamp.slice(0,10),
				'anon': revisionInfo.hasOwnProperty('anon')? 'anon' : null,
				'minor': revisionInfo.hasOwnProperty('minor')? 'minor' : null
		};
		that.infoBox(revInfo);
		$.when(getRequest(startRev),getRequest(endRev)).done(function(){
			var dataFirstRev  = hashTable[startRev];
			var dataSecondRev = hashTable[endRev];
			console.time('diff');
			var modifiedHtml = diff.diff(dataFirstRev,dataSecondRev);
			console.timeEnd('diff');
			$('#wikiBody').html(modifiedHtml);
			// To remove ref changes 
			removeRef();
			console.time('making array');
			modifyList = empty($.makeArray($('del,ins')));
			console.timeEnd('making array');
			that.animateDiff();
		});		
	};
	
	this.infoBox = function (revInfo){
        $('.infoBox').html('');
        for (key in revInfo){                   
            if(key == 'revid'){
                var urlBase = 'https://'+usingLanguageNamespace+'.wikipedia.org/w/index.php?oldid='+revInfo[key];
                var anchor =$('<a>'+revInfo[key]+'</a>').attr({'target':'_blank','href':urlBase});
                 $('.infoBox').append(anchor);
            }
            else{
            	if (revInfo[key]){
                	$('.infoBox').append('<span>'+revInfo[key]+'</span>');
               	}
            }
        }
	};
	
	this.animateDiff = function () {
		if(playAnimation){
                if(modifyList.length>0){
					var element = modifyList[0];
					var scrollPromise = that.customScrollIntoView('#wikiBody',element);
                    modifyList.shift();
                    $.when(scrollPromise).then(function(){
                    	if ($(element).prop('tagName') == 'DEL'){
                        	//console.log('scroll end:: animation begin add ',Date.now(),modifyList.length,element.id);
                        	return $(element).fadeOut(that.animationSpeed);
                    	}
                    	else{
                    		//console.log('scroll end:: animation begin delete ',Date.now(),modifyList.length,element.id);
                        	return $(element).fadeIn(that.animationSpeed).css('display','inline-block');                        
                    	}
                    	
                    }).then(function(){ 
                    		//console.log('animation end',Date.now(),modifyList.length,element.id);
                    		that.animateDiff();
                    	});
				}
                else{
                    if(listOfRevisions.length>0){
                        startRev = endRev;
                        revisionInfo = listOfRevisions.shift();
                        endRev = revisionInfo.revid;
                        $('body').trigger( "editAnimationBegins", [startRev] );
                        that.wikiDiff();
                    }
                    else{
						$('#playButton').removeClass().addClass('play');
                    }
				}
			
		}
	};
	var getOffsetTop = function(element){
		if (element.parentElement.tagName == 'TD'){
			return element.parentElement.offsetTop;
		}
		else{
			return element.offsetTop;
		}
	};
	this.customScrollIntoView = function(parent,element){
		//console.log('scroll begin',Date.now(),modifyList.length,element.id);
		var offset = 0;
		if ($(element).css('display') == 'none'){
			offset = getOffsetTop($(element).css('display','inline-block')[0]);
			$(element).css('display','none');
		}
		else{
			offset = getOffsetTop(element);
		}
		return $(parent).animate({scrollTop: offset }, that.animationSpeed);
	};
	
	this.startPlayback = function(button){
		var page = $('#page_name').val();
	    //var rev = $('#page_rev').val();
	    
	    
	    //Handling the case where the the player was paused
	    if(listOfRevisions.length > 0){
	        $(button).removeClass('play').addClass('pause');
	        playAnimation = true;
	        that.animateDiff();
	    }
	    else{
	        that.getRevisions(page,rev); 
	    }
	};
	
	this.pausePlayback = function(button){
		$(button).removeClass('pause').addClass('play');
		$('del,ins').finish();
		playAnimation = false;
	};
	//Attaching control for play / pause
	this.playbackControl  = function(){
		$('#playButton').click(function(){
			var button = this;
			if($(button).hasClass('play')){
				that.startPlayback(button);		    
			}
			else{
				that.pausePlayback(button);
			}
		});
	};
};

function addLanguageOptions(languages){
	for(language in languages){
		var option = $('<option>').val(language).html(languages[language]);
		$('select.languageNamespace').append(option);
	}
};

//The fullscreen Api handling
function fullscreenApi(screen){
	var elem = $(screen).get(0);
	if (elem.requestFullscreen) {
		elem.requestFullscreen();
	} 
	else if (elem.mozRequestFullScreen) {
		elem.mozRequestFullScreen();
	} 
	else if (elem.webkitRequestFullscreen) {
		elem.webkitRequestFullscreen();
	}
};