window.onload = function(){
	
	//Setting the max-width of the slider to the screen width
	$('#outer').css('max-width',$(window).width()-50+'px'); 
    //Creating Language Namespace dropdown
    wikiPlayback = new playback();
    
    //Fullscreen
    $('#fullscreen').click(function(){
		fullscreenApi('body');            
        });
  
        //Speed Control
    $(".noUiSlider").noUiSlider({
        range: [500, 5000],
       	start: 4500,
        step: 200,
        handles: 1,
        slide: function(){
        	wikiPlayback.animationSpeed = 5500 - $(this).val();
        }        
    });
     
    //Attaching Play/Pause contorls
    wikiPlayback.playbackControl();
    
    //Attaching Event to get the list of revisions
    var pageTitle ;
    var start = function(title){
		$('#wikiBody').show();        
		wikiPlayback.cleanUp();
		wikiPlayback.articleName = title;
		slider.cleanUp();
		slider.getData(title);
    };
    
    $('.load').click(function(){
    	getArticleName = utility.redirectTitle($(this).parent().find('.articleName').val());
    	$.when(getArticleName).done(function(){
    		if (utility.articleTitle){
    			start(utility.articleTitle);
    			//hide overlay
    			hideOverlay();
    		}
    		else{
    		//Add code for error messaging
    			$('.errorMessage').show();
    			$('.articleName').addClass('errorOutline');
    		}
    	});
    }); 

    $('#overlayRand').click(function() {
        chooseRandomArticle();
    });
    var hideOverlay = function(){
    	$('#overlayFooter').hide(500);
    	$('#overlay').slideUp(2500);
    };
    /*
    $('#overlayLoad').click(function(){
    	$('#overlayFooter').hide(500);
    	$('#overlay').slideUp(2500);
    });
    */
    var pause = function(){
    	var button = $('#playButton');
    	wikiPlayback.pausePlayback(button);
    };
    
    var play  = function(edits,reset){
    	var selectedEdits = reset ? edits : slider.getSecondrySliderSelection();
    	wikiPlayback.startPlayback(selectedEdits,reset);
    };
    
	slider = new wikiSlider({	height : 400,
								barGraphBarwidth : 1,
								enlargedBarGraphBarwidth : 5,
								primarySliderMoveCallback : pause,
								secondrySliderMoveCallback : play
							});
	slider.init(); 
	
	$('body').on( "editAnimationBegins", function( event,revid ) {
		slider.modifySecondryGraph('revid',revid);
	});
	
	/* Search box suggestion dropdown */
	var dropdownFocus = function(parent){
		$(parent + ' .articleName').focus(function(){
			index = 0; 
			$('.suggestionDropdown li').removeClass('suggestionBackground');
			$(parent + ' .suggestionDropdown li').eq(index).addClass('suggestionBackground');
			//Removing error messaging 
			$('.errorMessage').hide();
    		$('.articleName').removeClass('errorOutline');
		});
	};
	var dropdownKeyup = function(parent){	
	$(parent + ' .articleName').on('keyup',function(e){
			e.stopPropagation();
			console.log(e.which,index);
			$(parent + ' .suggestionDropdown li').removeClass('suggestionBackground');
			if(e.which == 38 && index>0){
				index--;
			}
			else if (e.which == 40 && index<parseInt($(parent + ' .suggestionDropdown').attr('data-length'))-1){
				index++;
			}
			else if (e.which == 13) {
				$('.articleName').val($(parent + ' .suggestionDropdown li').eq(index).text());
				$('.articleName').blur();
				utility.redirectTitle($('.articleName').val());
			}
			else{
				utility.searchTitle(parent, $(parent + ' .articleName').val());
			}
			$(parent + ' .suggestionDropdown li').eq(index).addClass('suggestionBackground');
		});
		$('.suggestionDropdown li').on('mousedown',function(){
			$('.articleName').val($(this).text());
		});
	};
	dropdownFocus('#header');dropdownFocus('#overlayHeader');
	dropdownKeyup('#header');dropdownKeyup('#overlayHeader');
	
	utility.languageDropdown('#overlayFooter',languageNamespace);utility.languageDropdown('#header',languageNamespace);
	$('.languageDropdown li li').click(function(){
			utility.changeUrlLanguage($(this).attr('data-language'));
			utility.translate($(this).attr('data-language'));
			$('.selectedLanguage').text($(this).text());
	});
};
    