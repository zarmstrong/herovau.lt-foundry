## 0.6.4 (Jul 20, 2021)

* added helpful alert message when an export to herovau.lt fails

## 0.6.3 (Jul 7, 2021)

* Fixed a bug with saving certain settings
* Fixed a bug that could occur when importing over an existing character.

## 0.6.2 (Jul 2, 2021)

* fix cookie/usertoken issues
* fix bug where non-existant characters would think they are existant characters and prompt for overwrite.
* fixed charuid not being added to actor in some cases

## 0.6.1 (Jul 2, 2021)

* change HV user token to store via client settings instead of cookie/world

## 0.6.0 (Jun 30, 2021)

* pf2e: you can now attempt to import PCs via PFS #.  Currently, it only searches for HeroVau.lt PCs that have PFS information saved on their character.

## 0.5.0 (Jun 30, 2021)

* rewrote the connectors between hlo importer & pathbuilder to herovault to use native api calls instead of janky crap
* fixed bug related to saving hlo token

## 0.4.2 (Jun 30, 2021)

* hotfix for missing parenthesis part deux

## 0.4.1 (Jun 30, 2021)

* hotfix for missing parenthesis

## 0.4.0 (Jun 30, 2021)

* work-around for multiple imports appearing on forge-vtt
* attempting to make a cookie for forge-vtt so that you can set it and forget it with your usertoken across forge-vtt servers
* exporting a PC from Foundry now attempts to export locally hosted images (runs async on the herovau.lt server)
* fixed a bug (I think) where user token could break due to cookies 

## 0.3.3 (Jun 29, 2021)

* fix bug where exports that don't have exportsources would fail to import

## 0.3.2 (Jun 29, 2021)

* fix pathbuilder import to pull minified

## 0.3.1 (Jun 29, 2021)

* fixed release

## 0.3.0 (Jun 28, 2021)

* integration with HeroLab Importer and Pathbuilder Importer
* fixed HeroVau.lt showing up on non-character sheets (for real this time) 
* page no longer refreshes when settings are changed
* moved most settings from being stored in cookies, except for herovault token, as we don't want to store it on the foundry server for security purposes. 
* upped compatible version to 0.8.8

## 0.2.1 (Jun 23, 2021)

* fixed HeroVau.lt showing up on non-character sheets

## 0.2.0 (Jun 22, 2021)

* you can now export to HeroVau.lt 

## 0.1.10 (Jun 18, 2021)

* fix issue that prevented module from working in 0.8.x
* made an option to not show the token confirmation window. (automatically reappears if an invalid token is provided, or after 30 days, whichever comes first).

## 0.1.8 (Jun 17, 2021)

* fix a few bugs (sight and light angle)
* built in version checker to warn on possible incompatabilities, and prevent importing PCs from newer versions of game systems.

## 0.1.7 (Jun 17, 2021)

* (trying again) fixed a bug in the version updating script that broke the cookie function

## 0.1.6 (Jun 17, 2021)

* fixed a bug in the version updating script that broke the cookie function

## 0.1.5 (Jun 17, 2021)

* fixed the module.json to point to minified js

## 0.1.4 (Jun 16, 2021)

* fixing for release

## 0.1.3 (Jun 16, 2021)

* fixing for release

## 0.1.2 (Jun 16, 2021)

* minified

## 0.1.0 (Jun 10, 2021)

* disabled debug
* removed hardcoded usertoken
* added saving usertoken via cookie, to prevent user needing to enter it every time on the same server

## 0.1.0 (Jun 10, 2021)

* Initial Release