	
	require.config({
	    paths: {
		'jQuery': 'jquery-2.0.2.min',
		'diff':'diff',
		'mediawiki':'mediawiki',
	    },
	    shim: {
		'jQuery': {
		    exports: '$'
		},
		'diff':{
		    exports: 'diff'
		},
		'mediawiki':{
		    exports: 'mediawiki'
		}
	    }
	});
	require(['InstaView','jQuery','mediawiki','diff'], function(instaview,$){
	    
	    //Attaching Event to get the list of revisions
	    $('#page_button').click(function(){
	        //e.preventDefault();
		page = $('#page_name').val();
		get_revisions(page);
	    });
	
	function modify_string(wiki_string,edit_dict){
	    var modified_wiki_string_position=0;
	    var position_weight = 0;
	    var i=0;
	    for (i;i<edit_dict.length;i++){
		edit = edit_dict[i];
		var position = edit['position']
		var length = edit['length']
		var string = edit['string']
		true_position = position + position_weight;
		//console.log(true_position);
		if (edit['mode']=='d'){
		    if(edit_dict[i+1] && edit_dict[i+1]['pair']){
			var modify ='';
		    }
		    else{
			var modify ="<span class='modify'></span>";
		    }
		    wiki_string = wiki_string.slice(0,true_position)+modify+wiki_string.slice(true_position+length)
		    if(edit_dict[i+1] && edit_dict[i+1]['pair']){
			var delete_length = length;
		    }
		    else{
			position_weight = position_weight - length + modify.length;
		    }
		    console.log('iteration '+i+' '+wiki_string); 
		}
		else{	    
		    if(edit['pair']){
			wiki_string = wiki_string.slice(0,true_position)+"<span class='modify'>"+string+'</span>'+wiki_string.slice(true_position);
			position_weight = position_weight + ( length-delete_length )+ "<span class='modify'></span>".length;
		    }
		    else{
			wiki_string = wiki_string.slice(0,true_position)+"<span class='modify'>"+string+'</span>'+wiki_string.slice(true_position);
			position_weight = position_weight + length + "<span class='modify'></span>".length;
		    }
		console.log('iteration '+i+' '+wiki_string);  
		//console.log('position_weight add: '+position_weight);
		}
	    }
	    return wiki_string;
	}
					      
	//getting list of revisions
    function get_revisions(page){
    $.getJSON('http://en.wikipedia.org/w/api.php?format=json&action=query&prop=revisions&rvlimit=5&rvprop=ids&rvdir=newer&callback=?',{titles:page},
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
	    $.getJSON('http://en.wikipedia.org/w/api.php?format=json&action=query&prop=revisions&rvprop=content&rvexpandtemplates&callback=?',{'revids':start_rev},
				  function(data_1){
					result_key_1 = Object.keys(data_1.query.pages);
					data_rev_1 = data_1.query.pages[result_key_1].revisions[0]['*'];
					
					//console.log(data_1)
					$.getJSON('http://en.wikipedia.org/w/api.php?format=json&action=query&prop=revisions&rvprop=content&rvexpandtemplates&callback=?',{'revids':end_rev},
					function(data_2){
					      result_key_2 = Object.keys(data_2.query.pages);
					      data_rev_2 = data_2.query.pages[result_key_2].revisions[0]['*'];
					      //console.log(data_2)
					      //console.log(window.schnark_diff.diff(data_rev_1,data_rev_2));
					      rev_diffs = window.schnark_diff.diff(data_rev_1,data_rev_2);
					      element_index = 0;
					      element_index_list=[];
					      element_index_wiki_string = 0;
					      element_index_list_wiki_string=[];
					      data_wiki_string = data_rev_1;
					      rev_diffs.forEach(function(element,index){
						      
						      if(element[1]=='='){
							  element_index =  data_rev_1.indexOf(element[0],element_index);
							  element_length = element[0].length;
							  element_index = element_index + element_length;
							  //console.log('Element Index :'+element_index)
							  flag_minus = 0;
							  //Code with wiki string
							  element_index_wiki_string =  data_wiki_string.indexOf(element[0],element_index_wiki_string)
							  element_length_wiki_string = element[0].length;
							  element_index_wiki_string = element_index_wiki_string + element_length_wiki_string;
						      }
						     if(element[1]=='-'){
      
							  edit_dict={'position':element_index,'mode':'d'}
							  element_index_list.push(edit_dict);
							  edit_dict_wiki_string = {'position':element_index_wiki_string,'mode':'d','string':element[0],'length':element[0].length}
							  element_index_list_wiki_string.push(edit_dict_wiki_string);
							  flag_minus = 1;
						      }
						      if(element[1]=='+' || element=='.'){
							//  data_rev_1=data_rev_1.slice(0,element_index)+'<add data-added='+element[0]+'/>'+data_rev_1.slice(element_index)
							  edit_dict_wiki_string = {'position':element_index_wiki_string,'mode':'a','string':element[0],'length':element[0].length}
							  if(!flag_minus){
							//      edit_dict={'position':element_index,'mode':'a'};
							//      element_index_list.push(edit_dict);
							  }
							  else{
							      edit_dict_wiki_string['pair']=true;
							  }
							  element_index_list_wiki_string.push(edit_dict_wiki_string);
						      }
					      });
					      console.log(data_wiki_string,data_rev_1);
					      mod_dat = modify_string(data_wiki_string,element_index_list_wiki_string);
					      console.log(' mod data : '+mod_dat);
					      
					      console.log(instaview.convert(mod_dat));
					      $('#wiki_body').html(instaview.convert(mod_dat));
					      
					      if(list_of_revisions.length>0){
						    start_rev = end_rev
						    end_rev = list_of_revisions.shift().revid
						    wiki_diff();
						}
					       
					});
					//console.log('list_of_revisions : '+list_of_revisions.length)
			    
					  
				  });
	    
	        
			    
			  
		}
	});
