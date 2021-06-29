let hvDebug = false;
const hvVer="0.3.1";
const heroVaultURL='https://herovau.lt';
// const heroVaultURL='https://dev.herovau.lt';

const hvColor1='color: #7bf542';  //bright green
const hvColor2='color: #d8eb34'; //yellow green
const hvColor3='color: #ffffff'; //white
const hvColor4='color: #cccccc'; //gray
const hvColor5='color: #ff0000'; //red
let HLOuserToken, hvUserToken,skipTokenPrompt;
let enableHLO=true;
let enablePB=true;

Hooks.on('ready', async function() {
  console.log("%cHeroVau.lt/Foundry Bridge | %cinitializing",hvColor1,hvColor4);
  if (Cookie.get('herovault_user_token')) {
      hvUserToken=Cookie.get('herovault_user_token');
      Cookie.set('herovault_user_token',hvUserToken,60);
  }
  if (Cookie.get('herovault_skiptoken')){
      skipTokenPrompt=Cookie.get('herovault_skiptoken');
      Cookie.set('herovault_skiptoken',"",-1);     
  }
      // game.settings.register('herovaultfoundry', 'userToken', {
      //     name : "HeroVau.lt User Token",
      //     hint : "Please enter your personal user token from "+heroVaultURL+". Your HeroVau.lt token allows you to import and export PCs directly into your HeroVau.lt account.  This is not required to use the Pathbuilder or HeroLab Online features.",
      //     scope : 'world',
      //     config : true,
      //     type : String,
      //     default : hvUserToken,
      //     onChange: value =>  ( checkUserToken() )
      // });
      game.settings.register('herovaultfoundry', 'hlouserToken', {
          name : "HeroLab Online User Token (optional)",
          hint : "Please enter your personal user token. A user token allows external tools (like HeroVau.lt) to access the HLO server and perform export operations.",
          scope : 'world',
          config : true,
          type : String,
          default : '',
          onChange: value =>  (setHLOToken())
      });
      game.settings.register('herovaultfoundry', 'debugEnabled', {
          name : "Enable debug mode",
          hint : "Debug output will be written to the js console.",
          scope : 'world',
          config : true,
          type: Boolean,
          default: false,
          onChange: value => (hvDebug=game.settings.get('herovaultfoundry', 'debugEnabled'))
      });
      game.settings.register('herovaultfoundry', 'skipTokenPrompt', {
          name : "Skip Token Prompt",
          hint : "Once your HeroVau.lt user token is set, you will no longer be prompted to set it. Unchecking this makes HeroVau.lt prompt you for the User Token again.",
          scope : 'world',
          config : true,
          type: Boolean,
          default: false,
          onChange: value => (skipTokenPrompt=game.settings.get('herovaultfoundry', 'skipTokenPrompt'))
      });
  hvDebug=game.settings.get('herovaultfoundry', 'debugEnabled');
  HLOuserToken=game.settings.get('herovaultfoundry', 'hlouserToken');
  hvUserToken=Cookie.get('herovault_user_token');
  skipTokenPrompt=game.settings.get('herovaultfoundry', 'skipTokenPrompt');
});

Hooks.on('renderActorSheet', function(obj, html){
  const actor = obj.actor;
  const v8=HVversionCompare(game.data.version,'0.8.5');
  // Only inject the link if the actor is of type "character" and the user has permission to update it
  if (hvDebug) {
    if (v8==1)
      console.log("%cHeroVau.lt/Foundry Bridge | %cCan user modify: " + actor.canUserModify(game.user, "update"),hvColor1,hvColor4);
    else
      console.log("%cHeroVau.lt/Foundry Bridge | %cActor type: " + actor.data.type + "can update?: " + actor.can(game.user, "update"),hvColor1,hvColor4);
  }
    
  if (!(actor.data.type === "character")) return;

  if (v8==1) {
    if (actor.canUserModify(game.user, "update")==false) return;
  }
  else {
    if (!(actor.data.type === "character" && actor.can(game.user, "update"))) return;
  }
  
  let element = html.find(".window-header .window-title");
  if (element.length != 1) return;
  
  let vaultButton = $(`<a class="popout"><i class="fas fa-cloud"></i>Vault</a>`);

  vaultButton.on('click', () => checkNextAction(obj.object));
  element.after(vaultButton);
  if (game.modules.get('pathbuilder2e-import')?.active  && enablePB) {
    $( "a:contains('Import from Pathbuilder')" ).remove();
  }
});

