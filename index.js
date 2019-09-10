//Init objects
var saveObject = {}
var wordPropsPattern={"partOfSpeech":"","gender":"","group":""}, wordInfoPattern={"id":"","construction":"","texts":"","text":"","spelling":"","translations":"","translationsJson":"","translation":"","props":""}
var wordsInfo={}, wordsInfoIdsBy={}, wordsByMasks={}
var genWordInfo_1,genWordInfo_2,genWordInfo_3,genWordInfo_4_1,genWordInfo_4

//Get objects
var storage = window.localStorage

//Help functions
var fromUpperCase=function(str)
{
	return (str+"")[0].toUpperCase()+(str+"").substring(1)
}
var objectToJson=function(object)
{
	return JSON.stringify(object).replace(/{/g,"{\n\t").replace(/\[/g,"[\n\t").replace(/,/g,",\n\t").replace(/:/g," : ").replace(/}/g,"\n}").replace(/]/g,"\n]")
}
var makeClone=function(orig) 
{
	if ("object"!==typeof orig)
		return orig
	let clone = (orig instanceof Array)?[]:{} // Создаем новый пустой объект или массив
	for (let prop in orig) // Перебираем все свойства копируемого объекта
		if (orig.hasOwnProperty(prop))
			if("object"!==typeof orig[prop])
				clone[prop] = orig[prop]
			else clone[prop] = makeClone(orig[prop]) // Делаем клон свойства
	return clone
}
var genWordInfo=function(input)
{
	var wordInfo=makeClone(input)
	if(wordInfo["id"])
	{
		var wordClone=makeClone(saveObject.words[wordInfo["id"]])
		if(wordClone)
			for(var v in wordClone)
				wordInfo[v]=wordClone[v]
		if(!wordInfo["construction"])
			wordInfo["construction"]=wordInfo["id"]+""
	}
	if(wordInfo["construction"])
		if(!wordInfo["texts"])
		{
			wordInfo["texts"]=""
			var splited=wordInfo["construction"].split("+")
			for(var i in splited)
				//if(saveObject["words"][wordInfo["construction"].split("+")[i]].text)
					wordInfo["texts"]+=(i==0?"":"+")+saveObject["words"][splited[i]].text
				//else console.log(wordInfo["construction"]+"\\\\"+wordInfo["construction"].split("+")[i])
		}
	if(wordInfo["texts"])
		if(!wordInfo["text"])
			wordInfo["text"]=wordInfo["texts"].replace("+","")
	if(wordInfo["text"])
		if(!wordInfo["spelling"])
			wordInfo["spelling"]=wordInfo["text"].replace(genWordInfo_1,genWordInfo_2)
	if(wordInfo["spelling"])
		if(!wordInfo["text"])
			wordInfo["text"]=wordInfo["spelling"].replace(genWordInfo_3,genWordInfo_4)
	if(wordInfo["translations"])
		if(!wordInfo["translation"])
		{
			var keys=Object.keys(wordInfo["translations"])
			wordInfo["translation"]=keys[0]?wordInfo["translations"][keys[0]][0]:null
		}
	if(!wordInfo["props"])
		wordInfo["props"]=(wordInfo["partOfSpeech"]||"")+";"+(wordInfo["gender"]||"")+";"+(wordInfo["group"]||"")
	if(wordInfo["translations"])
		if(!wordInfo["translationsJson"])
			wordInfo["translationsJson"]=JSON.stringify(wordInfo["translations"])
	wordInfo["string"]=(wordInfo.type=="new"?"~":(wordInfo.type=="constructed"?"#":"@"))+wordInfo["id"]+"="+(wordInfo.type=="systematically"?wordInfo["systematicallyConstruction"]:wordInfo["text"])+" - "+wordInfo["translationsJson"]+" - "+wordInfo["props"]
	return wordInfo
}
var getWordInfo=function(input)
{
	updateWordsInfo()
	if(input.id)
		if(wordsInfo[input.id])
			return wordsInfo[input.id]
	for(var v in wordInfoPattern)
		if(wordsInfo[wordsInfoIdsBy[v][input[v]]])
			return wordsInfo[wordsInfoIdsBy[v][input[v]]]
	return genWordInfo(input)
}
var getSymbols=function(type)
{
	return saveObject.symbols[type]||saveObject.symbols["text"]
}

