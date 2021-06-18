let hvDebug=false;const hvVer="0.1.10";const hvColor1='color: #7bf542';const hvColor2='color: #d8eb34';const hvColor3='color: #ffffff';const hvColor4='color: #cccccc';const hvColor5='color: #ff0000';function isFunction(possibleFunction){return typeof(possibleFunction)===typeof(Function);}
Hooks.on('ready',async function(){console.log("%cHeroVau.lt/Foundry Bridge | %cinitializing",hvColor1,hvColor4);});Hooks.on('renderActorSheet',function(obj,html){const actor=obj.actor;v8=versionCompare(game.data.version,'0.8.5');if(hvDebug){if(v8==1)
console.log("%cHeroVau.lt/Foundry Bridge | %cCan user modify: "+actor.canUserModify(game.user,"update"),hvColor1,hvColor4);else
console.log("%cHeroVau.lt/Foundry Bridge | %cActor type: "+actor.data.type+"can update?: "+actor.can(game.user,"update"),hvColor1,hvColor4);}
if(!actor.data.type==="character")return;if(v8==1){if(actor.canUserModify(game.user,"update")==false)return;}
else{if(!(actor.data.type==="character"&&actor.can(game.user,"update")))return;}
let element=html.find(".window-header .window-title");if(element.length!=1)return;let vaultButton=$(`<a class="popout"><i class="fas fa-cloud"></i>Vault</a>`);vaultButton.on('click',()=>beginVaultConnection(obj.object));element.after(vaultButton);});function beginVaultConnection(targetActor,userToken){let applyChanges=false;let defaulttoken=Cookie.get('herovault_user_token');let skipTokenCookie=Cookie.get('herovault_skiptoken');if(skipTokenCookie){loadPersonalVault(targetActor,defaulttoken);}else{if(defaulttoken==null)
defaulttoken="";new Dialog({title:`HeroVau.lt Import`,content:`
        <div>
          <p>Enter your User Token from HeroVau.lt. You can find it on the <a href="https://herovau.lt/?action=myaccount">My Account</a> page on http://herovau.lt</p>
        <div>
        <hr/>
        <div id="divCode">
          <div id="divOuter">
            <div id="divInner">
              <input id="textBoxUserToken" type="text" maxlength="124" value="${defaulttoken}"/>
            </div>
          </div>
        </div>
        <div id="">
          <div id="divOuter">
            <div id="divInner">
              <input type="checkbox" id="skipToken" name="skipToken" value="true"><label for="skipToken"> Skip this screen in the future.</label>
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
        </style>`,buttons:{yes:{icon:"<i class='fas fa-check'></i>",label:`Load Vault`,callback:()=>applyChanges=true},no:{icon:"<i class='fas fa-times'></i>",label:`Cancel`},},default:"yes",close:html=>{if(applyChanges){let userToken=html.find('[id="textBoxUserToken"]')[0].value;let skipToken=html.find('[id="skipToken"]')[0].checked;Cookie.set('herovault_user_token',userToken,365);if(skipToken)
Cookie.set('herovault_skiptoken',skipToken,30);loadPersonalVault(targetActor,userToken);}}}).render(true);}}
function loadPersonalVault(targetActor,userToken){const gameSystem=game.data.system.id;let error=false;var xmlhttp=new XMLHttpRequest();xmlhttp.onreadystatechange=function(){if(this.readyState==4&&this.status==200){let responseJSON=JSON.parse(this.responseText);if(hvDebug)
console.log("%cHeroVau.lt/Foundry Bridge | %c"+responseJSON,hvColor1,hvColor4);if(responseJSON.hasOwnProperty("error")){if(hvDebug)
console.log("%cHeroVau.lt/Foundry Bridge | %cerror found in response",hvColor1,hvColor4);error=true;}
else
if(hvDebug)
console.log("%cHeroVau.lt/Foundry Bridge | %c"+Object.keys(responseJSON).length,hvColor1,hvColor4);if(error){new Dialog({title:`HeroVau.lt`,content:`
                 <div>
                    <h3>Error</h3>
                    <p>${responseJSON.error}<p>
                 </div><br>`,buttons:{yes:{icon:"<i class='fas fa-check'></i>",label:`Ok`}},default:"yes"}).render(true);}
else{if(Object.keys(responseJSON).length>=1){if(hvDebug)
console.log("%cHeroVau.lt/Foundry Bridge | %cCalling checkHLOCharacterIsCorrect",hvColor1,hvColor4);createPCTable(targetActor,responseJSON);}else{ui.notifications.warn("Unable load vault.  Please double-check your User Token.");Cookie.set('herovault_skiptoken',"",-1);return;}}}};console.log("%cHeroVau.lt/Foundry Bridge | %cusertoken: "+userToken,hvColor1,hvColor4);xmlhttp.open("GET","https://www.herovau.lt/foundrymodule.php?action=getvault&gamesystem="+encodeURIComponent(gameSystem)+"&hvVer="+hvVer+"&userToken="+encodeURIComponent(userToken),true);xmlhttp.send();}
function createPCTable(targetActor,responseJSON){if(hvDebug)
console.log("%cHeroVau.lt/Foundry Bridge | %cin createPCTable",hvColor1,hvColor4);var htmlOut="<strong>Select a PC from the list:</strong><br><br><select name='pcid' id='pcid'>";for(var pccount=0;pccount<responseJSON.length;pccount++)
{charName=responseJSON[pccount].charname;charRace=responseJSON[pccount].charrace;charClass=responseJSON[pccount].charclass;charLevel=responseJSON[pccount].charlevel;charuid=responseJSON[pccount].charuid;htmlOut=htmlOut+"<option value='"+charuid+"'>"+charName+": "+charRace+" "+charClass+" (Level "+charLevel+")</option>";}
htmlOut=htmlOut+"</select><br>";new Dialog({title:"Importable Character List",content:`
      <div>`+htmlOut+`</div><br><br>
      `,buttons:{yes:{icon:"<i class='fas fa-check'></i>",label:`Proceed`,callback:()=>pickedCharacter=true},no:{icon:"<i class='fas fa-times'></i>",label:`Cancel`,callback:()=>pickedCharacter=false},},default:"yes",close:html=>{if(pickedCharacter){console.log("yes clicked");let selectedCharUID=html.find('[id="pcid"]')[0].value;console.log("Selected PC id: "+selectedCharUID);requestCharacter(targetActor,selectedCharUID);}else{console.log("cancel clicked");}}}).render(true);}
