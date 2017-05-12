//Load the Face Detection Data
var kairosDataPath = "Data/allKairos2.json";
var kairosData = null;
d3.json(kairosDataPath, function(json){
  kairosData = json;
  console.log("Kairos Data: ");
  console.log(kairosData);
});


//Load the On Display Data
var collectionDataPath = "Data/collection.json";
var collectionData = [];
var nbWithoutDisplay = 0;
d3.json(collectionDataPath, function(json){
  collectionData = json;
  console.log("Collection Data: ");
  console.log(collectionData);
});


// URL for the API Search
//var searchUrl = "https://www.rijksmuseum.nl/api/en/collection?key=rgAMNabw&format=json&ps=100&type=painting&imgonly=True&ondisplay=False";
var searchUrl = "https://www.rijksmuseum.nl/api/en/collection?key=rgAMNabw&format=json&ps=100&type=painting&imgonly=True&ondisplay=False&title=Portrait&credits=Loan";
// Number of elements in the collection
var collectionCnt = 4299;

//Placeholder for the data which interests us
var paintingsWithFaces = [];
var facesCount = 0;
var facesData = [];

//Parameters for the thumbnails
var maxWidthHeight = 300;
var ratioAroundHead = 1.8;
var numberOfDistanceRelations = 30;
var numberOfFriendsInTab = 4;

//Search the whole collection and display the iceberg at the end
//advSearch(searchUrl);

StartFacebook();

function StartFacebook(){
  if (collectionData.collection == null){
    setTimeout(StartFacebook,500);
    return;
  }
  console.log("Aggregate = "+collectionData.collection.length+" & Count = "+ collectionCnt);
  while(collectionData.collection.length != collectionCnt){
    setTimeout(StartFacebook,500);
    return;
  }

  for (var i = 0; i < kairosData.paintings.length; i++){
    if ((kairosData.paintings[i].images) != null){
      //Update the paintingsWithFaces array
      var painting = getCollectionPaintingById(kairosData.paintings[i].paintingId)[0];
      painting["faces"] = kairosData.paintings[i].images[0].faces;
      painting["facesIds"] = [];
      paintingsWithFaces.push(painting);

      //Update the Faces array
      for (var j = 0; j < kairosData.paintings[i].images[0].faces.length; j++){
        var face = kairosData.paintings[i].images[0].faces[j];
        face["paintingId"] = kairosData.paintings[i].paintingId;
        face["webImage"] = painting.artObject.webImage;
        painting["facesIds"].push(facesCount);
        face["faceId"] = facesCount++;
        facesData.push(face);
      }
    }
  }

  //Print the data of the whole collection
  console.log("Paintings With Faces Data:");
  console.log(paintingsWithFaces);

  //Print the data of the whole collection
  console.log("Faces Data:");
  console.log(facesData);

  updateFacebookPage(160);
  //updateFacebookPage(2);
}

function updateFacebookPage(faceId){
  ResetPage();
  var tempFacesArray = facesData.slice(0);

  var indexesInPainting = getPaintingById(getFaceById(faceId)[0].paintingId)[0].facesIds.slice(0);
  indexesInPainting.sort(function(a, b) {
    return b - a;
  });

  var totNumberFaces = tempFacesArray.length;
  var nbFacesRemoved = 0;
  var mainFace = null;
  var otherFaces = [];
  for (var i = 0; i < indexesInPainting.length; i++){
    if (indexesInPainting[i] == faceId){
      mainFace = tempFacesArray.splice(indexesInPainting[i], 1)[0];
    }
    else{
      otherFaces.push(tempFacesArray.splice(indexesInPainting[i], 1)[0]);
    }
    nbFacesRemoved++;
  }
  var mainPainting = getPaintingById(getFaceById(faceId)[0].paintingId)[0].artObject;
  var onDisplay = getPaintingById(getFaceById(faceId)[0].paintingId)[0].onDisplay;

  //console.log(mainFace);
  //console.log(otherFaces);
  //console.log(mainPainting);
  //console.log("Number of faces removed: "+nbFacesRemoved);

  var randomFacesArray = [];
  while (nbFacesRemoved != totNumberFaces){
    var randomIndex = Math.floor(Math.random() * tempFacesArray.length);
    randomFacesArray.push(tempFacesArray.splice(randomIndex, 1)[0])
    nbFacesRemoved ++;
  }
  console.log(randomFacesArray);

  updateProfilePicture(mainFace, mainPainting);
  updateFriends(otherFaces, mainPainting, randomFacesArray);
  updateProfileContent(mainPainting, onDisplay, mainFace);
  updateMaker(mainPainting);
  updateHome(mainPainting);
}

