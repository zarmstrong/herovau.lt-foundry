const hvDebug = { enabled: false };
const hvVer = "0.10.6";
let heroVaultURL = "https://herovau.lt";

const hvColor1 = "color: #7bf542"; //bright green
const hvColor2 = "color: #d8eb34"; //yellow green
const hvColor3 = "color: #ffffff"; //white
const hvColor4 = "color: #cccccc"; //gray
const hvColor5 = "color: #ff0000"; //red
let HLOuserToken, hvUserToken, skipTokenPrompt;
let enableHLO = true;
let enablePB = true;
let pfsEnabled = true;
let proto = "https";
if (location.protocol !== "https:") {
  heroVaultURL = "http://herovau.lt";
}

Hooks.on("ready", async function () {
  console.log(
    "%cHeroVau.lt/Foundry Bridge | %cinitializing",
    hvColor1,
    hvColor4
  );

  if (location.protocol !== "https:") {
    if (game.user.isGM)
      ui.notifications.info(
        "GM: Please set your server to use HTTPS. For instructions see (coming soon)."
      );
    ui.notifications.info("HeroVau.lt using insecure HTTP mode.");
  }

  if (Cookie.get("hvut")) {
    game.settings.set("herovaultfoundry", "userToken", Cookie.get("hvut"));
    hvUserToken = game.settings.get("herovaultfoundry", "userToken");
    Cookie.set("hvut", "", -1);
  }
  if (Cookie.get("herovault_skiptoken")) {
    skipTokenPrompt = Cookie.get("herovault_skiptoken");
    game.settings.set("herovaultfoundry", "userToken", skipTokenPrompt);
    Cookie.set("herovault_skiptoken", "", -1);
  }
  game.settings.register("herovaultfoundry", "userToken", {
    name: "HeroVau.lt User Token",
    hint:
      "Please enter your personal user token from " +
      heroVaultURL +
      ". Your HeroVau.lt token allows you to import and export PCs directly into your HeroVau.lt account.  This is not required to use the Pathbuilder or HeroLab Online features.",
    scope: "client",
    config: true,
    type: String,
    default: ( hvUserToken.length > 0 ? hvUserToken : ""),
    onChange: value =>  ( hvUserToken = game.settings.get("herovaultfoundry", "userToken") )
  });
  game.settings.register("herovaultfoundry", "hlouserToken", {
    name: "HeroLab Online User Token (optional)",
    hint: "Please enter your personal user token. A user token allows external tools (like HeroVau.lt) to access the HLO server and perform export operations.",
    scope: "client",
    config: true,
    type: String,
    default: "",
    onChange: (value) => setHLOToken(),
  });
  game.settings.register("herovaultfoundry", "debugEnabled", {
    name: "Enable debug mode",
    hint: "Debug output will be written to the js console.",
    scope: "client",
    config: true,
    type: Boolean,
    default: false,
    onChange: (value) =>
      (hvDebug.enabled = game.settings.get("herovaultfoundry", "debugEnabled")),
  });
  game.settings.register("herovaultfoundry", "skipTokenPrompt", {
    name: "Skip Token Prompt",
    hint: "Once your HeroVau.lt user token is set, you will no longer be prompted to set it. Unchecking this makes HeroVau.lt prompt you for the User Token again.",
    scope: "client",
    config: true,
    type: Boolean,
    default: false,
    onChange: (value) =>
      (skipTokenPrompt = game.settings.get(
        "herovaultfoundry",
        "skipTokenPrompt"
      )),
  });
  hvDebug.enabled = game.settings.get("herovaultfoundry", "debugEnabled");
  HLOuserToken = game.settings.get("herovaultfoundry", "hlouserToken");
  hvUserToken = game.settings.get("herovaultfoundry", "userToken");
  skipTokenPrompt = game.settings.get("herovaultfoundry", "skipTokenPrompt");
  // if (!skipTokenPrompt)
});

Hooks.on("renderActorSheet", function (obj, html) {
  const actor = obj.actor;
  // Only inject the link if the actor is of type "character" and the user has permission to update it
  if (hvDebug.enabled) {
    console.log(
      "%cHeroVau.lt/Foundry Bridge | %cActor type: " +
        actor.type +
        "can update?: " +
        actor.testUserPermission(game.user, "update"),
      hvColor1,
      hvColor4
    );
  }

  if (
    !(
      actor.type === "character" &&
      actor.testUserPermission(game.user, "update")
    )
  )
    return;

  let element = html.find(".window-header .window-title");
  if (element.length != 1) return;
  let head = html.find(".window-header");
  let hvButton = head.find("#herovault");
  if (hvButton.length == 0) {
    let vaultButton = $(
      `<a class="popout" id="herovault"><i class="fas fa-cloud"></i>Vault</a>`
    );
    vaultButton.on("click", () => checkNextAction(actor));
    element.after(vaultButton);
  }
  if (game.modules.get("pathbuilder2e-import")?.active && enablePB) {
    $("a:contains('Import from Pathbuilder')").remove();
  }
});

function setHLOToken() {
  HLOuserToken = game.settings.get("herovaultfoundry", "hlouserToken");
}

async function checkUserToken(token) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      let responseJSON = JSON.parse(this.responseText);
      if (hvDebug.enabled)
        console.log(
          "%cHeroVau.lt/Foundry Bridge | %ccheckUserToken: " +
            JSON.stringify(responseJSON),
          hvColor1,
          hvColor4
        );
      if (responseJSON.status == 1) {
        hvUserToken = token;
        game.settings.set("herovaultfoundry", "userToken", token);
        game.settings.set("herovaultfoundry", "skipTokenPrompt", true);
        skipTokenPrompt = true;
        return true;
      } else {
        hvUserToken = "";
        game.settings.set("herovaultfoundry", "userToken", null);
        game.settings.set("herovaultfoundry", "skipTokenPrompt", false);
        skipTokenPrompt = false;
        return false;
      }
    }
  };
  var hashedToken = await getSHA(token);
  if (hvDebug.enabled)
    console.log(
      "%cHeroVau.lt/Foundry Bridge | %c/foundrymodule.php?action=iv&userToken=" +
        hashedToken,
      hvColor1,
      hvColor4
    );
  xmlhttp.open(
    "POST",
    heroVaultURL + "/foundrymodule.php",
    true
  );
  xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  xmlhttp.send(
    "action=iv" +
      "&userToken=" +
      hvUserToken +
      "&hvVer=" + 
      encodeURIComponent(hvVer)
  );
}

function checkNextAction(obj) {
  if (!game.modules.get("herovaultfoundry")?.active) {
    if (skipTokenPrompt) {
      if (hvDebug.enabled)
        console.log(
          "%cHeroVau.lt/Foundry Bridge | %cCalling herovaultmenu",
          hvColor1,
          hvColor4
        );
      herovaultMenu(obj);
    } else {
      if (hvUserToken == null) hvUserToken = "";
      getVaultToken(herovaultMenu, targetActor);
    }
  } else {
    pickAFunction(obj);
  }
}

async function loadPB(obj) {
  game.modules
    .get("pathbuilder2e-import")
    ?.api?.beginPathbuilderImport(obj, true);
}

async function loadHLO(obj) {
  game.modules.get("hlo-importer")?.api?.hloShim(obj);
}