function setHLOToken() {
  HLOuserToken=Cookie.get('herovault_user_token');
}

function checkUserToken() {
  var ut = Cookie.get('herovault_user_token');
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      let responseJSON = JSON.parse(this.responseText);
      if (hvDebug) 
          console.log("%cHeroVau.lt/Foundry Bridge | %c"+JSON.stringify(responseJSON),hvColor1,hvColor4);
      if (responseJSON.status==1){
        hvUserToken=ut;
        game.settings.set('herovaultfoundry', 'skipTokenPrompt',true);
        skipTokenPrompt=true;
      } else {

        hvUserToken="";
        Cookie.set('herovault_user_token',"",-1);
        game.settings.set('herovaultfoundry', 'skipTokenPrompt',false);    
        skipTokenPrompt=false;
      }
    }
  };
  if (hvDebug)
    console.log("%cHeroVau.lt/Foundry Bridge | %c/foundrymodule.php?action=iv&userToken="+ut,hvColor1,hvColor4);
  xmlhttp.open("GET", heroVaultURL+"/foundrymodule.php?action=iv&userToken="+ut, true);
  xmlhttp.send();
}

function checkNextAction(obj) {
  if(!game.modules.get('herovaultfoundry')?.active) {
    if (skipTokenPrompt) {
      herovaultMenu(obj);
    } else {
      if (hvUserToken==null)
        hvUserToken="";
      getVaultToken(herovaultMenu,targetActor);
    }
  } else {
    pickAFunction(obj);
  }
}

async function loadPB(obj) {
  let {beginPathbuilderImport} = await import('/modules/pathbuilder2e-import/pathbuilder-import-min.js');
  beginPathbuilderImport(obj,true)
}

async function loadHLO(obj) {
  import('../hlo-importer/hlo-importer.min.js').then(hlomodule => { let hlo = new hlomodule.HeroLabImporter; hlo.hloShim(obj); }).catch(err => {console.log("error importing hlo: "+ err.message)});
}

async function pickAFunction(obj) {
  let hloImport = false;
  let hvImport = false
  let pbImport = false;
  let dopt  = {
    width: 400,
    height: "auto"
  }
  let menuButtons ={
    heroVaultImport: {
      icon: "<i class='fas fa-cloud'></i>",
      label: `HeroVau.lt Import/Export`,
      callback: () => hvImport = true
    }};
  if (game.system.id=="pf2e" && game.modules.get('hlo-importer')?.active && enableHLO) {
    menuButtons= {...menuButtons, hloimport: {
          icon: "<i class='fas fa-flask'></i>",
          label: `Import from Herolab Online`,
          callback: () => hloImport = true
    }};
    dopt.width+=100;
  }
  if (game.system.id=="pf2e" && game.modules.get('pathbuilder2e-import')?.active && enablePB) {
    menuButtons= {...menuButtons, pbimport: {
          icon: "<i class='fas fa-check'></i>",
          label: `Import from Pathbuilder 2e`,
          callback: () => pbImport = true
    }};
    dopt.width+=100;
  }
  menuButtons= {...menuButtons, no: {
    icon: "<i class='fas fa-times'></i>",
    label: `Cancel`
  }};

  new Dialog({
    title: `HeroVau.lt Import`,
    content: `
      <div>
        <p>Please select the importer you'd like to use from the options below.</p>
      <div>
      <hr/>`,
    buttons:menuButtons,
    default: "no",
    close: html => {
      if (hvImport) {
        beginVaultConnection(obj);
      } else if (hloImport) {
        loadHLO(obj)
      } else if (pbImport) {
        // import('../pathbuilder2e-import/pathbuilder-import.js').then(pbmodule => { beginPathbuilderImport(obj) }).catch(err => {console.log("error importing pb: "+ err.message)});
        loadPB(obj);
        // beginPathbuilderImport(obj);
      }
    }
  }, dopt).render(true);   
}
/*
Hooks.on('getSceneControlButtons', (controls) => {
    hvControls={
      name: "herovault",
      icon: "fas fa-cloud",
      title: "Hero Vault",
      layer: 'ControlsLayer',
      visible: game.user.isGM,
      tools: [
        {
          icon: "fas fa-cloud",
          name: "LoadHeroVault",
          title: "Load HeroVau.lt Interface",
          onClick: () => { renderVault(); },
          button: true
        }
      ]
    }
    if (game.system.id=="pf2e") {
      hvControls.tools.push(
        {
          icon: "fas fa-flask",
          name: "importHLOCharacter",
          title: "Import HLO Character",
          onClick: () => { importHLOChar(); },
          button: true
        },
        {
          icon: "fas fa-compass",
          name: "importPFSCharacter",
          title: "Import PFS Character",
          onClick: () => { importPFSChar(); },
          button: true
        },
        );
    }
    controls.push(hvControls);
});

function importHLOChar() {}
function importPFSChar() {}

*/