function ResetPage(){
  d3.select("#closeFriendsSvgs").selectAll("*").remove();
  d3.select("#distantRelationsSvgs").selectAll("*").remove();
  d3.select("#profilePicSvg").selectAll("*").remove();
}

function updateProfilePicture(mainFace, mainPainting){
  var faceW = $("#profilePicSvg").width() / ratioAroundHead;
  var imagesSVG = d3.select("#profilePicSvg")
                    .attr("x", "0")
                    .attr("y", "0")
                    .classed("clip-circle", "true");

  fillSvgWithFace(imagesSVG, faceW, mainFace, mainPainting.webImage, false);
}

function updateProfileContent(mainPainting, onDisplay, mainFace){
    console.log(mainFace);
    var eth = null;
    var maxEth = Math.max(mainFace.attributes.asian, mainFace.attributes.black, mainFace.attributes.hispanic, mainFace.attributes.other, mainFace.attributes.white);
    if (maxEth == mainFace.attributes.asian){
      eth = "Asian";
    }
    else if (maxEth == mainFace.attributes.black){
      eth = "Black";
    }
    else if (maxEth == mainFace.attributes.hispanic){
      eth = "Hispanic";
    }
    else if (maxEth == mainFace.attributes.other){
      eth = "Other";
    }
    else{
      eth = "White";
    }
    var gen = null;
    if (mainFace.attributes.gender.type = "F"){
      gen = "Female";
    }
    else {
      gen = "Male";
    }
    var h = mainFace.height / mainPainting.webImage.height * mainPainting.dimensions[0].value;
    var w = mainFace.width / mainPainting.webImage.width * mainPainting.dimensions[1].value;
    var tx = "Yes";
    if (onDisplay){
      tx = "No";
    }


    d3.select("#birthday").html(mainPainting.dating.year);
    d3.select("#skin").html(mainPainting.physicalMedium);
    d3.select("#ethnicity").html(eth);
    d3.select("#gender").html(gen);
    d3.select("#onDisplay").html(tx);
    d3.select("#faceHeight").html(h.toFixed(1)+" cm");
    d3.select("#faceWidth").html(w.toFixed(1)+" cm");
}

function updateMaker(mainPainting){
    d3.select("#makerName").html(mainPainting.principalOrFirstMaker);
    d3.select("#makerBirthDate").html(mainPainting.principalMakers[0].dateOfBirth);
    d3.select("#makerDeathDate").html(mainPainting.principalMakers[0].dateOfDeath);
    d3.select("#makerBirthPlace").html(mainPainting.principalMakers[0].placeOfBirth);
    d3.select("#makerDeathPlace").html(mainPainting.principalMakers[0].placeOfDeath);
    d3.select("#makerNationality").html(mainPainting.principalMakers[0].nationality);
}

function updateHome(mainPainting){
  $("#paintingImg").attr("src", mainPainting.webImage.url);
  console.log(mainPainting);
  if (mainPainting.label.title != null){
    d3.select("#paintingTitle").html(mainPainting.label.title);
  }
  else{
      d3.select("#paintingTitle").html(mainPainting.title);
  }
}

function updateFriends(otherFaces, mainPainting, randomFacesArray){

  var relativePaddingX= 0.1;
  console.log(otherFaces);
  if (otherFaces.length == 0){
    $("#closeFriendsDiv").hide();
  }
  else{
    $("#closeFriendsDiv").show();
    var idArrays = fillSvgWithSvgs("#closeFriendsSvgs", otherFaces, numberOfFriendsInTab, relativePaddingX, "closeFriend");
    for (var i = 0; i < idArrays.length; i++){
      var faceW = $("#"+idArrays[i]).width() / ratioAroundHead;
      fillSvgWithFace(d3.select("#"+idArrays[i]), faceW, otherFaces[i], mainPainting.webImage, true);
    }
  }


    relationsSvgId = "#distantRelationsSvgs";

    var otherIdArray = fillSvgWithSvgs(relationsSvgId, randomFacesArray.slice(0,numberOfDistanceRelations), numberOfFriendsInTab, relativePaddingX, "distantFriend");
    for (var i = 0; i < otherIdArray.length; i++){
      var faceW = $("#"+otherIdArray[i]).width() / ratioAroundHead;
      fillSvgWithFace(d3.select("#"+otherIdArray[i]), faceW, randomFacesArray[i], getPaintingById(randomFacesArray[i].paintingId)[0].artObject.webImage, true);
    }
}

