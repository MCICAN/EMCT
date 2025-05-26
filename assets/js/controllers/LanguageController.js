import * as config from "../configurations/config.js?v=20250503";
import { $, all } from "../utilities/domUtils.js?v=20250503";
//const domUtils = await import(`../utilities/domUtils.js?v=${config.VERSION}`);
//const { $, all } = domUtils;

export class LanguageController {
	constructor(languageService, outcomeService, suite, suiteRenderer, navigationController, currentLanguage = "en"){
		this.languageService = languageService;
		this.outcomeService = outcomeService;
		this.suite = suite;
		this.suiteRenderer = suiteRenderer;
		this.navigationController = navigationController;
		
		if(currentLanguage == "en" || currentLanguage == "fr"){
			this.languageService.currentLanguage = currentLanguage;
		}
		
		this.initEvents();
		
		// Load language from excel
		// true for calling renderLanguage after loading language
		this.languageService.loadLanguage(true, this.suite.isFireCompartment);
	}
	
	initEvents(){
		const self = this;
		const opener = $("#openLanguageSelection");
		const selection = $("#languageSelectionPanel");
		
		// Opening the language selector
		opener.addEventListener("click", function(){
			if(selection.classList.contains("shown")){
				selection.classList.remove("shown");
			}else{
				selection.classList.add("shown");
			}
		});
		
		// Selecting the language
		$("#language_english").addEventListener("click", function(){
			self.updateLanguage("en");
			$("#language_english_label").classList.add("shown");
			$("#language_french_label").classList.remove("shown");
			selection.classList.remove("shown");
		});
		
		$("#language_french").addEventListener("click", function(){
			self.updateLanguage("fr");
			$("#language_french_label").classList.add("shown");
			$("#language_english_label").classList.remove("shown");
			selection.classList.remove("shown");
		});
	}
	
	async updateLanguage(newLanguage){
		this.languageService.currentLanguage = newLanguage;
		await this.languageService.renderLanguage(this.suite.isFireCompartment);
		
		// Update outcome if in step 5
		if(this.navigationController.currentStep == 5){
			this.outcomeService.generateOutcome(this.suite, this.suiteRenderer, this.languageService.currentLanguage);
		}
	}
}