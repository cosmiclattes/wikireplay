function htmlDiff() {
	var _htmlHash;
	var _revHtmlHash;
	var _currentHash;
	var _is_debug = false;
	
	function pushHash(tag) {
	  if (typeof(_htmlHash[tag]) == 'undefined') {
	  	var value = eval('"\\u'+_currentHash.toString(16)+'"');
	    _htmlHash[tag] = value;
	    _revHtmlHash[value] = tag;
	    _currentHash++;
	  }
	  return _htmlHash[tag];
	}
	
	this.clearHash = function() {
	  _htmlHash = {};
	  _revHtmlHash = {};
	  _currentHash = 44032; //朝鲜文音节 Hangul Syllables
	};
	function html2plain(html) {
	  html = html.replace(/<(S*?)[^>]*>.*?|<.*?\/>/g, function(tag){
	    //debug:
	    if (_is_debug) {
	      return pushHash(tag.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
	    } else {
	      return pushHash(tag);
	    }
	  });
	  
	  return html;
	}
	function plain2html(plain) {
		var back = '';
		for (i=0;i<plain.length;i++){
			if(_revHtmlHash[plain[i]]){
				back += _revHtmlHash[plain[i]];
			}
			else{
				back += plain[i];
			}
		}
		return back;
	};	
	var dmp = new diff_match_patch();
	this.diff = function(first,second){
		console.time('html2plain');
		var convertedFirst =  html2plain(first);
		var convertedSecond = html2plain(second);
		console.timeEnd('html2plain');
		console.time('toDiff');
		var diffs = dmp.diff_main(convertedFirst,convertedSecond);
		dmp.diff_cleanupSemantic(diffs);
		console.timeEnd('toDiff');
		var modified = '';
		console.time('toModify');
		for (i=0;i<diffs.length;i++){
			var diff = diffs[i];
			if (diff[0]==0){
				modified += diff[1];
			}
			else if (diff[0]==1){
				modified += '<ins id='+i+'>'+diff[1]+'</ins>';
			}
			else {
				modified += '<del id='+i+'>'+diff[1]+'</del>';
			}
		}
		console.timeEnd('toModify');
		console.time('convertBack');
		var complete = plain2html(modified);
		console.timeEnd('convertBack');
		return complete;
	};
}