function getVaultToken(callback,callbackArg1,callbackArg2,callbackArg3,callbackArg4) {
  let applyChanges=false;
  if (hvUserToken==null)
    hvUserToken="";
  new Dialog({
    title: `HeroVau.lt Import`,
    content: `
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
      </style>`,
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
        let skipToken= html.find('[id="skipToken"]')[0].checked;
        Cookie.set('herovault_user_token',userToken,60);
        hvUserToken=userToken;
        if (skipToken)
          game.settings.set('herovaultfoundry', 'skipTokenPrompt',true);
        callback(callbackArg1,callbackArg2,callbackArg3,callbackArg4);
      }
    }
  }).render(true); 
}


async function exportToHV(targetActor) {
  try {
    let exportNewPC = false;
    let exportOverwritePC = false;
    let vaultInfo = false;
    let canOverwrite = false;
    hvUserToken=Cookie.get('herovault_user_token');
    let portrait,hvUID;

    if (targetActor.data.img.includes("mystery-man") == -1)
    {
      portrait=targetActor.data.img;
    } else if (targetActor.data.token.img.includes("mystery-man") == -1) {
      portrait=targetActor.data.token.img;
    } else {
      portrait=targetActor.data.img;
    }
    let menuButtons = {};
    if (hasProperty(targetActor,"data.flags.herovault.uid")) {
      hvUID=targetActor.data.flags.herovault.uid;
      let accChk = await checkForAccess(hvUserToken,hvUID);
      canOverwrite=accChk;
      // Promise.resolve(checkForAccess(hvUserToken,hvUID)).then( res => canOverwrite=res);
    }
    vaultInfo = await getVaultSlots(hvUserToken);
    // Promise.resolve(getVaultSlots(userToken)).then( res => vaultInfo=res);
    if (hvDebug)
      console.log("%cHeroVau.lt/Foundry Bridge | %cvaultInfo: " + vaultInfo,hvColor1,hvColor4);

    let totalSlots=vaultInfo.totalSlots;
    let usedSlots=vaultInfo.usedSlots;
    let freeSlots=totalSlots-usedSlots;
    let bdy=`<div><p>You have ${freeSlots}/${totalSlots} character slots free.</p><div><hr/>`;
    
    if (hvDebug)
      console.log("%cHeroVau.lt/Foundry Bridge | %ccan access?: " + canOverwrite,hvColor1,hvColor4);
    if (freeSlots <1 && canOverwrite==false){
      bdy=`<div><p>Unfortunately you do not have enough open slots in your <a href="https://herovau.lt">HeroVau.lt</a> to import this PC.<br>Please upgrade your account or delete a PC from your account to free up some space.</p><div><hr/>`;

      new Dialog({
        title: "Import to your HeroVau.lt",
        content: bdy,
        buttons: {
          yes: {
            icon: "<i class='fas fa-check'></i>",
            label: `Ok`
          }
        },
        default: "yes"
      }).render(true);     
    } else {
      if (freeSlots >0) {
        menuButtons= {...menuButtons, exportNew: {
            icon: "<i class='fas fa-file-export'></i>",
            label: `Export to HeroVau.lt as New PC`,
            callback: () => exportNewPC = true
          }
        }
        bdy=bdy+`<div><p>You you can import this character as a new PC, taking up a slot on your account. <br><small>(Note: if the same exact copy of this character exists on your account, it will be overwritten)</small></p></div>`
      } else {
        bdy=bdy+`<div><p>You do not have enough free slots to import this character as a new PC.</p></div>`
      }
      if (canOverwrite) {
        bdy=bdy+`<div><p>Since this character already exists in your vault, you can overwrite that character with this character.</p><div><hr/>`;
        menuButtons= {...menuButtons, exportOverwrite: {
            icon: "<i class='fas fa-file-export'></i>",
            label: `Export to HeroVau.lt overwriting existing PC`,
            callback: () => exportOverwritePC = true
          }
        }
      }
      menuButtons= {...menuButtons, no: {
              icon: "<i class='fas fa-times'></i>",
              label: `Cancel`
            } }
      bdy=bdy+`<div><p><img src="${portrait}"><br>Please choose an action to perform:</p><div><hr/>`;
      new Dialog({
        title: "Import to your HeroVau.lt",
        content: bdy,
        buttons: menuButtons,
        default: "exportNew",
        close: async (html) => {
          if (exportNewPC) {
            hvUID="";
            let exportStatus = await exportPCtoHV(targetActor, hvUserToken, hvUID, true);
            if (exportStatus.error== true) {
              ui.notifications.error("Error exporting: " + exportStatus.message);
            } else {
              ui.notifications.info(exportStatus.message);
            }
          } else if (exportOverwritePC){
            if (hvDebug)
              console.log("export overwrite PC");
            let exportStatus = await exportPCtoHV(targetActor, hvUserToken, hvUID, false);
            if (exportStatus.error== true) {
              ui.notifications.error("Error exporting: " + exportStatus.message);
            } else {
              ui.notifications.info(exportStatus.message);
            }
          }
        }
      }).render(true);
    }
  } catch(e) {
    console.log(e);
  }
}