//Common functions
var saveObjectChanged=function()
{
	wordsByMasks=wordsInfo=wordsInfoIdsBy={}
	getSaveJSON.onclick()
	findWordInput.oninput()
}
var addWord=function(type)
{
	var word = JSON.parse(wordPropsTextarea.value)
	for(var v in wordPropsPattern)
		if(word[v]==wordPropsPattern[v])
			delete word[v]
	word.translations=JSON.parse(wordTranslationsTextarea.value)
	switch(type)
	{
		case "new":
			word.text=wordText.value
			break
		case "constructed":
			word.construction=wordConstruction.value
			break
		case "systematically":
			word.systematicallyConstruction=wordSystematicallyConstruction.value
			break
	}
	word.type=type
	word.id=saveObject["words"].length
	saveObject["words"].push(word)
	saveObjectChanged()
}
var props=Object.keys(wordPropsPattern)
var getWordsByMask=function(maskWord,pasts)
{
	if(!pasts)
		pasts=""
	if(pasts.match(maskWord.id))
		return []
	if(!maskWord.systematicallyConstruction)
		return
	
	var mask=maskWord.systematicallyConstruction 
	if(wordsByMasks[mask])
		return wordsByMasks[mask]
	
	if(mask.replace("<","").replace(">","").length+2!=mask.length)
	{
		var masked=makeClone(maskWord)
		delete masked.text
		if(!masked.construction)
			masked.construction=masked.systematicallyConstruction
		return [masked]
	}
	
	var wordsByMask=[]
		
	var maskFilters=mask.split("<")[1].split(">")[0], maskFiltersArray=maskFilters.split(";")
	
	//console.log(mask)
	//console.log(maskPartOfSpeech)
	//console.log(maskGender)
	var langs=Object.keys(maskWord.translations)
	for(var k in saveObject["words"])
	{
		if(saveObject["words"][k].text=="?"||saveObject["words"][k].construction=="?"||saveObject["words"][k].systematicallyConstruction=="?")
			continue
		if(maskWord.systematicallyConstruction==saveObject["words"][k].systematicallyConstruction)
			continue
		var wordsByMask2=!saveObject["words"][k].systematicallyConstruction||pasts.split(",").length>=1?[saveObject["words"][k]]:getWordsByMask(saveObject["words"][k],pasts+","+maskWord.id)
		for(var l in wordsByMask2)
		{
			var word=wordsByMask2[l]
			//if(word.construction)
			//	if(word.construction.match(maskWord.systematicallyConstruction.replace("<"+maskFilters+">","[\s\S]")))
			//		continue
			//console.log(word.text)
			//console.log(word.partOfSpeech)
			//console.log(word.gender)
			var okk=true
			for(var v in props)
				if(maskFiltersArray[v]&&(word[props[v]]+"").replace(new RegExp(maskFiltersArray[v]),"").length!=0)
					okk=false
			if(!okk)
				continue

			var masked=makeClone(word)
			delete masked.text
			for(var v in wordPropsPattern)
				if(maskWord[v])
					masked[v]=maskWord[v]
			masked.construction=maskWord.systematicallyConstruction.replace("<"+maskFilters+">",word.construction?word.construction:word.id)
			masked.id=maskWord.id+"("+maskWord.systematicallyConstruction.replace("<"+maskFilters+">",word.id)+")"
			masked.type=maskWord.type
			//console.log(l+"/"+wordsByMask2.length)
			//console.log(word)
			//console.log(masked)
			
			for(var v in masked.translations)
				for(var b in masked.translations[v])
				{
					//console.log("------"+v+"-"+b)
					var langTranslations=maskWord.translations[v]||maskWord.translations[langs[0]]
					//console.log(maskWord.translations[v])
					//console.log(maskWord.translations[langs[0]])
					//console.log(langTranslations)
					//console.log(masked.translations[v][b])
					masked.translations[v][b]=(langTranslations[b]||langTranslations[0]).replace("$curtr$",masked.translations[v][b])
					//console.log(masked.translations[v][b])
				}
			//console.log(masked)
			wordsByMask.push(masked)
		}
	}
	if(pasts.split(",").length==0)
		wordsByMasks[mask]=wordsByMask
	return wordsByMask
}
var updateWordsInfo=function()
{
	if(Object.keys(wordsInfo).length!=0)
		return
	for(var k in saveObject["words"])
		if(saveObject["words"][k].text!="?"&&saveObject["words"][k].construction!="?"&&saveObject["words"][k].systematicallyConstruction!="?")
			for(var l=-1, word, wordsByMask=saveObject["words"][k].type=="systematically"?getWordsByMask(saveObject["words"][k]):[];l<0+wordsByMask.length;l++)
				if(!wordsInfo[(word=genWordInfo(l==-1?saveObject["words"][k]:wordsByMask[l])).id])
					for(var v in (wordsInfo[word.id]=word))
					{
						if(!wordsInfoIdsBy[v])
							wordsInfoIdsBy[v]={}
						if(!wordsInfoIdsBy[v][word[v]])
							wordsInfoIdsBy[v][word[v]]=word.id
					}
}
var updateSentence=function(enter)
{
	updateWordsInfo()
	
	var generatedSentence={}, enterType, symbols, enterText=[["",true]]
	
	for(var v in wordsInfoIdsBy)
	{	
		generatedSentence[v]=""
		if(document.getElementById("sentence"+fromUpperCase(v))==enter)
			enterType=v
	}
	
	symbols=getSymbols(enterType)
	var quoteStatus=false
	for(var i in enter.value)
	{
		var allWordSymbols=symbols.wordSymbols+symbols.quote+symbols.sentenceStart+symbols.letterConnector
		var symbol = enter.value[i], isWord = !(!symbol.match("["+allWordSymbols+"]"))
		
		if(enterText[enterText.length-1][1]==isWord||quoteStatus)
			enterText[enterText.length-1][0]+=symbol
		else enterText[enterText.length]=[symbol, isWord]
		if(enterText[enterText.length-1][0].endsWith(symbols.quote))
			quoteStatus=!quoteStatus
	}
	var element, isSentenceStart
	for(var i in enterText)
		if(enterText[i][1])
		{
			element=enterText[i][0]
			
			isSentenceStart=!symbols.sentenceStart?element[0]==element[0].toUpperCase()&&element[0].toLowerCase()!=element[0].toUpperCase():element.startsWith(symbols.sentenceStart)
			if(isSentenceStart)
				element=!symbols.sentenceStart?element.toLowerCase():element.substring(symbols.sentenceStart.length)
			var hasQuotes=element.startsWith(symbols.quote)&&element.endsWith(symbols.quote),e=wordsInfo[wordsInfoIdsBy[enterType][element]], elementWithoutQuotes=element.substring(symbols.quote.length,element.length-symbols.quote.length)
			for(var v in wordsInfoIdsBy)
				if(hasQuotes)
					generatedSentence[v]+=getSymbols(v).quote+(v=="props"?"собс":genWordInfo(enterType=="spelling"?{"spelling":elementWithoutQuotes}:{"text":elementWithoutQuotes})[v=="spelling"?"spelling":"text"])+getSymbols(v).quote
				else generatedSentence[v]+=!e?null:(isSentenceStart?(getSymbols(v).sentenceStart?getSymbols(v).sentenceStart+e[v]:fromUpperCase(e[v])):e[v])
		}
		else for(var v in wordsInfoIdsBy)
			generatedSentence[v]+=enterText[i][0]
	for(var v in wordsInfoIdsBy)
		if(enterType!=v)
			if(document.getElementById("sentence"+fromUpperCase(v)))
				document.getElementById("sentence"+fromUpperCase(v)).value=generatedSentence[v]
}

