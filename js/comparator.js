const GITLAB="https://gitlab.com/api/v4/projects/10354484/";
const BRANCH="development";

const Curves = {
	max: 10,//Colors are defined for only 10 curves. I'm not responsible for more curves. Sincerely, Me.
	length: 0,//number of displayed curves
	disponibility: [],//index==id! disponibility[id]=1 => available && disponibility[id]=0 => unavailable
	hidden: [],//1 if hidden else 0
	id: [],
	input: [],//input[nb-curve]= -1:no_curve||0:intern_curve||1:uploaded_curve 
	names: [],//names[id]=name_of_the_curve
	values: [],//where values of the curves are
	referenceColors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'], // Do not modify this tab!!! Use it as a reference
	colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'], // muted blue //safety orange // cooked asparagus green // brick red // muted purple // chestnut brown // raspberry yogurt pink // middle gray // curry yellow-green // blue-teal
	colorsOrder: [], // From 0 to 9
	plots: ["ber","fer"/*,"befe","thr"*/],
	PLOTS: {ber: "BER", fer: "FER"},
	plotOrder: [],
	toolTips: [],
	toolTipsSelected: [],
	selectedCodes: [],
	selectedSizes: [],
	selectedModems: [],
	selectedChannels: [],
	inputCurves: [],
	refs: [],
	initialization() {
		for (let i=0; i<this.max; i++) {
			this.values.push({ber:[],fer:[]});
			this.names.push("curve"+String(i));
			this.id.push(-1);
			this.colorsOrder.push(i);
			this.disponibility.push(1);
			this.plotOrder.push(-1);
			this.input.push(-1);
			this.toolTipsSelected.push("");
			this.hidden.push(0);
		}
	},
	firstSideAvailable() {
		//return the id of the first free curve according to the disponibility tab, 4 if it's full
		if (this.length<this.max) return String(this.colorsOrder[this.length]);
		else return String(this.colorsOrder[this.max-1]);
	},
	firstIndexAvailable() {
		let i=0;
		let result=-1;
		while (i<this.max) {
			if (this.plotOrder[i]==-1) {
				result=i;
				i=this.max;
			}
			else {
				i++;
			}
		}
		return result;
	},
	addInputCurve(a) {
		let i=this.firstSideAvailable();
		this.input[i]=1;
		this.plotOrder[this.firstIndexAvailable()]=Number(this.firstSideAvailable());
		this.id[i]=getId(a);
		this.plots.forEach(x => this.values[i][x]={name: this.PLOTS[x], type: "scatter", x: a.contents["Eb/N0"], y: a.contents[this.PLOTS[x]]});
		if (this.length<this.max) this.length++;
		this.disponibility[i]=0;
		this.hidden[i]=0;
		this.inputCurves.push(a);
	},
	addCurve(a) {
		let i=this.firstSideAvailable();
		this.input[i]=0;
		this.plotOrder[this.firstIndexAvailable()]=Number(this.firstSideAvailable());
		this.id[i]=getId(a);
		this.plots.forEach(x => this.values[i][x]={name: this.PLOTS[x], type: "scatter", x: a.contents["Eb/N0"], y: a.contents[this.PLOTS[x]]});
		if (this.length<this.max) this.length++;
		this.disponibility[i]=0;
		this.hidden[i]=0;
		this.updateAddButton(true, "-", i);
	},
	deleteCurve(nb) {
		if (nb<=this.max) {
			if (this.disponibility[nb]==0) {
				let a=this.plotOrder[this.plotOrder.indexOf(Number(nb))];
				let col=this.colors[this.plotOrder.indexOf(Number(nb))];
				let colIndex=this.colorsOrder[this.plotOrder.indexOf(Number(nb))];
				this.colors.splice(this.plotOrder.indexOf(Number(nb)),1);
				this.referenceColors.splice(this.plotOrder.indexOf(Number(nb)),1);
				this.colorsOrder.splice(this.plotOrder.indexOf(Number(nb)),1);
				this.colors.push(col);
				this.referenceColors.push(col);
				this.colorsOrder.push(colIndex);
				this.input[nb]=-1;
				this.plotOrder.splice(this.plotOrder.indexOf(Number(nb)),1);
				this.plotOrder.push(-1);
				this.updateAddButton(false, "+", nb);
				this.id[nb]=-1;
				this.hidden[nb];
				this.length--;
				this.values[nb]={ber:[],fer:[]};
				this.disponibility[nb]=1;
			}
			else {
				console.log("Curve"+String(nb)+" is already available.");
			}
		}
		else {
			console.log(String(nb)+" > Curves.max (Curves.max = "+String(this.max));
		}
	},
	curveId() {
		return "curve"+this.firstSideAvailable();
	},
	updateAddButton(bool, string, nb) {
		$('#'+"curve"+this.id[nb]).prop('disabled', bool);
		$('#'+"curve"+this.id[nb]).empty();
		$('#'+"curve"+this.id[nb]).append(string);
	}
};
// axis/legend of the 2 plots
const LT = {
	showlegend:false,
	xaxis:{ zeroline:false, hoverformat: '.e', title: 'Eb/N0 (dB)'},
	margin: {
		l: 100,
		r: 40,
		b: 40,
		t: 40,
		pad: 4
	},
	colorway: Curves.colors,
	hovermode: 'x',
};

