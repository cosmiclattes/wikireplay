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
        range: [200, 5000],
       	start: 500,
        step: 100,
        handles: 1,
        slide: function(){
        	wikiPlayback.animationSpeed = $(this).val();
        }        
    });
     
    //Attaching Play/Pause contorls
    wikiPlayback.playbackControl();
    
    //Attaching Event to get the list of revisions
    var pageTitle ;
    $('#pageButton').click(function(){
		$('#wikiBody').show();        
		pageTitle = $('#pageTitle').val();
		
		/* From slider */
		slider.cleanUp();
		slider.getData(pageTitle);
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
								barGraphBarwidth : 2,
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
    