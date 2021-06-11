let debug = true;
const hvVer="0.1.0";

const color1='color: #7bf542';  //bright green
const color2='color: #d8eb34'; //yellow green
const color3='color: #ffffff'; //white
const color4='color: #cccccc'; //gray
const color5='color: #ff0000'; //red

function isFunction(possibleFunction) {
  return typeof(possibleFunction) === typeof(Function);
}

Hooks.on('ready', async function() {
  console.log("%cHeroVau.lt/Foundry Bridge | %cinitializing",color1,color4);
});

Hooks.on('renderActorSheet', function(obj, html){
  const actor = obj.actor;
  v8=isFunction(actor.canUserModify);
  // Only inject the link if the actor is of type "character" and the user has permission to update it
  if (debug) {
    if (v8)
      console.log("%cHeroVau.lt/Foundry Bridge | %cCan user modify: " + actor.canUserModify(game.user, "update"),color1,color4)
    else
      console.log("%cHeroVau.lt/Foundry Bridge | %cActor type: " + actor.data.type + "can update?: " + actor.can(game.user, "update"),color1,color4)
  }
    
  if (!actor.data.type === "character") return;

  if (v8)
    if (actor.canUserModify(game.user, "update")==false) return;
  else
    if (!(actor.data.type === "character" && actor.can(game.user, "update"))) return;
  
  let element = html.find(".window-header .window-title");
  if (element.length != 1) return;
  
  let button = $(`<a class="popout" style><i class="fas fa-cloud"></i>Vault</a>`);

  button.on('click', () => beginVaultConnection(obj.object));
  element.after(button);
});
  
function beginVaultConnection(targetActor,userToken){
  let applyChanges=false;
  new Dialog({
    title: `Herolab Online Import`,
    content: `
      
      <div>
        <p>Enter your User Token from HeroVau.lt. You can find it on the My Account page.</p>
      <div>
      <hr/>
      <div id="divCode">
        <div id="divOuter">
          <div id="divInner">
            <input id="textBoxUserToken" type="text" maxlength="124" value="19a9e69d50ce2b86"/>
          </div>
        </div>
      </div>
      <br/>
      <style>
      
        #textBoxElementID {
            border: 0px;
            padding-left: 2px;
            letter-spacing: 1px;
            width: 330px;
            min-width: 330px;
          }
          
          #divInner{
            left: 0;
            position: sticky;
          }
          
          #divOuter{
            width: 285px; 
            overflow: hidden;
          }
  
          #divCode{  
            border: 1px solid black;
            width: 300px;
            margin: 0 auto;
            padding: 5px;
          }
  
      </style>
      `,
    buttons: {
      yes: {
        icon: "<i class='fas fa-check'></i>",
        label: `Load Vault`,
        callback: () => applyChanges = true
      },
      no: {
        icon: "<i class='fas fa-times'></i>",
        label: `Cancel`
      },
    },
    default: "yes",
    close: html => {
      if (applyChanges) {
         
         let userToken= html.find('[id="textBoxUserToken"]')[0].value;
 
         loadPersonalVault(targetActor, userToken);
  
      }
    }
  }).render(true);

}

function loadPersonalVault(targetActor, userToken){
    const gameSystem=game.data.system.id;
    let error=false
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        let responseJSON = JSON.parse(this.responseText);
        if (debug) 
            console.log("%cHeroVau.lt/Foundry Bridge | %c"+responseJSON,color1,color4);
        if (responseJSON.hasOwnProperty("error")) {
          if (debug)
             console.log("%cHeroVau.lt/Foundry Bridge | %cerror found in response",color1,color4)
          error=true
        }
        else
          if (debug)
            console.log("%cHeroVau.lt/Foundry Bridge | %c"+Object.keys(responseJSON).length,color1,color4)

        if (error){
          new Dialog({
            title: `HeroVau.lt`,
            content: `
                 <div>
                    <h3>Error</h3>
                    <p>${responseJSON.error}<p>
                 </div><br>`,
            buttons: {
              yes: {
                icon: "<i class='fas fa-check'></i>",
                label: `Ok`
              }
            },
            default: "yes"
          }).render(true);
        }
        else {
          if (Object.keys(responseJSON).length>=1){
            if (debug)
              console.log("%cHeroVau.lt/Foundry Bridge | %cCalling checkHLOCharacterIsCorrect",color1,color4)
              createPCTable(targetActor, responseJSON);
          } else {
            ui.notifications.warn("Unable load vault.  Please double-check your User Token.");
            return;
        }
      }
        
      // console.log("%cHeroVau.lt/Foundry Bridge | %creadyState: "+this.readyState,color1,color4)
      }
    };
    console.log("%cHeroVau.lt/Foundry Bridge | %cusertoken: " + userToken,color1,color4)
    xmlhttp.open("GET", "https://www.herovau.lt/foundrymodule.php?action=getvault&gamesystem="+encodeURIComponent(gameSystem)+"&hvVer="+hvVer+"&userToken="+encodeURIComponent(userToken), true);
    xmlhttp.send();

}