const LAYOUT= {
	ber: Object.assign({ yaxis: { type: 'log', autorange: true, hoverformat: '.2e',title: 'Bit Error Rate (BER)'} },LT),
	fer: Object.assign({ yaxis: { type: 'log', autorange: true, hoverformat: '.2e',title: 'Frame Error Rate (FER)'}},LT),
    // befe: Object.assign({yaxis: { autorange: true, hoverformat: '.2e',title: 'BE/FE'}},LT),
    // thr: Object.assign({ yaxis: { autorange: true, hoverformat: '.2e',title: 'Throughput (Mb/s)'}},LT)
};

let GD={};

function updateURLParameter(url, param, paramVal)
{
	let TheAnchor = null;
	let newAdditionalURL = "";
	let tempArray = url.split("?");
	let baseURL = tempArray[0];
	let additionalURL = tempArray[1];
	let temp = "";

	if (additionalURL)
	{
		let tmpAnchor = additionalURL.split("#");
		let TheParams = tmpAnchor[0];
		TheAnchor = tmpAnchor[1];
		if(TheAnchor)
			additionalURL = TheParams;

		tempArray = additionalURL.split("&");

		for (let i=0; i<tempArray.length; i++)
		{
			if(tempArray[i].split('=')[0] != param)
			{
				newAdditionalURL += temp + tempArray[i];
				temp = "&";
			}
		}
	}
	else
	{
		let tmpAnchor = baseURL.split("#");
		let TheParams = tmpAnchor[0];
		TheAnchor = tmpAnchor[1];

		if(TheParams)
			baseURL = TheParams;
	}

	if(TheAnchor)
		paramVal += "#" + TheAnchor;
	if (paramVal=="") paramVal="null";
	let rows_txt = temp + "" + param + "=" + paramVal;
	return baseURL + "?" + newAdditionalURL + rows_txt;
}

function findGetParameter(parameterName) {
	let result = null,
	tmp = [];
	window.location.search
	.substr(1)
	.split("&")
	.forEach(function (item) {
		tmp = item.split("=");
		if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
	});
	return result;
}

// size of the compressed Gitlab refs database in bytes
let EVT_TOTAL = 1279262;
function loadDatabase() {//Return String that include the whole file
	let databaseURL = GITLAB + "jobs/artifacts/" + BRANCH + "/raw/database.json?job=deploy-database-json";
	$.ajaxSetup({
		beforeSend: function(xhr) {
			if (xhr.overrideMimeType) xhr.overrideMimeType("text/plain");
		},
		isLocal:false
	});
	$.ajax(databaseURL,
		{error:function(xhr,status,error) {
			logger("**Error loading \"" + databaseURL + "\"\n"+status+" "+error);
		},
		xhr: function (){
			let xhr = new window.XMLHttpRequest();
			xhr.addEventListener("progress", function (evt) {
				let evt_total;
				if (evt.lengthComputable) evt_total = evt.total;
				else evt_total = EVT_TOTAL;
				if (evt_total<=evt.loaded) evt_total=evt.loaded*101/100;
				let percentComplete = Math.round((evt.loaded / evt_total) * 100);
				$("#loader .progress-bar").html(percentComplete+"%");
				$('#loader .progress-bar').attr('aria-valuenow', percentComplete).css('width',percentComplete+"%");
			}, false);
			return xhr;
		}
	}).done(function(data) {
		let dataTab=JSON.parse(data);
		Curves.refs=orderFiles(dataTab);
		displaySlider();
		displayCodeTypes();
		displayFrameSizes();
		displayModems();
		displayChannels();
		$("#loader").css("display", "none");
		$("#curvesTip").css("display", "block");
		$("#tips").css("display", "block");
		$("#selector").css("display", "block");
		$("#comparator").css("display", "block");
		drawCurvesFromURI();
		displayFiles(Curves.refs);
	});
}

function displaySlider() {
	let stepSlider = $('#slider-step')[0];
	noUiSlider.create(stepSlider, {
		start: [0,1],
		connect: true,
		step: 0.01,
		range: {
			'min': [0],
			'max': [1]
		}
	});
	$("#slider-step").append("<div class='my-3'><span id='slider-step-value'></span></div>")
	let stepSliderValueElement = $('#slider-step-value')[0];
	stepSlider.noUiSlider.on('update', function (values) {
		displayAll();
		stepSliderValueElement.innerHTML = "Values: ";
		stepSliderValueElement.innerHTML += values.join(' - ');
	});
}

function getId(ref) {
	return ref.hash.value.substring(0,7);
}