async function pickAFunction(obj) {
  let hloImport = false;
  let hvImport = false;
  let pbImport = false;
  let PFSPC = false;
  let dopt = {
    width: 400,
    height: "auto",
  };
  let menuButtons = {
    heroVaultImport: {
      icon: "<i class='fas fa-cloud'></i>",
      label: `HeroVau.lt Import/Export`,
      callback: () => (hvImport = true),
    },
  };
  if (
    game.system.id == "pf2e" &&
    game.modules.get("hlo-importer")?.active &&
    enableHLO
  ) {
    menuButtons = {
      ...menuButtons,
      hloimport: {
        icon: "<i class='fas fa-flask'></i>",
        label: `Import from Herolab Online`,
        callback: () => (hloImport = true),
      },
    };
    dopt.width += 100;
  }
  if (
    game.system.id == "pf2e" &&
    game.modules.get("pathbuilder2e-import")?.active &&
    enablePB
  ) {
    menuButtons = {
      ...menuButtons,
      pbimport: {
        icon: "<i class='fas fa-check'></i>",
        label: `Import from Pathbuilder 2e`,
        callback: () => (pbImport = true),
      },
    };
    dopt.width += 100;
  }
  if (game.system.id == "pf2e" && pfsEnabled) {
    menuButtons = {
      ...menuButtons,
      pfsimport: {
        icon: "<i class='fas fa-search'></i>",
        label: `Find & Import a PFS PC`,
        callback: () => (PFSPC = true),
      },
    };
    dopt.width += 100;
  }
  menuButtons = {
    ...menuButtons,
    no: {
      icon: "<i class='fas fa-times'></i>",
      label: `Cancel`,
    },
  };

  new Dialog(
    {
      title: `HeroVau.lt Import`,
      content: `
      <div>
        <p>Please select the importer you'd like to use from the options below.</p>
      <div>
      <hr/>`,
      buttons: menuButtons,
      default: "no",
      close: (html) => {
        if (hvImport) {
          beginVaultConnection(obj);
        } else if (hloImport) {
          loadHLO(obj);
        } else if (pbImport) {
          loadPB(obj);
        } else if (PFSPC) {
          pfsDialogue(obj);
        }
      },
    },
    dopt
  ).render(true);
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
function pfsDialogue(obj) {
  let pfsnumber, pfscharnumber, searchPFS;
  new Dialog({
    title: `Pathfinder Society Import`,
    content: `
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
        `,
    buttons: {
      yes: {
        icon: "<i class='fas fa-check'></i>",
        label: `Import`,
        callback: () => (searchPFS = true),
      },
      no: {
        icon: "<i class='fas fa-times'></i>",
        label: `Cancel`,
      },
    },
    default: "yes",
    close: (html) => {
      if (searchPFS) {
        pfsnumber = html.find('[id="pfsnumber"]')[0].value;
        pfscharnumber = html.find('[id="pfscharnumber"]')[0].value;
        if (hvDebug.enabled)
          console.log(
            "%cHeroVau.lt/Foundry Bridge | %cSearching for " +
              pfsnumber +
              "-" +
              pfscharnumber,
            hvColor1,
            hvColor4
          );
        findPFS(obj, pfsnumber, pfscharnumber);
      }
    },
  }).render(true);
}

async function findPFS(obj, pfsnumber, pfscharnumber) {
  var hvUserToken = game.settings.get("herovaultfoundry", "userToken");
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      let responseJSON = JSON.parse(this.responseText);
      if (hvDebug.enabled)
        console.log(
          "%cHeroVau.lt/Foundry Bridge | %c" + JSON.stringify(responseJSON),
          hvColor1,
          hvColor4
        );
      if (Object.keys(responseJSON).length >= 1) {
        if (hvDebug.enabled)
          console.log(
            "%cHeroVau.lt/Foundry Bridge | %cCalling createPCTable",
            hvColor1,
            hvColor4
          );
        createPCTable(obj, responseJSON);
      } else {
        ui.notifications.error("Unable to find any results.");
        return;
      }
    }
  };
  if (hvDebug.enabled)
    console.log(
      "%cHeroVau.lt/Foundry Bridge | %c/foundrymodule.php?action=findPFS&pfsnumber=" +
        pfsnumber +
        "&pfscharnumber=" +
        pfscharnumber,
      hvColor1,
      hvColor4
    );
  xmlhttp.open(
    "POST",
    heroVaultURL +
      "/foundrymodule.php",
    true
  );
  xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  xmlhttp.send(
    "action=findPFS" +
      action +
      "&pfsnumber=" +
      pfsnumber +
      "&pfscharnumber=" +
      pfscharnumber +
      "&hvVer=" + 
      encodeURIComponent(hvVer)
  );
}

function getVaultToken(
  callback,
  callbackArg1,
  callbackArg2,
  callbackArg3,
  callbackArg4
) {
  let applyChanges = false;
  if (hvUserToken == null) hvUserToken = "";
  new Dialog({
    title: `Connect to HeroVau.lt`,
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
        label: `Connect to HeroVau.lt`,
        callback: () => (applyChanges = true),
      },
      no: {
        icon: "<i class='fas fa-times'></i>",
        label: `Cancel`,
      },
    },
    default: "yes",
    close: (html) => {
      if (applyChanges) {
        let userToken = html.find('[id="textBoxUserToken"]')[0].value;
        let skipToken = html.find('[id="skipToken"]')[0].checked;
        // console.log("saving hvut " + userToken);
        // game.settings.set('herovaultfoundry', 'userToken',userToken);
        checkUserToken(userToken);
        hvUserToken = userToken;
        if (skipToken)
          game.settings.set("herovaultfoundry", "skipTokenPrompt", true);
        callback(callbackArg1, callbackArg2, callbackArg3, callbackArg4);
      }
    },
  }).render(true);
}

async function exportToHV(targetActor) {
  try {
    var hvUserToken = game.settings.get("herovaultfoundry", "userToken");
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        let responseJSON = JSON.parse(this.responseText);
        if (hvDebug.enabled)
          console.log(
            "%cHeroVau.lt/Foundry Bridge | %c" + JSON.stringify(responseJSON),
            hvColor1,
            hvColor4
          );
        if (responseJSON.status == 1) {
          performExportToHV(targetActor);
        } else {
          hvUserToken = "";
          game.settings.set("herovaultfoundry", "userToken", null);
          ui.notifications.warn(
            "Unable to load vault.  Please double-check your User Token."
          );
          game.settings.set("herovaultfoundry", "skipTokenPrompt", false);
          getVaultToken(exportToHV, targetActor, hvUserToken);
        }
      }
    };
    if (hvDebug.enabled)
      console.log(
        "%cHeroVau.lt/Foundry Bridge | %c/foundrymodule.php?action=iv&userToken=" +
          hvUserToken,
        hvColor1,
        hvColor4
      );
    xmlhttp.open(
      "POST",
      heroVaultURL + "/foundrymodule.php",
      true
    );
    xmlhttp.setRequestHeader(
          "Content-type",
          "application/x-www-form-urlencoded"
        );
    xmlhttp.send(
      "action=iv" +
        "&userToken=" +
        hvUserToken  +
        "&hvVer=" + 
        encodeURIComponent(hvVer)
    );
  } catch (e) {
    console.log(e);
  }
}

