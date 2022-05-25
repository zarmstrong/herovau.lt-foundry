let hvDebug=!1;const hvVer="0.7.2";let heroVaultURL="https://herovau.lt";const hvColor1="color: #7bf542",hvColor2="color: #d8eb34",hvColor3="color: #ffffff",hvColor4="color: #cccccc",hvColor5="color: #ff0000";let HLOuserToken,hvUserToken,skipTokenPrompt,enableHLO=!0,enablePB=!0,pfsEnabled=!0,proto="https";function setHLOToken(){HLOuserToken=game.settings.get("herovaultfoundry","hlouserToken")}function checkUserToken(token){var xmlhttp=new XMLHttpRequest;xmlhttp.onreadystatechange=function(){if(4==this.readyState&&200==this.status){var responseJSON=JSON.parse(this.responseText);return hvDebug&&console.log("%cHeroVau.lt/Foundry Bridge | %ccheckUserToken: "+JSON.stringify(responseJSON),hvColor1,hvColor4),skipTokenPrompt=1==responseJSON.status?(hvUserToken=token,game.settings.set("herovaultfoundry","userToken",token),game.settings.set("herovaultfoundry","skipTokenPrompt",!0),!0):(hvUserToken="",game.settings.set("herovaultfoundry","userToken",null),game.settings.set("herovaultfoundry","skipTokenPrompt",!1),!1)}},hvDebug&&console.log("%cHeroVau.lt/Foundry Bridge | %c/foundrymodule.php?action=iv&userToken="+token,hvColor1,hvColor4),xmlhttp.open("GET",heroVaultURL+"/foundrymodule.php?action=iv&userToken="+token,!0),xmlhttp.send()}function checkNextAction(obj){game.modules.get("herovaultfoundry")?.active?pickAFunction(obj):skipTokenPrompt?(hvDebug&&console.log("%cHeroVau.lt/Foundry Bridge | %cCalling herovaultmenu",hvColor1,hvColor4),herovaultMenu(obj)):(null==hvUserToken&&(hvUserToken=""),getVaultToken(herovaultMenu,targetActor))}async function loadPB(obj){game.modules.get("pathbuilder2e-import")?.api?.beginPathbuilderImport(obj,!0)}async function loadHLO(obj){game.modules.get("hlo-importer")?.api?.hloShim(obj)}async function pickAFunction(obj){let hloImport=!1,hvImport=!1,pbImport=!1,PFSPC=!1,dopt={width:400,height:"auto"},menuButtons={heroVaultImport:{icon:"<i class='fas fa-cloud'></i>",label:"HeroVau.lt Import/Export",callback:()=>hvImport=!0}};"pf2e"==game.system.id&&game.modules.get("hlo-importer")?.active&&enableHLO&&(menuButtons={...menuButtons,hloimport:{icon:"<i class='fas fa-flask'></i>",label:"Import from Herolab Online",callback:()=>hloImport=!0}},dopt.width+=100),"pf2e"==game.system.id&&game.modules.get("pathbuilder2e-import")?.active&&enablePB&&(menuButtons={...menuButtons,pbimport:{icon:"<i class='fas fa-check'></i>",label:"Import from Pathbuilder 2e",callback:()=>pbImport=!0}},dopt.width+=100),"pf2e"==game.system.id&&pfsEnabled&&(menuButtons={...menuButtons,pfsimport:{icon:"<i class='fas fa-search'></i>",label:"Find & Import a PFS PC",callback:()=>PFSPC=!0}},dopt.width+=100),menuButtons={...menuButtons,no:{icon:"<i class='fas fa-times'></i>",label:"Cancel"}},new Dialog({title:"HeroVau.lt Import",content:`
      <div>
        <p>Please select the importer you'd like to use from the options below.</p>
      <div>
      <hr/>`,buttons:menuButtons,default:"no",close:html=>{hvImport?beginVaultConnection(obj):hloImport?loadHLO(obj):pbImport?loadPB(obj):PFSPC&&pfsDialogue(obj)}},dopt).render(!0)}function pfsDialogue(obj){let pfsnumber,pfscharnumber,searchPFS;new Dialog({title:"Pathfinder Society Import",content:`
        <div>
          <p>Enter the PFS character number you wish to search for.</p>
          <br>
        <div>
        <hr/>
        <div id="divCode">
          PFS Number (Number before the dash)<br>
          <div id="divOuter">
            <div id="divInner">
              <input id="pfsnumber" type="text" maxlength="14" />
            </div>
          </div>
        </div>
        <div id="divCode">
          PFS Character Number (Number after the dash)<br>
          <div id="divOuter">
            <div id="divInner">
              <input id="pfscharnumber" type="text" maxlength="5" value="200" />
            </div>
          </div>
        </div>
        <br><br>
        <style>        
          #pfsnumber {
              border: 0px;
              padding-left: 5px;
              letter-spacing: 2px;
              width: 330px;
              min-width: 330px;
            }
          #pfscharnumber {
              border: 0px;
              padding-left: 5px;
              letter-spacing: 2px;
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
        `,buttons:{yes:{icon:"<i class='fas fa-check'></i>",label:"Import",callback:()=>searchPFS=!0},no:{icon:"<i class='fas fa-times'></i>",label:"Cancel"}},default:"yes",close:html=>{searchPFS&&(pfsnumber=html.find('[id="pfsnumber"]')[0].value,pfscharnumber=html.find('[id="pfscharnumber"]')[0].value,hvDebug&&console.log("%cHeroVau.lt/Foundry Bridge | %cSearching for "+pfsnumber+"-"+pfscharnumber,hvColor1,hvColor4),findPFS(obj,pfsnumber,pfscharnumber))}}).render(!0)}function findPFS(obj,pfsnumber,pfscharnumber){game.settings.get("herovaultfoundry","userToken");var xmlhttp=new XMLHttpRequest;xmlhttp.onreadystatechange=function(){var responseJSON;4==this.readyState&&200==this.status&&(responseJSON=JSON.parse(this.responseText),hvDebug&&console.log("%cHeroVau.lt/Foundry Bridge | %c"+JSON.stringify(responseJSON),hvColor1,hvColor4),1<=Object.keys(responseJSON).length?(hvDebug&&console.log("%cHeroVau.lt/Foundry Bridge | %cCalling createPCTable",hvColor1,hvColor4),createPCTable(obj,responseJSON)):ui.notifications.error("Unable to find any results."))},hvDebug&&console.log("%cHeroVau.lt/Foundry Bridge | %c/foundrymodule.php?action=findPFS&pfsnumber="+pfsnumber+"&pfscharnumber="+pfscharnumber,hvColor1,hvColor4),xmlhttp.open("GET",heroVaultURL+"/foundrymodule.php?action=findPFS&pfsnumber="+pfsnumber+"&pfscharnumber="+pfscharnumber,!0),xmlhttp.send()}function getVaultToken(callback,callbackArg1,callbackArg2,callbackArg3,callbackArg4){let applyChanges=!1;null==hvUserToken&&(hvUserToken=""),new Dialog({title:"Connect to HeroVau.lt",content:`
      <div>
        <p>Enter your User Token from HeroVau.lt. You can find it on the <a href="https://herovau.lt/?action=myaccount">My Account</a> page on http://herovau.lt</p>
      <div>
      <hr/>
      <div id="divCode">
        <div id="divOuter">
          <div id="divInner">
            <input id="textBoxUserToken" type="text" maxlength="124" value="${hvUserToken}"/>
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
      </style>`,buttons:{yes:{icon:"<i class='fas fa-check'></i>",label:"Connect to HeroVau.lt",callback:()=>applyChanges=!0},no:{icon:"<i class='fas fa-times'></i>",label:"Cancel"}},default:"yes",close:skipToken=>{var userToken;applyChanges&&(userToken=skipToken.find('[id="textBoxUserToken"]')[0].value,skipToken=skipToken.find('[id="skipToken"]')[0].checked,checkUserToken(userToken),hvUserToken=userToken,skipToken&&game.settings.set("herovaultfoundry","skipTokenPrompt",!0),callback(callbackArg1,callbackArg2,callbackArg3,callbackArg4))}}).render(!0)}async function exportToHV(targetActor){try{var hvUserToken=game.settings.get("herovaultfoundry","userToken"),xmlhttp=new XMLHttpRequest;xmlhttp.onreadystatechange=function(){var responseJSON;4==this.readyState&&200==this.status&&(responseJSON=JSON.parse(this.responseText),hvDebug&&console.log("%cHeroVau.lt/Foundry Bridge | %c"+JSON.stringify(responseJSON),hvColor1,hvColor4),1==responseJSON.status?performExportToHV(targetActor):(hvUserToken="",game.settings.set("herovaultfoundry","userToken",null),ui.notifications.warn("Unable to load vault.  Please double-check your User Token."),game.settings.set("herovaultfoundry","skipTokenPrompt",!1),getVaultToken(exportToHV,targetActor,hvUserToken)))},hvDebug&&console.log("%cHeroVau.lt/Foundry Bridge | %c/foundrymodule.php?action=iv&userToken="+hvUserToken,hvColor1,hvColor4),xmlhttp.open("GET",heroVaultURL+"/foundrymodule.php?action=iv&userToken="+hvUserToken,!0),xmlhttp.send()}catch(e){console.log(e)}}async function performExportToHV(targetActor){try{let menuButtons={},exportNewPC=!1,exportOverwritePC=!1;var vaultInfo,accChk;let canOverwrite=!1,portrait,hvUID,portraitAddress,tokenAddress;hvUserToken=game.settings.get("herovaultfoundry","userToken"),portrait="icons/svg/mystery-man.svg",null!=targetActor.data.img&&null!=targetActor.data.token.img&&(portrait=(-1!=targetActor.data.img.includes("mystery-man")&&-1==targetActor.data.token.img.includes("mystery-man")?targetActor.data.token:targetActor.data).img,hvDebug&&console.log("%cHeroVau.lt/Foundry Bridge | %cportrait includes: "+targetActor.data.img.includes("http"),hvColor1,hvColor4),0==targetActor.data.img.includes("http")&&(portraitAddress=game.data.addresses.remote+targetActor.data.img.trim(),hvDebug&&(console.log("%cHeroVau.lt/Foundry Bridge | %c target: "+targetActor,hvColor1,hvColor4),console.log("%cHeroVau.lt/Foundry Bridge | %cportrait: "+portraitAddress,hvColor1,hvColor4),console.log("%cHeroVau.lt/Foundry Bridge | %csheet portrait: "+targetActor.data.img,hvColor1,hvColor4))),0==targetActor.data.token.img.includes("http")&&(tokenAddress=game.data.addresses.remote+targetActor.data.token.img.trim(),await targetActor.update({"data.token.img":tokenAddress}),hvDebug&&(console.log("%cHeroVau.lt/Foundry Bridge | %ctoken: "+tokenAddress,hvColor1,hvColor4),console.log("%cHeroVau.lt/Foundry Bridge | %csheet token: "+targetActor.data.token.img,hvColor1,hvColor4)))),hasProperty(targetActor,"data.flags.herovault.uid")&&(hvUID=targetActor.data.flags.herovault.uid,accChk=await checkForAccess(hvUserToken,hvUID),canOverwrite=accChk.canAccess),vaultInfo=await getVaultSlots(hvUserToken),hvDebug&&console.log("%cHeroVau.lt/Foundry Bridge | %cvaultInfo: "+JSON.stringify(vaultInfo),hvColor1,hvColor4);var totalSlots=vaultInfo.totalSlots,freeSlots=totalSlots-vaultInfo.usedSlots;let bdy=`<div><p>You have ${freeSlots}/${totalSlots} character slots free.</p><div><hr/>`;hvDebug&&console.log("%cHeroVau.lt/Foundry Bridge | %ccan access/overwrite?: "+canOverwrite,hvColor1,hvColor4),freeSlots<1&&0==canOverwrite?(bdy='<div><p>Unfortunately you do not have enough open slots in your <a href="https://herovau.lt">HeroVau.lt</a> to export this PC.<br>Please upgrade your account or delete a PC from your account to free up some space.</p><div><hr/>',new Dialog({title:"Export to your HeroVau.lt",content:bdy,buttons:{yes:{icon:"<i class='fas fa-check'></i>",label:"Ok"}},default:"yes"}).render(!0)):(0<freeSlots?(menuButtons={...menuButtons,exportNew:{icon:"<i class='fas fa-file-export'></i>",label:"Export to HeroVau.lt as New PC",callback:()=>exportNewPC=!0}},bdy+="<div><p>You can export this character as a new PC, taking up a slot on your account. <br><small>(Note: if the same exact copy of this character exists on your account, it will be overwritten)</small></p></div>"):bdy+="<div><p>You do not have enough free slots to export this character as a new PC.</p></div>",canOverwrite&&(bdy+="<div><p>Since this character already exists in your vault, you can overwrite that character with this character.</p><div><hr/>",menuButtons={...menuButtons,exportOverwrite:{icon:"<i class='fas fa-file-export'></i>",label:"Export to HeroVau.lt overwriting existing PC",callback:()=>exportOverwritePC=!0}}),menuButtons={...menuButtons,no:{icon:"<i class='fas fa-times'></i>",label:"Cancel"}},bdy+=`<div><p><img src="${portrait}"><br>Please choose an action to perform:</p><div><hr/>`,new Dialog({title:"Export to your HeroVau.lt",content:bdy,buttons:menuButtons,default:"exportNew",close:async html=>{if(exportNewPC){hvUID="";var exportStatus=await exportPCtoHV(targetActor,hvUserToken,hvUID,!0,portraitAddress,tokenAddress);1==exportStatus.error?ui.notifications.error("Error exporting: "+exportStatus.message):(targetActor.update({"flags.herovault.uid":exportStatus.charhash}),ui.notifications.info(exportStatus.message))}else if(exportOverwritePC){hvDebug&&console.log("export overwrite PC");let exportStatus=await exportPCtoHV(targetActor,hvUserToken,hvUID,!1,portraitAddress,tokenAddress);1==exportStatus.error?ui.notifications.error("Error exporting: "+exportStatus.message):(targetActor.update({"flags.herovault.uid":exportStatus.charhash}),ui.notifications.info(exportStatus.message))}}}).render(!0))}catch(e){console.log(e)}}"https:"!==location.protocol&&(heroVaultURL="http://herovau.lt"),Hooks.on("ready",async function(){console.log("%cHeroVau.lt/Foundry Bridge | %cinitializing",hvColor1,hvColor4),"https:"!==location.protocol&&(game.user.isGM&&ui.notifications.info("GM: Please set your server to use HTTPS. For instructions see (coming soon)."),ui.notifications.info("HeroVau.lt using insecure HTTP mode.")),Cookie.get("hvut")&&(game.settings.set("herovaultfoundry","userToken",Cookie.get("hvut")),hvUserToken=game.settings.get("herovaultfoundry","userToken"),Cookie.set("hvut","",-1)),Cookie.get("herovault_skiptoken")&&(skipTokenPrompt=Cookie.get("herovault_skiptoken"),game.settings.set("herovaultfoundry","userToken",skipTokenPrompt),Cookie.set("herovault_skiptoken","",-1)),game.settings.register("herovaultfoundry","userToken",{name:"HeroVau.lt User Token",hint:"Please enter your personal user token from "+heroVaultURL+". Your HeroVau.lt token allows you to import and export PCs directly into your HeroVau.lt account.  This is not required to use the Pathbuilder or HeroLab Online features.",scope:"client",config:!0,type:String,default:hvUserToken}),game.settings.register("herovaultfoundry","hlouserToken",{name:"HeroLab Online User Token (optional)",hint:"Please enter your personal user token. A user token allows external tools (like HeroVau.lt) to access the HLO server and perform export operations.",scope:"client",config:!0,type:String,default:"",onChange:value=>setHLOToken()}),game.settings.register("herovaultfoundry","debugEnabled",{name:"Enable debug mode",hint:"Debug output will be written to the js console.",scope:"client",config:!0,type:Boolean,default:!1,onChange:value=>hvDebug=game.settings.get("herovaultfoundry","debugEnabled")}),game.settings.register("herovaultfoundry","skipTokenPrompt",{name:"Skip Token Prompt",hint:"Once your HeroVau.lt user token is set, you will no longer be prompted to set it. Unchecking this makes HeroVau.lt prompt you for the User Token again.",scope:"client",config:!0,type:Boolean,default:!1,onChange:value=>skipTokenPrompt=game.settings.get("herovaultfoundry","skipTokenPrompt")}),hvDebug=game.settings.get("herovaultfoundry","debugEnabled"),HLOuserToken=game.settings.get("herovaultfoundry","hlouserToken"),hvUserToken=game.settings.get("herovaultfoundry","userToken"),skipTokenPrompt=game.settings.get("herovaultfoundry","skipTokenPrompt")}),Hooks.on("renderActorSheet",function(obj,html){const actor=obj.actor;var v8=HVversionCompare(game.data.version,"0.8.5");if(hvDebug&&(1==v8?console.log("%cHeroVau.lt/Foundry Bridge | %cCan user modify: "+actor.canUserModify(game.user,"update"),hvColor1,hvColor4):console.log("%cHeroVau.lt/Foundry Bridge | %cActor type: "+actor.data.type+"can update?: "+actor.can(game.user,"update"),hvColor1,hvColor4)),"character"===actor.data.type){if(1==v8){if(0==actor.canUserModify(game.user,"update"))return}else if("character"!==actor.data.type||!actor.can(game.user,"update"))return;let element=html.find(".window-header .window-title");if(1==element.length){let head=html.find(".window-header");if(0==head.find("#herovault").length){let vaultButton=$('<a class="popout" id="herovault"><i class="fas fa-cloud"></i>Vault</a>');vaultButton.on("click",()=>checkNextAction(obj.object)),element.after(vaultButton)}game.modules.get("pathbuilder2e-import")?.active&&enablePB&&$("a:contains('Import from Pathbuilder')").remove()}}});const checkForAccess=async(hvUserToken,hvUID)=>new Promise(resolve=>{var xmlhttp=new XMLHttpRequest;xmlhttp.onreadystatechange=function(){var responseJSON;4==this.readyState&&200==this.status&&(responseJSON=JSON.parse(this.responseText),hvDebug&&console.log("%cHeroVau.lt/Foundry Bridge | %c"+JSON.stringify(responseJSON),hvColor1,hvColor4),resolve(responseJSON))},hvDebug&&(console.log("%cHeroVau.lt/Foundry Bridge | %cChecking if this account can access: "+hvUID,hvColor1,hvColor4),console.log("%cHeroVau.lt/Foundry Bridge | %chttps://herovau.lt/foundrymodule.php?action=checkCharacter&userToken="+hvUserToken+"&charUID="+hvUID,hvColor1,hvColor4)),xmlhttp.open("GET",heroVaultURL+"/foundrymodule.php?action=checkCharacter&userToken="+hvUserToken+"&charUID="+hvUID,!0),xmlhttp.send()}),getVaultSlots=async hvUserToken=>new Promise(resolve=>{var xmlhttp=new XMLHttpRequest;xmlhttp.onreadystatechange=function(){var responseJSON;4==this.readyState&&200==this.status&&(responseJSON=JSON.parse(this.responseText),hvDebug&&console.log("%cHeroVau.lt/Foundry Bridge | %c"+JSON.stringify(responseJSON),hvColor1,hvColor4),resolve(responseJSON))},hvDebug&&console.log("%cHeroVau.lt/Foundry Bridge | %chttps://herovau.lt/foundrymodule.php?action=getVaultSlots&userToken="+hvUserToken,hvColor1,hvColor4),xmlhttp.open("GET",heroVaultURL+"/foundrymodule.php?action=getVaultSlots&userToken="+hvUserToken,!0),xmlhttp.send()}),exportPCtoHV=(targetActor,userToken,charUID,importAsNew,portraitAddress,tokenAddress)=>new Promise(resolve=>{let action="";action=importAsNew?"importNewPC":"importExistingPC";var gameSystem=game.data.system.id,pcEncodedJSON=encodeURIComponent(JSON.stringify(targetActor.toObject())),xmlhttp=new XMLHttpRequest;xmlhttp.onreadystatechange=function(){var responseJSON;4==this.readyState&&200==this.status&&(responseJSON=JSON.parse(this.responseText),console.log(responseJSON),hvDebug&&console.log("%cHeroVau.lt/Foundry Bridge | %c"+JSON.stringify(responseJSON),hvColor1,hvColor4),resolve(responseJSON))},xmlhttp.open("POST",heroVaultURL+"/foundrymodule.php",!0),xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded"),xmlhttp.send("action="+action+"&userToken="+userToken+"&encodedChar="+pcEncodedJSON+"&gamesystem="+gameSystem+"&charUID="+charUID+"&portraitAddress="+encodeURIComponent(portraitAddress)+"&tokenAddress="+encodeURIComponent(tokenAddress))});function herovaultMenu(targetActor){let importPC=!1,exportPC=!1;var menuButtons={...menuButtons={import:{icon:"<i class='fas fa-file-import'></i>",label:"Import from HeroVau.lt",callback:()=>importPC=!0},export:{icon:"<i class='fas fa-file-export'></i>",label:"Export to HeroVau.lt",callback:()=>exportPC=!0}},no:{icon:"<i class='fas fa-times'></i>",label:"Cancel"}};new Dialog({title:"HeroVau.lt Import",content:"<div><p>Please choose an action to perform:</p><div><hr/>",buttons:menuButtons,default:"yes",close:html=>{importPC?(hvDebug&&console.log("import PC menu"),loadPersonalVault(targetActor,hvUserToken)):exportPC&&(hvDebug&&console.log("export PC"),exportToHV(targetActor,hvUserToken))}},{width:650,height:"auto"}).render(!0)}function exportPC(targetActor){null==hvUserToken&&(hvUserToken="")}function beginVaultConnection(targetActor){skipTokenPrompt?(hvDebug&&console.log("%cHeroVau.lt/Foundry Bridge | %cCalling herovaultMenu in beginVaultConnection",hvColor1,hvColor4),herovaultMenu(targetActor,hvUserToken)):(null==hvUserToken&&(hvUserToken=""),getVaultToken(herovaultMenu,targetActor,hvUserToken))}function loadPersonalVault(targetActor){var gameSystem=game.data.system.id;let error=!1;var xmlhttp=new XMLHttpRequest;xmlhttp.onreadystatechange=function(){if(4==this.readyState&&200==this.status){let responseJSON=JSON.parse(this.responseText);hvDebug&&console.log("%cHeroVau.lt/Foundry Bridge | %c"+responseJSON,hvColor1,hvColor4),responseJSON.hasOwnProperty("error")?(hvDebug&&console.log("%cHeroVau.lt/Foundry Bridge | %cerror found in response",hvColor1,hvColor4),error=!0):hvDebug&&console.log("%cHeroVau.lt/Foundry Bridge | %c"+Object.keys(responseJSON).length,hvColor1,hvColor4),error?new Dialog({title:"HeroVau.lt",content:`
                 <div>
                    <h3>Error</h3>
                    <p>${responseJSON.error}<p>
                 </div><br>`,buttons:{yes:{icon:"<i class='fas fa-check'></i>",label:"Ok"}},default:"yes"}).render(!0):1<=Object.keys(responseJSON).length?(hvDebug&&console.log("%cHeroVau.lt/Foundry Bridge | %cCalling checkHLOCharacterIsCorrect",hvColor1,hvColor4),createPCTable(targetActor,responseJSON)):(ui.notifications.warn("Unable to load vault.  Please double-check your User Token."),game.settings.set("herovaultfoundry","skipTokenPrompt",!1),getVaultToken(loadPersonalVault,targetActor,hvUserToken))}},hvDebug&&console.log("%cHeroVau.lt/Foundry Bridge | %cusertoken: "+hvUserToken,hvColor1,hvColor4),xmlhttp.open("GET",heroVaultURL+"/foundrymodule.php?action=getvault&gamesystem="+encodeURIComponent(gameSystem)+"&hvVer="+hvVer+"&userToken="+encodeURIComponent(hvUserToken),!0),xmlhttp.send()}function createPCTable(targetActor,responseJSON){var charName,charRace,charClass,charLevel,pickedCharacter,selectedCharUID;hvDebug&&console.log("%cHeroVau.lt/Foundry Bridge | %cin createPCTable",hvColor1,hvColor4);for(var htmlOut="<strong>Select a PC from the list:</strong><br><br><select name='pcid' id='pcid' style='width:100%;'>",pccount=0;pccount<responseJSON.length;pccount++)charName=responseJSON[pccount].charname,charRace=responseJSON[pccount].charrace,charClass=responseJSON[pccount].charclass,charLevel=responseJSON[pccount].charlevel,htmlOut=htmlOut+"<option value='"+responseJSON[pccount].charuid+"'>"+charName+": "+charRace+" "+charClass+" (Level "+charLevel+") - Last edited @ "+responseJSON[pccount].edit+"</option>";htmlOut+="</select><br>",new Dialog({title:"Importable Character List",content:`
      <div>`+htmlOut+`</div><br><br>
      `,buttons:{yes:{icon:"<i class='fas fa-check'></i>",label:"Proceed",callback:()=>pickedCharacter=!0},no:{icon:"<i class='fas fa-times'></i>",label:"Cancel",callback:()=>pickedCharacter=!1}},default:"yes",close:html=>{pickedCharacter?(hvDebug&&console.log("yes clicked"),selectedCharUID=html.find('[id="pcid"]')[0].value,hvDebug&&console.log("Selected PC id: "+selectedCharUID),requestCharacter(targetActor,selectedCharUID)):hvDebug&&console.log("cancel clicked")}},{width:650,height:"auto"}).render(!0)}function requestCharacter(targetActor,charUID){let error=!1;var xmlhttp=new XMLHttpRequest;xmlhttp.onreadystatechange=function(){if(4==this.readyState&&200==this.status){let responseJSON=JSON.parse(this.responseText);hvDebug&&console.log("%cHeroVau.lt/Foundry Bridge | %c"+responseJSON,hvColor1,hvColor4),responseJSON.hasOwnProperty("error")?(hvDebug&&console.log("%cHeroVau.lt/Foundry Bridge | %cerror found in response",hvColor1,hvColor4),error=!0):hvDebug&&console.log("%cHeroVau.lt/Foundry Bridge | %c"+Object.keys(responseJSON).length,hvColor1,hvColor4),error?new Dialog({title:"HeroVau.lt",content:`
                 <div>
                    <h3>Error</h3>
                    <p>${responseJSON.error}<p>
                    <p>Please contact us with this information above by going to <a href="https://herovau.lt/?action=contact">https://herovau.lt/?action=contact</a>.<p>
                 </div><br>`,buttons:{yes:{icon:"<i class='fas fa-check'></i>",label:"Ok"}},default:"yes"}).render(!0):responseJSON.downloadURL?(hvDebug&&console.log("%cHeroVau.lt/Foundry Bridge | %cGot the URL: "+responseJSON.downloadURL,hvColor1,hvColor4),importCharacter(targetActor,responseJSON.downloadURL)):ui.notifications.warn("Unable find character.  Please contact HeroVau.lt support.")}},hvDebug&&console.log("%cHeroVau.lt/Foundry Bridge | %ccharUID: "+charUID,hvColor1,hvColor4),xmlhttp.open("GET",heroVaultURL+"/foundrymodule.php?action=getCharacter&charUID="+encodeURIComponent(charUID),!0),xmlhttp.send()}async function importCharacter(targetActor,charURL){var importPCID,charImport,errMsg="",xmlhttp=new XMLHttpRequest;xmlhttp.onreadystatechange=function(){if(4==this.readyState&&200==this.status){let responseJSON=JSON.parse(this.responseText);hvDebug&&console.log("%cHeroVau.lt/Foundry Bridge | %c"+JSON.stringify(responseJSON),hvColor1,hvColor4);{var targetPCID=targetActor.data._id;let coreVersionMismatch=!1,systemVersionMismatch=!1,abort=!1;var pcGameSystemVersion,pcCoreVersion,chatData=game.system.data.version,coreVersion=game.data.version;if(responseJSON.flags.hasOwnProperty("exportSource")&&responseJSON.flags.exportSource.hasOwnProperty("systemVersion")&&responseJSON.flags.exportSource.hasOwnProperty("coreVersion")&&(pcCoreVersion=responseJSON.flags.exportSource.coreVersion,pcGameSystemVersion=responseJSON.flags.exportSource.systemVersion,pcCoreVersion!=coreVersion&&(coreVersionMismatch=!0,errMsg=errMsg+"This PC was exported from Foundry v"+pcCoreVersion+" and this game server is running Foundry v"+coreVersion+".<br><br>"),pcGameSystemVersion!=chatData&&(systemVersionMismatch=!0,errMsg=1==HVversionCompare(pcGameSystemVersion,chatData)?(abort=!0,errMsg+"This PC was exported from "+game.system.data.title+": "+pcGameSystemVersion+" and this game server is running "+game.system.data.title+": "+chatData+".<br><br>Unfortunately, game systems usually are not backwards compatible, so we are aborting this import. To manually override, please download the hero export from herovau.lt. <br><strong>This may break this PC -- you  have been warned!</strong><br><br>"):errMsg+"This PC was exported from "+game.system.data.title+": "+pcGameSystemVersion+" and this game server is running "+game.system.data.title+": "+chatData+".<br><br>"),hvDebug&&console.log("%cHeroVau.lt/Foundry Bridge | Mismatch?:%c"+systemVersionMismatch+" | "+coreVersionMismatch,hvColor1,hvColor4),systemVersionMismatch||coreVersionMismatch)){errMsg+="There may be compatibility issues.";chatData={user:game.user.data._id,speaker:ChatMessage.getSpeaker(),content:errMsg,whisper:[game.user.data._id]};if(ChatMessage.create(chatData,{}),abort)return}responseJSON._id?(importPCID=new RegExp(responseJSON._id,"g"),charImport=JSON.stringify(responseJSON),hvDebug&&(console.log("%cHeroVau.lt/Foundry Bridge | Target ID:%c"+targetPCID,hvColor1,hvColor4),console.log("%cHeroVau.lt/Foundry Bridge | %c"+charImport,hvColor1,hvColor4)),charImport=charImport.replace(importPCID,targetPCID),charImport=JSON.parse(charImport)):(charImport=responseJSON)._id=targetPCID,Array.isArray(charImport.data.saves)&&(hvDebug&&console.log("%cHeroVau.lt/Foundry Bridge | %cConverting a bad saves array to object.",color1,color4),request2=charImport.data.saves,request2=Object.assign({},request2),charImport.data.saves=request2),charImport.token.sightAngle<1&&(charImport.token.sightAngle=360),charImport.token.lightAngle<1&&(charImport.token.lightAngle=360),charImport.data.resources={},hvDebug&&console.log("%cHeroVau.lt/Foundry Bridge | %cChecking for crafting:"+responseJSON.data.hasOwnProperty("crafting"),color1,color4),charImport.data.hasOwnProperty("crafting")||(hvDebug&&console.log("%cHeroVau.lt/Foundry Bridge | %c Adding crafting block to PC",color1,color4),charImport.data.crafting={formulas:[]});var request2=targetActor.data.permission;charImport.permission=request2,hvDebug&&console.log("%cHeroVau.lt/Foundry Bridge | %cHLO Importer | %c Importing "+charImport.name,hvColor1,hvColor5,hvColor4);request2=JSON.stringify(charImport);hvDebug&&console.log("%cHeroVau.lt/Foundry Bridge | %cFinal json for import: "+request2,color1,color4),targetActor.importFromJSON(request2);request2=new XMLHttpRequest;request2.open("GET",charImport.token.img,!0),request2.onreadystatechange=function(){404===this.status&&targetActor.update({"data.token.img":"icons/svg/mystery-man.svg"})},request2.send();request2=new XMLHttpRequest;request2.open("GET",charImport.img,!0),request2.onreadystatechange=function(){404===this.status&&(hvDebug&&console.log("got a 404"),targetActor.update({img:"icons/svg/mystery-man.svg"}))},request2.send()}}},xmlhttp.open("GET",charURL,!0),xmlhttp.send()}var Cookie={set:function(name,value,host){var domain,expires=host?((domain=new Date).setTime(domain.getTime()+864e5*host),"; expires="+domain.toGMTString()):"",host=location.host;1===host.split(".").length?document.cookie=name+"="+value+expires+"; path=/; SameSite=Strict":((domain=host.split(".")).shift(),domain="."+domain.join("."),host.includes("forge-vtt.com")?document.cookie=name+"="+value+expires+"; path=/; domain=.forge-vtt.com; SameSite=Strict":(document.cookie=name+"="+value+expires+"; path=/; domain="+domain+"; SameSite=Strict",document.cookie=name+"="+value+expires+"; path=/; domain="+host+"; SameSite=Strict"),null!=Cookie.get(name)&&Cookie.get(name)==value||(domain="."+host,document.cookie=name+"="+value+expires+"; path=/; domain="+domain+"; SameSite=Strict"))},get:function(name){for(var nameEQ=name+"=",ca=document.cookie.split(";"),i=0;i<ca.length;i++){for(var c=ca[i];" "==c.charAt(0);)c=c.substring(1,c.length);if(0==c.indexOf(nameEQ))return c.substring(nameEQ.length,c.length)}return null},erase:function(name){Cookie.set(name,"",-1)}};let HVversionCompare=function(left,right){if(typeof left+typeof right!="stringstring")return!1;for(var a=left.split("."),b=right.split("."),i=0,len=Math.max(a.length,b.length);i<len;i++){if(a[i]&&!b[i]&&0<parseInt(a[i])||parseInt(a[i])>parseInt(b[i]))return 1;if(b[i]&&!a[i]&&0<parseInt(b[i])||parseInt(a[i])<parseInt(b[i]))return-1}return 0};function getHash(encodedHeroJSON){var xmlhttp=new XMLHttpRequest;xmlhttp.onreadystatechange=function(){if(4==this.readyState&&200==this.status){var responseJSON=JSON.parse(this.responseText);return hvDebug&&console.log("%cHeroVau.lt/Foundry Bridge | %c"+JSON.stringify(responseJSON),hvColor1,hvColor4),responseJSON.newHash}},xmlhttp.open("POST",heroVaultURL+"/foundrymodule.php",!0),xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded"),xmlhttp.send("action=genHash&encodedChar="+encodedHeroJSON)}function exportToHVFromPBHLO(newHash,tAct){var xmlhttp=new XMLHttpRequest,gameSystem=game.data.system.id,pcEncodedJSON=encodeURIComponent(newHash),newHash=getHash(pcEncodedJSON);xmlhttp.onreadystatechange=function(){if(4==this.readyState&&200==this.status){var responseJSON=JSON.parse(this.responseText);if(0==responseJSON.error)return ui.notifications.info("Successfully exported to HeroVau.lt."),tAct.update({"flags.herovault.uid":responseJSON.charhash}),responseJSON.charhash;ui.notifications.warn("Unable to export to HeroVau.lt. Please try manually. ["+responseJSON.error+"]")}},xmlhttp.open("POST",heroVaultURL+"/foundrymodule.php",!0),xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded"),xmlhttp.send("action=importNewPCFromPBHLO&userToken="+hvUserToken+"&encodedChar="+pcEncodedJSON+"&gamesystem="+gameSystem+"&charUID="+newHash)}function supportCheck(){if(hvUserToken)return!0}Hooks.on("init",()=>{game.modules.get("herovaultfoundry").api={exportToHVFromPBHLO:exportToHVFromPBHLO,supportCheck:supportCheck},Hooks.callAll("herovaultfoundryReady",game.modules.get("herovaultfoundry").api)});export{exportToHVFromPBHLO,supportCheck};