function sortFiles(refs) {
	let sizes={};
	for (let code in refs) {
		refs[code].sort(function(a,b) {
			a.headers.Codec["Frame size (N)"]>b.headers.Codec["Frame size (N)"];
			//if (a.headers.Codec["Frame size (N)"]==b.headers.Codec["Frame size (N)"]) a.headers.Codec["Code rate"]>b.headers.Codec["Code rate"];
		});
		refs[code].forEach(function(x){
			if (!sizes[code]) 
				sizes[code]=[x.headers.Codec["Frame size (N)"]];
			else if (sizes[code].indexOf(x.headers.Codec["Frame size (N)"])<0)
				sizes[code].push(x.headers.Codec["Frame size (N)"]);
		});
	}
	for (let code in refs) {
		let arr2=[];
		sizes[code].forEach(function(x) {
			let arr=[];
			refs[code].forEach(function(y) {
				if (y.headers.Codec["Frame size (N)"]==x)
					arr.push(y);
				else {
					arr.sort((a,b) => a.headers.Codec["Code rate"]<b.headers.Codec["Code rate"]);
					arr.forEach(z => arr2.push(z));
					arr=[];
				}
			});
			if (arr.length!=0) {
				arr.sort((a,b) => a.headers.Codec["Code rate"]<b.headers.Codec["Code rate"]);
				arr.forEach(z => arr2.push(z));
			}
		});
		if (arr2.length>0)
			refs[code]=arr2;
	}
}

function displayFiles(refs) {//Display refs that can be selected
	sortFiles(refs);
	$("#refsList #accordion").empty();
	Curves.toolTips=[];
	$("#"+Curves.curveId()+"modalsSelector").empty();
	for (let code in refs) {
		for (let i=0; i<refs[code].length; i++) {
			let a=refs[code][i];
			/([a-z0-9A-Z.\-,\/=\s;\+:]+\([0-9,]+\))([a-z0-9A-Z.\-,\/=\s;\+:()]+)/mg.test(a.metadata.title);
			let metadataTitle=a.metadata.title;
			let metadataTitleShort=a.metadata.title;
			let titleEnd="";
			let codeWord="", metadataDoi="", metadataUrl="", metadataCommand="", tooltip="", tooltipParam="";
			if (a.metadata.title.length > 23) {
				if (RegExp.$1=="" || RegExp.$2=="") metadataTitleShort=a.metadata.title.substring(0,19)+'... ';
				else {
					metadataTitleShort=RegExp.$1;
					titleEnd=RegExp.$2;
				}
				let nb=Curves.toolTips.length;
				tooltipParam="id='toolTip"+String(nb)+"' data-tippy-content='"+String(metadataTitle)+"'";
				Curves.toolTips.push('#toolTip'+String(nb));
			}
			if (a.headers.Codec["Codeword size (N_cw)"] > a.headers.Codec["Frame size (N)"])
				codeWord="<b>Codeword</b>: "+a.headers.Codec["Codeword size (N_cw)"]+"<br/>";
			for (let j in a.headers) {
				if (a.headers[j].Type) {
					let tooltip2 = "";
					if (tooltips.get(a.headers[j].Type))
						tooltip2 = " class='tt' data-toggle='tooltip' data-placement='top' data-html='true' title='" + tooltips.get(a.headers[j].Type) + "'";
					if (a.headers[j].Type == "BP_HORIZONTAL_LAYERED") a.headers[j].Type = "BP_HLAYERED";
					if (a.headers[j].Type == "BP_VERTICAL_LAYERED") a.headers[j].Type = "BP_VLAYERED";
					tooltip+="<br/><b>"+j+"</b>: "+"<span" + tooltip2 + ">" + a.headers[j].Type + "</span>";
				}
			}
			if (a.metadata.doi)
				metadataDoi="  <span class='curveIcon'><a href='https://doi.org/"+a.metadata.doi+"' target='_blank' title='DOI' onclick='return trackOutboundLink(\"https://doi.org/"+a.metadata.doi+"\");'><i class='fas fa-book'></i></a></span>";
			if (a.metadata.url)
				metadataUrl="  <span class='curveIcon'><a href='"+a.metadata.url+"' target='_blank' title='URL' onclick='return trackOutboundLink(\""+a.metadata.url+"\");'><i class='fas fa-globe'></i></a></span>";
			if (a.metadata.command)
				metadataCommand="  <span class='curveIcon'><a href='#' data-toggle='modal' data-target='#modalInfoCmd"+"_"+getId(a)+"' title='Command line'><i class='fas fa-laptop'></i></a></span>";
			let refsTemplate = $('#refsTemplate').html();
			Mustache.parse(refsTemplate);
			let refsRendered=Mustache.render(refsTemplate, {
				refsI: String(i),
				sideNumber: Curves.curveId().substring(5,Curves.curveId().length),
				side: Curves.curveId(),
				aId: getId(a),
				tooltip: tooltipParam,
				aTitleShort: metadataTitleShort,
				aTitle: metadataTitle,
				aTitleEnd: titleEnd,
				aFramesize: a.headers.Codec["Frame size (N)"],
				refsCodeword: codeWord,
				aCoderate: a.headers.Codec["Code rate"],
				refsTooltip: tooltip,
				refsDoi: metadataDoi,
				refsUrl: metadataUrl,
				refsCommand: metadataCommand
			});
			$("#refsList #accordion").append(refsRendered);
			tippy(Curves.toolTips[Curves.toolTips.length-1], {
				arrow: true,
				arrowType: 'sharp',
				animation: 'fade',
			});
			if (a.metadata.command) {
				let cmdSelectorTemplate = $('#cmdSelectorTemplate').html();
				Mustache.parse(cmdSelectorTemplate);
				let refRendered1=Mustache.render(cmdSelectorTemplate, 	{side: Curves.curveId(),
					aId: getId(a),
					aTitle: metadataTitle,
					aCommand: String(a.metadata.command),
					aFile: String(a.trace),
				});
				$("#curvemodalsSelector").append(refRendered1);
			}
			addClick(a, 0);
		}
		$('[data-toggle="tooltip"]').tooltip();
	}
}