async function toDataURL(src, callback, outputFormat) {
  var img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = function() {
    var canvas = document.createElement('CANVAS');
    var ctx = canvas.getContext('2d');
    var dataURL;
    canvas.height = this.naturalHeight;
    canvas.width = this.naturalWidth;
    ctx.drawImage(this, 0, 0);
    dataURL = canvas.toDataURL(outputFormat);
    callback(dataURL);
  };
  img.src = src;
  if (img.complete || img.complete === undefined) {
    img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
    img.src = src;
  }
}

function returnImage(img) {
  console.log("I got img: "+img)
  return img;
}

async function performExportToHV(targetActor) {
  try {
    let menuButtons = {};
    let exportNewPC = false;
    let exportOverwritePC = false;
    let vaultInfo = false;
    let canOverwrite = false;
    let portrait, hvUID, portraitAddress, tokenAddress;
    //let portrait, token;

    hvUserToken = game.settings.get("herovaultfoundry", "userToken");
    var hvUserTokenHashed=await getSHA(hvUserToken);

    portrait = "icons/svg/mystery-man.svg";
    if (
      targetActor.img != undefined &&
      targetActor.prototypeToken.texture.src != undefined
    ) {
      if (targetActor.img.includes("mystery-man") == -1) {
        portrait = targetActor.img;
      } else if (
        targetActor.prototypeToken.texture.src.includes("mystery-man") == -1
      ) {
        portrait = targetActor.prototypeToken.texture.src;
      } else {
        portrait = targetActor.img;
      }
      if (hvDebug.enabled)
        console.log(
          "%cHeroVau.lt/Foundry Bridge | %cportrait includes: " +
            targetActor.img.includes("http"),
          hvColor1,
          hvColor4
        );
      // if (
      //   targetActor.img.includes("http") == false &&
      //   targetActor.img.includes("cdn.herovau.lt") == false
      // ) {
        // portraitAddress = game.data.addresses.remote + targetActor.img.trim();
        portraitAddress = targetActor.img.trim();
        // await targetActor.update({'data.img': portraitAddress});
        // targetActor.img=portraitAddress;
        if (hvDebug.enabled) {
          console.log(
            "%cHeroVau.lt/Foundry Bridge | %c target: " + targetActor,
            hvColor1,
            hvColor4
          );
          console.log(
            "%cHeroVau.lt/Foundry Bridge | %cportrait: " + portraitAddress,
            hvColor1,
            hvColor4
          );
          console.log(
            "%cHeroVau.lt/Foundry Bridge | %csheet portrait: " +
              targetActor.img,
            hvColor1,
            hvColor4
          );
        }
      //}
      // if (
      //   targetActor.prototypeToken.texture.src.includes("http") == false &&
      //   targetActor.prototypeToken.texture.src.includes("cdn.herovau.lt") ==
      //     false
      // ) {
        // tokenAddress =
        //   game.data.addresses.remote +
        //   targetActor.prototypeToken.texture.src.trim();
        tokenAddress =targetActor.prototypeToken.texture.src.trim();
        // await targetActor.update({
        //   "prototypeToken.texture.src": tokenAddress,
        // });
        // targetActor.prototypeToken.texture.src=tokenAddress;
        if (hvDebug.enabled) {
          console.log(
            "%cHeroVau.lt/Foundry Bridge | %ctoken: " + tokenAddress,
            hvColor1,
            hvColor4
          );
          console.log(
            "%cHeroVau.lt/Foundry Bridge | %csheet token: " +
              targetActor.prototypeToken.texture.src,
            hvColor1,
            hvColor4
          );
        }
      // } else if (targetActor.prototypeToken.texture.src.includes("http"))
      // {
      //   tokenAddress = targetActor.prototypeToken.texture.src.trim();
      //   await targetActor.update({
      //     "prototypeToken.texture.src": tokenAddress,
      //   });
      //   // targetActor.prototypeToken.texture.src=tokenAddress;
      //   if (hvDebug.enabled) {
      //     console.log(
      //       "%cHeroVau.lt/Foundry Bridge | %ctoken: " + tokenAddress,
      //       hvColor1,
      //       hvColor4
      //     );
      //     console.log(
      //       "%cHeroVau.lt/Foundry Bridge | %csheet token: " +
      //         targetActor.prototypeToken.texture.src,
      //       hvColor1,
      //       hvColor4
      //     );
      //   }        
      // }
    }

    if (targetActor?.flags?.herovault?.uid ) {
      console.log(targetActor.flags)
      hvUID = targetActor.flags.herovault.uid;
      let accChk = await checkForAccess(hvUserToken, hvUID);
      canOverwrite = accChk.canAccess;
      // Promise.resolve(checkForAccess(hvUserToken,hvUID)).then( res => canOverwrite=res);
    } else if (targetActor?.data?.flags?.herovault?.uid) {
      hvUID = targetActor.data.flags.herovault.uid;
      let accChk = await checkForAccess(hvUserToken, hvUID);
      canOverwrite = accChk.canAccess;
    }
    vaultInfo = await getVaultSlots(hvUserToken);
    // Promise.resolve(getVaultSlots(userToken)).then( res => vaultInfo=res);
    if (hvDebug.enabled)
      console.log(
        "%cHeroVau.lt/Foundry Bridge | %cvaultInfo: " +
          JSON.stringify(vaultInfo),
        hvColor1,
        hvColor4
      );

    let totalSlots = vaultInfo.totalSlots;
    let usedSlots = vaultInfo.usedSlots;
    let freeSlots = totalSlots - usedSlots;
    let bdy = `<div><p>You have ${freeSlots}/${totalSlots} character slots free.</p><div><hr/>`;

    if (hvDebug.enabled)
      console.log(
        "%cHeroVau.lt/Foundry Bridge | %ccan access/overwrite?: " +
          canOverwrite,
        hvColor1,
        hvColor4
      );
    if (freeSlots < 1 && canOverwrite == false) {
      bdy = `<div><p>Unfortunately you do not have enough open slots in your <a href="https://herovau.lt">HeroVau.lt</a> to export this PC.<br>Please upgrade your account or delete a PC from your account to free up some space.</p><div><hr/>`;

      new Dialog({
        title: "Export to your HeroVau.lt",
        content: bdy,
        buttons: {
          yes: {
            icon: "<i class='fas fa-check'></i>",
            label: `Ok`,
          },
        },
        default: "yes",
      }).render(true);
    } else {
      if (freeSlots > 0) {
        menuButtons = {
          ...menuButtons,
          exportNew: {
            icon: "<i class='fas fa-file-export'></i>",
            label: `Export to HeroVau.lt as New PC`,
            callback: () => (exportNewPC = true),
          },
        };
        bdy =
          bdy +
          `<div><p>You can export this character as a new PC, taking up a slot on your account. <br><small>(Note: if the same exact copy of this character exists on your account, it will be overwritten)</small></p></div>`;
      } else {
        bdy =
          bdy +
          `<div><p>You do not have enough free slots to export this character as a new PC.</p></div>`;
      }
      if (canOverwrite) {
        bdy =
          bdy +
          `<div><p>Since this character already exists in your vault, you can overwrite that character with this character.</p><div><hr/>`;
        menuButtons = {
          ...menuButtons,
          exportOverwrite: {
            icon: "<i class='fas fa-file-export'></i>",
            label: `Export to HeroVau.lt overwriting existing PC`,
            callback: () => (exportOverwritePC = true),
          },
        };
      }
      menuButtons = {
        ...menuButtons,
        no: {
          icon: "<i class='fas fa-times'></i>",
          label: `Cancel`,
        },
      };
      bdy =
        bdy +
        `<div><p><img src="${portrait}"><br>Please choose an action to perform:</p><div><hr/>`;
      new Dialog({
        title: "Export to your HeroVau.lt",
        content: bdy,
        buttons: menuButtons,
        default: "exportNew",
        close: async (html) => {
          if (exportNewPC) {
            hvUID = "";
            let exportStatus = await exportPCtoHV(
              targetActor,
              hvUserToken,
              hvUID,
              true,
              portraitAddress,
              tokenAddress
            );
            if (exportStatus.error == true) {
              ui.notifications.error(
                "Error exporting: " + exportStatus.message
              );
            } else {
              targetActor.update({
                "flags.herovault.uid": exportStatus.charhash,
              });
              ui.notifications.info(exportStatus.message);
            }
          } else if (exportOverwritePC) {
            if (hvDebug.enabled) console.log("export overwrite PC");
            let exportStatus = await exportPCtoHV(
              targetActor,
              hvUserTokenHashed,
              hvUID,
              false,
              portraitAddress,
              tokenAddress
            );
            if (exportStatus.error == true) {
              ui.notifications.error(
                "Error exporting: " + exportStatus.message
              );
            } else {
              targetActor.update({
                "flags.herovault.uid": exportStatus.charhash,
              });
              ui.notifications.info(exportStatus.message);
            }
          }
        },
      }).render(true);
    }
  } catch (e) {
    console.log(e);
  }
}
const checkForAccess = async (hvUserToken, hvUID) => {
  return new Promise((resolve) => {
    let error = false;
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        let responseJSON = JSON.parse(this.responseText);
        if (hvDebug.enabled)
          console.log(
            "%cHeroVau.lt/Foundry Bridge | %c" + JSON.stringify(responseJSON),
            hvColor1,
            hvColor4
          );
        if (error) {
          resolve(false);
        } else {
          resolve(responseJSON);
        }
      }
    };
    if (hvDebug.enabled) {
      console.log(
        "%cHeroVau.lt/Foundry Bridge | %cChecking if this account can access: " +
          hvUID,
        hvColor1,
        hvColor4
      );
      console.log(
        "%cHeroVau.lt/Foundry Bridge | %chttps://herovau.lt/foundrymodule.php?action=checkCharacter&userToken=" +
          hvUserToken +
          "&charUID=" +
          hvUID,
        hvColor1,
        hvColor4
      );
    }
    xmlhttp.open(
      "POST",
      heroVaultURL +
        "/foundrymodule.php",
      true
    );
    xmlhttp.setRequestHeader(
      "Content-type",
      "application/x-www-form-urlencoded"
    );
    xmlhttp.send(
      "action=checkCharacter" +
        "&userToken=" +
        hvUserToken + 
        "&charUID=" +
        hvUID +
        "&hvVer=" + 
        encodeURIComponent(hvVer)

    );
  });
};

