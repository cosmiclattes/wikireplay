window.onload = function(){
	
    //Creating Language Namespace dropdown
    wikiPlayback = new playback();
    
    //Fullscreen
    $('#fullscreen').click(function(){
		fullscreenApi('body');            
        });
  
        //Speed Control
    $(".noUiSlider").noUiSlider({
        range: [200, 1000],
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
    $('#page_button').click(function(){
		$('#wikiBody,.infoBox').show();        
    	$('#playButton').removeClass().addClass('pause');        
		//wikiPlayback.getRevisions($('#page_name').val(),$('#page_rev').val());
		pageTitle = $('#page_name').val();
		//wikiPlayback.getRevisions(pageTitle);
		
		/* From slider */
		slider.cleanUp();
		slider.getData(pageTitle);
    }); 
    
    var button = $('#playButton');
    var pause = function(button){
    	wikiPlayback.pausePlayback(button);
    };
    
    var play  = function(){
    	var selectedEdits = slider.getSelection();
    	wikiPlayback.getRevisions(pageTitle,selectedEdits);
    };
    
	var slider = new wikiSlider({	height : 400,
								barGraphBarwidth : 2,
								enlargedBarGraphBarwidth : 4,
								primarySliderMoveCallback : pause,
								secondrySliderMoveCallback : play
							});
	slider.init(); 
	
	addLanguageOptions(languageNamespace);
    $('select.languageNamespace').change(function(){
    	var language = $(this).val();
		wikiPlayback.wikiNameSpace(language);
		slider.wikiNameSpace(language);
	});
	
    
};
    