//OnActions
addNewWord.onclick=function(e){addWord("new")}
addConstructedWord.onclick=function(e){addWord("constructed")}
addSystematicallyWord.onclick=function(e){addWord("systematically")}

findWordInput.oninput=function(e)
{
	var html=""
	for(var i in saveObject["words"])
	{
		var curWord=saveObject["words"][i]
		var t=genWordInfo(curWord).string
		if(t.match(findWordInput.value))
			html+="<option>"+t+"</option>"
	}
	wordsSelect.innerHTML=html
}

wordsSelect.onchange=function(e)
{
	wordInfoTextarea.value=objectToJson(saveObject["words"][wordsSelect.selectedOptions[0].value.substring(1).split("=")[0]])
}
wordInfoTextarea.oninput=function(e)
{
	saveObject["words"][JSON.parse(wordInfoTextarea.value)["id"]]=JSON.parse(wordInfoTextarea.value)
	saveObjectChanged()
}
//-Sentence
sentenceText.oninput=function(e){updateSentence(sentenceText)}
sentenceTexts.oninput=function(e){updateSentence(sentenceTexts)}
sentenceId.oninput=function(e){updateSentence(sentenceId)}
sentenceConstruction.oninput=function(e){updateSentence(sentenceConstruction)}
sentenceTranslation.oninput=function(e){updateSentence(sentenceTranslation)}
sentenceSpelling.oninput=function(e){updateSentence(sentenceSpelling)}
sentenceProps.oninput=function(e){updateSentence(sentenceProps)}
sentenceTranslationsJson.oninput=function(e){updateSentence(sentenceTranslationsJson)}