function displaySelectedCurve(a) {//Display the current selected curve on the right
	let metadataTitle=a.metadata.title;
	let codeWord="", tooltip1=">", tooltip2="", metadataDoi="", metadataUrl="", metadataCommand="", metadataTitleShort=a.metadata.title, nb=-1, allFunc="";
	if (a.metadata.title.length > 21) {
		nb=Curves.curveId().substring(5, Curves.curveId().length);
		tooltip1="id='TooltipCurve"+nb+"' data-tippy-content='"+String(metadataTitle)+"'>";
		Curves.toolTipsSelected[Number(nb)]='#TooltipCurve'+nb;
		metadataTitleShort=a.metadata.title.substring(0,20)+"... ";
	}
	if (a.headers.Codec["Codeword size (N_cw)"] > a.headers.Codec["Frame size (N)"])
		codeWord="<b>Codeword</b>: "+a.headers.Codec["Codeword size (N_cw)"]+"<br/>";
	for (let j in a.headers) {
		if (a.headers[j].Type) {
			let tooltip = "";
			if (tooltips.get(a.headers[j].Type))
				tooltip = " class='tt' data-toggle='tooltip' data-placement='top' data-html='true' title='" + tooltips.get(a.headers[j].Type) + "'";
			if (a.headers[j].Type == "BP_HORIZONTAL_LAYERED") a.headers[j].Type = "BP_HLAYERED";
			if (a.headers[j].Type == "BP_VERTICAL_LAYERED") a.headers[j].Type = "BP_VLAYERED";
			tooltip2+="<br/><b>"+j+"</b>: "+"<span" + tooltip + ">" + a.headers[j].Type + "</span>";
		}
	}
	if (a.metadata.doi)
		metadataDoi="  <span class='curveIcon'><a href='https://doi.org/"+a.metadata.doi+"' target='_blank' title='DOI' onclick='return trackOutboundLink(\"https://doi.org/"+a.metadata.doi+"\");'><i class='fas fa-book'></i></a></span>"
	if (a.metadata.url)
		metadataUrl="  <span class='curveIcon'><a href='"+a.metadata.url+"' target='_blank' title='URL' onclick='return trackOutboundLink(\""+a.metadata.url+"\");'><i class='fas fa-globe'></i></a></span>"
	if (a.metadata.command)
		metadataCommand="  <span class='curveIcon'><a href='#' data-toggle='modal' data-target='#modalInfoCmd"+Curves.curveId()+"_"+getId(a)+"' title='Command line'><i class='fas fa-laptop'></i></a></span>"
	let selectedTemplate = $('#selectedTemplate').html();
	Mustache.parse(selectedTemplate);
	let selectedRendered=Mustache.render(selectedTemplate, {
		sideNumber: Curves.curveId().substring(5,Curves.curveId().length),
		side: Curves.curveId(),
		aId: getId(a),
		aTitle: metadataTitle,
		aTitleShort: metadataTitleShort,
		aFramesize: a.headers.Codec["Frame size (N)"],
		refsCodeword: codeWord,
		aCoderate: a.headers.Codec["Code rate"],
		refsTooltip1: tooltip1,
		refsTooltip2: tooltip2,
		refsDoi: metadataDoi,
		refsUrl: metadataUrl,
		refsCommand: metadataCommand
	});
	$("#scurve #sAccordion").append(selectedRendered);
	tippy(Curves.toolTipsSelected[nb], {
		arrow: true,
		arrowType: 'sharp',
		animation: 'fade',
	});
	if (a.metadata.command) {
		let cmdSelectedTemplate = $('#cmdSelectedTemplate').html();
		Mustache.parse(cmdSelectedTemplate);
		let refRendered1=Mustache.render(cmdSelectedTemplate, 	{side: Curves.curveId(),
			aId: getId(a),
			aTitle: metadataTitle,
			aCommand: String(a.metadata.command),
			aFile: String(a.trace),
		});
		$("#"+Curves.curveId()+"modals").append(refRendered1);
	}}

	function subAddClick(a, input) {
		let code=a.headers.Codec.Type;
		let refs=Curves.refs[code];
		if (Curves.length==0) {
			let deleteAllTemplate = $('#deleteAllTemplate').html();
			Mustache.parse(deleteAllTemplate);
			$("#sAccordion").append(deleteAllTemplate);
			$("#plotber").css("display", "inline");
			$("#plotfer").css("display", "inline");
		}
		$("#tips").css("display", "none");
		const plots=["ber","fer"/*,"befe","thr"*/];
		$("#selector .bers .active").removeClass("active");
		$(this).addClass("active");
		if (Curves.length==Curves.max) {
			console.log("Maximum quantity of curves reached!");
			alert("For readability, you can not display more than 10 curves.");
		}
		else {
			displaySelectedCurve(a);
			let cval=[];
			for (let i=0; i<Curves.max; i++) {
				cval.push(encodeURIComponent(findGetParameter("curve"+String(i))));
			}
			let uri  = "/comparator.html?curve0="+cval[0];
			for (let i=1; i<Curves.max; i++) {
				uri=uri+"&curve"+String(i)+"="+cval[i];
			}
			if (input==0) uri = updateURLParameter(uri,Curves.curveId(),getId(a));
			else uri = updateURLParameter(uri,Curves.curveId(),encodeURIComponent(LZString.compressToEncodedURIComponent(a.trace)));
			window.history.replaceState({},"aff3ct.github.io",uri);
			if (input==0) {
				Curves.addCurve(a);
			}
			else {
				Curves.addInputCurve(a);
			}
			plots.forEach(function(x) {
				const CURVESBIS=[];
				for (let l=0; l<Curves.max; l++) {
					if (Curves.plotOrder[l]!=-1) {
						CURVESBIS.push(Curves.values[Curves.plotOrder[l]][x]);
					}
				}
				Plotly.newPlot(GD[x],CURVESBIS.slice(0,Curves.length),LAYOUT[x],{displaylogo:false});
			});
		}
	}