const checkForAccess = (hvUserToken,hvUID) => {
    return new Promise((resolve) => {
      let error=false;
      var xmlhttp = new XMLHttpRequest();
      xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          let responseJSON = JSON.parse(this.responseText);
          if (hvDebug) 
              console.log("%cHeroVau.lt/Foundry Bridge | %c"+JSON.stringify(responseJSON),hvColor1,hvColor4);
          if (error){
            resolve(false);
          } else {
            resolve(responseJSON);
          }
        }
      };
      if (hvDebug) {
        console.log("%cHeroVau.lt/Foundry Bridge | %cChecking if this account can access: " + hvUID,hvColor1,hvColor4);
        console.log("%cHeroVau.lt/Foundry Bridge | %chttps://herovau.lt/foundrymodule.php?action=checkCharacter&userToken="+hvUserToken+"&charUID="+hvUID,hvColor1,hvColor4);
      }
      xmlhttp.open("GET", heroVaultURL+"/foundrymodule.php?action=checkCharacter&userToken="+hvUserToken+"&charUID="+hvUID, true);
      xmlhttp.send();
    });
};

const getVaultSlots = (hvUserToken) => {
  return new Promise((resolve) => {
    let error=false;
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        let responseJSON = JSON.parse(this.responseText);
        if (hvDebug) 
            console.log("%cHeroVau.lt/Foundry Bridge | %c"+JSON.stringify(responseJSON),hvColor1,hvColor4);
        if (error){
          resolve(false);
        } else {
          resolve(responseJSON);
        }
      }
    };
    if (hvDebug)
      console.log("%cHeroVau.lt/Foundry Bridge | %chttps://herovau.lt/foundrymodule.php?action=getVaultSlots&userToken="+hvUserToken,hvColor1,hvColor4);
    xmlhttp.open("GET", heroVaultURL+"/foundrymodule.php?action=getVaultSlots&userToken="+hvUserToken, true);
    xmlhttp.send();
  });
};

