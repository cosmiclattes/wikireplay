var list_of_revisions = [];
playAnimation = true;
animationSpeed = 500;
usingLanguageNamespace = 'en';
var revisionListDict = {
            'format': 'json',
            'action': 'query',
            'prop': 'revisions',
            'rvprop': 'ids|user|timestamp|size|flags',
            'rvdir': 'newer',
}
var compareRevisionDict = {
            'format': 'json',
            'action': 'query',
            'prop': 'revisions',
            'rvprop': 'content',
            'rvexpandtemplates': '',
            'rvparse': '',
}
var baseUrl = 'https://en.wikipedia.org/w/api.php?callback=?'
$( document ).ready(function() {
            //Creating Language Namespace dropdown
            addLanguageOptions(languageNamespace);
            $('select.languageNamespace').change(function(){
                        usingLanguageNamespace = $(this).val();
                        baseUrl = 'https://'+usingLanguageNamespace+'.wikipedia.org/w/api.php?callback=?'
                        });
            //Speed Control
            $(".noUiSlider").noUiSlider({
                        range: [200, 1000]
                        ,start: 500
                        ,step: 100
                        ,handles: 1
                        ,slide: function(){
                        animationSpeed = $(this).val();
                        }
                     
            }); 
	    //Attaching Event to get the list of revisions
	    $('#page_button').click(function(){
                $('#wikiBody,.infoBox').show();        
		page = $('#page_name').val();
		rev = $('#page_rev').val();
                
                $('#playButton').removeClass().addClass('pause');
                
		get_revisions(page,rev);
	    });
            
            //Attaching control for play / pause
            $('#playButton').click(function(){
                        if($(this).hasClass('play')){

                                    page = $('#page_name').val();
                                    rev = $('#page_rev').val();
                        
                                    //Handling the case where the the player was paused
                                    
                                    if(list_of_revisions.length > 0){
                                                $(this).removeClass('play').addClass('pause');
                                                playAnimation = true;
                                                animateDiff();
                                    }
                                    else{
                                                get_revisions(page,rev); 
                                    }
                        }
                        else{
                                    $(this).removeClass('pause').addClass('play');
                                    $('del,ins').finish();
                                    playAnimation = false;
                        }
                        
            });
});
            function addLanguageOptions(languages){
                        for (language in languages){
                                    var option = $('<option>').val(language).html(languages[language]);
                                    $('select.languageNamespace').append(option);
                        }
            }
            function animateDiff(){
                        if(playAnimation){
                                    setTimeout(function(){
                                                if(modify_list.length>0){
                                                            element = modify_list[0];
                                                            console.log(element);
                                                            element.scrollIntoView();
                                                            if ($(element).prop('tagName') == 'DEL'){
                                                                    $(element).fadeOut(animationSpeed);
                                                            }
                                                            else{
                                                                    $(element).show(animationSpeed,'linear');
                                                            }
                                                            modify_list.shift();
                                                            animateDiff();
                                                }
                                                else{
                                                            if(list_of_revisions.length>0){
                                                                        start_rev = end_rev;
                                                                        revision_info = list_of_revisions.shift();
                                                                        end_rev = revision_info.revid;
                                                                        //setTimeout(wiki_diff,200);
                                                                        wiki_diff();
                                                            }
                                                            else{
                                                                        $('#playButton').removeClass().addClass('play');
                                                            }
                                                }
                                    },animationSpeed);
                        }
	    }
            function info_box(rev_info){
                        $('.infoBox').html('');
                        for (key in rev_info){            
                                    
                                    if(key == 'revid'){
                                                var url_base = 'https://'+usingLanguageNamespace+'.wikipedia.org/w/index.php?oldid='+rev_info[key];
                                                var anchor =$('<a>'+rev_info[key]+'</a>').attr({'target':'_blank','href':url_base});
                                                 $('.infoBox').append(anchor);
                                    }
                                    else{
                                                $('.infoBox').append('<span>'+rev_info[key]+'</span>');
                                    }
                        }
            }
	function get_revisions(page,rev){
            revisionListDict['titles'] = page;
            revisionListDict['rvlimit'] = rev;
	    $.getJSON(baseUrl,revisionListDict,
	      function(data){
		//console.log(data);
		result_key = Object.keys(data.query.pages);
		list_of_revisions=data.query.pages[result_key].revisions;
		//console.log(list_of_revisions)
                page_title = data.query.pages[result_key].title;
		start_rev = list_of_revisions.shift().revid;
                revision_info = list_of_revisions[0];
                end_rev = revision_info.revid;
		list_of_revisions.shift();
		wiki_diff();
                
		});
    }
	function wiki_diff(){
	    //getting list of revisions
            rev_info = new Object();
            rev_info.title = page_title;
            rev_info.revid = revision_info.revid
            rev_info.user = revision_info.user;
            rev_info.timestamp = revision_info.timestamp.slice(0,10);
            if (revision_info.hasOwnProperty('anon')){rev_info.anon = 'anon';}
            if (revision_info.hasOwnProperty('minor')){rev_info.minor = 'minor';}
            //rev_info.size = revision_info.size;
            info_box(rev_info);
            console.log(rev_info);
            compareRevisionDict['revids'] = start_rev;
            $.getJSON(baseUrl,compareRevisionDict,
				  function(data_1){
					result_key_1 = Object.keys(data_1.query.pages);
					data_rev_1 = data_1.query.pages[result_key_1].revisions[0]['*'];
                                        compareRevisionDict['revids'] = end_rev;
					$.getJSON(baseUrl,compareRevisionDict,
					function(data_2){
					      result_key_2 = Object.keys(data_2.query.pages);
					      data_rev_2 = data_2.query.pages[result_key_2].revisions[0]['*'];
					      //html diff
					      modified_html = diff(data_rev_1,data_rev_2);
					      console.log(modified_html);
					      //show the modifictaions by scrolling into view
					      $('#wikiBody').html(modified_html);
					      modify_list = $.makeArray($('del,ins'));
					      animateDiff();
                                               });
					});
		}
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