// Click listener for curves list
function addClick(a, input) {//Plot the curve
	if (input==1) {
		subAddClick(a, input);
	}
	else {
		$('#curve'+getId(a)).on('click', function() {
			subAddClick(a, 0);
			// track the click with Google Analytics
			/**ga('send', {
			hitType:       'event',
			eventCategory: 'BER/FER Comparator',
			eventAction:   'click',
			eventLabel:    decodeURIComponent(a.filename)
		});**/
	});
	}
}

function deleteAll() {
	Curves.names.forEach(x => deleteClick('delete', x));
}

function deleteClick(divId, idSide) {//unplot a curve
	//delete a selected curve
	const plots=["ber","fer"];
	for (let i=0; i<Curves.max; i++) {
		if (Curves.hidden[i]==1) showCurve(i);
	}
	$('#'+Curves.curveId()+Curves.id[Number(idSide.substring(5,idSide.length))]).prop('disabled', false);
	if (Curves.length !== 0) {
		$('#'+Curves.curveId()+Curves.id[Number(idSide.substring(5,idSide.length))]).empty();
		$('#'+Curves.curveId()+Curves.id[Number(idSide.substring(5,idSide.length))]).append("+");
		Curves.deleteCurve(idSide.substring(5, idSide.length));
		if (Curves.length==0) {
			$("#closeAll").remove();
			$("#tips").css("display", "inline");
			$("#plotber").css("display", "none");
			$("#plotfer").css("display", "none");
		}
		let cval=[];
		let uri  = "/comparator.html?curve0=";
		for (let i=0; i<Curves.max; i++) {
			cval.push(encodeURIComponent(findGetParameter("curve"+String(i))));
			if (i==0) uri+=cval[0];
			else uri=uri+"&curve"+String(i)+"="+cval[i];
		}
		uri = updateURLParameter(uri,idSide,"");
		window.history.replaceState({},"aff3ct.github.io",uri);
		$("#s"+idSide).remove();
		plots.forEach(function(x) {
			const CURVESBIS=[];
			for (let l=0; l<Curves.max; l++) {
				if ((Curves.plotOrder[l]!=-1) && (l!=Curves.plotOrder.indexOf(Number(idSide.substring(5,idSide.length))))) {
					CURVESBIS.push(Curves.values[Curves.plotOrder[l]][x]);
				}
			}
			Plotly.newPlot(GD[x],CURVESBIS.slice(0,Curves.length),LAYOUT[x],{displaylogo:false});
		});
	}
}

function showCurve(idSide) {
	const plots=["ber","fer"];
	Curves.colors.splice(Curves.colors.indexOf(Curves.referenceColors[Curves.plotOrder.indexOf(Number(idSide))]),1);
	let nb=Curves.plotOrder.indexOf(Number(idSide));
	let ind=0;
	for(let i=0; i<=nb; i++) {
		if (Curves.hidden[i]==1 && (i!=Curves.plotOrder.indexOf(Number(idSide)))) {
			ind++;
		}
	}
	nb=nb-ind;
	Curves.colors.splice(nb,0,Curves.referenceColors[Curves.plotOrder.indexOf(Number(idSide))]);
	plots.forEach(function(x) {
		const CURVESBIS=[];
		for (let l=0; l<Curves.max; l++) {
			if (l==Curves.plotOrder.indexOf(Number(idSide))) {
				Curves.hidden[l]=0;
			}
			if ((Curves.plotOrder[l]!=-1) && (Curves.hidden[l]==0)) {
				CURVESBIS.push(Curves.values[Curves.plotOrder[l]][x]);
			}
		}
		Plotly.newPlot(GD[x],CURVESBIS.slice(0,Curves.length),LAYOUT[x],{displaylogo:false});
	});
	$("#scurve"+String(idSide)).fadeTo("fast", 1);
	$("#show"+String(idSide)).remove();
	let hideTemplate = $('#hideTemplate').html();
	Mustache.parse(hideTemplate);
	let hideRendered=Mustache.render(hideTemplate, {
		sideNumber: String(idSide)
	});
	$("#delete"+String(idSide)).append(hideRendered);
}