const exportPCtoHV = (targetActor, userToken,charUID,importAsNew) => {
  return new Promise((resolve) => {
    let error=false;
    let action='';
    if (importAsNew)
      action='importNewPC';
    else
      action='importExistingPC';

    const gameSystem=game.data.system.id;
    let pcEncodedJSON=encodeURIComponent(JSON.stringify(targetActor.data));
    // console.log(pcEncodedJSON);
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        let responseJSON = JSON.parse(this.responseText);
        if (hvDebug) 
          console.log("%cHeroVau.lt/Foundry Bridge | %c"+JSON.stringify(responseJSON),hvColor1,hvColor4);
        resolve(responseJSON);
      }
    };
    // console.log("%cHeroVau.lt/Foundry Bridge | %chttps://herovau.lt/foundrymodule.php?action=importNewPC&userToken="+userToken+"&encodedChar="+pcEncodedJSON,hvColor1,hvColor4);
    xmlhttp.open("POST", heroVaultURL+"/foundrymodule.php", true);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlhttp.send('action='+action+'&userToken='+userToken+'&encodedChar='+pcEncodedJSON+'&gamesystem='+gameSystem+'&charUID='+charUID);
  });
}


function herovaultMenu(targetActor) {
  let importPC = false;
  let exportPC = false;
  let PFSPC = false;
  let hloPC = false;
  let herolabEnabled = false;
  let pfsEnabled = false;
  let ttl=`HeroVau.lt Import`;
  let bdy=`<div><p>Please choose an action to perform:</p><div><hr/>`;
  let dopt  = {
    width: 650,
    height: "auto"
  }

  let menuButtons = {
        import: {
          icon: "<i class='fas fa-file-import'></i>",
          label: `Import from HeroVau.lt`,
          callback: () => importPC = true
        },
        export: {
          icon: "<i class='fas fa-file-export'></i>",
          label: `Export to HeroVau.lt`,
          callback: () => exportPC = true
        },
  }
  if (game.system.id=="pf2e" && pfsEnabled) {
    menuButtons= {...menuButtons, pfsimport: {
          icon: "<i class='fas fa-search'></i>",
          label: `Find a PFS PC`,
          callback: () => PFSPC = true
        }};
  }
  if (game.system.id=="pf2e" && herolabEnabled) {
    menuButtons= {...menuButtons, hloimport: {
          icon: "<i class='fas fa-flask'></i>",
          label: `Import from Herolab Online`,
          callback: () => hloPC = true
    }};
  }
  menuButtons= {...menuButtons, no: {
          icon: "<i class='fas fa-times'></i>",
          label: `Cancel`
        } }
  new Dialog({
    title: ttl,
    content: bdy,
    buttons: menuButtons,
    default: "yes",
    close: html => {
      if (importPC) {
        loadPersonalVault(targetActor, hvUserToken);
      } else if (exportPC){
        if (hvDebug)
          console.log("export PC");
        exportToHV(targetActor,hvUserToken);
      } else if (PFSPC) {
        console.log("PFS PC");
      } else if (hloPC) {
        console.log("hlo PC");
      }
    }
  }, dopt).render(true); 
}

function exportPC(targetActor) {
  let applyChanges=false;
  if (hvUserToken==null)
    hvUserToken="";
}

function beginVaultConnection(targetActor){
  if (skipTokenPrompt) {
    herovaultMenu(targetActor, hvUserToken);
  } else {
    if (hvUserToken==null)
      hvUserToken="";
    getVaultToken(herovaultMenu,targetActor, hvUserToken);
  }
}

function loadPersonalVault(targetActor){
    const gameSystem=game.data.system.id;
    let error=false;
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        let responseJSON = JSON.parse(this.responseText);
        if (hvDebug) 
            console.log("%cHeroVau.lt/Foundry Bridge | %c"+responseJSON,hvColor1,hvColor4);
        if (responseJSON.hasOwnProperty("error")) {
          if (hvDebug)
             console.log("%cHeroVau.lt/Foundry Bridge | %cerror found in response",hvColor1,hvColor4);
          error=true;
        }
        else
          if (hvDebug)
            console.log("%cHeroVau.lt/Foundry Bridge | %c"+Object.keys(responseJSON).length,hvColor1,hvColor4);

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
            if (hvDebug)
              console.log("%cHeroVau.lt/Foundry Bridge | %cCalling checkHLOCharacterIsCorrect",hvColor1,hvColor4);

              createPCTable(targetActor, responseJSON);
          } else {
            ui.notifications.warn("Unable to load vault.  Please double-check your User Token.");
            game.settings.set('herovaultfoundry', 'skipTokenPrompt',false);
            getVaultToken(loadPersonalVault,targetActor, hvUserToken);
            return;
        }
      }
        
      // console.log("%cHeroVau.lt/Foundry Bridge | %creadyState: "+this.readyState,hvColor1,hvColor4)
      }
    };
    if (hvDebug)
      console.log("%cHeroVau.lt/Foundry Bridge | %cusertoken: " + hvUserToken,hvColor1,hvColor4);
    xmlhttp.open("GET", heroVaultURL+"/foundrymodule.php?action=getvault&gamesystem="+encodeURIComponent(gameSystem)+"&hvVer="+hvVer+"&userToken="+encodeURIComponent(hvUserToken), true);
    xmlhttp.send();
}

