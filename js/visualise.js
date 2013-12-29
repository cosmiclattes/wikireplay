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
       	start: 1000,
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
    var start = function(titleHolder){
		$('#wikiBody').show();        
		pageTitle = $(titleHolder).val();
		wikiPlayback.cleanUp();
		slider.cleanUp();
		slider.getData(pageTitle);
    };
    
    $('#pageButton').click(function(){
    	start('#pageTitle');
    }); 

    $('#overlayRand').click(function() {
        chooseRandomArticle();
    });
    
    $('#overlayLoad').click(function(){
    	$('#pageTitle').val($('#overlayTitle').val());
    	start('#pageTitle');
    	$('#overlay').fadeOut(2500);
    	
    });
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
								enlargedBarGraphBarwidth : 4,
								primarySliderMoveCallback : pause,
								secondrySliderMoveCallback : play
							});
	slider.init(); 
	
	$('body').on( "editAnimationBegins", function( event,revid ) {
		slider.modifySecondryGraph('revid',revid);
	});
	
	addLanguageOptions(languageNamespace);
    $('select.languageNamespace').change(function(){
    	var language = $(this).val();
		wikiPlayback.wikiNameSpace(language);
		slider.wikiNameSpace(language);
	});
	
    
};
    