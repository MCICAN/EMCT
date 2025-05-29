import * as config from "../configurations/config.js?v=20250503";
import { $, all } from "../utilities/domUtils.js?v=20250503";
//const domUtils = await import(`../utilities/domUtils.js?v=${config.VERSION}`);
//const { $, all } = domUtils;

export class LanguageService {
	constructor() {
		// An array of:
		// {key: key, en: English translation, fr: French translation}
		this.translations = [];
		this.currentLanguage = "en";
	}
	
	async loadLanguage(is_render_language = true, is_fire_compartment = false){
		await fetch('ajax.php?type=loadLanguage', {
	        method: 'GET',
	        headers: {
	            'Content-Type': 'application/json',
	        }
	    })
	    .then(response => {
	        if (!response.ok) {
	            throw new Error('Network response was not ok ' + response.statusText);
	        }
	       return response.text();
	    })
	    .then(text => {
			let data;
			try {
			    data = JSON.parse(text);
			} catch (e) {
			    console.error("JSON parse error:", e);
			    throw e;
			}
			
			const dataArray = data.data;
			dataArray.forEach((item) => {
				this.translations.push(item);
			});
			
			if(is_render_language){
				this.renderLanguage(is_fire_compartment);
			}
			
			// Remove page loader
			$("#page_loader").classList.add("hidden");
	    })
	    .catch(error => {    	
	        console.error('There was a problem with the fetch operation:', error);
	        
	        // Remove page loader
	    	$("#page_loader").classList.add("hidden");
	    });
	}
	
	setCurrentLanguage(language){
		this.currentLanguage = language;
	}
	
	// Show language on the page based on this.currentLanguage
	renderLanguage(is_fire_compartment = false){
		const languages = all("[data-language]");
		languages.forEach((language) => {
			const key = language.dataset.language.trim();
			const original = language.dataset.languageOriginal;
			let loaded_language_value = this.t(key);
			loaded_language_value = this.replaceSuiteFireCompartmentStrings(loaded_language_value, is_fire_compartment);

			// Preserve inner HTML for special cases (like step_1__next_button with icon)
			if (key === 'step_1__next_button') {
				// Only replace the text node, keep the <img> if present
				const img = language.querySelector('img');
				let text = (loaded_language_value !== "") ? loaded_language_value : original;
				language.innerHTML = text;
				if (img) {
					language.appendChild(img);
				}
			} else {
				language.innerHTML = (loaded_language_value !== "") ? loaded_language_value : original;
			}
		});
		
		// Load alt
		const images = all("img[data-language-alt]");
		images.forEach((image) => {
			const key = image.dataset.languageAlt.trim();
			let loaded_language_value = this.t(key);
			loaded_language_value = this.replaceSuiteFireCompartmentStrings(loaded_language_value, is_fire_compartment);
			image.setAttribute('alt', loaded_language_value);
		});
	}
	
	// Get the language text based on this.currentLanguage
	t(key){
		for(let i = 0; i < this.translations.length; i++){
			if(this.translations[i].key == key){
				if(this.currentLanguage == 'en'){
					return this.translations[i].en;
				}
				return this.translations[i].fr;
			}
		}
		return "";
	}
	
	// Change [Suite|Fire compartment] etc strings
	replaceSuiteFireCompartmentStrings(string, is_fire_compartment){
		// This regex looks for:
		//   "[" then capture (not '|') until optional spaces, then "|", then optional spaces,
		//   then capture until the closing "]".
		return string.replace(/\[([^|]+)\s*\|\s*([^|\]]+)\]/g, (_, part1, part2) => {
			return is_fire_compartment ? part2 : part1;
		});
	}
}