function createPCTable(targetActor,responseJSON){
  var charName, charRace, charClass, charLevel, charuid, pickedCharacter, selectedCharUID;
  if (hvDebug)
    console.log("%cHeroVau.lt/Foundry Bridge | %cin createPCTable",hvColor1,hvColor4);
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
        if (hvDebug)
          console.log("yes clicked");
        selectedCharUID= html.find('[id="pcid"]')[0].value;
        if (hvDebug)
          console.log("Selected PC id: "+selectedCharUID);
        requestCharacter(targetActor, selectedCharUID);
      } else {
        if (hvDebug)
          console.log("cancel clicked");
      }
    }
  }).render(true);


}

function requestCharacter(targetActor,charUID){
    let error=false;
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        let responseJSON = JSON.parse(this.responseText);
        if (hvDebug) 
            console.log("%cHeroVau.lt/Foundry Bridge | %c"+responseJSON,hvColor1,hvColor4);
        if (responseJSON.hasOwnProperty("error")) {
          if (hvDebug)
             console.log("%cHeroVau.lt/Foundry Bridge | %cerror found in response",hvColor1,hvColor4);
          error=true;
        }
        else
          if (hvDebug)
            console.log("%cHeroVau.lt/Foundry Bridge | %c"+Object.keys(responseJSON).length,hvColor1,hvColor4);

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
            if (hvDebug)
              console.log("%cHeroVau.lt/Foundry Bridge | %cGot the URL: "+responseJSON.downloadURL,hvColor1,hvColor4)
              importCharacter(targetActor, responseJSON.downloadURL);
          } else {
            ui.notifications.warn("Unable find character.  Please contact HeroVau.lt support.");
            return;
        }
      }
        
      // console.log("%cHeroVau.lt/Foundry Bridge | %creadyState: "+this.readyState,hvColor1,hvColor4)
      }
    };
    if (hvDebug)
      console.log("%cHeroVau.lt/Foundry Bridge | %ccharUID: " + charUID,hvColor1,hvColor4)
    xmlhttp.open("GET", heroVaultURL+"/foundrymodule.php?action=getCharacter&charUID="+encodeURIComponent(charUID), true);
    xmlhttp.send();
}

