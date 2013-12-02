    function wikiSlider(options){
    	
		var url = 'https://en.wikipedia.org/w/api.php?callback=?';
	    var postDict ={
		        rvdir:'older',
		        format:'json',
		        action:'query',
		        prop:'revisions',
				titles:'',
		        rvprop:'user|timestamp|flags|ids|size',
		        rvlimit:'max',
	    	};
		
		this.height = options.height;
        this.barGraphBarwidth = options.barGraphBarwidth;
        this.enlargedBarGraphBarwidth = options.enlargedBarGraphBarwidth;
		
		/* Callbacks for the Primary & Secondry slider*/
		this.primarySliderCallback = null ;
		this.secondrySliderCallback = null;
		if (options.primarySliderMoveCallback && typeof(options.primarySliderMoveCallback) === 'function'){
			this.primarySliderCallback = options.primarySliderMoveCallback;
		}
		
		if (options.secondrySliderMoveCallback && typeof(options.secondrySliderMoveCallback) === 'function'){
			this.secondrySliderCallback = options.secondrySliderMoveCallback;
		}
		
		/* Used Variables */
		var svgWidth  = 0;
		var hoverUser = '';
		var completeRevData = [], secondrySliderSelection = [];
		var rvContinueHash = true,gettingDataFlag = true;
		var yscale = null, yscale2 = null, xscale = null;
		var brush = null;
		var toolTipDiv, svg, svgBox, svgEnlargedBox;
		var primaryContainer, primaryGraph, secondaryContainer, secondaryGraph, newGraph;
		var outerLength = 50, enlargedLength = 80;
		var endLine, startDate, endDate;
		var progressBar,progressBarWidth = 4;
		var bars;
		var timeFormat = "%Y-%m-%dT%H:%M:%SZ";
        var timeParse = d3.time.format(timeFormat);
		var that = this;
		this.init = function(){
			/*Enlarged view toggle*/
        	d3.select('.enlargedButton').on('click',function(){
	            if (d3.select('#enlarged').style('height').split('px')[0] > 20){
	                d3.select('#enlarged').style({'height':'15px','top':'145px'}).select('svg').style('display','none');
	                d3.select(this).text('^');
	            }
	            else{
	                d3.select('#enlarged').style({'height':enlargedLength*2+'px', top:0+'px'}).select('svg').style('display','block');
	                d3.select(this).text('v');
	            }
	            });
        
        	/* tooltip div */
        	tooltipDiv = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);
        	
        	
        	svg = d3.select('#outer').append('svg').attr({'height':100,'width':600});
            svgBox = svg.append('g').attr({'transform':'translate(0,0)'});
            svgEnlargedBox = d3.select('#enlarged').append('svg').attr({'height':enlargedLength*2,'width':450})
                                            .append('g').attr('transform','translate(0,0)');
        
	        primaryContainer = svgBox.append('g').attr('id','primaryContainer');
	        primaryGraph = primaryContainer.append('g').attr('id','primaryGraph');
	        primaryContainer.append('text').text('Edit Size').attr({'x':10,'y':10,'class':'legendText'});
	        secondaryContainer = svgEnlargedBox.append('g').attr({'id':'secondaryContainer'});
	        secondaryGraph = secondaryContainer.append('g').attr('id','secondaryGraph');
	        
        	/*Baseline in enlarged graph*/
        	d3.select('#enlarged svg').append('line').attr({'x1':0,'x2':450,
        													'y1':enlargedLength+progressBarWidth/2,'y2':enlargedLength+progressBarWidth/2,
        													'stroke':'white',
        													'stroke-width':progressBarWidth});
        	progressBar =  d3.select('#enlarged svg').append('line').attr({'x1':0,'x2':450,
        													'y1':enlargedLength+progressBarWidth/2,'y2':enlargedLength+progressBarWidth/2,
        													'stroke':'blue',
        													'stroke-width':0});
			d3.select('#enlarged svg').append('line').attr({'x1':0,'x2':0,
															'y1':enlargedLength+progressBarWidth/2,'y2':enlargedLength*2-10,
															'stroke':'gray',
															'stroke-width':'.5'});
			endLine = d3.select('#enlarged svg').append('line').attr({'x1':450,'x2':450,
																	'y1':enlargedLength+progressBarWidth/2,'y2':enlargedLength*2-10,
																	'stroke':'gray',
																	'stroke-width':'.5'});
        	startDate = secondaryContainer.append('text').attr({'x':0,'y':enlargedLength*2-10}).style('font-size',9);
			endDate = secondaryContainer.append('text').attr({'x':450,'y':enlargedLength*2-10}).style('font-size',9);
			
			/* Calling it direcly with getData by the user*/
        	//this.getData();
        	
		};
		this.getData = function(title){
			if(title){
				postDict['titles'] = title;
			}
			if (gettingDataFlag && rvContinueHash){
				//console.log('postDict',postDict);
        		$.getJSON(url,postDict,function(data){
            		if ('query-continue' in data){
                    	rvContinueHash = data['query-continue'].revisions.rvcontinue;
                    	postDict['rvcontinue'] = rvContinueHash;
                	}
            		else{
                    	rvContinueHash = null;
            		}
	            console.log(rvContinueHash);
	            var resultKey = Object.keys(data.query.pages);
	            var revData = data.query.pages[resultKey].revisions;
	            completeRevData = completeRevData.concat(revData);
	            parsedData = that.parseData(completeRevData);
	            that.fixScales();
	            that.addData(primaryGraph,completeRevData,yscale);
	            that.callBrush();
	            gettingDataFlag = true;
        		});
        		gettingDataFlag = false;
        	}	
        	else{
            	return;
        	}	
		};
		
		this.cleanUp = function () {
			  completeRevData = [];
			  rvContinueHash = true;
			  postDict ={
		        rvdir:'older',
		        format:'json',
		        action:'query',
		        prop:'revisions',
				titles:'',
		        rvprop:'user|timestamp|flags|ids|size',
		        rvlimit:'max',
	    	};
		};
		//Cleanup big time
		/** To highlight the revision currently being animated **/
		this.modifySecondryGraph = function(field,value,color) {
			newGraph.filter(function(d){
				if(d[field] == value){
					progressBar.attr('x1',d.lastX);
					return true;
				}
			});
		};
		//Cleanup big time
		/** To get the list of revisions selected in the slider **/
		this.getSelection = function () {
			var brushExtent = brush.extent();
			var start = Math.floor(brushExtent[0]/that.barGraphBarwidth);
			var end = Math.ceil(brushExtent[1]/that.barGraphBarwidth);
			return completeRevData.slice(start,end);
		};
		this.getSecondrySliderSelection = function (i){
			return i ? that.getSelection().slice(0,i+1).reverse():that.getSelection().reverse();
		};
		this.wikiNameSpace = function (language) {
	  		usingLanguageNamespace = language;
	  		baseUrl = 'https://'+language+'.wikipedia.org/w/api.php?callback=?';
		};
	
		this.parseData = function(data){
	        data.forEach(function(d,i,array){
	                if(array[i+1]){
	                    d.editSize = d.size - array[i+1].size;
	                    //Edit direction positive or negative
	                    if (d.editSize >= 0){
	                        d.dir = 'p';
	                    }
	                    else{
	                       d.dir = 'n';
	                       d.editSize = d.editSize * -1;
	                    }
	                    if (i == 0 ){
	                        d.timeDiff = 0;
	                    }
	                    else{
	                        d.timeDiff = Math.floor((timeParse.parse(array[i-1].timestamp) - timeParse.parse(d.timestamp) ) /86400000);
	                    }
	                }
	                else{
	                    d.editSize = null;
	                    d.timeDiff = 0;
	                }
	                //console.log(d.editSize);
	            if (d.parentid == 0){
	                d.editSize = d.size;
	                d.timeDiff = 0;
	                d.dir = 'p';
	            }
	            if ('minor' in d){
	                d.minor = true;
	            }
	            else{
	                d.minor = false;
	            }
	            d.date = timeParse.parse(d.timestamp);
	            });
        		data.svgWidth = data.length*that.barGraphBarwidth < 100 ? 100 : data.length*that.barGraphBarwidth;
        		data.yscale = [0,d3.max(data, function(d) { return d.editSize; })];
        		
   		};
   		
   		this.fixScales = function (){
	        if(xscale == null){
				yscale = d3.scale.pow().exponent(.4).domain([0,d3.max(completeRevData, function(d) { return d.editSize; })])
													.range([2,outerLength]);
				yscale2 = d3.scale.pow().exponent(.4).domain([0,d3.max(completeRevData, function(d) { return d.editSize; })])
													.range([2,enlargedLength]);
				xscale = d3.scale.linear().domain([0,completeRevData.svgWidth]).range([0,completeRevData.svgWidth]);
				diffscale = d3.scale.linear().domain([0,d3.max(completeRevData, function(d) { return d.timeDiff; })]).range([0,10]);
			}
	        else{
				yscale.domain([0,d3.max(completeRevData, function(d) { return d.editSize; })]);
				yscale2.domain([0,d3.max(completeRevData, function(d) { return d.editSize; })]);
				xscale.domain([0,completeRevData.svgWidth]).range([0,completeRevData.svgWidth]);
				diffscale.domain([0,d3.max(completeRevData, function(d) { return d.timeDiff; })]);
	        }
	        svg.attr('width',completeRevData.svgWidth);
    	};
    	
    	this.addData = function (rect,data,yscale){
	        bars = rect.selectAll('rect').data(data);
	        bars.enter().append("rect");
	        bars.attr({
                        'x':function(d,i){ return i * that.barGraphBarwidth; },
                        'y':function(d,i){ return d.dir == 'p' ? outerLength - yscale(d.editSize) : outerLength; },
                        'width':that.barGraphBarwidth,
                        'height':function(d,i){ return yscale(d.editSize); },
                        'class':function(d,i){ return d.dir == 'p' ? 'blue':'red'; },
                        'timestamp':function(d){ return d.timestamp; }
                        });
	        bars.exit().remove();
    	};
    	
    	this.callBrush = function (){
	        if (brush != null){
		        brush.x(xscale);
		        d3.select('#primaryBrush').call(brush);
			}
			else{
		            brush = d3.svg.brush().x(xscale).extent([10, 50]).on("brush", brushmove);
		            var brushg = svgBox.append("g").attr("class", "brush")
		                                    .attr("id","primaryBrush")
		                                    .call(brush);
		            brushg.selectAll("rect").attr("height", 100)
		                                    .attr("y",0);
		            //Fix it
		            //brushmove();
		            temp();
			}
		};
		this.handleScroll = function (){
        	//d3.select('#outer').transition().property('scrollLeft',brush.extent()[0]);
         	$('#outer').scrollLeft(brush.extent()[0]);
   		};
   		this.fixWidth = function (width){
			d3.select('#enlarged svg').style('width',width).select('line').attr('x2',width);
			endLine.attr({'x1':width,'x2':width});
    	};
		function brushmove(){
	        var brushExtent = brush.extent();
	        slid_s = d3.event.target.extent();
	        if(slid_s[1] - slid_s[0] < 100){
	        
		        /* the secondary slider */
		        temp();
		       
		        if (brushExtent[1]> completeRevData.length*that.barGraphBarwidth - 50){
		         //   that.getData();
		        }
	        }
	        else{
	            d3.event.target.extent([slid_s[0],slid_s[0]+95]); d3.event.target(d3.select(this));
	        }
	        /*Calling Primary Slider callback*/
	       	cleanupProgressBar();
			if (that.primarySliderCallback){
				that.primarySliderCallback();
			}
    	}
    	function cleanupProgressBar(){
    		progressBar.attr('stroke-width',0);
    	};
    	function refreshProgressBar(d){
    		progressBar.attr({'stroke-width':progressBarWidth,
    						'x1':d.lastX,
    						'x2':d.lastX+progressBarWidth
    						});	
    	};
    	function highlightSelectedEdit(graph,field,id,color){
    		graph.filter(function(d){
    			return d[field] == id;
				}).style({'fill':color});
    	};
    	function cleanupHighlightSelectedEdit(graph,field,id,color,type){
    		graph.filter(function(d){
    			return type ? !(d[field] == id) : d[field] == id;
				}).style({'fill':color});
    	};
    	function temp(){
    			var brushExtent = brush.extent();
	    		 	var new_graph = completeRevData.slice(Math.floor(brushExtent[0]/that.barGraphBarwidth),Math.ceil(brushExtent[1]/that.barGraphBarwidth) );
	    		 	if (new_graph.length){
				        var diffScaleAbs = 0;
						var lastX = 0;
				        //console.log(brushExtent);
				        newGraph = secondaryGraph.selectAll("rect").data(new_graph);
				        newGraph.enter().append("rect");
				        newGraph.attr("x",function(d,i){
				            diffScaleAbs += d.timeDiff*3;
					    	lastX = diffScaleAbs +  i*that.enlargedBarGraphBarwidth;
					    	d.lastX = lastX;
					    	return lastX;
						})
				        .attr("y",function(d,i){
							return d.dir == 'p' ? enlargedLength - yscale2(d.editSize) : enlargedLength+progressBarWidth;})
						.attr("width",that.enlargedBarGraphBarwidth)
						.attr("height",function(d){ return yscale2(d.editSize); })
						.attr("class",function(d){ return d.dir=='p'?'pointer blue':'pointer red'; })
						.attr("timeDiff",function(d){ return d.timeDiff; })
						.attr("title",function(d){ return d.user; })
						.attr("number",function(d,i){ return i; })
						.on("mouseover", function(d) {      
							tooltipDiv.transition().duration(200).style("opacity", .9);

							cleanupHighlightSelectedEdit(bars,'user',hoverUser,'gray',0);
							cleanupHighlightSelectedEdit(newGraph,'user',hoverUser,'#b4e2ef',0);
						    hoverUser = d.user;
				            tooltipDiv.html(d.user + "<br/>"  + d.date)  
				                .style("left", (d3.event.pageX + 5) + "px")     
				                .style("top", (d3.event.pageY - 23) + "px");    
				                
							highlightSelectedEdit(bars,'user',hoverUser,'gold');	
							highlightSelectedEdit(newGraph,'user',hoverUser,'gold');
							
						})                      
				        .on("mouseout", function(d) {       
				            tooltipDiv.transition().duration(500).style("opacity", 0);   
				        })
				        .on("click", function(d,i){
				        	cleanupProgressBar();
				        	refreshProgressBar(d);
							if (that.secondrySliderCallback){
								var selectedEdits = that.getSecondrySliderSelection(i);
								that.secondrySliderCallback(selectedEdits,1);
							}
				        });
				                               
						newGraph.exit().remove();
						cleanupHighlightSelectedEdit(newGraph,'user',hoverUser,'#b4e2ef',1);
						highlightSelectedEdit(newGraph,'user',hoverUser,'gold');
						startDate.text(timeParse.parse(new_graph[0].timestamp).toDateString().slice(4));
						endDate.text(timeParse.parse(new_graph[new_graph.length-1].timestamp).toDateString().slice(4)).attr({'x':lastX-50});
						enlargedBarGraphSvgWidth = lastX + that.enlargedBarGraphBarwidth;
						that.fixWidth(enlargedBarGraphSvgWidth);
				}
    	}
    	return this;
    }