function hideCurve(idSide) {
	const plots=["ber","fer"];
	let a=Curves.colors[Curves.colors.indexOf(Curves.referenceColors[Curves.plotOrder.indexOf(Number(idSide))])];
	Curves.colors.splice(Curves.colors.indexOf(Curves.referenceColors[Curves.plotOrder.indexOf(Number(idSide))]),1);
	Curves.colors.push(a);
	plots.forEach(function(x) {
		const CURVESBIS=[];
		for (let l=0; l<Curves.max; l++) {
			if (l==Curves.plotOrder.indexOf(Number(idSide))) {
				Curves.hidden[l]=1;
			}
			if ((Curves.plotOrder[l]!=-1) && (Curves.hidden[l]==0)) {
				CURVESBIS.push(Curves.values[Curves.plotOrder[l]][x]);
			}
		}
		Plotly.newPlot(GD[x],CURVESBIS.slice(0,Curves.length),LAYOUT[x],{displaylogo:false});
	});
	$("#scurve"+String(idSide)).fadeTo("slow", 0.33);
	$("#hide"+String(idSide)).remove();
	let showTemplate = $('#showTemplate').html();
	Mustache.parse(showTemplate);
	let showRendered=Mustache.render(showTemplate, {
		sideNumber: String(idSide)
	});
	$("#delete"+String(idSide)).append(showRendered);
}



function loadUniqueFile(fileInput, i) {//Load a file from input
	if (i<fileInput.files.length) {
		let file = fileInput.files[i];
		if (file.type=="text/plain")
		{
			$("#fileDisplayArea").empty();
			if (Curves.length<Curves.max) {
				let reader = new FileReader();
				reader.readAsText(file);
				reader.onloadend = function(e)
				{
					let o=text2json(reader.result, file.name);
					let filename = encodeURIComponent(getId(o));
					addClick(o, 1);
					loadUniqueFile(fileInput, i+1);
				};
			}
			else {
				$("#fileDisplayArea").html('<br><br><span class="alert alert-danger" role="alert">Too many curves displayed</span>');
			}
		}
		else
		{
			$("#fileDisplayArea").html('<br><br><span class="alert alert-danger" role="alert">File not supported!</span>');
			loadUniqueFile(fileInput, i+1);
		}
	}
}

window.onload = function() {
	const plots=["ber","fer"/*,"befe","thr"*/];
	$("#fileInput").on('change', function(e)
	{
		loadUniqueFile(fileInput, 0);
	});
}

function applySelections() {
	displayFiles(filters(Curves.refs, -1));
	for (let i in Curves.disponibility) {
		if (Curves.disponibility[i]==0) Curves.updateAddButton(true, "-", i);
	}
}
function updateSelectedCodes(str) {
	if (document.getElementById(str.title).checked == true) {
		Curves.selectedCodes.push(str.title);
	}
	else {
		Curves.selectedCodes.splice(Curves.selectedCodes.indexOf(str.title), 1);
	}
	if (Curves.selectedCodes.length==0) displayAll();
	else {
		displayFrameSizes();
		displayModems();
		displayChannels();
	}
}

function updateSelectedSizes(str) {
	if (document.getElementById(String(str)).checked == true) {
		Curves.selectedSizes.push(str);
	}
	else {
		Curves.selectedSizes.splice(Curves.selectedSizes.indexOf(str), 1);
	}
	if (Curves.selectedSizes.length==0) displayAll();
	else {
		displayCodeTypes();
		displayModems();
		displayChannels();
	}
}

function updateSelectedModems(str) {
	if (document.getElementById(String(str.title)).checked == true) {
		Curves.selectedModems.push(str.title);
	}
	else {
		Curves.selectedModems.splice(Curves.selectedModems.indexOf(str.title), 1);
	}
	if (Curves.selectedModems.length==0) displayAll();
	else {
		displayCodeTypes();
		displayFrameSizes();
		displayChannels();
	}
}

function updateSelectedChannels(str) {
	if (document.getElementById(String(str.title)).checked == true) {
		Curves.selectedChannels.push(str.title);
	}
	else {
		Curves.selectedChannels.splice(Curves.selectedChannels.indexOf(str.title), 1);
	}
	if (Curves.selectedChannels.length==0) displayAll();
	else {
		displayCodeTypes();
		displayFrameSizes();
		displayModems();
	}
}
window.onresize = function() {
	Plotly.Plots.resize(GD.ber);
	Plotly.Plots.resize(GD.fer);
    // Plotly.Plots.resize(GD.befe);
    // Plotly.Plots.resize(GD.thr);
};

