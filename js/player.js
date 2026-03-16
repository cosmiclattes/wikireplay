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

			// Reset diagnostic log for this revision
			changeLog = [];
			changeCounter = 0;
			totalChanges = modifyList.length;

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
	
	/* --- Diagnostic log --- */
	var changeLog = [];
	var changeCounter = 0;
	var totalChanges = 0;

	var getElementPos = function(element) {
		var rect = element.getBoundingClientRect();
		return {
			cx: Math.round(rect.left + rect.width / 2),
			cy: Math.round(rect.top + rect.height / 2),
			top: Math.round(rect.top),
			left: Math.round(rect.left),
			width: Math.round(rect.width),
			height: Math.round(rect.height)
		};
	};

	var getSection = function(element) {
		var $el = $(element);
		var heading = $el.prevAll('h2,h3').first();
		if (!heading.length) heading = $el.parent().prevAll('h2,h3').first();
		return heading.length ? heading.text().replace('[edit]','').trim() : '(top)';
	};

	var logEntry = function(element) {
		var $el = $(element);
		var entry = {
			idx: changeCounter,
			total: totalChanges,
			action: $el.prop('tagName'),
			type: $el.data('citation') ? 'citation' : 'content',
			text: $el.text().substring(0, 60),
			section: getSection(element),
			parentTag: $el.parent().prop('tagName'),
			phases: {}
		};
		changeLog.push(entry);
		return entry;
	};

	var logPhase = function(entry, phase, data) {
		entry.phases[phase] = $.extend({ t: Date.now() }, data);
	};

	var logMismatch = function(entry, phase, elPos, targetPos, threshold) {
		var dist = Math.round(Math.sqrt(
			Math.pow(elPos.cx - targetPos.cx, 2) +
			Math.pow(elPos.cy - targetPos.cy, 2)
		));
		if (dist > (threshold || 80)) {
			var msg = '[MISMATCH] Change ' + entry.idx + '/' + entry.total +
				' "' + entry.text.substring(0, 30) + '..." — ' + phase +
				' center=(' + targetPos.cx + ',' + targetPos.cy + ')' +
				' but element at (' + elPos.cx + ',' + elPos.cy + ')' +
				' distance=' + dist + 'px';
			console.warn(msg);
			entry.phases[phase].mismatch = { distance: dist, element: elPos, target: targetPos };
		}
	};

	var printLog = function() {
		console.group('WikiReplay — Change Log (' + changeLog.length + ' changes)');
		changeLog.forEach(function(e) {
			var phases = Object.keys(e.phases).join(' → ');
			var mismatches = Object.keys(e.phases).filter(function(p) { return e.phases[p].mismatch; });
			var flag = mismatches.length ? ' ⚠ MISMATCH in: ' + mismatches.join(', ') : '';
			console.log(
				'[' + e.idx + '/' + e.total + '] ' + e.action + ' (' + e.type + ') ' +
				'"' + e.text.substring(0, 40) + '"' +
				'  §' + e.section +
				'  phases: ' + phases + flag
			);
			if (mismatches.length) {
				mismatches.forEach(function(p) {
					var m = e.phases[p].mismatch;
					console.log(
						'    ↳ ' + p + ': element@(' + m.element.cx + ',' + m.element.cy + ')' +
						' vs target@(' + m.target.cx + ',' + m.target.cy + ')' +
						' dist=' + m.distance + 'px'
					);
				});
			}
		});
		console.groupEnd();
	};

	/* --- Spotlight + Zoom helpers --- */
	var spotlightCenter = { cx: 0, cy: 0 };

	var doZoom = function(element) {
		// Find the nearest block-level parent to zoom
		var $parent = $(element).closest('p, li, td, dd, dt');
		// Fallback: if no match, try any direct child of wikiBody
		if (!$parent.length) $parent = $(element).closest('#wikiBody > *');
		if ($parent.length && !$parent.is('h1,h2,h3,h4,h5,h6')) {
			$parent.addClass('zoom-active');
		}
	};

	var undoZoom = function(element) {
		var $parent = $(element).closest('p, li, td, dd, dt');
		if (!$parent.length) $parent = $(element).closest('#wikiBody > *');
		if ($parent.length) {
			$parent.removeClass('zoom-active');
		}
	};

	var doSpotlight = function(element) {
		var $overlay = $('#spotlight-overlay');
		var $el = $(element);

		// If element is hidden (ins not yet shown), temporarily show to get position
		var wasHidden = $el.css('display') === 'none';
		if (wasHidden) {
			$el.css({'display': 'inline-block', 'visibility': 'hidden'});
		}

		// Get position relative to the wikiBody container, then convert to viewport coords
		var wikiBody = document.getElementById('wikiBody');
		var wikiRect = wikiBody.getBoundingClientRect();
		var rect = element.getBoundingClientRect();

		// If rect is zero (element not laid out), fall back to parent
		var targetRect = rect;
		if (rect.width === 0 && rect.height === 0) {
			targetRect = element.parentElement.getBoundingClientRect();
		}

		if (wasHidden) {
			$el.css({'display': 'none', 'visibility': ''});
		}

		var cx = targetRect.left + targetRect.width / 2;
		var cy = targetRect.top + targetRect.height / 2;

		// Clamp to within the wikiBody viewport area
		cx = Math.max(wikiRect.left, Math.min(cx, wikiRect.right));
		cy = Math.max(wikiRect.top, Math.min(cy, wikiRect.bottom));

		spotlightCenter = { cx: Math.round(cx), cy: Math.round(cy) };

		$overlay.css({
			'display': 'block',
			'opacity': '1',
			'background': 'radial-gradient(ellipse 400px 120px at ' + cx + 'px ' + cy + 'px, ' +
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
					var entry = logEntry(element);

					logPhase(entry, 'start', { elementPos: getElementPos(element), scrollTop: $('#wikiBody').scrollTop() });

					var scrollPromise = that.customScrollIntoView('#wikiBody',element);

                    $.when(scrollPromise).then(function(){
                    	// Wait for browser to repaint after scroll
                    	var scrollSettled = $.Deferred();
                    	setTimeout(function(){ scrollSettled.resolve(); }, 100);
                    	return scrollSettled.promise();

                    }).then(function(){
                    	// Step 1: Zoom the parent paragraph
                    	doZoom(element);
                    	logPhase(entry, 'zoom', { elementPos: getElementPos(element) });

                    	// Step 2: After zoom settles, apply spotlight
                    	var spotlightDeferred = $.Deferred();
                    	setTimeout(function() {
                    		doSpotlight(element);
                    		var elPos = getElementPos(element);
                    		logPhase(entry, 'spotlight', { elementPos: elPos, spotlightCenter: spotlightCenter });
                    		logMismatch(entry, 'spotlight', elPos, spotlightCenter);
                    		spotlightDeferred.resolve();
                    	}, 450);
                    	return spotlightDeferred.promise();

                    }).then(function(){
                    	// Step 3: Animate the del/ins change
                    	logPhase(entry, 'animate', { action: $(element).prop('tagName'), speed: speed });
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
                    	logPhase(entry, 'cleanup', {});
                    	var cleanupDeferred = $.Deferred();
                    	setTimeout(function() {
                    		undoZoom(element);
                    		undoSpotlight();
                    		setTimeout(function() {
                    			changeCounter++;
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
                	printLog();
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