function fillSvgWithSvgs(svgId, facesData, nbPerTab, relativePadding, idPrefix){
  var bigWidth = $(svgId).width();
  var gap = bigWidth / (nbPerTab);
  //var smallWidth = Math.floor(gap - 2 * relativePadding * gap);
  var smallWidth = gap;
  var bigHeight = 0;
  var idArrays = [];
  var svgsD3 = d3.select(svgId)
                 .selectAll("svg")
                 .data(facesData)
                 .enter()
                 .append("svg")
                 .attr("width", smallWidth)
                 .attr("height", smallWidth)
                 .attr("x", function(d, i){
                   var inCol = i % nbPerTab;
                   return Math.floor(inCol * gap + relativePadding * gap);
                 })
                 .attr("y", function(d, i){
                  var inRow = Math.floor(i / nbPerTab);
                  if (i == facesData.length - 1){
                    bigHeight = Math.floor((inRow + 1) * gap);
                  }
                  return Math.floor(inRow * gap + relativePadding * gap);
                })
                .attr("id", function(d, i){
                  idArrays[i] = idPrefix+i;
                  return idArrays[i];
                });

   d3.select(svgId).attr("height", bigHeight + gap);
   return idArrays;
}

function fillSvgWithFace(svgD3, faceW, face, webImage, clickable){
  if (clickable){
    svgD3.classed("brightness", "true");
  }
  svgD3.append("svg:image")
         .attr("x", function(){
           var offsetLeft = face.topLeftX * faceW / face.width -  faceW * (ratioAroundHead - 1) / 2;
           return -1 * offsetLeft;
         })
         .attr("y", function(){
           var offsetTop = face.topLeftY * faceW  / face.width - face.height / face.width * faceW * (ratioAroundHead - 1) / 2;
           return -1 * offsetTop;
         })
         .attr("width", function(){
           return webImage.width * faceW  / face.width;
         })
         .attr("height", function(){
           return webImage.height * faceW / face.width;
         })
         .attr("xlink:href", function(){
            if (webImage == null){
              return "Data/Copyright.PNG";
            }
            return webImage.url;
          })
          .on('click', function(){
            if (clickable){
              updateFacebookPage(face.faceId);
            }
          });
}


function advSearch(piecesUrl){
  //Reset parameters
  progressBar.style.width = 0 + '%';
  d3.select("#xAxis").selectAll("*").remove();
  d3.select("#icebergTop").selectAll("*").remove();
  d3.select("#icebergBottom").selectAll("*").remove();
  collectionData = [];

  var nbInOnePage = 100;

  d3.json(piecesUrl, function (json) {
    collectionCnt = json.count;
    console.log("Number of elements found: "+json.count);
    //Go through the number of pages
    for ( j = 1; j < Math.floor( (parseInt(json.count) - 1) / nbInOnePage) +2; j++){
      var pageUrl = searchUrl+"&p="+j;
      SearchPage(pageUrl, j, nbInOnePage);
    }

  });

  DisplayIceberg();

}

function SearchPage(pageUrl, pageNb, nbInOnePage){
  d3.json(pageUrl, function (json2) {
    console.log("Going through page "+pageNb);
    for (var i = 0; i < parseInt(json2.artObjects.length); i++){
      SearchPainting(json2.artObjects[i].objectNumber);
    }
  });
}

function SearchPainting(objNumber, nb){
  var url = "https://www.rijksmuseum.nl/api/en/collection/"+objNumber+"?key=rgAMNabw&format=json";

  d3.json(url, function (json) {
    var paintingData = json;

    if (!paintingData.artObject.hasImage){
      return;
    }

    paintingData["onDisplay"] = getOnDisplayById(objNumber.toLowerCase());
    if (paintingData["onDisplay"].length == 0){
      console.log("Pas de onDisplay Data pour: "+ objNumber.toLowerCase());
      nbWithoutDisplay++;
    }
    collectionData.push(paintingData);
  });
}

function getCollectionPaintingById(ptingId) {
  return collectionData.collection.filter(
      function(element){ return element.paintingId == ptingId }
  );
}

function getPaintingById(ptingId) {
  return paintingsWithFaces.filter(
      function(element){ return element.paintingId == ptingId }
  );
}

function getFaceById(faceId) {
  return facesData.filter(
      function(element){ return element.faceId == faceId }
  );
}