const getVaultSlots = async (hvUserToken) => {
  return new Promise((resolve) => {
    let error = false;
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        let responseJSON = JSON.parse(this.responseText);
        if (hvDebug.enabled)
          console.log(
            "%cHeroVau.lt/Foundry Bridge | %c" + JSON.stringify(responseJSON),
            hvColor1,
            hvColor4
          );
        if (error) {
          resolve(false);
        } else {
          resolve(responseJSON);
        }
      }
    };
    if (hvDebug.enabled)
      console.log(
        "%cHeroVau.lt/Foundry Bridge | %chttps://herovau.lt/foundrymodule.php?action=getVaultSlots&userToken=" +
          hvUserToken,
        hvColor1,
        hvColor4
      );
    xmlhttp.open(
      "POST",
      heroVaultURL +
        "/foundrymodule.php",
      true
    );
    xmlhttp.setRequestHeader(
      "Content-type",
      "application/x-www-form-urlencoded"
    );
    xmlhttp.send(
      "action=getVaultSlots" +
        "&userToken=" +
        hvUserToken  +
        "&hvVer=" + 
        encodeURIComponent(hvVer)
    );
  });
};

const exportPCtoHV = (
  targetActor,
  userToken,
  charUID,
  importAsNew,
  portraitAddress,
  tokenAddress
) => {
  return new Promise((resolve) => {
    let error = false;
    let action = "";
    if (importAsNew) action = "importNewPC";
    else action = "importExistingPC";

    const gameSystem = game.system.id;
    const gameSystemVersion = game.system.version;
    const foundryVersion = game.version;
    let pcEncodedJSON = encodeURIComponent(
      JSON.stringify(targetActor.toObject())
    );
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        let responseJSON = JSON.parse(this.responseText);
        console.log(responseJSON);
        if (hvDebug.enabled)
          console.log(
            "%cHeroVau.lt/Foundry Bridge | %c" + JSON.stringify(responseJSON),
            hvColor1,
            hvColor4
          );
          charUID = responseJSON.charhash;
          toDataURL(targetActor.img, function(dataUrl) {
            var xmlhttpPortrait = new XMLHttpRequest();
            xmlhttpPortrait.onreadystatechange = function () {
              if (this.readyState == 4 && this.status == 200) {
                let responseJSON = JSON.parse(this.responseText);
                console.log(responseJSON);
                if (hvDebug.enabled)
                  console.log(
                    "%cHeroVau.lt/Foundry Bridge | %cPortrait Upload:" + JSON.stringify(responseJSON),
                    hvColor1,
                    hvColor4
                  );
                if (responseJSON.status == "OK")
                  ui.notifications.info("Successfully exported portrait image HeroVau.lt.");
                resolve(responseJSON);
              }
            };
            xmlhttpPortrait.open("POST", heroVaultURL + "/foundrymodule.php", true);
            xmlhttpPortrait.setRequestHeader(
              "Content-type",
              "application/x-www-form-urlencoded"
            );
            xmlhttpPortrait.send(
              "action=portraitSend" +
                "&userToken=" +
                userToken +
                "&charUID=" +
                charUID +
                "&portraitBase64=" +
                encodeURIComponent(dataUrl) + 
                "&hvVer=" + 
                encodeURIComponent(hvVer)
            );    
          },'image/png');

          toDataURL(targetActor.prototypeToken.texture.src, function(dataUrl) {
            var xmlhttpToken = new XMLHttpRequest();
            xmlhttpToken.onreadystatechange = function () {
              if (this.readyState == 4 && this.status == 200) {
                let responseJSON = JSON.parse(this.responseText);
                console.log(responseJSON);
                if (hvDebug.enabled)
                  console.log(
                    "%cHeroVau.lt/Foundry Bridge | %cToken Upload:" + JSON.stringify(responseJSON),
                    hvColor1,
                    hvColor4
                  );
                if (responseJSON.status == "OK")
                  ui.notifications.info("Successfully exported token image HeroVau.lt.");
                resolve(responseJSON);
              }
            };
            xmlhttpToken.open("POST", heroVaultURL + "/foundrymodule.php", true);
            xmlhttpToken.setRequestHeader(
              "Content-type",
              "application/x-www-form-urlencoded"
            );
            xmlhttpToken.send(
              "action=tokenSend" +
                "&userToken=" +
                userToken +
                "&charUID=" +
                charUID +
                "&tokenBase64=" +
                encodeURIComponent(dataUrl) +
                "&hvVer=" + 
                encodeURIComponent(hvVer)
            );
          });

        resolve(responseJSON);
      }
    };
    // console.log("%cHeroVau.lt/Foundry Bridge | %chttps://herovau.lt/foundrymodule.php?action=importNewPC&userToken="+userToken+"&encodedChar="+pcEncodedJSON,hvColor1,hvColor4);
    xmlhttp.open("POST", heroVaultURL + "/foundrymodule.php", true);
    xmlhttp.setRequestHeader(
      "Content-type",
      "application/x-www-form-urlencoded"
    );
    xmlhttp.send(
      "action=" +
        action +
        "&userToken=" +
        userToken +
        "&encodedChar=" +
        pcEncodedJSON +
        "&gamesystem=" +
        gameSystem +
        "&charUID=" +
        charUID +
        "&foundryVersion=" +
        encodeURIComponent(foundryVersion) +
        "&gameSystemVersion=" +
        encodeURIComponent(gameSystemVersion) +
                "&hvVer=" + 
                encodeURIComponent(hvVer)
    );
  });
};