function requestCharacter(targetActor,charUID){let error=false;var xmlhttp=new XMLHttpRequest();xmlhttp.onreadystatechange=function(){if(this.readyState==4&&this.status==200){let responseJSON=JSON.parse(this.responseText);if(hvDebug)
console.log("%cHeroVau.lt/Foundry Bridge | %c"+responseJSON,hvColor1,hvColor4);if(responseJSON.hasOwnProperty("error")){if(hvDebug)
console.log("%cHeroVau.lt/Foundry Bridge | %cerror found in response",hvColor1,hvColor4);error=true;}
else
if(hvDebug)
console.log("%cHeroVau.lt/Foundry Bridge | %c"+Object.keys(responseJSON).length,hvColor1,hvColor4);if(error){new Dialog({title:`HeroVau.lt`,content:`
                 <div>
                    <h3>Error</h3>
                    <p>${responseJSON.error}<p>
                    <p>Please contact us with this information above by going to <a href="https://herovau.lt/?action=contact">https://herovau.lt/?action=contact</a>.<p>
                 </div><br>`,buttons:{yes:{icon:"<i class='fas fa-check'></i>",label:`Ok`}},default:"yes"}).render(true);}
else{if(responseJSON.downloadURL){if(hvDebug)
console.log("%cHeroVau.lt/Foundry Bridge | %cGot the URL: "+responseJSON.downloadURL,hvColor1,hvColor4)
importCharacter(targetActor,responseJSON.downloadURL);}else{ui.notifications.warn("Unable find character.  Please contact HeroVau.lt support.");return;}}}};console.log("%cHeroVau.lt/Foundry Bridge | %ccharUID: "+charUID,hvColor1,hvColor4)
xmlhttp.open("GET","https://www.herovau.lt/foundrymodule.php?action=getCharacter&charUID="+encodeURIComponent(charUID),true);xmlhttp.send();}
async function importCharacter(targetActor,charURL){let error=false
var xmlhttp=new XMLHttpRequest();xmlhttp.onreadystatechange=function(){if(this.readyState==4&&this.status==200){let responseJSON=JSON.parse(this.responseText);if(hvDebug)
console.log("%cHeroVau.lt/Foundry Bridge | %c"+JSON.stringify(responseJSON),hvColor1,hvColor4);if(error){new Dialog({title:`HeroVau.lt`,content:`
                 <div>
                    <h3>Error</h3>
                    <p>${responseJSON.error}<p>
                    <p>Please contact us with this information above by going to <a href="https://herovau.lt/?action=contact">https://herovau.lt/?action=contact</a>.<p>
                 </div><br>`,buttons:{yes:{icon:"<i class='fas fa-check'></i>",label:`Ok`}},default:"yes"}).render(true);}
else{targetPCID=targetActor.data._id;let coreVersionMismatch=false;let systemVersionMismatch=false;let abort=false;let errMsg='';let systemVersion=game.system.data.version;let coreVersion=game.data.version;pcGameSystemVersion=responseJSON.flags.exportSource.systemVersion;pcCoreVersion=responseJSON.flags.exportSource.coreVersion;if(pcCoreVersion!=coreVersion){coreVersionMismatch=true;errMsg=errMsg+"This PC was exported from Foundry v"+pcCoreVersion+" and this game server is running Foundry v"+coreVersion+".<br><br>"}
if(pcGameSystemVersion!=systemVersion){systemVersionMismatch=true;if(versionCompare(pcGameSystemVersion,systemVersion)==1){abort=true;errMsg=errMsg+"This PC was exported from "+game.system.data.title+": "+pcGameSystemVersion+" and this game server is running "+game.system.data.title+": "+systemVersion+".<br><br>Unfortunately, game systems usually are not backwards compatible, so we are aborting this import. To manually override, please download the hero export from herovau.lt. <br><strong>This may break this PC -- you  have been warned!</strong><br><br>";}else
errMsg=errMsg+"This PC was exported from "+game.system.data.title+": "+pcGameSystemVersion+" and this game server is running "+game.system.data.title+": "+systemVersion+".<br><br>";}
if(hvDebug)
console.log("%cHeroVau.lt/Foundry Bridge | Mismatch?:%c"+systemVersionMismatch+" | "+coreVersionMismatch,hvColor1,hvColor4);if(systemVersionMismatch||coreVersionMismatch){errMsg=errMsg+"There may be compatibility issues."
let chatData={user:game.user._id,speaker:ChatMessage.getSpeaker(),content:errMsg,whisper:[game.user._id]};ChatMessage.create(chatData,{});if(abort)
return;}
if(responseJSON._id){importPCID=new RegExp(responseJSON._id,"g");charDataStr=JSON.stringify(responseJSON);if(hvDebug){console.log("%cHeroVau.lt/Foundry Bridge | Target ID:%c"+targetPCID,hvColor1,hvColor4);console.log("%cHeroVau.lt/Foundry Bridge | %c"+charDataStr,hvColor1,hvColor4);}
charDataStr=charDataStr.replace(importPCID,targetPCID);charImport=JSON.parse(charDataStr);}
else
{charImport=responseJSON;charImport._id=targetPCID}
if(charImport.token.sightAngle<1)
charImport.token.sightAngle=360
if(charImport.token.lightAngle<1)
charImport.token.lightAngle=360
console.log("%cHLO Importer | %c Importing "+charImport.name,hvColor1,hvColor4);targetActor.importFromJSON(JSON.stringify(charImport));}}};console.log("%cHeroVau.lt/Foundry Bridge | %cDownloading PC from: "+charURL,hvColor1,hvColor4);xmlhttp.open("GET",charURL,true);xmlhttp.send();}
var Cookie={set:function(name,value,days)
{var domain,domainParts,date,expires,host;if(days)
{date=new Date();date.setTime(date.getTime()+(days*86400000));expires="; expires="+date.toGMTString();}
else
{expires="";}
host=location.host;if(host.split('.').length===1)
{document.cookie=name+"="+value+expires+"; path=/";}
else
{domainParts=host.split('.');domainParts.shift();domain='.'+domainParts.join('.');document.cookie=name+"="+value+expires+"; path=/; domain="+domain;if(Cookie.get(name)==null||Cookie.get(name)!=value)
{domain='.'+host;document.cookie=name+"="+value+expires+"; path=/; domain="+domain;}}},get:function(name)
{var nameEQ=name+"=";var ca=document.cookie.split(';');for(var i=0;i<ca.length;i++)
{var c=ca[i];while(c.charAt(0)==' ')
{c=c.substring(1,c.length);}
if(c.indexOf(nameEQ)==0)return c.substring(nameEQ.length,c.length);}
return null;},erase:function(name)
{Cookie.set(name,'',-1);}};versionCompare=function(left,right){if(typeof left+typeof right!='stringstring')
return false;var a=left.split('.'),b=right.split('.'),i=0,len=Math.max(a.length,b.length);for(;i<len;i++){if((a[i]&&!b[i]&&parseInt(a[i])>0)||(parseInt(a[i])>parseInt(b[i]))){return 1;}else if((b[i]&&!a[i]&&parseInt(b[i])>0)||(parseInt(a[i])<parseInt(b[i]))){return-1;}}
return 0;}