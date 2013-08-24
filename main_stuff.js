$( document ).ready(function() {
	    //Attaching Event to get the list of revisions
	    $('#page_button').click(function(){
	        //e.preventDefault();
		page = $('#page_name').val();
		rev = $('#page_rev').val();
		get_revisions(page,rev);
	    });
});
            function info_box(rev_info){
                        $('.info_box').html('');
                        for (key in rev_info){            
                                    
                                    if(key == 'revid'){
                                                var url_base = 'http://en.wikipedia.org/w/index.php?oldid='+rev_info[key];
                                                var anchor =$('<a>'+rev_info[key]+'</a>').attr({'target':'_blank','href':url_base});
                                                 $('.info_box').append(anchor);
                                    }
                                    else{
                                                $('.info_box').append('<span>'+rev_info[key]+'</span>');
                                    }
                        }
            }
	function get_revisions(page,rev){
	    $.getJSON('https://en.wikipedia.org/w/api.php?format=json&action=query&prop=revisions&rvprop=ids|user|timestamp|size|flags&rvdir=newer&callback=?',{'titles':page,'rvlimit':rev},
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
            $.getJSON('https://en.wikipedia.org/w/api.php?format=json&action=query&prop=revisions&rvprop=content&rvexpandtemplates&rvparse&callback=?',{'revids':start_rev},
				  function(data_1){
					result_key_1 = Object.keys(data_1.query.pages);
					data_rev_1 = data_1.query.pages[result_key_1].revisions[0]['*'];
					$.getJSON('https://en.wikipedia.org/w/api.php?format=json&action=query&prop=revisions&rvprop=content&rvparse&rvexpandtemplates&callback=?',{'revids':end_rev},
					function(data_2){
					      result_key_2 = Object.keys(data_2.query.pages);
					      data_rev_2 = data_2.query.pages[result_key_2].revisions[0]['*'];
					      //html diff
					      modified_html = diff(data_rev_1,data_rev_2);
					      console.log(modified_html);
					      //show the modifictaions by scrolling into view
					      $('#wiki_body').html(modified_html);
					      modify_list = $.makeArray($('del,ins'));
					      animate_diff();
					      function animate_diff(){
					      setTimeout(function(){
							    if(modify_list.length>0){
								element = modify_list[0];
								console.log(element);
								element.scrollIntoView();
                                                                if ($(element).prop('tagName') == 'DEL'){
                                                                        $(element).fadeOut(500);
                                                                }
                                                                else{
                                                                        $(element).show(500,'linear');
                                                                }
								modify_list.shift();
								animate_diff();
							    }
							    else{
								if(list_of_revisions.length>0){
								    start_rev = end_rev;
								    revision_info = list_of_revisions.shift();
                                                                    end_rev = revision_info.revid;
								    setTimeout(wiki_diff,200);
								}	
							    }
					      },1000);
					      }
                                               });
					});
		}
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