async function importCharacter(targetActor, charURL){
    let error=false;
    var importPCID,errMsg, charDataStr, charImport;
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        let responseJSON = JSON.parse(this.responseText);
        if (hvDebug) 
            console.log("%cHeroVau.lt/Foundry Bridge | %c"+JSON.stringify(responseJSON),hvColor1,hvColor4);
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
          // responseJSON
          // console.log("%cHeroVau.lt/Foundry Bridge | Import ID:%c"+responseJSON._id,hvColor1,hvColor4);
          let targetPCID=targetActor.data._id;
          let coreVersionMismatch=false;
          let systemVersionMismatch=false;
          let abort=false;
          let systemVersion=game.system.data.version;
          let coreVersion=game.data.version;
          let pcGameSystemVersion=responseJSON.flags.exportSource.systemVersion;
          let pcCoreVersion=responseJSON.flags.exportSource.coreVersion;
          if (pcCoreVersion != coreVersion){
            coreVersionMismatch=true;
            errMsg=errMsg+"This PC was exported from Foundry v"+pcCoreVersion+" and this game server is running Foundry v"+ coreVersion+".<br><br>"
          }
          if (pcGameSystemVersion != systemVersion){
            systemVersionMismatch=true;
            if (HVversionCompare(pcGameSystemVersion,systemVersion) == 1) { //game system is older than PC, this could be bad!
              abort=true;
              errMsg=errMsg+"This PC was exported from "+game.system.data.title+": "+pcGameSystemVersion+" and this game server is running "+game.system.data.title+": "+ systemVersion+".<br><br>Unfortunately, game systems usually are not backwards compatible, so we are aborting this import. To manually override, please download the hero export from herovau.lt. <br><strong>This may break this PC -- you  have been warned!</strong><br><br>";
            } else
              errMsg=errMsg+"This PC was exported from "+game.system.data.title+": "+pcGameSystemVersion+" and this game server is running "+game.system.data.title+": "+ systemVersion+".<br><br>";
          }
          if (hvDebug) 
            console.log("%cHeroVau.lt/Foundry Bridge | Mismatch?:%c"+systemVersionMismatch+" | " +coreVersionMismatch,hvColor1,hvColor4);
          if (systemVersionMismatch || coreVersionMismatch) {

            errMsg=errMsg+"There may be compatibility issues."  
            let chatData = {
                user: game.user._id,
                speaker: ChatMessage.getSpeaker(),
                content: errMsg,
                whisper: [game.user._id]
            };
            ChatMessage.create(chatData, {});
            if (abort)
              return;
          }

          if (responseJSON._id) {
            importPCID=new RegExp(responseJSON._id, "g");
            charDataStr=JSON.stringify(responseJSON);
            if (hvDebug) {
                console.log("%cHeroVau.lt/Foundry Bridge | Target ID:%c"+targetPCID,hvColor1,hvColor4);
                console.log("%cHeroVau.lt/Foundry Bridge | %c"+charDataStr,hvColor1,hvColor4);
            }
            charDataStr=charDataStr.replace(importPCID,targetPCID);
            charImport=JSON.parse(charDataStr);
          }
          else
          {
            charImport=responseJSON;
            charImport._id=targetPCID
          }
          if (charImport.token.sightAngle<1)
            charImport.token.sightAngle=360
          if (charImport.token.lightAngle<1)
            charImport.token.lightAngle=360

          if (hvDebug)
            console.log("%cHLO Importer | %c Importing "+charImport.name,hvColor1,hvColor4);
          targetActor.importFromJSON(JSON.stringify(charImport));
          var request = new XMLHttpRequest();  

          request.open('GET', charImport.token.img, true);
          request.onreadystatechange = function() {
            if (this.status === 404) {
              targetActor.update({'data.token.img': "icons/svg/mystery-man.svg"});
            }
          }
          request.send();
          var request2 = new XMLHttpRequest();  
          request2.open('GET', charImport.img, true);
          request2.onreadystatechange = function() {
            if (this.status === 404) {
              console.log("got a 404");
              // console.log(targetActor.data)
              // console.log(targetActor.img)
              targetActor.update({'img': "icons/svg/mystery-man.svg"});
            }
          }
          request2.send();
      }
        
      // console.log("%cHeroVau.lt/Foundry Bridge | %creadyState: "+this.readyState,hvColor1,hvColor4)
      }
    };
    // console.log("%cHeroVau.lt/Foundry Bridge | %cDownloading PC from: " + charURL,hvColor1,hvColor4);
    xmlhttp.open("GET", charURL, true);
    xmlhttp.send();
}

