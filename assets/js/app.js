import * as config from "./configurations/config.js?v=20250503";
import { Suite } from "./models/Suite.js?v=20250503";
import { SuiteRenderer } from "./services/SuiteRenderer.js?v=20250503";
import { ThreeDRenderer } from "./services/ThreeDRenderer.js?v=20250503";
import { LanguageService } from "./services/LanguageService.js?v=20250503";
import { OutcomeService } from "./services/OutcomeService.js?v=20250503";
import { NavigationController } from "./controllers/NavigationController.js?v=20250503";
import { SuiteController } from "./controllers/SuiteController.js?v=20250503";
import { LanguageController } from "./controllers/LanguageController.js?v=20250503";
import { $, all } from "./utilities/domUtils.js?v=20250503";
import { MouseTracker } from "./utilities/mouseTracker.js?v=20250503";

window.addEventListener("load", () => {
	const canvas = $("#suiteCanvas");
	const ctx = canvas.getContext("2d");
	
	// Start tracking the mouse as soon as app loads
	MouseTracker.init(canvas);
	
	// Create an empty suite
	const suite = new Suite(false, true);
	
	// Create a suite renderer
	const suiteRenderer = new SuiteRenderer(ctx, suite, 1, 1);
	
	// Create a 3D renderer
	const threeDRenderer = new ThreeDRenderer(suite, 1, 1);
	
	// Create a language service
	const languageService = new LanguageService();
	
	// Create an outcome service
	const outcomeService = new OutcomeService();
	
	// Create a navigation controller
	const navigationController = new NavigationController(suite, suiteRenderer, threeDRenderer, languageService, outcomeService);
	
	// Create a language controller (page_loader is removed in LanguageService.loadLanguage())
	const languageController = new LanguageController(languageService, outcomeService, suite, suiteRenderer, navigationController, "en");
	
	// Create a suite controller
	const suiteController = new SuiteController(canvas, suite, suiteRenderer, threeDRenderer, navigationController, languageService, outcomeService);
});