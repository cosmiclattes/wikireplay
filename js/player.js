function playback(){
	var diff = new htmlDiff();
	diff.clearHash();
	var listOfRevisions = [], pageTitle, startRev, endRev, revisionInfo, modifyList;
	var playAnimation = true;
	this.animationSpeed = 1000;
	var usingLanguageNamespace = 'en';
	var modifyList =[];
	var revisionListDict = {
		'format': 'json',
		'action': 'query',
		'prop': 'revisions',
		'rvprop': 'ids|user|timestamp|size|flags',
		'rvdir': 'newer',
		'rawcontinue': ''
	};
	this.articleName = '';
	var compareRevisionDict = {
		'format': 'json',
		'action': 'query',
		'prop': 'revisions',
		'rvprop': 'content',
		'rvexpandtemplates': '',
		'rvparse': '',
		'rawcontinue': ''
	};
	
	var that = this;
	this.cleanUp = function(){
		listOfRevisions = [];
		$('#wikiBody').html('');
	};
	this.getRevisions = function (page,selectedEdits){

			listOfRevisions = selectedEdits;
	        pageTitle = page;
	        startRev = listOfRevisions.shift().revid;
	        revisionInfo = listOfRevisions[0];
	        endRev = revisionInfo.revid;
	        listOfRevisions.shift();
	        playAnimation = true;
	        $('body').trigger( "editAnimationBegins", [startRev] );
	        that.wikiDiff();
       
	};
	/** Caching the results memoization **/
	var hashTable = hashTable || {};
	function getRequest(revid){
		//var deferredReady = $.Deferred();
		if (revid in hashTable){
			//console.log('cache hit', revid);
			return true;
		}
		else{
			//console.log('cache fail',revid );
			compareRevisionDict['revids'] = revid;
			return $.getJSON(utility.apiUrl,compareRevisionDict,function(data){
				var resultKey = Object.keys(data.query.pages);
				var dataRev = data.query.pages[resultKey].revisions[0]['*'];
				hashTable[revid] = dataRev;
			});
		}
	};
	var empty = function (list){
		var l =[];
		for (ll in list ){
			if ($(list[ll]).text().trim()){
				l.push(list[ll]);
				}
		} 
		return l;
	};
	//hard coding parent element
	var removeRef = function(parentElement){
		$('del a[href^=#cite_note],del a[href^=#cite_ref],del *[id^=cite_note]').remove();
		$('del sup a[href^=#cite_note]').parent().parent().remove();
		$('a[href^=#cite_note] del').remove();
		$('a[href^=#cite_note] ins').each(function(){
			var element = $(this);
			element.replaceWith(element.text());
		});
	};
	//Removing TOC
	var removeToc = function(list){
		var modifiedList = [];
		for (i=0;i<list.length;i++) {
			if (!$(list[i]).find('[class^="toclevel"]').length) { 
					modifiedList.push(list[i]);
				} 
			}
		return modifiedList;
	};
	this.wikiDiff = function(){
	    //Creating the info box about the revisions
        var revInfo = {
				'revid': revisionInfo.revid,
				'user': revisionInfo.user,
				'timestamp': revisionInfo.timestamp.slice(0,10),
				'minor': revisionInfo.hasOwnProperty('minor')? 'M' : null
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
			modifyList = removeToc(modifyList);
			console.timeEnd('making array');
			that.animateDiff();
		});		
	};
	
	this.infoBox = function (revInfo){
        //$('#infoBox').html('');
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
	
	this.animateDiff = function () {
		if(playAnimation){
                if(modifyList.length>0){
					var element = modifyList[0];
					var scrollPromise = that.customScrollIntoView('#wikiBody',element);
                    
                    $.when(scrollPromise).then(function(){
                    	if ($(element).prop('tagName') == 'DEL'){
                        	console.log('scroll end:: animation begin add ',Date.now(),modifyList.length,element.id);
                        	return $(element).fadeOut(that.animationSpeed);
                    	}
                    	else{
                    		console.log('scroll end:: animation begin delete ',Date.now(),modifyList.length,element.id);
                        	return $(element).fadeIn(that.animationSpeed).css('display','inline-block');                        
                    	}
                    	
                    }).then(function(){ 
                    		console.log('animation end',Date.now(),modifyList.length,element.id);
                    		modifyList.shift();
                    		that.animateDiff();
                    	});
				}
                else{
                	$('body').trigger( "editAnimationBegins", [endRev] );
                    if(listOfRevisions.length>0){
                        startRev = endRev;
                        revisionInfo = listOfRevisions.shift();
                        endRev = revisionInfo.revid;
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
		//console.log('scroll begin',Date.now(),modifyList.length,element);
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
	
	this.startPlayback = function(selectedEdits,reset){
		userNotification('play');
		$('#playButton').removeClass('play').addClass('pause');
		var page = that.articleName;
	    //Handling the case where the the player was paused
		    if(!slider.pegMoved && listOfRevisions.length && listOfRevisions.length > 0){
		        playAnimation = true;
		        that.animateDiff();
		    }
		    else{
		    	//refractor this
		    	selectedEdits = slider.selectedEdits;
		    	slider.refreshProgressBar(selectedEdits[0]);
		    	slider.pegMoved = false;
		        that.getRevisions(page,selectedEdits); 
		    }
	};
	
	this.pausePlayback = function(button){
		userNotification('pause');
		$(button).removeClass('pause').addClass('play');
		$('del,ins').finish();
		playAnimation = false;
	};
	//Attaching control for play / pause
	this.playbackControl  = function(){
		$('#playButton').click(function(){
			var button = this;
			if($(button).hasClass('play')){
				that.startPlayback();		    
			}
			else{
				that.pausePlayback(button);
			}
		});
	};
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


function chooseRandomArticle(lang_code) {
	lang_code = lang_code ? lang_code : 'en';
	var api_url = 'https://' + lang_code + '.wikipedia.org/w/api.php?callback=?';
	var params = {
		'action': 'query',
		'list': 'random',
		'rnnamespace': 0,
		'rnlimit': 1,
		'format': 'json'
	};
	$.getJSON(api_url, params, function(data, e) {
		var page_title = data['query']['random'][0]['title'];
		console.log('Randomly selected:', page_title);
		$('#overlayTitle').val(page_title);
		$('#overlayLoad').trigger('click');
	});
}