function createPCTable(targetActor,responseJSON){
  if (debug){
    console.log("%cHeroVau.lt/Foundry Bridge | %cin createPCTable",color1,color4)
    console.log("%cHeroVau.lt/Foundry Bridge | %c"+responseJSON,color1,color4)
  }
  var htmlOut="<strong>Select a PC from the list:</strong><br><br><select name='pcid' id='pcid'>";
  for (var pccount=0; pccount<responseJSON.length; pccount++)
  {
    charName=responseJSON[pccount].charname;
    charRace=responseJSON[pccount].charrace;
    charClass=responseJSON[pccount].charclass;
    charLevel=responseJSON[pccount].charlevel;
    charuid=responseJSON[pccount].charuid;
    htmlOut=htmlOut+"<option value='"+charuid+"'>"+charName+": "+charRace+ " " + charClass+ " (Level "+charLevel+")</option>";
  }
  htmlOut=htmlOut+"</select><br>";
  new Dialog({
    title: "Importable Character List",
    content: `
      <div>`+htmlOut+`</div><br><br>
      `,
    buttons: {
      yes: {
        icon: "<i class='fas fa-check'></i>",
        label: `Proceed`,
        callback: () => pickedCharacter = true
      },
      no: {
        icon: "<i class='fas fa-times'></i>",
        label: `Cancel`,
        callback: () => pickedCharacter = false
      },
    },
    default: "yes",
    close: html => {
      if (pickedCharacter) {
        console.log("yes clicked")
        let selectedCharUID= html.find('[id="pcid"]')[0].value;
        console.log("Selected PC id: "+selectedCharUID);
        requestCharacter(targetActor, selectedCharUID);
      } else {
        console.log("cancel clicked")
      }
    }
  }).render(true);


}

function requestCharacter(targetActor,charUID){
    let error=false
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        let responseJSON = JSON.parse(this.responseText);
        if (debug) 
            console.log("%cHeroVau.lt/Foundry Bridge | %c"+responseJSON,color1,color4);
        if (responseJSON.hasOwnProperty("error")) {
          if (debug)
             console.log("%cHeroVau.lt/Foundry Bridge | %cerror found in response",color1,color4)
          error=true
        }
        else
          if (debug)
            console.log("%cHeroVau.lt/Foundry Bridge | %c"+Object.keys(responseJSON).length,color1,color4)

        if (error){
          new Dialog({
            title: `HeroVau.lt`,
            content: `
                 <div>
                    <h3>Error</h3>
                    <p>${responseJSON.error}<p>
                    <p>Please contact us with this information above by going to <a href="https://herovau.lt/?action=contact">https://herovau.lt/?action=contact</a>.<p>
                 </div><br>`,
            buttons: {
              yes: {
                icon: "<i class='fas fa-check'></i>",
                label: `Ok`
              }
            },
            default: "yes"
          }).render(true);
        }
        else {
          if (responseJSON.downloadURL){
            if (debug)
              console.log("%cHeroVau.lt/Foundry Bridge | %cGot the URL: "+responseJSON.downloadURL,color1,color4)
              importCharacter(targetActor, responseJSON.downloadURL);
          } else {
            ui.notifications.warn("Unable find character.  Please contact HeroVau.lt support.");
            return;
        }
      }
        
      // console.log("%cHeroVau.lt/Foundry Bridge | %creadyState: "+this.readyState,color1,color4)
      }
    };
    console.log("%cHeroVau.lt/Foundry Bridge | %ccharUID: " + charUID,color1,color4)
    xmlhttp.open("GET", "https://www.herovau.lt/foundrymodule.php?action=getCharacter&charUID="+encodeURIComponent(charUID), true);
    xmlhttp.send();
}


async function importCharacter(targetActor, charURL){
    let error=false
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        let responseJSON = JSON.parse(this.responseText);
        if (debug) 
            console.log("%cHeroVau.lt/Foundry Bridge | %c"+responseJSON,color1,color4);
        if (error){
          new Dialog({
            title: `HeroVau.lt`,
            content: `
                 <div>
                    <h3>Error</h3>
                    <p>${responseJSON.error}<p>
                    <p>Please contact us with this information above by going to <a href="https://herovau.lt/?action=contact">https://herovau.lt/?action=contact</a>.<p>
                 </div><br>`,
            buttons: {
              yes: {
                icon: "<i class='fas fa-check'></i>",
                label: `Ok`
              }
            },
            default: "yes"
          }).render(true);
        }
        else {
          responseJSON
          importPCID=new RegExp(responseJSON._id, "g")
          targetPCID=targetActor.data._id
          charDataStr=JSON.stringify(responseJSON)
          charDataStr=charDataStr.replace(importPCID,targetPCID)
          charImport=JSON.parse(charDataStr)
          console.log("%cHLO Importer | %c Importing "+charImport.name,color1,color4)  
          targetActor.importFromJSON(JSON.stringify(charImport));
      }
        
      // console.log("%cHeroVau.lt/Foundry Bridge | %creadyState: "+this.readyState,color1,color4)
      }
    };
    console.log("%cHeroVau.lt/Foundry Bridge | %cDownloading PC from: " + charURL,color1,color4)
    xmlhttp.open("GET", charURL, true);
    xmlhttp.send();
}