function herovaultMenu(targetActor) {
  let importPC = false;
  let exportPC = false;
  let PFSPC = false;
  let hloPC = false;
  let ttl = `HeroVau.lt Import`;
  let bdy = `<div><p>Please choose an action to perform:</p><div><hr/>`;
  let dopt = {
    width: 650,
    height: "auto",
  };

  let menuButtons = {
    import: {
      icon: "<i class='fas fa-file-import'></i>",
      label: `Import from HeroVau.lt`,
      callback: () => (importPC = true),
    },
    export: {
      icon: "<i class='fas fa-file-export'></i>",
      label: `Export to HeroVau.lt`,
      callback: () => (exportPC = true),
    },
  };
  menuButtons = {
    ...menuButtons,
    no: {
      icon: "<i class='fas fa-times'></i>",
      label: `Cancel`,
    },
  };
  new Dialog(
    {
      title: ttl,
      content: bdy,
      buttons: menuButtons,
      default: "yes",
      close: (html) => {
        if (importPC) {
          if (hvDebug.enabled) console.log("import PC menu");
          loadPersonalVault(targetActor, hvUserToken);
        } else if (exportPC) {
          if (hvDebug.enabled) console.log("export PC");
          exportToHV(targetActor, hvUserToken);
        }
      },
    },
    dopt
  ).render(true);
}

function exportPC(targetActor) {
  let applyChanges = false;
  if (hvUserToken == null) hvUserToken = "";
}

function beginVaultConnection(targetActor) {
  if (skipTokenPrompt) {
    if (hvDebug.enabled)
      console.log(
        "%cHeroVau.lt/Foundry Bridge | %cCalling herovaultMenu in beginVaultConnection",
        hvColor1,
        hvColor4
      );
    herovaultMenu(targetActor, hvUserToken);
  } else {
    if (hvUserToken == null) hvUserToken = "";
    getVaultToken(herovaultMenu, targetActor, hvUserToken);
  }
}

function loadPersonalVault(targetActor) {
  const gameSystem = game.system.id;
  let error = false;
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      let responseJSON = JSON.parse(this.responseText);
      if (hvDebug.enabled)
        console.log(
          "%cHeroVau.lt/Foundry Bridge | %c" + responseJSON,
          hvColor1,
          hvColor4
        );
      if (responseJSON.hasOwnProperty("error")) {
        if (hvDebug.enabled)
          console.log(
            "%cHeroVau.lt/Foundry Bridge | %cerror found in response",
            hvColor1,
            hvColor4
          );
        error = true;
      } else if (hvDebug.enabled)
        console.log(
          "%cHeroVau.lt/Foundry Bridge | %c" + Object.keys(responseJSON).length,
          hvColor1,
          hvColor4
        );

      if (error) {
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
              label: `Ok`,
            },
          },
          default: "yes",
        }).render(true);
      } else {
        if (Object.keys(responseJSON).length >= 1) {
          if (hvDebug.enabled)
            console.log(
              "%cHeroVau.lt/Foundry Bridge | %cCalling checkHLOCharacterIsCorrect",
              hvColor1,
              hvColor4
            );

          createPCTable(targetActor, responseJSON);
        } else {
          ui.notifications.warn(
            "Unable to load vault.  Please double-check your User Token."
          );
          game.settings.set("herovaultfoundry", "skipTokenPrompt", false);
          getVaultToken(loadPersonalVault, targetActor, hvUserToken);
          return;
        }
      }

      // console.log("%cHeroVau.lt/Foundry Bridge | %creadyState: "+this.readyState,hvColor1,hvColor4)
    }
  };
  if (hvDebug.enabled)
    console.log(
      "%cHeroVau.lt/Foundry Bridge | %cusertoken: " + hvUserToken,
      hvColor1,
      hvColor4
    );
  xmlhttp.open(
    "POST",
    heroVaultURL +
      "/foundrymodule.php",
    true
  );
  xmlhttp.setRequestHeader(
    "Content-type",
    "application/x-www-form-urlencoded"
  );
  xmlhttp.send(
    "action=getvault" +
      "&gamesystem=" +
      encodeURIComponent(gameSystem) +
      "&hvVer=" +
      hvVer +
      "&userToken=" +
      hvUserToken +
      "&hvVer=" + 
      encodeURIComponent(hvVer)
  );
}

function createPCTable(targetActor, responseJSON) {
  var charName,
    charRace,
    charClass,
    charLevel,
    charuid,
    pickedCharacter,
    selectedCharUID,
    edit;
  let dopt = {
    width: 650,
    height: "auto",
  };
  if (hvDebug.enabled)
    console.log(
      "%cHeroVau.lt/Foundry Bridge | %cin createPCTable",
      hvColor1,
      hvColor4
    );
  var htmlOut =
    "<strong>Select a PC from the list:</strong><br><br><select name='pcid' id='pcid' style='width:100%;'>";
  for (var pccount = 0; pccount < responseJSON.length; pccount++) {
    charName = responseJSON[pccount].charname;
    charRace = responseJSON[pccount].charrace;
    charClass = responseJSON[pccount].charclass;
    charLevel = responseJSON[pccount].charlevel;
    charuid = responseJSON[pccount].charuid;
    edit = responseJSON[pccount].edit;
    htmlOut =
      htmlOut +
      "<option value='" +
      charuid +
      "'>" +
      charName +
      ": " +
      charRace +
      " " +
      charClass +
      " (Level " +
      charLevel +
      ") - Last edited @ " +
      edit +
      "</option>";
  }
  htmlOut = htmlOut + "</select><br>";
  new Dialog(
    {
      title: "Importable Character List",
      content:
        `
      <div>` +
        htmlOut +
        `</div><br><br>
      `,
      buttons: {
        yes: {
          icon: "<i class='fas fa-check'></i>",
          label: `Proceed`,
          callback: () => (pickedCharacter = true),
        },
        no: {
          icon: "<i class='fas fa-times'></i>",
          label: `Cancel`,
          callback: () => (pickedCharacter = false),
        },
      },
      default: "yes",
      close: (html) => {
        if (pickedCharacter) {
          if (hvDebug.enabled) console.log("yes clicked");
          selectedCharUID = html.find('[id="pcid"]')[0].value;
          if (hvDebug.enabled)
            console.log("Selected PC id: " + selectedCharUID);
          requestCharacter(targetActor, selectedCharUID);
        } else {
          if (hvDebug.enabled) console.log("cancel clicked");
        }
      },
    },
    dopt
  ).render(true);
}