function filterByCodeTypes(refs) {//refs: Array of refs ---> Array of refs
	let p={};
	if (Curves.selectedCodes.length!=0 && refs.length!=0) {
		Curves.selectedCodes.forEach(function(x) { if (refs[x]) {
			refs[x].forEach(function(y) {
				if (!p[x]) {
					p[x]=[];
				}
				p[x].push(y);
			})}
		});
		return p;
	}
	else return refs;
}
function filterByFrameSizes(refs) {//refs: Array of refs ---> Array of refs
	let p={};
	if (Curves.selectedSizes.length!=0 && refs.length!=0) {
		for(let i in refs) {
			refs[i].forEach(function(x) {
				Curves.selectedSizes.forEach(function(y) {
					if (x.headers.Codec["Frame size (N)"]==y) {
						if (!p[i]) {
							p[i]=[];
						}
						p[i].push(x);
					}
				});
			});
		}
		return p;
	}
	else return refs;
}
function filterByCodeRates(refs) {//refs: Array of refs ---> Array of refs
	let p={};
	let stepSlider = $('#slider-step')[0];
	let coderate=stepSlider.noUiSlider.get();
	if (coderate[0]==0 && coderate[1]==1) return refs;
	else {
		for(let i in refs) {
			refs[i].forEach(function(z) {
				if (coderate[0]<=z.headers.Codec["Code rate"] && z.headers.Codec["Code rate"]<=coderate[1]) {
					if (!p[i]) {
						p[i]=[];
					}
					p[i].push(z);
				}
			});
		}
		return p;
	}
}

function filterByModems(refs) {//refs: Array of refs ---> Array of refs
	let p={};
	if (Curves.selectedModems.length!=0) {
		for(let i in refs) {
			refs[i].forEach(function(x) { Curves.selectedModems.forEach(function(y){
				if (x.headers.Modem.Type==y) {
					if (!p[i]) {
						p[i]=[];
					}
					p[i].push(x);
				}
			})});
		}
		return p;
	}
	else return refs;
}

function filterByChannels(refs) {//refs: Array of refs ---> Array of refs
	let p={};
	if (Curves.selectedChannels.length!=0) {
		for(let i in refs) {
			refs[i].forEach(function(x) { Curves.selectedChannels.forEach(function(y){
				if (x.headers.Channel.Type==y) {
					if (!p[i]) {
						p[i]=[];
					}
					p[i].push(x);
				}
			})});
		}
		return p;
	}
	else return refs;
}

function filters(refs, nb) {//nb is the indicator linked to a specific fiter to avoid
	//0: Code type
	//1: Frame size 
	//2: Modem
	//3: Channel
	//4: Code rate
	if (nb==-1) return filterByCodeTypes(filterByFrameSizes(filterByCodeRates(filterByModems(filterByChannels(refs)))));
	if (nb==0) return filterByFrameSizes(filterByCodeRates(filterByModems(filterByChannels(refs))));
	if (nb==1) return filterByCodeTypes(filterByCodeRates(filterByModems(filterByChannels(refs))));
	if (nb==2) return filterByCodeTypes(filterByFrameSizes(filterByCodeRates(filterByChannels(refs))));
	if (nb==3) return filterByCodeTypes(filterByFrameSizes(filterByCodeRates(filterByModems(refs))));
	if (nb==4) return filterByCodeTypes(filterByFrameSizes(filterByChannels(filterByModems(refs))));
}

function displayAll() {
	displayCodeTypes();
	displayFrameSizes();
	displayModems();
	displayChannels();
}

function displayCheckbox(length, font, endFont, disabled, fonction, i, div) {
	let checkboxTemplate = $('#checkboxTemplate').html();
	Mustache.parse(checkboxTemplate);
	let checkboxRendered=Mustache.render(checkboxTemplate, {
		element: i,
		disabled: disabled,
		startBlackFont: font,
		endBlackFont: endFont,
		length: length,
		function: fonction
	});
	$(div).append(checkboxRendered);
}

function displayCodeTypes() {
	let refs=Curves.refs;
	let filteredFiles=filters(Curves.refs, 0);
	let j=0;
	$(".codetype").empty();
	for (let i in refs)
	{
		if (j!=0) $(".codetype").append('<br>');
		let number=0;
		let black='';
		let disabled='';
		let endBlack='';
		let fonction='updateSelectedCodes(';
		if (filteredFiles[i]) {
			black='<font color="black">';
			endBlack='</font>';
			number=filteredFiles[i].length;
			displayCheckbox(number, black, endBlack, disabled, fonction, i, ".codetype");
		}
		else if (Curves.selectedCodes.indexOf(i)>-1) {
			black='<font color="black">';
			endBlack='</font>';
			displayCheckbox(number, black, endBlack, disabled, fonction, i, ".codetype");
		}
		else {
			disabled='disabled';
			displayCheckbox(number, black, endBlack, disabled, fonction, i, ".codetype");
		}
		j++;
	}
	$(".codetype").off();
	Curves.selectedCodes.forEach(function(x) {
		if (document.getElementById(x)!=null) {
			if (document.getElementById(x).disabled == false) document.getElementById(x).checked = true;
			else document.getElementById(x).checked = false;
		}
	});
}