//-Command line
commandLine.onkeydown=function(e)
{
	if(e.key=="Enter")
	{
		var result=""
		switch(commandLine.value.toLowerCase().split(" ")[0])
		{
			case "getwords":
				count=0
				for(var k in saveObject["words"])
				{
					if(saveObject["words"][k].text=="?"||saveObject["words"][k].construction=="?"||saveObject["words"][k].systematicallyConstruction=="?")
						continue
					var wordsByMask=!saveObject["words"][k].systematicallyConstruction?[saveObject["words"][k]]:getWordsByMask(saveObject["words"][k])
					for(var l in wordsByMask)
					{
						var word=wordsByMask[l]
						result+="\n"+getWordInfo(word).string
						count++
					}
				}
				result+="\n"+count
				break
			case "getconflicts":
				var allWords=[]
				for(var k in saveObject["words"])
				{
					if(saveObject["words"][k].text=="?"||saveObject["words"][k].construction=="?"||saveObject["words"][k].systematicallyConstruction=="?")
						continue
					var wordsByMask=!saveObject["words"][k].systematicallyConstruction?[saveObject["words"][k]]:getWordsByMask(saveObject["words"][k])
					for(var l in wordsByMask)
						allWords.push([getWordInfo(wordsByMask[l]).text,wordsByMask[l].id])
				}
				for(var k in allWords)
					for(var j=0;j<k;j++)
						if(allWords[k][0]==allWords[j][0])
							result+="\n"+allWords[k][0]+" "+allWords[k][1]+" "+allWords[j][1]+" "+k+" "+j
				break
		}
		commandResult.value+="\n"+commandLine.value+" => "+result
	}
}

//Save Json
getSaveJSON.onclick=function(e)
{
	getSaveJsonArea.value=objectToJson(saveObject)
}
setSaveJSON.onclick=function(e)
{
	saveObject=JSON.parse(setSaveJsonArea.value)
	//
	genWordInfo_1=new RegExp("["+Object.keys(saveObject.letters).join("]|[")+"]","gi")
	genWordInfo_2=function(str){return saveObject.letters[str]}
	genWordInfo_3=new RegExp("["+Object.values(saveObject.letters).join("]|[")+"]","gi")
	genWordInfo_4_1={}
	for(var v in saveObject.letters)
		genWordInfo_4_1[saveObject.letters[v]]=v
	genWordInfo_4=function(str){return genWordInfo_4_1[str]}
	//
	saveObjectChanged()
}
saveJSONtoAddress.onclick=function(e)
{
	getSaveJSON.onclick()
	storage["languageAssistant.saveJSON."+saveAddress.value]=getSaveJsonArea.value
	storage["languageAssistant.lastSaveJSONaddress"]=saveAddress.value
}
loadJSONfromAddress.onclick=function(e)
{
	setSaveJsonArea.value=storage["languageAssistant.saveJSON."+saveAddress.value]
	storage["languageAssistant.lastSaveJSONaddress"]=saveAddress.value
	setSaveJSON.onclick()
}

//Load data
saveAddress.value=storage["languageAssistant.lastSaveJSONaddress"]
loadJSONfromAddress.onclick()
//
if(!saveObject.words)
	saveObject.words=[]
if(!saveObject.symbols)
	saveObject.symbols={}
if(!saveObject.letters)
	saveObject.letters={}
saveObjectChanged()
setSaveJsonArea.value=getSaveJsonArea.value
//ff 
wordPropsTextarea.value=objectToJson(wordPropsPattern)