function requestCharacter(targetActor, charUID) {
  let error = false;
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      let responseJSON = JSON.parse(this.responseText);
      if (hvDebug.enabled)
        console.log(
          "%cHeroVau.lt/Foundry Bridge | %c" + responseJSON,
          hvColor1,
          hvColor4
        );
      if (responseJSON.hasOwnProperty("error")) {
        if (hvDebug.enabled)
          console.log(
            "%cHeroVau.lt/Foundry Bridge | %cerror found in response",
            hvColor1,
            hvColor4
          );
        error = true;
      } else if (hvDebug.enabled)
        console.log(
          "%cHeroVau.lt/Foundry Bridge | %c" + Object.keys(responseJSON).length,
          hvColor1,
          hvColor4
        );

      if (error) {
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
              label: `Ok`,
            },
          },
          default: "yes",
        }).render(true);
      } else {
        if (responseJSON.downloadURL) {
          if (hvDebug.enabled)
            console.log(
              "%cHeroVau.lt/Foundry Bridge | %cGot the URL: " +
                responseJSON.downloadURL,
              hvColor1,
              hvColor4
            );
          importCharacter(targetActor, responseJSON.downloadURL);
        } else {
          ui.notifications.warn(
            "Unable find character.  Please contact HeroVau.lt support."
          );
          return;
        }
      }

      // console.log("%cHeroVau.lt/Foundry Bridge | %creadyState: "+this.readyState,hvColor1,hvColor4)
    }
  };
  if (hvDebug.enabled)
    console.log(
      "%cHeroVau.lt/Foundry Bridge | %ccharUID: " + charUID,
      hvColor1,
      hvColor4
    );
  xmlhttp.open(
    "POST",
    heroVaultURL +
      "/foundrymodule.php",
    true
  );
  xmlhttp.setRequestHeader(
    "Content-type",
    "application/x-www-form-urlencoded"
  );
  xmlhttp.send(
    "action=getCharacter" +
      "&charUID=" +
      encodeURIComponent(charUID) +
      "&hvVer=" + 
      encodeURIComponent(hvVer)

  );
}

async function importCharacter(targetActor, charURL) {
  let error = false;
  var importPCID, errMsg, charDataStr, charImport;
  errMsg = "";
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = async function () {
    if (this.readyState == 4 && this.status == 200) {
      let responseJSON = JSON.parse(this.responseText);
      if (hvDebug.enabled)
        console.log(
          "%cHeroVau.lt/Foundry Bridge | %c" + JSON.stringify(responseJSON),
          hvColor1,
          hvColor4
        );
      if (error) {
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
              label: `Ok`,
            },
          },
          default: "yes",
        }).render(true);
      } else {
        // responseJSON
        // console.log("%cHeroVau.lt/Foundry Bridge | Import ID:%c"+responseJSON._id,hvColor1,hvColor4);
        let targetPCID = targetActor._id;
        let coreVersionMismatch = false;
        let systemVersionMismatch = false;
        let abort = false;
        let systemVersion = game.system.version;
        let coreVersion = game.version;
        let pcGameSystemVersion;
        let pcCoreVersion;
        if (
          responseJSON?.flags?.herovault?.gameSystemVersion &&
          responseJSON?.flags?.herovault?.foundryVersion
        ) {
          pcCoreVersion = responseJSON.flags.herovault.foundryVersion;
          pcGameSystemVersion = responseJSON.flags.herovault.gameSystemVersion;
        } else if (
          responseJSON.flags?.exportSource?.systemVersion &&
          responseJSON.flags?.exportSource?.coreVersion
        ) {
          pcCoreVersion = responseJSON.flags.exportSource.coreVersion;
          pcGameSystemVersion = responseJSON.flags.exportSource.systemVersion;
        }

        if (pcCoreVersion != coreVersion) {
          coreVersionMismatch = true;
          errMsg =
            errMsg +
            "This PC was exported from Foundry v" +
            pcCoreVersion +
            " and this game server is running Foundry v" +
            coreVersion +
            ".<br><br>";
        }
        if (pcGameSystemVersion != systemVersion) {
          systemVersionMismatch = true;
          if (HVversionCompare(pcGameSystemVersion, systemVersion) == 1) {
            //game system is older than PC, this could be bad!
            abort = true;
            errMsg =
              errMsg +
              "This PC was exported from " +
              game.system.title +
              ": " +
              pcGameSystemVersion +
              " and this game server is running " +
              game.system.title +
              ": " +
              systemVersion +
              ".<br><br>Unfortunately, game systems usually are not backwards compatible, so we areaborting this import. To manually override, please download the hero export from herovau.lt. <br><strong>This may break this PC -- you  have been warned!</strong><br><br>If the actor won't open, it is corrupted and should be deleted. If this PC fails to import or corrupts the actor it was imported to, you should attempt to import your PC into Foundry v9 and re-export to HeroVau.lt here: https://slate-pf2-dev.forge-vtt.com/game<br>Once that procedure is complete, come back to this game and retry importing from HeroVau.lt again.";
          } else
            errMsg =
              errMsg +
              "This PC was exported from " +
              game.system.title +
              ": " +
              pcGameSystemVersion +
              " and this game server is running " +
              game.system.title +
              ": " +
              systemVersion +
              ".<br><br>";
        }
        /*        if (pcGameSystemVersion.split(".")[0]<3) {
          if (hvDebug.enabled)
            console.log(
              "%cHeroVau.lt/Foundry Bridge | Character too old, can't import. %c" +
                pcGameSystemVersion.split(".")[0],
              hvColor1,
              hvColor4
            );
            errMsg =
              "This PC was exported from " +
              game.system.title +
              ": " +
              pcGameSystemVersion +
              " which is unfortunately too old to be imported to  " +
              game.system.title +
              ": " +
              systemVersion +
              ".<br><br>Canceling import.<br><br>";
          let chatData = {
            user: game.user._id,
            speaker: ChatMessage.getSpeaker(),
            content: errMsg,
            whisper: [game.user._id],
          };
          ChatMessage.create(chatData, {});
          return;
        }
        */
        if (hvDebug.enabled)
          console.log(
            "%cHeroVau.lt/Foundry Bridge | Mismatch?:%c" +
              systemVersionMismatch +
              " | " +
              coreVersionMismatch,
            hvColor1,
            hvColor4
          );
        if (systemVersionMismatch || coreVersionMismatch) {
          errMsg = errMsg + "There may be compatibility issues.<br><br>If the actor won't open, it is corrupted and should be deleted. If this PC fails to import or corrupts the actor it was imported to, you should attempt to import your PC into Foundry v9 and re-export to HeroVau.lt here: https://slate-pf2-dev.forge-vtt.com/game<br>Once that procedure is complete, come back to this game and retry importing from HeroVau.lt again.<br><br>";
          let chatData = {
            user: game.user._id,
            speaker: ChatMessage.getSpeaker(),
            content: errMsg,
            whisper: [game.user._id],
          };
          ChatMessage.create(chatData, {});
          if (abort) return;
        }

        if (responseJSON._id) {
          importPCID = new RegExp(responseJSON._id, "g");
          charDataStr = JSON.stringify(responseJSON);
          if (hvDebug.enabled) {
            console.log(
              "%cHeroVau.lt/Foundry Bridge | Target ID:%c" + targetPCID,
              hvColor1,
              hvColor4
            );
            console.log(
              "%cHeroVau.lt/Foundry Bridge | %c" + charDataStr,
              hvColor1,
              hvColor4
            );
          }
          charDataStr = charDataStr.replace(importPCID, targetPCID);
          charImport = JSON.parse(charDataStr);
        } else {
          charImport = responseJSON;
          charImport._id = targetPCID;
        }
        if (charImport?.data?.saves && Array.isArray(charImport.data.saves)) {
          if (hvDebug.enabled)
            console.log(
              "%cHeroVau.lt/Foundry Bridge | %cConverting a bad saves array to object.",
              hvColor1,
              hvColor4
            );
          let oldsaves = charImport.data.saves;
          var newSaves = Object.assign({}, oldsaves);
          charImport.data.saves = newSaves;
        }

        if (hvDebug.enabled)
          console.log(
            "%cHeroVau.lt/Foundry Bridge | %cChecking for crafting:" +
              responseJSON?.data?.crafting,
            hvColor1,
            hvColor4
          );
        if (charImport?.data && !charImport?.data?.crafting) {
          if (hvDebug.enabled)
            console.log(
              "%cHeroVau.lt/Foundry Bridge | %c Adding crafting block to PC",
              hvColor1,
              hvColor4
            );
          var crafting = { formulas: [] };
          charImport.data.crafting = crafting;
        }

        let oldPermissions = targetActor.permission;
        charImport.permission = oldPermissions;
        if (hvDebug.enabled)
          console.log(
            "%cHeroVau.lt/Foundry Bridge | %cHLO Importer | %c Importing " +
              charImport.name,
            hvColor1,
            hvColor5,
            hvColor4
          );

        let targetid = targetActor._id;
        targetActor = Actor.get(targetid);

        // let promise = await new Promise(resolve => { targetActor.deleteEmbeddedDocuments("Item", [], {
        //     deleteAll: true,
        //   });
        // });
        charImport = await removeDarkvision(charImport);
        charImport = await fixOldSlugs(charImport);
        //charImport = await checkForStaleData(charImport);
        // let p=charImport;

        let charJSON = JSON.stringify(charImport);
        if (hvDebug.enabled)
          console.log(
            "%cHeroVau.lt/Foundry Bridge | %cFinal json for import: " +
              charJSON,
            hvColor1,
            hvColor4
          );

        let promise = await doImport(targetActor, charJSON);

        var request = new XMLHttpRequest();
        if (charImport?.prototypeToken?.texture?.src !== undefined) {
          if (hvDebug.enabled)
            console.log(
              "%cHeroVau.lt/Foundry Bridge | %cFetching token image " +
                charImport.prototypeToken.texture.src,
              hvColor1,
              hvColor4
            );
          request.open("GET", charImport.prototypeToken.texture.src, true);
          request.onreadystatechange = function () {
            if (this.status === 404) {
              targetActor.update({
                "prototypeToken.texture.src": "icons/svg/mystery-man.svg",
              });
              if (hvDebug.enabled)
                console.log(
                  "%cHeroVau.lt/Foundry Bridge | %c404 fetching image " +
                    charImport.prototypeToken.texture.src,
                  hvColor1,
                  hvColor4
                );
            }
          };
          request.send();
        }

        var request2 = new XMLHttpRequest();
        if (hvDebug.enabled)
          console.log(
            "%cHeroVau.lt/Foundry Bridge | %cFetching image " + charImport.src,
            hvColor1,
            hvColor4
          );
        request2.open("GET", charImport.img, true);
        request2.onreadystatechange = function () {
          if (this.status === 404) {
            if (hvDebug.enabled)
              console.log(
                "%cHeroVau.lt/Foundry Bridge | %c404 fetching image " +
                  charImport.img,
                hvColor1,
                hvColor4
              );
            targetActor.update({ img: "icons/svg/mystery-man.svg" });
          }
        };
        request2.send();
      }

      // console.log("%cHeroVau.lt/Foundry Bridge | %creadyState: "+this.readyState,hvColor1,hvColor4)
    }
  };
  // console.log("%cHeroVau.lt/Foundry Bridge | %cDownloading PC from: " + charURL,hvColor1,hvColor4);
  xmlhttp.open("GET", charURL, true);
  xmlhttp.send();
}