function displayFrameSizes() {
	let refs=filters(Curves.refs, 1);
	let p={};
	let j=0;
	for (let code in refs) {
		for (let i=0;i<(refs[code]).length;i++) {
			let f=refs[code][i];
			if (p[f.headers.Codec["Frame size (N)"]]>=0) p[f.headers.Codec["Frame size (N)"]]++;
			else p[f.headers.Codec["Frame size (N)"]]=1;
		}
	}
	$("#selector .size").empty();
	for (let i in p){
		if (j!=0) $(".size").append('<br>');
		let number=p[i];
		let black='<font color="black">';
		let disabled='';
		let endBlack='</font>';
		let fonction='updateSelectedSizes(';
		j++;
		displayCheckbox(number, black, endBlack, disabled, fonction, i, "#selector .size");
	}
	Curves.selectedSizes.forEach(function(x) {
		if (document.getElementById(x)!=null) {
			if (document.getElementById(x).disabled == false) document.getElementById(x).checked = true;
			else document.getElementById(x).checked = false;
		}
	});
	$("#selector .size").off();
}

function displayModems() {
	let refs=filters(Curves.refs, 2);
	let p={};
	let j=0;
	for (let code in refs) {
		for (let i=0;i<(refs[code]).length;i++) {
			let f=refs[code][i];
			if (p[f.headers.Modem.Type]>=0) p[f.headers.Modem.Type]++;
			else p[f.headers.Modem.Type]=1;
		}
	}
	$("#selector .modem").empty();
	for (let i in p){
		if (j!=0) $(".modem").append('<br>');
		else j++;
		let number=p[i];
		let black='<font color="black">';
		let disabled='';
		let endBlack='</font>';
		let fonction='updateSelectedModems(';
		displayCheckbox(number, black, endBlack, disabled, fonction, i, "#selector .modem");
	}
	Curves.selectedModems.forEach(function(x) {
		if (document.getElementById(x)!=null) {
			if (document.getElementById(x).disabled == false) document.getElementById(x).checked = true;
			else document.getElementById(x).checked = false;
		}
	});
	$("#selector .modem").off();
}

function displayChannels() {
	let refs=filters(Curves.refs, 3);
	let p={};
	let j=0;
	for (let code in refs) {
		for (let i=0;i<(refs[code]).length;i++) {
			let f=refs[code][i];
			if (p[f.headers.Channel.Type]>=0) p[f.headers.Channel.Type]++;
			else p[f.headers.Channel.Type]=1;
		}
	}
	$("#selector .channel").empty();
	for (let i in p){
		if (j!=0) $(".channel").append('<br>');
		else j++;
		let number=p[i];
		let black='<font color="black">';
		let disabled='';
		let endBlack='</font>';
		let fonction='updateSelectedChannels(';
		displayCheckbox(number, black, endBlack, disabled, fonction, i, "#selector .channel");
	}
	Curves.selectedChannels.forEach(function(x) {
		if (document.getElementById(x)!=null) {
			if (document.getElementById(x).disabled == false) document.getElementById(x).checked = true;
			else document.getElementById(x).checked = false;
		}
	});
	$("#selector .channel").off();
}

// refs: array of refs.
// ordered: refs are first sorted by code type, then by framesize.
function orderFiles(refs) {
	let ordered={};
	for (let i in refs){
		let f=refs[i];
		if (f.headers.Simulation) {
			if (typeof ordered[f.headers.Simulation["Code type (C)"]]=="undefined") ordered[f.headers.Simulation["Code type (C)"]]=[];
			ordered[f.headers.Simulation["Code type (C)"]].push(f);
		}
	}
	for (let i in ordered)
		ordered[i].sort((a,b)=> b.headers.Codec["Frame size (N)"]<a.headers.Codec["Frame size (N)"]);
	return ordered;
}

function selectFile(hashId)
{
	for (let code in Curves.refs) {
		for (let f=0;f<Curves.refs[code].length;f++) {
			if (getId(Curves.refs[code][f]) == hashId) return Curves.refs[code][f];
		}
	}
	return null;
}

function drawCurvesFromURI() {
	Curves.names.forEach(function(idSide) {
		let id=findGetParameter(idSide);
		if (id) {
			if (id.slice(0,4)=="NoWw") {
				let o=text2json(LZString.decompressFromEncodedURIComponent(id));
				subAddClick(o, 1);
			}
			else {
				let f=selectFile(id);
				if (f) {
					subAddClick(f, 0);
				}
				else {
					subAddClick(Curves.refs["BCH"][0], 0);
					deleteClick('delete', idSide);
				}
			}
		}
	});
}

//main
$(document).ready(function() {
	Curves.initialization();
	let d3 = Plotly.d3;
	let WIDTH_IN_PERCENT_OF_PARENT = 100,
	HEIGHT_IN_PERCENT_OF_PARENT = 40;
	let plots=["ber","fer"/*,"befe","thr"*/];
	plots.forEach(function(e) {
		GD[e] = d3.select("#plot"+e)
		.append('div')
		.style({
			width: WIDTH_IN_PERCENT_OF_PARENT + '%',
			'margin-left': (100 - WIDTH_IN_PERCENT_OF_PARENT) / 2 + '%',
			height: HEIGHT_IN_PERCENT_OF_PARENT + 'vh',
			'margin-top': (40 - HEIGHT_IN_PERCENT_OF_PARENT) / 2 + 'vh'
		}).node();
	});
	loadDatabase();
});