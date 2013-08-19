$( document ).ready(function() {
	    //Attaching Event to get the list of revisions
	    $('#page_button').click(function(){
	        //e.preventDefault();
		page = $('#page_name').val();
		rev = $('#page_rev').val();
		get_revisions(page,rev);
	    });
});
	function get_revisions(page,rev){
	    $.getJSON('https://en.wikipedia.org/w/api.php?format=json&action=query&prop=revisions&rvprop=ids&rvdir=newer&callback=?',{'titles':page,'rvlimit':rev},
	      function(data){
		//console.log(data);
		result_key = Object.keys(data.query.pages);
		list_of_revisions=data.query.pages[result_key].revisions;
		//console.log(list_of_revisions)
		start_rev = list_of_revisions.shift().revid;
		end_rev = list_of_revisions.shift().revid;
		wiki_diff();
		});
    }
	function wiki_diff(){
	    //getting list of revisions
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
								    end_rev = list_of_revisions.shift().revid;
								    setTimeout(wiki_diff,200);
								}	
							    }
					      },1000);
					      }
                                               });
					});
		}
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