var Cookie =
{
   set: function(name, value, days)
   {
      var domain, domainParts, date, expires, host;

      if (days)
      {
         date = new Date();
         date.setTime(date.getTime()+(days*86400000));
         expires = "; expires="+date.toGMTString();
      }
      else
      {
         expires = "";
      }

      host = location.host;
      if (host.split('.').length === 1)
      {
         // no "." in a domain - it's localhost or something similar
         document.cookie = name+"="+value+expires+"; path=/; SameSite=Strict";
      }
      else
      {
         domainParts = host.split('.');
         domainParts.shift();
         domain = '.'+domainParts.join('.');

         document.cookie = name+"="+value+expires+"; path=/; domain="+domain+"; SameSite=Strict";
         // check if cookie was successfuly set to the given domain
         // (otherwise it was a Top-Level Domain)
         if (Cookie.get(name) == null || Cookie.get(name) != value)
         {
            // append "." to current domain
            domain = '.'+host;
            document.cookie = name+"="+value+expires+"; path=/; domain="+domain+"; SameSite=Strict";
         }
      }
   },

   get: function(name)
   {
      var nameEQ = name + "=";
      var ca = document.cookie.split(';');
      for (var i=0; i < ca.length; i++)
      {
         var c = ca[i];
         while (c.charAt(0)==' ')
         {
            c = c.substring(1,c.length);
         }

         if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
      }
      return null;
   },

   erase: function(name)
   {
      Cookie.set(name, '', -1);
   }
};
//credit to https://gist.github.com/alexey-bass/1115557
/**
 * Simply compares two string version values.
 * 
 * Example:
 * HVversionCompare('1.1', '1.2') => -1
 * HVversionCompare('1.1', '1.1') =>  0
 * HVversionCompare('1.2', '1.1') =>  1
 * HVversionCompare('2.23.3', '2.22.3') => 1
 * 
 * Returns:
 * -1 = left is LOWER than right
 *  0 = they are equal
 *  1 = left is GREATER = right is LOWER
 *  And FALSE if one of input versions are not valid
 *
 * @function
 * @param {String} left  Version #1
 * @param {String} right Version #2
 * @return {Integer|Boolean}
 * @author Alexey Bass (albass)
 * @since 2011-07-14
 */
let HVversionCompare = function(left, right) {
    if (typeof left + typeof right != 'stringstring')
        return false;
    
    var a = left.split('.')
    ,   b = right.split('.')
    ,   i = 0, len = Math.max(a.length, b.length);
        
    for (; i < len; i++) {
        if ((a[i] && !b[i] && parseInt(a[i]) > 0) || (parseInt(a[i]) > parseInt(b[i]))) {
            return 1;
        } else if ((b[i] && !a[i] && parseInt(b[i]) > 0) || (parseInt(a[i]) < parseInt(b[i]))) {
            return -1;
        }
    }
    
    return 0;
}

function getHash(encodedHeroJSON) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    let responseJSON = JSON.parse(this.responseText);
    if (hvDebug) 
      console.log("%cHeroVau.lt/Foundry Bridge | %c"+JSON.stringify(responseJSON),hvColor1,hvColor4);
    let newHash=responseJSON.newHash;  
    return newHash;
    }
  };
  xmlhttp.open("POST", heroVaultURL+"/foundrymodule.php", true);
  xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  xmlhttp.send('action=genHash&encodedChar='+encodedHeroJSON);
}

export function exportToHVFromPBHLO(heroJSON,tAct) {
  let error=false;
  let action='importNewPCFromPBHLO';
  var xmlhttp = new XMLHttpRequest();
  const gameSystem=game.data.system.id;

  let pcEncodedJSON=encodeURIComponent(heroJSON);
  let newHash=getHash(pcEncodedJSON);
  // console.log(pcEncodedJSON);
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      let responseJSON = JSON.parse(this.responseText);
      if (responseJSON.error==false){
        ui.notifications.info("Successfully exported to HeroVau.lt."); 
        tAct.update({
          'flags.herovault.uid':responseJSON.charhash
        });
        return responseJSON.charhash;
      } else {
        ui.notifications.warn("Unable to export to HeroVau.lt. Please try manually."); 
      }
    }
  };
  // console.log("%cHeroVau.lt/Foundry Bridge | %chttps://herovau.lt/foundrymodule.php?action=importNewPC&userToken="+userToken+"&encodedChar="+pcEncodedJSON,hvColor1,hvColor4);
  xmlhttp.open("POST", heroVaultURL+"/foundrymodule.php", true);
  xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  xmlhttp.send('action='+action+'&userToken='+hvUserToken+'&encodedChar='+pcEncodedJSON+'&gamesystem='+gameSystem+"&charUID="+newHash);
  
}

export function supportCheck() {
  // console.log("SupportCheck: "+hvUserToken)
  if(hvUserToken) {
    return true;
  }
}