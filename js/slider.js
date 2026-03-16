    function wikiSlider(options){

	    var postDict ={
		        rvdir:'older',
		        format:'json',
		        action:'query',
		        prop:'revisions',
				titles:'',
		        rvprop:'user|timestamp|flags|ids|size',
		        rvlimit:'max',
		        rawcontinue:''
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
		var peg = null,pegScale = null,pegHandle,pegHandleContainer;
		var toolTipDiv, svg, svgBox, svgEnlargedBox;
		var primaryContainer, primaryGraph, secondaryContainer, secondaryGraph, newGraph;
		var outerLength = 25, enlargedLength = 65;
		var endLine, startDate, endDate;
		var progressBar,progressBarWidth = 5;
		var bars;
		var timeFormat = "%Y-%m-%dT%H:%M:%SZ";
        var timeParse = d3.time.format(timeFormat);

        /* Selected Edits*/
		this.selectedEdits = [];
		this.pegMoved = true;
		var that = this;

		var outerScrollDateUpdate = function (){
    		var barGraphBarGap = 1;
    		var outerWidth = $('#outer').width();
    		var outerViewportHidden = $('#outer').eq(0).scrollLeft();
    		var outerViewportStart = outerViewportHidden/(that.barGraphBarwidth + barGraphBarGap);
    		var outerViewportEnd = (outerViewportHidden + outerWidth)/(that.barGraphBarwidth + barGraphBarGap);
    		var outerViewportShown =  completeRevData.slice(outerViewportStart,outerViewportEnd);
    		$('#outerEndDate').html(timeParse.parse(outerViewportShown[0].timestamp).toDateString().slice(4));
    		$('#outerStartDate').html(timeParse.parse(outerViewportShown[outerViewportShown.length -1].timestamp).toDateString().slice(4));
    		console.log('outer scroll');
    	};

		this.init = function(){
			/*Enlarged view toggle*/
        	d3.select('.enlargedButton').on('click',function(){
	            if (d3.select('#enlarged').style('height').split('px')[0] > 20){
	                d3.select('#enlarged').style({'height':'15px','top':'145px'}).select('svg').style('display','none');
	                d3.select(this).classed('up',false);
	                d3.select(this).classed('down',true);
	            }
	            else{
	                d3.select('#enlarged').style({'height':enlargedLength*2+'px', top:0+'px'}).select('svg').style('display','block');
	                d3.select(this).classed('down',false);
	                d3.select(this).classed('up',true);
	            }
	            });

        	/* tooltip div */
        	tooltipDiv = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);


        	svg = d3.select('#outer').append('svg').attr({'height':outerLength*2,'width':600});
            svgBox = svg.append('g').attr({'transform':'translate(0,0)'});
            svgEnlarged = d3.select('#enlarged').append('svg').attr({'height':enlargedLength*2,'width':450});
            /*Baseline in enlarged graph*/
        	d3.select('#enlarged svg').append('line').attr({'x1':0,'x2':450,
        													'y1':enlargedLength+progressBarWidth/2,'y2':enlargedLength+progressBarWidth/2,
        													'stroke':'#d0eeed',
        													'stroke-width':progressBarWidth});
        	progressBar =  d3.select('#enlarged svg').append('line').attr({'x1':0,'x2':450,
        													'y1':enlargedLength+progressBarWidth/2,'y2':enlargedLength+progressBarWidth/2,
        													'stroke':'#1ebce2',
        													'stroke-width':0});

			d3.select('#enlarged svg').append('line').attr({'x1':0,'x2':0,
															'y1':10,'y2':enlargedLength+progressBarWidth/2,
															'stroke':'gray',
															'stroke-width':'.5'});
			endLine = d3.select('#enlarged svg').append('line').attr({'x1':450,'x2':450,
																	'y1':10,'y2':enlargedLength+progressBarWidth/2,
																	'stroke':'gray',
																	'stroke-width':'.5'});
			svgEnlargedBox = svgEnlarged.append('g').attr('transform','translate(0,0)');

	        primaryContainer = svgBox.append('g').attr('id','primaryContainer');
	        primaryGraph = primaryContainer.append('g').attr('id','primaryGraph');
	        //Commenting out Edit size
	        //primaryContainer.append('text').text('Edit Size').attr({'x':10,'y':10,'class':'legendText'});
	        secondaryContainer = svgEnlargedBox.append('g').attr({'id':'secondaryContainer'});
	        secondaryGraph = secondaryContainer.append('g').attr('id','secondaryGraph');


        	startDate = secondaryContainer.append('text').attr({'x':0,'y':15}).style('font-size',9);
			endDate = secondaryContainer.append('text').attr({'x':450,'y':15}).style('font-size',9);
			$('#outer').scroll(outerScrollDateUpdate);

			/* Calling it direcly with getData by the user*/
        	//this.getData();

		};
		this.getData = function(title){
			if(title){
				postDict['titles'] = title;
			}
			if (gettingDataFlag && rvContinueHash){
				//console.log('postDict',postDict);
        		$.getJSON(utility.apiUrl,postDict,function(data){
            		if ('query-continue' in data){
                    	rvContinueHash = data['query-continue'].revisions.rvcontinue;
                    	postDict['rvcontinue'] = rvContinueHash;
                	}
            		else{
                    	rvContinueHash = null;
            		}
	            console.log(rvContinueHash);
	            if (!rvContinueHash) $('#olderEditsInfo').hide();
	            var resultKey = Object.keys(data.query.pages);
	            var revData = data.query.pages[resultKey].revisions;
	            completeRevData = completeRevData.concat(revData);
	            parsedData = that.parseData(completeRevData);
	            that.fixScales();
	            that.addData(primaryGraph,completeRevData,yscale);
	            that.callBrush();
	            gettingDataFlag = true;
	            $('#outer').scroll();
        		}).error(function() {
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
		        rawcontinue:''
	    	};
		};
		//Cleanup big time
		/** To highlight the revision currently being animated **/
		this.modifySecondryGraph = function(field,value) {
			newGraph.filter(function(d){
				if(d[field] == value){
					progressBar.attr('x1',d.lastX);
					pegHandleContainer.transition().duration(750).call(peg.extent([d.lastX, d.lastX])).call(peg.event);
					return true;
				}
			});
		};
		//Cleanup big time
		/** To get the list of revisions selected in the slider **/
		this.getSelection = function () {
			var brushExtent = brush.extent();
			var start = Math.floor(brushExtent[0]/(that.barGraphBarwidth+1));
			var end = Math.ceil(brushExtent[1]/(that.barGraphBarwidth+1));
			return completeRevData.slice(start,end);
		};
		this.getSecondrySliderSelection = function (i){
			return i ? that.getSelection().slice(0,i+1).reverse():that.getSelection().reverse();
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
        		data.svgWidth = data.length*(that.barGraphBarwidth+1) < 100 ? 100 : data.length*(that.barGraphBarwidth+1);
        		data.yscale = [0,d3.max(data, function(d) { return d.editSize; })];

   		};

   		this.fixScales = function (){
	        if(xscale == null){
				yscale = d3.scale.pow().exponent(.4).domain([0,d3.max(completeRevData, function(d) { return d.editSize; })])
													.range([1,outerLength]);
				yscale2 = d3.scale.pow().exponent(.4).domain([0,d3.max(completeRevData, function(d) { return d.editSize; })])
													.range([3,enlargedLength]);
				xscale = d3.scale.linear().domain([0,completeRevData.svgWidth]).range([0,completeRevData.svgWidth]);
				//cleanup pegscale
				pegScale = d3.scale.linear().domain([0,completeRevData.svgWidth]).range([0,completeRevData.svgWidth]);
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
                        'x':function(d,i){ return i * that.barGraphBarwidth + i; },
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
		            brush = d3.svg.brush().x(xscale).extent([0, 70]).on("brush", brushmove);
		            var brushg = svgBox.append("g").attr("class", "brush")
		                                    .attr("id","primaryBrush")
		                                    .call(brush);
		            brushg.selectAll("rect").attr("height", 100)
		                                    .attr("y",0);
		            //Cleanup
		            brushg.selectAll(".resize rect").attr("width",2).attr("x",-2);
		            //remove it from here
		            $('#outer').scroll();
		            //Fix it
		            //brushmove();
			}
			temp();
			cleanupProgressBar();
		};
		this.callPeg = function(){
			if (peg != null){
		        peg.x(pegScale);
		        d3.select('#peg').call(peg);
			}
			else{
		            peg = d3.svg.brush().x(pegScale).extent([0,0]).on("brush", pegMove);
		            pegHandleContainer = svgEnlargedBox.append("g")
		                                    .attr("id","peg")
		                                    .call(peg);

		            pegHandleContainer.selectAll(".extent,.resize").remove();

					pegHandleContainer.select(".background")
					    .attr("height", enlargedLength * 2);

					/* Peg */

					pegHandle = pegHandleContainer.append("g");
					pegHandle.append("rect")
					    .attr("class", "peg")
					    .attr("height",enlargedLength * 2)
					    .attr("width",2)
					    .attr("y", 0);
					pegHandle.append("rect")
					    .attr("class", "peg")
					    .attr("height",5)
					    .attr("width",10)
					    .attr("y", 0)
						.attr("x",-4);
		         }
		    var lastEditX = 0;
		    newGraph.filter(function(d){
		    	lastEditX = d.lastX;
		    });
			pegHandleContainer.call(peg.event)
								.transition() // gratuitous intro!
    							.duration(750)
    							.call(peg.extent([lastEditX,lastEditX]))
    							.call(peg.event);
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
	        var slid_s = d3.event.target.extent();
	        if(slid_s[1] - slid_s[0] < 100){

		        /* the secondary slider */
		        temp();

		        if (brushExtent[1]> completeRevData.length*(that.barGraphBarwidth + 1) - 50){
		       		userNotification('load');
		       		that.getData();
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
    	this.refreshProgressBar = function (d){
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

    	/* --- Cluster Gap Layout --- */
    	// Toggle: 'pill' (Option A) or 'lollipop' (Option C)
    	var GUTTER_STYLE = 'pill';
    	var CLUSTER_GAP_THRESHOLD = 3; // days — edits within this gap are clustered together
    	var GUTTER_WIDTH = GUTTER_STYLE === 'pill' ? 38 : 22;
    	var PIP_RADIUS = 5; // radius for lollipop dot
    	var BAR_SPACING = 3; // px gap between bars within a cluster
    	var DETAIL_PADDING = 8; // px padding at start of detail view

    	function getGutterFill(days) {
    		if (days <= 7)   return '#e8e8e8';                   // light gray — days
    		if (days <= 30)  return '#fce8d0';                   // pale peach — weeks
    		if (days <= 180) return '#fddcb5';                   // light apricot — months
    		return '#fcd0c0';                                    // pale salmon — half year+
    	}
    	function getGutterTextColor(days) {
    		if (days <= 7)   return '#999';                      // medium gray — days
    		if (days <= 30)  return '#b07830';                   // warm brown — weeks
    		if (days <= 180) return '#a05a20';                   // dark amber — months
    		return '#904030';                                    // muted brick — half year+
    	}

    	function formatGapLabel(days) {
    		if (days < 7)   return days + 'd';
    		if (days < 30)  return Math.round(days / 7) + 'w';
    		if (days < 365) return Math.round(days / 30) + 'mo';
    		var y = Math.floor(days / 365);
    		var m = Math.round((days % 365) / 30);
    		return m > 0 ? y + 'y ' + m + 'mo' : y + 'y';
    	}

    	function buildClusters(data) {
    		var clusters = [];
    		var current = { edits: [data[0]], gapAfter: 0 };
    		for (var i = 1; i < data.length; i++) {
    			if (data[i].timeDiff >= CLUSTER_GAP_THRESHOLD) {
    				current.gapAfter = data[i].timeDiff;
    				clusters.push(current);
    				current = { edits: [data[i]], gapAfter: 0 };
    			} else {
    				current.edits.push(data[i]);
    			}
    		}
    		clusters.push(current);
    		return clusters;
    	}

    	function temp() {
    		var brushExtent = brush.extent();
    		var new_graph = completeRevData.slice(
    			Math.floor(brushExtent[0] / (that.barGraphBarwidth + 1)),
    			Math.ceil(brushExtent[1] / (that.barGraphBarwidth + 1))
    		);
    		if (new_graph.length) {
    			var lastX = 0;

    			// Remove old gutter elements from previous render
    			secondaryContainer.selectAll('.gutter-pip').remove();
    			secondaryContainer.selectAll('.gutter-label').remove();

    			// Build clusters from selected data
    			var clusters = buildClusters(new_graph);

    			// Layout: uniform bar spacing within clusters, fixed gutter between clusters
    			var xPos = DETAIL_PADDING;
    			for (var c = 0; c < clusters.length; c++) {
    				var edits = clusters[c].edits;
    				for (var e = 0; e < edits.length; e++) {
    					edits[e].lastX = xPos;
    					xPos += that.enlargedBarGraphBarwidth + BAR_SPACING;
    				}
    				// Insert gutter space after this cluster (except the last one)
    				if (c < clusters.length - 1 && clusters[c].gapAfter > 0) {
    					clusters[c].gutterX = xPos;
    					clusters[c].gutterDays = clusters[c].gapAfter;
    					xPos += GUTTER_WIDTH;
    				}
    			}
    			lastX = xPos - 1;

    			// Binddata and render edit bars
    			newGraph = secondaryGraph.selectAll("rect").data(new_graph);
    			newGraph.enter().append("rect");
    			newGraph
    				.attr("x", function(d) { return d.lastX; })
    				.attr("y", function(d) {
    					return d.dir == 'p' ? enlargedLength - yscale2(d.editSize) : enlargedLength + progressBarWidth;
    				})
    				.attr("width", that.enlargedBarGraphBarwidth)
    				.attr("height", function(d) { return yscale2(d.editSize); })
    				.attr("class", function(d) { return d.dir == 'p' ? 'pointer blue' : 'pointer red'; })
    				.attr("timeDiff", function(d) { return d.timeDiff; })
    				.attr("data-title", function(d) { return d.user; })
    				.attr("number", function(d, i) { return i; });

    			newGraph.exit().remove();

    			// Draw gap markers between clusters
    			var baselineY = enlargedLength + progressBarWidth / 2;
    			for (var c = 0; c < clusters.length - 1; c++) {
    				if (clusters[c].gutterDays > 0) {
    					var gx = clusters[c].gutterX;
    					var gDays = clusters[c].gutterDays;
    					var cx = gx + GUTTER_WIDTH / 2;
    					var label = formatGapLabel(gDays);
    					var color = getGutterFill(gDays);
    					var textColor = getGutterTextColor(gDays);

    					if (GUTTER_STYLE === 'pill') {
    						// Option A: Pill badge — rounded rect with text inside
    						var pillW = Math.max(label.length * 6 + 8, 22);
    						var pillH = 15;
    						var pillX = cx - pillW / 2;
    						var pillY = baselineY - pillH / 2;

    						secondaryContainer.append('rect')
    							.attr('class', 'gutter-pip')
    							.attr('x', pillX)
    							.attr('y', pillY)
    							.attr('width', pillW)
    							.attr('height', pillH)
    							.attr('rx', 7)
    							.attr('ry', 7)
    							.style('fill', color)
    							.style('stroke', 'none');

    						secondaryContainer.append('text')
    							.attr('class', 'gutter-label')
    							.attr('x', cx)
    							.attr('y', baselineY + 4)
    							.attr('text-anchor', 'middle')
    							.style('font-size', '8px')
    							.style('fill', textColor)
    							.text(label);

    					} else {
    						// Option C: Lollipop — dot with label beside it
    						secondaryContainer.append('circle')
    							.attr('class', 'gutter-pip')
    							.attr('cx', cx)
    							.attr('cy', baselineY)
    							.attr('r', PIP_RADIUS)
    							.style('fill', getGutterFill(gDays))
    							.style('stroke', getGutterTextColor(gDays))
    							.style('stroke-width', 1);

    						secondaryContainer.append('text')
    							.attr('class', 'gutter-label')
    							.attr('x', cx + PIP_RADIUS + 2)
    							.attr('y', baselineY + 3)
    							.attr('text-anchor', 'start')
    							.style('font-size', '8px')
    							.style('fill', getGutterTextColor(gDays))
    							.text(label);
    					}
    				}
    			}

    			cleanupHighlightSelectedEdit(newGraph, 'user', hoverUser, '#929396', 1);
    			highlightSelectedEdit(newGraph, 'user', hoverUser, 'gold');
    			startDate.text(timeParse.parse(new_graph[0].timestamp).toDateString().slice(4));
    			endDate.text(timeParse.parse(new_graph[new_graph.length - 1].timestamp).toDateString().slice(4)).attr({'x': lastX - 47});
    			enlargedBarGraphSvgWidth = lastX + that.enlargedBarGraphBarwidth;
    			that.fixWidth(enlargedBarGraphSvgWidth);
    			pegScale.domain([0, enlargedBarGraphSvgWidth]).range([0, enlargedBarGraphSvgWidth]);
    			that.callPeg();
    		}
    	}

    	var pegMove = function(){
			console.log('Peg moved');
			var relaxedSelectedBar;
			var value = peg.extent()[0];
			  if (d3.event.sourceEvent) { // not a programmatic event
			    value = pegScale.invert(d3.mouse(this)[0]);
			    peg.extent([value, value]);
			    that.pegMoved = true;

			     //Pausing if the player is playing
			  if (that.primarySliderCallback){
				that.primarySliderCallback();
				cleanupProgressBar();
				}

			  }
				selectedBar = newGraph.filter(function(d,i){
					if (d.lastX < value && value < d.lastX + that.enlargedBarGraphBarwidth){
							cleanupHighlightSelectedEdit(bars,'user',hoverUser,'gray',0);
							cleanupHighlightSelectedEdit(newGraph,'user',hoverUser,'#929396',0);
						    hoverUser = d.user;
							highlightSelectedEdit(bars,'user',hoverUser,'gold');
							highlightSelectedEdit(newGraph,'user',hoverUser,'gold');

							var revInfo = {
								'revid': d.revid,
								'user': d.user,
								'timestamp': d.timestamp.slice(0,10),
								'minor': d.minor ? 'M' : null
							};
							infoBox(revInfo);
					}
					if (d.lastX < value){
						relaxedSelectedBar = i;
					}
					return d.lastX < value && value < d.lastX + that.enlargedBarGraphBarwidth;
				});

				//Getting the selected edits
				that.selectedEdits = that.getSecondrySliderSelection(relaxedSelectedBar);


				console.log(selectedBar);
			  pegHandle.attr("transform","translate("+pegScale(value)+")");
			     	};
    	return this;
    }