async function doImport(obj, json) {
  return obj.importFromJSON(json);
}

async function removeDarkvision(charJSON) {
  if (charJSON?.flags?.exportSource?.system == "pf2e") {
    for (const property in charJSON.items) {
      if (charJSON.items[property]?.data?.slug == "darkvision")
        charJSON.items.splice(property, 1);
    }
  }
  return charJSON;
}

async function fixOldSlugs(charJSON) {
  charJSON = Object.assign({}, charJSON);
  if (charJSON?.flags?.exportSource?.system == "pf2e") {
    let newItems = [];
    for (const property in charJSON.items) {
      if (charJSON.items[property]?.flags?.core?.sourceId) {
        let itemSource =
          charJSON.items[property].flags.core.sourceId.split(".");
        // console.log(itemSource[0]+"."+itemSource[1]+"."+itemSource[2])
        if (itemSource[2] == "equipment-srd") {
          let pack = game.packs.get(itemSource[1] + "." + itemSource[2]);
          let itemData = Object.assign(
            {},
            await pack.getDocument(itemSource[3])
          );
          // if charJSON.items[property]?.data?.slug == "holy-water"
          // console.log(itemData)
          if (itemData) {
            // console.log("before and after:")
            // console.log(charJSON.items[property]);
            let oldItemData = Object.assign({}, charJSON.items[property]);
            if (oldItemData?.data?.slug && itemData?.system?.slug) {
              oldItemData.data.slug = itemData.system.slug;
              // console.log(oldItemData);
              charJSON.items.push(itemData);
              charJSON.items.splice(property, 1);
            }
          }
        }
      }
    }
  }
  return charJSON;
}

