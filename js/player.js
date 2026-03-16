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

	/* --- Smart diff classification --- */

	var isStructural = function($el) {
		// Inside table, infobox, navbox, sidebar, message boxes
		if ($el.closest('table, .infobox, .navbox, .sidebar, .mbox, .ambox, .tmbox, .wikitable').length) return true;
		// Category links at bottom of page
		if ($el.closest('#catlinks, .catlinks').length) return true;
		// Navigation boxes, hatnotes, disambiguation
		if ($el.closest('.hatnote, .dablink, .shortdescription').length) return true;
		// Headings where only structure changed (e.g. section reorder)
		if ($el.closest('h1,h2,h3,h4,h5,h6').length) return true;
		// Edit section links
		if ($el.closest('.mw-editsection').length) return true;
		// Metadata spans
		if ($el.closest('.metadata, .noprint').length) return true;
		return false;
	};

	var isCitation = function($el) {
		// Reference list section
		if ($el.closest('.reflist, .references, .reference').length) return true;
		// Superscript citation links [1], [2] etc
		if ($el.closest('sup.reference').length) return true;
		// Contains cite_note links
		if ($el.find('a[href*="cite_note"], a[href*="cite_ref"]').length) return true;
		if ($el.closest('[id^="cite_note"], [id^="cite_ref"]').length) return true;
		return false;
	};

	var classifyChanges = function(list) {
		var content = [], structural = [], citations = [];
		for (var i = 0; i < list.length; i++) {
			var $el = $(list[i]);
			if (isCitation($el)) {
				$el.data('citation', true);
				citations.push(list[i]);
			}
			else if (isStructural($el))  structural.push(list[i]);
			else                         content.push(list[i]);
		}
		return { content: content, structural: structural, citations: citations };
	};

	var applyInstantly = function(list) {
		for (var i = 0; i < list.length; i++) {
			var $el = $(list[i]);
			if ($el.prop('tagName') === 'DEL') {
				$el.hide();
			} else {
				$el.show().css('display', 'inline-block');
			}
		}
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
			var allChanges = empty($.makeArray($('del,ins')));
			allChanges = removeToc(allChanges);

			// Classify changes: content, structural, citations
			var classified = classifyChanges(allChanges);
			console.log('Changes — content:', classified.content.length,
						'structural:', classified.structural.length,
						'citations:', classified.citations.length);

			// Apply structural changes instantly (no animation)
			applyInstantly(classified.structural);

			// Merge content + citations for animation
			// Citations are tagged with data('citation') and animate at 3x speed
			modifyList = classified.content.concat(classified.citations);

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
	
	/* --- Spotlight + Zoom helpers --- */
	var doZoom = function(element) {
		var $parent = $(element).closest('p, li, div.mw-parser-output > *');
		if ($parent.length) {
			$parent.addClass('zoom-active');
		}
	};

	var undoZoom = function(element) {
		var $parent = $(element).closest('p, li, div.mw-parser-output > *');
		if ($parent.length) {
			$parent.removeClass('zoom-active');
		}
	};

	var doSpotlight = function(element) {
		var $overlay = $('#spotlight-overlay');
		var rect = element.getBoundingClientRect();
		var cx = rect.left + rect.width / 2;
		var cy = rect.top + rect.height / 2;

		$overlay.css({
			'display': 'block',
			'opacity': '1',
			'background': 'radial-gradient(ellipse 400px 100px at ' + cx + 'px ' + cy + 'px, ' +
				'transparent 0%, transparent 40%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0.45) 100%)'
		});
	};

	var undoSpotlight = function() {
		$('#spotlight-overlay').css('opacity', '0');
		setTimeout(function() {
			$('#spotlight-overlay').css('display', 'none');
		}, 300);
	};

	this.animateDiff = function () {
		if(playAnimation){
                if(modifyList.length>0){
					var element = modifyList[0];
					var speed = $(element).data('citation') ? Math.floor(that.animationSpeed / 3) : that.animationSpeed;

					var scrollPromise = that.customScrollIntoView('#wikiBody',element);

                    $.when(scrollPromise).then(function(){
                    	// Step 1: Zoom the parent paragraph
                    	doZoom(element);

                    	// Step 2: After zoom settles, apply spotlight
                    	var spotlightDeferred = $.Deferred();
                    	setTimeout(function() {
                    		doSpotlight(element);
                    		spotlightDeferred.resolve();
                    	}, 450);
                    	return spotlightDeferred.promise();

                    }).then(function(){
                    	// Step 3: Animate the del/ins change
                    	var animDeferred = $.Deferred();
                    	setTimeout(function() {
	                    	if ($(element).prop('tagName') == 'DEL'){
	                        	$(element).fadeOut(speed, function(){ animDeferred.resolve(); });
	                    	}
	                    	else{
	                        	$(element).fadeIn(speed).css('display','inline-block');
	                        	setTimeout(function(){ animDeferred.resolve(); }, speed);
	                    	}
                    	}, 200);
                    	return animDeferred.promise();

                    }).then(function(){
                    	// Step 4: Hold briefly, then undo zoom + spotlight
                    	var cleanupDeferred = $.Deferred();
                    	setTimeout(function() {
                    		undoZoom(element);
                    		undoSpotlight();
                    		setTimeout(function() {
                    			cleanupDeferred.resolve();
                    		}, 400);
                    	}, 300);
                    	return cleanupDeferred.promise();

                    }).then(function(){
                    		modifyList.shift();
                    		that.animateDiff();
                    	});
				}
                else{
                	undoSpotlight();
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