async function checkForStaleData(charJSON) {
  charJSON = Object.assign({}, charJSON);
  if (charJSON?.flags?.exportSource?.system == "pf2e") {
    let newItems = [];
    for (const property in charJSON.items) {
      //console.log(`${property}: ${charJSON.items[property]} | `+ charJSON.items[property].name);

      if (charJSON.items[property]?.flags?.core?.sourceId) {
        let itemSource =
          charJSON.items[property].flags.core.sourceId.split(".");
        console.log(itemSource[0] + "." + itemSource[1] + "." + itemSource[2]);

        if (
          itemSource[2] != "equipment-srd" &&
          itemSource[2] != "pathfinder-society-boons"
        ) {
          // let pack = game.packs.get(itemSource[1]+"."+itemSource[2]);
          // let itemData = Object.assign({},await pack.getDocument(itemSource[3]));
          // //console.log(itemData)
          // if (itemData?._stats) {
          //   itemData.id=charJSON.items[property].id
          //   itemData._stats.systemId="pf2e"
          //   itemData._stats.systemVersion=game.system.version
          //   itemData._stats.coreVersion=game.version
          //   itemData._stats.createdTime=Math.floor(Date.now() / 1000)
          //   itemData._stats.modifiedTime=Math.floor(Date.now() / 1000)
          //   itemData._stats.lastModifiedBy=game.userId
          // }
          // charJSON.items.push(itemData);
          // charJSON.items.splice(property,1);
          if (charJSON.items[property]?._stats) {
            charJSON.items[property]._stats.systemId = "pf2e";
            charJSON.items[property]._stats.systemVersion = game.system.version;
            charJSON.items[property]._stats.coreVersion = game.version;
            charJSON.items[property]._stats.createdTime = Math.floor(
              Date.now() / 1000
            );
            charJSON.items[property]._stats.modifiedTime = Math.floor(
              Date.now() / 1000
            );
            charJSON.items[property]._stats.lastModifiedBy = game.userId;
          }
        }
        // else if (itemSource[2] == "equipment-srd") {
        //   let pack = game.packs.get(itemSource[1]+"."+itemSource[2]);
        //   let itemData = Object.assign({},await pack.getDocument(itemSource[3]));
        //   //console.log(itemData)
        //   if (!charJSON.items[property]?.data?.baseItem || charJSON.items[property]?.data?.baseItem  == null) {
        //     console.log("baseItem missing or null! see this:")
        //     console.log(charJSON.items[property])
        //     let itemData = Object.assign({},charJSON.items[property]);
        //     itemData.data.baseItem="tootsieroll"
        //     if (itemData?._stats) {
        //       itemData.id=charJSON.items[property].id
        //       itemData._stats.systemId="pf2e"
        //       itemData._stats.systemVersion=game.system.version
        //       itemData._stats.coreVersion=game.version
        //       itemData._stats.createdTime=Math.floor(Date.now() / 1000)
        //       itemData._stats.modifiedTime=Math.floor(Date.now() / 1000)
        //       itemData._stats.lastModifiedBy=game.userId
        //     }
        //     charJSON.items.push(itemData);
        //     charJSON.items.splice(property,1);
        //   } else {
        //     console.log("has baseItem : " + charJSON.items[property].data.baseItem)
        //   }
        // }
      } else {
        console.log("No sourceId, skipping");
      }
    }
  }
  console.log("modified charJSON");
  console.log(charJSON);

  return charJSON;
}

var Cookie = {
  set: function (name, value, days) {
    var domain, domainParts, date, expires, host;
    if (days) {
      date = new Date();
      date.setTime(date.getTime() + days * 86400000);
      expires = "; expires=" + date.toGMTString();
    } else {
      expires = "";
    }
    host = location.host;
    // console.log("herovault set| host: "+host)
    if (host.split(".").length === 1) {
      // no "." in a domain - it's localhost or something similar
      document.cookie =
        name + "=" + value + expires + "; path=/; SameSite=Strict";
    } else {
      domainParts = host.split(".");
      domainParts.shift();
      domain = "." + domainParts.join(".");
      // console.log("domain: "+ name+"="+value+expires+"; path=/; domain="+domain+"; SameSite=Strict");
      // console.log( "host: "+name+"="+value+expires+"; path=/; domain="+host+"; SameSite=Strict");
      if (host.includes("forge-vtt.com")) {
        document.cookie =
          name +
          "=" +
          value +
          expires +
          "; path=/; domain=.forge-vtt.com; SameSite=Strict";
      } else {
        document.cookie =
          name +
          "=" +
          value +
          expires +
          "; path=/; domain=" +
          domain +
          "; SameSite=Strict";
        document.cookie =
          name +
          "=" +
          value +
          expires +
          "; path=/; domain=" +
          host +
          "; SameSite=Strict";
      }
      // check if cookie was successfuly set to the given domain
      // (otherwise it was a Top-Level Domain)
      if (Cookie.get(name) == null || Cookie.get(name) != value) {
        // append "." to current domain
        domain = "." + host;
        document.cookie =
          name +
          "=" +
          value +
          expires +
          "; path=/; domain=" +
          domain +
          "; SameSite=Strict";
      }
    }
  },
  get: function (name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(";");
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == " ") {
        c = c.substring(1, c.length);
      }

      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  },
  erase: function (name) {
    Cookie.set(name, "", -1);
  },
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
let HVversionCompare = function (left, right) {
  if (typeof left + typeof right != "stringstring") return false;

  var a = left.split("."),
    b = right.split("."),
    i = 0,
    len = Math.max(a.length, b.length);

  for (; i < len; i++) {
    if (
      (a[i] && !b[i] && parseInt(a[i]) > 0) ||
      parseInt(a[i]) > parseInt(b[i])
    ) {
      return 1;
    } else if (
      (b[i] && !a[i] && parseInt(b[i]) > 0) ||
      parseInt(a[i]) < parseInt(b[i])
    ) {
      return -1;
    }
  }

  return 0;
};

function getHash(encodedHeroJSON) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      let responseJSON = JSON.parse(this.responseText);
      if (hvDebug.enabled)
        console.log(
          "%cHeroVau.lt/Foundry Bridge | %c" + JSON.stringify(responseJSON),
          hvColor1,
          hvColor4
        );
      let newHash = responseJSON.newHash;
      return newHash;
    }
  };
  xmlhttp.open("POST", heroVaultURL + "/foundrymodule.php", true);
  xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  xmlhttp.send("action=genHash&encodedChar=" + encodedHeroJSON +
                "&hvVer=" + 
                encodeURIComponent(hvVer));
}

export function exportToHVFromPBHLO(heroJSON, tAct) {
  let error = false;
  let action = "importNewPCFromPBHLO";
  var xmlhttp = new XMLHttpRequest();
  const gameSystem = game.system.id;

  let pcEncodedJSON = encodeURIComponent(heroJSON);
  let newHash = getHash(pcEncodedJSON);
  // console.log(pcEncodedJSON);
  xmlhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      let responseJSON = JSON.parse(this.responseText);
      if (responseJSON.error == false) {
        ui.notifications.info("Successfully exported to HeroVau.lt.");
        tAct.update({
          "flags.herovault.uid": responseJSON.charhash,
        });
        return responseJSON.charhash;
      } else {
        ui.notifications.warn(
          "Unable to export to HeroVau.lt. Please try manually. [" +
            responseJSON.error +
            "]"
        );
      }
    }
  };
  // console.log("%cHeroVau.lt/Foundry Bridge | %chttps://herovau.lt/foundrymodule.php?action=importNewPC&userToken="+userToken+"&encodedChar="+pcEncodedJSON,hvColor1,hvColor4);
  // console.log(pcEncodedJSON);
  xmlhttp.open("POST", heroVaultURL + "/foundrymodule.php", true);
  xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  xmlhttp.send(
    "action=" +
      action +
      "&userToken=" +
      hvUserToken +
      "&encodedChar=" +
      pcEncodedJSON +
      "&gamesystem=" +
      gameSystem +
      "&charUID=" +
      newHash +
      "&hvVer=" + 
      encodeURIComponent(hvVer)
  );
}

export function supportCheck() {
  // console.log("SupportCheck: "+hvUserToken)
  if (hvUserToken) {
    return true;
  }
}

async function getSHA(message) {
  // encode as UTF-8
  const msgBuffer = new TextEncoder().encode(message);                    
  // hash the message
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  // convert ArrayBuffer to Array
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // convert bytes to hex string                  
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

Hooks.on("init", () => {
  game.modules.get("herovaultfoundry").api = {
    exportToHVFromPBHLO: exportToHVFromPBHLO,
    supportCheck: supportCheck,
  };
  Hooks.callAll(
    "herovaultfoundryReady",
    game.modules.get("herovaultfoundry").api
  );
});
